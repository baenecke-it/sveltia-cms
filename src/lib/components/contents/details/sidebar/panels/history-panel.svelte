<script>
  import { _, locale as appLocale } from '@sveltia/i18n';
  import { Button, highlightCodeToHTML, loadCodeHighlighter } from '@sveltia/ui';
  import { onMount } from 'svelte';

  import PanelContainer from '$lib/components/contents/details/sidebar/panels/panel-container.svelte';
  import { backend } from '$lib/services/backends';
  import { fetchAPI } from '$lib/services/backends/git/shared/api.js';
  import { getEntryDraftContext } from '$lib/services/contents/draft/state.svelte';
  import { fetchEntryHistory } from '$lib/services/contents/entry/history';
  import { formatDate } from '$lib/services/utils/date';

  /**
   * @import { FileCommit } from '$lib/types/private';
   */

  const entryDraft = getEntryDraftContext();

  /** @type {FileCommit[]} */
  let commits = $state([]);
  let loading = $state(false);
  let error = $state(false);
  const diff = $state([]);

  /**
   * Load the commit history for the current entry, using the external cache.
   */
  const load = async () => {
    const entry = entryDraft.current?.originalEntry;

    if (!entry) {
      return;
    }

    loading = true;
    ({ commits, error } = await fetchEntryHistory(entry));
    loading = false;
  };

  onMount(async () => {
    await load();
    await loadCodeHighlighter('diff');
  });

  /**
   * Get the diff between two commits.
   * @param {number} commitI Commit Index of a selected commit.
   * @param commitSha
   * @returns {Promise<void>}
   */
  const getDiff = async (commitSha) => {
      const entry = entryDraft.current?.originalEntry;

      let newFile = await fetchAPI(`/repos/baenecke-it/singtonic/commits/${commitSha}`, {
          headers: {
            'Accept': 'application/vnd.github.diff',
          },
          responseType: 'raw',
        },
      ).then(response => response.text());


      const fileName = entry.locales._default.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const seperator = new RegExp(`\\+\\+\\+ b/${fileName}\n`, 'g');

      [, newFile] = newFile.split(seperator);
      [newFile, ] = newFile.split('diff --git');
      diff[commitSha] = newFile;

    }
  ;
</script>

<PanelContainer title={_('entry_sidebar.history.title')}>
  {#if loading}
    <div class="empty">{_('loading')}</div>
  {:else if error}
    <div class="empty">{_('entry_sidebar.history.fetch_failed')}</div>
  {:else if commits.length > 0}
    <div role="list" class="commits">
      {#each commits as commit (commit.sha)}
        {@const commitURL = backend.current?.repository?.commitBaseURL
          ? `${backend.current.repository.commitBaseURL}/${commit.sha}`
          : undefined}
        {@const fileDiff = diff[commit.sha]}
        <Button
          class="ref"
          variant="ghost"
          role="link"
          disabled={!commitURL}
          onclick={async () => await getDiff(commit.sha)}
        >
          {#if commit.authorAvatarURL}
            <img
              class="avatar"
              src={commit.authorAvatarURL}
              alt=""
              width="24"
              height="24"
              loading="lazy"
            />
          {:else}
            <span class="avatar placeholder" aria-hidden="true"></span>
          {/if}
          <span class="details">
            <span class="author"><bdi>{commit.authorName}</bdi></span>
            <span class="date">{formatDate(commit.date, appLocale.current)}</span>
            <span class="message"><bdi>{commit.message}</bdi></span>
          </span>
        </Button>
        {#key fileDiff}
          {#if fileDiff}
            {@html highlightCodeToHTML(fileDiff, 'diff')}
          {/if}
        {/key}
      {/each}
    </div>
  {:else}
    <div class="empty">{_('entry_sidebar.history.no_history')}</div>
  {/if}
</PanelContainer>

<style>
  .commits {
    padding: 4px;
  }

  .avatar {
    flex: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: var(--sui-secondary-background-color);
  }

  .details {
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow: hidden;
    font-size: var(--sui-font-size-small);
  }

  .author {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .date {
    color: var(--sui-tertiary-foreground-color);
  }

  .message {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :global(pre.shiki) {
    background-color: var(--sui-code-background-color) !important;
    overflow: scroll;
  }
</style>
