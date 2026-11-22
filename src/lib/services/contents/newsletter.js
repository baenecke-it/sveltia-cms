import { mount, unmount } from 'svelte';

import NewsletterContent from '$lib/components/newsletter/NewsletterContent.svelte';

/**
 * Render the newsletter content blocks to HTML before reading the mounted DOM.
 * @param {Record<string, any>} newsletter Newsletter entry values.
 * @returns {string} Rendered HTML.
 */
export const renderNewsletterContent = (newsletter) => {
  const elem = document.createElement('div');

  /** @type {ReturnType<typeof mount> | undefined} */
  const component = mount(NewsletterContent, {
    target: elem,
    props: { newsletter, generateBlobSrc: false },
  });

  const html = elem.innerHTML;

  if (component) {
    unmount(component);
  }

  return html;
};

/**
 * Get a plain-text fallback from newsletter values.
 * @param {Record<string, any>} newsletter Newsletter entry values.
 * @returns {string} Plain-text newsletter content.
 */
export const getNewsletterText = (newsletter) => {
  if (newsletter.text) {
    return newsletter.text;
  }

  if (!Array.isArray(newsletter.content)) {
    return '';
  }

  return newsletter.content
    .filter((value) => value.type === 'text')
    .map((value) => value.text ?? '')
    .filter(Boolean)
    .join('\n\n');
};
