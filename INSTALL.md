# 安装、检查与恢复

## 开始之前

- 仅支持 [README 的精确 Windows 构建及哈希](<README.md#兼容与安全边界>)，不凭版本号放行。
- 需要 Node.js 22+；安装补丁无需 npm 依赖。请从 Release 下载 ZIP，完整解压，不要只拿三个 CMD。
- 默认资源目录：`%LOCALAPPDATA%\Programs\t3code\resources`。
- 自行退出所有 T3 Code 窗口及后台进程。工具不强退进程，不自动重开。
- 不支持其他旧补丁的迁移；若版本不同，请停下，不要绕过校验。

## 图形入口

1. 双击 [Check.cmd](<Check.cmd>)：只读校验 payload、server.asar、app.asar，显示 `supported-original` 或 `patched`。
2. 完全退出 T3 后，双击 [Install.cmd](<Install.cmd>)。
3. 输入大小写精确的 `YES` 才安装。取消或检查失败不会替换原应用包。
4. 成功后自行启动 T3，检查底部和上下文面板。

Windows 的“未知发布者”提示不代表包已获得签名。本项目未签名；请先核对发行包 SHA-256，不要禁用 Defender/SmartScreen。遇到权限或签名限制请停止并反馈。

## 命令行 / 非默认路径

在完整解压目录执行（路径请替换为自己的安装位置）：

```powershell
node tools/patch.mjs check --resources "D:\Apps\t3code\resources"
# 先自行关闭所有 T3，再明确允许写入
node tools/patch.mjs install --resources "D:\Apps\t3code\resources" --apply
# 需要恢复时，先关闭 T3
node tools/patch.mjs restore --resources "D:\Apps\t3code\resources" --apply
```

PowerShell 的 `npm.ps1` 可能被执行策略拦截，开发构建请用 `npm.cmd`。这里不需要全局修改 PowerShell 执行策略。

## 备份与恢复

首次安装在同一个 resources 目录创建：

- `server.asar.quota-zh.original`：精确官方原版备份，大约 254 MiB，不上传、不删除。
- `t3code-quota-zh.json`：本工具的固定哈希所有权记录，不含账号信息。

恢复要求当前包仍是本版本精确补丁哈希，备份仍是精确官方原版，app.asar 也未变。**升级、其他补丁或任何篡改都会拒绝旧备份恢复。** 恢复后保留备份与记录，以供人工核查。

写入前先在同盘独占临时文件构造、审计并校验候选包，再次确认 T3 已关闭及文件未变，最后重命名替换，而非直接截断原包。权限错误通常发生在替换之前；如果出现替换后哈希异常，不要继续启动 T3或盲目覆盖，保留备份，重新安装官方客户端或请维护者协助。工具无法防止系统断电、磁盘故障或其他进程同时修改文件。

## 常见问题

**为什么同样是 0.1.11 也不让装？** 版本号相同不代表字节相同。本项目只测试指定发行构建，故严格匹配两个完整 ASAR 哈希。

**为什么没有 GPT 的 5 小时/周额度？** 上游没有提供时不会推测。上下文和缓存数据不是订阅额度。

**Antigravity 的错误还是英文？** 品牌保持原文；上游动态登录过期错误未全部翻译。需要用户自行在 T3 登录/使用以刷新，补丁不会访问或修复登录凭据。

**自动更新后怎么办？** 停止使用旧安装/恢复工具。升级后的官方客户端请等待单独适配；不要用旧备份覆盖新版本。
