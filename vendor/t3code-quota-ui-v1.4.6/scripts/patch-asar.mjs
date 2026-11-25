#!/usr/bin/env node
/**
 * T3 Code Quota & Compact UI Patcher v1.2.0 (macOS app.asar in-place enhancer)
 *
 * Upstream projects & credits:
 * - Official T3 Code: https://github.com/pingdotgg/t3code (MIT License, Copyright (c) 2026 T3 Tools Inc.)
 * - Restrained Telemetry UI fork: https://github.com/nanami-0713/t3code (MIT License)
 * - T3 Stardust UX inspiration (Topbar Quota Pills, Model Picker Quota Badges, Burn-rate Forecast):
 *   https://github.com/zds-xiaoxin/xiaoxin-t3code (MIT License)
 *
 * Features applied by this patcher:
 * 1. Compact 2-Column Limits Grid + Dense Single-Card Pairing (e.g. Cursor + Grok side-by-side on one row).
 * 2. Multi-Account Side-by-Side Columns (e.g. Antigravity 1 on left, Antigravity 2 on right for instant 20x comparison).
 * 3. Verified Dynamic Multi-Account Credential Isolation & Sync: exact 35-char OAuth client secret boundary + OAuth verification + per-instance file isolation without breaking browser sign-in.
 * 4. Custom API Endpoint Visibility: surfaces custom Claude API endpoints cleanly in the Usage -> Limits panel.
 * 5. Instant Currency Switcher (¥ CNY / $ USD) with localStorage persistence & clean rounded RMB chart axes.
 * 6. Instant Language Switcher (中 / EN) + Full Usage (Cost / Tokens / Limits) Localization without app restart.
 * 7. Topbar Quota Pills: live compact multi-pool remaining % & reset countdown pills in the chat header (click to jump to Usage -> Limits).
 * 8. Model Picker Quota Badges: color-coded remaining % badges right inside the model picker & provider sidebar.
 * 9. Burn-rate Forecast: real-time depletion pace & time-to-cap forecast on every Usage -> Limits window card.
 *
 * SPDX-License-Identifier: MIT
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const __STARDUST_V18_JS = fs.existsSync(path.join(__SCRIPT_DIR, "stardust/v18-starship-scenes.js"))
  ? fs.readFileSync(path.join(__SCRIPT_DIR, "stardust/v18-starship-scenes.js"), "utf8")
  : "";
const __STARDUST_V9_CSS = fs.existsSync(path.join(__SCRIPT_DIR, "stardust/v9-stardust.css"))
  ? fs.readFileSync(path.join(__SCRIPT_DIR, "stardust/v9-stardust.css"), "utf8")
  : "";

function parseArgs(argv) {
  const opts = {
    app: "",
    lang: "zh",
    dryRun: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--app" && argv[i + 1]) {
      opts.app = argv[++i];
    } else if (arg.startsWith("--app=")) {
      opts.app = arg.slice("--app=".length);
    } else if (arg === "--lang" && argv[i + 1]) {
      opts.lang = argv[++i].toLowerCase();
    } else if (arg.startsWith("--lang=")) {
      opts.lang = arg.slice("--lang=".length).toLowerCase();
    } else if (arg === "--dry-run") {
      opts.dryRun = true;
    }
  }
  if (!opts.app) {
    throw new Error("Missing required --app <path-to-T3-Code.app>");
  }
  if (opts.lang !== "zh" && opts.lang !== "en") {
    throw new Error(`Unsupported --lang "${opts.lang}". Expected "zh" or "en".`);
  }
  return opts;
}

const BLOCK_SIZE = 4 * 1024 * 1024;

function computeIntegrity(buf) {
  const hash = crypto.createHash("sha256").update(buf).digest("hex");
  const blocks = [];
  for (let i = 0; i < buf.length; i += BLOCK_SIZE) {
    blocks.push(
      crypto
        .createHash("sha256")
        .update(buf.subarray(i, i + BLOCK_SIZE))
        .digest("hex"),
    );
  }
  return {
    algorithm: "SHA256",
    hash,
    blockSize: BLOCK_SIZE,
    blocks,
  };
}

function getFileNode(header, relPath) {
  const parts = relPath.split("/").filter(Boolean);
  let cur = header;
  for (const part of parts) {
    if (!cur || !cur.files || !(part in cur.files)) return null;
    cur = cur.files[part];
  }
  return cur;
}

function listFilesRecursive(node, prefix = "", out = []) {
  if (!node || !node.files) return out;
  for (const [name, child] of Object.entries(node.files)) {
    const rel = prefix ? `${prefix}/${name}` : name;
    if (child.files) {
      listFilesRecursive(child, rel, out);
    } else if (!child.unpacked && child.offset !== undefined) {
      out.push(rel);
    }
  }
  return out;
}

export function buildInjectedHeadBlock(defaultLang = "zh") {
  const safeDefaultLang = defaultLang === "en" ? "en" : "zh";
  const styleBlock = `<style id="t3-quota-ui-styles">
/* T3 Code Quota UI v1.1.1 — Side-by-Side Accounts, Paired Single-Card Providers & Usage Toolbar */
.t3-quota-sections {
  display: grid !important;
  grid-template-columns: minmax(0, 1fr) !important;
  column-gap: 0.75rem !important;
  row-gap: 0.875rem !important;
  align-items: start !important;
}
@media (min-width: 768px) {
  .t3-quota-sections {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    grid-auto-flow: row dense !important;
  }
  .t3-quota-sections > :not(.t3-quota-col-1) {
    grid-column: 1 / -1 !important;
  }
  .t3-quota-sections > .t3-quota-col-1 {
    grid-column: span 1 / span 1 !important;
  }
}
.t3-quota-section {
  display: flex !important;
  flex-direction: column !important;
  gap: 0.375rem !important;
  min-width: 0 !important;
}
.t3-quota-grid {
  display: grid !important;
  grid-template-columns: minmax(0, 1fr) !important;
  gap: 0.5rem !important;
}
@media (min-width: 768px) {
  .t3-quota-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }
}
.t3-quota-grid-1 {
  display: grid !important;
  grid-template-columns: minmax(0, 1fr) !important;
  gap: 0.5rem !important;
}
.t3-quota-card {
  display: grid !important;
  align-items: center !important;
  column-gap: 0.75rem !important;
  row-gap: 0.375rem !important;
  padding: 0.5rem 0.75rem !important;
  grid-template-columns: 8.5rem minmax(0, 1fr) !important;
}
.t3-usage-yaxis {
  width: 4.25rem !important;
}
.t3-usage-xaxis {
  padding-left: 4.75rem !important;
}
/* v1.2.1: Topbar Quota Pills (zero-overlap safe inset), Vivid Model Picker Badges, Full-width Burn-rate Forecast & Draggable Starship Reasoning Effort Slider */
.t3-topbar-quota-strip {
  -webkit-app-region: no-drag;
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.25rem;
  margin-left: 0.5rem;
  margin-right: 128px;
  flex: 0 1 auto;
  min-width: 0;
  max-width: calc(100% - 260px);
  overflow-x: auto;
  scrollbar-width: none;
}
.t3-topbar-quota-strip::-webkit-scrollbar {
  display: none;
}
.t3-topbar-pill {
  -webkit-app-region: no-drag;
  display: inline-flex;
  align-items: center;
  gap: 0.24rem;
  height: 1.35rem;
  padding: 0 0.42rem;
  border-radius: 9999px;
  border: 1px solid color-mix(in oklab, var(--border) 82%, transparent);
  background: color-mix(in oklab, var(--muted) 56%, transparent);
  color: var(--foreground);
  font-size: 10.5px;
  line-height: 1;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  flex-shrink: 0;
  cursor: pointer;
  transition: background-color 140ms ease, border-color 140ms ease;
}
.t3-topbar-pill:hover {
  background: color-mix(in oklab, var(--muted) 92%, transparent);
  border-color: color-mix(in oklab, var(--foreground) 28%, var(--border));
}
.t3-topbar-pill-dot {
  width: 5.5px;
  height: 5.5px;
  border-radius: 9999px;
  flex-shrink: 0;
}
.t3-topbar-pill-name {
  opacity: 0.82;
  font-weight: 600;
}
.t3-topbar-pill-pct {
  font-weight: 700;
}
.t3-topbar-pill-reset {
  opacity: 0.62;
  font-size: 9.5px;
}
.t3-q-ok {
  color: #10b981;
}
.t3-q-warn {
  color: #f59e0b;
}
.t3-q-danger {
  color: #ef4444;
}
.t3-q-dot-ok {
  background: #10b981;
}
.t3-q-dot-warn {
  background: #f59e0b;
}
.t3-q-dot-danger {
  background: #ef4444;
}
.t3-mp-quota-badge {
  display: inline-flex;
  align-items: center;
  height: 1.22rem;
  padding: 0 0.44rem;
  border-radius: 9999px;
  font-size: 11px;
  line-height: 1;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  flex-shrink: 0;
  border: 1px solid transparent;
}
.t3-mp-quota-ok {
  color: #10b981;
  background: color-mix(in oklab, #10b981 18%, transparent);
  border-color: color-mix(in oklab, #10b981 42%, transparent);
}
.t3-mp-quota-warn {
  color: #f59e0b;
  background: color-mix(in oklab, #f59e0b 20%, transparent);
  border-color: color-mix(in oklab, #f59e0b 45%, transparent);
}
.t3-mp-quota-danger {
  color: #ef4444;
  background: color-mix(in oklab, #ef4444 20%, transparent);
  border-color: color-mix(in oklab, #ef4444 48%, transparent);
}
.t3-mp-provider-pill {
  position: absolute;
  top: 0px;
  right: 0px;
  z-index: 40;
  pointer-events: none;
  padding: 0 3px;
  height: 12px;
  line-height: 12px;
  border-radius: 9999px;
  font-size: 8.5px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  background: var(--background);
  box-shadow: 0 0 0 1px color-mix(in oklab, currentColor 42%, var(--border));
}
.t3-burn-row {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding-top: 0.25rem;
  margin-top: 0.1rem;
  border-top: 1px dashed color-mix(in oklab, var(--border) 62%, transparent);
}
.t3-burn-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  max-width: 100%;
  padding: 0.16rem 0.5rem;
  border-radius: 0.4rem;
  border: 1px solid transparent;
  font-size: 11px;
  line-height: 1.3;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.t3-burn-ok {
  color: #10b981;
  background: color-mix(in oklab, #10b981 14%, transparent);
  border-color: color-mix(in oklab, #10b981 30%, transparent);
}
.t3-burn-warn {
  color: #f59e0b;
  background: color-mix(in oklab, #f59e0b 15%, transparent);
  border-color: color-mix(in oklab, #f59e0b 34%, transparent);
}
.t3-burn-danger {
  color: #ef4444;
  background: color-mix(in oklab, #ef4444 16%, transparent);
  border-color: color-mix(in oklab, #ef4444 38%, transparent);
}
.t3-burn-muted {
  color: var(--muted-foreground);
  background: color-mix(in oklab, var(--muted) 65%, transparent);
  border-color: color-mix(in oklab, var(--border) 70%, transparent);
}
${__STARDUST_V9_CSS}
@media (max-width: 960px) {
  .t3-topbar-pill-reset {
    display: none;
  }
}
@media (max-width: 720px) {
  .t3-topbar-quota-strip {
    display: none;
  }
}
</style>`;

  const runtimeScript = `<script id="t3-quota-ui-i18n">
(function(){
  const LANG_KEY = "t3code:quota-ui-lang";
  const CURR_KEY = "t3code:quota-ui-currency";
  const RATE_KEY = "t3code:quota-ui-fx-rate";
  const DEFAULT_LANG = "${safeDefaultLang}";
  const DEFAULT_RATE = 7.25;

  const EN_TO_ZH = {
    "New thread": "新建对话",
    "No project": "无项目",
    "Choose a project": "选择项目",
    "Working": "进行中",
    "Pinned": "已置顶",
    "Projects": "项目",
    "Done": "已完成",
    "Failed": "失败",
    "Cancelled": "已取消",
    "Waiting": "等待中",
    "Approval": "待审批",
    "Setting up": "准备中",
    "Settings": "设置",
    "General": "通用",
    "Appearance": "外观",
    "Chat": "对话",
    "Diffs & PRs": "差异与 PR",
    "Diffs & pull requests": "差异与拉取请求",
    "Keybindings": "快捷键",
    "Providers": "模型提供方",
    "Threads": "线程",
    "Browser": "浏览器",
    "Devices": "设备",
    "Scheduled tasks": "计划任务",
    "Source control": "源代码管理",
    "Worktrees": "工作树",
    "Environments": "运行环境",
    "Sharing & access": "共享与访问",
    "Secrets": "密钥",
    "Maintenance": "维护",
    "About": "关于",
    "Voice": "语音",
    "Archive": "归档",
    "Agents": "代理",
    "Code": "代码",
    "Connections": "连接",
    "Usage": "用量与配额",
    "Usage limits": "配额限制",
    "Limits": "限额",
    "Context": "上下文",
    "Context window": "上下文窗口",
    "Lineage": "分支脉络",
    "Side chats": "旁路会话",
    "Compact": "压缩",
    "Other model pools": "其他模型配额池",
    "Other active subscriptions": "其他活跃订阅",
    "Full limits panel": "完整配额面板",
    "Refresh quota": "刷新配额",
    "Cached context": "已缓存上下文",
    "Uncached context": "未缓存上下文",
    "Used context": "已用上下文",
    "Free space": "剩余空间",
    "Autocompact buffer": "自动压缩缓冲",
    "Prompt cache": "提示词缓存",
    "First answer": "首屏回复",
    "Gen speed": "生成速度",
    "End-to-end": "端到端速度",
    "Duration": "耗时",
    "Wall time": "总耗时",
    "Local": "本地",
    "Worktree": "工作树",
    "Default": "默认",
    "Plan": "规划",
    "Full access": "完全权限",
    "Auto": "自动",
    "Auto-accept edits": "自动接受编辑",
    "Approval required": "每次询问",
    "Check for updates": "检查更新",
    "Check for Updates": "检查更新",
    "Install update": "安装更新",
    "Restart to update": "重启以更新",
    "All environments": "全部环境",
    "All providers": "全部厂商"
  };

  const ZH_TO_EN = {};
  for (const [en, zh] of Object.entries(EN_TO_ZH)) {
    if (!(zh in ZH_TO_EN)) ZH_TO_EN[zh] = en;
  }

  const WINDOW_LABELS_ZH = {
    "Session": "当前会话",
    "Weekly": "每周额度",
    "Monthly": "每月额度",
    "Monthly spend": "月度消费",
    "Monthly credit limit": "月度额度上限",
    "Overall": "总配额",
    "Cursor Models": "Cursor 模型",
    "Other Models": "第三方模型",
    "Custom API": "自定义 API",
    "Go · Session": "Go · 当前会话",
    "Go · Weekly": "Go · 每周额度",
    "Go · Monthly": "Go · 每月额度",
    "5-hour window": "5小时窗口",
    "7-day window": "7天窗口",
    "5-hour reset": "5小时重置券",
    "Weekly reset": "每周重置券",
    "Full reset": "全量重置券"
  };

  function getLang() {
    try {
      const v = window.localStorage.getItem(LANG_KEY);
      if (v === "zh" || v === "en") return v;
    } catch {}
    return DEFAULT_LANG;
  }

  function getCurrency() {
    try {
      const v = window.localStorage.getItem(CURR_KEY);
      if (v === "CNY" || v === "USD") return v;
    } catch {}
    return "USD";
  }

  function getRate() {
    try {
      const raw = window.localStorage.getItem(RATE_KEY);
      if (raw !== null) {
        const n = Number(raw);
        if (Number.isFinite(n) && n > 0) return n;
      }
    } catch {}
    return DEFAULT_RATE;
  }

  function translateWindowLabel(label) {
    if (!label || typeof label !== "string" || getLang() !== "zh") return label;
    if (label in WINDOW_LABELS_ZH) return WINDOW_LABELS_ZH[label];
    let out = label;
    out = out.replace(/Claude\\s*&\\s*GPT\\s*\\(shared\\)/gi, "Claude / GPT 共享");
    out = out.replace(/^Weekly\\s*·\\s*/, "每周额度 · ");
    out = out.replace(/^Session\\s*·\\s*/, "当前会话 · ");
    out = out.replace(/\\s*·\\s*5-hour$/i, " · 5小时");
    out = out.replace(/\\s*·\\s*5h$/i, " · 5小时");
    out = out.replace(/\\s*·\\s*7-day$/i, " · 7天");
    out = out.replace(/\\s*·\\s*7d$/i, " · 7天");
    out = out.replace(/\\s*·\\s*Weekly$/i, " · 每周");
    out = out.replace(/\\s*·\\s*Monthly$/i, " · 每月");
    out = out.replace(/\\s*·\\s*Quota$/i, " · 配额");
    return out;
  }

  const SKIP_SELECTOR = "[data-quota-ui-managed], .chat-markdown, .composer-tiptap, pre, code, [data-thread-terminal-drawer], [data-file-explorer], script, style, textarea, input";
  const origNodeMap = new WeakMap();

  function applyDomI18n(root) {
    if (!root) return;
    const zhMode = getLang() === "zh";
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const val = node.nodeValue;
      if (!val) continue;
      const parent = node.parentElement;
      if (!parent || parent.closest(SKIP_SELECTOR)) continue;
      const trimmed = val.trim();
      if (!trimmed) continue;
      if (zhMode) {
        if (trimmed in EN_TO_ZH) {
          const replacement = EN_TO_ZH[trimmed];
          if (replacement && trimmed !== replacement) {
            if (!origNodeMap.has(node)) origNodeMap.set(node, val);
            node.nodeValue = val.replace(trimmed, replacement);
          }
        }
      } else {
        if (origNodeMap.has(node)) {
          const orig = origNodeMap.get(node);
          origNodeMap.delete(node);
          if (val !== orig) node.nodeValue = orig;
        } else if (trimmed in ZH_TO_EN) {
          const replacement = ZH_TO_EN[trimmed];
          if (replacement && trimmed !== replacement) {
            origNodeMap.set(node, val);
            node.nodeValue = val.replace(trimmed, replacement);
          }
        }
      }
    }
  }

  function syncDataset() {
    const lang = getLang();
    const curr = getCurrency();
    document.documentElement.dataset.quotaUiLang = lang;
    document.documentElement.dataset.quotaUiCurrency = curr;
  }

  function emitChange() {
    syncDataset();
    if (document.body) applyDomI18n(document.body);
    window.dispatchEvent(
      new CustomEvent("t3-quota-ui:change", {
        detail: { lang: getLang(), currency: getCurrency(), rate: getRate() }
      })
    );
  }

  function fmtDurShort(ms) {
    if (!Number.isFinite(ms) || ms <= 0) return "";
    const zh = getLang() === "zh";
    const mins = Math.max(1, Math.round(ms / 60000));
    if (mins < 60) return zh ? mins + "分" : mins + "m";
    const hrs = Math.round(mins / 60);
    if (hrs < 48) return zh ? hrs + "h" : hrs + "h";
    const days = Math.round(hrs / 24);
    return zh ? days + "天" : days + "d";
  }

  function fmtDurLong(ms) {
    if (!Number.isFinite(ms) || ms <= 0) return "";
    const zh = getLang() === "zh";
    const totalMins = Math.max(1, Math.round(ms / 60000));
    if (totalMins < 60) return zh ? totalMins + "分钟" : totalMins + "m";
    const totalHrs = Math.floor(totalMins / 60);
    const remMins = totalMins % 60;
    if (totalHrs < 24) {
      if (zh) return remMins > 0 ? totalHrs + "小时" + remMins + "分" : totalHrs + "小时";
      return remMins > 0 ? totalHrs + "h " + remMins + "m" : totalHrs + "h";
    }
    const days = Math.floor(totalHrs / 24);
    const remHrs = totalHrs % 24;
    if (zh) return remHrs > 0 ? days + "天" + remHrs + "小时" : days + "天";
    return remHrs > 0 ? days + "d " + remHrs + "h" : days + "d";
  }

  function inferWindowDurationMs(win, remMs) {
    if (win && Number.isFinite(win.windowDurationMs) && win.windowDurationMs > 0) return win.windowDurationMs;
    const kind = String(win?.kind || "").toLowerCase();
    const lbl = String(win?.label || "").toLowerCase();
    if (kind === "session" || /5[- ]?hour|5h|session|会话/.test(lbl)) return 5 * 3600000;
    if (kind === "weekly" || /7[- ]?day|7d|weekly|每周/.test(lbl)) return 7 * 86400000;
    if (kind === "monthly" || /month|每月|月度/.test(lbl)) return 30 * 86400000;
    if (Number.isFinite(remMs) && remMs > 0) {
      if (remMs <= 6 * 3600000) return 5 * 3600000;
      if (remMs <= 8 * 86400000) return 7 * 86400000;
      if (remMs <= 32 * 86400000) return 30 * 86400000;
    }
    return 0;
  }

  function computeBurnForecast(poolOrWin, nowInput) {
    if (!poolOrWin) return null;
    const zh = getLang() === "zh";
    const now = Number.isFinite(nowInput) ? nowInput : Date.now();
    const firstWin = Array.isArray(poolOrWin.columns)
      ? (poolOrWin.columns.find((c) => c && c.window)?.window || null)
      : poolOrWin;
    const rawRem = Number.isFinite(poolOrWin.remainingPercent)
      ? poolOrWin.remainingPercent
      : (firstWin && Number.isFinite(firstWin.usedPercent) ? Math.round(100 - firstWin.usedPercent) : null);
    if (rawRem === null || !Number.isFinite(rawRem)) return null;
    const remaining = Math.max(0, Math.min(100, rawRem));
    const used = 100 - remaining;

    if (firstWin && firstWin.id === "custom_api") return null;
    if (remaining >= 99) {
      return {
        tone: "ok",
        text: zh ? "✨ 满血可用" : "✨ Full capacity",
        title: zh ? "当前窗口额度几乎未消耗" : "Window quota is at full capacity"
      };
    }
    if (remaining <= 0) {
      return {
        tone: "danger",
        text: zh ? "🛑 已触顶 · 等待重置" : "🛑 Depleted · awaiting reset",
        title: zh ? "当前窗口额度已耗尽" : "Window quota is depleted"
      };
    }

    const resetsAtMs = firstWin?.resetsAt ? Date.parse(firstWin.resetsAt) : NaN;
    const remMs = Number.isFinite(resetsAtMs) ? resetsAtMs - now : NaN;
    const durMs = inferWindowDurationMs({
      windowDurationMs: firstWin?.windowDurationMs,
      kind: poolOrWin.kind || firstWin?.kind,
      label: poolOrWin.label || firstWin?.label
    }, remMs);

    if (!Number.isFinite(remMs) || remMs <= 0 || !durMs || durMs <= remMs) {
      const tone = remaining >= 50 ? "ok" : remaining >= 20 ? "warn" : "danger";
      return {
        tone,
        text: zh ? (remaining >= 50 ? "✅ 节奏平稳 · 余量充足" : remaining >= 20 ? "⚡ 注意消耗节奏" : "🔥 余量偏低") : (remaining >= 50 ? "✅ Healthy headroom" : remaining >= 20 ? "⚡ Watch pace" : "🔥 Low quota"),
        title: ""
      };
    }

    const elapsedMs = durMs - remMs;
    if (elapsedMs < 120000) {
      return {
        tone: "ok",
        text: zh ? "✨ 新窗口刚重置" : "✨ Fresh window",
        title: zh ? "窗口刚刚开始，暂无足够消耗样本" : "Window just reset"
      };
    }

    const ratePerMs = used / elapsedMs;
    const ttfMs = ratePerMs > 0 ? remaining / ratePerMs : Infinity;
    if (ttfMs < remMs * 0.92) {
      const durStr = fmtDurLong(ttfMs);
      const tone = ttfMs < remMs * 0.5 || remaining <= 20 ? "danger" : "warn";
      return {
        tone,
        text: zh ? "⚡ 消耗偏快 · 约 " + durStr + " 后触顶" : "⚡ Fast · ~" + durStr + " to cap",
        title: zh
          ? "按当前消耗速率，预计将在重置前约 " + durStr + " 耗尽额度"
          : "At current burn rate, quota will hit 0% in ~" + durStr + " before reset"
      };
    }

    const projectedLeft = Math.max(0, Math.min(100, Math.round(remaining - ratePerMs * remMs)));
    return {
      tone: "ok",
      text: zh ? "✅ 节奏平稳 · 重置前够用 (余~" + projectedLeft + "%)" : "✅ Steady · ~" + projectedLeft + "% at reset",
      title: zh
        ? "按当前速率，窗口重置时预计仍剩约 " + projectedLeft + "%"
        : "At current burn rate, ~" + projectedLeft + "% will remain at reset"
    };
  }

  function toneForRemaining(rem) {
    return rem >= 50 ? "ok" : rem >= 20 ? "warn" : "danger";
  }

  function extractWindows(entry) {
    const ul = entry?.usageLimits || entry?.snapshot?.usageLimits;
    if (!ul || ul.unavailable || !Array.isArray(ul.windows)) return [];
    return ul.windows.filter((w) => w && w.id !== "custom_api" && Number.isFinite(w.usedPercent));
  }

  function pickWindowForModel(windows, modelSlug) {
    if (!windows || windows.length === 0) return null;
    let pool = windows;
    if (modelSlug) {
      const slugLower = String(modelSlug).toLowerCase();
      const matched = windows.filter((w) => Array.isArray(w.modelIds) && w.modelIds.some((m) => String(m).toLowerCase() === slugLower || slugLower.includes(String(m).toLowerCase())));
      if (matched.length > 0) pool = matched;
    }
    return pool.reduce((best, cur) => (!best || cur.usedPercent > best.usedPercent ? cur : best), null);
  }

  function getProviderQuota(entry, modelSlug, nowInput) {
    const wins = extractWindows(entry);
    if (wins.length === 0) return null;
    const now = Number.isFinite(nowInput) ? nowInput : Date.now();
    const target = pickWindowForModel(wins, modelSlug);
    if (!target) return null;
    const remaining = Math.max(0, Math.min(100, Math.round(100 - target.usedPercent)));
    const remMs = target.resetsAt ? Date.parse(target.resetsAt) - now : NaN;
    const resetShort = Number.isFinite(remMs) && remMs > 0 ? fmtDurShort(remMs) : "";
    const zh = getLang() === "zh";
    const lines = wins.map((w) => {
      const r = Math.max(0, Math.min(100, Math.round(100 - w.usedPercent)));
      const wRemMs = w.resetsAt ? Date.parse(w.resetsAt) - now : NaN;
      const wReset = Number.isFinite(wRemMs) && wRemMs > 0 ? " · ↻ " + fmtDurLong(wRemMs) : "";
      const fc = computeBurnForecast(w, now);
      const fcTxt = fc ? " (" + fc.text + ")" : "";
      return translateWindowLabel(w.label || w.kind || w.id) + ": " + r + "%" + (zh ? " 剩余" : " left") + wReset + fcTxt;
    });
    return {
      remaining,
      tone: toneForRemaining(remaining),
      resetShort,
      tooltip: (entry.displayName || entry.driverKind || entry.provider || "") + "\\n" + lines.join("\\n")
    };
  }

  function buildTopbarPills(providers, nowInput) {
    if (!Array.isArray(providers) || providers.length === 0) return [];
    const now = Number.isFinite(nowInput) ? nowInput : Date.now();
    const active = providers.filter((p) => p && extractWindows(p).length > 0);
    if (active.length === 0) return [];
    const driverTotals = {};
    const driverSeen = {};
    for (const p of active) {
      const dk = String(p.driverKind || p.driver || p.provider || "other");
      driverTotals[dk] = (driverTotals[dk] || 0) + 1;
    }
    const pills = [];
    for (const p of active) {
      const dk = String(p.driverKind || p.driver || p.provider || "other");
      driverSeen[dk] = (driverSeen[dk] || 0) + 1;
      const idx = driverSeen[dk];
      const total = driverTotals[dk];
      let base = dk;
      if (/antigravity/i.test(dk)) base = "AG";
      else if (/claude/i.test(dk)) base = "Claude";
      else if (/codex|openai/i.test(dk)) base = "Codex";
      else if (/cursor/i.test(dk)) base = "Cursor";
      else if (/grok|xai/i.test(dk)) base = "Grok";
      else if (/gemini/i.test(dk)) base = "Gemini";
      else base = String(p.displayName || dk).split(/\\s+/)[0].slice(0, 8);
      const shortLabel = total > 1 ? base + idx : base;
      const q = getProviderQuota(p, null, now);
      if (!q) continue;
      const rawWins = extractWindows(p);
      const winList = rawWins.map((w) => {
        const r = Math.max(0, Math.min(100, Math.round(100 - w.usedPercent)));
        const wRemMs = w.resetsAt ? Date.parse(w.resetsAt) - now : NaN;
        const fc = computeBurnForecast(w, now);
        return {
          id: w.id || w.label || w.kind || "",
          label: translateWindowLabel(w.label || w.kind || w.id || ""),
          remaining: r,
          tone: toneForRemaining(r),
          resetText: Number.isFinite(wRemMs) && wRemMs > 0 ? fmtDurLong(wRemMs) : "",
          forecast: fc ? fc.text : "",
          forecastTone: fc ? fc.tone : "muted"
        };
      });
      pills.push({
        id: p.instanceId || p.id || (dk + ":" + idx),
        shortLabel,
        displayName: p.displayName || shortLabel,
        driverKind: dk,
        remaining: q.remaining,
        tone: q.tone,
        resetShort: q.resetShort,
        tooltip: q.tooltip,
        windows: winList
      });
    }
    return pills;
  }

  let __activeTopbarPop = { id: null, el: null, cleanup: null };
  function closeTopbarQuotaPopover() {
    if (__activeTopbarPop.cleanup) { try { __activeTopbarPop.cleanup(); } catch {} }
    if (__activeTopbarPop.el) { try { __activeTopbarPop.el.remove(); } catch {} }
    __activeTopbarPop = { id: null, el: null, cleanup: null };
  }
  function showTopbarQuotaPopover(pill, anchorEl) {
    if (!pill) return;
    if (__activeTopbarPop.id === pill.id && __activeTopbarPop.el && document.body.contains(__activeTopbarPop.el)) {
      closeTopbarQuotaPopover();
      return;
    }
    closeTopbarQuotaPopover();
    const zh = getLang() === "zh";
    const pop = document.createElement("div");
    pop.className = "t3-topbar-pop";
    pop.setAttribute("data-quota-ui-managed", "true");

    const head = document.createElement("div");
    head.className = "t3-topbar-pop-head";
    const titleWrap = document.createElement("div");
    titleWrap.style.cssText = "display:flex;align-items:center;gap:6px;min-width:0;";
    const dot = document.createElement("span");
    dot.className = "t3-topbar-pill-dot t3-q-dot-" + pill.tone;
    const title = document.createElement("span");
    title.className = "t3-topbar-pop-title";
    title.textContent = pill.displayName || pill.shortLabel;
    const badge = document.createElement("span");
    badge.className = "t3-topbar-pop-tag";
    badge.textContent = pill.shortLabel;
    titleWrap.appendChild(dot);
    titleWrap.appendChild(title);
    if (pill.displayName && pill.displayName !== pill.shortLabel) titleWrap.appendChild(badge);
    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "t3-topbar-pop-close";
    closeBtn.textContent = "×";
    closeBtn.onclick = () => closeTopbarQuotaPopover();
    head.appendChild(titleWrap);
    head.appendChild(closeBtn);
    pop.appendChild(head);

    const body = document.createElement("div");
    body.className = "t3-topbar-pop-body";
    const wins = Array.isArray(pill.windows) ? pill.windows : [];
    if (wins.length === 0) {
      const empty = document.createElement("div");
      empty.style.cssText = "font-size:11.5px;color:var(--v9-fg-3);padding:6px 0;";
      empty.textContent = zh ? "该厂商暂无明细配额窗口" : "No detailed quota windows reported";
      body.appendChild(empty);
    } else {
      for (const w of wins) {
        const card = document.createElement("div");
        card.className = "t3-topbar-pop-win";
        const top = document.createElement("div");
        top.className = "t3-topbar-pop-win-top";
        const lbl = document.createElement("span");
        lbl.className = "t3-topbar-pop-win-lbl";
        lbl.textContent = w.label;
        const pct = document.createElement("span");
        pct.className = "t3-topbar-pop-win-pct t3-q-" + w.tone;
        pct.textContent = (zh ? "剩余 " : "") + w.remaining + "%" + (zh ? "" : " left");
        top.appendChild(lbl);
        top.appendChild(pct);
        card.appendChild(top);

        const bar = document.createElement("div");
        bar.className = "t3-topbar-pop-bar";
        const fill = document.createElement("div");
        fill.className = "t3-topbar-pop-bar-fill t3-q-dot-" + w.tone;
        fill.style.width = Math.max(0, Math.min(100, w.remaining)) + "%";
        bar.appendChild(fill);
        card.appendChild(bar);

        const meta = document.createElement("div");
        meta.className = "t3-topbar-pop-win-meta";
        const resetEl = document.createElement("span");
        resetEl.textContent = w.resetText ? (zh ? "↻ " + w.resetText + "后重置" : "↻ resets in " + w.resetText) : (zh ? "无重置倒计时" : "No reset timer");
        meta.appendChild(resetEl);
        if (w.forecast) {
          const fcEl = document.createElement("span");
          fcEl.className = "t3-q-" + (w.forecastTone === "danger" ? "danger" : w.forecastTone === "warn" ? "warn" : "ok");
          fcEl.textContent = w.forecast;
          meta.appendChild(fcEl);
        }
        card.appendChild(meta);
        body.appendChild(card);
      }
    }
    pop.appendChild(body);

    const foot = document.createElement("div");
    foot.className = "t3-topbar-pop-foot";
    const openAll = document.createElement("button");
    openAll.type = "button";
    openAll.className = "t3-topbar-pop-link";
    openAll.textContent = zh ? "查看全部配额大盘 →" : "Open full Limits dashboard →";
    openAll.onclick = () => {
      closeTopbarQuotaPopover();
      try {
        const raw = window.localStorage.getItem("usage-page-preferences:v1");
        const pref = raw ? JSON.parse(raw) : {};
        pref.tab = "limits";
        window.localStorage.setItem("usage-page-preferences:v1", JSON.stringify(pref));
      } catch {}
      const link = document.querySelector('a[href="/usage"], a[href*="/usage"]');
      if (link) { link.click(); }
      else {
        try { window.history.pushState(null, "", "/usage"); window.dispatchEvent(new PopStateEvent("popstate")); } catch {}
      }
    };
    foot.appendChild(openAll);
    pop.appendChild(foot);

    document.body.appendChild(pop);
    const rect = anchorEl?.getBoundingClientRect?.();
    const popW = 304;
    let left = rect ? rect.left + rect.width / 2 - popW / 2 : window.innerWidth - popW - 24;
    left = Math.max(12, Math.min(window.innerWidth - popW - 12, left));
    const topPos = rect ? Math.min(window.innerHeight - 120, rect.bottom + 8) : 44;
    pop.style.left = Math.round(left) + "px";
    pop.style.top = Math.round(topPos) + "px";

    const onDown = (ev) => {
      if (!pop.contains(ev.target) && !(anchorEl && anchorEl.contains(ev.target))) closeTopbarQuotaPopover();
    };
    const onKey = (ev) => { if (ev.key === "Escape") closeTopbarQuotaPopover(); };
    setTimeout(() => {
      document.addEventListener("pointerdown", onDown, true);
      document.addEventListener("keydown", onKey, true);
    }, 0);
    __activeTopbarPop = {
      id: pill.id,
      el: pop,
      cleanup: () => {
        document.removeEventListener("pointerdown", onDown, true);
        document.removeEventListener("keydown", onKey, true);
      }
    };
  }

  const STARSHIP_STORY_ZH = {
    "Pad standby · cryo mist": "发射台待命 · 液氧冷雾",
    "Raptors ignite · clamps open": "猛禽点火 · 夹钳释放",
    "Max-Q · breaking clouds": "Max-Q 突破云层",
    "Edge of space · vacuum plume": "太空边缘 · 真空羽流",
    "Deep-space warp · full mission": "深空曲速巡航 · 满载任务"
  };

  function translateStarshipStory(key) {
    if (getLang() !== "zh") return key;
    return STARSHIP_STORY_ZH[key] || key;
  }

  function fmtBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + " GB";
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + " MB";
    if (bytes >= 1024) return (bytes / 1024).toFixed(1) + " KB";
    return Math.round(bytes) + " B";
  }

  function openCacheCleaner() {
    const existing = document.getElementById("t3-cache-cleaner-modal");
    if (existing) existing.remove();
    const zh = getLang() === "zh";
    const backdrop = document.createElement("div");
    backdrop.id = "t3-cache-cleaner-modal";
    backdrop.className = "t3-cache-modal-backdrop";
    backdrop.setAttribute("data-quota-ui-managed", "true");
    const modal = document.createElement("div");
    modal.className = "t3-cache-modal";
    backdrop.appendChild(modal);
    backdrop.addEventListener("click", (e) => { if (e.target === backdrop) backdrop.remove(); });
    document.body.appendChild(backdrop);

    let state = { loading: true, cleaning: false, error: "", data: null, selected: new Set(), result: null };

    function render() {
      modal.innerHTML = "";
      const head = document.createElement("div");
      head.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;";
      head.innerHTML = '<div><div style="font-size:15px;font-weight:700;">' + (zh ? "🧹 macOS 磁盘缓存清理中心" : "🧹 macOS Disk Cache Cleaner") + '</div><div style="font-size:11.5px;color:var(--v9-fg-2);margin-top:2px;">' + (zh ? "先预览各目录占用再确认清理 · 绝不触碰会话数据库、项目与账号凭证" : "Preview exact sizes before cleaning · never touches databases, threads, or auth tokens") + '</div></div>';
      const closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.className = "t3-pin-bar-btn";
      closeBtn.textContent = zh ? "关闭" : "Close";
      closeBtn.onclick = () => backdrop.remove();
      head.appendChild(closeBtn);
      modal.appendChild(head);

      if (state.loading) {
        const p = document.createElement("div");
        p.style.cssText = "padding:24px 0;text-align:center;font-size:12.5px;color:var(--v9-fg-2);";
        p.textContent = zh ? "正在扫描本机安全缓存目录…" : "Scanning safe cache directories…";
        modal.appendChild(p);
        return;
      }
      if (state.error) {
        const err = document.createElement("div");
        err.style.cssText = "padding:12px;border-radius:10px;background:var(--v9-bad-bg);color:var(--v9-bad);font-size:12px;";
        err.textContent = state.error;
        modal.appendChild(err);
        return;
      }
      if (state.result) {
        const ok = document.createElement("div");
        ok.style.cssText = "padding:10px 12px;border-radius:10px;margin-bottom:10px;background:var(--v9-ok-bg);color:var(--v9-ok);font-size:12px;font-weight:600;";
        ok.textContent = zh
          ? "✅ 清理完成：已释放 " + fmtBytes(state.result.freedBytes) + "（共清理 " + state.result.removedFiles + " 个缓存文件）"
          : "✅ Cleaned " + fmtBytes(state.result.freedBytes) + " (" + state.result.removedFiles + " files removed)";
        modal.appendChild(ok);
      }

      const items = state.data?.items || [];
      const list = document.createElement("div");
      list.style.cssText = "display:flex;flex-direction:column;gap:8px;margin-bottom:14px;";
      for (const item of items) {
        const row = document.createElement("label");
        row.className = "t3-cache-row";
        row.style.cursor = item.bytes > 0 ? "pointer" : "default";
        const left = document.createElement("div");
        left.style.cssText = "display:flex;align-items:flex-start;gap:8px;min-width:0;";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = state.selected.has(item.id);
        cb.disabled = item.bytes <= 0 || state.cleaning;
        cb.style.marginTop = "3px";
        cb.onchange = () => {
          if (cb.checked) state.selected.add(item.id);
          else state.selected.delete(item.id);
          render();
        };
        const info = document.createElement("div");
        info.style.minWidth = "0";
        info.innerHTML = '<div style="font-size:12.5px;font-weight:600;">' + (zh ? item.labelZh : item.labelEn) + '</div><div style="font-size:11px;color:var(--v9-fg-2);margin-top:1px;">' + (zh ? item.descZh : item.descEn) + '</div><div style="font-size:10.5px;color:var(--v9-fg-3);margin-top:2px;word-break:break-all;">' + item.displayPath + '</div>';
        left.appendChild(cb);
        left.appendChild(info);
        const right = document.createElement("div");
        right.style.cssText = "text-align:right;flex-shrink:0;";
        right.innerHTML = '<div style="font-size:12.5px;font-weight:700;font-variant-numeric:tabular-nums;">' + fmtBytes(item.bytes) + '</div><div style="font-size:10.5px;color:var(--v9-fg-3);">' + item.files + (zh ? " 个文件" : " files") + '</div>';
        row.appendChild(left);
        row.appendChild(right);
        list.appendChild(row);
      }
      modal.appendChild(list);

      let selBytes = 0;
      for (const it of items) { if (state.selected.has(it.id)) selBytes += it.bytes; }
      const foot = document.createElement("div");
      foot.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:10px;padding-top:10px;border-top:0.5px solid var(--v9-hair);";
      const summary = document.createElement("div");
      summary.style.cssText = "font-size:12px;color:var(--v9-fg-2);";
      summary.innerHTML = (zh ? "已选可释放：" : "Selected to free: ") + '<b style="color:var(--v9-fg);">' + fmtBytes(selBytes) + '</b>';
      const actions = document.createElement("div");
      actions.style.cssText = "display:flex;gap:8px;";
      const rescanBtn = document.createElement("button");
      rescanBtn.type = "button";
      rescanBtn.className = "t3-pin-bar-btn";
      rescanBtn.textContent = zh ? "重新扫描" : "Rescan";
      rescanBtn.disabled = state.cleaning;
      rescanBtn.onclick = () => scan();
      const cleanBtn = document.createElement("button");
      cleanBtn.type = "button";
      cleanBtn.className = "t3-pin-bar-btn send";
      cleanBtn.disabled = state.cleaning || state.selected.size === 0 || selBytes <= 0;
      cleanBtn.textContent = state.cleaning ? (zh ? "清理中…" : "Cleaning…") : (zh ? "确认清理所选 (" + fmtBytes(selBytes) + ")" : "Clean Selected (" + fmtBytes(selBytes) + ")");
      cleanBtn.onclick = async () => {
        state.cleaning = true;
        state.result = null;
        render();
        try {
          const ids = Array.from(state.selected).join(",");
          const resp = await fetch("/api/assets/__t3_cache_clean?confirm=1&ids=" + encodeURIComponent(ids));
          const json = await resp.json();
          if (!resp.ok) throw new Error(json.error || "Clean failed");
          state.result = json;
          state.data = json;
          state.selected = new Set((json.items || []).filter((x) => x.bytes > 0).map((x) => x.id));
        } catch (e) {
          state.error = String(e.message || e);
        } finally {
          state.cleaning = false;
          render();
        }
      };
      actions.appendChild(rescanBtn);
      actions.appendChild(cleanBtn);
      foot.appendChild(summary);
      foot.appendChild(actions);
      modal.appendChild(foot);
    }

    async function scan() {
      state.loading = true;
      state.error = "";
      render();
      try {
        const resp = await fetch("/api/assets/__t3_cache_scan");
        const json = await resp.json();
        if (!resp.ok) throw new Error(json.error || "Scan failed");
        state.data = json;
        state.selected = new Set((json.items || []).filter((x) => x.bytes > 0).map((x) => x.id));
      } catch (e) {
        state.error = String(e.message || e);
      } finally {
        state.loading = false;
        render();
      }
    }
    scan();
  }

  let __pinState = { active: false, pins: [], overlay: null, listeners: new Set() };
  function notifyPinListeners() {
    for (const fn of __pinState.listeners) { try { fn({ active: __pinState.active, count: __pinState.pins.length }); } catch {} }
  }
  function clearPinOverlay() {
    if (__pinState.overlay) { __pinState.overlay.remove(); __pinState.overlay = null; }
    __pinState.active = false;
    __pinState.pins = [];
    notifyPinListeners();
  }
  function renderPinOverlay() {
    const ov = __pinState.overlay;
    if (!ov) return;
    ov.innerHTML = "";
    const zh = getLang() === "zh";
    __pinState.pins.forEach((pin, idx) => {
      const m = document.createElement("button");
      m.type = "button";
      m.className = "t3-pin-marker";
      m.style.left = pin.xPct.toFixed(1) + "%";
      m.style.top = pin.yPct.toFixed(1) + "%";
      m.textContent = String(idx + 1);
      m.title = pin.note || (zh ? "点击编辑批注" : "Click to edit note");
      m.onclick = (ev) => { ev.stopPropagation(); pin.editing = !pin.editing; renderPinOverlay(); };
      ov.appendChild(m);
      if (pin.editing) {
        const pop = document.createElement("div");
        pop.className = "t3-pin-popover";
        pop.style.left = Math.min(72, Math.max(4, pin.xPct)) + "%";
        pop.style.top = Math.min(76, Math.max(8, pin.yPct + 2)) + "%";
        pop.onclick = (ev) => ev.stopPropagation();
        const ta = document.createElement("textarea");
        ta.placeholder = zh ? "输入针对此处的修改意见…" : "Describe change for this spot…";
        ta.value = pin.note || "";
        ta.oninput = () => { pin.note = ta.value; };
        const bar = document.createElement("div");
        bar.style.cssText = "display:flex;justify-content:space-between;gap:6px;margin-top:6px;";
        const del = document.createElement("button");
        del.type = "button";
        del.className = "t3-pin-bar-btn";
        del.textContent = zh ? "删除" : "Delete";
        del.onclick = () => { __pinState.pins.splice(idx, 1); renderPinOverlay(); notifyPinListeners(); };
        const ok = document.createElement("button");
        ok.type = "button";
        ok.className = "t3-pin-bar-btn send";
        ok.textContent = zh ? "保存" : "Done";
        ok.onclick = () => { pin.editing = false; renderPinOverlay(); };
        bar.appendChild(del);
        bar.appendChild(ok);
        pop.appendChild(ta);
        pop.appendChild(bar);
        ov.appendChild(pop);
        setTimeout(() => ta.focus(), 10);
      }
    });
  }
  function togglePreviewPins() {
    if (__pinState.active) { clearPinOverlay(); return; }
    const vp = document.querySelector("[data-preview-viewport]");
    if (!vp) return;
    if (getComputedStyle(vp).position === "static") vp.style.position = "relative";
    const ov = document.createElement("div");
    ov.className = "t3-pin-overlay";
    ov.setAttribute("data-quota-ui-managed", "true");
    ov.addEventListener("click", (ev) => {
      const rect = ov.getBoundingClientRect();
      const xPct = Math.max(2, Math.min(98, ((ev.clientX - rect.left) / Math.max(1, rect.width)) * 100));
      const yPct = Math.max(4, Math.min(96, ((ev.clientY - rect.top) / Math.max(1, rect.height)) * 100));
      __pinState.pins.forEach((p) => { p.editing = false; });
      __pinState.pins.push({ xPct, yPct, note: "", editing: true });
      renderPinOverlay();
      notifyPinListeners();
    });
    vp.appendChild(ov);
    __pinState.overlay = ov;
    __pinState.active = true;
    __pinState.pins = [];
    notifyPinListeners();
  }
  function sendPreviewPins(onCapture) {
    if (__pinState.pins.length === 0) return;
    const zh = getLang() === "zh";
    const lines = __pinState.pins.map((p, i) => (i + 1) + ". Pin #" + (i + 1) + " (" + p.xPct.toFixed(0) + "%, " + p.yPct.toFixed(0) + "%): " + (p.note?.trim() || (zh ? "请优化此处视觉/布局" : "Inspect and refine this spot")));
    const header = zh ? "[内置预览图钉批注]" : "[Preview Pin Annotations]";
    const payload = header + "\\n" + lines.join("\\n");
    if (typeof onCapture === "function") { try { onCapture(false); } catch {} }
    const ed = document.querySelector('.composer-tiptap [contenteditable="true"], [data-slot="composer"] [contenteditable="true"]');
    if (ed) {
      ed.focus();
      try { document.execCommand("insertText", false, (ed.textContent?.trim() ? "\\n\\n" : "") + payload); } catch {}
    } else if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(payload).catch(() => {});
    }
    clearPinOverlay();
  }
  function subscribePreviewPins(fn) {
    __pinState.listeners.add(fn);
    fn({ active: __pinState.active, count: __pinState.pins.length });
    return () => __pinState.listeners.delete(fn);
  }

  const api = {
    getLang,
    isZh: () => getLang() === "zh",
    setLang: (next) => {
      const v = next === "en" ? "en" : "zh";
      try { window.localStorage.setItem(LANG_KEY, v); } catch {}
      emitChange();
    },
    toggleLang: () => {
      api.setLang(getLang() === "zh" ? "en" : "zh");
    },
    getCurrency,
    isCny: () => getCurrency() === "CNY",
    getRate,
    setCurrency: (next) => {
      const v = next === "CNY" ? "CNY" : "USD";
      try { window.localStorage.setItem(CURR_KEY, v); } catch {}
      emitChange();
    },
    toggleCurrency: () => {
      api.setCurrency(getCurrency() === "CNY" ? "USD" : "CNY");
    },
    translateWindowLabel,
    translateStarshipStory,
    fmtDurShort,
    fmtDurLong,
    computeBurnForecast,
    getProviderQuota,
    buildTopbarPills,
    showTopbarQuotaPopover,
    closeTopbarQuotaPopover,
    openCacheCleaner,
    togglePreviewPins,
    sendPreviewPins,
    subscribePreviewPins,
    subscribe: (listener) => {
      const onUpdate = () => listener({ lang: getLang(), currency: getCurrency(), rate: getRate() });
      window.addEventListener("t3-quota-ui:change", onUpdate);
      window.addEventListener("storage", onUpdate);
      return () => {
        window.removeEventListener("t3-quota-ui:change", onUpdate);
        window.removeEventListener("storage", onUpdate);
      };
    }
  };

  window.__t3QuotaUi = api;
  syncDataset();

  window.addEventListener("DOMContentLoaded", () => {
    applyDomI18n(document.body);
    let raf = 0;
    const obs = new MutationObserver(() => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        applyDomI18n(document.body);
      });
    });
    obs.observe(document.body, { childList: true, subtree: true });
  });
})();
</script>`;

  const v18Script = __STARDUST_V18_JS
    ? `<script id="t3-stardust-v18">\n${__STARDUST_V18_JS}\n</script>`
    : "";

  return `<!-- T3_QUOTA_UI_START -->\n${styleBlock}\n${v18Script}\n${runtimeScript}\n<!-- T3_QUOTA_UI_END -->`;
}

function patchUsageFormatBundle(src) {
  if (src.includes("__t3CnyFmt")) return src;
  let out = src;

  const usdFmtMatch = out.match(
    /([A-Za-z0-9_$]+)=new Intl\.NumberFormat\([`"']en-US[`"'],\{style:[`"']currency[`"'],currency:[`"']USD[`"'],minimumFractionDigits:2,maximumFractionDigits:2\}\)/,
  );
  if (!usdFmtMatch) return out;
  const usdFmtVar = usdFmtMatch[1];

  // 1. Dynamic USD <-> CNY currency formatter
  const fnRe = new RegExp(
    `function ([A-Za-z0-9_$]+)\\(([A-Za-z0-9_$]+)\\)\\{return ${usdFmtVar.replace(/\$/g, "\\$")}\\.format\\(\\2\\)\\}`,
  );
  out = out.replace(
    fnRe,
    (_, fnName, argName) =>
      `var __t3CnyFmt=new Intl.NumberFormat("zh-CN",{style:"currency",currency:"CNY",minimumFractionDigits:2,maximumFractionDigits:2});function __t3Zh(){return globalThis.__t3QuotaUi?globalThis.__t3QuotaUi.isZh():!0}function __t3Cny(){return globalThis.__t3QuotaUi?globalThis.__t3QuotaUi.isCny():!1}function __t3Rate(){return globalThis.__t3QuotaUi?globalThis.__t3QuotaUi.getRate():7.25}function ${fnName}(${argName}){const __v=Number.isFinite(${argName})?${argName}:0;return __t3Cny()?__t3CnyFmt.format(__v*__t3Rate()):${usdFmtVar}.format(__v)}`,
  );

  // 2. Malformed records notice
  out = out.replace(
    /`\$\{([A-Za-z0-9_$]+)\} malformed or inconsistent usage record\(s\) were skipped; usage may be incomplete\.`/g,
    (_, nVar) =>
      `(__t3Zh()?\`已跳过 \${${nVar}} 条格式异常或不完整的用量记录，统计可能不完整。\`: \`\${${nVar}} malformed or inconsistent usage record(s) were skipped; usage may be incomplete.\`)`,
  );

  // 3. Server/client version mismatch notice
  out = out.replace(
    /([A-Za-z0-9_$]+)\.direction===[`"']serverBehind[`"']\?`\$\{([A-Za-z0-9_$]+)\} runs an older server version and is excluded from totals\.`:`This client is older than the server on \$\{\2\}; its usage is excluded from totals\.`/g,
    (_, tVar, eVar) =>
      `(__t3Zh()?(${tVar}.direction==="serverBehind"?\`\${${eVar}} 运行的服务端版本较旧，未计入总计。\`: \`当前客户端版本低于 \${${eVar}} 服务端，其用量未计入总计。\`):(${tVar}.direction==="serverBehind"?\`\${${eVar}} runs an older server version and is excluded from totals.\`: \`This client is older than the server on \${${eVar}}; its usage is excluded from totals.\`))`,
  );

  // 4. Day label (e.g. "Nov 22" <-> "11月22日")
  out = out.replace(
    /`\$\{\[[`"']Jan[`"'],[`"']Feb[`"'],[`"']Mar[`"'],[`"']Apr[`"'],[`"']May[`"'],[`"']Jun[`"'],[`"']Jul[`"'],[`"']Aug[`"'],[`"']Sep[`"'],[`"']Oct[`"'],[`"']Nov[`"'],[`"']Dec[`"']\]\[([A-Za-z0-9_$]+)-1\]\?\?[`"'][`"']\} \$\{([A-Za-z0-9_$]+)\}`/g,
    (_, mVar, dVar) =>
      `(__t3Zh()?\`\${${mVar}}月\${${dVar}}日\`: \`\${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][${mVar}-1]??""} \${${dVar}}\`)`,
  );

  // 5. Relative hour ("today" / "yesterday" <-> "今日" / "昨日")
  out = out.replace(
    /([A-Za-z0-9_$]+)===0\?`\$\{([A-Za-z0-9_$]+)\} today`:\1===1\?`\$\{\2\} yesterday`:/g,
    (_, diffVar, hrVar) =>
      `${diffVar}===0?(__t3Zh()?\`今日 \${${hrVar}}\`:\`\${${hrVar}} today\`):${diffVar}===1?(__t3Zh()?\`昨日 \${${hrVar}}\`:\`\${${hrVar}} yesterday\`):`,
  );

  // 6. Month-day-hour DateTimeFormat locale
  out = out.replace(
    /([A-Za-z0-9_$]+)\([`"']en-US[`"'],(\{\.\.\.[A-Za-z0-9_$]+===void 0\?\{\}:\{timeZone:[A-Za-z0-9_$]+\},month:[`"']short[`"'],day:[`"']numeric[`"'])/g,
    (_, gFn, rest) => `${gFn}(__t3Zh()?"zh-CN":"en-US",${rest}`,
  );

  return out;
}

function patchUsageShortcutsBundle(src) {
  if (src.includes("__t3ShortcutZh")) return src;
  let out = src;

  const pairs = [
    [/label:[`"']Cost[`"'],command:[`"']usage\.cost[`"']/, 'get label(){return __t3ShortcutZh()?"费用":"Cost"},command:"usage.cost"'],
    [/label:[`"']Tokens[`"'],command:[`"']usage\.tokens[`"']/, 'get label(){return __t3ShortcutZh()?"Token":"Tokens"},command:"usage.tokens"'],
    [/label:[`"']Limits[`"'],command:[`"']usage\.limits[`"']/, 'get label(){return __t3ShortcutZh()?"限额":"Limits"},command:"usage.limits"'],
    [/label:[`"']Past 24h[`"'],command:[`"']usage\.period\.day[`"']/, 'get label(){return __t3ShortcutZh()?"24小时":"Past 24h"},command:"usage.period.day"'],
    [/label:[`"']7 days[`"'],command:[`"']usage\.period\.week[`"']/, 'get label(){return __t3ShortcutZh()?"7天":"7 days"},command:"usage.period.week"'],
    [/label:[`"']30 days[`"'],command:[`"']usage\.period\.month[`"']/, 'get label(){return __t3ShortcutZh()?"30天":"30 days"},command:"usage.period.month"'],
    [/label:[`"']90 days[`"'],command:[`"']usage\.period\.quarter[`"']/, 'get label(){return __t3ShortcutZh()?"90天":"90 days"},command:"usage.period.quarter"'],
  ];

  let matched = false;
  for (const [re, rep] of pairs) {
    if (re.test(out)) {
      out = out.replace(re, rep);
      matched = true;
    }
  }
  if (matched) {
    out += `\nfunction __t3ShortcutZh(){return globalThis.__t3QuotaUi?globalThis.__t3QuotaUi.isZh():!0}\n`;
  }
  return out;
}

function patchUsageLimitsShared(src) {
  let out = src;

  // 1. Keep each enabled provider instance distinct (e.g. dual Antigravity / Claude / Codex accounts)
  out = out.replace(
    /[A-Za-z0-9_$]+\([A-Za-z0-9_$]+\(([A-Za-z0-9_$]+)\)\)\?\?(`?\$\{[A-Za-z0-9_$]+\}:\$\{\1\.instanceId\}`?,\{key:`?\$\{[A-Za-z0-9_$]+\}:\$\{\1\.instanceId\}`?)/g,
    "$2",
  );
  out = out.replace(
    /([A-Za-z0-9_$]+)=[A-Za-z0-9_$]+\([A-Za-z0-9_$]+\(([A-Za-z0-9_$]+)\)\)\?\?(`instance:\$\{\2\.instanceId\}`)/g,
    "$1=$3",
  );

  // 2. Emit side-by-side per-account pools when a provider has multiple accounts (Account 1 Left, Account 2 Right)
  if (!out.includes("splitAccount:")) {
    out = out.replace(
      /return\[\.\.\.([A-Za-z0-9_$]+)\]\.map\(\(\[([A-Za-z0-9_$]+),([A-Za-z0-9_$]+)\]\)(\s*=>\s*\{[\s\S]*?)return\{driver:\2,accounts:([A-Za-z0-9_$]+),windows:([A-Za-z0-9_$]+)\(\5,([A-Za-z0-9_$]+)\)\}\}\)/,
      (_, mapVar, drvVar, listVar, bodyPrefix, accsVar, zFn, nowArg) =>
        `return[...${mapVar}].flatMap(([${drvVar},${listVar}])${bodyPrefix}const __ordered=[...${accsVar}].sort((x,y)=>{const xp=x.key.endsWith(":"+${drvVar})&&!x.displayName?0:1,yp=y.key.endsWith(":"+${drvVar})&&!y.displayName?0:1;return xp-yp||(x.displayName??x.key).localeCompare(y.displayName??y.key,void 0,{numeric:!0})});if(__ordered.length>1)return __ordered.map((__acc,__idx)=>({poolKey:\`\${${drvVar}}:\${__acc.key}\`,driver:${drvVar},splitAccount:__acc,splitIndex:__idx+1,splitTotal:__ordered.length,accounts:[__acc],windows:${zFn}([__acc],${nowArg})}));return[{poolKey:${drvVar},driver:${drvVar},accounts:__ordered,windows:${zFn}(__ordered,${nowArg})}]})`,
    );
  }

  if (out.includes("__t3LimSharedZh")) return out;

  // 3. Localize Cursor pool metadata, reset timers, and limit notices dynamically
  out = out.replace(
    /\{id:[`"']totalPercentUsed[`"'],label:[`"']Overall[`"'],description:[`"']All usage on your plan this billing cycle\.[`"']\}/,
    '{id:"totalPercentUsed",get label(){return __t3LimSharedZh()?"总配额":"Overall"},get description(){return __t3LimSharedZh()?"当前计费周期内套餐的总可用额度。":"All usage on your plan this billing cycle."}}',
  );
  out = out.replace(
    /\{id:[`"']autoPercentUsed[`"'],label:[`"']Cursor Models[`"'],description:[`"']Grok, Composer, and Auto use this allowance\.[`"']\}/,
    '{id:"autoPercentUsed",get label(){return __t3LimSharedZh()?"Cursor 模型":"Cursor Models"},get description(){return __t3LimSharedZh()?"Grok、Composer 与 Auto 模式共用此额度池。":"Grok, Composer, and Auto use this allowance."}}',
  );
  out = out.replace(
    /\{id:[`"']apiPercentUsed[`"'],label:[`"']Other Models[`"'],description:[`"']Usage allowance for third-party models such as Claude, GPT, and Gemini\.[`"']\}/,
    '{id:"apiPercentUsed",get label(){return __t3LimSharedZh()?"第三方模型":"Other Models"},get description(){return __t3LimSharedZh()?"Claude、GPT、Gemini 等第三方模型的可用额度。":"Usage allowance for third-party models such as Claude, GPT, and Gemini."}}',
  );

  // Duration formatter: 3d 5h / 2h 15m / 45m <-> 3天5小时 / 2小时15分 / 45分
  out = out.replace(
    /([A-Za-z0-9_$]+)>0\?`\$\{\1\}d \$\{([A-Za-z0-9_$]+)\}h`:\2>0\?`\$\{\2\}h \$\{([A-Za-z0-9_$]+)\}m`:`\$\{\3\}m`/g,
    (_, dVar, hVar, mVar) =>
      `(__t3LimSharedZh()?(${dVar}>0?\`\${${dVar}}天\${${hVar}}小时\`:${hVar}>0?\`\${${hVar}}小时\${${mVar}}分\`:\`\${${mVar}}分\`):(${dVar}>0?\`\${${dVar}}d \${${hVar}}h\`:${hVar}>0?\`\${${hVar}}h \${${mVar}}m\`:\`\${${mVar}}m\`))`,
  );

  // Reset countdown string: resets now / Resets momentarily / resets in X
  out = out.replace(
    /([A-Za-z0-9_$]+)<=([A-Za-z0-9_$]+)\?[`"']resets now[`"']:\1-\2<([A-Za-z0-9_$]+)\?[`"']Resets momentarily[`"']:`resets in \$\{([A-Za-z0-9_$]+)\(\1-\2\)\}`/g,
    (_, endVar, nowVar, minVar, fmtFn) =>
      `(${endVar}<=${nowVar}?(__t3LimSharedZh()?"即将重置":"resets now"):${endVar}-${nowVar}<${minVar}?(__t3LimSharedZh()?"片刻后重置":"Resets momentarily"):(__t3LimSharedZh()?\`\${${fmtFn}(${endVar}-${nowVar})}后重置\`:\`resets in \${${fmtFn}(${endVar}-${nowVar})}\`))`,
  );

  // Limit error / fallback strings
  out = out.replace(
    /([`"'])This account has no subscription limits\.\1/g,
    '(__t3LimSharedZh()?"该账号无订阅配额限制。":"This account has no subscription limits.")',
  );
  out = out.replace(
    /([`"'])Could not read limits\.\1/g,
    '(__t3LimSharedZh()?"无法读取配额限制。":"Could not read limits.")',
  );
  out = out.replace(
    /([`"'])No limits reported\.\1/g,
    '(__t3LimSharedZh()?"未上报配额数据。":"No limits reported.")',
  );
  out = out.replace(
    /:[`"']No reset credits banked[`"']/g,
    ':(__t3LimSharedZh()?"暂无可用重置券":"No reset credits banked")',
  );
  out = out.replace(
    /actionLabel:[`"']Use reset[`"']/g,
    'actionLabel:(__t3LimSharedZh()?"使用重置券":"Use reset")',
  );
  out = out.replace(
    /actionLabel:[`"']Use[`"']/g,
    'actionLabel:(__t3LimSharedZh()?"使用":"Use")',
  );

  out += `\nfunction __t3LimSharedZh(){return globalThis.__t3QuotaUi?globalThis.__t3QuotaUi.isZh():!0}\n`;
  return out;
}

function patchUsageLimitsView(src) {
  let out = src;

  // 1. Scale PoolWindowCard headline percentage from text-3xl to text-xl
  out = out.replace(
    /([`"'])text-3xl font-semibold text-foreground tabular-nums\1/g,
    (_, q) => `${q}text-xl font-semibold text-foreground tabular-nums${q}`,
  );

  // 2. Compact PoolWindowCard padding & grid columns
  out = out.replace(
    /([`"'])(?:t3-quota-card\s+)?grid items-center gap-x-(?:6|3) gap-y-(?:3|1\.5) rounded-lg border border-border\/60 (?:p-4 md:grid-cols-\[11rem_minmax\(0,1fr\)\]|px-3 py-2 grid-cols-\[8\.5rem_minmax\(0,1fr\)\])\1/g,
    (_, q) =>
      `${q}t3-quota-card grid items-center gap-x-3 gap-y-1.5 rounded-lg border border-border/60 px-3 py-2 grid-cols-[8.5rem_minmax(0,1fr)]${q}`,
  );

  // 3. Upgrade PoolSection (Ee) & PooledLimits (De) for:
  //    - Side-by-side per-account columns (Left: Antigravity 1, Right: Antigravity 2)
  //    - Dense side-by-side single-card providers (Left: Cursor, Right: Grok)
  if (!out.includes("t3-quota-col-1")) {
    // Support splitAccount title, accentColor & 1-col vs 2-col section sizing in Ee
    out = out.replace(
      /function ([A-Za-z0-9_$]+)\(([A-Za-z0-9_$]+)\)\{let ([A-Za-z0-9_$]+)=\(0,([A-Za-z0-9_$]+)\.c\)\(\d+\),\{pool:([A-Za-z0-9_$]+),now:([A-Za-z0-9_$]+)\}=\2,([A-Za-z0-9_$]+);\3\[0\]===\5\.driver\?\7=\3\[1\]:\(\7=([A-Za-z0-9_$]+)\(\5\.driver\),\3\[0\]=\5\.driver,\3\[1\]=\7\);let ([A-Za-z0-9_$]+)=\7,([A-Za-z0-9_$]+);\3\[2\]===\5\.driver\?\10=\3\[3\]:\(\10=([A-Za-z0-9_$]+)\.get\(\5\.driver\)\?\.label\?\?String\(\5\.driver\),\3\[2\]=\5\.driver,\3\[3\]=\10\);let ([A-Za-z0-9_$]+)=\10,([A-Za-z0-9_$]+);if\(\3\[4\]!==\9\|\|\3\[5\]!==\12\|\|\3\[6\]!==\6\|\|\3\[7\]!==\5\)\{let ([A-Za-z0-9_$]+)=([A-Za-z0-9_$]+)\(\5\),([A-Za-z0-9_$]+);\3\[9\]!==\12\|\|\3\[10\]!==\5\.driver\?\(\16=\(0,([A-Za-z0-9_$]+)\.jsx\)\(([A-Za-z0-9_$]+),\{driverKind:\5\.driver,displayName:\12,indicatorBackground:[`"']var\(--background\)[`"'],className:[`"']size-5[`"'],iconClassName:[`"']size-4 text-foreground\/80[`"']\}\),([\s\S]*?),\13=\(0,\17\.jsxs\)\([`"']section[`"'],\{className:[`"'][^`"']*[`"'],children:\[([A-Za-z0-9_$]+),(?:\(0,\17\.jsx\)\([`"']div[`"'],\{className:[`"'][^`"']*[`"'],children:)?([^\]]+?)(?:\}\))?\]\}\)/,
      (
        _,
        eeFn,
        eArg,
        tMemo,
        uNs,
        nPool,
        rNow,
        iVar,
        feFn,
        aColor,
        oVar,
        hMap,
        sLbl,
        cOut,
        eWins,
        zFn,
        iconEl,
        jsxNs,
        hIconComp,
        midBlock,
        h2El,
        cardsMapExpr,
      ) =>
        `function ${eeFn}(${eArg}){let ${tMemo}=(0,${uNs}.c)(19),{pool:${nPool},now:${rNow}}=${eArg},${iVar};${tMemo}[0]===${nPool}?${iVar}=${tMemo}[1]:(${iVar}=${nPool}.splitAccount?.accentColor||${feFn}(${nPool}.driver),${tMemo}[0]=${nPool},${tMemo}[1]=${iVar});let ${aColor}=${iVar},${oVar};${tMemo}[2]===${nPool}?${oVar}=${tMemo}[3]:(${oVar}=(()=>{const __b=${hMap}.get(${nPool}.driver)?.label??String(${nPool}.driver);return ${nPool}.splitAccount?(${nPool}.splitAccount.displayName||(${nPool}.splitTotal>1?\`\${__b} \${${nPool}.splitIndex}\`:__b)):__b})(),${tMemo}[2]=${nPool},${tMemo}[3]=${oVar});let ${sLbl}=${oVar},${cOut};if(${tMemo}[4]!==${aColor}||${tMemo}[5]!==${sLbl}||${tMemo}[6]!==${rNow}||${tMemo}[7]!==${nPool}){let ${eWins}=${zFn}(${nPool}),${iconEl};const __col1=Boolean(${nPool}.splitAccount)||${eWins}.length<=1;${tMemo}[9]!==${sLbl}||${tMemo}[10]!==${nPool}?(${iconEl}=(0,${jsxNs}.jsx)(${hIconComp},{driverKind:${nPool}.driver,displayName:${sLbl},accentColor:${nPool}.splitAccount?.accentColor,showBadge:Boolean(${nPool}.splitAccount?.accentColor),indicatorBackground:"var(--background)",className:"size-5",iconClassName:"size-4 text-foreground/80"}),${midBlock},${cOut}=(0,${jsxNs}.jsxs)("section",{className:__col1?"t3-quota-section t3-quota-col-1 flex flex-col gap-1.5":"t3-quota-section t3-quota-col-2 flex flex-col gap-1.5",children:[${h2El},(0,${jsxNs}.jsx)("div",{className:__col1?"t3-quota-grid-1 grid grid-cols-1 gap-2":"t3-quota-grid grid grid-cols-1 gap-2 md:grid-cols-2",children:${cardsMapExpr}})]})`,
    );

    // Key pool fragments by poolKey ?? driver in De
    out = out.replace(
      /children:\(0,([A-Za-z0-9_$]+)\.jsx\)\(([A-Za-z0-9_$]+),\{pool:([A-Za-z0-9_$]+),now:([A-Za-z0-9_$]+)\}\)\},\3\.driver\)/g,
      "children:(0,$1.jsx)($2,{pool:$3,now:$4})},$3.poolKey??$3.driver)",
    );
  }

  // 4. Outer container class .t3-quota-sections
  out = out.replace(
    /([`"'])(?:t3-quota-sections\s+)?flex flex-col gap-(?:8|3\.5)\1/g,
    (_, q) => `${q}t3-quota-sections flex flex-col gap-3.5${q}`,
  );

  // 4b. v1.2.1 Full-width Burn-rate Forecast footer row inside each PoolWindowCard (we)
  //     Also auto-heals v1.2.0's cramped left-column placement if upgrading in-place.
  if (out.includes("children:[l,m,h,(0,") && out.includes("__T3BurnBadge")) {
    out = out.replace(
      /\(0,([A-Za-z0-9_$]+)\.jsxs\)\("div",\{className:"flex flex-col gap-1",children:\[([A-Za-z0-9_$]+),([A-Za-z0-9_$]+),([A-Za-z0-9_$]+),\(0,\1\.jsx\)\(__T3BurnBadge,\{pool:([A-Za-z0-9_$]+),now:([A-Za-z0-9_$]+)\}\)\]\}\)/,
      `(0,$1.jsxs)("div",{className:"flex flex-col gap-1",children:[$2,$3,$4]})`,
    );
  }
  if (!out.includes("t3-burn-row")) {
    const reactMatch = out.match(/\(\s*0\s*,\s*([A-Za-z0-9_$]+)\.useState\s*\)/);
    const cardMatch = out.match(
      /function ([A-Za-z0-9_$]+)\(([A-Za-z0-9_$]+)\)\{let ([A-Za-z0-9_$]+)=\(0,([A-Za-z0-9_$]+)\.c\)\(\d+\),\{pool:([A-Za-z0-9_$]+),color:([A-Za-z0-9_$]+),now:([A-Za-z0-9_$]+),label:([A-Za-z0-9_$]+),description:([A-Za-z0-9_$]+)\}=\2([\s\S]{0,2400}?)\(0,([A-Za-z0-9_$]+)\.jsxs\)\([`"']div[`"'],\{className:[`"']t3-quota-card[^`"']*[`"'],children:\[([A-Za-z0-9_$]+),([A-Za-z0-9_$]+),([A-Za-z0-9_$]+)\]\}\)/,
    );
    if (reactMatch && cardMatch) {
      const reactNs = reactMatch[1];
      const jsxNs = cardMatch[11];
      const poolV = cardMatch[5];
      const nowV = cardMatch[7];
      out = out.replace(
        cardMatch[0],
        cardMatch[0].replace(
          `children:[${cardMatch[12]},${cardMatch[13]},${cardMatch[14]}]`,
          `children:[${cardMatch[12]},${cardMatch[13]},${cardMatch[14]},(0,${jsxNs}.jsx)(__T3BurnBadge,{pool:${poolV},now:${nowV}})]`,
        ),
      );
      const burnComp = `function __T3BurnBadge({pool,now}){const[,setTick]=(0,${reactNs}.useState)(0);(0,${reactNs}.useEffect)(()=>{if(!globalThis.__t3QuotaUi?.subscribe)return;return globalThis.__t3QuotaUi.subscribe(()=>setTick(x=>x+1))},[]);const fc=globalThis.__t3QuotaUi?.computeBurnForecast?.(pool,now);if(!fc||!fc.text)return null;return(0,${jsxNs}.jsx)("div",{className:"t3-burn-row",children:(0,${jsxNs}.jsx)("span",{className:"t3-burn-badge t3-burn-"+fc.tone,title:fc.title||fc.text,children:fc.text})})}`;
      if (out.includes("function __T3BurnBadge(")) {
        out = out.replace(/function __T3BurnBadge\([\s\S]*?\}\n/, `${burnComp}\n`);
      } else {
        out += `\n${burnComp}\n`;
      }
    }
  }

  if (out.includes("__t3LimViewZh")) return out;

  // 5. Full Limits tab localization (dynamic zh/en + CNY/USD $0 cap)
  out = out.replace(
    /className:[`"']text-sm font-medium text-foreground[`"'],children:([A-Za-z0-9_$]+\?\?[A-Za-z0-9_$]+\.label)/g,
    'className:"text-sm font-medium text-foreground",children:__t3WinLbl($1)',
  );
  out = out.replace(
    /className:[`"']truncate text-muted-foreground[`"'],children:([A-Za-z0-9_$]+\.label)/g,
    'className:"truncate text-muted-foreground",children:__t3WinLbl($1)',
  );
  out = out.replace(
    /\(([`"'])span\1,\{children:\1left\1\}\)/g,
    '("span",{children:__t3LimViewZh()?"剩余":"left"})',
  );
  out = out.replace(
    /([A-Za-z0-9_$]+)\?\.replace\([`"']resets in [`"'],[`"']↻ [`"']\)/g,
    '(__t3LimViewZh()?($1?.replace(/^(.+)后重置$/,"↻ $$1")):($1?.replace("resets in ","↻ ")))',
  );
  out = out.replace(
    /([`"'])\$0 cap\1/g,
    '(__t3LimViewZh()?(__t3LimViewCny()?"¥0 限额":"$0 限额"):"$0 cap")',
  );
  out = out.replace(
    /label:[`"']Plan[`"'],children:([A-Za-z0-9_$]+\.plan)/g,
    'label:__t3LimViewZh()?"套餐":"Plan",children:$1',
  );
  out = out.replace(
    /([A-Za-z0-9_$]+\.environments\.length)>0\?[`"']Signed in[`"']:[`"']Via[`"']/g,
    '$1>0?(__t3LimViewZh()?"登录环境":"Signed in"):(__t3LimViewZh()?"来源":"Via")',
  );
  out = out.replace(
    /label:[`"']Left[`"'],children:\[([A-Za-z0-9_$]+),[`"']%[`"']\]/g,
    'label:__t3LimViewZh()?"剩余额度":"Left",children:[$1,"%"]',
  );
  out = out.replace(
    /label:[`"']Resets[`"'],children:\[/g,
    'label:__t3LimViewZh()?"重置时间":"Resets",children:[',
  );
  out = out.replace(
    /label:[`"']Even pace[`"'],children:\[([A-Za-z0-9_$]+),[`"']% left by now[`"']\]/g,
    'label:__t3LimViewZh()?"均衡水位":"Even pace",children:__t3LimViewZh()?["匀速应剩 ",$1,"%"]:[$1,"% left by now"]',
  );
  out = out.replace(
    /label:[`"']Restores[`"'],children:\[[`"']\+[`"'],([A-Za-z0-9_$]+\.restoresPercent),[`"']% of pool[`"']\]/g,
    'label:__t3LimViewZh()?"重置恢复":"Restores",children:__t3LimViewZh()?["恢复总池 +",$1,"%"]:["+",$1,"% of pool"]',
  );
  out = out.replace(
    /ariaLabel:[`"']Toggle account email visibility[`"'],revealTooltip:[`"']Click to reveal email[`"'],hideTooltip:[`"']Click to hide email[`"']/g,
    'ariaLabel:__t3LimViewZh()?"切换账号邮箱显示":"Toggle account email visibility",revealTooltip:__t3LimViewZh()?"点击显示邮箱":"Click to reveal email",hideTooltip:__t3LimViewZh()?"点击隐藏邮箱":"Click to hide email"',
  );
  out = out.replace(
    /label:[`"']Ahead of pace: spending faster than the window elapses[`"']/g,
    'get label(){return __t3LimViewZh()?"消耗偏快：当前消耗速度高于时间窗口流逝速度":"Ahead of pace: spending faster than the window elapses"}',
  );
  out = out.replace(
    /label:[`"']On pace with the window[`"']/g,
    'get label(){return __t3LimViewZh()?"进度均衡：消耗速度与时间窗口基本同步":"On pace with the window"}',
  );
  out = out.replace(
    /label:[`"']Under pace: headroom left for the rest of the window[`"']/g,
    'get label(){return __t3LimViewZh()?"余量充裕：消耗速度低于时间流逝，剩余额度充足":"Under pace: headroom left for the rest of the window"}',
  );
  out = out.replace(
    /children:\[([A-Za-z0-9_$]+\([A-Za-z0-9_$]+\)),[`"']% left[`"']\]/g,
    'children:__t3LimViewZh()?["剩余 ",$1,"%"]:[$1,"% left"]',
  );
  out = out.replace(
    /children:\[([A-Za-z0-9_$]+),[`"']% left[`"'],([A-Za-z0-9_$]+)\]/g,
    'children:__t3LimViewZh()?["剩余 ",$1,"%",$2]:[$1,"% left",$2]',
  );
  out = out.replace(
    /` · \$\{([A-Za-z0-9_$]+)\}% of the window left`/g,
    '(__t3LimViewZh()?` · 窗口剩余 ${$1}%`:` · ${$1}% of the window left`)',
  );
  out = out.replace(
    /([`"'])The line is where even spending would be\.\1/g,
    '(__t3LimViewZh()?"竖线代表按时间匀速消耗的参考水位。":"The line is where even spending would be.")',
  );
  out = out.replace(
    /children:\[[`"']Resets [`"'],/g,
    'children:[__t3LimViewZh()?"重置于 ":"Resets ",',
  );
  out = out.replace(
    /([`"'])No provider on the selected environments reports subscription limits\.\1/g,
    '(__t3LimViewZh()?"当前所选环境中暂无上报订阅配额的模型厂商。":"No provider on the selected environments reports subscription limits.")',
  );
  out = out.replace(
    /([`"'])View usage in ChatGPT with your connected account\.\1/g,
    '(__t3LimViewZh()?"使用已关联账号前往 ChatGPT 查看用量详情。":"View usage in ChatGPT with your connected account.")',
  );
  out = out.replace(
    /children:\[[`"']Manage usage[`"'],/g,
    'children:[__t3LimViewZh()?"管理用量":"Manage usage",',
  );
  out = out.replace(
    /\?[`"']Using…[`"']:/g,
    '?(__t3LimViewZh()?"使用中…":"Using…"):',
  );
  out = out.replace(
    /\?[`"']Using reset credit…[`"']:/g,
    '?(__t3LimViewZh()?"正在使用重置券…":"Using reset credit…"):',
  );
  out = out.replace(
    /children:[`"']Use a reset credit\?[`"']/g,
    'children:__t3LimViewZh()?"确认使用重置券？":"Use a reset credit?"',
  );
  out = out.replace(
    /children:[`"']Cancel[`"']/g,
    'children:__t3LimViewZh()?"取消":"Cancel"',
  );
  out = out.replace(
    /children:[`"']Use credit[`"']/g,
    'children:__t3LimViewZh()?"确认使用":"Use credit"',
  );

  out += `\nfunction __t3LimViewZh(){return globalThis.__t3QuotaUi?globalThis.__t3QuotaUi.isZh():!0}function __t3LimViewCny(){return globalThis.__t3QuotaUi?globalThis.__t3QuotaUi.isCny():!1}function __t3WinLbl(e){return globalThis.__t3QuotaUi?.translateWindowLabel?globalThis.__t3QuotaUi.translateWindowLabel(e):e}\n`;
  return out;
}

function patchChatUsageBundle(src) {
  // Auto-heal v1.1-v1.3 already-patched _chat.usage bundle to add macOS Cache Cleaner button
  if (src.includes("__T3UsageRootWrapper")) {
    if (!src.includes("openCacheCleaner")) {
      return src.replace(
        /return \(0,([A-Za-z0-9_$]+)\.jsxs\)\(\1\.Fragment,\{children:\[([\s\S]+?),__langSeg\]\}\);/,
        `const __cacheBtn=(0,$1.jsx)("button",{type:"button",className:"t3-pin-bar-btn",title:isZh?"预览并清理 macOS 磁盘缓存":"Preview & clean macOS disk cache",onClick:()=>globalThis.__t3QuotaUi?.openCacheCleaner?.(),children:isZh?"🧹 缓存":"🧹 Cache"});return (0,$1.jsxs)($1.Fragment,{children:[$2,__langSeg,__cacheBtn]});`,
      );
    }
    return src;
  }
  let out = src;

  const reactNsMatch = out.match(/\(\s*0\s*,\s*([A-Za-z0-9_$]+)\.useState\s*\)\([`"']model[`"']\)/);
  const segMatch = out.match(
    /\.map\([A-Za-z0-9_$]+=>\(0,([A-Za-z0-9_$]+)\.jsx\)\(([A-Za-z0-9_$]+),\{value:[A-Za-z0-9_$]+\.value,title:[A-Za-z0-9_$]+\([A-Za-z0-9_$]+\),children:[A-Za-z0-9_$]+\.label\}[\s\S]{0,160}?\(0,\1\.jsx\)\(([A-Za-z0-9_$]+),\{"aria-label":[`"']Usage metric[`"']/,
  );
  const fmtUsdMatch = out.match(
    /import\{[^}]*\bd as ([A-Za-z0-9_$]+)[^}]*\}from[`"']\.\/usageFormat-[^`"']+[`"']/,
  );
  const tooltipMatch = out.match(
    /\(0,[A-Za-z0-9_$]+\.jsxs\)\(([A-Za-z0-9_$]+),\{children:\[\(0,[A-Za-z0-9_$]+\.jsx\)\(([A-Za-z0-9_$]+),\{render:\(0,[A-Za-z0-9_$]+\.jsx\)\([`"']div[`"'],\{className:[`"']h-full min-w-1[\s\S]{0,220}?\(0,[A-Za-z0-9_$]+\.jsxs\)\(([A-Za-z0-9_$]+),\{/,
  );

  if (!reactNsMatch || !segMatch || !fmtUsdMatch) {
    return out;
  }

  const reactNs = reactNsMatch[1];
  const jsxNs = segMatch[1];
  const toggleItemIdent = segMatch[2];
  const toggleGroupIdent = segMatch[3];
  const fmtUsdIdent = fmtUsdMatch[1];
  const tooltipRootIdent = tooltipMatch ? tooltipMatch[1] : null;
  const tooltipTriggerIdent = tooltipMatch ? tooltipMatch[2] : null;
  const tooltipPopupIdent = tooltipMatch ? tooltipMatch[3] : null;

  // 1. Preserve selectedEnvironmentIds & breakdown mode ("model" | "time") across instant currency/lang re-keying
  out = out.replace(
    new RegExp(
      `\\[([A-Za-z0-9_$]+),([A-Za-z0-9_$]+)\\]=\\(0,${reactNs.replace(/\$/g, "\\$")}\\.useState\\)\\(null\\),([A-Za-z0-9_$]+);([A-Za-z0-9_$]+\\[\\d+\\]===[A-Za-z0-9_$]+\\.hiddenProviders)`,
    ),
    (_, cVar, wVar, tVar, rest) => `[${cVar},${wVar}]=__t3UseSavedEnvIds(),${tVar};${rest}`,
  );
  out = out.replace(
    new RegExp(
      `\\[([A-Za-z0-9_$]+),([A-Za-z0-9_$]+)\\]=\\(0,${reactNs.replace(/\$/g, "\\$")}\\.useState\\)\\([\`"']model[\`"']\\)`,
    ),
    (_, hVar, gVar) => `[${hVar},${gVar}]=__t3UseSavedBreakdown()`,
  );

  // 2. Inject Currency (¥ CNY | $ USD) & Language (中 | EN) segmented toggles into wide & compact toolbars
  out = out.replace(
    /className:[`"']ms-auto hidden shrink-0 items-center justify-end gap-2 @4xl\/usage-header:flex[`"'],children:\[([A-Za-z0-9_$]+),([A-Za-z0-9_$]+),([A-Za-z0-9_$]+)\]/,
    (_, periodEl, metricEl, refreshEl) =>
      `className:"ms-auto hidden shrink-0 items-center justify-end gap-2 @4xl/usage-header:flex",children:[${periodEl},${metricEl},__t3RenderToolbarToggles(!1),${refreshEl}]`,
  );
  out = out.replace(
    /className:[`"']ms-auto flex shrink-0 items-center justify-end gap-1 @4xl\/usage-header:hidden[`"'],children:\[([A-Za-z0-9_$]+),([A-Za-z0-9_$]+),([A-Za-z0-9_$]+)\]/,
    (_, periodEl, metricEl, refreshEl) =>
      `className:"ms-auto flex shrink-0 items-center justify-end gap-1 @4xl/usage-header:hidden",children:[${periodEl},${metricEl},__t3RenderToolbarToggles(!0),${refreshEl}]`,
  );

  // 3. Chart Y-axis clean RMB tick scaling
  out = out.replace(
    /function ([A-Za-z0-9_$]+)\(([A-Za-z0-9_$]+),([A-Za-z0-9_$]+)\)\{let ([A-Za-z0-9_$]+)=\2\.reduce\(\(([A-Za-z0-9_$]+),([A-Za-z0-9_$]+)\)=>\6\.bands\.reduce\(\(([A-Za-z0-9_$]+),([A-Za-z0-9_$]+)\)=>Math\.max\(\7,\8\.value\),\5\),0\);return \4===0&&\3\.size>0\?\{max:([A-Za-z0-9_$]+),ticks:([A-Za-z0-9_$]+),labeled:!1\}:\{\.\.\.([A-Za-z0-9_$]+)\(\4,\9\),labeled:!0\}\}/,
    (_, fnName, colsArg, loadArg, maxVar, a1, b1, a2, b2, wnIdent, pnIdent, nnIdent) =>
      `function ${fnName}(${colsArg},${loadArg},__metric){let ${maxVar}=${colsArg}.reduce((${a1},${b1})=>${b1}.bands.reduce((${a2},${b2})=>Math.max(${a2},${b2}.value),${a1}),0);if(${maxVar}===0&&${loadArg}.size>0)return{max:${wnIdent},ticks:${pnIdent},labeled:!1};if(__metric==="cost"&&__t3UsageCny()&&${maxVar}>0){const __r=__t3UsageRate(),__sc=${nnIdent}(${maxVar}*__r,${wnIdent});return{max:__sc.max/__r,ticks:__sc.ticks.map(v=>v/__r),labeled:!0}}return{...${nnIdent}(${maxVar},${wnIdent}),labeled:!0}}`,
  );
  out = out.replace(
    /function ([A-Za-z0-9_$]+)\(([A-Za-z0-9_$]+),([A-Za-z0-9_$]+),([A-Za-z0-9_$]+),([A-Za-z0-9_$]+),([A-Za-z0-9_$]+)\)\{let ([A-Za-z0-9_$]+)=([A-Za-z0-9_$]+)\(\2,\3,\4\),([A-Za-z0-9_$]+)=([A-Za-z0-9_$]+)\(\7,\6\)/,
    (_, lnName, pArg, mArg, metricArg, provArg, loadArg, aVar, onFn, oVar, fnFn) =>
      `function ${lnName}(${pArg},${mArg},${metricArg},${provArg},${loadArg}){let ${aVar}=${onFn}(${pArg},${mArg},${metricArg}),${oVar}=${fnFn}(${aVar},${loadArg},${metricArg})`,
  );

  out = out.replace(
    /className:[`"']relative h-56 w-14 shrink-0[`"']/g,
    'className:"t3-usage-yaxis relative h-56 w-14 shrink-0"',
  );
  out = out.replace(
    /className:[`"']flex justify-between pl-16 text-3xs text-muted-foreground uppercase[`"']/g,
    'className:"t3-usage-xaxis flex justify-between pl-16 text-3xs text-muted-foreground uppercase"',
  );

  // 4. Chart Hover Tooltip: localize "Total" -> "合计" & display reference FX rate note in CNY mode
  out = out.replace(
    /function ([A-Za-z0-9_$]+)\(([A-Za-z0-9_$]+)\)\{let ([A-Za-z0-9_$]+)=\(0,[A-Za-z0-9_$]+\.c\)\(\d+\),\{tooltipRef:([A-Za-z0-9_$]+),label:([A-Za-z0-9_$]+),column:([A-Za-z0-9_$]+),providers:([A-Za-z0-9_$]+),loadingProviders:([A-Za-z0-9_$]+),format:([A-Za-z0-9_$]+)\}=\2([\s\S]*?)className:[`"']text-muted-foreground[`"'],children:[`"']Total[`"']([\s\S]*?)className:[`"']surface-glass pointer-events-none absolute z-10 min-w-36 max-w-full rounded-xl border border-border\/50 px-2\.5 py-2 text-xs shadow-lg[`"'],style:([A-Za-z0-9_$]+),children:\[([A-Za-z0-9_$]+),([A-Za-z0-9_$]+),([A-Za-z0-9_$]+)\]/,
    (
      _,
      rnFn,
      eArg,
      tMemo,
      refVar,
      lblVar,
      colVar,
      provVar,
      loadVar,
      fmtVar,
      mid1,
      mid2,
      styleVar,
      uChild,
      dChild,
      totChild,
    ) =>
      `function ${rnFn}(${eArg}){let ${tMemo}=(0,${
        out.match(/var [A-Za-z0-9_$]+=e\(t\(\),1\),([A-Za-z0-9_$]+)=n\(\)/)?.[1] ?? "Q"
      }.c)(26),{tooltipRef:${refVar},label:${lblVar},column:${colVar},providers:${provVar},loadingProviders:${loadVar},format:${fmtVar}}=${eArg}${mid1}className:"text-muted-foreground",children:__t3UsageZh()?"合计":"Total"${mid2}className:"surface-glass pointer-events-none absolute z-10 min-w-36 max-w-full rounded-xl border border-border/50 px-2.5 py-2 text-xs shadow-lg",style:${styleVar},children:[${uChild},${dChild},${totChild},${fmtVar}===${fmtUsdIdent}&&__t3UsageCny()?(0,${jsxNs}.jsx)("div",{className:"mt-1 text-3xs text-muted-foreground/80 tabular-nums",children:__t3UsageZh()?"参考汇率 $1 = ¥"+__t3UsageRate():"Ref: $1 = ¥"+__t3UsageRate()}):null]`,
  );

  // 5. Complete Localization of Cost / Tokens / Breakdown / Filter / Modals
  out = out.replace(
    /\(([`"'])h1\1,\{children:\1Usage\1\}\)/g,
    '("h1",{children:__t3UsageZh()?"用量与配额":"Usage"})',
  );
  out = out.replace(
    /`\$\{([A-Za-z0-9_$]+\([^)]+\))\} to \$\{([A-Za-z0-9_$]+\([^)]+\))\}`/g,
    '(__t3UsageZh()?`${$1} 至 ${$2}`:`${$1} to ${$2}`)',
  );
  out = out.replace(
    /\?[`"']All environments[`"']:/g,
    '?(__t3UsageZh()?"全部环境":"All environments"):',
  );
  out = out.replace(
    /children:[`"']All environments[`"']/g,
    'children:__t3UsageZh()?"全部环境":"All environments"',
  );
  out = out.replace(
    /`\$\{([A-Za-z0-9_$]+\.length)\} environments`/g,
    '(__t3UsageZh()?`${$1} 个环境`:`${$1} environments`)',
  );
  out = out.replace(
    /\?[`"']All providers[`"']:/g,
    '?(__t3UsageZh()?"全部厂商":"All providers"):',
  );
  out = out.replace(
    /children:[`"']All providers[`"']/g,
    'children:__t3UsageZh()?"全部厂商":"All providers"',
  );
  out = out.replace(
    /\?[`"']No providers[`"']:/g,
    '?(__t3UsageZh()?"未选厂商":"No providers"):',
  );
  out = out.replace(
    /`\$\{([A-Za-z0-9_$]+\.length)\} providers`/g,
    '(__t3UsageZh()?`${$1} 个厂商`:`${$1} providers`)',
  );
  out = out.replace(
    /\?[`"']Refresh limits[`"']:[`"']Refresh usage[`"']/g,
    '?(__t3UsageZh()?"刷新限额":"Refresh limits"):(__t3UsageZh()?"刷新用量":"Refresh usage")',
  );
  out = out.replace(
    /`Updating \$\{([A-Za-z0-9_$]+\([A-Za-z0-9_$]+\[0\]\))\}…`:`Updating \$\{([A-Za-z0-9_$]+\.length)\} providers…`/g,
    '(__t3UsageZh()?`正在更新 ${$1}…`:`Updating ${$1}…`):(__t3UsageZh()?`正在更新 ${$2} 个厂商…`:`Updating ${$2} providers…`)',
  );
  out = out.replace(
    /\?[`"']Update required[`"']:/g,
    '?(__t3UsageZh()?"需更新":"Update required"):',
  );
  out = out.replace(
    /\?[`"']Scanning…[`"']:/g,
    '?(__t3UsageZh()?"扫描中…":"Scanning…"):',
  );
  out = out.replace(
    /\?[`"']Refreshing…[`"']:/g,
    '?(__t3UsageZh()?"刷新中…":"Refreshing…"):',
  );
  out = out.replace(
    /:[`"']Ready[`"']:/g,
    ':(__t3UsageZh()?"就绪":"Ready"):',
  );
  out = out.replace(
    /:[`"']Connecting…[`"']:/g,
    ':(__t3UsageZh()?"连接中…":"Connecting…"):',
  );
  out = out.replace(
    /:[`"']Unavailable[`"']/g,
    ':(__t3UsageZh()?"不可用":"Unavailable")',
  );
  out = out.replace(
    /children:[`"']No environments connected\.[`"']/g,
    'children:__t3UsageZh()?"暂无已连接的运行环境。":"No environments connected."',
  );
  out = out.replace(
    /children:[`"']Totals are partial while selected environments scan\.[`"']/g,
    'children:__t3UsageZh()?"所选环境正在扫描，当前汇总为部分数据。":"Totals are partial while selected environments scan."',
  );
  out = out.replace(
    /\[([A-Za-z0-9_$]+),[`"']Model prices[`"']\]/g,
    '[$1,__t3UsageZh()?"自定义模型单价":"Model prices"]',
  );
  out = out.replace(
    /\?[`"']This environment could not report usage\.[`"']:/g,
    '?(__t3UsageZh()?"该运行环境无法上报用量数据。":"This environment could not report usage."):',
  );
  out = out.replace(
    /`Connect an environment to see \$\{([A-Za-z0-9_$]+)\?[`"']limits[`"']:[`"']usage[`"']\}\.`:`Select an environment to see \$\{\1\?[`"']limits[`"']:[`"']usage[`"']\}\.`/g,
    '(__t3UsageZh()?`请先连接运行环境以查看${$1?"限额":"用量"}。`:`Connect an environment to see ${$1?"limits":"usage"}.`):(__t3UsageZh()?`请至少选择一个运行环境以查看${$1?"限额":"用量"}。`:`Select an environment to see ${$1?"limits":"usage"}.`)',
  );
  out = out.replace(
    /children:\[([A-Za-z0-9_$]+),[`"'] sessions[`"']\]/g,
    'children:[$1,__t3UsageZh()?" 次会话":" sessions"]',
  );
  out = out.replace(
    /([A-Za-z0-9_$]+)===[`"']cost[`"']&&[`"'] · API estimate[`"']/g,
    '($1==="cost"&&(__t3UsageZh()?(__t3UsageCny()?" · 按官方 API 单价估算 (汇率 "+__t3UsageRate()+")":" · 按官方 API 单价估算"):(__t3UsageCny()?" · API estimate ($1 = ¥"+__t3UsageRate()+")":" · API estimate")))',
  );
  out = out.replace(
    /children:\[[`"']API estimate excludes [`"'],([A-Za-z0-9_$]+\([A-Za-z0-9_$.]+\)),[`"'] unpriced records\.[`"']\]/g,
    'children:__t3UsageZh()?["估算结果不含 ",$1," 的未定价记录。"]:["API estimate excludes ",$1," unpriced records."]',
  );
  out = out.replace(
    /children:[`"']ChatGPT shared usage[`"']/g,
    'children:__t3UsageZh()?"ChatGPT 共享用量":"ChatGPT shared usage"',
  );
  out = out.replace(
    /`\$\{([A-Za-z0-9_$]+\([A-Za-z0-9_$]+\))\} \$\{([A-Za-z0-9_$]+)===1\?[`"']session[`"']:[`"']sessions[`"']\}`/g,
    '(__t3UsageZh()?`${$1} 次会话`:`${$1} ${$2===1?"session":"sessions"}`)',
  );
  out = out.replace(
    /([A-Za-z0-9_$]+)===[`"']cost[`"']\?`\$\{([A-Za-z0-9_$]+\([A-Za-z0-9_$]+\))\} of cost · \$\{([A-Za-z0-9_$]+\([^)]+\))\} tokens`:`\$\{\2\} of tokens · \$\{([A-Za-z0-9_$]+\([^)]+\))\}`/g,
    '($1==="cost"?(__t3UsageZh()?`${$2} 费用占比 · ${$3} Token`:`${$2} of cost · ${$3} tokens`):(__t3UsageZh()?`${$2} Token 占比 · ${$4}`:`${$2} of tokens · ${$4}`))',
  );
  out = out.replace(
    /let ([A-Za-z0-9_$]+)=([A-Za-z0-9_$]+)\?[`"']Hourly[`"']:[`"']Daily[`"'],([A-Za-z0-9_$]+)=([A-Za-z0-9_$]+)===[`"']tokens[`"']\?[`"']processed tokens[`"']:[`"']cost[`"'],([A-Za-z0-9_$]+);([A-Za-z0-9_$]+\[\d+\])!==\1\|\|([A-Za-z0-9_$]+\[\d+\])!==\3\?\(\5=\(0,([A-Za-z0-9_$]+)\.jsxs\)\([`"']h2[`"'],\{className:[`"']text-sm font-medium text-foreground[`"'],children:\[\1,[`"'] [`"'],\3\]\}\)/g,
    (_, peVar, isHrVar, meVar, metricVar, qVar, m1, m2, jNs) =>
      `let ${peVar}=${isHrVar}?"Hourly":"Daily",${meVar}=${metricVar}==="tokens"?"processed tokens":"cost",${qVar};${m1}!==${peVar}||${m2}!==${meVar}?(${qVar}=(0,${jNs}.jsxs)("h2",{className:"text-sm font-medium text-foreground",children:__t3UsageZh()?[${metricVar}==="tokens"?(${isHrVar}?"每小时处理 Token":"每日处理 Token"):(${isHrVar}?"每小时估算费用":"每日估算费用")]:[${peVar}," ",${meVar}]})`,
  );
  out = out.replace(
    /children:[`"']Totals[`"']/g,
    'children:__t3UsageZh()?"总计":"Totals"',
  );
  out = out.replace(
    /label:[`"']Processed tokens[`"']/g,
    'label:__t3UsageZh()?"总处理 Token":"Processed tokens"',
  );
  out = out.replace(
    /label:[`"']Cached input[`"']/g,
    'label:__t3UsageZh()?"缓存命中输入":"Cached input"',
  );
  out = out.replace(
    /label:[`"']Uncached input[`"']/g,
    'label:__t3UsageZh()?"未命中输入":"Uncached input"',
  );
  out = out.replace(
    /label:[`"']Cache savings[`"']/g,
    'label:__t3UsageZh()?"缓存节省":"Cache savings"',
  );
  out = out.replace(
    /labels:\[[`"']Processed tokens[`"'],[`"']Cached input[`"'],[`"']Uncached input[`"'],[`"']Output[`"'],[`"']Cache savings[`"']\]/g,
    'labels:__t3UsageZh()?["总处理 Token","缓存命中输入","未命中输入","输出","缓存节省"]:["Processed tokens","Cached input","Uncached input","Output","Cache savings"]',
  );
  out = out.replace(
    /label:[`"']Cost by type[`"']/g,
    'label:__t3UsageZh()?"按类型费用":"Cost by type"',
  );
  out = out.replace(
    /label:[`"']Cost by speed[`"']/g,
    'label:__t3UsageZh()?"按速度费用":"Cost by speed"',
  );
  out = out.replace(
    /label:[`"']Tokens by type[`"']/g,
    'label:__t3UsageZh()?"按类型 Token":"Tokens by type"',
  );
  out = out.replace(
    /\{key:[`"']inputCostPerMillionTokens[`"'],label:[`"']Input[`"'],optional:!1\},\{key:[`"']outputCostPerMillionTokens[`"'],label:[`"']Output[`"'],optional:!1\},\{key:[`"']cacheReadCostPerMillionTokens[`"'],label:[`"']Cache read[`"'],optional:!0\},\{key:[`"']cacheWriteCostPerMillionTokens[`"'],label:[`"']Cache write[`"'],optional:!0\}/g,
    '{key:"inputCostPerMillionTokens",get label(){return __t3UsageZh()?"输入":"Input"},optional:!1},{key:"outputCostPerMillionTokens",get label(){return __t3UsageZh()?"输出":"Output"},optional:!1},{key:"cacheReadCostPerMillionTokens",get label(){return __t3UsageZh()?"缓存读取":"Cache read"},optional:!0},{key:"cacheWriteCostPerMillionTokens",get label(){return __t3UsageZh()?"缓存写入":"Cache write"},optional:!0}',
  );
  out = out.replace(/label:[`"']Input[`"'],value:/g, 'label:__t3UsageZh()?"输入":"Input",value:');
  out = out.replace(/label:[`"']Cache read[`"'],value:/g, 'label:__t3UsageZh()?"缓存读取":"Cache read",value:');
  out = out.replace(/label:[`"']Cache write[`"'],value:/g, 'label:__t3UsageZh()?"缓存写入":"Cache write",value:');
  out = out.replace(/label:[`"']Output[`"'],value:/g, 'label:__t3UsageZh()?"输出":"Output",value:');
  out = out.replace(/label:[`"']Other[`"'],value:/g, 'label:__t3UsageZh()?"其他":"Other",value:');
  out = out.replace(/label:[`"']Standard[`"'],value:/g, 'label:__t3UsageZh()?"标准":"Standard",value:');
  out = out.replace(/label:[`"']Fast[`"'],value:/g, 'label:__t3UsageZh()?"极速":"Fast",value:');
  out = out.replace(/label:[`"']Ultrafast[`"'],value:/g, 'label:__t3UsageZh()?"超极速":"Ultrafast",value:');
  out = out.replace(/children:\[[`"']Premium [`"'],/g, 'children:[__t3UsageZh()?"溢价 ":"Premium ",');
  out = out.replace(/children:[`"']Breakdown[`"']/g, 'children:__t3UsageZh()?"消耗明细":"Breakdown"');
  out = out.replace(
    /\{value:[`"']model[`"'],label:[`"']Model[`"']\}/g,
    '{value:"model",get label(){return __t3UsageZh()?"按模型":"Model"}}',
  );
  out = out.replace(
    /let ([A-Za-z0-9_$]+)=([A-Za-z0-9_$]+)\?[`"']Hour[`"']:[`"']Day[`"'],([A-Za-z0-9_$]+);([A-Za-z0-9_$]+\[\d+\])===\1\?\3=([A-Za-z0-9_$]+\[\d+\]):\(\3=\[([A-Za-z0-9_$]+),\{value:[`"']time[`"'],label:\1\}\]/g,
    (_, leVar, isHrVar, reVar, c1, c2, ieVar) =>
      `let ${leVar}=${isHrVar}?(__t3UsageZh()?"按小时":"Hour"):(__t3UsageZh()?"按日期":"Day"),${reVar};${c1}===${leVar}?${reVar}=${c2}:(${reVar}=[${ieVar},{value:"time",label:${leVar}}]`,
  );
  out = out.replace(
    /className:[`"']w-full py-2 text-left font-normal[`"'],children:[`"']Model[`"']/g,
    'className:"w-full py-2 text-left font-normal",children:__t3UsageZh()?"模型":"Model"',
  );
  out = out.replace(
    /className:[`"']py-2 pl-6 font-normal[`"'],children:[`"']Cost[`"']/g,
    'className:"py-2 pl-6 font-normal",children:__t3UsageZh()?"费用":"Cost"',
  );
  out = out.replace(
    /className:[`"']hidden py-2 pl-6 font-normal sm:table-cell[`"'],children:[`"']Share[`"']/g,
    'className:"hidden py-2 pl-6 font-normal sm:table-cell",children:__t3UsageZh()?"占比":"Share"',
  );
  out = out.replace(
    /className:[`"']py-2 pr-2 pl-6 font-normal[`"'],children:[`"']Tokens[`"']/g,
    'className:"py-2 pr-2 pl-6 font-normal",children:__t3UsageZh()?"Token":"Tokens"',
  );
  out = out.replace(
    /className:[`"']py-2 pl-2 font-normal[`"'],children:([A-Za-z0-9_$]+)\?[`"']Hour[`"']:[`"']Day[`"']/g,
    'className:"py-2 pl-2 font-normal",children:$1?(__t3UsageZh()?"时间":"Hour"):(__t3UsageZh()?"日期":"Day")',
  );
  out = out.replace(
    /className:[`"']py-2 pl-4 text-right font-normal[`"'],children:[`"']Total[`"']/g,
    'className:"py-2 pl-4 text-right font-normal",children:__t3UsageZh()?"合计":"Total"',
  );
  out = out.replace(
    /className:[`"']py-2 pr-2 pl-4 text-right font-normal[`"'],children:[`"']Tokens[`"']/g,
    'className:"py-2 pr-2 pl-4 text-right font-normal",children:__t3UsageZh()?"Token":"Tokens"',
  );
  out = out.replace(
    /children:[`"']No activity in this window\.[`"']/g,
    'children:__t3UsageZh()?"当前时间范围内暂无消耗记录。":"No activity in this window."',
  );
  out = out.replace(/children:[`"']Unpriced[`"']/g, 'children:__t3UsageZh()?"未定价":"Unpriced"');
  out = out.replace(/\?[`"']Unpriced[`"']:/g, '?(__t3UsageZh()?"未定价":"Unpriced"):');
  out = out.replace(/label:[`"']Cost[`"'],value:([A-Za-z0-9_$]+)/g, 'label:__t3UsageZh()?"费用":"Cost",value:$1');
  out = out.replace(/label:[`"']Tokens[`"'],value:([A-Za-z0-9_$]+)/g, 'label:__t3UsageZh()?"Token":"Tokens",value:$1');
  out = out.replace(/label:[`"']Per 1M tokens[`"'],value:/g, 'label:__t3UsageZh()?"每百万 Token 均价":"Per 1M tokens",value:');
  out = out.replace(/label:[`"']Cache hit[`"'],value:/g, 'label:__t3UsageZh()?"缓存命中率":"Cache hit",value:');
  out = out.replace(
    /[`"']{2}:` · \$\{([A-Za-z0-9_$]+\([A-Za-z0-9_$.]+\))\} of cost`/g,
    '"":(__t3UsageZh()?` · ${$1} 费用占比`:` · ${$1} of cost`)',
  );
  out = out.replace(
    /\[([A-Za-z0-9_$]+\([A-Za-z0-9_$.]+\)),[`"'] tokens have no known price[`"']\]/g,
    '[$1,__t3UsageZh()?" Token 暂无已知单价":" tokens have no known price"]',
  );
  out = out.replace(/children:[`"']Set price[`"']/g, 'children:__t3UsageZh()?"设置单价":"Set price"');
  out = out.replace(/children:[`"']Custom model prices[`"']/g, 'children:__t3UsageZh()?"自定义模型单价":"Custom model prices"');
  out = out.replace(
    /children:[`"']Prices and mappings apply to all past and future usage on the environments you select\.[`"']/g,
    'children:__t3UsageZh()?"自定义单价与模型映射将应用于所选环境的全部历史与未来用量估算。":"Prices and mappings apply to all past and future usage on the environments you select."',
  );
  out = out.replace(/children:[`"']Apply to[`"']/g, 'children:__t3UsageZh()?"应用于":"Apply to"');
  out = out.replace(
    /children:[`"']USD \/ million tokens[`"']/g,
    'children:__t3UsageZh()?"USD / 百万 Token（按美元配置）":"USD / million tokens"',
  );
  out = out.replace(/children:[`"']Model ID[`"']/g, 'children:__t3UsageZh()?"模型 ID":"Model ID"');
  out = out.replace(/children:[`"']Map to[`"']/g, 'children:__t3UsageZh()?"映射至":"Map to"');
  out = out.replace(
    /\?[`"']Saving…[`"']:([A-Za-z0-9_$.]+)>0\?[`"']Retry failed saves[`"']:[`"']Save changes[`"']/g,
    '?(__t3UsageZh()?"保存中…":"Saving…"):$1>0?(__t3UsageZh()?"重试失败项":"Retry failed saves"):(__t3UsageZh()?"保存修改":"Save changes")',
  );
  out = out.replace(
    /\?[`"']Discard pending changes[`"']:[`"']Discard changes[`"']/g,
    '?(__t3UsageZh()?"放弃待定修改":"Discard pending changes"):(__t3UsageZh()?"放弃修改":"Discard changes")',
  );

  // 6. Build toolbar control renderer + reactive root key wrapper at module footer
  const currButtonExpr =
    tooltipRootIdent && tooltipTriggerIdent && tooltipPopupIdent
      ? `(0,${jsxNs}.jsxs)(${tooltipRootIdent},{children:[(0,${jsxNs}.jsx)(${tooltipTriggerIdent},{render:(0,${jsxNs}.jsx)("span",{className:"inline-flex"}),children:__currSeg}),(0,${jsxNs}.jsx)(${tooltipPopupIdent},{side:"bottom",children:__fxTip})]})`
      : `__currSeg`;

  const helperFooter = `
var __t3SavedEnvIds=null,__t3SavedBreakdown="model";
function __t3UsageZh(){return globalThis.__t3QuotaUi?globalThis.__t3QuotaUi.isZh():!0}
function __t3UsageCny(){return globalThis.__t3QuotaUi?globalThis.__t3QuotaUi.isCny():!1}
function __t3UsageRate(){return globalThis.__t3QuotaUi?globalThis.__t3QuotaUi.getRate():7.25}
function __t3UseSavedEnvIds(){
  const [s,setS]=(0,${reactNs}.useState)(()=>__t3SavedEnvIds);
  const update=(0,${reactNs}.useCallback)(v=>{
    const next=typeof v==="function"?v(__t3SavedEnvIds):v;
    __t3SavedEnvIds=next;
    setS(next);
  },[]);
  return [s,update];
}
function __t3UseSavedBreakdown(){
  const [s,setS]=(0,${reactNs}.useState)(()=>__t3SavedBreakdown);
  const update=(0,${reactNs}.useCallback)(v=>{
    const next=typeof v==="function"?v(__t3SavedBreakdown):v;
    __t3SavedBreakdown=next;
    setS(next);
  },[]);
  return [s,update];
}
function __t3RenderToolbarToggles(compact){
  const isZh=__t3UsageZh();
  const isCny=__t3UsageCny();
  const rate=__t3UsageRate();
  const __fxTip=isZh?\`切换人民币 / 美元实时换算（参考汇率 1 USD = \${rate} CNY）\`:\`Toggle CNY / USD conversion (Ref rate: 1 USD = \${rate} CNY)\`;
  const __langTip=isZh?"切换中 / 英文界面（立即生效）":"Toggle Chinese / English UI (Instant)";
  const __currSeg=(0,${jsxNs}.jsxs)(${toggleGroupIdent},{
    "aria-label":isZh?"计价货币":"Currency",
    variant:"segmented",
    value:[isCny?"CNY":"USD"],
    onValueChange:vals=>{
      const cur=__t3UsageCny()?"CNY":"USD";
      const next=vals[0]||(cur==="CNY"?"USD":"CNY");
      globalThis.__t3QuotaUi?.setCurrency(next);
    },
    children:[
      (0,${jsxNs}.jsx)(${toggleItemIdent},{value:"CNY",title:__fxTip,children:compact?"¥":"¥ CNY"},"CNY"),
      (0,${jsxNs}.jsx)(${toggleItemIdent},{value:"USD",title:__fxTip,children:compact?"$":"$ USD"},"USD")
    ]
  });
  const __langSeg=(0,${jsxNs}.jsxs)(${toggleGroupIdent},{
    "aria-label":isZh?"界面语言":"Language",
    variant:"segmented",
    value:[isZh?"zh":"en"],
    onValueChange:vals=>{
      const cur=__t3UsageZh()?"zh":"en";
      const next=vals[0]||(cur==="zh"?"en":"zh");
      globalThis.__t3QuotaUi?.setLang(next);
    },
    children:[
      (0,${jsxNs}.jsx)(${toggleItemIdent},{value:"zh",title:__langTip,children:"中"},"zh"),
      (0,${jsxNs}.jsx)(${toggleItemIdent},{value:"en",title:__langTip,children:"EN"},"en")
    ]
  });
  const __cacheBtn=(0,${jsxNs}.jsx)("button",{
    type:"button",
    className:"t3-pin-bar-btn",
    title:isZh?"预览并清理 macOS 磁盘缓存":"Preview & clean macOS disk cache",
    onClick:()=>globalThis.__t3QuotaUi?.openCacheCleaner?.(),
    children:isZh?"🧹 缓存":"🧹 Cache"
  });
  return (0,${jsxNs}.jsxs)(${jsxNs}.Fragment,{children:[${currButtonExpr},__langSeg,__cacheBtn]});
}
`;

  out = out.replace(
    /var ([A-Za-z0-9_$]+)=([A-Za-z0-9_$]+);export\{\1 as component\};/,
    (_, expVar, innerComp) => `${helperFooter}
function __T3UsageRootWrapper(props){
  const [snap,setSnap]=(0,${reactNs}.useState)(()=>({
    lang:__t3UsageZh()?"zh":"en",
    curr:__t3UsageCny()?"CNY":"USD",
    rate:__t3UsageRate()
  }));
  (0,${reactNs}.useEffect)(()=>{
    if(!globalThis.__t3QuotaUi?.subscribe)return;
    return globalThis.__t3QuotaUi.subscribe(next=>{
      setSnap({lang:next.lang,curr:next.currency,rate:next.rate});
    });
  },[]);
  return (0,${jsxNs}.jsx)("div",{"data-quota-ui-managed":"true",className:"contents",children:(0,${jsxNs}.jsx)(${innerComp},{...props},\`\${snap.lang}:\${snap.curr}:\${snap.rate}\`)});
}
var ${expVar}=__T3UsageRootWrapper;export{${expVar} as component};`,
  );

  return out;
}

function patchModelPickerBundle(src) {
  let out = src;

  const entriesMatch = out.match(/\{searchInputRef:[A-Za-z0-9_$]+,keybindings:[A-Za-z0-9_$]+,modelOptionsByInstance:[A-Za-z0-9_$]+,instanceEntries:([A-Za-z0-9_$]+),/);
  const entriesVar = entriesMatch ? entriesMatch[1] : null;

  // Auto-heal v1.2.0 shadowed `e.instanceEntries` inside renderItem(e => ...)
  if (entriesVar && out.includes("quotaEntry:e.instanceEntries?.find(")) {
    out = out.replace(
      /quotaEntry:e\.instanceEntries\?\.find\(/g,
      `quotaEntry:${entriesVar}?.find(`,
    );
  }

  // Auto-heal v1.2.1 Model Picker badge label to show `剩 72%` in zh (matching Stardust Red Box #1)
  if (out.includes('children:q.remaining+"%"')) {
    out = out.replace(
      'children:q.remaining+"%"',
      'children:(globalThis.__t3QuotaUi?.isZh?.()?"剩 ":"")+q.remaining+"%"',
    );
  }

  // v1.4.3 Full 1:1 Red-Box-1 ProviderModelPicker structural transform (works on both fresh & already-patched bundles):
  //   1) Move horizontal provider tabs (qt) BELOW search bar (tn) and ABOVE model list (St)
  //   2) Turn EVERY provider icon tab into clean text pill (`常用 | Claude | Codex | AG1 | AG2 | Cursor | Grok`)
  //   3) Switch Gt split container directly to vertical flex-col so V18 Starship slider ALWAYS sits INSIDE popover
  //   4) Localize search placeholder `搜索模型…`
  const applyV9ModelPickerStructure = (code) => {
    let s = code;
    // 1. Force vertical stack on Gt container holding [G, effortColumn]
    s = s.replace(
      /className:`flex h-86\.5 min-h-0 max-sm:h-auto max-sm:flex-col`/g,
      'className:`flex flex-col h-auto min-h-0 gap-2`',
    );
    // 2. Move provider tabs (qt) below search bar (tn): [qt, (0,Q.jsx)(U,{...,children:(0,Q.jsxs)(`div`,{className:Qt,children:[tn, ...
    s = s.replace(
      /"data-model-picker-content":`true`,children:\[([A-Za-z0-9_$]+),(\(0,[A-Za-z0-9_$]+\.jsx\)\([A-Za-z0-9_$]+,\{inline:!0,[\s\S]{0,220}?children:\(0,[A-Za-z0-9_$]+\.jsxs\)\(`div`,\{className:[A-Za-z0-9_$]+,children:\[([A-Za-z0-9_$]+),)/,
      '"data-model-picker-content":`true`,children:[$2$1,',
    );
    // 3. Localize search box placeholder
    s = s.replace(
      /placeholder:`Search models\.\.\.`/g,
      'placeholder:(globalThis.__t3QuotaUi?.isZh?.()?"搜索模型…":"Search models...")',
    );
    // 4. Turn Favorites icon tab into text `常用` / `Fav`
    s = s.replace(
      /children:\(0,([A-Za-z0-9_$]+)\.jsx\)\(([A-Za-z0-9_$]+),\{className:`size-5 fill-current shrink-0`,"aria-hidden":!0\}\)/,
      'children:(globalThis.__t3QuotaUi?.isZh?.()?"常用":"Fav")',
    );
    // 5. Turn EVERY provider tab button icon (`children:(0,Q.jsx)(we,{driverKind:t.driverKind,...})`) into clean text pill
    s = s.replace(
      /children:\(0,([A-Za-z0-9_$]+)\.jsx\)\(([A-Za-z0-9_$]+),\{driverKind:([A-Za-z0-9_$]+)\.driverKind,displayName:\3\.displayName,[\s\S]{0,360}?\}\)/,
      'children:__t3MpShortTabName($3)',
    );
    s = s.replace(
      /children:\(0,([A-Za-z0-9_$]+)\.jsxs\)\(\1\.Fragment,\{children:\[\(0,\1\.jsx\)\(([A-Za-z0-9_$]+),\{driverKind:([A-Za-z0-9_$]+)\.driverKind,[\s\S]{0,360}?\}\),\(0,\1\.jsx\)\(__T3MpProviderMini,\{entry:\3\}\)\]\}\)/,
      'children:__t3MpShortTabName($3)',
    );
    if (!s.includes("function __t3MpShortTabName(")) {
      s += `\nfunction __t3MpShortTabName(t){const n=String(t?.displayName||t?.driverKind||"");if(/antigravity/i.test(n)){const m=n.match(/\\d+/);return m?"AG"+m[0]:"AG1"}if(/claude/i.test(n)){const m=n.match(/\\d+/);return m?"Claude"+m[0]:"Claude"}if(/codex|openai/i.test(n))return"Codex";if(/gemini/i.test(n))return"Gemini";if(/grok|xai/i.test(n))return"Grok";if(/cursor/i.test(n))return"Cursor";return n.split(/\\s+/)[0].slice(0,10)}\n`;
    }
    return s;
  };

  if (out.includes("__T3MpQuotaBadge")) {
    return applyV9ModelPickerStructure(out);
  }

  const reactMatch = out.match(/\(\s*0\s*,\s*([A-Za-z0-9_$]+)\.useState\s*\)\([`"'][`"']\)/);
  const jsxMatch = out.match(/\(0,([A-Za-z0-9_$]+)\.jsxs\)\([`"']div[`"'],\{className:[`"']flex shrink-0 items-center gap-1\.5[`"'],children:\[([A-Za-z0-9_$]+),([A-Za-z0-9_$]+)\]\}\)/);
  if (!reactMatch || !jsxMatch || !entriesVar) return out;

  const reactNs = reactMatch[1];
  const jsxNs = jsxMatch[1];

  // 1. Pass quotaEntry into Be (model row) inside Tt's renderItem (using outer `entriesVar`, not shadowed `e`)
  out = out.replace(
    /(\(0,[A-Za-z0-9_$]+\.jsx\)\([A-Za-z0-9_$]+,\{index:[A-Za-z0-9_$]+,slug:([A-Za-z0-9_$]+)\.slug,name:\2\.name,subProvider:\2\.subProvider,instanceId:\2\.instanceId,)/,
    `$1quotaEntry:${entriesVar}?.find(__x=>__x.instanceId===$2.instanceId)??null,`,
  );

  // 2. Render vivid color-coded remaining % badge right next to the favorite star in Be
  out = out.replace(
    /let ([A-Za-z0-9_$]+);([A-Za-z0-9_$]+)\[(\d+)\]!==([A-Za-z0-9_$]+)\|\|\2\[(\d+)\]!==([A-Za-z0-9_$]+)\?\(\1=\(0,([A-Za-z0-9_$]+)\.jsxs\)\([`"']div[`"'],\{className:[`"']flex shrink-0 items-center gap-1\.5[`"'],children:\[\4,\6\]\}\),\2\[\3\]=\4,\2\[\5\]=\6,\2\[(\d+)\]=\1\):\1=\2\[\8\];/,
    (_, teV, tM, s1, rV, s2, zV, jNs) =>
      `let ${teV};${teV}=(0,${jNs}.jsxs)("div",{className:"flex shrink-0 items-center gap-1.5",children:[(0,${jNs}.jsx)(__T3MpQuotaBadge,{entry:e.quotaEntry,modelSlug:e.slug}),${rV},${zV}]});`,
  );

  // 3. Add compact quota badge overlay on provider sidebar icons (qe)
  out = out.replace(
    /(let ([A-Za-z0-9_$]+)=([A-Za-z0-9_$]+)\?([A-Za-z0-9_$]+)\(([A-Za-z0-9_$]+)\):([A-Za-z0-9_$]+)\?e\.getDisabledInstanceTooltip\?\.\(\5\)\?\?\5\.displayName:\5\.displayName,([A-Za-z0-9_$]+)=\(0,([A-Za-z0-9_$]+)\.jsx\)\(([A-Za-z0-9_$]+),\{[\s\S]{0,900}?children:\(0,\8\.jsx\)\(([A-Za-z0-9_$]+),\{driverKind:\5\.driverKind,[\s\S]{0,360}?\}\)\}\))/,
    (full, _all, pVar, _nVar, _weFn, tVar, _iVar, _mVar, jNs) =>
      full.replace(
        new RegExp(`children:\\(0,${jNs}\\.jsx\\)\\(([A-Za-z0-9_$]+),(\\{driverKind:${tVar}\\.driverKind,[\\s\\S]{0,360}?\\})\\)`),
        `children:(0,${jNs}.jsxs)(${jNs}.Fragment,{children:[(0,${jNs}.jsx)($1,$2),(0,${jNs}.jsx)(__T3MpProviderMini,{entry:${tVar}})]})`,
      ),
  );

  out += `\nfunction __T3MpQuotaBadge({entry,modelSlug}){const[,setTick]=(0,${reactNs}.useState)(0);(0,${reactNs}.useEffect)(()=>{if(!globalThis.__t3QuotaUi?.subscribe)return;return globalThis.__t3QuotaUi.subscribe(()=>setTick(x=>x+1))},[]);const q=globalThis.__t3QuotaUi?.getProviderQuota?.(entry,modelSlug,Date.now());if(!q)return null;const zh=globalThis.__t3QuotaUi?globalThis.__t3QuotaUi.isZh():!0;return(0,${jsxNs}.jsx)("span",{className:"t3-mp-quota-badge t3-mp-quota-"+q.tone,title:q.tooltip,children:(zh?"剩 ":"")+q.remaining+"%"})}\nfunction __T3MpProviderMini({entry}){const q=globalThis.__t3QuotaUi?.getProviderQuota?.(entry,null,Date.now());if(!q)return null;return(0,${jsxNs}.jsx)("span",{className:"t3-mp-provider-pill t3-q-"+q.tone,title:q.tooltip,children:q.remaining})}\n`;

  return applyV9ModelPickerStructure(out);
}

function patchChatTopbarBundle(src) {
  let out = src;

  const providersMatch = out.match(/providers:([A-Za-z0-9_$]+),sources:[A-Za-z0-9_$]+,isWorking:[A-Za-z0-9_$]+,[\s\S]{0,320}?onOpenUsageLimits:([A-Za-z0-9_$]+)\?([A-Za-z0-9_$]+):void 0/);
  const reactMatch = out.match(/var [A-Za-z0-9_$]+=\(0,([A-Za-z0-9_$]+)\.memo\)\(function\([A-Za-z0-9_$]+\)\{let [A-Za-z0-9_$]+=\(0,[A-Za-z0-9_$]+\.c\)\(80\),\{activeThreadEnvironmentId:/);
  const rightPanelMatch = out.match(/rightPanelOpen:([A-Za-z0-9_$]+),onNewThreadInProject:/);

  if (!providersMatch || !reactMatch) return out;

  const providersVar = providersMatch[1];
  const canOpenVar = providersMatch[2];
  const openUsageVar = providersMatch[3];
  const reactNs = reactMatch[1];
  const rightPanelVar = rightPanelMatch ? rightPanelMatch[1] : "!1";

  // 1. Topbar Quota Pills with guaranteed safe right inset (never overlaps top-right 3 icons)
  const topbarCallMatch = out.match(/(\(0,([A-Za-z0-9_$]+)\.jsx\)\(([A-Za-z0-9_$]+),\{activeThreadEnvironmentId:[A-Za-z0-9_$]+\.environmentId,activeThreadId:[A-Za-z0-9_$]+\.id,[\s\S]{0,420}?\}\)\s*)\]\}\)/);
  const jsxNsMatch = out.match(/\(0,([A-Za-z0-9_$]+)\.jsx\)\(__T3TopbarQuotaPills,/);
  const jsxNs = topbarCallMatch ? topbarCallMatch[2] : (jsxNsMatch ? jsxNsMatch[1] : null);

  if (jsxNs) {
    const newTopbarComp = `function __T3TopbarQuotaPills({providers,onOpenUsageLimits,rightPanelOpen}){const[now,setNow]=(0,${reactNs}.useState)(()=>Date.now());const[,setTick]=(0,${reactNs}.useState)(0);(0,${reactNs}.useEffect)(()=>{const id=setInterval(()=>setNow(Date.now()),60000);const unsub=globalThis.__t3QuotaUi?.subscribe?.(()=>setTick(x=>x+1));return()=>{clearInterval(id);if(typeof unsub==="function")unsub()}},[]);const pills=globalThis.__t3QuotaUi?.buildTopbarPills?.(providers,now)||[];if(pills.length===0)return null;const zh=globalThis.__t3QuotaUi?globalThis.__t3QuotaUi.isZh():!0;return(0,${jsxNs}.jsx)("div",{className:"t3-topbar-quota-strip",style:{marginRight:rightPanelOpen?"52px":"128px"},"data-quota-ui-managed":"true","aria-label":zh?"模型额度状态":"Model quota status",children:pills.map(p=>(0,${jsxNs}.jsxs)("button",{type:"button",className:"t3-topbar-pill",title:p.tooltip+(zh?"\\n点击查看该厂商详细配额":"\\nClick for this provider's quota details"),onClick:ev=>{ev.stopPropagation();if(globalThis.__t3QuotaUi?.showTopbarQuotaPopover){globalThis.__t3QuotaUi.showTopbarQuotaPopover(p,ev.currentTarget)}else if(typeof onOpenUsageLimits==="function"){onOpenUsageLimits()}},children:[(0,${jsxNs}.jsx)("span",{className:"t3-topbar-pill-dot t3-q-dot-"+p.tone}),(0,${jsxNs}.jsx)("span",{className:"t3-topbar-pill-name",children:p.shortLabel}),(0,${jsxNs}.jsx)("span",{className:"t3-topbar-pill-pct t3-q-"+p.tone,children:p.remaining+"%"}),p.resetShort?(0,${jsxNs}.jsx)("span",{className:"t3-topbar-pill-reset",children:"· "+p.resetShort}):null]},p.id))})}`;

    if (out.includes("__T3TopbarQuotaPills")) {
      // Auto-heal v1.2.0 call & component to pass rightPanelOpen and safe right margin
      out = out.replace(
        /\(__T3TopbarQuotaPills,\{providers:([A-Za-z0-9_$]+),onOpenUsageLimits:([^}]+?)\}\)/,
        `(__T3TopbarQuotaPills,{providers:$1,onOpenUsageLimits:$2,rightPanelOpen:${rightPanelVar}})`,
      );
      out = out.replace(/function __T3TopbarQuotaPills\([\s\S]*?\}\n/, `${newTopbarComp}\n`);
    } else if (topbarCallMatch) {
      out = out.replace(
        topbarCallMatch[0],
        `${topbarCallMatch[1]},(0,${jsxNs}.jsx)(__T3TopbarQuotaPills,{providers:${providersVar},onOpenUsageLimits:${canOpenVar}?${openUsageVar}:void 0,rightPanelOpen:${rightPanelVar}})]})`,
      );
      out += `\n${newTopbarComp}\n`;
    }
  }

  // 2. v1.4.4 Compact 1/2-Height V18 Starship Launch Stack Effort Slider (26px slim track, uniform 0.52x scene scaling, single-line header, 2s auto-sleep)
  if (jsxNs) {
    const v18SliderFn = `function __T3EffortSlider({options,selectedId,disabled,onPick}){const TRACK_H=24,SCENE_H=50,SCENE_SCALE=TRACK_H/SCENE_H,PAD=16,LENS_W=26,LENS_H=21,SNAP=0.032,IDLE_FRAME_MS=1000/24,IDLE_SLEEP_MS=2000;const wellRef=(0,${reactNs}.useRef)(null);const wrapRef=(0,${reactNs}.useRef)(null);const canvasRef=(0,${reactNs}.useRef)(null);const offRef=(0,${reactNs}.useRef)(null);const particlesRef=(0,${reactNs}.useRef)(null);const wakeLoopRef=(0,${reactNs}.useRef)(null);const[,setLangTick]=(0,${reactNs}.useState)(0);const[dragging,setDragging]=(0,${reactNs}.useState)(!1);const[dragStory,setDragStory]=(0,${reactNs}.useState)(null);const count=Math.max(1,options.length);const foundIdx=options.findIndex(o=>o.id===selectedId);const selectedIndex=Math.max(0,foundIdx);const targetRatio=count<=1?0:selectedIndex/(count-1);const stateRef=(0,${reactNs}.useRef)({val:targetRatio,target:targetRatio,dragging:!1,lastIdx:selectedIndex,t:2.4,hitstop:0,flash:0,shake:0,recoil:0,chroma:0,shock:0,lastIdlePaintMs:0,lastActivityMs:0,hasPainted:!1});const applyJuice=(st,ni,pi)=>{if(ni>pi){st.hitstop=0.024;st.flash=0.3;st.shake=0.7;st.recoil=-3.2;st.chroma=0.85;st.shock=1}else{st.hitstop=0;st.flash=0.08;st.shake=0.18;st.recoil=1.4;st.chroma=0.25;st.shock=0}};const chime=ratio=>{try{if(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;if(!globalThis.__t3CosmicAudio)globalThis.__t3CosmicAudio=new AC;const ac=globalThis.__t3CosmicAudio;if(ac.state==="suspended")void ac.resume();const now=ac.currentTime,o1=ac.createOscillator(),o2=ac.createOscillator(),g=ac.createGain();o1.type="sine";o2.type="triangle";const f=360+ratio*620;o1.frequency.setValueAtTime(f,now);o1.frequency.exponentialRampToValueAtTime(f*1.35,now+0.045);o2.frequency.setValueAtTime(f*1.5,now);g.gain.setValueAtTime(0.04,now);g.gain.exponentialRampToValueAtTime(0.0008,now+0.07);o1.connect(g);o2.connect(g);g.connect(ac.destination);o1.start(now);o2.start(now);o1.stop(now+0.075);o2.stop(now+0.075)}catch{}};(0,${reactNs}.useEffect)(()=>{if(!globalThis.__t3QuotaUi?.subscribe)return;return globalThis.__t3QuotaUi.subscribe(()=>setLangTick(x=>x+1))},[]);(0,${reactNs}.useEffect)(()=>{const st=stateRef.current;if(!st.dragging){if(st.lastIdx!==selectedIndex){applyJuice(st,selectedIndex,st.lastIdx);st.lastIdx=selectedIndex}st.target=targetRatio;wakeLoopRef.current?.()}},[selectedIndex,targetRatio]);(0,${reactNs}.useEffect)(()=>{const V18=globalThis.__t3StardustV18;const canvas=canvasRef.current,wrap=wrapRef.current;if(!V18||!canvas||!wrap)return;const ctx=canvas.getContext("2d");if(!ctx)return;if(!offRef.current)offRef.current=document.createElement("canvas");const off=offRef.current,octx=off.getContext("2d");if(!octx)return;if(!particlesRef.current){const pool=V18.createStarshipParticles(56);V18.prewarmStarshipParticles(pool,stateRef.current.val);particlesRef.current=pool}const particles=particlesRef.current;const reduced=Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);let raf=0,lastTs=performance.now();const drawFrame=now=>{if(document.hidden){raf=0;canvas.dataset.renderState="sleeping";return}const layoutW=wrap.clientWidth;if(layoutW<2){raf=0;return}const st=stateRef.current;const activeMotion=st.dragging||st.hitstop>0||st.flash>0.01||st.shake>0.02||Math.abs(st.recoil)>0.08||st.chroma>0.01||st.shock>0.01||Math.abs(st.target-st.val)>0.001;if(activeMotion){st.lastActivityMs=now}else if(!reduced&&st.hasPainted&&now-st.lastActivityMs>=IDLE_SLEEP_MS){raf=0;canvas.dataset.renderState="sleeping";return}const cssW=Math.max(120,Math.min(520,Math.round(layoutW))),cssH=TRACK_H,dpr=Math.min(2,window.devicePixelRatio||1),cw=Math.round(cssW*dpr),ch=Math.round(cssH*dpr),needsResize=canvas.width!==cw||canvas.height!==ch;if(!reduced&&!activeMotion&&!needsResize&&st.hasPainted&&now-st.lastIdlePaintMs<IDLE_FRAME_MS){raf=requestAnimationFrame(drawFrame);return}const dt=Math.min(0.05,Math.max(0.001,(now-lastTs)/1000));lastTs=now;st.lastIdlePaintMs=now;if(needsResize){canvas.width=cw;canvas.height=ch;off.width=cw;off.height=ch}if(reduced){st.val=st.target;st.hitstop=st.flash=st.shake=st.recoil=st.chroma=st.shock=0}else if(st.hitstop>0){st.hitstop=Math.max(0,st.hitstop-dt)}else{st.t+=dt;st.val+=(st.target-st.val)*(st.dragging?0.45:0.24);if(Math.abs(st.target-st.val)<0.0005)st.val=st.target;st.flash=Math.max(0,st.flash-dt*4.6);st.shake=Math.max(0,st.shake-dt*6.4);st.recoil*=Math.pow(0.0008,dt);if(Math.abs(st.recoil)<0.05)st.recoil=0;st.chroma=Math.max(0,st.chroma-dt*7.2);st.shock=Math.max(0,st.shock-dt*4.5)}const well=wellRef.current;if(well){if(!reduced&&st.shake>0.02){well.style.transform="translate3d("+(Math.sin(now*0.095)*1.2*st.shake).toFixed(2)+"px,"+(Math.cos(now*0.13)*0.8*st.shake).toFixed(2)+"px,0)"}else if(well.style.transform){well.style.transform=""}}const kx=PAD+st.val*(cssW-PAD*2)+st.recoil,ky=cssH/2;const sceneW=cssW/SCENE_SCALE,sceneKx=kx/SCENE_SCALE;octx.setTransform(dpr*SCENE_SCALE,0,0,dpr*SCENE_SCALE,0,0);octx.clearRect(0,0,sceneW,SCENE_H);const{nx,ny,angle}=V18.drawStarshipScene(octx,sceneW,SCENE_H,st.val,sceneKx,st.t,particles,st.shock);if(!reduced&&st.hitstop<=0)V18.stepStarshipParticles(particles,dt,st.val,nx,ny,angle,sceneW);octx.setTransform(dpr,0,0,dpr,0,0);for(let i=0;i<count;i++){const dx=count<=1?cssW/2:PAD+(i/(count-1))*(cssW-PAD*2);octx.fillStyle=i<=st.lastIdx?"rgba(255,255,255,0.88)":"rgba(255,255,255,0.24)";octx.beginPath();octx.arc(dx,cssH-2.6,i===st.lastIdx?1.35:0.85,0,Math.PI*2);octx.fill()}if(!reduced&&st.flash>0.01){octx.save();octx.fillStyle=V18.sampleStarshipFlash(st.val);octx.globalAlpha=st.flash;octx.fillRect(0,0,cssW,cssH);octx.restore()}ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,cw,ch);ctx.drawImage(off,0,0);ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);const kw=LENS_W+st.chroma*1.8,kh=LENS_H-st.chroma*0.8,kr=kh/2;ctx.save();ctx.shadowColor="rgba(0,0,0,0.42)";ctx.shadowBlur=st.dragging?10:6;ctx.shadowOffsetY=1.5;ctx.fillStyle="rgba(0,0,0,0.18)";ctx.beginPath();ctx.roundRect(kx-kw/2,ky-kh/2,kw,kh,kr);ctx.fill();ctx.restore();ctx.save();ctx.beginPath();ctx.roundRect(kx-kw/2,ky-kh/2,kw,kh,kr);ctx.clip();const mag=st.dragging?1.28:1.18,sw=(kw/mag)*dpr,sh=(kh/mag)*dpr,sx=Math.max(0,Math.min(cw-sw,kx*dpr-sw/2)),sy=Math.max(0,Math.min(ch-sh,ky*dpr-sh/2));ctx.drawImage(off,sx,sy,sw,sh,kx-kw/2,ky-kh/2,kw,kh);const disp=0.8+st.chroma*1.6;ctx.globalCompositeOperation="screen";ctx.globalAlpha=0.16+st.chroma*0.22;ctx.drawImage(off,Math.max(0,sx-disp*dpr),sy,sw,sh,kx-kw/2-disp,ky-kh/2,kw,kh);ctx.drawImage(off,Math.min(cw-sw,sx+disp*dpr),sy,sw,sh,kx-kw/2+disp,ky-kh/2,kw,kh);ctx.globalCompositeOperation="source-over";ctx.globalAlpha=1;const gg=ctx.createLinearGradient(kx,ky-kh/2,kx,ky+kh/2);gg.addColorStop(0,"rgba(255,255,255,0.34)");gg.addColorStop(0.22,"rgba(255,255,255,0.02)");gg.addColorStop(0.82,"rgba(255,255,255,0.01)");gg.addColorStop(1,"rgba(255,255,255,0.22)");ctx.fillStyle=gg;ctx.fillRect(kx-kw/2,ky-kh/2,kw,kh);ctx.fillStyle="rgba(255,255,255,0.68)";ctx.beginPath();ctx.ellipse(kx-1.2,ky-kh*0.35,kw*0.26,kh*0.06,0,0,Math.PI*2);ctx.fill();ctx.restore();const rg=ctx.createLinearGradient(kx,ky-kh/2,kx,ky+kh/2);rg.addColorStop(0,"rgba(255,255,255,0.92)");rg.addColorStop(0.5,"rgba(255,255,255,0.28)");rg.addColorStop(1,V18.sampleStarshipAccent(st.val));ctx.strokeStyle=rg;ctx.lineWidth=st.dragging||st.chroma>0.2?1.4:1.1;ctx.beginPath();ctx.roundRect(kx-kw/2+0.55,ky-kh/2+0.55,kw-1.1,kh-1.1,kr);ctx.stroke();ctx.restore();st.hasPainted=!0;canvas.dataset.renderState=reduced?"sleeping":"active";raf=reduced?0:requestAnimationFrame(drawFrame)};const wake=()=>{const now=performance.now();stateRef.current.lastActivityMs=now;canvas.dataset.renderState=reduced?"sleeping":"active";if(!raf){lastTs=now;raf=requestAnimationFrame(drawFrame)}};wakeLoopRef.current=wake;wake();let ro;if(typeof ResizeObserver!=="undefined"){ro=new ResizeObserver(()=>wake());ro.observe(wrap)}return()=>{wakeLoopRef.current=null;if(raf)cancelAnimationFrame(raf);if(wellRef.current)wellRef.current.style.transform="";ro?.disconnect()}},[count]);if(count<2)return null;const V18=globalThis.__t3StardustV18;const zh=globalThis.__t3QuotaUi?globalThis.__t3QuotaUi.isZh():!0;const shortLbl=o=>{const id=String(o.id||o.label||"").toLowerCase();if(!zh)return o.label;if(id==="none"||id==="off")return"关";if(id==="minimal")return"极低";if(id==="low")return"低";if(id==="medium")return"中";if(id==="high")return"高";if(id==="xhigh")return"超高";if(id==="max"||id==="ultra")return"Max";return o.label};const activeOpt=options[selectedIndex]||options[0];const activeColor=V18?V18.sampleStarshipAccent(targetRatio):"#3cf6ff";const storyKey=dragStory||(V18?V18.starshipStoryAtRatio(targetRatio):"");const storyTxt=(globalThis.__t3QuotaUi?.translateStarshipStory?globalThis.__t3QuotaUi.translateStarshipStory(storyKey):storyKey).split("·")[0].trim();const p2i=cx=>{const rect=wrapRef.current?.getBoundingClientRect();if(!rect||rect.width<=0||count<=1)return{ratio:targetRatio,idx:selectedIndex};let raw=Math.max(0,Math.min(1,(cx-rect.left-PAD)/Math.max(20,rect.width-PAD*2)));for(let i=0;i<count;i++){const det=i/(count-1);if(Math.abs(raw-det)<SNAP){raw=det;break}}return{ratio:raw,idx:Math.round(raw*(count-1))}};const commit=(idx,snd=!0)=>{const opt=options[idx];if(!opt||disabled)return;if(opt.id!==selectedId){if(snd)chime(count<=1?0:idx/(count-1));onPick(opt.id)}};return(0,${jsxNs}.jsxs)("div",{"data-cosmic-effort-slider":"","data-cosmic-scene":"starship","data-quota-ui-managed":"true",className:disabled?"opacity-60":"",onPointerEnter:()=>wakeLoopRef.current?.(),onFocus:()=>wakeLoopRef.current?.(),children:[(0,${jsxNs}.jsxs)("div",{"data-cosmic-embed-head":"",children:[(0,${jsxNs}.jsxs)("b",{children:[(0,${jsxNs}.jsx)("span",{"aria-hidden":"true","data-cosmic-state-dot":"",style:{background:activeColor,boxShadow:"0 0 6px "+activeColor}}),(0,${jsxNs}.jsx)("span",{className:"shrink-0","data-cosmic-level-heading":"",children:(zh?"推理 · ":"Effort · ")+shortLbl(activeOpt)}),(0,${jsxNs}.jsx)("span",{className:"truncate","data-cosmic-story":storyKey,children:"· "+storyTxt},storyKey)]}),(0,${jsxNs}.jsx)("span",{className:"shrink-0 tabular-nums",style:{color:"var(--v9-fg-3)",fontSize:"10px"},children:zh?count+" 档":count+" lvls"})]}),(0,${jsxNs}.jsx)("div",{ref:wellRef,"data-cosmic-stage-well":"",children:(0,${jsxNs}.jsx)("div",{ref:wrapRef,role:"slider",tabIndex:-1,"aria-valuemin":0,"aria-valuemax":count-1,"aria-valuenow":selectedIndex,"data-cosmic-track":"",className:disabled?"pointer-events-none":dragging?"cursor-grabbing":"cursor-grab",onPointerDown:ev=>{if(disabled||ev.button!==0)return;try{ev.currentTarget.setPointerCapture(ev.pointerId)}catch{}setDragging(!0);stateRef.current.dragging=!0;const{ratio,idx}=p2i(ev.clientX);stateRef.current.target=ratio;stateRef.current.val=ratio;if(V18)setDragStory(V18.starshipStoryAtRatio(ratio));wakeLoopRef.current?.();if(idx!==stateRef.current.lastIdx){applyJuice(stateRef.current,idx,stateRef.current.lastIdx);stateRef.current.lastIdx=idx;commit(idx,!0)}},onPointerMove:ev=>{if(!stateRef.current.dragging||disabled)return;const{ratio,idx}=p2i(ev.clientX);stateRef.current.target=ratio;if(V18){const ns=V18.starshipStoryAtRatio(ratio);setDragStory(p=>p===ns?p:ns)}if(idx!==stateRef.current.lastIdx){applyJuice(stateRef.current,idx,stateRef.current.lastIdx);stateRef.current.lastIdx=idx;commit(idx,!0)}},onPointerUp:()=>{if(!stateRef.current.dragging)return;stateRef.current.dragging=!1;setDragging(!1);setDragStory(null);const idx=Math.round(stateRef.current.target*(count-1));stateRef.current.target=count<=1?0:idx/(count-1);commit(idx,!1);wakeLoopRef.current?.()},onPointerCancel:()=>{if(!stateRef.current.dragging)return;stateRef.current.dragging=!1;setDragging(!1);setDragStory(null);stateRef.current.target=targetRatio;wakeLoopRef.current?.()},children:(0,${jsxNs}.jsx)("canvas",{ref:canvasRef,"aria-hidden":"true",className:"pointer-events-none absolute inset-0 block size-full rounded-full"})})}),(0,${jsxNs}.jsx)("div",{"data-cosmic-tier-scale":"",children:options.map((o,idx)=>(0,${jsxNs}.jsx)("button",{type:"button",role:"radio","aria-checked":idx===selectedIndex,disabled,"data-effort-row":!0,"data-effort-level":!0,tabIndex:idx===selectedIndex?0:-1,title:o.description||o.label,onClick:()=>{applyJuice(stateRef.current,idx,stateRef.current.lastIdx);stateRef.current.lastIdx=idx;commit(idx,!0);wakeLoopRef.current?.()},children:shortLbl(o)},o.id))}),(0,${jsxNs}.jsxs)("div",{"data-v9-perm-row":"",children:[(0,${jsxNs}.jsx)("span",{className:"shrink-0",children:zh?"访问权限":"Permissions"}),(0,${jsxNs}.jsx)("div",{"data-v9-perm-seg":"",role:"radiogroup",children:[{id:"full-access",zh:"完全访问",en:"Full"},{id:"auto",zh:"自动",en:"Auto"},{id:"approval-required",zh:"需审批",en:"Ask"}].map(pm=>{const curTxt=(document.querySelector("[data-composer-permissions-trigger]")?.textContent||"").toLowerCase();const active=pm.id==="full-access"?(/full|完全/.test(curTxt)):pm.id==="approval-required"?(/ask|approval|询问|审批/.test(curTxt)):(!/full|完全|ask|approval|询问|审批/.test(curTxt));return(0,${jsxNs}.jsx)("button",{type:"button","data-v9-perm-opt":"",role:"radio","aria-checked":active,onClick:()=>{const trig=document.querySelector("[data-composer-permissions-trigger]");if(trig)trig.click()},children:zh?pm.zh:pm.en},pm.id)})})]})]})}`;

    if (out.includes("function __T3EffortSlider(")) {
      out = out.replace(/function __T3EffortSlider\([\s\S]*?\}\n/, `${v18SliderFn}\n`);
    } else {
      const xrRegex = /([A-Za-z0-9_$]+)=([A-Za-z0-9_$]+)\.map\(\(([A-Za-z0-9_$]+),([A-Za-z0-9_$]+)\)=>\(0,([A-Za-z0-9_$]+)\.jsx\)\(([A-Za-z0-9_$]+),\{label:\3\.label,selected:\3\.id===([A-Za-z0-9_$]+),tabStop:[A-Za-z0-9_$]+\?\3\.id===\7:\4===0,description:\3\.description,isDefault:\3\.isDefault,disabled:([A-Za-z0-9_$]+),onPick:\(\)=>([A-Za-z0-9_$]+)\.changeSelect\(([A-Za-z0-9_$]+)\.descriptor,\3\.id\)\},\3\.id\)\)/;
      if (xrRegex.test(out)) {
        out = out.replace(
          xrRegex,
          (full, fV, eOpts, _opt, _idx, jNs, _qR, selId, disV, traitsV, ctrlV) =>
            `${fV}=${eOpts}.length>=2?(0,${jNs}.jsx)(__T3EffortSlider,{options:${eOpts},selectedId:${selId},disabled:${disV},onPick:__id=>${traitsV}.changeSelect(${ctrlV}.descriptor,__id)}):${full.slice(fV.length + 1)}`,
        );
        out += `\n${v18SliderFn}\n`;
      }
    }
  }

  // 3. v1.4.0 1:1 Original MIT V9 Magnetic-Spring Session Stats Pill inside jU (composer-telemetry-strip)
  if (jsxNs) {
    const v9StatsFn = `function __T3TelemetryPill({usage,liveTurn,latestTurn,turnCount,toolCallCount,cacheHitPercent,isWorking}){const[,setTick]=(0,${reactNs}.useState)(0);const clusterRef=(0,${reactNs}.useRef)(null);const dockRef=(0,${reactNs}.useRef)(null);(0,${reactNs}.useEffect)(()=>{if(!globalThis.__t3QuotaUi?.subscribe)return;return globalThis.__t3QuotaUi.subscribe(()=>setTick(x=>x+1))},[]);const zh=globalThis.__t3QuotaUi?globalThis.__t3QuotaUi.isZh():!0;const turns=Number.isFinite(turnCount)?turnCount:0;const steps=Number.isFinite(toolCallCount)?toolCallCount:0;const tObj=liveTurn||latestTurn||null;let tps=tObj?.outputTokensPerSecond??tObj?.tokensPerSecond??tObj?.genTokensPerSecond??null;if((!Number.isFinite(tps)||tps<=0)&&tObj&&Number.isFinite(tObj.outputTokens)&&Number.isFinite(tObj.durationMs)&&tObj.durationMs>200){tps=tObj.outputTokens/(tObj.durationMs/1000)}const tokRaw=usage?.usedTokens??usage?.totalTokens??usage?.contextTokens??tObj?.totalTokens??null;const fmtTok=n=>{if(!Number.isFinite(n)||n<=0)return null;if(n>=1e6)return(n/1e6).toFixed(1)+"M";if(n>=1e3)return(n/1e3).toFixed(1)+"K";return String(Math.round(n))};const tokStr=fmtTok(tokRaw);const cacheStr=Number.isFinite(cacheHitPercent)?Math.round(cacheHitPercent)+"%":null;if(turns<=0&&steps<=0&&!tokStr)return null;const leftTxt=zh?(turns+" 轮"+(steps>0?" "+steps+" 步":"")+(Number.isFinite(tps)&&tps>0?" · "+Math.round(tps)+" tok/s":"")):(turns+"t"+(steps>0?" · "+steps+"s":"")+(Number.isFinite(tps)&&tps>0?" · "+Math.round(tps)+" tok/s":""));const rightParts=[];if(tokStr)rightParts.push(tokStr+(zh?" 令牌":" tok"));if(cacheStr)rightParts.push((zh?"缓存 ":"cache ")+cacheStr);const dockTo=ev=>{const d=dockRef.current,c=clusterRef.current;if(!d||!c)return;const cr=c.getBoundingClientRect(),tr=ev.currentTarget.getBoundingClientRect();d.style.transform="translateX("+(tr.left-cr.left)+"px)";d.style.width=tr.width+"px";d.style.opacity="1"};const undock=()=>{const d=dockRef.current;if(d)d.style.opacity="0"};return(0,${jsxNs}.jsxs)("div",{ref:clusterRef,"data-v9-stats-cluster":"","data-quota-ui-managed":"true",onMouseLeave:undock,children:[(0,${jsxNs}.jsx)("span",{ref:dockRef,"data-v9-stats-dock-pill":"","aria-hidden":"true"}),(0,${jsxNs}.jsxs)("button",{type:"button","data-v9-stats-trig":"",onMouseEnter:dockTo,children:[(0,${jsxNs}.jsx)("span",{"data-v9-stats-dot":"","data-running":isWorking?"true":"false"}),(0,${jsxNs}.jsx)("span",{children:leftTxt})]}),rightParts.length>0?(0,${jsxNs}.jsx)("span",{"data-v9-stats-sep":"","aria-hidden":"true"}):null,rightParts.length>0?(0,${jsxNs}.jsx)("button",{type:"button","data-v9-stats-trig":"",onMouseEnter:dockTo,children:rightParts.join(" · ")}):null]})}`;

    if (out.includes("function __T3TelemetryPill(")) {
      out = out.replace(/function __T3TelemetryPill\([\s\S]*?\}\n/, `${v9StatsFn}\n`);
    } else {
      const juMatch = out.match(
        /function ([A-Za-z0-9_$]+)\(e\)\{let t=\(0,[A-Za-z0-9_$]+\.c\)\(\d+\),\{contextWindow:([A-Za-z0-9_$]+),providerInstanceId:[A-Za-z0-9_$]+,activeModel:[A-Za-z0-9_$]+,providers:[A-Za-z0-9_$]+,sources:[A-Za-z0-9_$]+,isWorking:([A-Za-z0-9_$]+),liveTurn:([A-Za-z0-9_$]+),latestCacheTurn:([A-Za-z0-9_$]+),sessionCacheHitPercent:([A-Za-z0-9_$]+),sessionCacheTurnCount:[A-Za-z0-9_$]+,turnCount:([A-Za-z0-9_$]+),toolCallCount:([A-Za-z0-9_$]+),[\s\S]{0,3600}?"data-slot":[`"']composer-telemetry-strip[`"'],className:[`"']justify-between gap-2 pt-1\.5 pb-0\.5[`"'],children:\[([A-Za-z0-9_$]+),([A-Za-z0-9_$]+)\]\}/,
      );
      if (juMatch) {
        const [, , ctxV, workV, liveV, cacheTurnV, cachePctV, turnV, toolV, leftV, rightV] = juMatch;
        out = out.replace(
          juMatch[0],
          juMatch[0].replace(
            `children:[${leftV},${rightV}]}`,
            `children:[${leftV},(0,${jsxNs}.jsx)(__T3TelemetryPill,{usage:${ctxV},liveTurn:${liveV},latestTurn:${cacheTurnV},turnCount:${turnV},toolCallCount:${toolV},cacheHitPercent:${cachePctV},isWorking:${workV}}),${rightV}]}`,
          ),
        );
        out += `\n${v9StatsFn}\n`;
      }
    }
  }

  return out;
}

function patchPreviewPanelBundle(src) {
  if (src.includes("__T3PreviewPinBtn")) return src;
  let out = src;
  const reactMatch = out.match(/var ([A-Za-z0-9_$]+)=e\(t\(\),1\)/);
  const formMatch = out.match(
    /onClick:e=>([A-Za-z0-9_$]+)\(e\.shiftKey\)[\s\S]{0,1600}?"data-surface-subheader":!0,children:\[([A-Za-z0-9_$]+),([A-Za-z0-9_$]+),([A-Za-z0-9_$]+),([A-Za-z0-9_$]+),([A-Za-z0-9_$]+),([A-Za-z0-9_$]+),([A-Za-z0-9_$]+)\]\}\)/,
  );
  const jsxMatch = out.match(/\(0,([A-Za-z0-9_$]+)\.jsxs\)\([`"']form[`"'],\{onSubmit:/);
  if (!reactMatch || !formMatch || !jsxMatch) return src;
  const reactNs = reactMatch[1];
  const captureFn = formMatch[1];
  const jsxNs = jsxMatch[1];

  out = out.replace(
    `children:[${formMatch[2]},${formMatch[3]},${formMatch[4]},${formMatch[5]},${formMatch[6]},${formMatch[7]},${formMatch[8]}]`,
    `children:[${formMatch[2]},${formMatch[3]},${formMatch[4]},${formMatch[5]},${formMatch[6]},(0,${jsxNs}.jsx)(__T3PreviewPinBtn,{onCapture:${captureFn}}),${formMatch[7]},${formMatch[8]}]`,
  );

  out += `\nfunction __T3PreviewPinBtn({onCapture}){const[st,setSt]=(0,${reactNs}.useState)({active:!1,count:0});(0,${reactNs}.useEffect)(()=>{if(!globalThis.__t3QuotaUi?.subscribePreviewPins)return;return globalThis.__t3QuotaUi.subscribePreviewPins(setSt)},[]);const zh=globalThis.__t3QuotaUi?globalThis.__t3QuotaUi.isZh():!0;return(0,${jsxNs}.jsxs)("div",{className:"inline-flex shrink-0 items-center gap-1","data-quota-ui-managed":"true",children:[(0,${jsxNs}.jsx)("button",{type:"button",className:"t3-pin-bar-btn"+(st.active?" active":""),title:zh?"点击在预览页面扎图钉写修改意见":"Drop numbered pins on preview to annotate",onClick:()=>globalThis.__t3QuotaUi?.togglePreviewPins?.(),children:zh?(st.active?"📌 退出批注":"📌 批注"):(st.active?"📌 Exit Pins":"📌 Pins")}),st.active?(0,${jsxNs}.jsx)("button",{type:"button",className:"t3-pin-bar-btn send",disabled:st.count===0,onClick:()=>globalThis.__t3QuotaUi?.sendPreviewPins?.(onCapture),children:zh?"发送 ("+st.count+")":"Send ("+st.count+")"}):null]})}\n`;
  return out;
}

function patchServerBundle(src) {
  let out = src;

  // 1. Surface custom Claude API endpoints cleanly in Usage -> Limits
  if (!out.includes('id: "custom_api"')) {
    out = out.replace(
      /usageLimits:\s*resetCredits\s*\?\s*\{\s*\.\.\.usageLimits,\s*resetCredits\s*\}\s*:\s*usageLimits/g,
      `usageLimits: resetCredits ? { ...usageLimits, resetCredits } : (customApiEndpoint && usageLimits.unavailable ? { checkedAt: usageCheckedAt, windows: [{ id: "custom_api", kind: "other", label: endpoint ? "API · " + endpoint.replace(/^https?:\\/\\//, "") : "Custom API", usedPercent: 0 }] } : usageLimits)`,
    );
  }

  // 2. Per-instance Antigravity OAuth file isolation on macOS:
  //    - Only pass SSH_CONNECTION when this profile ALREADY has antigravity-oauth-token (so browser OAuth sign-in still works when signing in).
  //    - Auto-heal v1.1.2's overly aggressive readdirSync SSH_CONNECTION patch if present.
  //    - Before starting a new sign-in on a profile without antigravity-oauth-token, if another profile already has its own file, clear shared macOS Keychain so Google browser OAuth opens cleanly for a second account.
  //    - Right after onAuthenticated succeeds, snapshot the newly authorized macOS Keychain token into this profile's own antigravity-oauth-token file (0600) and drop stale acp_token.json so quota probe syncs immediately.
  const safeSshExpr = `...(auth.authMethod === "oauth-personal" && (() => { try { return process.getBuiltinModule("node:fs").existsSync(profile.acpDirectory + "/antigravity-oauth-token"); } catch { return false; } })() ? { SSH_CONNECTION: "127.0.0.1 0 127.0.0.1 0" } : {}),`;
  if (out.includes("readdirSync(__p.dirname(profile.geminiHome))")) {
    out = out.replace(
      /\.\.\.\(auth\.authMethod === "oauth-personal" && \(\(\) => \{[\s\S]*?readdirSync\(__p\.dirname\(profile\.geminiHome\)\)[\s\S]*?\}\)\(\) \? \{ SSH_CONNECTION: "127\.0\.0\.1 0 127\.0\.0\.1 0" \} : \{\}\),/,
      safeSshExpr,
    );
  } else if (out.includes("AGY_ACP_FORCE_FILE_STORAGE") && !out.includes('"/antigravity-oauth-token"')) {
    out = out.replace(
      /(GEMINI_HOME:\s*profile\.geminiHome,\s*AGY_ACP_FORCE_FILE_STORAGE:\s*"1",)/,
      `$1 ${safeSshExpr}`,
    );
  }

  if (out.includes("onAuthenticated: (started, runtime) =>") && !out.includes("__t3SnapshotAgyOAuth")) {
    out = out.replace(
      `const authFlow = yield* makeAntigravityAuth({\n\t\t\tinstanceId,\n\t\t\tmakeRuntime: makeDisposableRuntime,\n\t\t\tonAuthenticated: (started, runtime) => suspend(() => provider.onSignedIn).pipe(andThen(publishCatalog(started, runtime))),\n\t\t\tonSignedOut: suspend(() => provider.onSignedOut),`,
      `const __t3SnapshotAgyOAuth = () => {
			try {
				if (process.platform !== "darwin") return;
				const __fs = process.getBuiltinModule("node:fs");
				const __p = process.getBuiltinModule("node:path");
				const __cp = process.getBuiltinModule("node:child_process");
				const __oauthPath = __p.join(profileDirectory, "antigravity-acp", "antigravity-oauth-token");
				const __acpPath = __p.join(profileDirectory, "antigravity-acp", "acp_token.json");
				if (!__fs.existsSync(__oauthPath)) {
					const __kc = __cp.execFileSync("security", ["find-generic-password", "-s", "gemini", "-a", "antigravity", "-w"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
					const __json = __kc.startsWith("go-keyring-base64:") ? Buffer.from(__kc.slice(18), "base64").toString("utf8") : __kc;
					if (__json.startsWith("{") && __json.includes("refresh_token")) {
						__fs.mkdirSync(__p.dirname(__oauthPath), { recursive: true });
						__fs.writeFileSync(__oauthPath, __json, { mode: 384 });
						try { if (__fs.existsSync(__acpPath)) __fs.unlinkSync(__acpPath); } catch {}
					}
				}
			} catch {}
		};
		const __t3ClearAgyOAuth = () => {
			try {
				const __fs = process.getBuiltinModule("node:fs");
				const __p = process.getBuiltinModule("node:path");
				for (const __f of ["antigravity-oauth-token", "acp_token.json"]) {
					const __fp = __p.join(profileDirectory, "antigravity-acp", __f);
					if (__fs.existsSync(__fp)) __fs.unlinkSync(__fp);
				}
			} catch {}
		};
		const __t3PrepareAgySignIn = () => {
			try {
				if (process.platform !== "darwin") return;
				const __fs = process.getBuiltinModule("node:fs");
				const __p = process.getBuiltinModule("node:path");
				const __cp = process.getBuiltinModule("node:child_process");
				const __oauthPath = __p.join(profileDirectory, "antigravity-acp", "antigravity-oauth-token");
				if (__fs.existsSync(__oauthPath)) __fs.unlinkSync(__oauthPath);
				const __acpPath = __p.join(profileDirectory, "antigravity-acp", "acp_token.json");
				if (__fs.existsSync(__acpPath)) __fs.unlinkSync(__acpPath);
				const __parent = __p.dirname(profileDirectory);
				const __siblings = __fs.readdirSync(__parent).filter((d) => !d.startsWith(".") && __p.join(__parent, d) !== profileDirectory);
				if (__siblings.some((d) => __fs.existsSync(__p.join(__parent, d, "antigravity-acp", "antigravity-oauth-token")))) {
					try { __cp.execFileSync("security", ["delete-generic-password", "-s", "gemini", "-a", "antigravity"], { stdio: "ignore" }); } catch {}
				}
			} catch {}
		};
		const authFlow = yield* makeAntigravityAuth({
			instanceId,
			makeRuntime: (runtimeOpts) => { __t3PrepareAgySignIn(); return makeDisposableRuntime(runtimeOpts); },
			onAuthenticated: (started, runtime) => sync(__t3SnapshotAgyOAuth).pipe(andThen(suspend(() => provider.onSignedIn)), andThen(publishCatalog(started, runtime))),
			onSignedOut: sync(__t3ClearAgyOAuth).pipe(andThen(suspend(() => provider.onSignedOut))),`,
    );
  }

  // 3. v1.4.0 Local macOS Disk Cache Preview & Safe Cleanup API inside layerAssetRoute
  if (out.includes("const layerAssetRoute =") && !out.includes("__t3_cache_scan")) {
    out = out.replace(
      `const suffix = url.value.pathname.slice(\`\${ASSET_ROUTE_PREFIX}/\`.length);`,
      `const suffix = url.value.pathname.slice(\`\${ASSET_ROUTE_PREFIX}/\`.length);
	if (suffix === "__t3_cache_scan" || suffix === "__t3_cache_clean") {
		const __fs = process.getBuiltinModule("node:fs");
		const __p = process.getBuiltinModule("node:path");
		const __os = process.getBuiltinModule("node:os");
		const __home = __os.homedir();
		const __collectDirs = () => {
			const agyRoot = __p.join(__home, ".t3", "userdata", "providers", "antigravity");
			const agyLogs = [], agyCaches = [];
			try {
				for (const d of __fs.readdirSync(agyRoot)) {
					if (d.startsWith(".")) continue;
					const lp = __p.join(agyRoot, d, "antigravity-acp", "log");
					const cp = __p.join(agyRoot, d, "antigravity-acp", "cache");
					if (__fs.existsSync(lp)) agyLogs.push(lp);
					if (__fs.existsSync(cp)) agyCaches.push(cp);
				}
			} catch {}
			const libCaches = [];
			try {
				const lc = __p.join(__home, "Library", "Caches");
				for (const d of __fs.readdirSync(lc)) {
					if (/^(t3|com\\.t3tools|t3code)/i.test(d)) libCaches.push(__p.join(lc, d));
				}
			} catch {}
			const gpuCaches = [];
			try {
				const asDir = __p.join(__home, "Library", "Application Support");
				for (const d of __fs.readdirSync(asDir)) {
					if (/^t3/i.test(d)) {
						for (const sub of ["GPUCache", "Code Cache", "Cache", "DawnGraphiteCache", "DawnWebGPUCache"]) {
							const sp = __p.join(asDir, d, sub);
							if (__fs.existsSync(sp)) gpuCaches.push(sp);
						}
					}
				}
			} catch {}
			return [
				{ id: "t3-logs", labelZh: "T3 运行日志", labelEn: "T3 Runtime Logs", descZh: "客户端与服务端历史日志文件", descEn: "Client & server historical log files", displayPath: "~/.t3/userdata/logs", dirs: [__p.join(__home, ".t3", "userdata", "logs")] },
				{ id: "agy-logs", labelZh: "Antigravity 进程日志", labelEn: "Antigravity ACP Logs", descZh: "多实例 ACP 历史调试日志", descEn: "Historical ACP server debug logs", displayPath: "~/.t3/userdata/providers/antigravity/*/antigravity-acp/log", dirs: agyLogs },
				{ id: "agy-cache", labelZh: "Antigravity 临时缓存", labelEn: "Antigravity Temp Cache", descZh: "可安全重建的临时运行缓存（不动登录凭证）", descEn: "Rebuildable runtime cache (keeps auth tokens)", displayPath: "~/.t3/userdata/providers/antigravity/*/antigravity-acp/cache", dirs: agyCaches },
				{ id: "app-caches", labelZh: "macOS 应用系统缓存", labelEn: "macOS App Caches", descZh: "系统级缓存与更新残留包", descEn: "System-level caches & updater artifacts", displayPath: "~/Library/Caches/t3*", dirs: libCaches },
				{ id: "electron-gpu", labelZh: "Electron GPU / 编译缓存", labelEn: "Electron GPU & Code Cache", descZh: "Chromium 渲染与 JS 字节码缓存", descEn: "Chromium GPU & JS bytecode cache", displayPath: "~/Library/Application Support/t3*/{GPUCache,Code Cache,Cache}", dirs: gpuCaches }
			];
		};
		const __statDir = (dir) => {
			let bytes = 0, files = 0;
			const stack = [dir];
			while (stack.length) {
				const cur = stack.pop();
				let ents;
				try { ents = __fs.readdirSync(cur, { withFileTypes: true }); } catch { continue; }
				for (const e of ents) {
					const full = __p.join(cur, e.name);
					if (e.isDirectory()) stack.push(full);
					else if (e.isFile()) { try { bytes += __fs.statSync(full).size; files += 1; } catch {} }
				}
			}
			return { bytes, files };
		};
		const __cleanDir = (dir) => {
			let freed = 0, removed = 0;
			let ents;
			try { ents = __fs.readdirSync(dir, { withFileTypes: true }); } catch { return { freed, removed }; }
			for (const e of ents) {
				const full = __p.join(dir, e.name);
				if (e.isDirectory()) {
					const sub = __cleanDir(full);
					freed += sub.freed; removed += sub.removed;
					try { __fs.rmdirSync(full); } catch {}
				} else if (e.isFile()) {
					try { const sz = __fs.statSync(full).size; __fs.unlinkSync(full); freed += sz; removed += 1; } catch {}
				}
			}
			return { freed, removed };
		};
		const defs = __collectDirs();
		let freedBytes = 0, removedFiles = 0;
		if (suffix === "__t3_cache_clean" && url.value.searchParams.get("confirm") === "1") {
			const allow = new Set((url.value.searchParams.get("ids") || "").split(",").filter(Boolean));
			for (const def of defs) {
				if (!allow.has(def.id)) continue;
				for (const d of def.dirs) {
					if (__fs.existsSync(d)) {
						const r = __cleanDir(d);
						freedBytes += r.freed; removedFiles += r.removed;
					}
				}
			}
		}
		const items = defs.map((def) => {
			let bytes = 0, files = 0;
			for (const d of def.dirs) { if (__fs.existsSync(d)) { const s = __statDir(d); bytes += s.bytes; files += s.files; } }
			return { id: def.id, labelZh: def.labelZh, labelEn: def.labelEn, descZh: def.descZh, descEn: def.descEn, displayPath: def.displayPath, bytes, files };
		});
		return text$4(JSON.stringify({ freedBytes, removedFiles, items }), { status: 200, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
	}`,
    );
  }

  return out;
}

function patchRuntimeLayerBundle(src) {
  let out = src;
  const anchor = `const tokenPath = path.join(input.profileDirectory, "antigravity-acp", "acp_token.json");`;
  if (!out.includes(anchor) || out.includes("__t3SyncAgyQuotaAuthV2")) {
    return out;
  }

  // Strip any legacy syncAntigravityTokenFile block if present so there is a single clean source of truth
  out = out.replace(
    /const oauthTokenPath = path\.join\(input\.profileDirectory, "antigravity-acp", "antigravity-oauth-token"\);\s*const syncAntigravityTokenFile = \(\) => \{[\s\S]*?\};\s*syncAntigravityTokenFile\(\);/,
    "",
  );
  out = out.replace(/\bsyncAntigravityTokenFile\(\);\s*/g, "");

  // Dynamically discovers & OAuth-verifies the exact 35-char GOCSPX client secret from local antigravity binary
  const helperBlock = `${anchor}
	let __agyClientMetaCache = null;
	const __isValidAgyClientSecret = (s) => typeof s === "string" && s.length === 35 && /^GOCS[P]X-[A-Za-z0-9_-]{28}$/.test(s);
	const __isValidAgyClientId = (id) => typeof id === "string" && id.endsWith(".apps.googleusercontent.com") && !id.startsWith("8843549");
	const __resolveLocalAgyClientMeta = (nodeFs, nodePath, nodeCp, refreshToken) => {
		if (__agyClientMetaCache) return __agyClientMetaCache;
		const toolsRoot = nodePath.resolve(input.profileDirectory, "../../../..", "tools", "antigravity-acp");
		const stack = [toolsRoot];
		let cids = [];
		let csecs = [];
		while (stack.length > 0) {
			const curDir = stack.pop();
			let entries;
			try { entries = nodeFs.readdirSync(curDir, { withFileTypes: true }); } catch { continue; }
			for (const entry of entries) {
				const full = nodePath.join(curDir, entry.name);
				if (entry.isDirectory()) {
					stack.push(full);
				} else if (entry.name === "antigravity") {
					try {
						const bin = nodeFs.readFileSync(full, "latin1");
						cids = [...new Set(bin.match(/\\d{10,}-[a-z0-9]{20,}\\.apps\\.googleusercontent\\.com/g) || [])];
						csecs = [...new Set(bin.match(/GOCS[P]X-[A-Za-z0-9_-]{28}/g) || [])];
						if (cids.length > 0 && csecs.length > 0) break;
					} catch {}
				}
			}
			if (cids.length > 0 && csecs.length > 0) break;
		}
		if (cids.length === 0 || csecs.length === 0) return null;
		const candidates = [];
		if (cids[1] && csecs[1]) candidates.push({ id: cids[1], s: csecs[1] });
		for (const id of cids) {
			if (!__isValidAgyClientId(id)) continue;
			for (const s of csecs) {
				if (!candidates.some((c) => c.id === id && c.s === s)) candidates.push({ id, s });
			}
		}
		if (refreshToken && nodeCp) {
			for (const cand of candidates) {
				try {
					const body = "client_id=" + encodeURIComponent(cand.id) + "&client_secret=" + encodeURIComponent(cand.s) + "&refresh_token=" + encodeURIComponent(refreshToken) + "&grant_type=refresh_token";
					const resp = nodeCp.execFileSync("curl", ["-fsS", "--max-time", "5", "-X", "POST", "https://oauth2.googleapis.com/token", "-H", "Content-Type: application/x-www-form-urlencoded", "-d", body], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
					if (resp && resp.includes('"access_token"')) {
						__agyClientMetaCache = cand;
						return __agyClientMetaCache;
					}
				} catch {}
			}
		}
		__agyClientMetaCache = candidates[0] || { id: cids[0], s: csecs[0] };
		return __agyClientMetaCache;
	};
	const __t3SyncAgyQuotaAuthV2 = () => {
		try {
			const nodeFs = process.getBuiltinModule("node:fs");
			const nodePath = process.getBuiltinModule("node:path");
			const nodeCp = process.getBuiltinModule("node:child_process");
			const oauthFile = nodePath.join(input.profileDirectory, "antigravity-acp", "antigravity-oauth-token");
			let existing = null;
			try {
				if (nodeFs.existsSync(tokenPath)) {
					existing = JSON.parse(nodeFs.readFileSync(tokenPath, "utf8"));
				}
			} catch {}
			let refresh = null;
			let explicitMeta = null;
			if (nodeFs.existsSync(oauthFile)) {
				const parsed = JSON.parse(nodeFs.readFileSync(oauthFile, "utf8"));
				refresh = parsed?.token?.refresh_token || parsed?.refresh_token || null;
				if (__isValidAgyClientId(parsed?.client_id) && __isValidAgyClientSecret(parsed?.client_secret)) {
					explicitMeta = { id: parsed.client_id, s: parsed.client_secret };
				}
			} else if (typeof existing?.refresh_token === "string" && existing.refresh_token.length > 0) {
				refresh = existing.refresh_token;
			} else if (process.platform === "darwin") {
				try {
					const kc = nodeCp.execFileSync("security", ["find-generic-password", "-s", "gemini", "-a", "antigravity", "-w"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
					const jsonStr = kc.startsWith("go-keyring-base64:") ? Buffer.from(kc.slice(18), "base64").toString("utf8") : kc;
					const parsed = JSON.parse(jsonStr);
					refresh = parsed?.token?.refresh_token || parsed?.refresh_token || null;
				} catch {}
			}
			if (typeof refresh !== "string" || refresh.length === 0) return;
			if (existing && existing.refresh_token === refresh && __isValidAgyClientId(existing.client_id) && __isValidAgyClientSecret(existing.client_secret)) {
				return;
			}
			const meta = explicitMeta
				|| (__isValidAgyClientId(existing?.client_id) && __isValidAgyClientSecret(existing?.client_secret) ? { id: existing.client_id, s: existing.client_secret } : null)
				|| __resolveLocalAgyClientMeta(nodeFs, nodePath, nodeCp, refresh);
			if (!meta) return;
			const payload = {
				client_id: meta.id,
				client_secret: meta.s,
				refresh_token: refresh,
				...(existing?.project_id ? { project_id: existing.project_id } : {})
			};
			nodeFs.writeFileSync(tokenPath, JSON.stringify(payload), { mode: 384 });
		} catch {}
	};
	__t3SyncAgyQuotaAuthV2();`;

  out = out.replace(anchor, helperBlock);
  out = out.replace(
    "const startedGeneration = generation;",
    "__t3SyncAgyQuotaAuthV2();\n\t\t\tconst startedGeneration = generation;",
  );
  return out;
}

const ZH_PAIRS_CHAT = [
  ["children:`Context`", "children:`上下文`"],
  ["`${i}% used`", "`已用 ${i}%`"],
  ["label:`Autocompact buffer`", "label:`自动压缩缓冲`"],
  ["label:`Free space`", "label:`剩余空间`"],
  ["children:`Prompt cache`", "children:`提示词缓存`"],
  ["children:`0% miss`", "children:`0% 未命中`"],
  ["`avg `", "`平均 `"],
  ["children:`Compact`", "children:`压缩`"],
  ["e.turnCount===1?`turn`:`turns`", "`轮对话`"],
  ["e.toolCallCount===1?`tool`:`tools`", "`次工具`"],
  ["e.skillCount===1?`skill`:`skills`", "`个技能`"],
  ["children:`Ctx`", "children:`上下文`"],
  ["`${e.used}% used`", "`已用 ${e.used}%`"],
  ["children:`Refresh quota`", "children:`刷新配额`"],
  ['"aria-label":`Refresh quota`', '"aria-label":`刷新配额`'],
  ["children:`Other model pools`", "children:`其他模型配额池`"],
  ["children:`Other active subscriptions`", "children:`其他活跃订阅`"],
  ["children:`Full limits panel`", "children:`完整配额面板`"],
  ["`Lineage`", "`分支脉络`"],
  ["title:`Side chats`", "title:`旁路会话`"],
  ["`Stop subagent`", "`停止子代理`"],
  ["`Disconnect agent session`", "`断开代理会话`"],
  ["`Enable a provider in Settings`", "`请在设置中启用模型提供方`"],
  ["`Ask anything...`", "`输入任何问题…`"],
];

const ZH_PAIRS_TIMELINE = [
  ["label:`Cached context`", "label:`已缓存上下文`"],
  ["label:`Uncached context`", "label:`未缓存上下文`"],
  ["label:`Used context`", "label:`已用上下文`"],
  ["label:`First answer`", "label:`首屏回复`"],
  ["label:`Gen speed`", "label:`生成速度`"],
  ["label:`End-to-end`", "label:`端到端速度`"],
  ["label:`Output`", "label:`输出`"],
  ["label:`Input`", "label:`输入`"],
  ["label:`Duration`", "label:`耗时`"],
  ["label:`Wall time`", "label:`总耗时`"],
];

const ZH_PAIRS_MENU = [
  ["`Ask anything. @ files, $ skills, / commands`", "`输入任何问题… @ 文件，$ 技能，/ 命令`"],
  ["label:`Environment and worktree`", "label:`环境与工作树`"],
  ["label:`Open in editor`", "label:`在编辑器中打开`"],
  ["label:`Project scripts`", "label:`项目脚本`"],
  ["label:`Branch and pull request`", "label:`分支与拉取请求`"],
  ["label:`Git actions`", "label:`Git 操作`"],
  ["label:`Changes`", "label:`代码变更`"],
  ["label:`Servers`", "label:`服务端口`"],
  ["label:`Automations`", "label:`自动化任务`"],
  ["label:`Lineage`", "label:`分支脉络`"],
  ["label:`Side chats`", "label:`旁路会话`"],
  ["label:`Usage limits`", "label:`配额限制`"],
  ["label:`Context window`", "label:`上下文窗口`"],
];

const ZH_PAIRS_MAIN = [
  ["s?`New thread (${s})`:`New thread`", "s?`新建对话 (${s})`:`新建对话`"],
  ["placeholder:`Search`", "placeholder:`搜索`"],
  ['"aria-label":`Search threads`', '"aria-label":`搜索对话`'],
  ["children:`Unpin thread`", "children:`取消置顶`"],
];

function applyStringPairs(src, pairs) {
  let out = src;
  for (const [from, to] of pairs) {
    if (out.includes(from)) {
      out = out.split(from).join(to);
    }
  }
  return out;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const appPath = path.resolve(opts.app);
  const asarPath = path.join(appPath, "Contents/Resources/app.asar");
  const plistPath = path.join(appPath, "Contents/Info.plist");

  if (!fs.existsSync(asarPath)) {
    throw new Error(`app.asar not found at: ${asarPath}`);
  }
  if (!fs.existsSync(plistPath)) {
    throw new Error(`Info.plist not found at: ${plistPath}`);
  }

  const buf = fs.readFileSync(asarPath);
  const picklePayloadSize = buf.readUInt32LE(4);
  const strSize = buf.readUInt32LE(12);
  const dataOffset = 8 + picklePayloadSize;
  const header = JSON.parse(buf.subarray(16, 16 + strSize).toString("utf8"));

  const allFiles = listFilesRecursive(header);
  const replacements = new Map();
  const patchedSummary = [];

  const readText = (relPath) => {
    if (replacements.has(relPath)) {
      return replacements.get(relPath).toString("utf8");
    }
    const node = getFileNode(header, relPath);
    if (!node) return null;
    const start = dataOffset + Number(node.offset);
    return buf.subarray(start, start + node.size).toString("utf8");
  };

  const writeTextIfChanged = (relPath, nextText, tag) => {
    const prevText = readText(relPath);
    if (prevText === null || prevText === nextText) return false;
    replacements.set(relPath, Buffer.from(nextText, "utf8"));
    patchedSummary.push(`${tag}: ${relPath}`);
    return true;
  };

  // 1. Patch index.html (CSS layout + runtime currency & bilingual switcher)
  const indexHtmlRel = "apps/server/dist/client/index.html";
  if (getFileNode(header, indexHtmlRel)) {
    let html = readText(indexHtmlRel);
    html = html.replace(/<!-- T3_QUOTA_UI_START -->[\s\S]*?<!-- T3_QUOTA_UI_END -->\n?/g, "");
    html = html.replace(/<script>\s*\(function\(\)\{\s*const DICT = \{[\s\S]*?<\/script>(?=<\/head>)/g, "");
    const block = buildInjectedHeadBlock(opts.lang);
    html = html.replace("</head>", `${block}</head>`);
    writeTextIfChanged(indexHtmlRel, html, `index-head(${opts.lang})`);
  }

  // 2. Scan client JS bundles dynamically (hash-agnostic)
  for (const rel of allFiles) {
    if (!rel.startsWith("apps/server/dist/client/assets/") || !rel.endsWith(".js")) {
      continue;
    }
    let text = readText(rel);
    let updated = text;

    if (
      updated.includes("malformed or inconsistent usage record") &&
      updated.includes("minimumFractionDigits:2,maximumFractionDigits:2")
    ) {
      updated = patchUsageFormatBundle(updated);
    }

    if (updated.includes("usage.cost") && updated.includes("usage.period.day")) {
      updated = patchUsageShortcutsBundle(updated);
    }

    if (
      updated.includes("No provider on the selected environments reports subscription limits") ||
      updated.includes("grid-cols-[11rem_minmax(0,1fr)]") ||
      updated.includes("grid-cols-[8.5rem_minmax(0,1fr)]")
    ) {
      updated = patchUsageLimitsView(updated);
    }

    if (
      updated.includes("https://chatgpt.com/#settings/Usage") ||
      updated.includes("subscription_sharing_usage_limit_exceeded")
    ) {
      updated = patchUsageLimitsShared(updated);
    }

    if (
      updated.includes("usage-page-preferences:v1") &&
      (updated.includes("Cost by type") || updated.includes("按类型费用"))
    ) {
      updated = patchChatUsageBundle(updated);
    }

    if (
      updated.includes("data-model-picker-sidebar") &&
      updated.includes("Search models...")
    ) {
      updated = patchModelPickerBundle(updated);
    }

    if (
      updated.includes("activeThreadEnvironmentId") &&
      updated.includes("workspace-topbar-height") &&
      updated.includes("onOpenUsageLimits:")
    ) {
      updated = patchChatTopbarBundle(updated);
    }

    if (
      updated.includes("Screenshot · Shift-click to record") &&
      updated.includes("data-preview-viewport")
    ) {
      updated = patchPreviewPanelBundle(updated);
    }

    if (opts.lang === "zh") {
      if (updated.includes("Autocompact buffer") || updated.includes("Other model pools")) {
        updated = applyStringPairs(updated, ZH_PAIRS_CHAT);
        updated = updated.replace(/`Resets in \$\{([A-Za-z0-9_$]+)\(e\.resetsInMs\)\}`/g, "`${$1(e.resetsInMs)}后重置`");
      }
      if (updated.includes("Uncached context") || updated.includes("First answer")) {
        updated = applyStringPairs(updated, ZH_PAIRS_TIMELINE);
      }
      if (updated.includes("Environment and worktree") || updated.includes("Ask anything. @ files")) {
        updated = applyStringPairs(updated, ZH_PAIRS_MENU);
      }
      if (updated.includes("Unpin thread") || updated.includes("Search threads")) {
        updated = applyStringPairs(updated, ZH_PAIRS_MAIN);
      }
    }

    if (updated !== text) {
      writeTextIfChanged(rel, updated, "client-ui");
    }
  }

  // 3. Scan server dist bundles dynamically (hash-agnostic)
  for (const rel of allFiles) {
    if (!rel.startsWith("apps/server/dist/") || !rel.endsWith(".mjs")) {
      continue;
    }
    let text = readText(rel);
    let updated = text;

    if (updated.includes("AGY_ACP_FORCE_FILE_STORAGE") || updated.includes("customApiEndpoint")) {
      updated = patchServerBundle(updated);
    }
    if (updated.includes('"antigravity-acp", "acp_token.json"')) {
      updated = patchRuntimeLayerBundle(updated);
    }

    if (updated !== text) {
      writeTextIfChanged(rel, updated, "server-runtime");
    }
  }

  console.log(`[t3code-quota-ui] Target app: ${appPath}`);
  console.log(`[t3code-quota-ui] Default language mode: ${opts.lang}`);
  console.log(`[t3code-quota-ui] Modified bundle entries: ${patchedSummary.length}`);
  for (const item of patchedSummary) {
    console.log(`  - ${item}`);
  }

  if (opts.dryRun) {
    console.log("[t3code-quota-ui] Dry run complete (no files written).");
    return;
  }

  if (replacements.size === 0) {
    console.log("[t3code-quota-ui] Bundle already up to date.");
    return;
  }

  // Rebuild ASAR archive with recalculated offsets and SHA-256 block hashes
  const chunks = [];
  let currentOffset = 0n;

  function rebuildTree(node, prefix = "") {
    if (!node || !node.files) return;
    for (const [name, child] of Object.entries(node.files)) {
      const rel = prefix ? `${prefix}/${name}` : name;
      if (child.files) {
        rebuildTree(child, rel);
      } else if (!child.unpacked && child.offset !== undefined) {
        let fileBuf;
        if (replacements.has(rel)) {
          fileBuf = replacements.get(rel);
          child.size = fileBuf.length;
          if (child.integrity) {
            child.integrity = computeIntegrity(fileBuf);
          }
        } else {
          const origStart = dataOffset + Number(child.offset);
          fileBuf = buf.subarray(origStart, origStart + child.size);
        }
        child.offset = currentOffset.toString();
        chunks.push(fileBuf);
        currentOffset += BigInt(fileBuf.length);
      }
    }
  }

  rebuildTree(header);

  const newHeaderStr = JSON.stringify(header);
  const newHeaderBuf = Buffer.from(newHeaderStr, "utf8");
  const newStrSize = newHeaderBuf.length;
  const alignedStrSize = Math.ceil(newStrSize / 4) * 4;
  const headerPad = Buffer.alloc(alignedStrSize - newStrSize, 0);

  const pickleHeader = Buffer.alloc(16);
  pickleHeader.writeUInt32LE(4, 0);
  pickleHeader.writeUInt32LE(alignedStrSize + 8, 4);
  pickleHeader.writeUInt32LE(alignedStrSize + 4, 8);
  pickleHeader.writeUInt32LE(newStrSize, 12);

  const tmpAsarPath = `${asarPath}.quota-ui.tmp`;
  const fd = fs.openSync(tmpAsarPath, "w");
  try {
    fs.writeSync(fd, pickleHeader);
    fs.writeSync(fd, newHeaderBuf);
    if (headerPad.length > 0) fs.writeSync(fd, headerPad);
    for (const chunk of chunks) {
      fs.writeSync(fd, chunk);
    }
  } finally {
    fs.closeSync(fd);
  }
  fs.renameSync(tmpAsarPath, asarPath);

  // Update ElectronAsarIntegrity SHA-256 header digest in Contents/Info.plist
  const newHeaderHash = crypto.createHash("sha256").update(newHeaderBuf).digest("hex");
  let plist = fs.readFileSync(plistPath, "utf8");
  plist = plist.replace(
    /(<key>ElectronAsarIntegrity<\/key>[\s\S]*?<key>Resources\/app\.asar<\/key>\s*<dict>[\s\S]*?<key>hash<\/key>\s*<string>)[0-9a-fA-F]{64}(<\/string>)/,
    `$1${newHeaderHash}$2`,
  );
  fs.writeFileSync(plistPath, plist, "utf8");
  console.log(`[t3code-quota-ui] Updated ElectronAsarIntegrity: ${newHeaderHash}`);
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);

if (isDirectRun) {
  main();
}
