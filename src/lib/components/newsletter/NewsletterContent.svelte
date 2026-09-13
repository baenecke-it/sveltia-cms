<script lang="ts">
  import { marked } from 'marked';

  const { newsletter } = $props();
</script>

{#if newsletter && newsletter.content}
  {#each newsletter.content as value, i (i)}
    {#if value.type === 'image'}
      <img alt="" class="" src={value.image} width="100%" />
      <br />
      <br />
    {:else if value.type === 'text'}
      {@html marked.parse(value.text ?? '')}
    {/if}
  {/each}
{/if}
