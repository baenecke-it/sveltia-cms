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
                    <img alt="" class="" src="{src ?? ''}" width="100%"/>
                {:catch error}
                    <p>{error.message}</p>
                {/await}
            {:else}
                <img alt="" class="" src="https://singtonic.net{value.image}" width="100%"/>
            {/if}
            <br/>
            <br/>
        {:else if value.type === 'text'}
            {@html marked.parse(value.text ?? '')}
        {/if}
    {/each}
{/if}
