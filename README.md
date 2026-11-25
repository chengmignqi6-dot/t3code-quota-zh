# T3 Code 精简额度栏 · 中文上下文

**给固定版本的 Windows T3 Code 增加一行紧凑用量栏和中文说明，不替换原生模型选择器。**

> 非官方社区补丁。仅支持下方指定的 **T3 Code 0.1.12 Windows 构建**，不是完整客户端，不是额度破解工具。未知版本、升级版本和其他补丁会被拒绝。
>
> 本版已完成 0.1.12 适配：在本机真实界面中逐项点开核对过上下文面板、额度面板、模型选择器、用量页「限制 / 费用」与货币切换，并完成了安装与回滚保护。**不支持 0.1.11 或其他构建**；0.1.11 用户请使用 [v1.0.0](https://github.com/chengmignqi6-dot/t3code-quota-zh/releases/tag/v1.0.0)。

![T3 Code 精简额度栏](<docs/showcase/cover.jpg>)

## 效果与图集

下图全部按真实界面的实测尺寸与取样配色重绘，使用**演示数据**，不包含任何真实项目、账号、会话或路径。SVG 为矢量源文件，JPG 为同一画面的高清位图（JPG 不是矢量格式）。

| 图 | 内容 | 说明 |
|---|---|---|
| [整体位置](<docs/showcase/01-placement.jpg>) · [SVG](<docs/showcase/01-placement.svg>) | 底栏在输入框中的位置 | 底栏位于输入框底部一行，右侧是额度入口；模型选择器与侧栏保持原生 |
| [底栏放大](<docs/showcase/02-footer.jpg>) · [SVG](<docs/showcase/02-footer.svg>) | 四个区域 | 上下文入口 / 轮次与工具 / 词元与缓存 / 额度入口 |
| [上下文面板](<docs/showcase/03-context.jpg>) · [SVG](<docs/showcase/03-context.svg>) | 点「上下文」 | 已用、分段条、已缓存、未缓存、剩余空间、缓存命中、轮次与工具 |
| [额度面板](<docs/showcase/04-quota.jpg>) · [SVG](<docs/showcase/04-quota.svg>) | 点「周额度」 | 提供方·模型、账号、20 段额度条、重置时间、「全部额度」 |
| [模型选择器](<docs/showcase/05-picker.jpg>) · [SVG](<docs/showcase/05-picker.svg>) | 点模型按钮 | 原生选择器，新增每模型额度标记；GPT 与 Claude 不混排 |
| [用量页 · 限制](<docs/showcase/06-limits.jpg>) · [SVG](<docs/showcase/06-limits.svg>) | 点「全部额度」 | 期限筛选、三个标签页、货币切换、按账户/共享池的额度卡片 |
| [用量页 · 费用](<docs/showcase/07-cost.jpg>) · [SVG](<docs/showcase/07-cost.svg>) | 点「费用」 | 人民币总额、每小时图表、统计口径、类型占比、明细表 |
| [点击路径](<docs/showcase/08-flow.jpg>) · [SVG](<docs/showcase/08-flow.svg>) | 总览 | 从底栏到两层弹窗再到用量页，每个入口都可返回 |

每张图的逐项标注见 [图集说明](<docs/showcase/README.md>)。

## 下载与安装

- [下载最新发行包](https://github.com/chengmignqi6-dot/t3code-quota-zh/releases/latest) → 选择 `t3code-quota-zh-1.1.0-windows.zip`，**完整解压**。
- 安装 [Node.js 22 或更新版本](https://nodejs.org/)，无需为安装补丁运行 npm install。
- 先运行 [Check.cmd](<Check.cmd>)，再**自行完全退出 T3 Code**。
- 运行 [Install.cmd](<Install.cmd>)，阅读提示，输入 `YES` 才会写入；完成后自行打开 T3。
- 恢复：先退出 T3，再运行 [Restore.cmd](<Restore.cmd>)。不要删除安装目录中生成的原版备份。

**详细步骤、非默认路径及备份位置见 [安装与恢复](<INSTALL.md>)。** Windows SmartScreen/签名校验可能对修改应用包作出警告；不要为此关闭系统安全保护。

## 做了什么

- **一行底栏**：上下文进度条与 `已用/上限`、轮次 · 工具次数 · 词元/秒、会话词元与缓存命中、以及当前模型的额度入口；不再在顶部另挂一排总览。
- **中文上下文面板**：已用、已缓存、未缓存、剩余空间、压缩预留、缓存命中；数值与格式仍来自原生统计。
- **额度面板**：显示所选提供方实例与模型、账号归属、原生窗口（周额度 / 5 小时）、分格额度条、下次重置时间，并提供「全部额度」。
- **模型选择器**：保留原生选择器与思考强度子菜单，只在每个模型行新增所属池的剩余额度。
- **用量页**：保留原生「限制 / 费用 / token」三页；费用页支持 ¥ CNY / $ USD 切换与汇率重绘，统计口径不变。
- **提供商与模型分离**：额度严格绑定当前 `instanceId + model`，不会把另一个提供商的模型额度套到当前选择上；共享池以 `shared` 原样显示，不拆成虚构额度。
- 品牌名（`Antigravity`、`GPT`、`Claude`、`Google` 等）保持原文。

## 兼容与安全边界

| 项目 | 支持范围 |
|---|---|
| 系统 | Windows；安装/恢复写操作仅允许 Windows |
| T3 Code | 0.1.12，原生提交 `ca81b7b97a1c` |
| 官方 server.asar SHA-256 | `0714162c59487f54ffac6009dd283d5d5f12183d90486795ca13e07c23f1ca71` |
| app.asar SHA-256 | `fbf20eaa6e050e15f36a092bfe1b55994275256f03647618e3c148e052b3c498` |
| 补丁后 server.asar SHA-256 | `21cb1a0ac7b5bb9e971e41b9e43f9d522ebd6ef421aad7f3d08cf462182970d8` |

工具只允许更改 10 个指定前端文件，重新审计 ASAR 后端字节、目录/文件元数据与完整性。它不读取聊天数据库或登录令牌，不自动关闭/启动客户端，不切换模型或账号，不发送 AI 消息。应用自动更新后**不可套用旧补丁或旧备份**。

## 不能保证什么

- **不凭空生成订阅额度。** Codex 没有返回 5 小时/周额度时，不造数补齐。真实额度依赖上游及有效登录。
- 上游动态错误并非全部中文化。例如 Antigravity 登录过期提示仍可能是英文；需要用户在 T3 自行续登。
- `476k / 1m` 是上下文词元使用量/容量，不是汉字数，也不是订阅剩余额度；缓存占比不代表免费额度。
- 上游缓存估算回退公式保留；缓存数据不一定是逐词元直接计量。`工具 114 次` 是调用次数，不是秒数。
- 已在本机验证固定构建上的原生界面与全部入口；**未验证其他机器、窄窗口布局、所有 GPT/Claude 数值额度**。
- 图集是按真实界面重绘的示意图（演示数据），用于说明布局与交互，不是账号余额证据。

## 源码与复现

安装使用预构建的 [payload](<payload/manifest.json>)，不需要下载完整应用。开发者可从自己合法获得的**精确官方原版**提取少量前端构建输入：

```powershell
npm.cmd run build:deps
node tools/extract-native-012.mjs "D:\path\to\official-original-server.asar"
npm.cmd run build
npm.cmd test
```

`npm run build` 先按 [输入清单](<tools/native-012-input-pins.json>) 校验原版前端字节，再逐一比对重建的 10 文件 SHA-256；不会写入真实 T3。依赖通过 [锁文件](<work/source-build-deps/package-lock.json>) 固定，采用 `--ignore-scripts`。详见 [开发说明](<DEVELOPMENT.md>)。

## 来源与许可

- [T3 Code](https://github.com/pingdotgg/t3code)，MIT，T3 Tools Inc.
- [Leobai03/t3code-quota-ui](https://github.com/Leobai03/t3code-quota-ui)，参考 v1.4.6 / `bc64236511ee61dae9b75beef3ea0275eb71b2dd`，MIT；公开源当前可能不可访问，已保留已有源码快照及许可记录。
- [nanami-0713/t3code](https://github.com/nanami-0713/t3code)，`d1bb533d9b69165ce94f1add52f9dcb53dd15684`，MIT。

本项目新增代码按 [MIT](<LICENSE>) 发布；第三方版权及依赖许可见 [THIRD_PARTY_NOTICES](<THIRD_PARTY_NOTICES.md>)。不代表上述项目或提供商的官方发行与背书。

## 反馈

[提交 Issue](https://github.com/chengmignqi6-dot/t3code-quota-zh/issues)。请提供 T3 版本、只读检查结果和**脱敏**截图；不要上传令牌、聊天、整份 ASAR、应用数据目录或备份。安全问题见 [SECURITY](<SECURITY.md>)。
