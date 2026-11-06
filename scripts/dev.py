"""Local preview: rebuild source changes and reload connected browsers."""
import argparse
import hashlib
import json
import pathlib
import subprocess
import sys
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = pathlib.Path(__file__).resolve().parents[1]
STATE = {'revision': '', 'error': ''}
LOCK = threading.Lock()
STOP = threading.Event()


def fingerprint():
    paths = [ROOT / 'index.template.html', ROOT / 'requirements.txt']
    for folder, suffixes in [('data', {'.json'}), ('toolkit', {'.md'}), ('scripts', {'.py'})]:
        paths.extend(x for x in (ROOT / folder).rglob('*') if x.suffix in suffixes and x.name != 'catalog.json')
    paths.extend(x for x in ROOT.iterdir() if x.suffix in {'.css', '.js', '.svg'})
    digest = hashlib.sha256()
    for path in sorted(paths):
        digest.update(str(path.relative_to(ROOT)).encode())
        digest.update(path.read_bytes() if path.exists() else b'')
    return digest.hexdigest()


def rebuild(revision):
    result = subprocess.run([sys.executable, str(ROOT / 'scripts/build.py')], cwd=ROOT, capture_output=True, text=True)
    with LOCK:
        STATE['error'] = (result.stderr or result.stdout)[-3000:] if result.returncode else ''
        if not result.returncode:
            STATE['revision'] = revision
    print(result.stderr if result.returncode else 'Rebuilt; browser preview updated.', flush=True)


def watch(initial):
    previous = initial
    while not STOP.wait(.4):
        try:
            current = fingerprint()
            if current == previous:
                continue
            # Wait until editor writes have settled before rebuilding.
            if STOP.wait(.2):
                break
            if current != fingerprint():
                continue
            rebuild(current)
            previous = current
        except OSError as error:
            print('Waiting for source files:', error, flush=True)


RELOAD_SCRIPT = r'''<script>
(() => {
  let revision = __REVISION__;
  const saved = sessionStorage.getItem('webnav:preview-scroll');
  if (saved) { sessionStorage.removeItem('webnav:preview-scroll');
    try { const position=JSON.parse(saved); if(position.url===location.href) addEventListener('load',()=>scrollTo(0,position.y),{once:true}); } catch {} }
  async function poll() {
    try {
      const response = await fetch('/__webnav_dev', {cache:'no-store'});
      const state = await response.json();
      let error = document.getElementById('webnav-dev-error');
      if(state.error) {
        if(!error) { error=document.createElement('pre'); error.id='webnav-dev-error'; error.style.cssText='position:fixed;bottom:16px;left:16px;right:16px;z-index:99999;background:#321a1a;color:#fff;padding:20px;white-space:pre-wrap;max-height:40vh;overflow:auto;border:1px solid #e88;border-radius:12px'; document.body.append(error); }
        error.textContent='构建失败，修正并保存后会自动重试：\n'+state.error;
      } else {
        error?.remove();
        if(state.revision!==revision) {
          sessionStorage.setItem('webnav:preview-scroll',JSON.stringify({url:location.href,y:scrollY}));
          location.reload(); return;
        }
      }
    } catch {} finally { setTimeout(poll,600); }
  }
  setTimeout(poll,600);
})();
</script>'''


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        route = self.path.split('?', 1)[0]
        if route == '/__webnav_dev':
            with LOCK:
                body = json.dumps(STATE).encode()
            mime = 'application/json'
        elif route in ('/', '/index.html'):
            # Read the generated file with its matching revision, avoiding reload loops.
            with LOCK:
                body = (ROOT / 'index.html').read_text()
                script = RELOAD_SCRIPT.replace('__REVISION__', json.dumps(STATE['revision']))
            body = body.replace('</body>', script + '</body>').encode()
            mime = 'text/html; charset=utf-8'
        else:
            return super().do_GET()
        self.send_response(200)
        self.send_header('Content-Type', mime)
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def log_message(self, format, *args):
        if not self.path.startswith('/__webnav_dev'):
            super().log_message(format, *args)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8001)
    args = parser.parse_args()
    initial = fingerprint()
    rebuild(initial)
    if STATE['error']:
        sys.exit(1)
    server = ThreadingHTTPServer(('127.0.0.1', args.port), Handler)
    threading.Thread(target=watch, args=(initial,), daemon=True).start()
    print(f'Live preview: http://127.0.0.1:{args.port}/#toolkit', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        STOP.set()
        server.server_close()
