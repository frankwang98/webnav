# WebNav · 个人网址导航

[在线访问](https://frankwang98.asia/webnav/) · [推荐网址 / 反馈问题](https://github.com/frankwang98/webnav/issues/new/choose)

正面是搜索与网址导航，背面是 Markdown 编写的个人数字工具记录库。点击顶部“数字工具库”即可翻转。

- Google 搜索、网址直达、目录搜索与分类浏览。
- 常用收藏、个人网址管理、JSON 导入导出。
- 明暗主题、自定义背景和随机探索。
- 工具使用体验以长文展示，保存 Markdown 即可在本地自动预览。

## 内容维护

| 文件 | 用途 |
| --- | --- |
| `toolkit/README.md` | 数字工具记录，直接写 Markdown 标题、段落、列表、表格和心得 |
| `data/links.json` | 默认网址目录，包括个人项目 |
| `data/discovery.json` | 随机探索网站 |
| `data/health.json` | 可选的链接诊断结果 |

**只维护和提交源文件，无需编辑或提交生成的 HTML。** 浏览者自己添加的网址与收藏保存在当前浏览器，不会写回仓库；清理浏览器数据或换设备前请导出备份。上传的背景图片保存在本地 IndexedDB。

## 本地预览

需要 Python 3.9+；首次安装依赖：

```sh
cd /Users/lemon/dev/webnav
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python scripts/dev.py
```

打开 <http://127.0.0.1:8001/>，背面地址为 <http://127.0.0.1:8001/#toolkit>。保存工具库 Markdown、目录数据、模板或前端资源后，自动构建并刷新页面。按 `Ctrl+C` 停止；端口被占用时用 `scripts/dev.py --port 8002`。

以后启动只需运行 `.venv/bin/python scripts/dev.py`。修改开发服务器脚本或依赖后需重启服务；修改依赖还需重新安装。

## 构建与发布

推送源文件到 `main` 后，GitHub Actions 自动执行构建、JS 语法检查、打包和 Pages 发布；PR 只构建，不发布。Pages 的 Source 应选择 **GitHub Actions**。

本地检查发布产物：

```sh
.venv/bin/python scripts/build.py
.venv/bin/python scripts/package_site.py
node --check assets/js/atlas.js
node --check assets/js/v3.js
node --check assets/js/workspace.js
```

生成的 `index.html`、`data/catalog.json` 和 `dist/` 已被 Git 忽略。发布使用 `dist/`，不向仓库自动写回产物。Node.js 仅用于语法检查，CI 使用 Node.js 22、Python 3.12。

链接诊断按需运行 `.venv/bin/python scripts/check_links.py`，结果需人工确认；联网检查不阻断发布，也不会自动删除网址。

## 项目结构与技术

```text
assets/css/          页面样式
assets/js/           原生 JavaScript 交互
atlas.svg           站点图标
index.template.html 页面模板
requirements.txt    Python 构建依赖
toolkit/README.md   个人数字工具记录
data/               网址、探索与诊断数据
scripts/            构建、开发预览、打包和链接诊断
.github/workflows/  自动构建与发布
docs/architecture.md 架构说明
```

采用 HTML、CSS、原生 JavaScript、Python 和 Python-Markdown，无前端框架或服务端数据库；GitHub Pages 提供静态托管。网站图标使用 Google favicon 服务。更多职责说明见 [架构说明](docs/architecture.md)。

## 项目历史

本站原为 Hexo 主题 [hexo-theme-webstack](https://github.com/HCLonely/hexo-theme-webstack) 的二次开发站。现已移除旧博客页面及专用资源，重构为独立静态导航站；工具记录库灵感来自 [pseudoyu/yu-tools](https://github.com/pseudoyu/yu-tools)。

[MIT License](LICENSE)
