import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import {
  MAX_MARKDOWN_LENGTH,
  MAX_HTML_LENGTH,
  MAX_ELEMENTS,
  walkNode,
  buildSelector,
  summarizeElement,
  redactHtml,
  truncate,
  buildFilename,
  cleanMarkdown,
} from './core.js';

// Helper: create a DOM element from HTML string
function dom(html) {
  const { document } = new JSDOM(`<!DOCTYPE html><body>${html}</body>`).window;
  return document.body;
}

function domEl(html) {
  return dom(html).firstElementChild;
}

// =============================================================================
// Constants
// =============================================================================
describe('Constants', () => {
  it('MAX_MARKDOWN_LENGTH is 100000', () => {
    expect(MAX_MARKDOWN_LENGTH).toBe(100000);
  });

  it('MAX_HTML_LENGTH is 120000', () => {
    expect(MAX_HTML_LENGTH).toBe(120000);
  });

  it('MAX_ELEMENTS is 200', () => {
    expect(MAX_ELEMENTS).toBe(200);
  });
});

// =============================================================================
// walkNode — Markdown Walker
// =============================================================================
describe('walkNode', () => {
  describe('headings', () => {
    it('converts H1', () => {
      const body = dom('<h1>Title</h1>');
      expect(walkNode(body)).toContain('# Title');
    });

    it('converts H2', () => {
      const body = dom('<h2>Subtitle</h2>');
      expect(walkNode(body)).toContain('## Subtitle');
    });

    it('converts H3', () => {
      const body = dom('<h3>Section</h3>');
      expect(walkNode(body)).toContain('### Section');
    });

    it('converts H4 through H6', () => {
      const body = dom('<h4>H4</h4><h5>H5</h5><h6>H6</h6>');
      const md = walkNode(body);
      expect(md).toContain('#### H4');
      expect(md).toContain('##### H5');
      expect(md).toContain('###### H6');
    });
  });

  describe('paragraphs and line breaks', () => {
    it('wraps P in double newlines', () => {
      const body = dom('<p>Hello world</p>');
      expect(walkNode(body)).toContain('\n\nHello world\n\n');
    });

    it('converts BR to newline', () => {
      const body = dom('<p>Line one<br>Line two</p>');
      expect(walkNode(body)).toContain('Line one\nLine two');
    });
  });

  describe('lists', () => {
    it('converts LI to dash-prefixed items', () => {
      const body = dom('<ul><li>Item A</li><li>Item B</li></ul>');
      const md = walkNode(body);
      expect(md).toContain('- Item A');
      expect(md).toContain('- Item B');
    });

    it('handles OL same as UL (no numbering)', () => {
      const body = dom('<ol><li>First</li><li>Second</li></ol>');
      const md = walkNode(body);
      expect(md).toContain('- First');
      expect(md).toContain('- Second');
    });
  });

  describe('code blocks', () => {
    it('wraps PRE in fenced code block', () => {
      const body = dom('<pre>const x = 1;</pre>');
      expect(walkNode(body)).toContain('```\nconst x = 1;\n```');
    });

    it('wraps inline CODE in backticks', () => {
      const body = dom('<p>Use <code>npm install</code> to install</p>');
      expect(walkNode(body)).toContain('`npm install`');
    });

    it('does not double-backtick CODE inside PRE', () => {
      const body = dom('<pre><code>hello</code></pre>');
      const md = walkNode(body);
      // Should have fenced block but not backtick-wrapped content
      expect(md).toContain('```');
      expect(md).not.toMatch(/`hello`/);
    });
  });

  describe('inline formatting', () => {
    it('converts STRONG/B to bold', () => {
      const body = dom('<p>This is <strong>bold</strong> text</p>');
      expect(walkNode(body)).toContain('**bold**');
    });

    it('converts EM/I to italic', () => {
      const body = dom('<p>This is <em>italic</em> text</p>');
      expect(walkNode(body)).toContain('*italic*');
    });
  });

  describe('links', () => {
    it('converts A with http href to markdown link', () => {
      const body = dom('<a href="https://example.com">Click here</a>');
      // JSDOM normalizes URLs (adds trailing slash)
      expect(walkNode(body)).toContain('[Click here](https://example.com/)');
    });

    it('uses # for non-http href', () => {
      const body = dom('<a href="javascript:void(0)">Bad link</a>');
      expect(walkNode(body)).toContain('[Bad link](#)');
    });

    it('uses # for empty href', () => {
      const body = dom('<a href="">Empty</a>');
      expect(walkNode(body)).toContain('[Empty](#)');
    });
  });

  describe('images', () => {
    it('converts IMG with http src to markdown image', () => {
      const body = dom('<img src="https://example.com/img.png" alt="Logo">');
      expect(walkNode(body)).toContain('![Logo](https://example.com/img.png)');
    });

    it('returns alt text for non-http src', () => {
      const body = dom('<img src="data:image/png;base64,abc" alt="Inline">');
      expect(walkNode(body)).toContain('Inline');
      expect(walkNode(body)).not.toContain('![');
    });

    it('returns empty for no alt and non-http src', () => {
      const body = dom('<img src="data:image/png;base64,abc">');
      expect(walkNode(body).trim()).toBe('');
    });
  });

  describe('tables', () => {
    it('converts TR/TD to pipe-delimited rows', () => {
      const body = dom('<table><tr><td>A</td><td>B</td></tr></table>');
      const md = walkNode(body);
      expect(md).toContain('|');
      expect(md).toContain('A');
      expect(md).toContain('B');
    });

    it('converts TH similarly', () => {
      const body = dom('<table><tr><th>Header</th></tr></table>');
      expect(walkNode(body)).toContain('Header');
    });
  });

  describe('horizontal rule', () => {
    it('converts HR to ---', () => {
      const body = dom('<hr>');
      expect(walkNode(body)).toContain('---');
    });
  });

  describe('skip tags', () => {
    it('skips SCRIPT content', () => {
      const body = dom('<script>alert("hi")</script><p>Visible</p>');
      const md = walkNode(body);
      expect(md).not.toContain('alert');
      expect(md).toContain('Visible');
    });

    it('skips STYLE content', () => {
      const body = dom('<style>.foo{color:red}</style><p>Text</p>');
      expect(walkNode(body)).not.toContain('color');
    });

    it('skips NOSCRIPT', () => {
      const body = dom('<noscript>Enable JS</noscript><p>OK</p>');
      expect(walkNode(body)).not.toContain('Enable JS');
    });

    it('skips element with id=pc-overlay', () => {
      const body = dom('<div id="pc-overlay">Panel</div><p>Content</p>');
      expect(walkNode(body)).not.toContain('Panel');
      expect(walkNode(body)).toContain('Content');
    });
  });

  describe('semantic containers', () => {
    it('wraps DIV content in newlines', () => {
      const body = dom('<div>Inside div</div>');
      expect(walkNode(body)).toContain('\nInside div\n');
    });

    it('handles MAIN, SECTION, ARTICLE', () => {
      const body = dom('<main><section><article>Deep</article></section></main>');
      expect(walkNode(body)).toContain('Deep');
    });
  });

  describe('text nodes', () => {
    it('collapses whitespace in text nodes', () => {
      const body = dom('<p>Hello    world\n\ttabs</p>');
      expect(walkNode(body)).toContain('Hello world tabs');
    });
  });

  describe('nested structures', () => {
    it('handles bold inside heading', () => {
      const body = dom('<h2>My <strong>Bold</strong> Title</h2>');
      const md = walkNode(body);
      expect(md).toContain('## ');
      expect(md).toContain('**Bold**');
    });

    it('handles link inside list item', () => {
      const body = dom('<ul><li><a href="https://x.com">Link</a></li></ul>');
      const md = walkNode(body);
      expect(md).toContain('- ');
      expect(md).toContain('[Link](https://x.com/');
    });
  });
});

// =============================================================================
// buildSelector — CSS Selector Builder
// =============================================================================
describe('buildSelector', () => {
  it('returns null for non-element (no tagName)', () => {
    expect(buildSelector({})).toBe(null);
  });

  it('returns null for null input', () => {
    expect(buildSelector(null)).toBe(null);
  });

  it('returns #id for element with id', () => {
    const el = domEl('<div id="main">Test</div>');
    expect(buildSelector(el)).toBe('#main');
  });

  it('builds tag path for elements without id', () => {
    const body = dom('<div><span>Inner</span></div>');
    const span = body.querySelector('span');
    const sel = buildSelector(span);
    expect(sel).toContain('span');
    expect(sel).toContain('div');
  });

  it('includes classes (up to 3)', () => {
    const body = dom('<div class="a b">Test</div>');
    const div = body.querySelector('div');
    const sel = buildSelector(div);
    expect(sel).toContain('.a');
    expect(sel).toContain('.b');
  });

  it('adds nth-of-type for ambiguous siblings', () => {
    const body = dom('<div><span>A</span><span>B</span></div>');
    const spans = body.querySelectorAll('span');
    const sel = buildSelector(spans[1]);
    expect(sel).toContain(':nth-of-type(2)');
  });

  it('escapes special characters in id', () => {
    const el = domEl('<div id="my.id">Test</div>');
    expect(buildSelector(el)).toContain('my\\.id');
  });
});

// =============================================================================
// summarizeElement
// =============================================================================
describe('summarizeElement', () => {
  it('returns tag, id, text, and selector', () => {
    const el = domEl('<button id="submit-btn">Click Me</button>');
    const summary = summarizeElement(el);
    expect(summary.tag).toBe('button');
    expect(summary.id).toBe('submit-btn');
    expect(summary.text).toBe('Click Me');
    expect(summary.selector).toBe('#submit-btn');
  });

  it('returns null for missing optional fields', () => {
    const el = domEl('<div>Text</div>');
    const summary = summarizeElement(el);
    expect(summary.name).toBe(null);
    expect(summary.type).toBe(null);
    expect(summary.role).toBe(null);
  });

  it('captures role attribute', () => {
    const el = domEl('<div role="dialog">Modal</div>');
    expect(summarizeElement(el).role).toBe('dialog');
  });

  it('truncates text to 120 characters', () => {
    const longText = 'A'.repeat(200);
    const el = domEl(`<div>${longText}</div>`);
    expect(summarizeElement(el).text.length).toBe(120);
  });

  it('returns null for empty text', () => {
    const el = domEl('<div></div>');
    expect(summarizeElement(el).text).toBe(null);
  });
});

// =============================================================================
// redactHtml
// =============================================================================
describe('redactHtml', () => {
  it('redacts hidden input values', () => {
    const html = '<input type="hidden" value="secret123">';
    const { result, redactedCount } = redactHtml(html);
    expect(result).toContain('[REDACTED]');
    expect(result).not.toContain('secret123');
    expect(redactedCount).toBe(1);
  });

  it('redacts password input values', () => {
    const html = '<input type="password" value="mypass">';
    const { result, redactedCount } = redactHtml(html);
    expect(result).toContain('[REDACTED]');
    expect(result).not.toContain('mypass');
    expect(redactedCount).toBe(1);
  });

  it('redacts data-token attributes', () => {
    const html = '<div data-token="abc123">Content</div>';
    const { result, redactedCount } = redactHtml(html);
    expect(result).toContain('[REDACTED]');
    expect(result).not.toContain('abc123');
    expect(redactedCount).toBe(1);
  });

  it('redacts data-csrf attributes', () => {
    const html = '<meta data-csrf="csrf-token-value">';
    const { result, redactedCount } = redactHtml(html);
    expect(result).toContain('[REDACTED]');
    expect(result).not.toContain('csrf-token-value');
    expect(redactedCount).toBe(1);
  });

  it('redacts data-session attributes', () => {
    const html = '<div data-session="sess-abc">Test</div>';
    const { result } = redactHtml(html);
    expect(result).not.toContain('sess-abc');
  });

  it('handles multiple redactions', () => {
    const html = '<input type="hidden" value="s1"><input type="password" value="s2"><div data-token="t1">';
    const { redactedCount } = redactHtml(html);
    expect(redactedCount).toBe(3);
  });

  it('returns 0 count for clean HTML', () => {
    const html = '<div><p>Normal content</p></div>';
    const { result, redactedCount } = redactHtml(html);
    expect(redactedCount).toBe(0);
    expect(result).toBe(html);
  });

  it('preserves non-sensitive input attributes', () => {
    const html = '<input type="text" value="public-value">';
    const { result, redactedCount } = redactHtml(html);
    expect(redactedCount).toBe(0);
    expect(result).toContain('public-value');
  });
});

// =============================================================================
// truncate
// =============================================================================
describe('truncate', () => {
  it('does not truncate short text', () => {
    const { content, truncated, fullLength, length } = truncate('hello', 100);
    expect(content).toBe('hello');
    expect(truncated).toBe(false);
    expect(fullLength).toBe(5);
    expect(length).toBe(5);
  });

  it('truncates text exceeding maxLength', () => {
    const text = 'a'.repeat(150);
    const { content, truncated, fullLength, length } = truncate(text, 100);
    expect(content.length).toBe(100);
    expect(truncated).toBe(true);
    expect(fullLength).toBe(150);
    expect(length).toBe(100);
  });

  it('handles exact boundary (not truncated)', () => {
    const text = 'x'.repeat(100);
    const { truncated } = truncate(text, 100);
    expect(truncated).toBe(false);
  });

  it('handles empty string', () => {
    const { content, truncated, fullLength } = truncate('', 100);
    expect(content).toBe('');
    expect(truncated).toBe(false);
    expect(fullLength).toBe(0);
  });
});

// =============================================================================
// buildFilename
// =============================================================================
describe('buildFilename', () => {
  it('joins hostname and pathname with underscores', () => {
    expect(buildFilename('example.com', '/page/about')).toBe('example.com_page_about');
  });

  it('strips trailing underscore', () => {
    expect(buildFilename('example.com', '/')).toBe('example.com');
  });

  it('converts backslashes', () => {
    expect(buildFilename('example.com', '\\path\\to')).toBe('example.com_path_to');
  });

  it('returns "page" for empty input', () => {
    expect(buildFilename('', '')).toBe('page');
  });

  it('handles root path', () => {
    expect(buildFilename('localhost', '/')).toBe('localhost');
  });

  it('handles complex paths', () => {
    expect(buildFilename('docs.site.io', '/api/v2/users')).toBe('docs.site.io_api_v2_users');
  });
});

// =============================================================================
// cleanMarkdown
// =============================================================================
describe('cleanMarkdown', () => {
  it('collapses triple newlines to double', () => {
    expect(cleanMarkdown('A\n\n\nB')).toBe('A\n\nB');
  });

  it('collapses more than triple newlines', () => {
    expect(cleanMarkdown('A\n\n\n\n\nB')).toBe('A\n\nB');
  });

  it('trims leading and trailing whitespace', () => {
    expect(cleanMarkdown('  \n\nHello\n\n  ')).toBe('Hello');
  });

  it('preserves double newlines (paragraph breaks)', () => {
    expect(cleanMarkdown('A\n\nB')).toBe('A\n\nB');
  });

  it('handles newlines with spaces between', () => {
    expect(cleanMarkdown('A\n  \n  \nB')).toBe('A\n\nB');
  });

  it('handles empty string', () => {
    expect(cleanMarkdown('')).toBe('');
  });
});

// =============================================================================
// Integration: walkNode + cleanMarkdown
// =============================================================================
describe('walkNode + cleanMarkdown integration', () => {
  it('produces clean markdown from a full page fragment', () => {
    const html = `
      <h1>Welcome</h1>
      <p>This is a <strong>test</strong> page with <a href="https://example.com">a link</a>.</p>
      <ul>
        <li>Item 1</li>
        <li>Item 2</li>
      </ul>
      <hr>
      <pre>code block</pre>
    `;
    const body = dom(html);
    const raw = walkNode(body);
    const md = cleanMarkdown(raw);
    expect(md).toContain('# Welcome');
    expect(md).toContain('**test**');
    expect(md).toContain('[a link](https://example.com/');
    expect(md).toContain('- Item 1');
    expect(md).toContain('- Item 2');
    expect(md).toContain('---');
    expect(md).toContain('```\ncode block\n```');
    // No triple newlines
    expect(md).not.toMatch(/\n\s*\n\s*\n/);
  });

  it('skips script and style in complex documents', () => {
    const html = `
      <style>body { color: red; }</style>
      <script>console.log("hi")</script>
      <h2>Real Content</h2>
      <p>Paragraph text</p>
    `;
    const body = dom(html);
    const md = cleanMarkdown(walkNode(body));
    expect(md).toContain('## Real Content');
    expect(md).toContain('Paragraph text');
    expect(md).not.toContain('color: red');
    expect(md).not.toContain('console.log');
  });
});
