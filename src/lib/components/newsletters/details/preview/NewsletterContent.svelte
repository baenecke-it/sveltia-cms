<script>
  import { marked } from 'marked';
  import { unflatten } from 'flat';
  import { getMediaFieldURL } from '$lib/services/assets/index.js';
  import { entryDraft } from '$lib/services/contents/draft';

  /**
   * @type {Record<string, any>}
   */
  export let newsletter;
  $: newsletter = unflatten(newsletter);

  /**
   * @type {boolean}
   */
  export let generateBlobSrc = true;

  const renderer = new marked.Renderer();
  renderer.link = function(href, title, text) {
    const link = marked.Renderer.prototype.link.call(this, href, title, text);

    return link.replace('<a',"<a style='color:#cc2944;text-decoration:none;text-transform:none'");
  };

  marked.setOptions({
    renderer
  });
</script>

{#if newsletter && newsletter.content}
  {#each newsletter.content as value}
    {#if value.type === 'image'}
      {#if generateBlobSrc}
        {#await getMediaFieldURL(value.image, $entryDraft?.originalEntry)}
          <p>Loading...</p>
        {:then src}
          <img alt="" class="" src="{src ?? ''}" width="100%" />
        {:catch error}
          <p>{error.message}</p>
        {/await}
      {:else}
        <img alt="" class="" src="https://singtonic.net{value.image}" width="100%" />
      {/if}
      <br />
      <br />
    {:else if value.type === 'text'}
      {@html marked.parse(value.text ?? '')}
    {/if}
  {/each}
{/if}
