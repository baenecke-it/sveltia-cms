import { marked } from 'marked';

import { sanitizeRichTextHTML } from '$lib/services/contents/fields/rich-text/sanitize';

/**
 * Render the newsletter content blocks to HTML before reading the mounted DOM.
 * @param {Record<string, any>} newsletter Newsletter entry values.
 * @returns {string} Rendered HTML.
 */
export const renderNewsletterContent = (newsletter) => {
  const elem = document.createElement('div');

  const content = (
    Array.isArray(newsletter.content) ? newsletter.content : Object.values(newsletter.content ?? {})
  ).filter((value) => value && typeof value === 'object');

  content.forEach((value) => {
    if (value.type === 'image') {
      const image = document.createElement('img');

      image.alt = '';
      image.className = '';
      image.src = value.image ?? '';
      image.setAttribute('width', '100%');

      elem.append(image);
      elem.append(document.createElement('br'), document.createElement('br'));
    } else if (value.type === 'text') {
      const text = document.createElement('div');

      text.innerHTML = sanitizeRichTextHTML(
        String(marked.parse(typeof value.text === 'string' ? value.text : '')),
        { ADD_TAGS: [] },
      );
      elem.append(...text.childNodes);
    }
  });

  return elem.innerHTML;
};

/**
 * Get a plain-text fallback from newsletter values.
 * @param {Record<string, any>} newsletter Newsletter entry values.
 * @returns {string} Plain-text newsletter content.
 */
export const getNewsletterText = (newsletter) => {
  if (typeof newsletter.text === 'string' && newsletter.text) {
    return newsletter.text;
  }

  const content = (
    Array.isArray(newsletter.content) ? newsletter.content : Object.values(newsletter.content ?? {})
  ).filter((value) => value && typeof value === 'object');

  return content
    .filter((value) => value.type === 'text')
    .map((value) => (typeof value.text === 'string' ? value.text : ''))
    .filter(Boolean)
    .join('\n\n');
};
