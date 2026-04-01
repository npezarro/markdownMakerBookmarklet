/**
 * PageCapture v1.0 — Combined Bookmarklet
 * Captures markdown, HTML, page elements, and metadata.
 * Tabbed overlay with copy/download for each format.
 * Constants at top of IIFE — tune for LLM context windows.
 */
(function(event){
'use strict';
var V='1.0',L='[PageCapture v1.0]',MML=100000,MHL=120000,MEL=200;
console.log(L,'Init');

var _cw=navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText.bind(navigator.clipboard):null;
var _B=window.Blob,_co=URL.createObjectURL.bind(URL),_ro=URL.revokeObjectURL.bind(URL);
var shift=!!(event&&event.shiftKey);
if(!CSS.escape)CSS.escape=function(v){return String(v).replace(/([^\w-])/g,'\\$1')};

function el(tag,css,txt){var e=document.createElement(tag);if(css)e.style.cssText=css;if(txt)e.textContent=txt;return e}

// Phase 1: Markdown Walker
var md={content:null,length:0,fullLength:0,truncated:false,error:null};
try{
function wn(n){
if(n.nodeType===3)return n.nodeValue.replace(/\s+/g,' ');
if(n.nodeType!==1)return'';
if(/^(SCRIPT|STYLE|NOSCRIPT|SVG|IFRAME|LINK|META|HEAD)$/i.test(n.tagName))return'';
if(n.id==='pc-overlay')return'';
var c='';for(var i=0;i<n.childNodes.length;i++)c+=wn(n.childNodes[i]);
switch(n.tagName){
case'H1':return'\n\n# '+c.trim()+'\n\n';
case'H2':return'\n\n## '+c.trim()+'\n\n';
case'H3':return'\n\n### '+c.trim()+'\n\n';
case'H4':return'\n\n#### '+c.trim()+'\n\n';
case'H5':return'\n\n##### '+c.trim()+'\n\n';
case'H6':return'\n\n###### '+c.trim()+'\n\n';
case'P':return'\n\n'+c.trim()+'\n\n';
case'BR':return'\n';
case'LI':return'\n- '+c.trim();
case'UL':case'OL':case'BLOCKQUOTE':return'\n\n'+c+'\n\n';
case'PRE':return'\n```\n'+n.innerText+'\n```\n';
case'CODE':return(n.parentElement&&n.parentElement.tagName==='PRE')?c:'`'+c.trim()+'`';
case'B':case'STRONG':return' **'+c.trim()+'** ';
case'I':case'EM':return' *'+c.trim()+'* ';
case'A':var h=n.href||'';if(!/^https?:\/\//i.test(h))h='#';return' ['+c.trim()+']('+h+') ';
case'IMG':var a=n.alt||'',s=n.src||'';if(!/^https?:\/\//i.test(s))return a||'';return'!['+a+']('+s+')';
case'TR':return'\n| '+c.trim()+' |';
case'TD':case'TH':return' '+c.trim()+' |';
case'HR':return'\n\n---\n\n';
case'DIV':case'MAIN':case'SECTION':case'ARTICLE':case'HEADER':case'FOOTER':case'NAV':return'\n'+c+'\n';
default:return c;
}}
var raw=wn(document.body).replace(/\n\s*\n\s*\n/g,'\n\n').trim();
md.fullLength=raw.length;md.truncated=raw.length>MML;
md.content=md.truncated?raw.slice(0,MML):raw;md.length=md.content.length;
}catch(e){md.error=e.message;console.error(L,'MD error:',e)}

// Phase 2: Page Info
var elems={buttons:[],inputs:[],buttonsCount:0,inputsCount:0,error:null};
var head={metaTags:[],error:null};
var htm={snippet:null,length:0,fullLength:0,truncated:false,redactedCount:0,error:null};

try{
function usel(e){
if(!(e instanceof Element))return null;
if(e.id)return'#'+CSS.escape(e.id);
var p=[],c=e;
while(c&&c.nodeType===1&&c!==document.documentElement){
var s=c.tagName.toLowerCase();
if(c.className&&typeof c.className==='string'){
var cl=c.className.split(/\s+/).filter(Boolean).map(function(x){return CSS.escape(x)});
if(cl.length&&cl.length<=3)s+='.'+cl.join('.');
}
var par=c.parentElement;
if(par){var sib=Array.from(par.children).filter(function(x){return x.tagName===c.tagName});
if(sib.length>1)s+=':nth-of-type('+(sib.indexOf(c)+1)+')';}
p.unshift(s);c=c.parentElement;}
return p.join(' > ');}
function sumEl(el){
var t=(el.innerText||el.value||'').replace(/\s+/g,' ').trim().slice(0,120);
return{tag:el.tagName.toLowerCase(),id:el.id||null,name:el.name||null,type:el.type||null,
role:el.getAttribute('role')||null,classes:el.className||null,text:t||null,selector:usel(el)};}
var ba=Array.from(new Set(Array.from(document.querySelectorAll('button,[role="button"]'))
.concat(Array.from(document.querySelectorAll('input[type="button"],input[type="submit"]')))));
var ia=Array.from(document.querySelectorAll('input,textarea,select'));
elems.buttonsCount=ba.length;elems.inputsCount=ia.length;
elems.buttons=ba.slice(0,MEL).map(sumEl);elems.inputs=ia.slice(0,MEL).map(sumEl);
}catch(e){elems.error=e.message}

try{head.metaTags=Array.from(document.querySelectorAll('meta')).map(function(m){
return{name:m.getAttribute('name')||null,property:m.getAttribute('property')||null,
charset:m.getAttribute('charset')||null,content:m.getAttribute('content')||null};});}catch(e){head.error=e.message}

try{
var rh=document.documentElement.outerHTML||'';
htm.fullLength=rh.length;htm.truncated=rh.length>MHL;
var sn=rh.slice(0,MHL);
if(!shift){var rc=0;
sn=sn.replace(/(<input[^>]*type\s*=\s*["'](?:hidden|password)["'][^>]*value\s*=\s*["'])[^"']*?(["'])/gi,function(m,p,q){rc++;return p+'[REDACTED]'+q});
sn=sn.replace(/(data-(?:token|csrf|session)\s*=\s*["'])[^"']*?(["'])/gi,function(m,p,q){rc++;return p+'[REDACTED]'+q});
htm.redactedCount=rc;}
htm.snippet=sn;htm.length=sn.length;
}catch(e){htm.error=e.message}

// Phase 3: Payload
var payload={meta:{title:document.title,url:location.href,timestamp:new Date().toISOString(),
viewport:{width:window.innerWidth,height:window.innerHeight},userAgent:navigator.userAgent,version:V},
markdown:md,html:htm,elements:elems,head:head};
var fullJ=JSON.stringify(payload,null,2);
var infoJ=JSON.stringify({meta:payload.meta,html:htm,elements:elems,head:head},null,2);

// Phase 4: Overlay
var ex=document.getElementById('pc-overlay');if(ex)ex.remove();
var ov=el('div','position:fixed;z-index:999999;top:10px;right:10px;width:520px;max-height:85vh;background:rgba(15,15,15,.95);color:#f0f0f0;border:1px solid #555;border-radius:8px;font:13px system-ui,-apple-system,sans-serif;display:flex;flex-direction:column;box-shadow:0 8px 24px rgba(0,0,0,.6)');
ov.id='pc-overlay';

var hd=el('div','padding:8px 12px;background:#1a1a1a;border-bottom:1px solid #444;display:flex;align-items:center;justify-content:space-between;border-radius:8px 8px 0 0');
var wc=md.content?md.content.split(/\s+/).length:0;
var ti=el('span','font-weight:600;font-size:13px','PageCapture v'+V);
var hi=el('span','font-size:11px;color:#aaa;margin-left:8px',wc.toLocaleString()+' words'+(md.truncated||htm.truncated?' | truncated':''));
if(md.truncated||htm.truncated)hi.style.color='#f59e0b';
var cb=el('button','background:transparent;border:none;color:#f0f0f0;cursor:pointer;font-size:18px;line-height:1;padding:0 4px','\u00d7');
cb.onclick=function(){ov.remove()};
hd.appendChild(ti);hd.appendChild(hi);hd.appendChild(cb);
ov.appendChild(hd);

if(shift){var bn=el('div','padding:4px 12px;background:#991b1b;color:#fca5a5;font-size:11px;font-weight:600;text-align:center','UNREDACTED \u2014 output may contain credentials');ov.appendChild(bn)}

var errs=[];if(md.error)errs.push('MD: '+md.error);if(htm.error)errs.push('HTML: '+htm.error);if(elems.error)errs.push('Elements: '+elems.error);
if(errs.length){var eb=el('div','padding:4px 12px;background:#7f1d1d;color:#fca5a5;font-size:11px','Errors: '+errs.join('; '));ov.appendChild(eb)}

var tb=el('div','display:flex;border-bottom:1px solid #444;background:#1a1a1a');
var tabs=['Markdown','Page Info','Full JSON'],tbs=[],contents=[md.content||'(empty)',infoJ,fullJ];
var ta=el('textarea','flex:1;margin:0;padding:8px 12px;resize:none;min-height:200px;font:11px/1.4 monospace;background:#0a0a0a;color:#e0e0e0;border:none;outline:none');

function sat(idx){tbs.forEach(function(b,i){b.style.background=i===idx?'#333':'transparent';b.style.color=i===idx?'#fff':'#888';b.style.borderBottom=i===idx?'2px solid #3b82f6':'2px solid transparent'});ta.value=contents[idx];ta.dataset.t=idx}
tabs.forEach(function(lb,i){var b=el('button','flex:1;padding:6px 0;border:none;cursor:pointer;font:12px inherit;background:transparent;color:#888;border-bottom:2px solid transparent',lb);b.onclick=function(){sat(i)};tbs.push(b);tb.appendChild(b)});
ov.appendChild(tb);ov.appendChild(ta);

var ft=el('div','display:flex;gap:6px;padding:8px 12px;border-top:1px solid #444;background:#1a1a1a;border-radius:0 0 8px 8px;flex-wrap:wrap;align-items:center');
function mb(t,bg,fn){var b=el('button','background:'+bg+';border:none;color:#fff;padding:5px 10px;border-radius:4px;cursor:pointer;font-size:11px',t);b.onclick=fn;return b}
function cp(t){if(_cw)_cw(t).catch(function(){});else{ta.select();document.execCommand('copy')}}
function dl(c,f,m){var b=new _B([c],{type:m}),u=_co(b),a=el('a');a.href=u;a.download=f;document.body.appendChild(a);a.click();setTimeout(function(){document.body.removeChild(a);_ro(u)},100)}
var fn=(location.hostname+location.pathname).replace(/[\/\\]/g,'_').replace(/_$/,'')||'page';
ft.appendChild(mb('Copy MD','#2563eb',function(){cp(md.content||'')}));
ft.appendChild(mb('Copy JSON','#7c3aed',function(){cp(parseInt(ta.dataset.t||'0')===1?infoJ:fullJ)}));
ft.appendChild(mb('DL .md','#059669',function(){dl(md.content||'',fn+'.md','text/markdown')}));
ft.appendChild(mb('DL .json','#d97706',function(){dl(fullJ,fn+'.json','application/json')}));
if(htm.redactedCount>0)ft.appendChild(el('span','font-size:10px;color:#888;margin-left:auto',htm.redactedCount+' redacted'));
ov.appendChild(ft);
document.body.appendChild(ov);sat(0);

if(_cw)_cw(md.content||'').catch(function(){});
console.log(L,'Done');
})(typeof event!=='undefined'?event:null);
