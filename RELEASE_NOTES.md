# v1.1.2 · 致敬与来源

非官方社区补丁，**只支持指定 Windows T3 Code 0.1.12 原版构建**（原生提交 `ca81b7b97a1c`）。本版只更新文档与图集说明，补丁、payload 与哈希**未变化**。

## 这个项目是从哪来的

本项目是**改造**出来的，站在三个 MIT 开源项目上：

- **[T3 Code](https://github.com/pingdotgg/t3code)**（T3 Tools Inc.）— 宿主应用本体。只替换 `server.asar` 里的 10 个前端文件，后端字节与元数据不动。
- **[Leobai03/t3code-quota-ui](https://github.com/Leobai03/t3code-quota-ui)** v1.4.6 · `bc642365` — 「紧凑额度栏 / 底部状态栏」的思路、费用页货币 toolbar、按账户分池与 `shared` 共享池展示。其 MIT 源码作为固定输入被 AST 复用。
- **[nanami-0713/t3code](https://github.com/nanami-0713/t3code)** · `d1bb533d` — 底栏的轮次 / 工具次数 / 词元速度 / 缓存统计 UI 与算法。

本项目不执行上游 patcher、不分发其安装器，只复用 MIT 源码片段并针对 0.1.12 重新绑定锚点。逐项说明见仓库的 [致敬与来源](https://github.com/chengmignqi6-dot/t3code-quota-zh/blob/main/docs/CREDITS.md)。

## 图集

- 三张主图右下角标注了上游来源；README 增加「致敬与来源」表格。
- 12 张图（3 主图 + 1 总览 + 8 细节）均为 SVG + 高清 JPG，演示数据。

## 下载与校验

`t3code-quota-zh-1.1.2-windows.zip`，完整解压；`SHA256SUMS.txt` 用于校验。补丁目标哈希仍为 `21cb1a0ac7b5bb9e971e41b9e43f9d522ebd6ef421aad7f3d08cf462182970d8`。

**升级后不要使用旧补丁或旧备份。** 如检查拒绝，请停止，不要绕过固定哈希检查。
