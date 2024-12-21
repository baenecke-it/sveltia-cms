<script>
  import { Divider, Icon, Menu, MenuButton, MenuItem } from '@sveltia/ui';
  import { _ } from 'svelte-i18n';
  import { get } from 'svelte/store';
  import {LocalStorage} from '@sveltia/utils/storage';
  import PrefsDialog from '$lib/components/prefs/prefs-dialog.svelte';
  import { goto, openProductionSite } from '$lib/services/app/navigation';
  import { backend, backendName } from '$lib/services/backends';
  import { prefs } from '$lib/services/prefs';
  import { signOut, user } from '$lib/services/user';
  import { siteConfig } from '$lib/services/config';

  /** @type {MenuButton | undefined} */
  let menuButton = $state();
  let showPrefsDialog = $state(false);

  const hasAvatar = $derived(!!$user?.avatarURL);
  const isLocal = $derived($backendName === 'local');

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
    {#snippet endIcon()}
      {#if hasAvatar}
        <img class="avatar" loading="lazy" src={$user?.avatarURL} alt="" />
      {:else}
        <Icon name={'account_circle'} />
      {/if}
    {/snippet}
    {#snippet popup()}
      <Menu aria-label={$_('account')}>
        <MenuItem
          label={isLocal
            ? $_('working_with_local_repo')
            : $_('signed_in_as_x', { values: { name: $user?.login } })}
          disabled={isLocal}
          onclick={() => {
            window.open($user?.profileURL, '_blank');
          }}
        />
        <Divider />
        <MenuItem
          label={$_('live_site')}
          onclick={() => {
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
        {#if $prefs.devModeEnabled}
          <MenuItem
            label={$_('git_repository')}
            disabled={!$backend?.repository?.treeBaseURL}
            onclick={() => {
              window.open($backend?.repository?.treeBaseURL);
            }}
          />
          <MenuItem
            label={$_('site_config')}
            onclick={() => {
              goto('/config');
            }}
          />
        {/if}
        <Divider />
        <MenuItem
          label={$_('settings')}
          onclick={() => {
            showPrefsDialog = true;
          }}
        />
        <Divider />
        <MenuItem
          label={$_('sign_out')}
          onclick={async () => {
            // Wait a bit before the menu is closed
            window.requestAnimationFrame(() => {
              signOut();
            });
          }}
        />
      </Menu>
    {/snippet}
  </MenuButton>
</div>

<PrefsDialog
  bind:open={showPrefsDialog}
  onClose={() => {
    menuButton?.focus();
  }}
/>

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
