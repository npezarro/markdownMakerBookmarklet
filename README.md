# PageCapture — Combined Bookmarklet

A single-click bookmarklet that captures any webpage as **Markdown**, **HTML**, and **interactive page elements** (buttons, inputs, forms). Designed for pasting into LLMs (Claude, ChatGPT) with full page context.

No external dependencies. Works on secure sites (banking, corporate wikis, GitHub).

## Features

- **Markdown** — Clean conversion of page content with headings, lists, links, code blocks, tables
- **HTML snapshot** — First 120KB of page HTML with credential scrubbing (hidden inputs, passwords, CSRF tokens auto-redacted)
- **Page elements** — All buttons, inputs, selects with selectors, roles, and text
- **Meta tags** — Full `<head>` metadata
- **Tabbed overlay** — Switch between Markdown / Page Info / Full JSON views
- **Copy & Download** — Copy to clipboard or download as `.md` / `.json`
- **Shift-click bypass** — Hold Shift when clicking to disable credential redaction (shows red warning banner)

## Quick Start

### Install the Bookmarklet

1. Copy the contents of `combined-clipper.bookmarklet.txt`
2. Create a new bookmark in your browser
3. Name it `PageCapture` (or whatever you prefer)
4. Paste the copied text as the URL
5. Click it on any page — the overlay appears

### Or Build From Source

```bash
npm install
bash build.sh
```

This produces:
- `combined-clipper.min.js` — Minified source (~8KB)
- `combined-clipper.bookmarklet.txt` — Ready-to-use `javascript:` URI (~9.7KB)

## Output Format

The full JSON payload:

```json
{
  "meta": { "title", "url", "timestamp", "viewport", "userAgent", "version" },
  "markdown": { "content": "...", "length": 95000, "fullLength": 142000, "truncated": true },
  "html": { "snippet": "...", "length": 120000, "fullLength": 380000, "truncated": true, "redactedCount": 3 },
  "elements": { "buttons": [...], "inputs": [...], "buttonsCount": 42, "inputsCount": 18 },
  "head": { "metaTags": [...] }
}
```

## Legacy Bookmarklets

### Instant Copy (Clipboard Only)

```javascript
javascript:(function(){function g(n){if(n.nodeType===3)return n.nodeValue.replace(/\s+/g," ");if(n.nodeType===1){if(/^(SCRIPT|STYLE|NOSCRIPT|SVG|IFRAME|LINK|META|HEAD)$/i.test(n.tagName))return"";var c="";for(var i=0;i<n.childNodes.length;i++){c+=g(n.childNodes[i])}switch(n.tagName){case"H1":return"\n\n# "+c.trim()+"\n\n";case"H2":return"\n\n## "+c.trim()+"\n\n";case"H3":return"\n\n### "+c.trim()+"\n\n";case"P":return"\n\n"+c.trim()+"\n\n";case"BR":return"\n";case"LI":return"\n- "+c.trim();case"UL":case"OL":case"BLOCKQUOTE":return"\n\n"+c+"\n\n";case"PRE":return"\n```\n"+n.innerText+"\n```\n";case"B":case"STRONG":return" **"+c.trim()+"** ";case"I":case"EM":return" *"+c.trim()+"* ";case"A":return" ["+c.trim()+"]("+n.href+") ";case"TR":return"\n| "+c.trim()+" |";case"TD":case"TH":return" "+c.trim()+" |";case"DIV":case"MAIN":case"SECTION":case"ARTICLE":return"\n"+c+"\n";default:return c}}}try{var m=g(document.body).replace(/\n\s*\n\s*\n/g,"\n\n").trim();navigator.clipboard.writeText(m).then(function(){alert("Markdown copied ("+m.length+" chars)!");},function(){console.log(m);alert("Clipboard blocked. Check Console (F12).");})}catch(e){console.error(e);alert("Error: "+e.message)}})();
```

### Visual Preview (Page Transform)

```javascript
javascript:(function(){function g(n){if(n.nodeType===3)return n.nodeValue.replace(/\s+/g," ");if(n.nodeType===1){if(/^(SCRIPT|STYLE|NOSCRIPT|SVG|IFRAME|LINK|META|HEAD)$/i.test(n.tagName))return"";var c="";for(var i=0;i<n.childNodes.length;i++){c+=g(n.childNodes[i])}switch(n.tagName){case"H1":return"\n\n# "+c.trim()+"\n\n";case"H2":return"\n\n## "+c.trim()+"\n\n";case"H3":return"\n\n### "+c.trim()+"\n\n";case"P":return"\n\n"+c.trim()+"\n\n";case"BR":return"\n";case"LI":return"\n- "+c.trim();case"UL":case"OL":case"BLOCKQUOTE":return"\n\n"+c+"\n\n";case"PRE":return"\n```\n"+n.innerText+"\n```\n";case"B":case"STRONG":return" **"+c.trim()+"** ";case"I":case"EM":return" *"+c.trim()+"* ";case"A":return" ["+c.trim()+"]("+n.href+") ";case"TR":return"\n| "+c.trim()+" |";case"TD":case"TH":return" "+c.trim()+" |";case"DIV":case"MAIN":case"SECTION":case"ARTICLE":return"\n"+c+"\n";default:return c}}}var m=g(document.body).replace(/\n\s*\n\s*\n/g,"\n\n").trim();document.body.innerHTML="";var p=document.createElement("pre");p.style.cssText="white-space:pre-wrap;word-wrap:break-word;background:#222;color:#eee;font-family:monospace;padding:20px;font-size:14px;line-height:1.5;margin:0;";p.textContent=m;document.body.appendChild(p);})();
```

## Known Limitations

- **SPA/Shadow DOM** — Captures DOM at invocation time. Client-rendered content may be incomplete
- **CSP-hardened pages** — Overlay inline styles may be blocked; clipboard export still attempts to work
- **Browser support** — Chrome 66+, Firefox 63+, Safari 14+, Edge 79+
- **Firefox clipboard** — `navigator.clipboard.writeText` intermittently blocked in Firefox 120+; overlay textarea is the fallback

## Configuration

Constants at the top of `combined-clipper.src.js`:

| Constant | Default | Purpose |
|---|---|---|
| `MML` | 100,000 | Max markdown length (chars) |
| `MHL` | 120,000 | Max HTML snippet length (chars) |
| `MEL` | 200 | Max elements per group (buttons/inputs) |
