<script>
  import { entryDraft } from '$lib/services/contents/draft';

  import NewsletterContent from './NewsletterContent.svelte';
  import NewsletterTemplate from './NewsletterTemplate.svelte';

  /**
   * @type {LocaleCode}
   */
  const { locale } = $props();

  let currentValues;
  /**
   * @type {Entry|undefined}
   */
  let originalEntry;
  /**
   * @type {Record<string, any>}
   */
  const newsletterValues = $derived.by(() => {
    if ($entryDraft) {
      ({ currentValues, originalEntry } = $entryDraft);
      return currentValues[locale] ?? [];
    }

    return [];
  });
</script>

<style>
    :global(th, td) {
        border: none;
        padding: 0;
    }
</style>

<NewsletterTemplate slug={originalEntry?.slug}>
  <NewsletterContent newsletter={newsletterValues}></NewsletterContent>
</NewsletterTemplate>
