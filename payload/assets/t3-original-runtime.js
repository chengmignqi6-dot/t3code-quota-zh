// src/source-currency-store.mjs
var CURRENCY_KEY = "t3code:quota-ui-currency";
var RATE_KEY = "t3code:quota-ui-fx-rate";
var DEFAULT_RATE = 7.25;
function createCurrencyStore(storage2) {
  const read = (key) => {
    try {
      return storage2?.getItem(key);
    } catch {
      return null;
    }
  };
  const savedCurrency = read(CURRENCY_KEY), savedRate = read(RATE_KEY), parsedRate = savedRate === null || savedRate?.trim() === "" ? NaN : Number(savedRate);
  let currency = savedCurrency === "CNY" ? "CNY" : "USD";
  const rate = Number.isFinite(parsedRate) && parsedRate > 0 ? parsedRate : DEFAULT_RATE;
  const listeners = /* @__PURE__ */ new Set();
  const snapshot = () => Object.freeze({ currency, rate, rateSource: Number.isFinite(parsedRate) && parsedRate > 0 ? "saved-reference" : "upstream-reference-fallback" });
  return Object.freeze({
    adapterVersion: 1,
    isCny: () => currency === "CNY",
    getRate: () => rate,
    getSnapshot: snapshot,
    setCurrency(next) {
      if (!["CNY", "USD"].includes(next)) throw new TypeError("Unsupported display currency");
      if (currency === next) return;
      currency = next;
      try {
        storage2?.setItem(CURRENCY_KEY, currency);
      } catch {
      }
      for (const listener of [...listeners]) {
        try {
          listener(snapshot());
        } catch {
        }
      }
    },
    subscribe(listener) {
      if (typeof listener !== "function") throw new TypeError("Expected currency listener");
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  });
}

// work/source-port/native-modules/burn.js
function getLang() {
  return "en";
}
function fmtDurLong(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return "";
  const zh = getLang() === "zh";
  const totalMins = Math.max(1, Math.round(ms / 6e4));
  if (totalMins < 60) return zh ? totalMins + "\u5206\u949F" : totalMins + "m";
  const totalHrs = Math.floor(totalMins / 60);
  const remMins = totalMins % 60;
  if (totalHrs < 24) {
    if (zh) return remMins > 0 ? totalHrs + "\u5C0F\u65F6" + remMins + "\u5206" : totalHrs + "\u5C0F\u65F6";
    return remMins > 0 ? totalHrs + "h " + remMins + "m" : totalHrs + "h";
  }
  const days = Math.floor(totalHrs / 24);
  const remHrs = totalHrs % 24;
  if (zh) return remHrs > 0 ? days + "\u5929" + remHrs + "\u5C0F\u65F6" : days + "\u5929";
  return remHrs > 0 ? days + "d " + remHrs + "h" : days + "d";
}
function inferWindowDurationMs(win, remMs) {
  if (win && Number.isFinite(win.windowDurationMs) && win.windowDurationMs > 0) return win.windowDurationMs;
  const kind = String(win?.kind || "").toLowerCase();
  const lbl = String(win?.label || "").toLowerCase();
  if (kind === "session" || /5[- ]?hour|5h|session|会话/.test(lbl)) return 5 * 36e5;
  if (kind === "weekly" || /7[- ]?day|7d|weekly|每周/.test(lbl)) return 7 * 864e5;
  if (kind === "monthly" || /month|每月|月度/.test(lbl)) return 30 * 864e5;
  if (Number.isFinite(remMs) && remMs > 0) {
    if (remMs <= 6 * 36e5) return 5 * 36e5;
    if (remMs <= 8 * 864e5) return 7 * 864e5;
    if (remMs <= 32 * 864e5) return 30 * 864e5;
  }
  return 0;
}
function computeBurnForecast(poolOrWin, nowInput) {
  if (!poolOrWin) return null;
  const zh = getLang() === "zh";
  const now = Number.isFinite(nowInput) ? nowInput : Date.now();
  const firstWin = Array.isArray(poolOrWin.columns) ? poolOrWin.columns.find((c) => c && c.window)?.window || null : poolOrWin;
  const rawRem = Number.isFinite(poolOrWin.remainingPercent) ? poolOrWin.remainingPercent : firstWin && Number.isFinite(firstWin.usedPercent) ? Math.round(100 - firstWin.usedPercent) : null;
  if (rawRem === null || !Number.isFinite(rawRem)) return null;
  const remaining = Math.max(0, Math.min(100, rawRem));
  const used = 100 - remaining;
  if (firstWin && firstWin.id === "custom_api") return null;
  if (remaining >= 99) {
    return {
      tone: "ok",
      text: zh ? "\u2728 \u6EE1\u8840\u53EF\u7528" : "\u2728 Full capacity",
      title: zh ? "\u5F53\u524D\u7A97\u53E3\u989D\u5EA6\u51E0\u4E4E\u672A\u6D88\u8017" : "Window quota is at full capacity"
    };
  }
  if (remaining <= 0) {
    return {
      tone: "danger",
      text: zh ? "\u{1F6D1} \u5DF2\u89E6\u9876 \xB7 \u7B49\u5F85\u91CD\u7F6E" : "\u{1F6D1} Depleted \xB7 awaiting reset",
      title: zh ? "\u5F53\u524D\u7A97\u53E3\u989D\u5EA6\u5DF2\u8017\u5C3D" : "Window quota is depleted"
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
      text: zh ? remaining >= 50 ? "\u2705 \u8282\u594F\u5E73\u7A33 \xB7 \u4F59\u91CF\u5145\u8DB3" : remaining >= 20 ? "\u26A1 \u6CE8\u610F\u6D88\u8017\u8282\u594F" : "\u{1F525} \u4F59\u91CF\u504F\u4F4E" : remaining >= 50 ? "\u2705 Healthy headroom" : remaining >= 20 ? "\u26A1 Watch pace" : "\u{1F525} Low quota",
      title: ""
    };
  }
  const elapsedMs = durMs - remMs;
  if (elapsedMs < 12e4) {
    return {
      tone: "ok",
      text: zh ? "\u2728 \u65B0\u7A97\u53E3\u521A\u91CD\u7F6E" : "\u2728 Fresh window",
      title: zh ? "\u7A97\u53E3\u521A\u521A\u5F00\u59CB\uFF0C\u6682\u65E0\u8DB3\u591F\u6D88\u8017\u6837\u672C" : "Window just reset"
    };
  }
  const ratePerMs = used / elapsedMs;
  const ttfMs = ratePerMs > 0 ? remaining / ratePerMs : Infinity;
  if (ttfMs < remMs * 0.92) {
    const durStr = fmtDurLong(ttfMs);
    const tone = ttfMs < remMs * 0.5 || remaining <= 20 ? "danger" : "warn";
    return {
      tone,
      text: zh ? "\u26A1 \u6D88\u8017\u504F\u5FEB \xB7 \u7EA6 " + durStr + " \u540E\u89E6\u9876" : "\u26A1 Fast \xB7 ~" + durStr + " to cap",
      title: zh ? "\u6309\u5F53\u524D\u6D88\u8017\u901F\u7387\uFF0C\u9884\u8BA1\u5C06\u5728\u91CD\u7F6E\u524D\u7EA6 " + durStr + " \u8017\u5C3D\u989D\u5EA6" : "At current burn rate, quota will hit 0% in ~" + durStr + " before reset"
    };
  }
  const projectedLeft = Math.max(0, Math.min(100, Math.round(remaining - ratePerMs * remMs)));
  return {
    tone: "ok",
    text: zh ? "\u2705 \u8282\u594F\u5E73\u7A33 \xB7 \u91CD\u7F6E\u524D\u591F\u7528 (\u4F59~" + projectedLeft + "%)" : "\u2705 Steady \xB7 ~" + projectedLeft + "% at reset",
    title: zh ? "\u6309\u5F53\u524D\u901F\u7387\uFF0C\u7A97\u53E3\u91CD\u7F6E\u65F6\u9884\u8BA1\u4ECD\u5269\u7EA6 " + projectedLeft + "%" : "At current burn rate, ~" + projectedLeft + "% will remain at reset"
  };
}

// work/source-port/native-modules/quota-math.js
var WINDOW_LABELS_ZH = {
  "Session": "\u5F53\u524D\u4F1A\u8BDD",
  "Weekly": "\u6BCF\u5468\u989D\u5EA6",
  "Monthly": "\u6BCF\u6708\u989D\u5EA6",
  "Monthly spend": "\u6708\u5EA6\u6D88\u8D39",
  "Monthly credit limit": "\u6708\u5EA6\u989D\u5EA6\u4E0A\u9650",
  "Overall": "\u603B\u914D\u989D",
  "Cursor Models": "Cursor \u6A21\u578B",
  "Other Models": "\u7B2C\u4E09\u65B9\u6A21\u578B",
  "Custom API": "\u81EA\u5B9A\u4E49 API",
  "Go \xB7 Session": "Go \xB7 \u5F53\u524D\u4F1A\u8BDD",
  "Go \xB7 Weekly": "Go \xB7 \u6BCF\u5468\u989D\u5EA6",
  "Go \xB7 Monthly": "Go \xB7 \u6BCF\u6708\u989D\u5EA6",
  "5-hour window": "5\u5C0F\u65F6\u7A97\u53E3",
  "7-day window": "7\u5929\u7A97\u53E3",
  "5-hour reset": "5\u5C0F\u65F6\u91CD\u7F6E\u5238",
  "Weekly reset": "\u6BCF\u5468\u91CD\u7F6E\u5238",
  "Full reset": "\u5168\u91CF\u91CD\u7F6E\u5238"
};
function getLang2() {
  return "en";
}
function translateWindowLabel(label) {
  if (!label || typeof label !== "string" || getLang2() !== "zh") return label;
  if (label in WINDOW_LABELS_ZH) return WINDOW_LABELS_ZH[label];
  let out = label;
  out = out.replace(/Claude\s*&\s*GPT\s*\(shared\)/gi, "Claude / GPT \u5171\u4EAB");
  out = out.replace(/^Weekly\s*·\s*/, "\u6BCF\u5468\u989D\u5EA6 \xB7 ");
  out = out.replace(/^Session\s*·\s*/, "\u5F53\u524D\u4F1A\u8BDD \xB7 ");
  out = out.replace(/\s*·\s*5-hour$/i, " \xB7 5\u5C0F\u65F6");
  out = out.replace(/\s*·\s*5h$/i, " \xB7 5\u5C0F\u65F6");
  out = out.replace(/\s*·\s*7-day$/i, " \xB7 7\u5929");
  out = out.replace(/\s*·\s*7d$/i, " \xB7 7\u5929");
  out = out.replace(/\s*·\s*Weekly$/i, " \xB7 \u6BCF\u5468");
  out = out.replace(/\s*·\s*Monthly$/i, " \xB7 \u6BCF\u6708");
  out = out.replace(/\s*·\s*Quota$/i, " \xB7 \u914D\u989D");
  return out;
}
function fmtDurShort(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return "";
  const zh = getLang2() === "zh";
  const mins = Math.max(1, Math.round(ms / 6e4));
  if (mins < 60) return zh ? mins + "\u5206" : mins + "m";
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return zh ? hrs + "h" : hrs + "h";
  const days = Math.round(hrs / 24);
  return zh ? days + "\u5929" : days + "d";
}
function fmtDurLong2(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return "";
  const zh = getLang2() === "zh";
  const totalMins = Math.max(1, Math.round(ms / 6e4));
  if (totalMins < 60) return zh ? totalMins + "\u5206\u949F" : totalMins + "m";
  const totalHrs = Math.floor(totalMins / 60);
  const remMins = totalMins % 60;
  if (totalHrs < 24) {
    if (zh) return remMins > 0 ? totalHrs + "\u5C0F\u65F6" + remMins + "\u5206" : totalHrs + "\u5C0F\u65F6";
    return remMins > 0 ? totalHrs + "h " + remMins + "m" : totalHrs + "h";
  }
  const days = Math.floor(totalHrs / 24);
  const remHrs = totalHrs % 24;
  if (zh) return remHrs > 0 ? days + "\u5929" + remHrs + "\u5C0F\u65F6" : days + "\u5929";
  return remHrs > 0 ? days + "d " + remHrs + "h" : days + "d";
}
function inferWindowDurationMs2(win, remMs) {
  if (win && Number.isFinite(win.windowDurationMs) && win.windowDurationMs > 0) return win.windowDurationMs;
  const kind = String(win?.kind || "").toLowerCase();
  const lbl = String(win?.label || "").toLowerCase();
  if (kind === "session" || /5[- ]?hour|5h|session|会话/.test(lbl)) return 5 * 36e5;
  if (kind === "weekly" || /7[- ]?day|7d|weekly|每周/.test(lbl)) return 7 * 864e5;
  if (kind === "monthly" || /month|每月|月度/.test(lbl)) return 30 * 864e5;
  if (Number.isFinite(remMs) && remMs > 0) {
    if (remMs <= 6 * 36e5) return 5 * 36e5;
    if (remMs <= 8 * 864e5) return 7 * 864e5;
    if (remMs <= 32 * 864e5) return 30 * 864e5;
  }
  return 0;
}
function computeBurnForecast2(poolOrWin, nowInput) {
  if (!poolOrWin) return null;
  const zh = getLang2() === "zh";
  const now = Number.isFinite(nowInput) ? nowInput : Date.now();
  const firstWin = Array.isArray(poolOrWin.columns) ? poolOrWin.columns.find((c) => c && c.window)?.window || null : poolOrWin;
  const rawRem = Number.isFinite(poolOrWin.remainingPercent) ? poolOrWin.remainingPercent : firstWin && Number.isFinite(firstWin.usedPercent) ? Math.round(100 - firstWin.usedPercent) : null;
  if (rawRem === null || !Number.isFinite(rawRem)) return null;
  const remaining = Math.max(0, Math.min(100, rawRem));
  const used = 100 - remaining;
  if (firstWin && firstWin.id === "custom_api") return null;
  if (remaining >= 99) {
    return {
      tone: "ok",
      text: zh ? "\u2728 \u6EE1\u8840\u53EF\u7528" : "\u2728 Full capacity",
      title: zh ? "\u5F53\u524D\u7A97\u53E3\u989D\u5EA6\u51E0\u4E4E\u672A\u6D88\u8017" : "Window quota is at full capacity"
    };
  }
  if (remaining <= 0) {
    return {
      tone: "danger",
      text: zh ? "\u{1F6D1} \u5DF2\u89E6\u9876 \xB7 \u7B49\u5F85\u91CD\u7F6E" : "\u{1F6D1} Depleted \xB7 awaiting reset",
      title: zh ? "\u5F53\u524D\u7A97\u53E3\u989D\u5EA6\u5DF2\u8017\u5C3D" : "Window quota is depleted"
    };
  }
  const resetsAtMs = firstWin?.resetsAt ? Date.parse(firstWin.resetsAt) : NaN;
  const remMs = Number.isFinite(resetsAtMs) ? resetsAtMs - now : NaN;
  const durMs = inferWindowDurationMs2({
    windowDurationMs: firstWin?.windowDurationMs,
    kind: poolOrWin.kind || firstWin?.kind,
    label: poolOrWin.label || firstWin?.label
  }, remMs);
  if (!Number.isFinite(remMs) || remMs <= 0 || !durMs || durMs <= remMs) {
    const tone = remaining >= 50 ? "ok" : remaining >= 20 ? "warn" : "danger";
    return {
      tone,
      text: zh ? remaining >= 50 ? "\u2705 \u8282\u594F\u5E73\u7A33 \xB7 \u4F59\u91CF\u5145\u8DB3" : remaining >= 20 ? "\u26A1 \u6CE8\u610F\u6D88\u8017\u8282\u594F" : "\u{1F525} \u4F59\u91CF\u504F\u4F4E" : remaining >= 50 ? "\u2705 Healthy headroom" : remaining >= 20 ? "\u26A1 Watch pace" : "\u{1F525} Low quota",
      title: ""
    };
  }
  const elapsedMs = durMs - remMs;
  if (elapsedMs < 12e4) {
    return {
      tone: "ok",
      text: zh ? "\u2728 \u65B0\u7A97\u53E3\u521A\u91CD\u7F6E" : "\u2728 Fresh window",
      title: zh ? "\u7A97\u53E3\u521A\u521A\u5F00\u59CB\uFF0C\u6682\u65E0\u8DB3\u591F\u6D88\u8017\u6837\u672C" : "Window just reset"
    };
  }
  const ratePerMs = used / elapsedMs;
  const ttfMs = ratePerMs > 0 ? remaining / ratePerMs : Infinity;
  if (ttfMs < remMs * 0.92) {
    const durStr = fmtDurLong2(ttfMs);
    const tone = ttfMs < remMs * 0.5 || remaining <= 20 ? "danger" : "warn";
    return {
      tone,
      text: zh ? "\u26A1 \u6D88\u8017\u504F\u5FEB \xB7 \u7EA6 " + durStr + " \u540E\u89E6\u9876" : "\u26A1 Fast \xB7 ~" + durStr + " to cap",
      title: zh ? "\u6309\u5F53\u524D\u6D88\u8017\u901F\u7387\uFF0C\u9884\u8BA1\u5C06\u5728\u91CD\u7F6E\u524D\u7EA6 " + durStr + " \u8017\u5C3D\u989D\u5EA6" : "At current burn rate, quota will hit 0% in ~" + durStr + " before reset"
    };
  }
  const projectedLeft = Math.max(0, Math.min(100, Math.round(remaining - ratePerMs * remMs)));
  return {
    tone: "ok",
    text: zh ? "\u2705 \u8282\u594F\u5E73\u7A33 \xB7 \u91CD\u7F6E\u524D\u591F\u7528 (\u4F59~" + projectedLeft + "%)" : "\u2705 Steady \xB7 ~" + projectedLeft + "% at reset",
    title: zh ? "\u6309\u5F53\u524D\u901F\u7387\uFF0C\u7A97\u53E3\u91CD\u7F6E\u65F6\u9884\u8BA1\u4ECD\u5269\u7EA6 " + projectedLeft + "%" : "At current burn rate, ~" + projectedLeft + "% will remain at reset"
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
  return pool.reduce((best, cur) => !best || cur.usedPercent > best.usedPercent ? cur : best, null);
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
  const zh = getLang2() === "zh";
  const lines = wins.map((w) => {
    const r = Math.max(0, Math.min(100, Math.round(100 - w.usedPercent)));
    const wRemMs = w.resetsAt ? Date.parse(w.resetsAt) - now : NaN;
    const wReset = Number.isFinite(wRemMs) && wRemMs > 0 ? " \xB7 \u21BB " + fmtDurLong2(wRemMs) : "";
    const fc = computeBurnForecast2(w, now);
    const fcTxt = fc ? " (" + fc.text + ")" : "";
    return translateWindowLabel(w.label || w.kind || w.id) + ": " + r + "%" + (zh ? " \u5269\u4F59" : " left") + wReset + fcTxt;
  });
  return {
    remaining,
    tone: toneForRemaining(remaining),
    resetShort,
    tooltip: (entry.displayName || entry.driverKind || entry.provider || "") + "\n" + lines.join("\n")
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
    else base = String(p.displayName || dk).split(/\s+/)[0].slice(0, 8);
    const shortLabel = total > 1 ? base + idx : base;
    const q = getProviderQuota(p, null, now);
    if (!q) continue;
    const rawWins = extractWindows(p);
    const winList = rawWins.map((w) => {
      const r = Math.max(0, Math.min(100, Math.round(100 - w.usedPercent)));
      const wRemMs = w.resetsAt ? Date.parse(w.resetsAt) - now : NaN;
      const fc = computeBurnForecast2(w, now);
      return {
        id: w.id || w.label || w.kind || "",
        label: translateWindowLabel(w.label || w.kind || w.id || ""),
        remaining: r,
        tone: toneForRemaining(r),
        resetText: Number.isFinite(wRemMs) && wRemMs > 0 ? fmtDurLong2(wRemMs) : "",
        forecast: fc ? fc.text : "",
        forecastTone: fc ? fc.tone : "muted"
      };
    });
    pills.push({
      id: p.instanceId || p.id || dk + ":" + idx,
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

// work/source-port/native-modules/topbar-popover.js
function getLang3() {
  return "en";
}
var __activeTopbarPop = { id: null, el: null, cleanup: null };
function closeTopbarQuotaPopover() {
  if (__activeTopbarPop.cleanup) {
    try {
      __activeTopbarPop.cleanup();
    } catch {
    }
  }
  if (__activeTopbarPop.el) {
    try {
      __activeTopbarPop.el.remove();
    } catch {
    }
  }
  __activeTopbarPop = { id: null, el: null, cleanup: null };
}
function showTopbarQuotaPopover(pill, anchorEl, onOpenUsageLimits) {
  if (!pill) return;
  if (__activeTopbarPop.id === pill.id && __activeTopbarPop.el && document.body.contains(__activeTopbarPop.el)) {
    closeTopbarQuotaPopover();
    return;
  }
  closeTopbarQuotaPopover();
  const zh = getLang3() === "zh";
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
  closeBtn.textContent = "\xD7";
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
    empty.textContent = zh ? "\u8BE5\u5382\u5546\u6682\u65E0\u660E\u7EC6\u914D\u989D\u7A97\u53E3" : "No detailed quota windows reported";
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
      pct.textContent = (zh ? "\u5269\u4F59 " : "") + w.remaining + "%" + (zh ? "" : " left");
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
      resetEl.textContent = w.resetText ? zh ? "\u21BB " + w.resetText + "\u540E\u91CD\u7F6E" : "\u21BB resets in " + w.resetText : zh ? "\u65E0\u91CD\u7F6E\u5012\u8BA1\u65F6" : "No reset timer";
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
  openAll.textContent = zh ? "\u67E5\u770B\u5168\u90E8\u914D\u989D\u5927\u76D8 \u2192" : "Open full Limits dashboard \u2192";
  openAll.onclick = () => {
    closeTopbarQuotaPopover();
    onOpenUsageLimits?.();
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
  const onKey = (ev) => {
    if (ev.key === "Escape") closeTopbarQuotaPopover();
  };
  const addListenersTimer = setTimeout(() => {
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("keydown", onKey, true);
  }, 0);
  __activeTopbarPop = {
    id: pill.id,
    el: pop,
    cleanup: () => {
      clearTimeout(addListenersTimer);
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("keydown", onKey, true);
    }
  };
}

// src/native-quota-boundary.mjs
function usableQuotaEntry(entry, now = Date.now()) {
  if (!entry || entry.enabled === false || entry.installed === false || entry.isAvailable === false || entry.status === "disabled" || entry.availability === "unavailable" || entry.snapshot?.availability === "unavailable" || entry.auth?.status === "unauthenticated" || entry.snapshot?.auth?.status === "unauthenticated") return null;
  const limits = entry.usageLimits ?? entry.snapshot?.usageLimits;
  if (!limits || limits.unavailable || !Array.isArray(limits.windows)) return null;
  const windows = limits.windows.filter((window2) => {
    if (!window2 || !Number.isFinite(window2.usedPercent) || window2.id === "custom_api") return false;
    if (window2.resetsAt) {
      const reset = Date.parse(window2.resetsAt);
      if (!Number.isFinite(reset) || reset <= now) return false;
    }
    return true;
  });
  return windows.length ? { ...entry, usageLimits: { ...limits, windows } } : null;
}
function guardedQuotaFunctions(originalQuota, originalPills) {
  return {
    getProviderQuota(entry, model, nowInput) {
      const now = Number.isFinite(nowInput) ? nowInput : Date.now(), safe = usableQuotaEntry(entry, now);
      return safe ? originalQuota(safe, model, now) : null;
    },
    buildTopbarPills(entries, nowInput) {
      const now = Number.isFinite(nowInput) ? nowInput : Date.now();
      return originalPills(Array.isArray(entries) ? entries.map((entry) => usableQuotaEntry(entry, now)).filter(Boolean) : [], now);
    }
  };
}

// src/original-runtime-entry.mjs
if (globalThis.__t3QuotaUi !== void 0) throw new Error("Unexpected quota runtime: refusing to replace it");
var storage;
try {
  storage = globalThis.localStorage;
} catch {
}
var store = createCurrencyStore(storage);
function nativeBurnForecast(pool, nowInput) {
  const now = Number.isFinite(nowInput) ? nowInput : Date.now();
  const window2 = Array.isArray(pool?.columns) ? pool.columns.find((column) => column?.window)?.window : pool;
  if (window2?.resetsAt) {
    const reset = Date.parse(window2.resetsAt);
    if (!Number.isFinite(reset) || reset <= now) return null;
  }
  return computeBurnForecast(pool, nowInput);
}
Object.defineProperty(globalThis, "__t3QuotaUi", { value: Object.freeze({ ...store, showTopbarQuotaPopover, closeTopbarQuotaPopover, computeBurnForecast: nativeBurnForecast, ...guardedQuotaFunctions(getProviderQuota, buildTopbarPills) }), configurable: false });
