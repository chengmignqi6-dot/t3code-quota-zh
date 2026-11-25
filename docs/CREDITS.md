# 致敬与来源

这个项目不是从零开始的。它站在三个 MIT 开源项目的肩膀上，这里写清楚**每一部分来自哪里**。

## 1. T3 Code — 宿主应用

- 仓库：[pingdotgg/t3code](https://github.com/pingdotgg/t3code)
- 许可：MIT（T3 Tools Inc.）
- 本项目用到的：整个客户端本体。我们只替换它 `server.asar` 里的 10 个前端文件，后端字节、目录元数据与完整性校验一律不动。
- 说明：本项目是非官方社区补丁，**不代表 T3 Code 或 T3 Tools 的官方发行与背书**。

## 2. Leobai03/t3code-quota-ui — 额度 UI 与补丁思路的源头

- 仓库：[Leobai03/t3code-quota-ui](https://github.com/Leobai03/t3code-quota-ui)（公开源当前可能不可访问，仓库内保留了已获取的源码快照与许可记录）
- 版本：v1.4.6，commit `bc64236511ee61dae9b75beef3ea0275eb71b2dd`
- 许可：MIT
- 本项目用到的：
  - 「紧凑额度栏 / 底部状态栏」的产品思路与信息取舍；
  - 费用页货币（¥ CNY / $ USD）toolbar 与图表刻度的变换逻辑；
  - 额度页按账户分池、`shared` 共享池的展示方式；
  - 上述部分的原始实现被当作**固定上游源码**，由 [vendor/t3code-quota-ui-v1.4.6/scripts/patch-asar.mjs](<../vendor/t3code-quota-ui-v1.4.6/scripts/patch-asar.mjs>) 提供，我们只做 AST 选择与纯函数复用。
- 说明：本项目**不执行**它的 patcher，也不分发它的安装器；只复用其 MIT 源码片段，并针对 T3 Code 0.1.12 重新绑定锚点。

## 3. nanami-0713/t3code — 用量/遥测展示的来源

- 仓库：[nanami-0713/t3code](https://github.com/nanami-0713/t3code)
- 版本：commit `d1bb533d9b69165ce94f1add52f9dcb53dd15684`
- 许可：MIT
- 本项目用到的：底栏的轮次 / 工具次数 / 词元速度 / 缓存统计的 UI 与算法（`deriveTurnTelemetryIndex`、`lookupTurnTelemetry`、`countThreadToolCalls` 等），以固定源码快照的形式放在 [work/source-port](<../work/source-port/>) 与 [src](<../src/>) 中复用。
- 说明：算法保持原样，本项目只做中文化与布局收敛，不改写统计口径。

## 4. 其它第三方

- 原生 UI 组件：T3 Code 自带的 Base UI / Tailwind CSS / lucide 图标等，均随宿主应用分发，本项目只引用其运行时导出的组件。
- 构建期依赖（esbuild、TypeScript、lightningcss、Tailwind 等）及其许可证见 [THIRD_PARTY_NOTICES](<../THIRD_PARTY_NOTICES.md>) 与 [licenses/dependency-inventory.json](<../licenses/dependency-inventory.json>)。

## 我们的增量

- 0.1.12 前端的重新绑定（组合器、模型选择器、用量页、共享额度模块的精确锚点）；
- 中文上下文 / 额度 / 费用标签与品牌名保留策略；
- 每模型额度徽标、`instanceId + model` 严格成对的额度解析、「全部额度」原生路由入口；
- 10 文件白名单、双 ASAR 哈希门禁、原子替换与回滚；
- 图集与文档。

再次感谢以上作者把代码以 MIT 方式开放。如果上游作者认为本项目的某处引用不妥，请开 issue，我们会立即调整或移除。
