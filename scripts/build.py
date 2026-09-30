import json,pathlib,html,collections
p=pathlib.Path(__file__).resolve().parents[1];links=json.loads((p/'data/links.json').read_text());health={x['id']:x for x in json.loads((p/'data/health.json').read_text())}
assert len({x['id'] for x in links})==len(links)
for x in links:
 assert x['url'].startswith(('https://','http://'))
 h=health.get(x['id'],{});x['status']=h.get('status',x['status']);x['health']=h
# HTML carries all cards; script enhances filtering, so no JS still leaves links usable.
e=lambda s:html.escape(str(s),quote=True)
labels={'reachable':'HTTP 可达','review':'待确认','internal':'仅内网','unchecked':'未探测'}
cards=[]
for x in links:
 badge=labels[x['status']];note=x.get('note','');detail=x['health'].get('detail','')
 cards.append(f'''<article class="card" data-id="{e(x['id'])}" data-category="{e(x['category'])}" data-kind="{e(x['kind'])}" data-status="{e(x['status'])}" data-featured="{str(x['featured']).lower()}" data-search="{e((x['name']+' '+x['description']+' '+x['category']+' '+x['url']).lower())}"><div class="card-top"><span class="monogram">{e(x['name'][0].upper())}</span><span class="badge {e(x['status'])}" title="{e(detail)}">{badge}</span><button class="save" type="button" aria-label="收藏 {e(x['name'])}" aria-pressed="false">☆</button></div><a class="destination" title="{e(x['name'])}" href="{e(x['url'])}" target="_blank" rel="noopener noreferrer"><h3>{e(x['name'])} <span>↗</span></h3></a><p>{e(x['description'])}</p><div class="card-bottom"><span>{e(x['category'])} · {e(x['kind'])}</span><span>{'原有条目' if x['source']=='legacy' else '本次精选'}</span></div>{f'<p class="note">{e(note)}</p>' if note else ''}{f'<details><summary>检查说明</summary><p>{e(detail)}</p><small>{e(x["health"].get("checked_at",""))}</small></details>' if x['status']=='review' else ''}</article>''')
categories=list(dict.fromkeys(x['category'] for x in links))
nav=''.join(f'<button type="button" data-category="{e(c)}">{e(c)} <span>{sum(x["category"]==c for x in links)}</span></button>' for c in categories)
template=(p/'index.template.html').read_text();template=template.replace('{{CARDS}}','\n'.join(cards)).replace('{{CATEGORIES}}',nav).replace('{{COUNT}}',str(len(links))).replace('{{REVIEW}}',str(sum(x['status']=='review' for x in links)))
(p/'index.html').write_text(template)
(p/'data/catalog.json').write_text(json.dumps(links,ensure_ascii=False,indent=2)+'\n')
print(f'Built {len(links)} cards, legacy entries retained according to owner decisions; {sum(x["status"]=="review" for x in links)} need review.')
