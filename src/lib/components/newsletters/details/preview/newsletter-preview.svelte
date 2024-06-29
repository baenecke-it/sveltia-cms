<script>
    import {entryDraft} from '$lib/services/contents/editor';

    import NewsletterTemplate from "./NewsletterTemplate.svelte";
    import NewsletterContent from "./NewsletterContent.svelte";

    /**
     * @type {LocaleCode}
     */
    export let locale;

    $: ({currentValues} = $entryDraft);
    $: newsletterValues = currentValues[locale];

    const code = '';
    const email = '';
</script>

<NewsletterTemplate {code} {email}>
    <NewsletterContent newsletter={newsletterValues}></NewsletterContent>
</NewsletterTemplate>