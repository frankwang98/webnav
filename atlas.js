'use strict';
const cards=[...document.querySelectorAll('.card')],search=document.querySelector('#search');
let category='全部',view='all',saved=new Set();
try{const value=JSON.parse(localStorage.getItem('webatlas:saved')||'[]');if(Array.isArray(value))saved=new Set(value);}catch{}
function render(){let count=0;const query=search.value.trim().toLowerCase();for(const c of cards){const id=c.dataset.id;const eligible=(category==='全部'||c.dataset.category===category)&&(!query||c.dataset.search.includes(query))&&(view==='all'||view==='featured'&&c.dataset.featured==='true'||view==='apps'&&c.dataset.kind==='App'||view==='saved'&&saved.has(id)||view==='review'&&c.dataset.status==='review');c.hidden=!eligible;if(eligible)count++;const b=c.querySelector('.save');b.textContent=saved.has(id)?'★':'☆';b.setAttribute('aria-pressed',String(saved.has(id)));}document.querySelector('#result-count').textContent=`${count} 个条目`;document.querySelector('#empty').hidden=count>0;document.querySelector('#section-title').textContent=view==='review'?'待确认 · 由你定夺':category==='全部'?'网址目录':category;document.querySelector('#view-note').textContent=view==='review'?'仅代表本次检查异常，可能涉及反爬、登录或网络限制；未删除任何链接。点击“检查说明”查看原因。':'收藏保存在当前浏览器中。';document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));document.querySelectorAll('#categories button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===category)));}
search.addEventListener('input',render);
document.querySelector('#categories').addEventListener('click',e=>{const b=e.target.closest('button');if(b){category=b.dataset.category;view='all';render();}});
document.querySelector('.filters').addEventListener('click',e=>{const b=e.target.closest('button');if(b){view=b.dataset.view;category='全部';render();}});
document.querySelector('.grid').addEventListener('click',e=>{const b=e.target.closest('.save');if(!b)return;const id=b.closest('.card').dataset.id;saved.has(id)?saved.delete(id):saved.add(id);try{localStorage.setItem('webatlas:saved',JSON.stringify([...saved]));}catch{}render();});
document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){e.preventDefault();search.focus();}if(e.key==='Escape'&&document.activeElement===search){search.value='';render();}});
// Start with the complete compact directory.
render();
