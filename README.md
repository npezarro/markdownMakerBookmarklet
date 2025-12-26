# Markdown Converter Bookmarklets

This set of bookmarklets allows you to convert any webpage into clean Markdown text with a single click. It is designed to work entirely within the browser (no external servers or libraries), making it compatible with secure sites like banking portals, GitHub, and corporate wikis.

Here's an example

<img width="2296" height="1730" alt="Screenshot 2025-12-26 at 8 55 26 AM" src="https://github.com/user-attachments/assets/5daeff4b-ed05-4982-a9ba-a114acc9fd7f" />
<img width="3432" height="1708" alt="Screenshot 2025-12-26 at 8 55 38 AM" src="https://github.com/user-attachments/assets/404b1a19-23a7-4eb4-b02b-1f0544ea681f" />
<img width="3400" height="1658" alt="Screenshot 2025-12-26 at 8 55 58 AM" src="https://github.com/user-attachments/assets/ca52903a-b509-4c09-a43a-2dd9caa2d459" />


## The Tools

### 1. Instant Copy (Clipboard)
**Best for:** Speed.
Clicking this bookmarklet instantly parses the page and copies the Markdown result to your system clipboard. It preserves line breaks and paragraph structure, making it ideal for pasting into Notion, Obsidian, or LLMs (ChatGPT/Claude).

```javascript
javascript:(function(){function g(n){if(n.nodeType===3)return n.nodeValue.replace(/\s+/g," ");if(n.nodeType===1){if(/^(SCRIPT|STYLE|NOSCRIPT|SVG|IFRAME|LINK|META|HEAD)$/i.test(n.tagName))return"";var c="";for(var i=0;i<n.childNodes.length;i++){c+=g(n.childNodes[i])}switch(n.tagName){case"H1":return"\n\n# "+c.trim()+"\n\n";case"H2":return"\n\n## "+c.trim()+"\n\n";case"H3":return"\n\n### "+c.trim()+"\n\n";case"P":return"\n\n"+c.trim()+"\n\n";case"BR":return"\n";case"LI":return"\n- "+c.trim();case"UL":case"OL":case"BLOCKQUOTE":return"\n\n"+c+"\n\n";case"PRE":return"\n```\n"+n.innerText+"\n```\n";case"B":case"STRONG":return" **"+c.trim()+"** ";case"I":case"EM":return" *"+c.trim()+"* ";case"A":return" ["+c.trim()+"]("+n.href+") ";case"TR":return"\n| "+c.trim()+" |";case"TD":case"TH":return" "+c.trim()+" |";case"DIV":case"MAIN":case"SECTION":case"ARTICLE":return"\n"+c+"\n";default:return c}}}try{var m=g(document.body).replace(/\n\s*\n\s*\n/g,"\n\n").trim();navigator.clipboard.writeText(m).then(function(){alert("Markdown copied ("+m.length+" chars)!");},function(){console.log(m);alert("Clipboard blocked. Check Console (F12).");})}catch(e){console.error(e);alert("Error: "+e.message)}})();
```

### 2. Visual Preview (Page Transform)
**Best for:** Verification.
This replaces the current webpage with a raw text view of the generated Markdown. This is useful when you want to visually verify the formatting or manually select only a specific section of the text to copy.
*Note: Refresh the page to return to the original website.*

```javascript
javascript:(function(){function g(n){if(n.nodeType===3)return n.nodeValue.replace(/\s+/g," ");if(n.nodeType===1){if(/^(SCRIPT|STYLE|NOSCRIPT|SVG|IFRAME|LINK|META|HEAD)$/i.test(n.tagName))return"";var c="";for(var i=0;i<n.childNodes.length;i++){c+=g(n.childNodes[i])}switch(n.tagName){case"H1":return"\n\n# "+c.trim()+"\n\n";case"H2":return"\n\n## "+c.trim()+"\n\n";case"H3":return"\n\n### "+c.trim()+"\n\n";case"P":return"\n\n"+c.trim()+"\n\n";case"BR":return"\n";case"LI":return"\n- "+c.trim();case"UL":case"OL":case"BLOCKQUOTE":return"\n\n"+c+"\n\n";case"PRE":return"\n```\n"+n.innerText+"\n```\n";case"B":case"STRONG":return" **"+c.trim()+"** ";case"I":case"EM":return" *"+c.trim()+"* ";case"A":return" ["+c.trim()+"]("+n.href+") ";case"TR":return"\n| "+c.trim()+" |";case"TD":case"TH":return" "+c.trim()+" |";case"DIV":case"MAIN":case"SECTION":case"ARTICLE":return"\n"+c+"\n";default:return c}}}var m=g(document.body).replace(/\n\s*\n\s*\n/g,"\n\n").trim();document.body.innerHTML="";var p=document.createElement("pre");p.style.cssText="white-space:pre-wrap;word-wrap:break-word;background:#222;color:#eee;font-family:monospace;padding:20px;font-size:14px;line-height:1.5;margin:0;";p.textContent=m;document.body.appendChild(p);})();
```

## Installation Guide

### Chrome / Edge / Brave
1.  **Show the Bookmarks Bar:** Press `Ctrl + Shift + B` (Windows) or `Cmd + Shift + B` (Mac).
2.  **Right-click** on the bar and select **Add Page** (or "Add Bookmark").
3.  **Name:** Enter a name like `Copy to MD`.
4.  **URL:** Paste the code block from above into the URL field.
5.  Click **Save**.

### Firefox
1.  **Show the Bookmarks Toolbar:** Right-click the empty space near the address bar -> Bookmarks Toolbar -> Always Show.
2.  **Right-click** the toolbar and select **Add Bookmark...**
3.  **Name:** Enter a name like `Copy to MD`.
4.  **URL:** Paste the code block from above.
5.  Click **Save**.

### Safari (macOS)
1.  Open any page and press `Cmd + D` to create a bookmark. Add it to your **Favorites** folder.
2.  Right-click the new bookmark in the Favorites bar and choose **Edit Address**.
3.  Delete the current URL and paste the Javascript code from above.
4.  Press **Done** (or Enter).

## Usage & Troubleshooting

**How to use:**
Simply navigate to the article or documentation you want to capture and click the bookmarklet in your toolbar.

**"Clipboard blocked" error:**
Some browsers restrict clipboard access unless triggered by a direct user keystroke.
* **Solution:** Use the **Visual Preview** bookmarklet (#2). It displays the text on screen so you can manually select it (`Ctrl+A`) and copy it (`Ctrl+C`).

**"Content Security Policy (CSP)" errors:**
If you see errors in the console about "refused to execute script," the site is blocking external code.
* **Good news:** These bookmarklets are "standalone" (no external libraries), so they bypass 99% of these blocks. If they fail, the site has an extremely strict "no inline scripts" policy (very rare, mostly specific banking sub-pages).
