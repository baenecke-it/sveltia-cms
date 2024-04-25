import { getDateTimeParts } from '@sveltia/utils/datetime';
import { LocalStorage } from '@sveltia/utils/storage';
import { stripSlashes } from '@sveltia/utils/string';
import equal from 'fast-deep-equal';
import { flatten } from 'flat';
import { _, locale as appLocale } from 'svelte-i18n';
import { derived, get, writable } from 'svelte/store';
import { prefs } from '$lib/services/prefs';
import { applyTemplateFilter } from '$lib/services/contents/slug';
import {
  getFieldConfig,
  getFieldDisplayValue,
  getPropertyValue,
} from '$lib/services/contents/entry';
import { editorLeftPane, editorRightPane } from '$lib/services/contents/editor';
import {
  allEntries,
  getEntriesByCollection,
  selectedCollection,
  selectedEntries,
} from '$lib/services/contents';

const storageKey = 'sveltia-cms.contents-view';
/**
 * @see https://decapcms.org/docs/configuration-options/#sortable_fields
 */
const defaultSortableFields = ['title', 'name', 'date', 'author', 'description'];

/**
 * View settings for the selected folder collection.
 * @type {import('svelte/store').Writable<EntryListView>}
 */
export const currentView = writable({ type: 'list' });

/**
 * Parse the collection summary template to generate the summary to be displayed on the entry list.
 * @param {Collection} collection - Entry’s collection.
 * @param {Entry} entry - Entry.
 * @param {LocaleCode} locale - Locale.
 * @param {object} [options] - Options.
 * @param {boolean} [options.useTemplate] - Whether to use the collection’s template if available.
 * @returns {string} Formatted summary.
 * @see https://decapcms.org/docs/configuration-options/#summary
 */
export const formatSummary = (collection, entry, locale, { useTemplate = true } = {}) => {
  const { content } = /** @type {{ content: EntryContent }} */ (entry.locales[locale]);

  const {
    name: collectionName,
    folder: collectionFolder,
    identifier_field: identifierField,
    summary: summaryTemplate,
    _i18n: { defaultLocale },
  } = collection;

  // Fields other than `title` should be defined with `identifier_field` as per the Netlify/Decap
  // CMS document, but actually `name` also works as a fallback. We also use the label` property and
  // the entry slug.
  if (!useTemplate || !summaryTemplate) {
    return (
      content[identifierField ?? ''] || content.title || content.name || content.label || entry.slug
    );
  }

  const { locales, slug, commitDate, commitAuthor } = entry;
  const { path: entryPath = '' } = locales[locale];
  const valueMap = flatten(content);

  /**
   * Replacer subroutine.
   * @param {string} tag - Field name or one of special tags.
   * @returns {any} Summary.
   */
  const replaceSub = (tag) => {
    if (tag === 'slug') {
      return slug;
    }

    if (tag === 'dirname') {
      return stripSlashes(entryPath.replace(/[^/]+$/, '').replace(collectionFolder ?? '', ''));
    }

    if (tag === 'filename') {
      return /** @type {string} */ (entryPath.split('/').pop()).split('.').shift();
    }

    if (tag === 'extension') {
      return /** @type {string} */ (entryPath.split('/').pop()).split('.').pop();
    }

    if (tag === 'commit_date') {
      return commitDate ?? '';
    }

    if (tag === 'commit_author') {
      return commitAuthor?.name || commitAuthor?.login || commitAuthor?.email;
    }

    return getFieldDisplayValue({
      collectionName,
      valueMap,
      keyPath: tag.replace(/^fields\./, ''),
      locale: defaultLocale,
    });
  };

  /**
   * Replacer.
   * @param {string} placeholder - Field name or one of special tags. May contain transformations.
   * @returns {string} Replaced string.
   */
  const replace = (placeholder) => {
    const [tag, ...transformations] = placeholder.split(/\s*\|\s*/);
    let slugPart = replaceSub(tag);

    if (slugPart === undefined) {
      return '';
    }

    if (slugPart instanceof Date && !transformations.length) {
      const { year, month, day } = getDateTimeParts({ date: slugPart });

      return `${year}-${month}-${day}`;
    }

    if (transformations.length) {
      const fieldConfig = getFieldConfig({ collectionName, valueMap, keyPath: tag });

      transformations.forEach((tf) => {
        slugPart = applyTemplateFilter(slugPart, tf, fieldConfig);
      });
    }

    return String(slugPart);
  };

  return summaryTemplate
    .replace(/{{(.+?)}}/g, (_match, placeholder) => replace(placeholder))
    .trim();
};

/**
 * Sort the given entries.
 * @param {Entry[]} entries - Entry list.
 * @param {SortingConditions} conditions - Sorting conditions.
 * @returns {Entry[]} Sorted entry list.
 * @see https://decapcms.org/docs/configuration-options/#sortable_fields
 */
const sortEntries = (entries, { key, order }) => {
  if (key === undefined || order === undefined) {
    return entries;
  }

  const _entries = [...entries];
  const { defaultLocale } = /** @type {Collection} */ (get(selectedCollection))._i18n;

  const type =
    { slug: String, commit_author: String, commit_date: Date }[key] ||
    (_entries.length ? getPropertyValue(_entries[0], defaultLocale, key)?.constructor : String) ||
    String;

  const valueMap = Object.fromEntries(
    _entries.map((entry) => [entry.slug, getPropertyValue(entry, defaultLocale, key)]),
  );

  _entries.sort((a, b) => {
    const aValue = valueMap[a.slug];
    const bValue = valueMap[b.slug];

    if (aValue === undefined || bValue === undefined) {
      return 0;
    }

    if (type === String) {
      return aValue.localeCompare(bValue);
    }

    if (type === Date) {
      return Number(aValue) - Number(bValue);
    }

    return aValue - bValue;
  });

  if (order === 'descending') {
    _entries.reverse();
  }

  return _entries;
};

/**
 * Filter the given entries.
 * @param {Entry[]} entries - Entry list.
 * @param {FilteringConditions[]} filters - One or more filtering conditions.
 * @returns {Entry[]} Filtered entry list.
 * @see https://decapcms.org/docs/configuration-options/#view_filters
 */
const filterEntries = (entries, filters) => {
  const {
    view_filters: configuredFilters = [],
    _i18n: { defaultLocale },
  } = /** @type {Collection} */ (get(selectedCollection));

  // Ignore invalid filters
  const validFilters = filters.filter(
    ({ field, pattern }) =>
      field !== undefined &&
      pattern !== undefined &&
      configuredFilters.some((f) => f.field === field && f.pattern === pattern),
  );

  return entries.filter((entry) =>
    validFilters.every(({ field, pattern }) => {
      // Check both the raw value and referenced value
      const rawValue = getPropertyValue(entry, defaultLocale, field, { resolveRef: false });
      const refValue = getPropertyValue(entry, defaultLocale, field);
      const regex = typeof pattern === 'string' ? new RegExp(pattern) : undefined;

      if (rawValue === undefined || refValue === undefined) {
        return false;
      }

      if (regex) {
        return regex.test(String(rawValue)) || regex.test(String(refValue));
      }

      return rawValue === pattern || refValue === pattern;
    }),
  );
};

/**
 * Group the given entries.
 * @param {Entry[]} entries - Entry list.
 * @param {GroupingConditions} [conditions] - Grouping conditions.
 * @returns {{ name: string, entries: Entry[] }[]} Grouped entries, where each group object contains
 * a name and an entry list. When ungrouped, there will still be one group object named `*`.
 * @see https://decapcms.org/docs/configuration-options/#view_groups
 */
const groupEntries = (entries, { field, pattern } = { field: '', pattern: undefined }) => {
  if (!field) {
    return entries.length ? [{ name: '*', entries }] : [];
  }

  const sortCondition = get(currentView).sort;
  const { defaultLocale } = /** @type {Collection} */ (get(selectedCollection))._i18n;
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : undefined;
  /** @type {{ [key: string]: Entry[] }} */
  const groups = {};
  const otherKey = get(_)('other');

  entries.forEach((entry) => {
    const value = getPropertyValue(entry, defaultLocale, field);

    if (value === undefined) {
      return;
    }

    const key = regex ? (String(value).match(regex) ?? [])[0] ?? otherKey : String(value);

    if (!(key in groups)) {
      groups[key] = [];
    }

    groups[key].push(entry);
  });

  // Sort groups by key
  const sortedGroups = Object.entries(groups)
    .map(([name, _entries]) => ({ name, entries: _entries }))
    .sort(({ name: aKey }, { name: bKey }) => aKey.localeCompare(bKey));

  // Keep the descending order if already sorted, especially on the date field
  if (sortCondition?.key === field && sortCondition?.order === 'descending') {
    sortedGroups.reverse();
  }

  return sortedGroups;
};

/**
 * View settings for all the folder collections.
 * @type {import('svelte/store').Writable<{ [key: string]: EntryListView }>}
 */
const entryListSettings = writable({}, (set) => {
  (async () => {
    try {
      /** @type {{ [key: string]: EntryListView }} */
      const cache = (await LocalStorage.get(storageKey)) ?? {};
      let foundLegacySetting = false;

      const settings = Object.fromEntries(
        Object.entries(cache).map(([key, view]) => {
          // Migrate legacy single filter setting
          if (view.filter) {
            foundLegacySetting = true;
            view.filters ??= [];
            view.filters.push(view.filter);
            delete view.filter;
          }

          return [key, view];
        }),
      );

      set(settings);

      if (foundLegacySetting) {
        await LocalStorage.set(storageKey, settings);
      }
    } catch {
      //
    }
  })();
});

/**
 * Get a field’s label by key.
 * @param {Collection} collection - Collection.
 * @param {string} key - Field name, which can be dot notation like `name.en` for a nested field,
 * or one of other entry metadata property keys: `slug`, `commit_author` and `commit_date` .
 * @returns {string} Label. For a nested field, it would be something like `Name – English`.
 */
const getSortFieldLabel = (collection, key) => {
  if (['name', 'commit_author', 'commit_date'].includes(key)) {
    return get(_)(`sort_keys.${key}`);
  }

  if (key.includes('.')) {
    return key
      .split('.')
      .map((_key, index, arr) => {
        if (_key.match(/^\d+$/)) {
          return undefined;
        }

        const keyPath = arr.slice(0, index + 1).join('.');

        return getFieldConfig({ collectionName: collection.name, keyPath })?.label || _key;
      })
      .filter(Boolean)
      .join(' – ');
  }

  return collection.fields?.find(({ name }) => name === key)?.label || key;
};

/**
 * List of sort fields for the selected folder collection.
 * @type {import('svelte/store').Readable<{ key: string, label: string }[]>}
 */
export const sortFields = derived(
  [selectedCollection, allEntries, appLocale],
  ([_collection, _allEntries], set) => {
    const {
      name: collectionName = '',
      files,
      sortable_fields: customSortableFields,
    } = _collection ?? {};

    // Disable sorting for file collections
    if (files) {
      set([]);

      return;
    }

    const { commitAuthor, commitDate } = _allEntries?.[0] ?? {};

    const _sortFields = (
      Array.isArray(customSortableFields) ? customSortableFields : defaultSortableFields
    ).filter((keyPath) => !!getFieldConfig({ collectionName, keyPath }));

    if (commitAuthor && !_sortFields.includes('author')) {
      _sortFields.push('commit_author');
    }

    if (commitDate && !_sortFields.includes('date')) {
      _sortFields.push('commit_date');
    }

    set(
      _sortFields.map((key) => ({
        key,
        label: _collection ? getSortFieldLabel(_collection, key) : '',
      })),
    );
  },
);

/**
 * List of all the entries for the selected folder collection.
 * @type {import('svelte/store').Readable<Entry[]>}
 */
export const listedEntries = derived(
  [allEntries, selectedCollection],
  ([_allEntries, _collection], set) => {
    if (_allEntries && _collection) {
      set(getEntriesByCollection(_collection.name));
    } else {
      set([]);
    }
  },
);

/**
 * Sorted, filtered and grouped entries for the selected folder collection.
 * @type {import('svelte/store').Readable<{ name: string, entries: Entry[] }[]>}
 */
export const entryGroups = derived(
  [listedEntries, currentView],
  ([_listedEntries, _currentView], set) => {
    /**
     * @type {Entry[]}
     */
    let entries = [..._listedEntries];

    // Reset the groups if the current collection is empty or a file collection
    if (!entries.length || !!entries[0].fileName) {
      set([]);
    } else {
      if (_currentView?.sort) {
        entries = sortEntries(entries, _currentView.sort);
      }

      if (_currentView?.filters) {
        entries = filterEntries(entries, _currentView.filters);
      }

      set(groupEntries(entries, _currentView?.group));
    }
  },
);

listedEntries.subscribe((entries) => {
  selectedEntries.set([]);

  if (get(prefs).devModeEnabled) {
    // eslint-disable-next-line no-console
    console.info('listedEntries', entries);
  }
});

selectedCollection.subscribe((collection) => {
  if (!collection) {
    return;
  }

  if (get(prefs).devModeEnabled) {
    // eslint-disable-next-line no-console
    console.info('selectedCollection', collection);
  }

  const { name: collectionName, identifier_field: customIdField, fields = [] } = collection;

  // Reset the editor panes
  editorLeftPane.set(null);
  editorRightPane.set(null);

  // This only works for folder/entry collections
  if (!fields.length) {
    return;
  }

  /**
   * @type {EntryListView}
   */
  const defaultView = {
    type: 'list',
    sort: {
      // Every folder collection should have at least the `title` (or `name`) field, or the
      // `identifier_field` property.
      // @see https://decapcms.org/docs/configuration-options/#identifier_field
      key: customIdField || fields.find((f) => defaultSortableFields.includes(f.name))?.name,
      order: 'ascending',
    },
  };

  const view = get(entryListSettings)[collectionName] ?? defaultView;

  if (!equal(view, get(currentView))) {
    currentView.set(view);
  }
});

currentView.subscribe((view) => {
  const { name } = get(selectedCollection) ?? {};
  const savedView = get(entryListSettings)[name ?? ''] ?? {};

  if (name && !equal(view, savedView)) {
    entryListSettings.update((settings) => ({ ...settings, [name]: view }));
  }
});

entryListSettings.subscribe((settings) => {
  if (!settings || !Object.keys(settings).length) {
    return;
  }

  (async () => {
    try {
      if (!equal(settings, await LocalStorage.get(storageKey))) {
        await LocalStorage.set(storageKey, settings);
      }
    } catch {
      //
    }
  })();
});
