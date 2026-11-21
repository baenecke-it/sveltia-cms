// @vitest-environment happy-dom

import { describe, expect, test } from 'vitest';

import { getNewsletterText, renderNewsletterContent } from './newsletter';

describe('newsletter', () => {
  test('renders text content blocks to HTML', () => {
    const html = renderNewsletterContent({
      content: [null, { type: 'text', text: '**Hello**' }],
    });

    expect(html).toContain('<strong>Hello</strong>');
  });

  test('renders content stored as an object', () => {
    const html = renderNewsletterContent({
      content: {
        0: { type: 'text', text: 'Hello' },
        1: { type: 'image', image: 'photo.jpg' },
      },
    });

    expect(html).toContain('<p>Hello</p>');
    expect(html).toContain('<img');
    expect(html).toContain('width="100%"');
  });

  test('sanitizes unsafe HTML in text content', () => {
    const html = renderNewsletterContent({
      content: [{ type: 'text', text: '<img src=x onerror=alert(1)><script>alert(1)</script>' }],
    });

    expect(html).not.toContain('onerror');
    expect(html).not.toContain('<script');
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

  test('falls back to text content stored as an object', () => {
    expect(
      getNewsletterText({
        content: {
          0: { type: 'text', text: 'First paragraph' },
          1: { type: 'text', text: 'Second paragraph' },
        },
      }),
    ).toBe('First paragraph\n\nSecond paragraph');
  });
});
