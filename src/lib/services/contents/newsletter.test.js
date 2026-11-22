// @vitest-environment happy-dom

import { describe, expect, test } from 'vitest';

import { cmsConfig } from '$lib/services/config/state';

import {
  getNewsletterText,
  renderNewsletterContent,
  resolveNewsletterImageSrc,
} from './newsletter';

describe('newsletter', () => {
  test('renders text content blocks to HTML', () => {
    const html = renderNewsletterContent({
      content: [{ type: 'text', text: '**Hello**' }],
    });

    expect(html).toContain('<strong>Hello</strong>');
  });

  test('renders image blocks with absolute public URLs', () => {
    cmsConfig.current = /** @type {any} */ ({ _baseURL: 'https://example.com' });

    const html = renderNewsletterContent({
      content: [{ type: 'image', image: '/uploads/photo.jpg' }],
    });

    expect(html).toContain('src="https://example.com/uploads/photo.jpg"');
  });

  test('preserves external image URLs', () => {
    expect(resolveNewsletterImageSrc('https://cdn.example.com/photo.jpg')).toBe(
      'https://cdn.example.com/photo.jpg',
    );
  });

  test('does not turn blob URLs into public URLs', () => {
    expect(resolveNewsletterImageSrc('blob:http://localhost/image-id')).toBe(
      'blob:http://localhost/image-id',
    );
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
