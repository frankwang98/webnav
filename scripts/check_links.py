"""Public-link diagnostics only. Never deletes or rewrites links; skips private hosts."""
import concurrent.futures, datetime, ipaddress, json, pathlib, socket, urllib.request, urllib.error
ROOT=pathlib.Path(__file__).resolve().parents[1]
def public(url):
 from urllib.parse import urlparse
 p=urlparse(url)
 if p.scheme not in ('http','https') or not p.hostname:return False
 try:return all(ipaddress.ip_address(a[4][0]).is_global for a in socket.getaddrinfo(p.hostname,None))
 except OSError:return True
class Redirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,req,fp,code,msg,headers,url):
  if not public(url):raise ValueError('redirect to non-public host skipped')
  return super().redirect_request(req,fp,code,msg,headers,url)
def check(item):
 u=item['url']; result={'id':item['id'],'checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat()}
 if not public(u):return dict(result,status='internal',detail='仅内网可用；不从公共网络探测')
 try:
  req=urllib.request.Request(u,headers={'User-Agent':'WebAtlas-LinkCheck/1.0'},method='GET')
  with urllib.request.build_opener(Redirect()).open(req,timeout=12) as r:
   return dict(result,status='reachable',code=r.status,final_url=r.url,detail='HTTP 可达；不代表内容已人工审查')
 except urllib.error.HTTPError as e:return dict(result,status='review',code=e.code,detail=f'HTTP {e.code}；可能是登录、反爬或区域限制，待人工确认')
 except Exception as e:return dict(result,status='review',detail=f'{type(e).__name__}: {str(e)[:160]}；不据此判定失效')
if __name__=='__main__':
 items=json.loads((ROOT/'data/links.json').read_text())
 with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:results=list(pool.map(check,items))
 (ROOT/'data/health.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(results,ensure_ascii=False,indent=2))
