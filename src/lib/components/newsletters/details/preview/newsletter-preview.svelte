<script>
    import {entryDraft} from '$lib/services/contents/editor';

    import NewsletterTemplate from './NewsletterTemplate.svelte';
    import NewsletterContent from './NewsletterContent.svelte';

    /**
     * @type {LocaleCode}
     */
    export let locale;

    let currentValues;
    /**
     * @type {Record<string, any>}
     */
    let originalEntry;
    /**
     * @type {Record<string, any>}
     */
    let newsletterValues;
    $: if  ($entryDraft) {
        ({currentValues, originalEntry} = $entryDraft);
        newsletterValues = currentValues[locale] ?? [];
    }
</script>

<style>
    :global(th, td) {
        border: none;
    }
</style>

<NewsletterTemplate slug={originalEntry.slug}>
    <NewsletterContent newsletter={newsletterValues}></NewsletterContent>
</NewsletterTemplate>
