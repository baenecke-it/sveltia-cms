<script>
  import { _ } from 'svelte-i18n';
  import FieldPreview from '$lib/components/contents/details/preview/field-preview.svelte';
  import NewsletterPreview from '$lib/components/newsletters/details/preview/newsletter-preview.svelte';
  import { entryDraft } from '$lib/services/contents/editor';

  /**
   * @type {LocaleCode}
   */
  export let locale;

  $: ({ collection, collectionFile } = $entryDraft ?? /** @type {EntryDraft} */ ({}));

  $: fields = collectionFile?.fields ?? collection?.fields ?? [];
</script>

{#if collection.name === 'newsletter'}
  <NewsletterPreview {locale}/>
{:else}
<div role="document" aria-label={$_('content_preview')}>
  {#each fields as fieldConfig (fieldConfig.name)}
    <FieldPreview keyPath={fieldConfig.name} {locale} {fieldConfig} />
  {/each}
</div>
{/if}

<style lang="scss">
  div {
    padding: 8px 16px;
  }
</style>
