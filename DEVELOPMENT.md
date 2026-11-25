# 开发与复现

## 构建

Node.js 22+，npm。无需运行原始上游 patcher：本项目只读取其固定模板及隔离的纯前端变换，不执行上游脚本。

```powershell
npm.cmd run build:deps
node tools/extract-native-012.mjs "D:\path\to\official-original-server.asar"
npm.cmd run build
npm.cmd test
```

依赖位于 [独立构建依赖清单](<work/source-build-deps/package.json>) 和 [完整锁文件](<work/source-build-deps/package-lock.json>)。使用 `npm ci --ignore-scripts`；不依赖机器上的全局 TypeScript/esbuild。

官方原始 ASAR 由使用者自行合法获取，不随源码和发行包分发。提取器严格核对完整原版 SHA-256，仅把客户端前端（`index.html` 与 `assets/*.js|css`）提取到 git 忽略的 `work/pristine-0.1.12`，不接触已安装客户端。

[构建入口](<tools/build-native-012-source.mjs>) 先按 [输入清单](<tools/native-012-input-pins.json>) 逐个校验原版前端的大小与 SHA-256，再在 `work/source-port/native-modules-0.1.12` 和 `work/source-port/native-stage-0.1.12` 输出（均为 git 忽略路径）。构建后的 10 个前端文件必须与 [发行清单](<payload/manifest.json>) 的 SHA-256 完全一致。

## 验证整个候选 ASAR（不安装）

```powershell
node tools/patch.mjs prepare --original "D:\path\to\official-original-server.asar" --output "D:\temp\candidate.asar"
```

输出必须不存在。该命令只写指定的新候选文件，固定哈希检查、10 文件 allowlist、非目标字节/元数据和变更文件 ASAR integrity 审计全部通过才写出。结果完整 SHA-256 必须等于发行清单中的 `patchedServerSha256`。

离线核对已构建的 stage（不需要原包以外的任何东西）：

```powershell
node -e "import('./tools/audit-native-012-stage.mjs').then(async m=>{const fs=await import('node:fs');const r=m.auditNative012(fs.readFileSync('D:/path/to/official-original-server.asar'));console.log(r.report)})"
```

该审计会检查 stage 哈希、全部原生导入符号是否存在、语法、后端字节与目录/文件元数据，并重新计算变更文件的 ASAR integrity。

## 重新生成图集

```powershell
node tools/showcase/build-showcase.mjs
ego-browser nodejs -e "await import('file:///.../tools/showcase/render-scenes.mjs')"
python tools/showcase/png-to-jpg.py .showcase-renders
```

SVG 是矢量源文件；JPG 由渲染结果按长边 2560 输出。图集使用演示数据，不含真实项目或账号。

## 源码组成

- [src](<src/>)：显示边界、原生数据桥、中文标签与入口（0.1.12 使用 `src/original-composer-012-entry.jsx`）。
- [tools](<tools/>)：固定锚点/AST 适配、构建与安全安装策略；`tools/showcase` 为图集生成器。
- [固定编译输入](<work/source-port/manifest.json>)：MIT 上游源码转译后的 JS、原始 git blob 与 SHA-256。未把历史证据、浏览器会话或私人聊天复制进来。
- [vendor](<vendor/>)：上游固定模板及主题；原脚本不作为安装入口执行。
- [SOURCE-INVENTORY](<SOURCE-INVENTORY.json>)：白名单装配的源码/输入及 payload 字节清单，不宣称囊括后续新增文档；所有 Git 文件以提交与发行包校验为准。

## 测试范围与限制

本公开项目测试覆盖固定 payload、清单拒绝、未知版本/坏恢复拒绝、ASAR allowlist/元数据/integrity、中文标签、原生时间桥、0.1.12 组合器/选择器/费用/额度适配与源输入哈希。`prepare` 另在精确原版归档上进行全量候选构造审计。**通用公开安装入口未在另一台 Windows 机器做端到端实装**；不把这些测试等同于所有账号/模型额度实测。

适配工作另在本机做了真实安装与逐项界面核对（底栏、上下文面板、额度面板、模型选择器、用量页限制/费用）；内部证据含私有环境信息，未公开。公开包的测试计数以 `npm test` 的实际输出为准。
