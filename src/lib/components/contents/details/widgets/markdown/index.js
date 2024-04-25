/**
 * The default `modes` property options.
 */
export const defaultModes = ['rich_text', 'raw'];

/**
 * Key is a name used in Netlify/Decap CMS, value is a name used in Sveltia UI.
 * @type {{ [key: string]: string }}
 */
export const modeNameMap = {
  rich_text: 'rich-text',
  raw: 'plain-text',
};

/**
 * The default `buttons` property options.
 */
export const defaultButtons = [
  'bold',
  'italic',
  'code',
  'link',
  'heading-one',
  'heading-two',
  'heading-three',
  'heading-four',
  'heading-five',
  'heading-six',
  'bulleted-list',
  'numbered-list',
  'quote',
];

/**
 * Key is a name used in Netlify/Decap CMS, value is a name used in Sveltia UI.
 * @type {{ [key: string]: string }}
 */
export const buttonNameMap = {
  bold: 'bold',
  italic: 'italic',
  code: 'code',
  link: 'link',
  'heading-one': 'heading-1',
  'heading-two': 'heading-2',
  'heading-three': 'heading-3',
  'heading-four': 'heading-4',
  'heading-five': 'heading-5',
  'heading-six': 'heading-6',
  'bulleted-list': 'bulleted-list',
  'numbered-list': 'numbered-list',
  quote: 'blockquote',
};
