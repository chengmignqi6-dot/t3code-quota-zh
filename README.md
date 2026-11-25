# T3 Code 精简额度栏 · 中文上下文

**给指定版本的 Windows T3 Code 添加紧凑用量展示和中文说明，不替换原生模型选择器。**

> 非官方社区补丁。仅支持下方指定的 **T3 Code 0.1.11 Windows 构建**，不是完整客户端，不是额度破解工具。未知版本、升级版本和其他补丁会被拒绝。
>
> **不支持 0.1.12 或更新版本。** 请先检查自己安装的版本；不要降级覆盖个人数据，不要关闭自动更新来强行套用。该发行保留的是已验证的 0.1.11 适配成果。

> **配图更正：** 原合成示意图与实际界面布局不符，已撤下。新版适配完成后，仅展示经过核对的真实界面或严格依据真实界面生成的高清图片。

## 下载与安装

- [下载最新发行包](https://github.com/chengmignqi6-dot/t3code-quota-zh/releases/latest) → 选择 `t3code-quota-zh-1.0.0-windows.zip`，**完整解压**。
- 安装 [Node.js 22 或更新版本](https://nodejs.org/)，无需为安装补丁运行 npm install。
- 先运行 [Check.cmd](<Check.cmd>)，再**自行完全退出 T3 Code**。
- 运行 [Install.cmd](<Install.cmd>)，阅读提示，输入 `YES` 才会写入；完成后自行打开 T3。
- 恢复：先退出 T3，再运行 [Restore.cmd](<Restore.cmd>)。不要删除安装目录中生成的原版备份。

**详细步骤、非默认路径及备份位置见 [安装与恢复](<INSTALL.md>)。** Windows SmartScreen/签名校验可能对修改应用包作出警告；不要为此关闭系统安全保护。

## 做了什么

- 底部紧凑展示轮数、工具调用、词元速度、上下文及缓存信息；不再重复挂一排顶部额度总览。
- 上下文面板使用中文：已用、已缓存、未缓存、剩余空间、压缩预留等；保留原始统计与格式。
- `Antigravity`、`GPT`、`Claude`、`Google` 等品牌名保持原文。
- 额度展示跟随所选模型/提供商过滤，保留上游共享池语义，不把共享余额拆成虚构额度。
- 保留原生模型选择器、费用、缓存和详情入口；不替换原生权限/思考强度控件。

## 兼容与安全边界

| 项目 | 支持范围 |
|---|---|
| 系统 | Windows；安装/恢复写操作仅允许 Windows |
| T3 Code | 0.1.11，原生提交 `59651c1761f6` |
| 官方 server.asar SHA-256 | `51437657773bb073a633674678da4370ecfce0f622fd403b87d315a9d3f8d631` |
| app.asar SHA-256 | `dd6da6a5169fbefb88bbff9ee9260e98d41bed7a1c46132ac725a58e0b874fa3` |
| 补丁后 server.asar SHA-256 | `824c489d8668715aa0a98e71f8c8c90b1ca8d93cd0dd6f8bcdc26375af8dc27e` |

工具只允许更改 10 个指定前端文件，重新审计 ASAR 后端字节、目录/文件元数据与完整性。它不读取聊天数据库或登录令牌，不自动关闭/启动客户端，不切换模型或账号，不发送 AI 消息。应用自动更新后**不可套用旧补丁或旧备份**。

## 不能保证什么

- **不凭空生成订阅额度。** Codex 没有返回 5 小时/周额度时，不造数补齐。真实额度依赖上游及有效登录。
- 上游动态错误并非全部中文化。例如 Antigravity 登录过期提示仍可能是英文；需要用户在 T3 自行续登。
- `71k / 1m` 是上下文词元使用量/容量，不是汉字数，也不是订阅剩余额度；缓存占比不代表免费额度。
- 上游缓存估算回退公式保留；缓存数据不一定是逐词元直接计量。`工具 384 次` 是调用次数，不是秒数。
- 已验证固定构建上的原生 Antigravity 界面及中文上下文；**未验证所有 GPT/Claude 数值额度、模型选择器展开及窄窗口布局**。
- 目前不提供产品效果图，避免让未实现的布局被误认为实际功能。新版适配与新配图验证完成前，不将预览当作实装结果。

## 源码与复现

安装使用预构建的 [payload](<payload/manifest.json>)，不需要下载完整应用。开发者可从自己合法获得的**精确官方原版**提取少量前端构建输入：

```powershell
npm.cmd run build:deps
node tools/extract-original.mjs "D:\path\to\official-original-server.asar"
npm.cmd run build
npm.cmd test
```

`npm run build` 会逐一比对重建的 10 文件 SHA-256；不会写入真实 T3。依赖通过 [锁文件](<work/source-build-deps/package-lock.json>) 固定，采用 `--ignore-scripts`。详见 [开发说明](<DEVELOPMENT.md>)。

## 来源与许可

- [T3 Code](https://github.com/pingdotgg/t3code)，MIT，T3 Tools Inc.
- [Leobai03/t3code-quota-ui](https://github.com/Leobai03/t3code-quota-ui)，参考 v1.4.6 / `bc64236511ee61dae9b75beef3ea0275eb71b2dd`，MIT；公开源当前可能不可访问，已保留已有源码快照及许可记录。
- [nanami-0713/t3code](https://github.com/nanami-0713/t3code)，`d1bb533d9b69165ce94f1add52f9dcb53dd15684`，MIT。

本项目新增代码按 [MIT](<LICENSE>) 发布；第三方版权及依赖许可见 [THIRD_PARTY_NOTICES](<THIRD_PARTY_NOTICES.md>)。不代表上述项目或提供商的官方发行与背书。

## 反馈

[提交 Issue](https://github.com/chengmignqi6-dot/t3code-quota-zh/issues)。请提供 T3 版本、只读检查结果和**脱敏**截图；不要上传令牌、聊天、整份 ASAR、应用数据目录或备份。安全问题见 [SECURITY](<SECURITY.md>)。
