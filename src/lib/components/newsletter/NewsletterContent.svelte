<script lang="ts">
  import { marked } from 'marked';

  const { newsletter } = $props();

  marked.use({
    renderer: {
      /**
       * Override the default link rendering to add custom styles.
       * @param {import('marked').Tokens.Link} token The link token.
       * @returns {string} The HTML string for the link with custom styles.
       */
      link(token) {
        const link = marked.Renderer.prototype.link.call(this, token);

        return link.replace(
          '<a',
          "<a style='color:#cc2944;text-decoration:none;text-transform:none'",
        );
      },
    },
  });
</script>

{#if newsletter && newsletter.content}
  {#each newsletter.content as value, i (i)}
    {#if value.type === 'image'}
      <img alt="" class="" src="https://singtonic.net{value.image}" width="100%" />
      <br />
      <br />
    {:else if value.type === 'text'}
      {@html marked.parse(value.text ?? '')}
    {/if}
  {/each}
{/if}
