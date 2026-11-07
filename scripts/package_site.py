"""Package generated output and public assets, excluding source and dev files."""
from pathlib import Path
import shutil

root = Path(__file__).resolve().parents[1]
out = root / 'dist'
if out.exists():
    shutil.rmtree(out)
out.mkdir()
for item in root.iterdir():
    if item.is_file() and (item.suffix in {'.html', '.css', '.js', '.svg', '.ico'} and item.name != 'index.template.html' or item.name == 'CNAME'):
        shutil.copy2(item, out / item.name)
for name in ['assets', 'images', 'css', 'js', '2022', '2023', 'about', 'archives', 'categories', 'link', 'tags']:
    if (root / name).is_dir():
        shutil.copytree(root / name, out / name)
(out / 'data').mkdir()
shutil.copy2(root / 'data/catalog.json', out / 'data/catalog.json')
(out / '.nojekyll').touch()
assert (out / 'index.html').exists()
print('Packaged static site in dist/')
