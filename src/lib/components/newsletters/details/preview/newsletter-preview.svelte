<script>
    import { entryDraft } from '$lib/services/contents/draft';

    import NewsletterTemplate from './NewsletterTemplate.svelte';
    import NewsletterContent from './NewsletterContent.svelte';

    /**
     * @import { InternalLocaleCode } from '$lib/types/private';
     */

    /**
     * @typedef {object} Props
     * @property {InternalLocaleCode} locale Current pane’s locale.
     */

    /** @type {Props} */
    let {
      /* eslint-disable prefer-const */
      locale,
      /* eslint-enable prefer-const */
    } = $props();

    let currentValues;
    /**
     * @type {Entry|undefined}
     */
    let originalEntry;
    /**
     * @type {Record<string, any>}
     */
    let newsletterValues;
    if ($entryDraft) {
        ({currentValues, originalEntry} = $entryDraft);
        newsletterValues = currentValues[locale] ?? [];
    }
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
