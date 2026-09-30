'use strict';
const root=document.documentElement;
const search=document.querySelector('#search');
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
  try{
    label.textContent=new Intl.DateTimeFormat('zh-CN',{month:'long',day:'numeric',weekday:'long'}).format(new Date());
  }catch{}
})();

function labelFor(card){return card.querySelector('h3').textContent.replace('↗','').trim();}
function destinationFor(card){return card.querySelector('.destination');}
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
    const icon=document.createElement('span');icon.className='quick-icon';icon.textContent=name[0]?.toUpperCase()||'?';
    const title=document.createElement('span');title.className='quick-name';title.textContent=name;
    link.append(icon,title);return link;
  });
  quickGrid.replaceChildren(...links);
  document.querySelector('#quick-note').textContent='你收藏的网站，随时从这里打开。';
}
function renderSuggestions(){
  const query=search.value.trim().toLowerCase();
  suggestions.replaceChildren();
  if(!query){suggestions.hidden=true;return;}
  const matches=cards.filter(card=>card.dataset.search.includes(query)).slice(0,6);
  if(!matches.length){
    const empty=document.createElement('div');empty.className='suggestion-empty';
    empty.textContent='没有匹配的网址，可试试右侧的 Google 搜索。';suggestions.append(empty);
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
search.addEventListener('input',()=>{render();renderSuggestions();});
search.addEventListener('focus',renderSuggestions);
document.addEventListener('click',event=>{
  if(!event.target.closest('.search-shell'))suggestions.hidden=true;
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
    event.preventDefault();search.focus();
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

