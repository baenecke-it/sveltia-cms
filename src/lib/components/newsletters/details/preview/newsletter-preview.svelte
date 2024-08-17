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
    let originalValues;
    /**
     * @type {Record<string, any>}
     */
    let newsletterValues;
    $: if  ($entryDraft) {
        ({currentValues, originalValues} = $entryDraft);
        newsletterValues = currentValues[locale] ?? [];
    }
</script>

<style>
    :global(th, td) {
        border: none;
    }
</style>

<NewsletterTemplate slug={originalValues.slug}>
    <NewsletterContent newsletter={newsletterValues}></NewsletterContent>
</NewsletterTemplate>
