# WebAtlas · 好用的互联网

工作、学习、数字生活。按用途找到值得反复打开的网站与 App。

**[打开 WebAtlas](https://frankwang98.asia/webnav/)** · [推荐 / 纠错](https://github.com/frankwang98/webnav/issues/new/choose)

- 主搜索框支持网址直达和 Google 搜索；目录支持站内搜索、分类、精选、App 与本地收藏。主题自动跟随系统明暗设置。
- 原有 24 个条目中，6 个待确认条目已按维护者决定删除，继续保留 18 个。后续检查异常仍进入“待确认”。
- 内网入口标注“仅内网”，不从公网探测，不当作失效。
- 新增精选：Obsidian、Bitwarden、LocalSend、DeepL；Wikipedia、YouTube、TikTok、抖音、科技lion、Internet Archive、Google 翻译。官方来源记录在条目中。
- 无前端框架与第三方字体；网站图标使用 Google favicon 服务（只发送站点源，不发送路径与查询参数）。关闭 JavaScript 仍可打开默认目录的网址。

## 我的网址与备份

默认目录由维护者管理。使用者可点击“添加网址”保存个人条目，并编辑、删除、分类和收藏；这些改动只保存在当前站点、当前浏览器的 localStorage，不上传服务器，也不改变默认目录。

“导出我的数据”下载包含个人网址与收藏的 WebAtlas JSON 备份。“导入”合并备份并按网址去重，不覆盖默认目录或已有个人数据。支持最多 500 个个人网址、2 MB 以内的备份；导入会验证格式与 HTTP/HTTPS 网址。清理浏览器数据会丢失本地条目，换设备前请导出备份。

随机探索使用独立的 `data/discovery.json`，覆盖互动教程、娱乐与创意网站，不从默认目录重复抽取。按使用者本地日期选择当天网站，“换一个”随机切换且不连续重复。修改该文件后同样运行构建脚本。

## 如何维护

内容源文件是 `data/links.json`，修改后执行：

```sh
python3 -m pip install -r requirements.txt
python3 scripts/build.py
python3 -m http.server 8000
```

访问 `http://localhost:8000`。把内容数据与生成的 `index.html`、`data/catalog.json` 一起提交。页面使用相对路径，支持 GitHub Pages 项目子目录；仓库名仍保留 `webnav`。

条目字段：`id`（稳定唯一）、`name`、`url`（原始链接）、`description`、`category`、`kind`（网站/App）、`source`（legacy/curated）、`featured`、`status`、`note`。新增工具填写 `verified_source` 与 `editorial_date`，优先官方入口，避免重复。

## 链接诊断与人工决定

```sh
python3 scripts/check_links.py
python3 scripts/build.py
```

检查结果保存在 `data/health.json`，记录时间、HTTP 状态、跳转终点和原因。HTTP 成功只表示可达，不证明内容质量。超时、403、5xx 等只标记待确认，**不自动删除、替换或更改原 URL**。内网地址和跳转到非公网的目标跳过。

Actions 的 **WebAtlas maintenance** 自动校验数据与构建结果；手动运行可下载新的诊断报告，不自动修改仓库。确认报告后才更新数据与首页。若要人工保留某异常条目，可在对应 health 记录中设置 `status: unchecked` 并在 `detail` 说明决定；下一次自动报告仍可能重新提示。

## 保留与迁移

`legacy-index.html` 是此次整理前的首页快照。原有历史文章、资源和许可证继续保留；新首页不依赖旧版 Hexo 运行库。当前 Pages 发布方式沿用已有配置，本次没有变更仓库名或域名。

原版基于 [WebStack](https://github.com/WebStackPage/WebStackPage.github.io) / [hexo-theme-webstack](https://github.com/HCLonely/hexo-theme-webstack)。

## 双面工作空间

正面提供搜索入口与网址导航，点击顶部“数字工具库”翻转到 README 式的个人数字工具长文记录库，按分类、工具名称、简介和使用体验依次展开。支持 `#toolkit` 深链接、浏览器前进后退；`/` 聚焦正面搜索，`Alt + Shift + D` 翻转，背面 `Esc` 返回正面。跟随系统的减少动态效果设置。

工具记录维护在 `toolkit/README.md`，可填写平台、使用状态与个人心得；它与默认网址目录、浏览者本地收藏分别维护。不要直接修改生成的 `index.html`。结构和维护约定见 [架构说明](docs/architecture.md)。


工具记录现以 `toolkit/README.md` 为唯一内容源。直接使用 Markdown 标题、段落、列表、引用、代码块和表格编写使用体验。首次构建先运行 `python3 -m pip install -r requirements.txt`，再运行 `python3 scripts/build.py`；背面在构建时渲染，不依赖浏览器运行 Markdown 解析器。

## 本地自动更新预览

首次运行：

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python scripts/dev.py
```

打开 `http://127.0.0.1:8001/#toolkit`，编辑并保存 `toolkit/README.md` 后约一秒自动构建、刷新，保留背面和阅读位置。模板、数据、CSS 和 JS 修改也会触发更新。构建失败时页面显示错误，修正后继续保存即可恢复。这个命令用于本地预览；发布仍使用构建后的静态文件。可用 `--port 8002` 指定其他端口，按 Ctrl+C 停止。
