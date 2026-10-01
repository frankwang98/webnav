'use strict';
const root=document.documentElement;
const search=document.querySelector('#search');
const webQuery=document.querySelector('#web-query');
const launcher=document.querySelector('#launcher');
const cards=[...document.querySelectorAll('.card')];
const suggestions=document.querySelector('#search-results');
const quickGrid=document.querySelector('#quick-grid');
const defaultQuick=[...quickGrid.children].map(link=>link.cloneNode(true));
let category='全部',view='all',saved=new Set();
try{const value=JSON.parse(localStorage.getItem('webatlas:saved')||'[]');if(Array.isArray(value))saved=new Set(value);}catch{}

(function initTheme(){
  const key='fw.theme',button=document.querySelector('.theme-toggle');
  let theme='system';
  try{const stored=localStorage.getItem(key);if(stored==='light'||stored==='dark')theme=stored;}catch{}
  function apply(value){
    if(value==='system')root.removeAttribute('data-theme');else root.setAttribute('data-theme',value);
    button.title='主题：'+({system:'跟随系统',light:'浅色',dark:'深色'}[value])+'，点击切换';
    button.setAttribute('aria-label',button.title);
  }
  apply(theme);
  button.addEventListener('click',()=>{
    theme=theme==='system'?'light':theme==='light'?'dark':'system';apply(theme);
    try{localStorage.setItem(key,theme);}catch{}
  });
  window.addEventListener('storage',event=>{
    if(event.key===key){theme=event.newValue==='light'||event.newValue==='dark'?event.newValue:'system';apply(theme);}
  });
})();

(function initDate(){
  const label=document.querySelector('#today-label');
  const clock=document.querySelector('#clock');
  const updateClock=()=>clock.textContent=new Intl.DateTimeFormat('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date());
  try{
    label.textContent=new Intl.DateTimeFormat('zh-CN',{month:'long',day:'numeric',weekday:'long'}).format(new Date());
  }catch{}
  updateClock();setInterval(updateClock,30000);
})();

function labelFor(card){return card.querySelector('h3').textContent.replace('↗','').trim();}
function destinationFor(card){return card.querySelector('.destination');}
function iconFor(url,name){
  const icon=document.createElement('span');icon.className='quick-icon';
  const image=document.createElement('img');
  image.src='https://www.google.com/s2/favicons?domain_url='+encodeURIComponent(url)+'&sz=128';
  image.alt='';image.width=28;image.height=28;image.loading='lazy';image.referrerPolicy='no-referrer';
  const fallback=document.createElement('span');fallback.className='icon-fallback';fallback.textContent=name[0]?.toUpperCase()||'?';
  image.addEventListener('error',()=>{image.hidden=true;fallback.style.display='grid';});
  icon.append(image,fallback);return icon;
}
function renderQuick(){
  const favorites=cards.filter(card=>saved.has(card.dataset.id)).slice(0,8);
  if(!favorites.length){
    quickGrid.replaceChildren(...defaultQuick.map(link=>link.cloneNode(true)));
    document.querySelector('#quick-note').textContent='收藏常用网址后，这里会显示你的入口。';
    return;
  }
  const links=favorites.map(card=>{
    const target=destinationFor(card),name=labelFor(card);
    const link=document.createElement('a');link.className='quick-link';
    link.href=target.href;link.target='_blank';link.rel='noopener noreferrer';link.title=name;
    const title=document.createElement('span');title.className='quick-name';title.textContent=name;
    link.append(iconFor(target.href,name),title);return link;
  });
  quickGrid.replaceChildren(...links);
  document.querySelector('#quick-note').textContent='你收藏的网站，随时从这里打开。';
}
// Deterministic daily pick in the viewer's local timezone; never opens a site automatically.
(function initExplore(){
  const pool=cards.filter(card=>{
    const url=new URL(destinationFor(card).href);
    const host=url.hostname.toLowerCase();
    return card.dataset.featured==='true'&&card.dataset.status==='reachable'
      &&card.dataset.category!=='我的项目'&&!card.dataset.id.startsWith('my-')
      &&url.protocol==='https:'&&!/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)
      &&host.includes('.')&&!host.endsWith('.local');
  });
  if(!pool.length)return;
  const now=new Date(),day=[now.getFullYear(),now.getMonth()+1,now.getDate()].join('-');
  let seed=0;
  for(const char of day)seed=(seed*31+char.charCodeAt(0))>>>0;
  let index=seed%pool.length;
  function show(){
    const card=pool[index],url=destinationFor(card).href,name=labelFor(card);
    document.querySelector('#explore-link').href=url;
    document.querySelector('#explore-name').textContent=name;
    document.querySelector('#explore-description').textContent=card.querySelector(':scope > p:not(.note)')?.textContent||card.dataset.category;
    document.querySelector('#explore-icon').replaceWith(Object.assign(iconFor(url,name),{id:'explore-icon'}));
  }
  const next=document.querySelector('#explore-next');next.hidden=pool.length<2;
  next.addEventListener('click',()=>{
    index=(index+1+Math.floor(Math.random()*(pool.length-1)))%pool.length;
    show();
  });
  show();
})();
function renderSuggestions(){
  const query=search.value.trim().toLowerCase();
  suggestions.replaceChildren();
  if(!query){suggestions.hidden=true;return;}
  const matches=cards.filter(card=>card.dataset.search.includes(query)).slice(0,6);
  if(!matches.length){
    const empty=document.createElement('div');empty.className='suggestion-empty';
    empty.textContent='没有匹配的网址，切换到 Google 搜索试试。';suggestions.append(empty);
  }
  for(const card of matches){
    const link=document.createElement('a'),name=document.createElement('span'),group=document.createElement('small');
    link.href=destinationFor(card).href;link.target='_blank';link.rel='noopener noreferrer';
    name.textContent=labelFor(card);group.textContent=card.dataset.category;
    link.append(name,group);suggestions.append(link);
  }
  suggestions.hidden=false;
}
function render(){
  const query=search.value.trim().toLowerCase();let count=0;
  for(const card of cards){
    const eligible=(category==='全部'||card.dataset.category===category)
      &&(!query||card.dataset.search.includes(query))
      &&(view==='all'||view==='featured'&&card.dataset.featured==='true'
        ||view==='apps'&&card.dataset.kind==='App'
        ||view==='saved'&&saved.has(card.dataset.id)
        ||view==='review'&&card.dataset.status==='review');
    card.hidden=!eligible;if(eligible)count++;
    const button=card.querySelector('.save');
    button.textContent=saved.has(card.dataset.id)?'★':'☆';
    button.setAttribute('aria-pressed',String(saved.has(card.dataset.id)));
  }
  document.querySelector('#result-count').textContent=count+' 个条目';
  document.querySelector('#empty').hidden=count>0;
  document.querySelector('#section-title').textContent=view==='review'?'待确认':category==='全部'?'探索网址':category;
  const note=document.querySelector('#view-note');
  note.hidden=view!=='saved'&&view!=='review';
  note.textContent=view==='review'?'仅代表检查异常，可能涉及登录或网络限制；点击卡片中的“检查说明”查看原因。':'收藏保存在当前浏览器中。';
  document.querySelectorAll('[data-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.view===view)));
  document.querySelectorAll('#categories button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.category===category)));
}
function isWebAddress(value){
  return /^(https?:\/\/)/i.test(value)||/^(localhost|\d{1,3}(\.\d{1,3}){3})(:\d+)?(\/.*)?$/i.test(value)||/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(value);
}
launcher.addEventListener('submit',event=>{
  event.preventDefault();
  const value=webQuery.value.trim();if(!value)return;
  const url=isWebAddress(value)?(/^https?:\/\//i.test(value)?value:'https://'+value):'https://www.google.com/search?q='+encodeURIComponent(value);
  window.open(url,'_blank','noopener,noreferrer');
});
search.addEventListener('input',()=>{render();renderSuggestions();});
search.addEventListener('focus',renderSuggestions);
document.addEventListener('click',event=>{
  if(!event.target.closest('.directory'))suggestions.hidden=true;
});
document.querySelector('#categories').addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  category=button.dataset.category;view='all';render();
});
document.querySelector('.filters').addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  view=button.dataset.view;category='全部';render();
});
document.querySelector('.grid').addEventListener('click',event=>{
  const button=event.target.closest('.save');if(!button)return;
  const id=button.closest('.card').dataset.id;
  saved.has(id)?saved.delete(id):saved.add(id);
  try{localStorage.setItem('webatlas:saved',JSON.stringify([...saved]));}catch{}
  render();renderQuick();
});
document.addEventListener('keydown',event=>{
  if(event.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){
    event.preventDefault();webQuery.focus();
  }
  if(event.key==='Escape'&&document.activeElement===search){
    search.value='';suggestions.hidden=true;render();
  }
});
window.addEventListener('storage',event=>{
  if(event.key!=='webatlas:saved')return;
  try{const value=JSON.parse(event.newValue||'[]');saved=new Set(Array.isArray(value)?value:[]);}catch{saved=new Set();}
  render();renderQuick();
});
render();renderQuick();
