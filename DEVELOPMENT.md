# 开发与复现

## 构建

Node.js 22+，npm。无需运行原始上游 patcher：本项目只读取其固定模板及隔离的纯前端变换。

```powershell
npm.cmd run build:deps
node tools/extract-original.mjs "D:\path\to\official-original-server.asar"
npm.cmd run build
npm.cmd test
```

依赖位于 [独立构建依赖清单](<work/source-build-deps/package.json>) 和 [完整锁文件](<work/source-build-deps/package-lock.json>)。使用 `npm ci --ignore-scripts`；不依赖机器上的全局 TypeScript/esbuild。

官方原始 ASAR 由使用者自行合法获取，不随源码和发行包分发。提取器严格核对完整原版 SHA-256，仅提取 9 个构建输入至 git 忽略的 `work/pristine`。不接触已安装客户端。

[构建入口](<tools/build-native-source.mjs>) 在 `work/source-port/native-modules` 和 `work/source-port/native-stage` 输出，都是 git 忽略路径。构建后的 10 个前端文件必须与 [发行清单](<payload/manifest.json>) 的 SHA-256 完全一致；编译选项、源码路径与依赖锁定均参与可复现结果。

## 验证整个候选 ASAR（不安装）

```powershell
node tools/patch.mjs prepare --original "D:\path\to\official-original-server.asar" --output "D:\temp\candidate.asar"
```

输出必须不存在。该命令只写指定的新候选文件，固定哈希检查、10 文件 allowlist、非目标字节/元数据和变更文件 ASAR integrity 审计全部通过才写出。结果完整 SHA-256 必须等于发行清单中的 `patchedServerSha256`。

## 源码组成

- [src](<src/>)：显示边界、原生数据桥、中文标签与入口。
- [tools](<tools/>)：固定锚点/AST 适配、构建与安全安装策略。
- [固定编译输入](<work/source-port/manifest.json>)：MIT 上游源码转译后的 JS、原始 git blob 与 SHA-256。未把历史证据、浏览器会话或私人聊天复制进来。
- [vendor](<vendor/>)：上游固定模板及主题；原脚本不作为安装入口执行。
- [SOURCE-INVENTORY](<SOURCE-INVENTORY.json>)：首次白名单装配的源码/输入及 payload 字节清单，不宣称囊括后续新增文档和安装器；所有 Git 文件以提交与发行包校验为准。

## 测试范围与限制

本公开项目测试覆盖固定 payload、清单拒绝、未知版本/坏恢复拒绝、ASAR allowlist/元数据/integrity、中文标签和源输入哈希。`prepare` 另在精确原版归档上进行全量候选构造审计。**通用公开安装入口未在另一台 Windows 机器做端到端实装**；不把这些测试等同于所有账号/模型额度实测。

上游原始适配工作曾通过 200 项内部回归并完成固定构建的本机界面检查；内部历史证据含私有环境信息，未公开。公开包的测试计数以 `npm test` 的实际输出为准，不冒称公开套件有 200 项。
