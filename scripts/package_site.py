"""Package generated output and public assets, excluding source and dev files."""
from pathlib import Path
import shutil

root = Path(__file__).resolve().parents[1]
out = root / 'dist'
if out.exists():
    shutil.rmtree(out)
out.mkdir()
# Explicit public entry points; archived pages and build sources are never published.
for name in ['index.html', 'atlas.svg']:
    shutil.copy2(root / name, out / name)
shutil.copytree(root / 'assets', out / 'assets')
if (root / 'CNAME').exists():
    shutil.copy2(root / 'CNAME', out / 'CNAME')
(out / 'data').mkdir()
shutil.copy2(root / 'data/catalog.json', out / 'data/catalog.json')
(out / '.nojekyll').touch()
assert (out / 'index.html').exists()
print('Packaged static site in dist/')
