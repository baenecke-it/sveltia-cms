<script>
  import { unflatten } from 'flat';
  import { marked } from 'marked';
  import { getMediaFieldURL } from '$lib/services/assets/index.js';
  import { entryDraft } from '$lib/services/contents/draft';

  let {
    /* eslint-disable prefer-const */
    newsletter,
    generateBlobSrc = true,
  } = $props();
  newsletter = unflatten(newsletter);

  const renderer = {
    /**
     * Run the default Renderer for links and then replace the anchor-tag adding styles.
     * @param {import('marked').Tokens.Link} tokens Tokens describing the link.
     * @returns {string} Returns the new anchor-tag-string.
     */
    link(tokens) {
      const link = marked.Renderer.prototype.link.call(this, tokens);

      return link.replace('<a', '<a style=\'color:#cc2944;text-decoration:none;text-transform:none\'');
    }
  };

  marked.use({ renderer });

  const entry = $derived($entryDraft?.originalEntry);
  const collectionName = $derived($entryDraft?.collectionName ?? 'newsletter')
</script>

{#if newsletter && newsletter.content}
  {#each newsletter.content as value}
    {#if value.type === 'image'}
      {#if generateBlobSrc}
        {#await getMediaFieldURL({
          value: value.image,
          entry,
          collectionName
        })}
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
