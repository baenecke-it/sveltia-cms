import { mount, unmount } from 'svelte';

import NewsletterContent from '$lib/components/newsletter/NewsletterContent.svelte';
import { getAssetByPath } from '$lib/services/assets';
import { getAssetPublicURL } from '$lib/services/assets/info';
import { cmsConfig } from '$lib/services/config/state';

/**
 * @import { Entry, InternalLocaleCode } from '$lib/types/private';
 */

/**
 * Resolve an image value to an absolute, publicly reachable URL for newsletter emails.
 * @param {string} value Image value.
 * @param {object} [options] Resolution options.
 * @param {Entry} [options.entry] Associated entry.
 * @param {string} [options.collectionName] Collection name.
 * @param {InternalLocaleCode} [options.locale] Entry locale.
 * @returns {string} Resolved image URL.
 */
export const resolveNewsletterImageSrc = (
  value,
  { entry = undefined, collectionName = '', locale = undefined } = {},
) => {
  if (!value || /^https?:\/\//i.test(value) || /^data:/i.test(value) || /^blob:/i.test(value)) {
    return value;
  }

  const baseURL = cmsConfig.current?._baseURL ?? '';
  const asset = getAssetByPath({ value, entry, collectionName, locale });

  const publicPath = asset
    ? getAssetPublicURL(asset, {
        pathOnly: true,
        allowSpecial: true,
        entry,
        locale,
      })
    : value;

  if (!publicPath) {
    return value;
  }

  if (/^https?:\/\//i.test(publicPath)) {
    return publicPath;
  }

  if (baseURL) {
    return new URL(publicPath, `${baseURL}/`).toString();
  }

  return publicPath;
};

/**
 * Render the newsletter content blocks to HTML before reading the mounted DOM.
 * @param {Record<string, any>} newsletter Newsletter entry values.
 * @param {object} [options] Resolution options.
 * @param {Entry} [options.entry] Associated entry.
 * @param {string} [options.collectionName] Collection name.
 * @param {InternalLocaleCode} [options.locale] Entry locale.
 * @returns {string} Rendered HTML.
 */
export const renderNewsletterContent = (newsletter, options = {}) => {
  const elem = document.createElement('div');

  /** @type {ReturnType<typeof mount> | undefined} */
  const component = mount(NewsletterContent, {
    target: elem,
    props: {
      newsletter,
      resolveImageSrc: (value) => resolveNewsletterImageSrc(value, options),
    },
  });

  const html = elem.innerHTML;

  if (component) {
    unmount(component);
  }

  return html;
};

/**
 * Get a plain-text fallback from newsletter values.
 * @param {Record<string, any>} newsletter Newsletter entry values.
 * @returns {string} Plain-text newsletter content.
 */
export const getNewsletterText = (newsletter) => {
  if (newsletter.text) {
    return newsletter.text;
  }

  if (!Array.isArray(newsletter.content)) {
    return '';
  }

  return newsletter.content
    .filter((value) => value.type === 'text')
    .map((value) => value.text ?? '')
    .filter(Boolean)
    .join('\n\n');
};
