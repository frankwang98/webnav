'use strict';
const root=document.documentElement;
const search=document.querySelector('#search');
const webQuery=document.querySelector('#web-query');
const launcher=document.querySelector('#launcher');
const cards=[...document.querySelectorAll('.card')];
const suggestions=document.querySelector('#search-results');
const quickGrid=document.querySelector('#quick-grid');
const defaultQuick=[...quickGrid.children].map(link=>link.cloneNode(true));
if('scrollRestoration' in history)history.scrollRestoration='manual';
window.addEventListener('pageshow',()=>{
  if(location.hash==='#directory')history.replaceState(null,'',location.pathname+location.search);
  window.scrollTo({top:0,left:0,behavior:'instant'});
});
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
  image.src='https://www.google.com/s2/favicons?domain_url='+encodeURIComponent(new URL(url).origin)+'&sz=128';
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
  const pool=JSON.parse(document.querySelector('#discovery-data').textContent);
  if(!pool.length)return;
  const now=new Date(),day=[now.getFullYear(),now.getMonth()+1,now.getDate()].join('-');
  let seed=0;
  for(const char of day)seed=(seed*31+char.charCodeAt(0))>>>0;
  let index=seed%pool.length;
  function show(){
    const {url,name,description}=pool[index];
    document.querySelector('#explore-link').href=url;
    document.querySelector('#explore-name').textContent=name;
    document.querySelector('#explore-description').textContent=description;
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
  document.querySelector('#section-title').textContent=view==='review'?'待确认':category==='全部'?'网址目录':category;
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
const personalKey='webatlas:personal:v1';
let personalLinks=[],editingId=null;
const baseCards=cards.slice(),dialog=document.querySelector('#link-dialog'),form=document.querySelector('#link-form');
for(const card of baseCards)card.querySelector('.monogram')?.replaceWith(iconFor(destinationFor(card).href,labelFor(card)));
document.querySelector('#import-trigger').addEventListener('click',()=>document.querySelector('#import-links').click());
function normalizePersonal(value){
  if(!value||typeof value!=='object')throw Error('网址条目格式不正确。');
  const name=String(value.name||'').trim(),category=String(value.category||'我的网址').trim();
  if(!name||name.length>80||!category||category.length>40)throw Error('请填写名称（80 字以内）和分类（40 字以内）。');
  let raw=String(value.url||'').trim();
  if(!raw||raw.length>2048)throw Error('请填写有效的网址。');
  if(!/^[a-z][a-z0-9+.-]*:/i.test(raw))raw='https://'+raw;
  const url=new URL(raw);
  if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw Error('只支持不包含账号密码的 HTTP / HTTPS 网址。');
  return {id:typeof value.id==='string'&&/^local-[\w-]+$/.test(value.id)?value.id:'local-'+crypto.randomUUID(),name,url:url.href,category,description:String(value.description||'').slice(0,300)};
}
function localMessage(text){const node=document.querySelector('#local-message');node.textContent=text;node.hidden=false;}
function readPersonal(){
  try{const value=JSON.parse(localStorage.getItem(personalKey)||'[]');if(!Array.isArray(value)||value.length>500)throw Error();personalLinks=value.map(normalizePersonal);}
  catch{personalLinks=[];localMessage('本地数据无法读取，请用备份导入恢复。');}
}
function persistPersonal(next){
  try{localStorage.setItem(personalKey,JSON.stringify(next));personalLinks=next;rebuildPersonal();return true;}
  catch{localMessage('保存失败：浏览器存储不可用或空间已满。');return false;}
}
function rebuildPersonal(){
  document.querySelectorAll('.card[data-local]').forEach(card=>card.remove());
  cards.splice(0,cards.length,...baseCards);
  const grid=document.querySelector('.grid');
  for(const item of personalLinks){
    const card=document.createElement('article');card.className='card';card.dataset.local='true';
    Object.assign(card.dataset,{id:item.id,category:item.category,kind:'网站',status:'unchecked',featured:'false',search:(item.name+' '+item.description+' '+item.category+' '+item.url).toLowerCase()});
    const top=document.createElement('div');top.className='card-top';
    const save=document.createElement('button');save.className='save';save.type='button';save.setAttribute('aria-label','收藏 '+item.name);
    top.append(iconFor(item.url,item.name),save);
    const link=document.createElement('a');link.className='destination';link.href=item.url;link.target='_blank';link.rel='noopener noreferrer';
    const title=document.createElement('h3');title.textContent=item.name;link.append(title);
    const description=document.createElement('p');description.textContent=item.description;
    const bottom=document.createElement('div');bottom.className='card-bottom';bottom.textContent=item.category+' · 我的网址';
    const actions=document.createElement('div');actions.className='personal-actions';
    for(const [action,label] of [['edit','编辑'],['delete','删除']]){const button=document.createElement('button');button.type='button';button.dataset.personalAction=action;button.textContent=label;actions.append(button);}
    card.append(top,link,description,bottom,actions);grid.append(card);cards.push(card);
  }
  const categories=[...new Set(cards.map(card=>card.dataset.category))];
  const nav=document.querySelector('#categories');nav.replaceChildren();
  for(const name of ['全部',...categories]){
    const button=document.createElement('button');button.type='button';button.dataset.category=name;
    button.textContent=name+' '+(name==='全部'?cards.length:cards.filter(card=>card.dataset.category===name).length);nav.append(button);
  }
  const options=document.querySelector('#category-options');options.replaceChildren();
  for(const name of categories){const option=document.createElement('option');option.value=name;options.append(option);}
  if(!categories.includes(category))category='全部';
  render();renderQuick();
}
function openEditor(item){
  editingId=item?.id||null;form.reset();
  for(const key of ['name','url','category','description'])form.elements[key].value=item?.[key]||(key==='category'?'我的网址':'');
  document.querySelector('#link-form-title').textContent=item?'编辑我的网址':'添加我的网址';
  document.querySelector('#form-error').textContent='';dialog.showModal();
}
document.querySelector('#add-link').addEventListener('click',()=>openEditor());
document.querySelector('#cancel-link').addEventListener('click',()=>dialog.close());
form.addEventListener('submit',event=>{
  event.preventDefault();
  try{
    const item=normalizePersonal({...Object.fromEntries(new FormData(form)),id:editingId});
    if(cards.some(card=>card.dataset.id!==editingId&&destinationFor(card).href===item.url))throw Error('这个网址已经在目录中了。');
    if(!editingId&&personalLinks.length>=500)throw Error('最多保存 500 个个人网址。');
    const next=editingId?personalLinks.map(x=>x.id===editingId?item:x):[...personalLinks,item];
    if(persistPersonal(next)){dialog.close();localMessage('已保存到此浏览器。');}
  }catch(error){document.querySelector('#form-error').textContent=error.message;}
});
document.querySelector('.grid').addEventListener('click',event=>{
  const button=event.target.closest('[data-personal-action]');if(!button)return;
  const id=button.closest('.card').dataset.id,item=personalLinks.find(x=>x.id===id);
  if(button.dataset.personalAction==='edit')openEditor(item);
  else if(confirm('删除“'+item.name+'”？默认目录不受影响。')){if(persistPersonal(personalLinks.filter(x=>x.id!==id))){saved.delete(id);try{localStorage.setItem('webatlas:saved',JSON.stringify([...saved]));}catch{}renderQuick();localMessage('已删除个人网址。');}}
});
document.querySelector('#export-links').addEventListener('click',()=>{
  const data={format:'webatlas',version:1,links:personalLinks,saved:[...saved]};
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download='webatlas-backup.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
document.querySelector('#import-links').addEventListener('change',async event=>{
  const file=event.target.files[0];if(!file)return;
  try{
    if(file.size>2*1024*1024)throw Error('备份文件不能超过 2 MB。');
    const data=JSON.parse(await file.text());
    if(data.format!=='webatlas'||data.version!==1||!Array.isArray(data.links)||data.links.length>500)throw Error('请选择 WebAtlas 导出的 JSON 备份。');
    const incoming=data.links.map(normalizePersonal),seen=new Set(cards.map(c=>destinationFor(c).href)),ids=new Set(personalLinks.map(x=>x.id)),next=personalLinks.slice();
    for(const item of incoming){if(seen.has(item.url))continue;if(ids.has(item.id))item.id='local-'+crypto.randomUUID();seen.add(item.url);ids.add(item.id);next.push(item);}
    if(next.length>500)throw Error('合并后超过 500 个个人网址。');
    if(!persistPersonal(next))return;
    if(Array.isArray(data.saved)){const valid=new Set(cards.map(c=>c.dataset.id));for(const id of data.saved)if(valid.has(id))saved.add(id);try{localStorage.setItem('webatlas:saved',JSON.stringify([...saved]));}catch{}}
    render();renderQuick();localMessage('已合并导入，重复网址自动跳过，默认目录保持不变。');
  }catch(error){localMessage('导入失败：'+error.message);}
  finally{event.target.value='';}
});
window.addEventListener('storage',event=>{if(event.key===personalKey){readPersonal();rebuildPersonal();}});
readPersonal();rebuildPersonal();
