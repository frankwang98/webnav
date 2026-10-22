
'use strict';
(() => {
const root=document.documentElement;
const langKey='webatlas:language:v3',bgKey='webatlas:background:v3';
const dict={
 zh:{directory:'网址目录',hero:'今天想打开哪里？',search:'搜索 Google，或输入网址…',hint:'输入 github.com 直接打开 · 输入关键词使用 Google 搜索',quick:'快速入口',quickNote:'常用网站，一步直达。',pinned:'收藏后自动置顶',discover:'发现与创造',project:'我的项目',explore:'随机探索 · 今天的网站',next:'换一个 ↻',catalog:'网址目录',catalogNote:'需要时再展开探索，不打扰第一眼体验。',add:'＋ 添加网址',export:'导出我的数据',import:'导入',searchDirectory:'搜索网站、工具或关键词…',background:'背景设置',backgroundHint:'选择渐变背景，或上传自己的图片。图片仅保存在此浏览器。',aurora:'极光',sky:'天空',minimal:'极简',upload:'上传本地图片',reset:'恢复默认背景',kicker:'YOUR WINDOW TO THE WEB',all:'全部',featured:'精选',apps:'App',saved:'我的收藏',review:'待确认',change:'更换背景',tooLarge:'图片不能超过 5 MB。',badFile:'请选择 JPG、PNG、WebP 或 AVIF 图片。',saveFailed:'保存失败，请检查浏览器存储权限。',savedImage:'已保存背景图片。',resetDone:'已恢复默认背景。'},
 en:{directory:'Directory',hero:'Where to today?',search:'Search Google or enter a website…',hint:'Enter github.com to open a site · Search anything with Google',quick:'Quick access',quickNote:'Your favorite places, one click away.',pinned:'Pin favorites to the top',discover:'Discover & create',project:'My project',explore:'Explore · Site of the day',next:'Another ↻',catalog:'Website directory',catalogNote:'Browse when you need it, without the clutter.',add:'＋ Add website',export:'Export my data',import:'Import',searchDirectory:'Search websites, tools, or keywords…',background:'Background',backgroundHint:'Choose a gradient or upload your own image. Stored only in this browser.',aurora:'Aurora',sky:'Sky',minimal:'Minimal',upload:'Upload an image',reset:'Restore default',kicker:'YOUR WINDOW TO THE WEB',all:'All',featured:'Featured',apps:'Apps',saved:'Saved',review:'Review',change:'Change background',tooLarge:'Image must be 5 MB or less.',badFile:'Choose a JPG, PNG, WebP, or AVIF image.',saveFailed:'Unable to save. Check browser storage permissions.',savedImage:'Background saved.',resetDone:'Default background restored.'}
};
let language='zh';
try{language=localStorage.getItem(langKey)||(/^(zh)(-|$)/i.test(navigator.language)?'zh':'en')}catch{language=/^(zh)(-|$)/i.test(navigator.language)?'zh':'en'}
if(!dict[language])language='en';
const targets=[
 ['.site-header nav a[href="#directory"]','directory'],['#hero-title','hero'],['.search-hint','hint'],['#quick-title','quick'],['#quick-note','quickNote'],['.v3-shortcuts .section-meta','pinned'],['#project-title','discover'],['.discovery-item:first-child .discovery-label','project'],['.discovery-item:last-child .discovery-label','explore'],['#explore-next','next'],['#section-title','catalog'],['.directory .section-heading p','catalogNote'],['#add-link','add'],['#export-links','export'],['#import-trigger','import']
];
function applyLanguage(){
 root.lang=language==='zh'?'zh-CN':'en';
 const t=dict[language];
 for(const [selector,key] of targets){const el=document.querySelector(selector);if(el)el.textContent=t[key]}
 document.querySelector('#web-query').placeholder=t.search;
 document.querySelector('#search').placeholder=t.searchDirectory;
 document.querySelector('#background-toggle').title=t.change;
 document.querySelector('#background-toggle').setAttribute('aria-label',t.change);
 document.querySelector('#language-toggle').textContent=language==='zh'?'EN':'中文';
 document.querySelectorAll('[data-i18n]').forEach(el=>{el.textContent=t[el.dataset.i18n]||el.textContent});
 const labels={all:t.all,featured:t.featured,apps:t.apps,saved:t.saved,review:t.review};
 document.querySelectorAll('[data-view]').forEach(btn=>{const key=btn.dataset.view;if(labels[key])btn.textContent=labels[key]+(key==='review'?' · '+document.querySelectorAll('.card[data-status="review"]').length:'')});
 const now=new Date();document.querySelector('#today-label').textContent=new Intl.DateTimeFormat(language==='zh'?'zh-CN':'en-US',{month:'long',day:'numeric',weekday:'long'}).format(now);
 document.title=language==='zh'?'WebAtlas · 好用的互联网':'WebAtlas · Your internet launcher';
}
document.querySelector('#language-toggle').addEventListener('click',()=>{language=language==='zh'?'en':'zh';try{localStorage.setItem(langKey,language)}catch{}applyLanguage()});
applyLanguage();
// IndexedDB stores the actual uploaded image, avoiding localStorage quota and network uploads.
const dbName='webatlas-backgrounds',store='images';
function database(){return new Promise((resolve,reject)=>{if(!('indexedDB' in window)){reject(Error('Unavailable'));return}const req=indexedDB.open(dbName,1);req.onupgradeneeded=()=>req.result.createObjectStore(store);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
async function dbAction(mode,fn){const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction(store,mode),req=fn(tx.objectStore(store));req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);tx.oncomplete=()=>db.close();tx.onerror=()=>reject(tx.error)})}
let imageUrl=null;
function setBackground(mode,blob){
 if(imageUrl){URL.revokeObjectURL(imageUrl);imageUrl=null}
 root.dataset.bg=mode;
 if(mode==='photo'&&blob){imageUrl=URL.createObjectURL(blob);root.style.setProperty('--v3-photo','url("'+imageUrl+'")')}else root.style.removeProperty('--v3-photo');
 document.querySelectorAll('[data-bg]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.bg===mode)));
}
async function loadBackground(){
 let mode='aurora';try{mode=localStorage.getItem(bgKey)||'aurora'}catch{}
 if(mode==='photo'){try{const blob=await dbAction('readonly',s=>s.get('photo'));if(blob){setBackground('photo',blob);return}}catch{}mode='aurora'}
 setBackground(['aurora','sky','minimal'].includes(mode)?mode:'aurora');
}
const dialog=document.querySelector('#v3-settings'),message=document.querySelector('#v3-bg-message');
document.querySelector('#background-toggle').addEventListener('click',()=>dialog.showModal());
document.querySelectorAll('[data-bg]').forEach(button=>button.addEventListener('click',()=>{const mode=button.dataset.bg;setBackground(mode);try{localStorage.setItem(bgKey,mode)}catch{}message.textContent=''}));
document.querySelector('#v3-upload').addEventListener('change',async event=>{
 const file=event.target.files?.[0];if(!file)return;
 const t=dict[language];if(!['image/jpeg','image/png','image/webp','image/avif'].includes(file.type)){message.textContent=t.badFile;return}
 if(file.size>5*1024*1024){message.textContent=t.tooLarge;return}
 try{await dbAction('readwrite',s=>s.put(file,'photo'));setBackground('photo',file);localStorage.setItem(bgKey,'photo');message.textContent=t.savedImage}
 catch{message.textContent=t.saveFailed}
 event.target.value='';
});
document.querySelector('#v3-reset').addEventListener('click',async()=>{
 setBackground('aurora');try{localStorage.removeItem(bgKey);await dbAction('readwrite',s=>s.delete('photo'))}catch{}message.textContent=dict[language].resetDone
});
loadBackground();
})();
