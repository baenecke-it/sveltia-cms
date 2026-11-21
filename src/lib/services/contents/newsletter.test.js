// @vitest-environment happy-dom

import { describe, expect, test } from 'vitest';

import { getNewsletterText, renderNewsletterContent } from './newsletter';

describe('newsletter', () => {
  test('renders text content blocks to HTML', () => {
    const html = renderNewsletterContent({
      content: [{ type: 'text', text: '**Hello**' }],
    });

    expect(html).toContain('<strong>Hello</strong>');
  });

  test('uses the configured text value', () => {
    expect(
      getNewsletterText({
        text: 'Configured text',
        content: [{ type: 'text', text: 'Block text' }],
      }),
    ).toBe('Configured text');
  });

  test('falls back to text content blocks', () => {
    expect(
      getNewsletterText({
        content: [
          { type: 'text', text: 'First paragraph' },
          { type: 'image', image: 'photo.jpg' },
          { type: 'text', text: 'Second paragraph' },
        ],
      }),
    ).toBe('First paragraph\n\nSecond paragraph');
  });

  test('returns an empty text fallback for missing content', () => {
    expect(getNewsletterText({})).toBe('');
  });
});
