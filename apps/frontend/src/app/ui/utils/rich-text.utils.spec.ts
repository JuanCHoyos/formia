import { isSafeHref, normalizeUrl, richTextLength, sanitizeRichText } from './rich-text.utils';

describe('sanitizeRichText', () => {
  it('keeps the supported formats untouched', () => {
    const html =
      '<h2 class="te-align-center">Title</h2><p><strong>b</strong> <em>i</em> <u>u</u> <s>s</s> <code>c</code> <sup>2</sup><sub>n</sub></p>' +
      '<blockquote><p>quote</p></blockquote><ul><li>a<ol><li>b</li></ol></li></ul><hr><p><span class="te-color-indigo">tone</span><span class="te-bg-rose">bg</span></p>';

    expect(sanitizeRichText(html)).toBe(html);
  });

  it('removes scripts, event handlers and unsafe links', () => {
    const html =
      '<p onclick="steal()">Hi<script>alert(1)</script><img src=x onerror="alert(1)"><a href="javascript:alert(1)">x</a></p>';

    expect(sanitizeRichText(html)).toBe('<p>Hix</p>');
  });

  it('adds safe attributes to links', () => {
    expect(sanitizeRichText('<p><a href="https://pliego.app" onmouseover="x()">go</a></p>')).toBe(
      '<p><a href="https://pliego.app" rel="noopener noreferrer" target="_blank">go</a></p>',
    );
  });

  it('maps legacy and pasted markup to the canonical tags', () => {
    expect(
      sanitizeRichText(
        '<div>one <b>two</b> <i>three</i></div><p style="text-align: right"><span style="color: red">red</span> <span style="font-weight: 700">bold</span></p>',
      ),
    ).toBe(
      '<p>one <strong>two</strong> <em>three</em></p><p class="te-align-right">red <strong>bold</strong></p>',
    );
  });

  it('unwraps ProseMirror paragraphs inside list items', () => {
    expect(sanitizeRichText('<ul><li><p>a</p><p>b</p></li></ul>')).toBe('<ul><li>a<br>b</li></ul>');
  });

  it('wraps loose inline content in paragraphs', () => {
    expect(sanitizeRichText('text<ul><li>item</li></ul>more')).toBe(
      '<p>text</p><ul><li>item</li></ul><p>more</p>',
    );
  });

  it('drops formats whose tool is not allowed', () => {
    expect(
      sanitizeRichText('<h1>Title</h1><ul><li><strong>a</strong></li></ul>', new Set(['italic'])),
    ).toBe('<p>Title</p><p>a</p>');
  });

  it('returns an empty string for empty content', () => {
    expect(sanitizeRichText('<p><br></p><p></p>')).toBe('');
    expect(sanitizeRichText(null)).toBe('');
  });

  it('drops colors that are not theme brands', () => {
    expect(sanitizeRichText('<p><span class="te-color-700 te-bg-pink">x</span></p>')).toBe(
      '<p>x</p>',
    );
  });
});

describe('normalizeUrl', () => {
  it('accepts web and mail addresses', () => {
    expect(normalizeUrl('pliego.app/docs')).toBe('https://pliego.app/docs');
    expect(normalizeUrl('http://localhost:4200')).toBe('http://localhost:4200');
    expect(normalizeUrl('hi@pliego.app')).toBe('mailto:hi@pliego.app');
  });

  it('rejects unsafe or malformed values', () => {
    expect(normalizeUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeUrl('not a url')).toBeNull();
    expect(normalizeUrl('word')).toBeNull();
  });
});

describe('isSafeHref', () => {
  it('only allows http, https and mailto', () => {
    expect(isSafeHref('https://a.dev')).toBe(true);
    expect(isSafeHref('mailto:a@b.dev')).toBe(true);
    expect(isSafeHref('data:text/html,x')).toBe(false);
    expect(isSafeHref('/relative')).toBe(false);
  });
});

describe('richTextLength', () => {
  it('counts visible characters only', () => {
    expect(richTextLength('<p><strong>abc</strong> d</p>')).toBe(5);
    expect(richTextLength('')).toBe(0);
  });
});
