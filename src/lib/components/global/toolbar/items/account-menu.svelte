<script>
  import { Divider, Menu, MenuItem } from '@sveltia/ui';
  import {LocalStorage} from '@sveltia/utils/storage';
  import { _ } from 'svelte-i18n';
  import ReleaseNotesMenuItem from '$lib/components/help/release-notes-menu-item.svelte';
  import ShortcutsMenuItem from '$lib/components/help/shortcuts-menu-item.svelte';
  import SettingsDialog from '$lib/components/settings/settings-dialog.svelte';
  import { goto, openProductionSite } from '$lib/services/app/navigation';
  import { canShowMobileSignInDialog, showMobileSignInDialog } from '$lib/services/app/onboarding';
  import { backend, backendName } from '$lib/services/backends';
  import { siteConfig } from '$lib/services/config';
  import { user } from '$lib/services/user';
  import { signOut } from '$lib/services/user/auth';
  import { isSmallScreen } from '$lib/services/user/env';
  import { prefs } from '$lib/services/user/prefs';

  /**
   * @typedef {object} Props
   * @property {import('@sveltia/ui').MenuButton} [menuButton] Menu button.
   */

  /** @type {Props} */
  let {
    /* eslint-disable prefer-const */
    menuButton,
    /* eslint-enable prefer-const */
  } = $props();

  let showPrefsDialog = $state(false);

  const isLocalRepo = $derived($backendName === 'local');
  const isTestRepo = $derived($backendName === 'test-repo');

  /** @type {{url: string, label: string}[]} */
  const additionalLinks = $derived($siteConfig?.links ?? []);
</script>

<Menu aria-label={$_('account')}>
  <MenuItem
    label={isLocalRepo
      ? $_('working_with_local_repo')
      : isTestRepo
        ? $_('working_with_test_repo')
        : $_('signed_in_as_x', { values: { name: $user?.login } })}
    disabled={isLocalRepo || isTestRepo}
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
      onclick={async () => {
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
        goto('/config', { transitionType: 'forwards' });
      }}
    />
  {/if}
  <Divider />
  <MenuItem
    label={$_('settings')}
    onclick={() => {
      if ($isSmallScreen) {
        goto('/settings', { transitionType: 'forwards' });
      } else {
        showPrefsDialog = true;
      }
    }}
  />
  <!-- @todo Remove the following 2 items when the Help menu is enabled -->
  <ShortcutsMenuItem {menuButton} />
  {#if $prefs.devModeEnabled}
    <ReleaseNotesMenuItem />
  {/if}
  {#if $canShowMobileSignInDialog}
    <MenuItem
      label={$_('sign_in_with_mobile')}
      onclick={() => {
        $showMobileSignInDialog = true;
      }}
    />
  {/if}
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

<SettingsDialog
  bind:open={showPrefsDialog}
  onClose={() => {
    menuButton?.focus();
  }}
/>
