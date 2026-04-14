/**
 * PageCapture Core — Extracted pure logic for testing.
 * Source: combined-clipper.src.js
 */

// --- Constants ---
export const MAX_MARKDOWN_LENGTH = 100000;
export const MAX_HTML_LENGTH = 120000;
export const MAX_ELEMENTS = 200;

// --- Markdown Walker ---
// Converts a DOM node tree to Markdown string.
// Mirrors the `wn()` function from the bookmarklet IIFE.
const SKIP_TAGS = /^(SCRIPT|STYLE|NOSCRIPT|SVG|IFRAME|LINK|META|HEAD)$/i;

export function walkNode(node) {
  if (node.nodeType === 3) return node.nodeValue.replace(/\s+/g, ' ');
  if (node.nodeType !== 1) return '';
  if (SKIP_TAGS.test(node.tagName)) return '';
  if (node.id === 'pc-overlay') return '';

  let c = '';
  for (let i = 0; i < node.childNodes.length; i++) {
    c += walkNode(node.childNodes[i]);
  }

  switch (node.tagName) {
    case 'H1': return '\n\n# ' + c.trim() + '\n\n';
    case 'H2': return '\n\n## ' + c.trim() + '\n\n';
    case 'H3': return '\n\n### ' + c.trim() + '\n\n';
    case 'H4': return '\n\n#### ' + c.trim() + '\n\n';
    case 'H5': return '\n\n##### ' + c.trim() + '\n\n';
    case 'H6': return '\n\n###### ' + c.trim() + '\n\n';
    case 'P': return '\n\n' + c.trim() + '\n\n';
    case 'BR': return '\n';
    case 'LI': return '\n- ' + c.trim();
    case 'UL': case 'OL': case 'BLOCKQUOTE': return '\n\n' + c + '\n\n';
    case 'PRE': return '\n```\n' + (node.innerText ?? node.textContent) + '\n```\n';
    case 'CODE':
      return (node.parentElement && node.parentElement.tagName === 'PRE') ? c : '`' + c.trim() + '`';
    case 'B': case 'STRONG': return ' **' + c.trim() + '** ';
    case 'I': case 'EM': return ' *' + c.trim() + '* ';
    case 'A': {
      const h = node.href || '';
      const href = /^https?:\/\//i.test(h) ? h : '#';
      return ' [' + c.trim() + '](' + href + ') ';
    }
    case 'IMG': {
      const a = node.alt || '';
      const s = node.src || '';
      if (!/^https?:\/\//i.test(s)) return a || '';
      return '![' + a + '](' + s + ')';
    }
    case 'TR': return '\n| ' + c.trim() + ' |';
    case 'TD': case 'TH': return ' ' + c.trim() + ' |';
    case 'HR': return '\n\n---\n\n';
    case 'DIV': case 'MAIN': case 'SECTION': case 'ARTICLE':
    case 'HEADER': case 'FOOTER': case 'NAV':
      return '\n' + c + '\n';
    default: return c;
  }
}

// --- CSS Selector Builder ---
// Generates a unique CSS selector path for an element.
export function buildSelector(element) {
  if (!element || typeof element.tagName !== 'string') return null;
  if (element.id) return '#' + cssEscape(element.id);

  const parts = [];
  let cur = element;
  while (cur && cur.nodeType === 1 && cur !== cur.ownerDocument.documentElement) {
    let s = cur.tagName.toLowerCase();
    if (cur.className && typeof cur.className === 'string') {
      const classes = cur.className.split(/\s+/).filter(Boolean).map(x => cssEscape(x));
      if (classes.length && classes.length <= 3) s += '.' + classes.join('.');
    }
    const parent = cur.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(x => x.tagName === cur.tagName);
      if (siblings.length > 1) s += ':nth-of-type(' + (siblings.indexOf(cur) + 1) + ')';
    }
    parts.unshift(s);
    cur = cur.parentElement;
  }
  return parts.join(' > ');
}

// Minimal CSS.escape polyfill (matches the bookmarklet's)
function cssEscape(value) {
  return String(value).replace(/([^\w-])/g, '\\$1');
}

// --- Element Summarizer ---
export function summarizeElement(el) {
  const text = (el.innerText ?? el.textContent ?? el.value ?? '').replace(/\s+/g, ' ').trim().slice(0, 120);
  return {
    tag: el.tagName.toLowerCase(),
    id: el.id || null,
    name: el.name || null,
    type: el.type || null,
    role: el.getAttribute('role') || null,
    classes: el.className || null,
    text: text || null,
    selector: buildSelector(el),
  };
}

// --- HTML Redaction ---
// Removes sensitive values from HTML string (hidden inputs, data-token attrs).
export function redactHtml(html) {
  let count = 0;
  let result = html.replace(
    /(<input[^>]*type\s*=\s*["'](?:hidden|password)["'][^>]*value\s*=\s*["'])[^"']*?(["'])/gi,
    (m, prefix, quote) => { count++; return prefix + '[REDACTED]' + quote; }
  );
  result = result.replace(
    /(data-(?:token|csrf|session)\s*=\s*["'])[^"']*?(["'])/gi,
    (m, prefix, quote) => { count++; return prefix + '[REDACTED]' + quote; }
  );
  return { result, redactedCount: count };
}

// --- Truncation ---
export function truncate(text, maxLength) {
  const fullLength = text.length;
  const truncated = fullLength > maxLength;
  const content = truncated ? text.slice(0, maxLength) : text;
  return { content, length: content.length, fullLength, truncated };
}

// --- Filename Sanitizer ---
// Builds a safe download filename from hostname + pathname.
export function buildFilename(hostname, pathname) {
  const raw = (hostname + pathname).replace(/[/\\]/g, '_').replace(/_$/, '');
  return raw || 'page';
}

// --- Markdown Cleanup ---
// Collapses triple+ newlines into double newlines and trims.
export function cleanMarkdown(raw) {
  return raw.replace(/\n\s*\n\s*\n/g, '\n\n').trim();
}
