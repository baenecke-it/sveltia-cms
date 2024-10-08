<script>
  import { Divider, Icon, Menu, MenuButton, MenuItem } from '@sveltia/ui';
  import { _ } from 'svelte-i18n';
  import { get } from 'svelte/store';
  import {LocalStorage} from '@sveltia/utils/storage';
  import PublishMenuItem from '$lib/components/global/toolbar/items/publish-menu-item.svelte';
  import ShortcutsDialog from '$lib/components/keyboard-shortcuts/shortcuts-dialog.svelte';
  import PrefsDialog from '$lib/components/prefs/prefs-dialog.svelte';
  import { version } from '$lib/services/app';
  import { goto, openProductionSite } from '$lib/services/app/navigation';
  import { backend, backendName } from '$lib/services/backends';
  import { prefs } from '$lib/services/prefs';
  import { user } from '$lib/services/user';
  import { siteConfig } from '$lib/services/config';

  /** @type {MenuButton} */
  let menuButton;
  let showPrefsDialog = false;
  let showShortcutsDialog = false;

  $: hasAvatar = !!$user?.avatarURL;
  $: isLocal = $backendName === 'local';

  /** @type {{url: string, label: string}[]} */
  const additionalLinks = get(siteConfig)?.links ?? [];
</script>

<div role="none" class="wrapper">
  <MenuButton
    variant="ghost"
    iconic
    class={hasAvatar ? 'avatar' : ''}
    popupPosition="bottom-right"
    aria-label={$_('show_account_menu')}
    bind:this={menuButton}
  >
    <svelte:component
      this={hasAvatar ? undefined : Icon}
      slot="start-icon"
      name={'account_circle'}
    />
    <svelte:element
      this={hasAvatar ? 'img' : undefined}
      class="avatar"
      loading="lazy"
      src={$user?.avatarURL}
    />
    <Menu slot="popup" aria-label={$_('account')}>
      <MenuItem
        label={isLocal
          ? $_('working_with_local_repo')
          : $_('signed_in_as_x', { values: { name: $user?.login } })}
        disabled={isLocal}
        on:click={() => {
          window.open($user?.profileURL, '_blank');
        }}
      />
      <Divider />
      <MenuItem
        label={$_('live_site')}
        on:click={() => {
          openProductionSite();
        }}
      />
      {#each additionalLinks as additionalLink}
        <MenuItem
          label={additionalLink.label}
          on:click={async () => {
            const userCache =
            (await LocalStorage.get('sveltia-cms.user')) ||
            (await LocalStorage.get('decap-cms-user')) ||
            (await LocalStorage.get('netlify-cms-user'));

            fetch(additionalLink.url, {
              headers: {
                Authorization: `Bearer ${userCache?.token}`,
              },
            }) // FETCH BLOB FROM IT
              .then((response) => response.blob())
              .then((blob) => { // RETRIEVE THE BLOB AND CREATE LOCAL URL
                const _url = window.URL.createObjectURL(blob);

                window.open(_url, '_blank')?.focus(); // window.open + focus
            }).catch((err) => {
              console.log(err);
            });
          }}
        />
      {/each}
      <MenuItem
        label={$_('git_repository')}
        disabled={isLocal}
        on:click={() => {
          window.open($backend?.repository?.branchURL);
        }}
      />
      <PublishMenuItem />
      <Divider />
      <MenuItem
        label={$_('settings')}
        on:click={() => {
          showPrefsDialog = true;
        }}
      />
      {#if $prefs.devModeEnabled}
        <MenuItem
          label={$_('site_config')}
          on:click={() => {
            goto('/config');
          }}
        />
      {/if}
      <Divider />
      <!-- Assume the user has a physical keyboard if the pointer is mouse (on desktop) -->
      {#if window.matchMedia('(pointer: fine)').matches}
        <MenuItem
          label={$_('help.keyboard_shortcuts')}
          on:click={() => {
            showShortcutsDialog = true;
          }}
        />
      {/if}
      <MenuItem
        label={$_('help.documentation')}
        on:click={() => {
          window.open('https://github.com/sveltia/sveltia-cms/blob/main/README.md', '_blank');
        }}
      />
      <MenuItem
        label={$prefs.devModeEnabled
          ? $_('help.release_notes_version_x', { values: { version } })
          : $_('help.release_notes')}
        on:click={() => {
          window.open('https://github.com/sveltia/sveltia-cms/releases', '_blank');
        }}
      />
      <Divider />
      <MenuItem
        label={$_('help.issue')}
        on:click={() => {
          window.open('https://github.com/sveltia/sveltia-cms/issues', '_blank');
        }}
      />
      <MenuItem
        label={$_('help.feedback')}
        on:click={() => {
          window.open('https://github.com/sveltia/sveltia-cms/discussions', '_blank');
        }}
      />
      <Divider />
      <MenuItem
        label={$_('sign_out')}
        on:click={async () => {
          // Wait a bit before the menu is closed
          window.requestAnimationFrame(() => {
            $user = null;
            $backend?.signOut();
          });
        }}
      />
    </Menu>
  </MenuButton>
</div>

<PrefsDialog bind:open={showPrefsDialog} on:close={() => menuButton.focus()} />
<ShortcutsDialog bind:open={showShortcutsDialog} on:close={() => menuButton.focus()} />

<style lang="scss">
  .wrapper {
    display: contents;

    :global(button.avatar) {
      border-width: 0;
      background-color: transparent;
    }
  }

  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 32px;
    object-fit: cover;
  }
</style>
