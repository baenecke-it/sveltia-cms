<script>
    import {marked} from 'marked';
    import {unflatten} from 'flat';
    import {getMediaFieldURL} from '$lib/services/assets/index.js';
    import {entryDraft} from '$lib/services/contents/editor.js';

    /**
     * @type {Record<string, any>}
     */
	export let newsletter;
    $: newsletter = unflatten(newsletter);

    /**
     * @type {boolean}
     */
    export let generateBlobSrc = true;
</script>

{#if newsletter && newsletter.content}
    {#each newsletter.content as value}
        {#if value.type === 'image'}
            {#if generateBlobSrc}
                {#await getMediaFieldURL(value.image, $entryDraft?.originalEntry)}
                    <p>Loading...</p>
                {:then src}
                    <img alt="" class="" height="451" src="{src ?? ''}" width="451"/>
                {:catch error}
                    <p>{error.message}</p>
                {/await}
            {:else}
                <img alt="" class="" height="451" src="https://singtonic.net/{value.image}" width="451"/>
            {/if}
            <br/>
            <br/>
        {:else if value.type === 'text'}
            {@html marked.parse(value.text ?? '')}
        {/if}
    {/each}
{/if}
