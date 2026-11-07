# WebNav：入口与记录的双面设计

## 页面与信息层级

正面是日常启动页：搜索 / 网址直达 → 常用收藏 → 项目与随机探索 → 可搜索、可分类的网址目录。背面是站长维护的数字工具记录：README 式单栏长文：分类标题 → 工具标题与链接 → 简介 → 使用体验。顶部翻转按钮负责切换，`#toolkit` 可直接访问，浏览器前进后退同步视图。翻转保留正面滚动位置，隐藏视图不参与键盘焦点导航；减少动态效果时跳过动画。

## 数据与职责

| 文件 | 职责 |
| --- | --- |
| `data/links.json` | 公共网址目录 |
| `data/discovery.json` | 随机探索池 |
| `toolkit/README.md` | 站长的个人工具记录，独立于公共网址目录 |
| `index.template.html` | 页面结构与构建占位符 |
| `scripts/build.py` | 校验数据、转义文本、生成静态首页与 catalog |
| `assets/js/atlas.js` / `assets/css/atlas.css` | 网址目录、收藏、导入导出和基础主题 |
| `assets/js/v3.js` / `assets/css/v3.css` | 启动页、语言和背景设置 |
| `assets/js/workspace.js` / `assets/css/workspace.css` | 双面视图、长文排版与视觉调整 |
| `index.html` / `data/catalog.json` | 构建产物，不直接编辑 |

保留原有脚本职责与本地存储键，避免重构导致收藏或背景丢失。不引入前端运行时框架或数据库；构建阶段使用 Python-Markdown。所有工具记录在构建时输出为 HTML。

## 工具记录维护


修改 Markdown、目录 JSON 或模板后运行 `python3 scripts/build.py`。只提交源文件；CI 负责生成产物。公共目录、浏览者本地网址、站长工具记录各自独立；工具记录库是公开静态内容。

## 验证与后续

发布前检查构建可重复、JavaScript 语法、翻转/前进后退、长文内容与分段、窄屏和主题切换。后续优先补充真实使用记录；内容增多后可按需增加记录日期、替代关系或设备分类。


工具记录现以 `toolkit/README.md` 为唯一内容源。直接使用 Markdown 标题、段落、列表、引用、代码块和表格编写使用体验。首次构建先运行 `python3 -m pip install -r requirements.txt`，再运行 `python3 scripts/build.py`；背面在构建时渲染，不依赖浏览器运行 Markdown 解析器。

## 发布链路

Markdown / JSON → build.py → HTML / catalog → package_site.py → dist → Pages artifact → deploy-pages。开发预览与 CI 使用同一构建入口。生成文件不纳入版本控制，无需维护源文件与产物的双份一致性。PR 构建校验，main 部署；外链联网检查不参与发布。Pages Source 必须选择 GitHub Actions。
