<script>
  import {
    Alert,
    AlertDialog,
    Button,
    ConfirmationDialog,
    Divider,
    Icon,
    Menu,
    MenuButton,
    MenuItem,
    MenuItemCheckbox,
    Spacer,
    SplitButton,
    Toast,
    Toolbar,
  } from '@sveltia/ui';
  import { truncate } from '@sveltia/utils/string';
  import equal from 'fast-deep-equal';
  import { _ } from 'svelte-i18n';
  import {LocalStorage} from '@sveltia/utils/storage';
  import NewsletterContent from '../../newsletters/details/preview/NewsletterContent.svelte';
  import { goBack, goto } from '$lib/services/app/navigation';
  import { backendName } from '$lib/services/backends';
  import { siteConfig } from '$lib/services/config';
  import { deleteEntries } from '$lib/services/contents/data';
  import {
    copyFromLocaleToast,
    entryDraft,
    entryEditorSettings,
    revertChanges,
    saveEntry,
  } from '$lib/services/contents/editor';
  import { getAssociatedAssets } from '$lib/services/contents/entry';
  import { defaultI18nConfig, getLocaleLabel } from '$lib/services/contents/i18n';
  import { formatSummary } from '$lib/services/contents/view';
  import {selectedCollection} from '$lib/services/contents/index.js';

  let showDuplicateToast = false;
  let showValidationToast = false;
  let showDeleteDialog = false;
  let showErrorDialog = false;
  let showSendNewsletterDialog = false;
  let showSendNewsletterErrorDialog = false;
  let updateNewsletterSentStateErrorDialog = false;
  let saving = false;
  /** @type {MenuButton} */
  let menuButton;

  $: ({
    isNew,
    collection,
    collectionFile,
    originalEntry,
    originalLocales,
    currentLocales,
    originalValues,
    currentValues,
    validities,
  } = $entryDraft ?? /** @type {EntryDraft} */ ({}));

  $: ({
    editor: { preview: showPreviewPane = true } = {},
    backend: { automatic_deployments: autoDeployEnabled = undefined } = {},
  } = $siteConfig ?? /** @type {SiteConfig} */ ({}));
  $: showSaveOptions = $backendName !== 'local' && typeof autoDeployEnabled === 'boolean';
  $: ({ defaultLocale } = (collectionFile ?? collection)?._i18n ?? defaultI18nConfig);
  $: collectionLabel = collection?.label || collection?.name;
  $: collectionLabelSingular = collection?.label_singular || collectionLabel;
  $: canPreview = (collectionFile ?? collection)?.editor?.preview ?? showPreviewPane;
  $: modified =
    isNew || !equal(originalLocales, currentLocales) || !equal(originalValues, currentValues);
  $: errorCount = Object.values(validities)
    .map((validity) => Object.values(validity).map(({ valid }) => !valid))
    .flat(1)
    .filter(Boolean).length;
  $: associatedAssets =
    !!originalEntry && !!collection._assetFolder?.entryRelative
      ? getAssociatedAssets(originalEntry, { relative: true })
      : [];

  /**
   * Duplicate the current entry.
   */
  const duplicateDraft = async () => {
    showDuplicateToast = true;
    goto(`/collections/${collection?.name}/new`, { replaceState: true, notifyChange: false });
    $entryDraft = {
      .../** @type {EntryDraft} */ ($entryDraft ?? {}),
      isNew: true,
      originalEntry: undefined,
    };
  };

  /**
   * Save the entry draft.
   * @param {object} [options] - Options.
   * @param {boolean} [options.skipCI] - Whether to disable automatic deployments for the change.
   */
  const save = async ({ skipCI = undefined } = {}) => {
    try {
      saving = true;
      await saveEntry({ skipCI });
      goBack(`/collections/${collection?.name}`);
    } catch (/** @type {any} */ ex) {
      if (ex.message === 'validation_failed') {
        showValidationToast = true;
      } else {
        showErrorDialog = true;
        // eslint-disable-next-line no-console
        console.error(ex);
      }
    } finally {
      saving = false;
    }
  };
</script>

<Toolbar variant="primary" aria-label={$_('primary')}>
  <Button
    variant="ghost"
    iconic
    aria-label={$_('cancel_editing')}
    on:click={() => {
      goBack(`/collections/${collection?.name}`);
    }}
  >
    <Icon slot="start-icon" name="arrow_back_ios_new" />
  </Button>
  <h2 role="none">
    {#if isNew}
      {$_('creating_x', { values: { name: collectionLabelSingular } })}
    {:else}
      {$_('editing_x_in_x', {
        values: {
          collection: collectionLabel,
          // eslint-disable-next-line no-nested-ternary
          entry: collectionFile
            ? collectionFile.label || collectionFile.name
            : originalEntry
              ? truncate(
                  formatSummary(collection, originalEntry, defaultLocale, { useTemplate: false }),
                  40,
                )
              : '',
        },
      })}
    {/if}
  </h2>
  <Spacer flex />
  {#if !collectionFile && !isNew}
    <Button
      variant="ghost"
      label={$_('duplicate')}
      aria-label={$_('duplicate_entry')}
      disabled={collection?.create === false}
      on:click={() => {
        duplicateDraft();
      }}
    />
    <Button
      variant="ghost"
      label={$_('delete')}
      aria-label={$_('delete_entry')}
      disabled={collection?.delete === false}
      on:click={() => {
        showDeleteDialog = true;
      }}
    />
  {/if}
  <MenuButton
    variant="ghost"
    iconic
    popupPosition="bottom-right"
    aria-label={$_('show_editor_options')}
    bind:this={menuButton}
  >
    <Icon slot="start-icon" name="more_vert" />
    <Menu slot="popup" aria-label={$_('editor_options')}>
      <MenuItemCheckbox
        label={$_('show_preview')}
        checked={$entryEditorSettings.showPreview}
        disabled={!canPreview}
        on:change={() => {
          entryEditorSettings.update((view) => ({
            ...view,
            showPreview: !view.showPreview,
          }));
        }}
      />
      <MenuItemCheckbox
        label={$_('sync_scrolling')}
        checked={$entryEditorSettings.syncScrolling}
        disabled={!canPreview && Object.keys(currentValues).length === 1}
        on:change={() => {
          entryEditorSettings.update((view) => ({
            ...view,
            syncScrolling: !view.syncScrolling,
          }));
        }}
      />
      <Divider />
      <MenuItem
        label={$_('revert_all_changes')}
        disabled={!modified}
        on:click={() => {
          revertChanges();
        }}
      />
    </Menu>
  </MenuButton>
  {#if showSaveOptions}
    <SplitButton
      variant="primary"
      label={$_(saving ? 'saving' : 'save')}
      disabled={!modified || saving}
      keyShortcuts="Accel+S"
      on:click={() => save()}
    >
      <Menu slot="popup">
        <!-- Show the opposite option: if automatic deployments are enabled, allow to disable it -->
        <MenuItem
          label={$_(autoDeployEnabled ? 'save_without_publishing' : 'save_and_publish')}
          on:click={() => save({ skipCI: autoDeployEnabled })}
        />
      </Menu>
    </SplitButton>
  {:else}
    <Button
      variant="primary"
      label={$_(saving ? 'saving' : 'save')}
      disabled={!modified || saving}
      keyShortcuts="Accel+S"
      on:click={() => save()}
    />
  {/if}
  {#if ($selectedCollection?.name === 'newsletter')}
        <!--        <pre>{JSON.stringify(currentValues)}</pre>-->
        <Button
                variant="primary"
                disabled={!!currentValues[defaultLocale].sent}
                label={$_('newsletter.send')}
                on:click={async () => {
                  showSendNewsletterDialog = true;
            }}
        >
            <Icon slot="start-icon" name="send"/>
        </Button>
    {/if}
</Toolbar>

<Toast bind:show={showDuplicateToast}>
  <Alert status="success">
    {$_('entry_duplicated')}
  </Alert>
</Toast>

<Toast bind:show={showValidationToast}>
  <Alert status="error">
    {$_(errorCount === 1 ? 'entry_validation_error' : 'entry_validation_errors', {
      values: { count: errorCount },
    })}
  </Alert>
</Toast>

<Toast id={$copyFromLocaleToast.id} bind:show={$copyFromLocaleToast.show}>
  {@const { status, message, count, sourceLocale } = $copyFromLocaleToast}
  <Alert {status}>
    {$_(`editor.${message}`, {
      values: { count, source: sourceLocale ? getLocaleLabel(sourceLocale) : '' },
    })}
  </Alert>
</Toast>

<ConfirmationDialog
  bind:open={showDeleteDialog}
  title={$_('delete_entry')}
  okLabel={$_('delete')}
  on:ok={async () => {
    if (originalEntry) {
      await deleteEntries(
        [originalEntry.id],
        associatedAssets.map(({ path }) => path),
      );
    }

    goBack(`/collections/${collection?.name}`);
  }}
  on:close={() => {
    menuButton.focus();
  }}
>
  {$_(
    associatedAssets.length
      ? 'confirm_deleting_this_entry_with_assets'
      : 'confirm_deleting_this_entry',
  )}
</ConfirmationDialog>

<!-- @todo make the error message more informative -->
<AlertDialog
  bind:open={showErrorDialog}
  title={$_('saving_entry.error.title')}
  on:close={() => {
    menuButton.focus();
  }}
>
  {$_('saving_entry.error.description')}
</AlertDialog>

<ConfirmationDialog
        bind:open={showSendNewsletterDialog}
        title={$_('newsletter.send')}
        okLabel={$_('newsletter.send')}
        on:ok={async () => {
          const newsletter = currentValues[defaultLocale];

          /* eslint-disable */
          const elem = document.createElement('div');
          new NewsletterContent({ target: elem, props: { newsletter, generateBlobSrc: false } });
          const html = elem.innerHTML;
          /* eslint-enable */

          const userCache =
            (await LocalStorage.get('sveltia-cms.user')) ||
            (await LocalStorage.get('decap-cms-user')) ||
            (await LocalStorage.get('netlify-cms-user'));

          const response = await fetch('https://api.singtonic.net/newsletter', {
            method: 'POST',
            body: JSON.stringify({
              content: {
                slug: originalEntry.slug,
                subject: currentValues[defaultLocale].title,
                html,
                text: newsletter.text,
              }
            }),
            headers: {
              'Authorization': `Bearer ${userCache.token}`,
              'Content-type': 'application/json; charset=UTF-8'
            }
          });

          if (!response.ok) {
            showSendNewsletterErrorDialog = true;
            return;
          }

          if(!$entryDraft) {
            updateNewsletterSentStateErrorDialog = true;
            return;
          }

          $entryDraft.currentValues[defaultLocale].sent = true;
          await save();
  }}
        on:close={() => {
    menuButton.focus();
  }}
>
  {$_('newsletter.confirm')}
</ConfirmationDialog>

<AlertDialog
        bind:open={showSendNewsletterErrorDialog}
        title={$_('newsletter.error.send_failed.title')}
        on:close={() => {
    menuButton.focus();
  }}
>
  {$_('newsletter.error.send_failed.description')}
</AlertDialog>

<AlertDialog
        bind:open={updateNewsletterSentStateErrorDialog}
        title={$_('newsletter.error.update_failed.title')}
        on:close={() => {
    menuButton.focus();
  }}
>
  {@html $_('newsletter.error.update_failed.description')}
</AlertDialog>
