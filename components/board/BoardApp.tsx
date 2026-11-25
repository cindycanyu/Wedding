// @ts-nocheck
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { renderLogImage } from "./logExport";

/* ============ members ============ */
const MembersCtx = createContext([]);
function useProfiles() {
  return useContext(MembersCtx);
}
function memberOf(profiles, key) {
  return profiles.find((p) => p.member_key === key);
}
const EVENT_INITIAL = { sf: "SF", cn: "CN", us: "US", global: "∞" };

/* ============ icon set ============ */
function Icon({ name, size = 16, color = "currentColor", strokeWidth = 1.8 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  switch (name) {
    case "lock":
      return (
        <svg {...common}>
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path d="M4 12l5 5L20 6" />
        </svg>
      );
    case "question":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M9.5 9.3a2.5 2.5 0 1 1 3.9 2c-1 .7-1.4 1.2-1.4 2.2" />
          <circle cx="12" cy="17" r=".4" fill={color} />
        </svg>
      );
    case "bolt":
      return (
        <svg {...common}>
          <path d="M12 2 4 14h6l-1 8 9-13h-6l1-7z" fill={color} stroke="none" />
        </svg>
      );
    case "pin":
      return (
        <svg {...common}>
          <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" />
          <circle cx="12" cy="9.3" r="2.3" />
        </svg>
      );
    case "upload":
      return (
        <svg {...common}>
          <path d="M12 15V4M8 8l4-4 4 4" />
          <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
        </svg>
      );
    case "sparkle":
      return (
        <svg {...common} strokeWidth="1.4">
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
          <path d="M7 7l2 2M15 15l2 2M17 7l-2 2M7 17l2-2" />
        </svg>
      );
    case "x":
      return (
        <svg {...common}>
          <path d="M5 5l14 14M19 5 5 19" />
        </svg>
      );
    case "plus":
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "trash":
      return (
        <svg {...common}>
          <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-1 13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 7" />
        </svg>
      );
    case "bell":
      return (
        <svg {...common}>
          <path d="M6 10a6 6 0 0 1 12 0v4l2 3H4l2-3z" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
      );
    case "eye":
      return (
        <svg {...common}>
          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "eye-off":
      return (
        <svg {...common}>
          <path d="M2 12s4-7 10-7c2 0 3.6.6 5 1.5M22 12s-1.4 2.6-3.6 4.5M9.5 9.8a3 3 0 0 0 4.2 4.2" />
          <path d="M3 3l18 18" />
        </svg>
      );
    case "cart":
      return (
        <svg {...common}>
          <path d="M3 4h2l2.4 12.4a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L20 8H6" />
          <circle cx="9" cy="20" r="1.3" />
          <circle cx="17" cy="20" r="1.3" />
        </svg>
      );
    case "chat":
      return (
        <svg {...common}>
          <path d="M4 5h16v11H9l-5 4v-4H4z" />
        </svg>
      );
    case "send":
      return (
        <svg {...common}>
          <path d="M3 12 21 3 14 21l-3-7-8-2z" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
      );
    case "image":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="8.5" cy="9.5" r="1.5" />
          <path d="M21 16l-5.5-5.5L5 21" />
        </svg>
      );
    case "link":
      return (
        <svg {...common}>
          <path d="M14 4h6v6" />
          <path d="M20 4l-9 9" />
          <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
        </svg>
      );
    case "truck":
      return (
        <svg {...common}>
          <path d="M3 6h11v10H3z" />
          <path d="M14 9h4l3 3v4h-7" />
          <circle cx="7" cy="17.5" r="1.8" />
          <circle cx="17" cy="17.5" r="1.8" />
        </svg>
      );
    case "edit":
      return (
        <svg {...common}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      );
    case "flower":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="2.4" />
          <circle cx="12" cy="6.5" r="2.4" />
          <circle cx="17.5" cy="12" r="2.4" />
          <circle cx="12" cy="17.5" r="2.4" />
          <circle cx="6.5" cy="12" r="2.4" />
        </svg>
      );
    default:
      return null;
  }
}
// Order here is the order of the filter chips and the status dropdown.
const STATUS_META = {
  pending: { label: "选择中", color: "var(--pending)" },
  to_buy: { label: "待购买", color: "var(--neutral2)" },
  shipping: { label: "运送中", color: "var(--shipping)" },
  purchased: { label: "已到手", color: "var(--good)" },
};
const STATUS_ICON = { pending: "question", purchased: "check", to_buy: "cart", shipping: "truck" };
const TASK_STATUS = { todo: "待处理", doing: "进行中", done: "已完成" };
const VALID_TABS = new Set(["overview", "tasks", "inventory", "lookbook", "runofshow", "vendors", "daily", "log"]);
// Shared by Tasks and Daily: done always sinks to the bottom regardless of
// its deadline; among the rest, nearest deadline first (no-deadline items
// come after any with one); "doing" only breaks ties (same deadline, or
// both have no deadline).
function sortTaskList(items) {
  return [...items].sort((a, b) => {
    const aDone = a.status === "done";
    const bDone = b.status === "done";
    if (aDone !== bDone) return aDone ? 1 : -1;
    if (a.deadline !== b.deadline) {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return a.deadline.localeCompare(b.deadline);
    }
    const pa = a.status === "doing" ? 0 : 1;
    const pb = b.status === "doing" ? 0 : 1;
    return pa - pb;
  });
}
const RATE = 6.7; // fixed USD->CNY rate; good enough for a personal budget estimate
const ACC_CATS = [
  { id: "veil", name: "头纱" },
  { id: "overskirt", name: "可拆裙摆" },
  { id: "cape", name: "披肩外搭" },
  { id: "gloves", name: "手套" },
  { id: "jewelry", name: "珠宝" },
  { id: "headpiece", name: "头饰" },
  { id: "shoes", name: "鞋履" },
  { id: "tie", name: "领带 / 领结" },
  { id: "cufflink", name: "袖扣 / 口袋巾" },
];
const LOOK_SHAPES = [
  { id: "mermaid", name: "美人鱼型" },
  { id: "aline", name: "A 字型" },
  { id: "ball", name: "公主蓬蓬裙" },
  { id: "suit", name: "西装" },
];
const PHOTOS_BUCKET = "inventory-photos";

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d)) return null;
  return Math.round((d - today) / 86400000);
}
const WEEKDAY_ZH = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
function formatNodeDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d)) return null;
  return { label: `${d.getMonth() + 1}月${d.getDate()}日`, weekday: WEEKDAY_ZH[d.getDay()] };
}
// Minimal iCalendar reader for "manually import from an .ics file I exported
// out of Apple Calendar" — the opposite direction of /api/calendar. Only
// pulls what a task needs (title/date/notes) out of each VEVENT; anything
// else in the file (VALARM, timezones, recurrence) is simply ignored rather
// than supported, since this only ever feeds a one-time manual import.
function unescapeICal(s) {
  return String(s || "")
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}
function icsDateToISO(v) {
  const m = /^(\d{4})(\d{2})(\d{2})/.exec(v || "");
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}
function parseICSEvents(text) {
  // RFC5545 line folding: a continuation line starts with a space or tab.
  const unfolded = text.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
  const lines = unfolded.split(/\r\n|\n|\r/);
  const events = [];
  let cur = null;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      cur = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (cur) events.push(cur);
      cur = null;
      continue;
    }
    if (!cur) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).split(";")[0];
    const value = line.slice(idx + 1);
    if (key === "SUMMARY") cur.summary = unescapeICal(value);
    else if (key === "DESCRIPTION") cur.description = unescapeICal(value);
    else if (key === "DTSTART") cur.dtstart = value;
  }
  return events
    .filter((e) => e.summary)
    .map((e) => ({ summary: e.summary, description: e.description || "", date: icsDateToISO(e.dtstart) }));
}
// Optimistic updates otherwise fail silently: the item shows up, then the
// next realtime reload pulls the DB's real state and it quietly vanishes.
// A check-constraint violation (23514) almost always means schema.sql
// hasn't been re-run since a new status/option was added.
// Shopping links are often pasted straight from a share sheet, e.g.
// "【淘宝】… https://m.tb.cn/h.xxx 点击链接…" — keep just the URL. A bare
// "amazon.com/…" gets https:// added. Anything that isn't http(s) is
// rejected so a stored value can never become a javascript: link.
function normalizeShopLink(raw) {
  const t = String(raw || "").trim();
  if (!t) return "";
  const found = t.match(/https?:\/\/[^\s，。、“”"'<>【】]+/i);
  let url = found ? found[0] : /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(t) ? "https://" + t : t;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : t;
  } catch {
    return t;
  }
}
function isOpenableLink(v) {
  return /^https?:\/\//i.test(String(v || ""));
}
// Friendly shop name for a link's button ("淘宝" rather than "m.tb.cn").
const SHOP_NAMES = [
  [/(^|\.)(taobao\.com|tb\.cn)$/, "淘宝"],
  [/(^|\.)(tmall\.com|tmall\.hk)$/, "天猫"],
  [/(^|\.)(jd\.com|3\.cn)$/, "京东"],
  [/(^|\.)(pinduoduo\.com|yangkeduo\.com)$/, "拼多多"],
  [/(^|\.)(xiaohongshu\.com|xhslink\.com)$/, "小红书"],
  [/(^|\.)(amazon\.[a-z.]+|amzn\.to|a\.co)$/, "Amazon"],
  [/(^|\.)etsy\.com$/, "Etsy"],
];
function linkHost(v) {
  try {
    const host = new URL(v).hostname.replace(/^www\./, "");
    return SHOP_NAMES.find(([re]) => re.test(host))?.[1] || host;
  } catch {
    return "";
  }
}

// Editable list of purchase links: each saved link can be edited, opened
// or removed, and a blank row at the bottom adds another (Enter or blur).
function LinksEditor({ links, onChange }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const l = normalizeShopLink(draft);
    if (!l) return;
    onChange([...links, l]);
    setDraft("");
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {links.map((l, i) => (
        <div key={i}>
          <div className="link-row">
            <DebouncedField
              inputMode="url"
              value={l}
              onCommit={(v) => {
                const n = normalizeShopLink(v);
                if (n === l) return;
                onChange(n ? links.map((x, j) => (j === i ? n : x)) : links.filter((_, j) => j !== i));
              }}
            />
            {isOpenableLink(l) && (
              <a className="btn btn-primary" href={l} target="_blank" rel="noopener noreferrer">
                <Icon name="link" size={13} color="#fff" /> {linkHost(l) || "打开"}
              </a>
            )}
            <button type="button" className="btn btn-ghost" aria-label="删除这个链接" onClick={() => onChange(links.filter((_, j) => j !== i))}>
              <Icon name="x" size={13} />
            </button>
          </div>
          {!isOpenableLink(l) && <p className="note" style={{ margin: "4px 0 0" }}>这看起来不是网址，打不开。请粘贴以 http 开头的链接。</p>}
        </div>
      ))}
      <div className="link-row">
        <input
          inputMode="url"
          placeholder={links.length ? "再加一个链接" : "粘贴商品链接（淘宝分享文字也可以）"}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={add}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" className="btn btn-ghost" disabled={!draft.trim()} onClick={add}>
          <Icon name="plus" size={13} /> 添加
        </button>
      </div>
    </div>
  );
}

function alertSaveFailed(error) {
  const hint =
    error?.code === "23514"
      ? "\n\n数据库还不认识这个新选项，需要先在 Supabase 重新运行一遍 schema.sql。"
      : error?.code === "PGRST204" || error?.code === "42703"
      ? "\n\n数据库里还没有这个新栏位，需要先在 Supabase 重新运行一遍 schema.sql。"
      : "";
  window.alert(`保存失败了，刚才的修改没有存进数据库。${hint}\n\n（${error?.message || "未知错误"}）`);
}
// Whether a task/daily row gets the purple-red alert treatment — the whole
// row, not just the countdown badge (which keeps its own red styling).
function isDeadlineAlert(deadline, done) {
  if (done || !deadline) return false;
  const days = daysUntil(deadline);
  return days !== null && days <= 7;
}
function DeadlineBadge({ deadline, done }) {
  if (done) return <span className="statuspill done">已完成</span>;
  if (!deadline) return <span className="tmeta">无截止日期</span>;
  const days = daysUntil(deadline);
  if (days === null) return null;
  if (days < 0) return <span className="countdown">已超期 {-days} 天</span>;
  if (days === 0) return <span className="countdown">今天到期</span>;
  if (days <= 7) return <span className="countdown">还剩 {days} 天</span>;
  return (
    <span className="tmeta tabular">
      {deadline} 截止 · 还剩 {days} 天
    </span>
  );
}

/* ============ illustrations ============ */
function Cover({ type }) {
  const stroke = "#B76E79";
  const common = { viewBox: "0 0 200 150", preserveAspectRatio: "xMidYMid slice" };
  if (type === "cityhall")
    return (
      <svg {...common}>
        <rect width="200" height="150" fill="#F7EFE4" />
        <g stroke={stroke} strokeWidth="1.4" fill="none" opacity="0.9">
          <path d="M100 20 a22 22 0 1 1 0.1 0" />
          <path d="M100 20 L100 44" />
          <path d="M60 110 V58 M75 110 V58 M90 110 V58 M110 110 V58 M125 110 V58 M140 110 V58" />
          <path d="M50 58 H150 L140 44 H60 Z" />
          <path d="M45 110 H155 V122 H45 Z" />
          <path d="M45 122 H155 L160 134 H40 Z" />
        </g>
      </svg>
    );
  if (type === "china")
    return (
      <svg {...common}>
        <rect width="200" height="150" fill="#F7EFE4" />
        <g stroke={stroke} strokeWidth="1.4" fill="none" opacity="0.9">
          <ellipse cx="75" cy="68" rx="20" ry="26" />
          <path d="M75 42 V32 M60 42 h30" />
          <path d="M63 56 H87 M63 68 H87 M63 80 H87" />
          <ellipse cx="128" cy="90" rx="16" ry="21" />
          <path d="M128 69 V60 M116 69 h24" />
          <path d="M118 80 H138 M118 90 H138 M118 100 H138" />
          <path d="M30 128 Q100 112 170 128" />
        </g>
      </svg>
    );
  if (type === "dinner")
    return (
      <svg {...common}>
        <rect width="200" height="150" fill="#F7EFE4" />
        <g stroke={stroke} strokeWidth="1.4" fill="none" opacity="0.9">
          <ellipse cx="100" cy="95" rx="62" ry="16" />
          <path d="M60 95 V72 M100 95 V66 M140 95 V72" />
          <path d="M58 68 q2 -10 0 -16 M62 68 q-2 -10 0 -16" />
          <path d="M138 68 q2 -10 0 -16 M142 68 q-2 -10 0 -16" />
          <circle cx="100" cy="58" r="7" />
        </g>
      </svg>
    );
  return <svg {...common}><rect width="200" height="150" fill="#F7EFE4" /></svg>;
}
function LookSilhouette({ look, stroke = "#B76E79" }) {
  const common = { viewBox: "0 0 200 150", preserveAspectRatio: "xMidYMid slice" };
  const paths = {
    mermaid:
      "M90 20 h20 l6 46 q14 10 16 40 q2 18 -8 28 h-52 q-10 -10 -8 -28 q2 -30 16 -40 z",
    aline: "M92 20 h16 l4 34 q30 10 36 72 h-96 q6 -62 36 -72 z",
    ball: "M90 18 h20 l5 30 q46 8 50 76 h-130 q4 -68 50 -76 z",
    suit:
      "M78 20 L92 17 L100 27 L108 17 L122 20 L118 50 L110 45 L108 78 L128 78 L124 130 L104 130 L100 90 L96 130 L76 130 L72 78 L92 78 L90 45 L82 50 Z",
  };
  return (
    <svg {...common}>
      <rect width="200" height="150" fill="#F7EFE4" />
      <g transform="translate(0,2)">
        <path d={paths[look] || paths.aline} fill="none" stroke={stroke} strokeWidth="1.6" />
        {look !== "suit" && (
          <path d="M94 20 q6 10 12 0" fill="none" stroke={stroke} strokeWidth="1.3" />
        )}
        {look === "suit" && (
          <path
            d="M100 27 L100 78 M103 50 l0 4 M103 58 l0 4 M103 66 l0 4"
            fill="none"
            stroke={stroke}
            strokeWidth="1.1"
          />
        )}
      </g>
    </svg>
  );
}
function AccIllustration({ cat }) {
  const stroke = "#B76E79";
  const common = { viewBox: "0 0 100 100" };
  const shapes = {
    veil: <path d="M50 18 q26 10 20 60 h-40 q-6 -50 20 -60z" fill="none" stroke={stroke} strokeWidth="1.5" />,
    overskirt: <path d="M20 30 h60 l10 55 h-80 z" fill="none" stroke={stroke} strokeWidth="1.5" />,
    cape: (
      <path d="M30 22 h40 l14 50 q-27 10 -34 2 q-7 8 -34 -2z" fill="none" stroke={stroke} strokeWidth="1.5" />
    ),
    gloves: (
      <path
        d="M38 70 V38 q0-10 6-10 q6 0 6 10 v8 M50 46 V30 q0-8 5-8 q5 0 5 8v16 M60 46 V34 q0-7 5-7 q5 0 5 7v12 M38 70 q0 10 12 10 q16 0 16 -14 v-18"
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
      />
    ),
    jewelry: (
      <g fill="none" stroke={stroke} strokeWidth="1.5">
        <circle cx="50" cy="35" r="10" />
        <path d="M42 44 L38 66 M58 44 L62 66" />
      </g>
    ),
    headpiece: <path d="M24 55 q26 -28 52 0" fill="none" stroke={stroke} strokeWidth="1.5" />,
    shoes: (
      <path
        d="M22 70 h30 q22 0 26 -14 q2 -6 -4 -6 q-10 10 -24 6 l-4 -10 h-12 z"
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
      />
    ),
    tie: <path d="M50 20 l8 10 -8 44 -8 -44z" fill="none" stroke={stroke} strokeWidth="1.5" />,
    cufflink: (
      <g fill="none" stroke={stroke} strokeWidth="1.5">
        <circle cx="38" cy="50" r="12" />
        <circle cx="64" cy="50" r="12" />
      </g>
    ),
  };
  return (
    <svg {...common}>
      <rect width="100" height="100" fill="#F7EFE4" />
      {shapes[cat] || null}
    </svg>
  );
}

/* ============ small building blocks ============ */
function RingProgress({ value, size = 46, trackColor = "var(--blush-deep)", barColor = "var(--rose-deep)" }) {
  const r = (size - 6) / 2,
    c = 2 * Math.PI * r,
    off = c * (1 - value / 100);
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth="5" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={barColor}
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ringnum tabular">{value}%</div>
    </div>
  );
}
function Avatar({ id, size = 28 }) {
  const profiles = useProfiles();
  const m = memberOf(profiles, id);
  if (!m) {
    const nm = id || "?";
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: "var(--blush-deep)",
          color: "var(--plum-soft)",
          border: "1px solid var(--line)",
          fontSize: size * 0.38,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "none",
        }}
        title={nm}
      >
        {nm.slice(0, 1)}
      </div>
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: m.bg_color,
        color: m.text_color,
        fontSize: size * 0.38,
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "none",
      }}
      title={m.name}
    >
      {m.name.slice(0, 1)}
    </div>
  );
}
function OccChips({ occasions }) {
  return (
    <div className="occ-row">
      {(occasions || []).map((o) => (
        <span key={o} className="occ-chip">
          {EVENT_INITIAL[o] || o}
        </span>
      ))}
    </div>
  );
}
/* ============ Debounced text field ============ */
// Keeps a local draft so typing (including IME composition for Chinese
// pinyin) is never interrupted by a realtime sync overwriting the value
// mid-keystroke. The actual save is debounced while typing and flushed on
// blur; external updates are only pulled in while the field isn't focused.
function DebouncedField({ as = "input", value, onCommit, delay = 600, ...props }) {
  const [local, setLocal] = useState(value ?? "");
  const focusedRef = useRef(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!focusedRef.current) setLocal(value ?? "");
  }, [value]);

  const flush = (v) => {
    clearTimeout(timerRef.current);
    onCommit(v);
  };

  const handleChange = (e) => {
    const v = e.target.value;
    setLocal(v);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onCommit(v), delay);
  };

  const Tag = as;
  return (
    <Tag
      {...props}
      value={local}
      onChange={handleChange}
      onFocus={() => {
        focusedRef.current = true;
      }}
      onBlur={() => {
        focusedRef.current = false;
        flush(local);
      }}
    />
  );
}

// Same local-draft trick as DebouncedField, but for numbers: keeps whatever
// the user is literally typing (including "" while clearing a 0) instead of
// snapping the field back to 0 on every keystroke before they finish typing.
function NumberField({ value, onCommit, delay = 600, ...props }) {
  const [local, setLocal] = useState(value === null || value === undefined ? "" : String(value));
  const focusedRef = useRef(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!focusedRef.current) setLocal(value === null || value === undefined ? "" : String(value));
  }, [value]);

  const toNumber = (s) => {
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : 0;
  };

  const flush = (s) => {
    clearTimeout(timerRef.current);
    onCommit(toNumber(s));
  };

  const handleChange = (e) => {
    const v = e.target.value;
    setLocal(v);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onCommit(toNumber(v)), delay);
  };

  return (
    <input
      {...props}
      type="number"
      value={local}
      onChange={handleChange}
      onFocus={() => {
        focusedRef.current = true;
      }}
      onBlur={() => {
        focusedRef.current = false;
        flush(local);
      }}
    />
  );
}

function DeleteButton({ onDelete, label = "删除" }) {
  return (
    <button
      className="btn btn-ghost"
      style={{ color: "var(--critical)" }}
      onClick={() => {
        if (window.confirm("确定要删除吗？此操作无法撤销。")) onDelete();
      }}
    >
      <Icon name="trash" size={14} color="var(--critical)" /> {label}
    </button>
  );
}
function SelectCheckbox({ checked }) {
  return (
    <span className={"selectbox" + (checked ? " on" : "")}>
      {checked && <Icon name="check" size={11} color="#fff" />}
    </span>
  );
}
function useMultiSelect() {
  const [selMode, setSelMode] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const toggleMode = () => {
    setSelMode((v) => !v);
    setSelected(new Set());
  };
  const reset = () => {
    setSelMode(false);
    setSelected(new Set());
  };
  return { selMode, selected, toggle, toggleMode, reset };
}
function MultiSelectBar({ me, selMode, count, onToggleMode, onDelete }) {
  if (!me) return null;
  return (
    <div className="filterbar" style={{ marginBottom: 8 }}>
      <button className={"chip" + (selMode ? " on" : "")} onClick={onToggleMode}>
        {selMode ? "取消多选" : "多选删除"}
      </button>
      {selMode && count > 0 && (
        <button className="btn btn-primary" style={{ background: "var(--critical)" }} onClick={onDelete}>
          <Icon name="trash" size={13} /> 删除选中（{count}）
        </button>
      )}
    </div>
  );
}

// "整体进度" isn't a hand-set number — it's how much of this event's tagged
// task list is done, so it moves on its own as tasks get checked off.
function eventTaskProgress(evId, tasks) {
  const related = tasks.filter((t) => (t.tags || []).includes(evId));
  if (!related.length) return 0;
  return Math.round((related.filter((t) => t.status === "done").length / related.length) * 100);
}

/* ============ Tags ============ */
function tagLabel(tag, events) {
  const ev = events.find((e) => e.id === tag);
  return ev ? ev.en : tag;
}
function TagEditor({ tags, onChange, events, suggestions = [] }) {
  const [input, setInput] = useState("");
  const addTag = (t) => {
    const v = (t || "").trim();
    if (!v || tags.includes(v)) return;
    onChange([...tags, v]);
  };
  const removeTag = (t) => onChange(tags.filter((x) => x !== t));
  const pool = [...events.map((e) => e.id), ...suggestions].filter(
    (t, i, arr) => arr.indexOf(t) === i && !tags.includes(t)
  );
  return (
    <div className="field">
      <label>标签</label>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: tags.length ? 8 : 0 }}>
        {tags.map((t) => (
          <button key={t} type="button" className="chip on" onClick={() => removeTag(t)}>
            {tagLabel(t, events)} <Icon name="x" size={10} />
          </button>
        ))}
      </div>
      {pool.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8, marginTop: tags.length ? 0 : 8 }}>
          {pool.map((t) => (
            <button key={t} type="button" className="chip" onClick={() => addTag(t)}>
              <Icon name="plus" size={10} /> {tagLabel(t, events)}
            </button>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入自定义标签，回车添加"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag(input);
              setInput("");
            }
          }}
        />
        <button
          className="btn btn-ghost"
          type="button"
          onClick={() => {
            addTag(input);
            setInput("");
          }}
        >
          添加
        </button>
      </div>
    </div>
  );
}

/* ============ Add item modal (tasks & daily share this) ============ */
/* ============ Generic "fill in everything, then create" modal ============ */
// Used for every other "add" flow (looks, accessories, inventory, vendors,
// run-of-show nodes) so creating something always means filling out the
// whole form up front, not create-a-title-then-edit-later.
// Stored in run_of_show_nodes.time_label as "09:30" or "09:30–10:15" so no
// schema change is needed and old free-text labels still display. Older
// labels ("下午3点到5点") are read back into the pickers via parseTimeLabel.
function minutesToHHMM(m) {
  if (m == null) return "";
  return `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
function splitTimeLabel(label) {
  const parts = String(label || "").split(/\s*(?:-|–|—|~|～|至|到)\s*/);
  const start = parseTimeLabel(parts[0]);
  let end = parts.length > 1 ? parseTimeLabel(parts.slice(1).join(" ")) : null;
  // "下午3点到5点": the end inherits the afternoon from the start.
  if (start != null && end != null && end < start && end + 720 > start) end += 720;
  return { start: minutesToHHMM(start), end: start == null ? "" : minutesToHHMM(end) };
}
// What the timeline shows: the time as the sort order understands it, in
// 12-hour form ("4:00 PM"), so an old hand-typed "4:00" with no am/pm
// visibly reads as 4:00 AM instead of silently sorting before noon.
// Storage stays 24-hour "16:00" — this is display only.
function to12h(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return { text: `${h % 12 || 12}:${String(m).padStart(2, "0")}`, period: h < 12 ? "AM" : "PM" };
}
function formatNodeTime(label) {
  const { start, end } = splitTimeLabel(label);
  if (!start) return label || "";
  const a = to12h(start);
  if (!end) return `${a.text} ${a.period}`;
  const b = to12h(end);
  return a.period === b.period ? `${a.text}–${b.text} ${b.period}` : `${a.text} ${a.period}–${b.text} ${b.period}`;
}
function TimeRangeField({ value, onChange, autoFocus }) {
  const { start, end } = splitTimeLabel(value);
  const legacy = value && !start ? value : null;
  const emit = (s, e) => onChange(s ? (e ? `${s}–${e}` : s) : "");
  return (
    <>
      <div className="time-range">
        <input type="time" aria-label="开始时间" autoFocus={autoFocus} value={start} onChange={(e) => emit(e.target.value, end)} />
        <span className="time-range-sep">至</span>
        <input
          type="time"
          aria-label="结束时间（可选）"
          value={end}
          disabled={!start}
          onChange={(e) => emit(start, e.target.value)}
        />
        {value && (
          <button type="button" className="btn btn-ghost" onClick={() => onChange("")}>
            清除
          </button>
        )}
      </div>
      {legacy && <p className="note" style={{ margin: "4px 0 0" }}>原来写的是「{legacy}」，选一个时间就会替换掉。</p>}
    </>
  );
}

function FormModal({ open, onClose, onCreate, title, fields, initialValues }) {
  const [values, setValues] = useState({});
  useEffect(() => {
    if (open) setValues({ ...initialValues });
  }, [open]);
  if (!open) return null;
  const set = (key, v) => setValues((prev) => ({ ...prev, [key]: v }));
  const submit = (e) => {
    e.preventDefault();
    for (const f of fields) {
      if (f.required && !String(values[f.key] ?? "").trim()) return;
    }
    onCreate(values);
    onClose();
  };
  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="drawer" role="dialog" aria-label={title}>
        <div className="drawer-head">
          <h3>{title}</h3>
          <button className="drawer-close" onClick={onClose} aria-label="关闭">
            <Icon name="x" size={15} />
          </button>
        </div>
        <form className="drawer-body" onSubmit={submit}>
          {fields.map((f) => {
            const v = values[f.key];
            if (f.showIf && !f.showIf(values)) return null;
            if (f.type === "select") {
              return (
                <div className="field" key={f.key}>
                  <label>{f.label}</label>
                  <select value={v ?? ""} onChange={(e) => set(f.key, e.target.value)}>
                    {f.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }
            if (f.type === "textarea") {
              return (
                <div className="field" key={f.key}>
                  <label>{f.label}</label>
                  <textarea rows={f.rows || 3} value={v ?? ""} onChange={(e) => set(f.key, e.target.value)} />
                </div>
              );
            }
            if (f.type === "checkbox") {
              return (
                <div className="field" key={f.key}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                    <input type="checkbox" checked={!!v} onChange={(e) => set(f.key, e.target.checked)} style={{ width: 14, height: 14 }} />
                    {f.label}
                  </label>
                </div>
              );
            }
            if (f.type === "chips") {
              return (
                <div className="field" key={f.key}>
                  <label>{f.label}</label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {f.options.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        className={"chip" + ((v || []).includes(o.value) ? " on" : "")}
                        onClick={() => {
                          const cur = v || [];
                          set(f.key, cur.includes(o.value) ? cur.filter((x) => x !== o.value) : [...cur, o.value]);
                        }}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }
            if (f.type === "number") {
              return (
                <div className="field" key={f.key}>
                  <label>{f.label}</label>
                  <NumberField value={v} onCommit={(n) => set(f.key, n)} autoFocus={f.autoFocus} />
                </div>
              );
            }
            if (f.type === "links") {
              return (
                <div className="field" key={f.key}>
                  <label>{f.label}</label>
                  <LinksEditor links={v || []} onChange={(l) => set(f.key, l)} />
                </div>
              );
            }
            if (f.type === "time") {
              return (
                <div className="field" key={f.key}>
                  <label>{f.label}</label>
                  <TimeRangeField value={v ?? ""} autoFocus={f.autoFocus} onChange={(t) => set(f.key, t)} />
                </div>
              );
            }
            if (f.type === "date") {
              return (
                <div className="field" key={f.key}>
                  <label>{f.label}</label>
                  <input type="date" autoFocus={f.autoFocus} value={v ?? ""} onChange={(e) => set(f.key, e.target.value || null)} />
                </div>
              );
            }
            return (
              <div className="field" key={f.key}>
                <label>{f.label}</label>
                <input autoFocus={f.autoFocus} value={v ?? ""} onChange={(e) => set(f.key, e.target.value)} />
              </div>
            );
          })}
          <button className="btn btn-primary" type="submit" style={{ justifyContent: "center" }}>
            创建
          </button>
        </form>
      </div>
    </>
  );
}

function ImportIcsModal({ open, onClose, events, onImport }) {
  const [checked, setChecked] = useState(() => new Set());
  useEffect(() => {
    if (open) setChecked(new Set(events.map((_, i) => i)));
  }, [open, events]);
  if (!open) return null;
  const toggle = (i) =>
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="drawer" role="dialog" aria-label="从日历文件导入">
        <div className="drawer-head">
          <h3>从日历文件导入</h3>
          <button className="drawer-close" onClick={onClose} aria-label="关闭">
            <Icon name="x" size={15} />
          </button>
        </div>
        <div className="drawer-body">
          {events.length === 0 ? (
            <div className="empty-state">没有在这个文件里找到可识别的日程</div>
          ) : (
            <>
              <p className="note">勾选要导入成待办的日程，取消勾选的不会导入。</p>
              {events.map((ev, i) => (
                <label key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", padding: "8px 0" }}>
                  <input type="checkbox" checked={checked.has(i)} onChange={() => toggle(i)} style={{ width: 16, height: 16, marginTop: 2 }} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{ev.summary}</div>
                    <div className="tmeta">{ev.date || "无日期"}</div>
                  </div>
                </label>
              ))}
              <button
                className="btn btn-primary"
                type="button"
                style={{ justifyContent: "center", marginTop: 8 }}
                onClick={() => {
                  onImport(events.filter((_, i) => checked.has(i)));
                  onClose();
                }}
              >
                导入选中的 {checked.size} 条
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function ImportInventoryModal({ open, onClose, mode, items, wearerLocked, onImport }) {
  const [itemId, setItemId] = useState("");
  const [lookShape, setLookShape] = useState("aline");
  const [category, setCategory] = useState(ACC_CATS[0].id);
  useEffect(() => {
    if (open) {
      setItemId(items[0]?.id || "");
      setLookShape("aline");
      setCategory(ACC_CATS[0].id);
    }
  }, [open]);
  if (!open) return null;
  const submit = (e) => {
    e.preventDefault();
    if (!itemId) return;
    if (mode === "look") onImport(itemId, { wearer: wearerLocked, look_shape: lookShape });
    else onImport(itemId, { wearer: wearerLocked, category });
    onClose();
  };
  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="drawer" role="dialog" aria-label="从物品清单导入">
        <div className="drawer-head">
          <h3>从物品清单导入</h3>
          <button className="drawer-close" onClick={onClose} aria-label="关闭">
            <Icon name="x" size={15} />
          </button>
        </div>
        <form className="drawer-body" onSubmit={submit}>
          {items.length === 0 ? (
            <div className="empty-state">物品清单里没有可导入的物品了（都已关联造型或配饰）</div>
          ) : (
            <>
              <div className="field">
                <label>选择物品</label>
                <select value={itemId} onChange={(e) => setItemId(e.target.value)}>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                      {i.price_usd ? ` · $${Number(i.price_usd).toLocaleString()}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              {mode === "look" ? (
                <div className="field">
                  <label>剪影款式</label>
                  <select value={lookShape} onChange={(e) => setLookShape(e.target.value)}>
                    {LOOK_SHAPES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="field">
                  <label>配饰类别</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    {ACC_CATS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <button className="btn btn-primary" type="submit" style={{ justifyContent: "center" }}>
                导入
              </button>
            </>
          )}
        </form>
      </div>
    </>
  );
}

function AddItemModal({ open, onClose, onCreate, events, tagSuggestions, showAssignee, defaultAssignee, suggestedTag }) {
  const profiles = useProfiles();
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [tags, setTags] = useState([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [notes, setNotes] = useState("");
  const [assignee, setAssignee] = useState(defaultAssignee);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setDeadline("");
    setTags(suggestedTag ? [suggestedTag] : []);
    setIsPrivate(false);
    setNotes("");
    setAssignee(defaultAssignee);
  }, [open, suggestedTag, defaultAssignee]);

  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreate({ title: title.trim(), deadline: deadline || null, tags, isPrivate, notes, assignee });
    onClose();
  };

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="drawer" role="dialog" aria-label="新增">
        <div className="drawer-head">
          <h3>新增</h3>
          <button className="drawer-close" onClick={onClose} aria-label="关闭">
            <Icon name="x" size={15} />
          </button>
        </div>
        <form className="drawer-body" onSubmit={submit}>
          <div className="field">
            <label>标题</label>
            <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          {showAssignee && (
            <div className="field">
              <label>负责人</label>
              <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                {profiles.map((m) => (
                  <option key={m.member_key} value={m.member_key}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="field">
            <label>截止日期（可选）</label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
          <TagEditor tags={tags} onChange={setTags} events={events} suggestions={tagSuggestions} />
          <div className="field">
            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                style={{ width: 14, height: 14 }}
              />
              仅自己可见（私密）
            </label>
          </div>
          <div className="field">
            <label>备注</label>
            <textarea rows="3" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <button className="btn btn-primary" type="submit" style={{ justifyContent: "center" }}>
            创建
          </button>
        </form>
      </div>
    </>
  );
}

/* ============ Drawer ============ */
function Drawer({ selected, onClose, state }) {
  const photoInputRef = useRef();
  const lookPhotoInputRef = useRef();
  const logPhotoInputRef = useRef();
  const [zoomSrc, setZoomSrc] = useState(null);
  const profiles = useProfiles();
  if (!selected) return null;
  const { type, id } = selected;
  // The item behind this drawer can disappear out from under it — most often
  // its own delete button, whose optimistic state update re-renders this
  // drawer before the mutator gets to call closeDrawer(). Render nothing
  // instead of crashing on a missing-item lookup below.
  const collectionByType = {
    dress: state.looks, inventory: state.inventory, task: state.tasks,
    node: state.runOfShowNodes, vendor: state.vendors, daily: state.dailyTasks, event: state.events,
    look: state.savedLooks, tryon: state.tryonResults, logentry: state.weddingLog,
  };
  const coll = collectionByType[type];
  if (coll && !coll.some((x) => x.id === id)) return null;
  let content = null,
    title = "",
    sub = "";
  const tagSuggestionPool = [...new Set([...state.tasks, ...state.dailyTasks].flatMap((x) => x.tags || []))];
  const eventIds = new Set(state.events.map((e) => e.id));
  const dailyTagSuggestionPool = [...new Set(state.dailyTasks.flatMap((x) => x.tags || []))].filter((t) => !eventIds.has(t));

  const onPhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    state.addInventoryPhotos(id, files);
    e.target.value = "";
  };

  // A look/accessory's photos live on its auto-linked 物品清单 row (same
  // inventory_photos table, keyed by that row's id) — they're treated as one
  // and the same thing, so uploading here writes to the linked item, not id.
  const onLookPhotoUpload = (e, linkedInvId) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !linkedInvId) return;
    state.addInventoryPhotos(linkedInvId, files);
    e.target.value = "";
  };

  if (type === "event") {
    const ev = state.events.find((x) => x.id === id);
    title = ev.name;
    sub = ev.en;
    const relTasks = state.tasks.filter((t) => (t.tags || []).includes(id));
    const relInventory = state.inventory.filter((i) => i.occasions.includes(id) || i.occasions.includes("global"));
    const relVendors = state.vendors.filter((v) => v.event_id === id);
    content = (
      <>
        <div className="drawer-cover">
          <Cover type={ev.cover} />
        </div>
        <div className="field">
          <label>名称</label>
          <DebouncedField value={ev.name} onCommit={(v) => state.updateEvent(id, { name: v })} />
        </div>
        <div className="rowfields">
          <div className="field">
            <label>英文 / 简称</label>
            <DebouncedField value={ev.en} onCommit={(v) => state.updateEvent(id, { en: v })} />
          </div>
          <div className="field">
            <label>状态标签</label>
            <DebouncedField value={ev.status_label} onCommit={(v) => state.updateEvent(id, { status_label: v })} />
          </div>
        </div>
        <div className="field">
          <label>日期 / 地点</label>
          <DebouncedField value={ev.date_label} onCommit={(v) => state.updateEvent(id, { date_label: v })} />
        </div>
        <div className="field">
          <label>说明</label>
          <DebouncedField as="textarea" rows="3" value={ev.description} onCommit={(v) => state.updateEvent(id, { description: v })} />
        </div>
        <div className="field">
          <label>证婚人（没有就留空）</label>
          <DebouncedField value={ev.witness_name || ""} onCommit={(v) => state.updateEvent(id, { witness_name: v || null })} />
        </div>
        <div className="field">
          <label>整体进度（按相关待办完成比例自动计算）</label>
          <RingProgress value={eventTaskProgress(id, state.tasks)} size={60} />
        </div>
        <div className="field">
          <label>这场活动相关的内容</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="chip" onClick={() => state.jumpToEventSection("tasks", id)}>
              {relTasks.length} 个待办
            </button>
            <button className="chip" onClick={() => state.jumpToEventSection("inventory", id)}>
              {relInventory.length} 件物品
            </button>
            <button className="chip" onClick={() => state.jumpToEventSection("vendors", id)}>
              {relVendors.length} 个供应商
            </button>
          </div>
        </div>
        <div className="field">
          <label>预算追踪</label>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              className={"chip" + (ev.budget_tracking ? " on" : "")}
              onClick={() => state.toggleBudgetTracking(id)}
            >
              <Icon name={ev.budget_tracking ? "check" : "x"} size={11} />{" "}
              {ev.budget_tracking ? "已开启" : "已关闭"}
            </button>
            <span style={{ fontSize: 11, color: "var(--plum-soft)" }}>点击切换</span>
          </div>
        </div>
        {ev.budget_tracking ? (
          <>
            <div className="rowfields">
              <div className="field">
                <label>预算上限 (USD)</label>
                <NumberField value={ev.budget_allocated} onCommit={(v) => state.updateEvent(id, { budget_allocated: v })} />
              </div>
              <div className="field">
                <label>已确认支出 (USD)</label>
                <NumberField value={ev.budget_confirmed} onCommit={(v) => state.updateEvent(id, { budget_confirmed: v })} />
              </div>
            </div>
            <div className="field">
              <label>预估待支出 (USD)</label>
              <NumberField value={ev.budget_estimated} onCommit={(v) => state.updateEvent(id, { budget_estimated: v })} />
            </div>
          </>
        ) : (
          <p className="note">该活动已关闭预算追踪，不展示任何花费金额与预算条，保持纯粹的仪式感氛围。</p>
        )}
      </>
    );
  }

  if (type === "dress") {
    const d = state.looks.find((x) => x.id === id);
    const linkedInv = state.inventory.find((i) => i.look_id === d.id);
    const lookPhotos = (linkedInv && state.photosByItem[linkedInv.id]) || [];
    title = d.name;
    sub = d.subtitle;
    content = (
      <>
        <div className="drawer-cover">
          {lookPhotos.length > 0 ? (
            <img src={lookPhotos[0].url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <LookSilhouette look={d.look_shape} />
          )}
        </div>
        {linkedInv && (
          <div className="field">
            <label>图片（与物品清单里的联动条目共用）</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {lookPhotos.map((p) => (
                <div key={p.id} style={{ position: "relative", width: 68, height: 68 }}>
                  <img
                    src={p.url}
                    onClick={() => setZoomSrc(p.url)}
                    style={{ width: 68, height: 68, borderRadius: 10, objectFit: "cover", cursor: "pointer", display: "block" }}
                  />
                  <button
                    onClick={() => state.removeInventoryPhoto(p)}
                    aria-label="删除照片"
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -6,
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: "var(--rose-dark)",
                      border: "2px solid var(--cream)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon name="x" size={10} color="#fff" />
                  </button>
                </div>
              ))}
              <button
                className="btn btn-ghost"
                onClick={() => lookPhotoInputRef.current.click()}
                style={{ width: 68, height: 68, borderRadius: 10, justifyContent: "center", padding: 0 }}
              >
                <Icon name="upload" size={18} />
              </button>
              <input
                ref={lookPhotoInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => onLookPhotoUpload(e, linkedInv.id)}
              />
            </div>
          </div>
        )}
        <div className="kv">
          <span className="k">穿着者</span>
          <b style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Avatar id={d.wearer} size={18} />
            {memberOf(profiles, d.wearer)?.name || d.wearer}
          </b>
        </div>
        <div className="field">
          <label>剪影款式</label>
          <select value={d.look_shape} onChange={(e) => state.updateLook(id, { look_shape: e.target.value })}>
            {LOOK_SHAPES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="rowfields">
          <div className="field">
            <label>价格 (USD)</label>
            <NumberField value={d.price} onCommit={(v) => state.updateLook(id, { price: v })} />
          </div>
          <div className="field">
            <label>版型</label>
            <DebouncedField value={d.silhouette} onCommit={(v) => state.updateLook(id, { silhouette: v })} />
          </div>
        </div>
        <div className="rowfields">
          <div className="field">
            <label>面料</label>
            <DebouncedField value={d.fabric} onCommit={(v) => state.updateLook(id, { fabric: v })} />
          </div>
          <div className="field">
            <label>光泽度</label>
            <DebouncedField value={d.sheen} onCommit={(v) => state.updateLook(id, { sheen: v })} />
          </div>
        </div>
        <div className="rowfields">
          <div className="field">
            <label>现货 / 加急周期</label>
            <DebouncedField value={d.availability} onCommit={(v) => state.updateLook(id, { availability: v })} />
          </div>
          <div className="field">
            <label>改衣预估</label>
            <DebouncedField value={d.alteration} onCommit={(v) => state.updateLook(id, { alteration: v })} />
          </div>
        </div>
        <div className="field">
          <label>适用场合</label>
          <div style={{ display: "flex", gap: 8 }}>
            {state.events.map((ev) => (
              <label
                key={ev.id}
                className={"chip" + (d.occasions.includes(ev.id) ? " on" : "")}
                style={{ cursor: "pointer" }}
                onClick={() => state.toggleLookOccasion(id, ev.id)}
              >
                {ev.en}
              </label>
            ))}
          </div>
        </div>
        <div className="field">
          <label>备注 / 沟通记录</label>
          <DebouncedField as="textarea" rows="3" value={d.notes} onCommit={(v) => state.updateLook(id, { notes: v })} />
        </div>
        <div className="field">
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={d.is_private}
              onChange={(e) => state.updateLook(id, { is_private: e.target.checked })}
              style={{ width: 14, height: 14 }}
            />
            仅自己可见（惊喜款，对方暂时看不到，含关联物品清单条目）
          </label>
        </div>
        <div className="kv">
          <span className="k">添加人</span>
          <b style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Avatar id={d.added_by} size={18} />
            {memberOf(profiles, d.added_by)?.name || d.added_by}
          </b>
        </div>
        {state.me && <DeleteButton onDelete={() => state.deleteLookCandidate(id)} label="删除这个造型候选" />}
      </>
    );
  }

  if (type === "inventory") {
    const it = state.inventory.find((x) => x.id === id);
    const meta = STATUS_META[it.status];
    const photos = state.photosByItem[id] || [];
    title = it.name;
    sub = meta.label;
    content = (
      <>
        <div className="field">
          <label>名称</label>
          <DebouncedField value={it.name} onCommit={(v) => state.updateInventory(id, { name: v })} />
        </div>
        <div className="field">
          <label>状态</label>
          <select value={it.status} onChange={(e) => state.updateInventory(id, { status: e.target.value })}>
            {Object.entries(STATUS_META).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>图片</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {photos.map((p) => (
              <div key={p.id} style={{ position: "relative", width: 68, height: 68 }}>
                <img
                  src={p.url}
                  onClick={() => setZoomSrc(p.url)}
                  style={{ width: 68, height: 68, borderRadius: 10, objectFit: "cover", cursor: "pointer", display: "block" }}
                />
                <button
                  onClick={() => state.removeInventoryPhoto(p)}
                  aria-label="删除照片"
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "var(--rose-dark)",
                    border: "2px solid var(--cream)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name="x" size={10} color="#fff" />
                </button>
              </div>
            ))}
            <button
              className="btn btn-ghost"
              onClick={() => photoInputRef.current.click()}
              style={{ width: 68, height: 68, borderRadius: 10, justifyContent: "center", padding: 0 }}
            >
              <Icon name="upload" size={18} />
            </button>
            <input ref={photoInputRef} type="file" accept="image/*" multiple hidden onChange={onPhotoUpload} />
          </div>
        </div>
        <div className="rowfields">
          <div className="field">
            <label>价格 (USD)</label>
            <NumberField value={it.price_usd} onCommit={(v) => state.updateInventory(id, { price_usd: v })} />
          </div>
          <div className="field">
            <label>价格 (CNY · 汇率 {RATE})</label>
            <NumberField
              value={Math.round(it.price_usd * RATE)}
              onCommit={(v) => state.updateInventory(id, { price_usd: v / RATE })}
            />
          </div>
        </div>
        <div className="field">
          <label>购买渠道</label>
          <DebouncedField value={it.channel} onCommit={(v) => state.updateInventory(id, { channel: v })} />
        </div>
        <div className="field">
          <label>购买链接（可以加多个）</label>
          <LinksEditor links={it.links || []} onChange={(links) => state.updateInventory(id, { links })} />
        </div>
        <div className="field">
          <label>跨场合复用计划</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {state.events.concat([{ id: "global", en: "All" }]).map((ev) => (
              <label
                key={ev.id}
                className={"chip" + (it.occasions.includes(ev.id) ? " on" : "")}
                style={{ cursor: "pointer" }}
                onClick={() => state.toggleInvOccasion(id, ev.id)}
              >
                {ev.en}
              </label>
            ))}
          </div>
        </div>
        <div className="field">
          <label>备注</label>
          <DebouncedField as="textarea" rows="3" value={it.notes} onCommit={(v) => state.updateInventory(id, { notes: v })} />
        </div>
        <div className="field">
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={it.is_private}
              onChange={(e) => state.updateInventory(id, { is_private: e.target.checked })}
              style={{ width: 14, height: 14 }}
            />
            仅自己可见（惊喜款，对方暂时看不到）
          </label>
        </div>
        {it.status !== "purchased" && it.status !== "shipping" && (
          <p className="note">提示：该物品还没付款（不是「运送中」或「已到手」），因此不计入已确认支出预算。</p>
        )}
        {state.me && it.status === "to_buy" && (
          <button
            className="btn btn-ghost"
            onClick={async () => {
              await state.importInventoryAsTask(id);
              state.jumpToEventSection("tasks", it.occasions?.[0] || "all");
            }}
          >
            <Icon name="upload" size={13} /> 导入为待办
          </button>
        )}
        {state.me && <DeleteButton onDelete={() => state.deleteInventoryItem(id)} />}
      </>
    );
  }

  if (type === "task") {
    const t = state.tasks.find((x) => x.id === id);
    title = t.title;
    sub = (t.tags || []).map((tag) => tagLabel(tag, state.events)).join(" · ") || "无标签";
    content = (
      <>
        <div className="field">
          <label>标题</label>
          <DebouncedField value={t.title} onCommit={(v) => state.updateTask(id, { title: v })} />
        </div>
        <div className="rowfields">
          <div className="field">
            <label>负责人</label>
            <select value={t.assignee} onChange={(e) => state.updateTask(id, { assignee: e.target.value })}>
              {profiles.map((m) => (
                <option key={m.member_key} value={m.member_key}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>状态</label>
            <select value={t.status} onChange={(e) => state.updateTask(id, { status: e.target.value })}>
              {Object.entries(TASK_STATUS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="field">
          <label>截止日期（可选）</label>
          <input
            type="date"
            value={t.deadline || ""}
            onChange={(e) => state.updateTask(id, { deadline: e.target.value || null })}
          />
        </div>
        <TagEditor
          tags={t.tags || []}
          onChange={(tags) => state.updateTask(id, { tags })}
          events={state.events}
          suggestions={tagSuggestionPool}
        />
        <div className="field">
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={t.is_private}
              onChange={(e) => state.updateTask(id, { is_private: e.target.checked })}
              style={{ width: 14, height: 14 }}
            />
            仅自己可见（私密任务）
          </label>
        </div>
        <div className="field">
          <label>备注</label>
          <DebouncedField as="textarea" rows="4" value={t.notes} onCommit={(v) => state.updateTask(id, { notes: v })} />
        </div>
        {state.me && <DeleteButton onDelete={() => state.deleteTask(id)} />}
      </>
    );
  }

  if (type === "node") {
    const n = state.runOfShowNodes.find((x) => x.id === id);
    title = n.title;
    sub = formatNodeTime(n.time_label);
    content = (
      <>
        <div className="field">
          <label>日期（可选）</label>
          <input type="date" value={n.node_date || ""} onChange={(e) => state.updateNode(id, { node_date: e.target.value || null })} />
        </div>
        <div className="field">
          <label>时间（结束时间可不填）</label>
          <TimeRangeField value={n.time_label} onChange={(v) => state.updateNode(id, { time_label: v })} />
        </div>
        <div className="field">
          <label>标题</label>
          <DebouncedField value={n.title} onCommit={(v) => state.updateNode(id, { title: v })} />
        </div>
        <div className="field">
          <label>地点</label>
          <DebouncedField value={n.location} onCommit={(v) => state.updateNode(id, { location: v })} />
        </div>
        <div className="field">
          <label>执行细节 / 注意事项</label>
          <DebouncedField as="textarea" rows="3" value={n.notes} onCommit={(v) => state.updateNode(id, { notes: v })} />
        </div>
        {state.me && <DeleteButton onDelete={() => state.deleteNode(id)} label="删除这个环节" />}
      </>
    );
  }

  if (type === "vendor") {
    const v = state.vendors.find((x) => x.id === id);
    title = v.name;
    sub = v.category;
    content = (
      <>
        <div className="rowfields">
          <div className="field">
            <label>名称</label>
            <DebouncedField value={v.name} onCommit={(val) => state.updateVendor(id, { name: val })} />
          </div>
          <div className="field">
            <label>类别</label>
            <DebouncedField value={v.category} onCommit={(val) => state.updateVendor(id, { category: val })} />
          </div>
        </div>
        <div className="rowfields">
          <div className="field">
            <label>报价 (USD)</label>
            <NumberField value={v.quote} onCommit={(val) => state.updateVendor(id, { quote: val })} />
          </div>
          <div className="field">
            <label>回复截止日期</label>
            <DebouncedField value={v.deadline || ""} onCommit={(val) => state.updateVendor(id, { deadline: val })} />
          </div>
        </div>
        <div className="field">
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={v.is_rush}
              onChange={(e) => state.updateVendor(id, { is_rush: e.target.checked })}
              style={{ width: 14, height: 14 }}
            />
            加急
          </label>
        </div>
        <div className="field">
          <label>所属活动</label>
          <select value={v.event_id || "global"} onChange={(e) => state.updateVendor(id, { event_id: e.target.value === "global" ? null : e.target.value })}>
            <option value="global">全局</option>
            {state.events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name}
              </option>
            ))}
          </select>
        </div>
        <div className="rowfields">
          <div className="field">
            <label>联系人</label>
            <DebouncedField value={v.contact} onCommit={(val) => state.updateVendor(id, { contact: val })} />
          </div>
          <div className="field">
            <label>电话</label>
            <DebouncedField value={v.phone} onCommit={(val) => state.updateVendor(id, { phone: val })} />
          </div>
        </div>
        <div className="field">
          <label>邮箱</label>
          <DebouncedField value={v.email} onCommit={(val) => state.updateVendor(id, { email: val })} />
        </div>
        <div className="field">
          <label>沟通摘要</label>
          <DebouncedField as="textarea" rows="3" value={v.log} onCommit={(val) => state.updateVendor(id, { log: val })} />
        </div>
        <div className="field">
          <label>下一步行动</label>
          <DebouncedField as="textarea" rows="2" value={v.next_step} onCommit={(val) => state.updateVendor(id, { next_step: val })} />
        </div>
        {state.me && <DeleteButton onDelete={() => state.deleteVendor(id)} />}
      </>
    );
  }

  if (type === "look") {
    const look = state.savedLooks.find((x) => x.id === id);
    title = look.name;
    sub = "造型卡";
    const dress = state.looks.find((d) => d.id === look.look_id);
    content = (
      <>
        <div className="drawer-cover">
          <LookSilhouette look={dress?.look_shape || "aline"} />
        </div>
        <div className="kv">
          <span className="k">主造型</span>
          <b>{dress?.name || "—"}</b>
        </div>
        <div className="field">
          <label>配饰组合</label>
          <div className="looklist">
            {look.accessory_ids.length === 0 && <div className="empty">无配饰</div>}
            {look.accessory_ids.map((aid) => {
              const a = state.accessories.find((x) => x.id === aid);
              return (
                <div key={aid} className="li">
                  <span>{a?.name}</span>
                  <span className="tabular">${a?.price}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="kv">
          <span className="k">适用场合</span>
          <b>{look.occasion ? state.events.find((e) => e.id === look.occasion)?.en : "未指定"}</b>
        </div>
        {state.me && <DeleteButton onDelete={() => state.deleteSavedLook(id)} label="删除这张造型卡" />}
      </>
    );
  }

  if (type === "tryon") {
    const r = state.tryonResults.find((x) => x.id === id);
    title = "试穿效果";
    sub = new Date(r.created_at).toLocaleString("zh-CN", { hour12: false });
    content = (
      <>
        <div className="tryon-result">
          <Icon name="sparkle" size={46} color="var(--gold)" />
        </div>
        <p style={{ fontSize: 13 }}>
          造型：{r.look_name} · 配饰：{(r.accessory_names || []).join("、") || "无"}
        </p>
        <p className="note">
          这是模拟效果图占位展示。接入真实 Virtual Try-On API Key 后，此处将替换为基于上传照片生成的真实试穿效果图。
        </p>
      </>
    );
  }

  if (type === "daily") {
    const d = state.dailyTasks.find((x) => x.id === id);
    title = d.title;
    sub = d.deadline || "无截止日期";
    content = (
      <>
        <div className="field">
          <label>标题</label>
          <DebouncedField value={d.title} onCommit={(val) => state.updateDailyTask(id, { title: val })} />
        </div>
        <div className="rowfields">
          <div className="field">
            <label>负责人</label>
            <select value={d.assignee} onChange={(e) => state.updateDailyTask(id, { assignee: e.target.value })}>
              {profiles.map((m) => (
                <option key={m.member_key} value={m.member_key}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>状态</label>
            <select value={d.status} onChange={(e) => state.updateDailyTask(id, { status: e.target.value })}>
              {Object.entries(TASK_STATUS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="field">
          <label>截止日期</label>
          <input type="date" value={d.deadline || ""} onChange={(e) => state.updateDailyTask(id, { deadline: e.target.value || null })} />
        </div>
        <TagEditor
          tags={d.tags || []}
          onChange={(tags) => state.updateDailyTask(id, { tags })}
          events={[]}
          suggestions={dailyTagSuggestionPool}
        />
        <div className="field">
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={d.is_private}
              onChange={(e) => state.updateDailyTask(id, { is_private: e.target.checked })}
              style={{ width: 14, height: 14 }}
            />
            仅自己可见（私密）
          </label>
        </div>
        <div className="field">
          <label>备注</label>
          <DebouncedField as="textarea" rows="3" value={d.notes} onCommit={(val) => state.updateDailyTask(id, { notes: val })} />
        </div>
        {state.me && <DeleteButton onDelete={() => state.deleteDailyTask(id)} />}
      </>
    );
  }

  if (type === "logentry") {
    const l = state.weddingLog.find((x) => x.id === id);
    title = memberOf(profiles, l.owner)?.name || l.owner;
    sub = formatLogStamp(l.created_at, l.tz_offset_min);
    const wc = getWallClock(l.created_at, l.tz_offset_min);
    const pad2 = (n) => String(n).padStart(2, "0");
    content = (
      <>
        <div className="field">
          <label>内容</label>
          <DebouncedField as="textarea" rows="3" value={l.content} onCommit={(val) => state.updateLogEntry(id, { content: val })} />
        </div>
        <div className="rowfields">
          <div className="field">
            <label>日期</label>
            <input
              type="date"
              value={`${wc.y}-${pad2(wc.mo + 1)}-${pad2(wc.d)}`}
              onChange={(e) => {
                const [y, mo, d] = e.target.value.split("-").map(Number);
                const newIso = wallClockToUTC(y, mo - 1, d, wc.h, wc.mi, l.tz_offset_min);
                state.updateLogEntry(id, { created_at: newIso, log_date: e.target.value });
              }}
            />
          </div>
          <div className="field">
            <label>时间</label>
            <input
              type="time"
              value={`${pad2(wc.h)}:${pad2(wc.mi)}`}
              onChange={(e) => {
                const [hh, mm] = e.target.value.split(":").map(Number);
                const newIso = wallClockToUTC(wc.y, wc.mo, wc.d, hh, mm, l.tz_offset_min);
                state.updateLogEntry(id, { created_at: newIso });
              }}
            />
          </div>
        </div>
        <div className="field">
          <label>时区（改时区会保留显示的日期时间，只是换一种读法）</label>
          <select
            value={l.tz_offset_min}
            onChange={(e) => {
              const newOffset = Number(e.target.value);
              const newIso = wallClockToUTC(wc.y, wc.mo, wc.d, wc.h, wc.mi, newOffset);
              state.updateLogEntry(id, { created_at: newIso, tz_offset_min: newOffset });
            }}
          >
            {tzSelectOptions(l.tz_offset_min).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>图片（最多一张，不会显示在列表里）</label>
          {l.photo_url ? (
            <div style={{ position: "relative", width: 110, height: 110 }}>
              <img
                src={l.photo_url}
                onClick={() => setZoomSrc(l.photo_url)}
                style={{ width: 110, height: 110, borderRadius: 12, objectFit: "cover", cursor: "pointer", display: "block" }}
              />
              <button
                onClick={() => state.removeLogPhoto(id)}
                aria-label="删除图片"
                style={{
                  position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: "50%",
                  background: "var(--rose-dark)", border: "2px solid var(--cream)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <Icon name="x" size={11} color="#fff" />
              </button>
            </div>
          ) : (
            <>
              <button
                className="btn btn-ghost"
                onClick={() => logPhotoInputRef.current.click()}
                style={{ width: 110, height: 110, borderRadius: 12, justifyContent: "center", padding: 0 }}
              >
                <Icon name="upload" size={18} />
              </button>
              <input
                ref={logPhotoInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) state.setLogPhoto(id, file);
                  e.target.value = "";
                }}
              />
            </>
          )}
        </div>
        <div className="field">
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={l.is_private}
              onChange={(e) => state.updateLogEntry(id, { is_private: e.target.checked })}
              style={{ width: 14, height: 14 }}
            />
            仅自己可见（私密）
          </label>
        </div>
        {state.me && <DeleteButton onDelete={() => state.deleteLogEntry(id)} label="删除这条日志" />}
      </>
    );
  }

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="drawer" role="dialog" aria-label={title}>
        <div className="drawer-head">
          <div>
            <h3>{title}</h3>
            {sub && <div className="sub">{sub}</div>}
          </div>
          <button className="drawer-close" onClick={onClose} aria-label="关闭">
            <Icon name="x" size={15} />
          </button>
        </div>
        <div className="drawer-body">{content}</div>
      </div>
      {zoomSrc && (
        <div
          className="overlay"
          style={{ zIndex: 95, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={() => setZoomSrc(null)}
        >
          <img src={zoomSrc} style={{ maxWidth: "100%", maxHeight: "88vh", borderRadius: 14, boxShadow: "0 20px 60px rgba(74,43,51,.4)" }} />
        </div>
      )}
    </>
  );
}

/* ============ Activity feed ============ */
function timeAgo(iso) {
  const sec = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (sec < 60) return "刚刚";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  return `${Math.round(hr / 24)} 天前`;
}
function ActivityPanel({ open, onClose, log }) {
  const profiles = useProfiles();
  if (!open) return null;
  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="drawer" role="dialog" aria-label="最近动态">
        <div className="drawer-head">
          <h3>最近动态</h3>
          <button className="drawer-close" onClick={onClose} aria-label="关闭">
            <Icon name="x" size={15} />
          </button>
        </div>
        <div className="drawer-body">
          {log.length === 0 && <div className="empty-state">还没有动态</div>}
          {log.map((a) => {
            const m = memberOf(profiles, a.actor);
            return (
              <div key={a.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <Avatar id={a.actor} size={26} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, lineHeight: 1.5 }}>
                    <b>{m?.name || a.actor}</b> {a.summary}
                  </p>
                  <span className="tmeta">{timeAgo(a.created_at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function ChatPanel({ open, onClose, messages, me, onSend, onDelete, onMarkRead }) {
  const profiles = useProfiles();
  const [draft, setDraft] = useState("");
  const bodyRef = useRef(null);
  useEffect(() => {
    if (open && bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [open, messages.length]);
  // Marks read on open, and again whenever new messages arrive while it's
  // already open — not just once, so a reply that comes in mid-read still
  // clears the badge instead of leaving a stale unread count.
  useEffect(() => {
    if (open) onMarkRead?.();
  }, [open, messages.length]);
  if (!open) return null;
  const submit = (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    onSend(draft);
    setDraft("");
  };
  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="drawer" role="dialog" aria-label="留言">
        <div className="drawer-head">
          <h3>留言</h3>
          <button className="drawer-close" onClick={onClose} aria-label="关闭">
            <Icon name="x" size={15} />
          </button>
        </div>
        <div className="drawer-body" ref={bodyRef}>
          {messages.length === 0 && <div className="empty-state">还没有留言，写点什么给对方吧</div>}
          {messages.map((m) => {
            const mine = m.sender === me?.member_key;
            const p = memberOf(profiles, m.sender);
            return (
              <div
                key={m.id}
                style={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start", gap: 4 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexDirection: mine ? "row-reverse" : "row" }}>
                  <Avatar id={m.sender} size={20} />
                  <span className="tmeta">
                    {p?.name || m.sender} · {timeAgo(m.created_at)}
                  </span>
                </div>
                <div
                  style={{
                    maxWidth: "80%",
                    padding: "9px 13px",
                    borderRadius: 14,
                    fontSize: 13.5,
                    lineHeight: 1.5,
                    background: mine ? "var(--rose-deep)" : "var(--blush-deep)",
                    color: mine ? "#fff" : "var(--plum)",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    cursor: mine ? "pointer" : "default",
                  }}
                  title={mine ? "点击删除这条留言" : ""}
                  onClick={() => mine && onDelete(m.id)}
                >
                  {m.body}
                </div>
              </div>
            );
          })}
        </div>
        <form onSubmit={submit} style={{ display: "flex", gap: 8, padding: "14px 20px", borderTop: "1px solid var(--line)" }}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={() => {
              if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
            }}
            placeholder="写点什么留给对方…"
            style={{ flex: 1 }}
            autoFocus
          />
          <button className="btn btn-primary" type="submit" aria-label="发送">
            <Icon name="send" size={14} />
          </button>
        </form>
      </div>
    </>
  );
}

/* ============ Topbar ============ */
function Topbar({ tab, setTab, me, onSignOut, onToggleActivity, onToggleChat, hasUnreadMessages }) {
  const tabs = [
    ["overview", "总览"],
    ["tasks", "待办"],
    ["inventory", "物品清单"],
    ["lookbook", "造型"],
    ["runofshow", "当天流程"],
    ["vendors", "供应商 & 预算"],
    ["daily", "Daily"],
    ["log", "日志"],
  ];
  const tabButtons = tabs.map(([k, label]) => (
    <button key={k} className={"tab" + (tab === k ? " active" : "")} onClick={() => setTab(k)}>
      {label}
    </button>
  ));
  return (
    <div className="topbar">
      <div className="wrap topbar-inner">
        <div
          className="brandmark"
          role="button"
          tabIndex={0}
          style={{ cursor: "pointer" }}
          onClick={() => setTab("overview")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setTab("overview");
          }}
        >
          <div className="mono serif">H·C</div>
          <div className="brand-text">
            <span className="name">H.S. &amp; C.H.</span>
            <span className="sub">Wedding Workbook</span>
          </div>
        </div>
        <div className="navtabs">{tabButtons}</div>
        {me && (
          <button className="chip" onClick={onToggleChat} title="留言" style={{ position: "relative" }}>
            <Icon name="chat" size={12} /> 留言
            {hasUnreadMessages && <span className="unread-dot" />}
          </button>
        )}
        <button className="chip" onClick={onToggleActivity} title="最近动态">
          <Icon name="bell" size={12} /> 动态
        </button>
        <button
          className="chip"
          title="订阅到手机日历，会自动同步 + deadline前自动提醒"
          onClick={() => {
            // webcal:// (not https://) is what tells the OS "subscribe and
            // keep syncing this", instead of just importing a one-time
            // snapshot of today's events. Needs window, so this can't be a
            // static href computed during SSR.
            window.location.href = `webcal://${window.location.host}/api/calendar`;
          }}
        >
          <Icon name="calendar" size={12} /> 订阅日历
        </button>
        <div className="identity">
          {me ? (
            <>
              <button className="avatarbtn" style={{ background: me.bg_color, color: me.text_color }} title={me.name}>
                {me.name.slice(0, 1)}
              </button>
              <button className="signout-btn" onClick={onSignOut}>
                退出登录
              </button>
            </>
          ) : (
            <a href="/login" className="btn btn-primary" style={{ textDecoration: "none" }}>
              登录
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============ Overview page ============ */
function Overview({ state, setTab, setInvFilter, goToRunOfShow }) {
  const invCounts = useMemo(() => {
    const c = { pending: 0, to_buy: 0, shipping: 0, purchased: 0 };
    state.inventory.forEach((i) => c[i.status]++);
    return c;
  }, [state.inventory]);
  const trackedEvents = state.events.filter((ev) => ev.budget_tracking);
  const totalConfirmed = trackedEvents.reduce((s, ev) => s + Number(ev.budget_confirmed), 0);
  const totalEstimated = trackedEvents.reduce((s, ev) => s + Number(ev.budget_estimated), 0);
  const totalAllocated = trackedEvents.reduce((s, ev) => s + Number(ev.budget_allocated), 0);
  const reserve = Math.max(totalAllocated - totalConfirmed - totalEstimated, 0);
  const donutTotal = totalConfirmed + totalEstimated + reserve || 1;
  const segs = [
    { v: totalConfirmed, color: "var(--good)", label: "已确认支出" },
    { v: totalEstimated, color: "var(--pending)", label: "预估待支出" },
    { v: reserve, color: "var(--reserve)", label: "预留余量" },
  ];
  let acc = 0;
  const R = 52,
    C = 2 * Math.PI * R;

  return (
    <div className="wrap">
      <div className="hero">
        <div className="eyebrow">Wedding Workbook</div>
        <h1 className="serif">H.S. &amp; C.H.</h1>
        <p className="tagline">You are my end and my beginning</p>
        <div className="divider">
          <span className="ln" />
          <Icon name="flower" size={16} color="var(--gold)" />
          <span className="ln r" />
        </div>
      </div>

      <div className="section">
        <div className="grid g3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
          {state.events.map((ev, i) => (
            <div
              key={ev.id}
              className="card"
              role="button"
              tabIndex={0}
              onClick={() => state.openDrawer("event", ev.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") state.openDrawer("event", ev.id);
              }}
            >
              <div className="card-cover">
                <Cover type={ev.cover} />
                <span className={"corner-badge badge " + ev.status}>{ev.status_label}</span>
                <span className="corner-ring">
                  <RingProgress value={eventTaskProgress(ev.id, state.tasks)} size={44} />
                </span>
              </div>
              <div className="card-body">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div>
                    <div className="card-title">{ev.name}</div>
                    <div className="card-sub">
                      {ev.en} · {ev.date_label}
                    </div>
                  </div>
                  {state.me && (
                    <div style={{ display: "flex", gap: 4, flex: "none" }}>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: "4px 8px" }}
                        disabled={i === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          state.reorderEvent(ev.id, -1);
                        }}
                        aria-label="往前移"
                      >
                        ‹
                      </button>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: "4px 8px" }}
                        disabled={i === state.events.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          state.reorderEvent(ev.id, 1);
                        }}
                        aria-label="往后移"
                      >
                        ›
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <h2>婚礼当天流程</h2>
          <span className="meta">点击进入完整时间轴</span>
        </div>
        <div className="grid g3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
          {state.events.map((ev) => {
            const nodes = state.nodesByEvent[ev.id] || [];
            const first = nodes[0];
            return (
              <button key={ev.id} className="card" style={{ cursor: "pointer" }} onClick={() => goToRunOfShow(ev.id)}>
                <div className="card-body" style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: "var(--rose-deep)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flex: "none",
                      }}
                    >
                      <Icon name="pin" size={14} color="#fff" />
                    </span>
                    <div className="card-title">{ev.name}</div>
                  </div>
                  <div className="card-sub tabular">
                    {first ? `${formatNodeTime(first.time_label) || "时间待定"} · ${first.title}` : "日程待添加"}
                    {ev.status === "tbd" ? "（草稿）" : ""}
                  </div>
                  <div className="card-sub">共 {nodes.length} 个环节</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <h2>预算概览</h2>
          <span className="meta">
            {trackedEvents.length < state.events.length
              ? `不含已关闭预算追踪的 ${state.events.length - trackedEvents.length} 场活动 · 点击数字跳转筛选`
              : "点击数字跳转筛选"}
          </span>
        </div>
        <div className="grid g3" style={{ alignItems: "start", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
          <div className="card" style={{ cursor: "default", padding: 18 }}>
            <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
              <svg width="118" height="118" viewBox="0 0 118 118">
                {segs.map((s, i) => {
                  const frac = s.v / donutTotal,
                    len = C * frac,
                    gap = 2;
                  const dash = `${Math.max(len - gap, 0)} ${C - len + gap}`;
                  const offset = C * (1 - acc);
                  acc += frac;
                  return (
                    <circle
                      key={i}
                      cx="59"
                      cy="59"
                      r={R}
                      fill="none"
                      stroke={s.color}
                      strokeWidth="14"
                      strokeDasharray={dash}
                      strokeDashoffset={offset}
                      transform="rotate(-90 59 59)"
                      strokeLinecap="round"
                    />
                  );
                })}
                <text x="59" y="55" textAnchor="middle" fontSize="11" fill="var(--plum-soft)" fontFamily="Inter">
                  总预算
                </text>
                <text x="59" y="72" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--plum)" fontFamily="Inter" className="tabular">
                  ${(totalAllocated / 1000).toFixed(1)}k
                </text>
              </svg>
              <div className="legend" style={{ flexDirection: "column", gap: 8, margin: 0 }}>
                {segs.map((s, i) => (
                  <span key={i} className="lg">
                    <span className="sw" style={{ background: s.color }} />
                    {s.label}
                    <b className="tabular" style={{ color: "var(--plum)" }}>
                      ${s.v.toLocaleString()}
                    </b>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="grid g4" style={{ gridColumn: "span 2", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            {Object.entries(invCounts).map(([k, v]) => (
              <button
                key={k}
                className="stattile"
                onClick={() => {
                  setInvFilter(k);
                  setTab("inventory");
                }}
              >
                <span className="sticon" style={{ background: STATUS_META[k].color + "22" }}>
                  <Icon name={STATUS_ICON[k]} size={18} color={STATUS_META[k].color} />
                </span>
                <div>
                  <div className="num tabular">{v}</div>
                  <div className="lbl">{STATUS_META[k].label}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ Lookbook page ============ */
function Lookbook({ state }) {
  const [builderDress, setBuilderDress] = useState(state.looks[0]?.id);
  const builderWearer = state.looks.find((d) => d.id === builderDress)?.wearer;
  const builderCats = ACC_CATS.filter((c) => state.accessories.some((a) => a.category === c.id && a.wearer === builderWearer));
  const [activeCat, setActiveCat] = useState(builderCats[0]?.id);
  useEffect(() => {
    if (!builderCats.find((c) => c.id === activeCat)) setActiveCat(builderCats[0]?.id);
  }, [builderWearer]);
  useEffect(() => {
    if (!state.looks.find((d) => d.id === builderDress)) setBuilderDress(state.looks[0]?.id);
  }, [state.looks]);
  const [builderAcc, setBuilderAcc] = useState([]);
  const [lookOcc, setLookOcc] = useState(state.events[0]?.id);

  const [photo, setPhoto] = useState(null);
  const [tryonDress, setTryonDress] = useState(state.looks[0]?.id);
  const tryonWearer = state.looks.find((d) => d.id === tryonDress)?.wearer;
  const [tryonAcc, setTryonAcc] = useState([]);
  const [generating, setGenerating] = useState(false);
  const fileRef = useRef();
  useEffect(() => {
    if (!state.looks.find((d) => d.id === tryonDress)) setTryonDress(state.looks[0]?.id);
  }, [state.looks]);

  const [addLookOpenFor, setAddLookOpenFor] = useState(null);
  const [addAccOpen, setAddAccOpen] = useState(false);
  const [importLookOpenFor, setImportLookOpenFor] = useState(null);
  const [importAccOpen, setImportAccOpen] = useState(false);
  const unlinkedInventory = state.inventory.filter((i) => !i.look_id && !i.accessory_id);
  const lookSel = useMultiSelect();
  const [priceRevealed, setPriceRevealed] = useState(() => new Set());
  const toggleLookPriceReveal = (id, e) => {
    e.stopPropagation();
    setPriceRevealed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const bulkDeleteLooks = async () => {
    if (lookSel.selected.size === 0) return;
    if (!window.confirm(`确定删除选中的 ${lookSel.selected.size} 个造型候选吗？`)) return;
    for (const id of lookSel.selected) await state.deleteLookCandidate(id);
    lookSel.reset();
  };

  const toggleBuilderAcc = (aid) => setBuilderAcc((prev) => (prev.includes(aid) ? prev.filter((x) => x !== aid) : [...prev, aid]));
  const toggleTryonAcc = (aid) => setTryonAcc((prev) => (prev.includes(aid) ? prev.filter((x) => x !== aid) : [...prev, aid]));

  const saveLook = () => {
    state.createSavedLook({ lookId: builderDress, accessoryIds: builderAcc, occasion: lookOcc });
    setBuilderAcc([]);
  };

  const onPhoto = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target.result);
    try {
      reader.readAsDataURL(f);
    } catch (err) {}
  };

  const generate = () => {
    const dress = state.looks.find((d) => d.id === tryonDress);
    if (!dress) return;
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      state.addTryon({
        lookName: dress.name,
        accessoryNames: tryonAcc.map((a) => state.accessories.find((x) => x.id === a)?.name).filter(Boolean),
      });
    }, 1200);
  };

  const renderLookZone = (wearerKey, zoneLabel) => {
    const zoneLooks = state.looks.filter((d) => d.wearer === wearerKey);
    return (
      <div key={wearerKey} style={{ marginBottom: 24 }}>
        <div className="section-head">
          <h2 style={{ fontSize: 18 }}>{zoneLabel}</h2>
        </div>
        {state.me && (
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={() => setAddLookOpenFor(wearerKey)}>
              <Icon name="plus" size={13} /> 添加造型
            </button>
            <button className="btn btn-ghost" onClick={() => setImportLookOpenFor(wearerKey)}>
              <Icon name="upload" size={13} /> 从物品清单导入
            </button>
          </div>
        )}
        {zoneLooks.length === 0 ? (
          <div className="empty-state">还没有造型候选，用上面的框添加一个</div>
        ) : (
          <div className="grid g3">
            {zoneLooks.map((d) => {
              const linkedInv = state.inventory.find((i) => i.look_id === d.id);
              const lookPhotos = (linkedInv && state.photosByItem[linkedInv.id]) || [];
              return (
              <div
                key={d.id}
                className="card"
                role="button"
                tabIndex={0}
                onClick={() => (lookSel.selMode ? lookSel.toggle(d.id) : state.openDrawer("dress", d.id))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") (lookSel.selMode ? lookSel.toggle(d.id) : state.openDrawer("dress", d.id));
                }}
              >
                <div className="card-cover">
                  {lookPhotos.length > 0 ? (
                    <img
                      src={lookPhotos[0].url}
                      style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
                    />
                  ) : (
                    <LookSilhouette look={d.look_shape} />
                  )}
                  {lookSel.selMode && (
                    <span className="corner-ring">
                      <SelectCheckbox checked={lookSel.selected.has(d.id)} />
                    </span>
                  )}
                  {d.is_private && (
                    <span
                      className="sel-check"
                      style={{ top: 10, left: 10, right: "auto", background: "var(--plum)" }}
                      title="仅自己可见"
                    >
                      <Icon name="lock" size={12} color="#fff" />
                    </span>
                  )}
                  <OccChips occasions={d.occasions} />
                  <span
                    className="price-tag"
                    role="button"
                    tabIndex={0}
                    onClick={(e) => toggleLookPriceReveal(d.id, e)}
                    style={{ display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer" }}
                  >
                    <Icon name={priceRevealed.has(d.id) ? "eye" : "eye-off"} size={12} />
                    {priceRevealed.has(d.id) && <span className="tabular">${Number(d.price).toLocaleString()}</span>}
                  </span>
                </div>
                <div className="card-body">
                  <div className="card-title">{d.name}</div>
                  <div className="card-sub">
                    {d.subtitle} · {d.availability}
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="wrap">
      <div className="section">
        <div className="section-head">
          <h2>造型候选</h2>
          <span className="meta">点击卡片查看版型 / 面料 / 周期详情</span>
        </div>
        <MultiSelectBar me={state.me} selMode={lookSel.selMode} count={lookSel.selected.size} onToggleMode={lookSel.toggleMode} onDelete={bulkDeleteLooks} />
        {renderLookZone("ch", "她的造型")}
        {renderLookZone("hs", "他的造型")}
      </div>

      <div className="section">
        <div className="section-head">
          <h2>配饰搭配板</h2>
          <span className="meta">点选配饰，组合成造型卡</span>
        </div>
        <div className="grid g3" style={{ alignItems: "start", gridTemplateColumns: "2fr 1fr" }}>
          <div>
            <div className="catchips">
              {builderCats.map((c) => (
                <button key={c.id} className={"chip" + (activeCat === c.id ? " on" : "")} onClick={() => setActiveCat(c.id)}>
                  {c.name}
                </button>
              ))}
            </div>
            {state.me && (
              <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                <button className="btn btn-primary" onClick={() => setAddAccOpen(true)}>
                  <Icon name="plus" size={13} /> 添加配饰
                </button>
                <button className="btn btn-ghost" onClick={() => setImportAccOpen(true)}>
                  <Icon name="upload" size={13} /> 从物品清单导入
                </button>
              </div>
            )}
            <div className="acc-grid">
              {state.accessories
                .filter((a) => a.category === activeCat && a.wearer === builderWearer)
                .map((a) => {
                  const linkedInv = state.inventory.find((i) => i.accessory_id === a.id);
                  const accPhotos = (linkedInv && state.photosByItem[linkedInv.id]) || [];
                  return (
                  <div key={a.id} style={{ position: "relative" }}>
                    <button className={"acc-card" + (builderAcc.includes(a.id) ? " sel" : "")} onClick={() => toggleBuilderAcc(a.id)}>
                      {builderAcc.includes(a.id) && (
                        <span className="sel-check">
                          <Icon name="check" size={12} color="#fff" />
                        </span>
                      )}
                      <div className="acc-cover">
                        {accPhotos.length > 0 ? (
                          <img src={accPhotos[0].url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <AccIllustration cat={a.category} />
                        )}
                      </div>
                      <div className="acc-info">
                        <div className="nm">{a.name}</div>
                        <div className="pr tabular">${a.price}</div>
                      </div>
                    </button>
                    {state.me && (
                      <button
                        onClick={() => {
                          if (window.confirm("删除这件配饰？")) state.deleteAccessory(a.id);
                        }}
                        aria-label="删除配饰"
                        style={{
                          position: "absolute",
                          top: 6,
                          left: 6,
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: "var(--rose-dark)",
                          border: "2px solid var(--cream)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          zIndex: 3,
                        }}
                      >
                        <Icon name="x" size={10} color="#fff" />
                      </button>
                    )}
                  </div>
                  );
                })}
            </div>
          </div>
          <div className="lookpanel">
            <h4>当前造型</h4>
            <div className="field" style={{ marginBottom: 10 }}>
              <label>主造型</label>
              <select value={builderDress} onChange={(e) => setBuilderDress(e.target.value)}>
                {state.looks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="looklist">
              {builderAcc.length === 0 && <div className="empty">点选左侧配饰加入造型</div>}
              {builderAcc.map((aid) => {
                const a = state.accessories.find((x) => x.id === aid);
                if (!a) return null;
                return (
                  <div key={aid} className="li">
                    <span>{a.name}</span>
                    <span className="tabular">${a.price}</span>
                  </div>
                );
              })}
            </div>
            <div className="field" style={{ marginBottom: 12 }}>
              <label>适用场合</label>
              <select value={lookOcc} onChange={(e) => setLookOcc(e.target.value)}>
                {state.events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.en}
                  </option>
                ))}
              </select>
            </div>
            {state.me && (
              <button
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={saveLook}
                disabled={!builderDress}
              >
                另存为造型卡
              </button>
            )}
            {!builderDress && <p className="note" style={{ marginTop: 8 }}>先在上面添加一个造型候选，才能搭配配饰。</p>}
          </div>
        </div>

        {state.savedLooks.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div className="section-head">
              <h2 style={{ fontSize: 16 }}>已保存造型卡</h2>
            </div>
            <div className="collagegallery">
              {state.savedLooks.map((l) => {
                const dress = state.looks.find((d) => d.id === l.look_id);
                return (
                  <button key={l.id} className="collage-card" onClick={() => state.openDrawer("look", l.id)}>
                    <div className="thumb">
                      <LookSilhouette look={dress?.look_shape || "aline"} />
                    </div>
                    <div className="nm">{l.name}</div>
                    <div className="tg">
                      {dress?.name} · {l.accessory_ids.length} 件配饰
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="section">
        <div className="section-head">
          <h2>AI 虚拟试衣工作室</h2>
          <span className="meta">Virtual Try-On · 模拟预览</span>
        </div>
        <div className="tryon-grid">
          <div className="upload-zone" onClick={() => fileRef.current.click()}>
            {photo ? (
              <img src={photo} alt="上传的照片" />
            ) : (
              <div className="ph">
                <Icon name="upload" size={28} />
                <p style={{ marginTop: 8, fontSize: 12.5 }}>点击上传本人 / 模特照片</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPhoto} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="field">
              <label>选择造型</label>
              <select
                value={tryonDress}
                onChange={(e) => {
                  setTryonDress(e.target.value);
                  setTryonAcc([]);
                }}
              >
                {state.looks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>选择配饰（可多选）</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {state.accessories
                  .filter((a) => a.wearer === tryonWearer)
                  .map((a) => (
                    <button key={a.id} className={"chip" + (tryonAcc.includes(a.id) ? " on" : "")} onClick={() => toggleTryonAcc(a.id)}>
                      {a.name}
                    </button>
                  ))}
              </div>
            </div>
            <button className="btn btn-primary" onClick={generate} disabled={generating || !tryonDress}>
              <Icon name="sparkle" size={14} /> {generating ? "生成中…" : "生成试穿效果图"}
            </button>
            {!tryonDress && <p className="note">先在上面添加一个造型候选，才能试穿。</p>}
            <p className="note">
              尚未配置真实 Virtual Try-On API Key（fal.ai）。当前展示的是粉色系模拟占位效果；接入真实接口后，此处将调用服务端 API 生成效果图并存入云端造型库。
            </p>
          </div>
        </div>
        {generating && (
          <div className="tryon-result" style={{ marginTop: 16, maxWidth: 260 }}>
            <div className="shimmer" />
            <Icon name="sparkle" size={32} color="var(--gold)" />
          </div>
        )}
        {state.tryonResults.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div className="section-head">
              <h2 style={{ fontSize: 16 }}>试穿效果库</h2>
            </div>
            <div className="grid g5">
              {state.tryonResults.map((r) => (
                <button key={r.id} className="card" onClick={() => state.openDrawer("tryon", r.id)}>
                  <div className="card-cover tryon-result" style={{ aspectRatio: "4/3" }}>
                    <Icon name="sparkle" size={28} color="var(--gold)" />
                  </div>
                  <div className="card-body">
                    <div className="card-title" style={{ fontSize: 12.5 }}>
                      {r.look_name}
                    </div>
                    <div className="card-sub">{new Date(r.created_at).toLocaleDateString("zh-CN")}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <FormModal
        open={!!addLookOpenFor}
        onClose={() => setAddLookOpenFor(null)}
        title={`添加造型 · ${addLookOpenFor === "ch" ? "她的" : "他的"}`}
        onCreate={(values) => state.addLookCandidate({ ...values, wearer: addLookOpenFor })}
        initialValues={{ look_shape: "aline", price: 0, occasions: [], is_private: false }}
        fields={[
          { key: "name", label: "名称", required: true, autoFocus: true },
          { key: "look_shape", label: "剪影款式", type: "select", options: LOOK_SHAPES.map((s) => ({ value: s.id, label: s.name })) },
          { key: "price", label: "价格 (USD)", type: "number" },
          { key: "silhouette", label: "版型" },
          { key: "fabric", label: "面料" },
          { key: "sheen", label: "光泽度" },
          { key: "availability", label: "现货 / 加急周期" },
          { key: "alteration", label: "改衣预估" },
          { key: "occasions", label: "适用场合", type: "chips", options: state.events.map((ev) => ({ value: ev.id, label: ev.en })) },
          { key: "notes", label: "备注", type: "textarea" },
          { key: "is_private", label: "仅自己可见（惊喜款，对方暂时看不到，含关联物品清单条目）", type: "checkbox" },
        ]}
      />
      <FormModal
        open={addAccOpen}
        onClose={() => setAddAccOpen(false)}
        title="添加配饰"
        onCreate={(values) => state.addAccessory({ ...values, wearer: builderWearer })}
        initialValues={{ category: activeCat, price: 0, is_private: false }}
        fields={[
          { key: "name", label: "名称", required: true, autoFocus: true },
          { key: "category", label: "类别", type: "select", options: ACC_CATS.map((c) => ({ value: c.id, label: c.name })) },
          { key: "price", label: "价格 (USD)", type: "number" },
          { key: "is_private", label: "仅自己可见（惊喜款，对方暂时看不到，含关联物品清单条目）", type: "checkbox" },
        ]}
      />
      <ImportInventoryModal
        open={!!importLookOpenFor}
        onClose={() => setImportLookOpenFor(null)}
        mode="look"
        items={unlinkedInventory}
        wearerLocked={importLookOpenFor}
        onImport={(itemId, values) => state.importInventoryAsLook(itemId, values)}
      />
      <ImportInventoryModal
        open={importAccOpen}
        onClose={() => setImportAccOpen(false)}
        mode="accessory"
        items={unlinkedInventory}
        wearerLocked={builderWearer}
        onImport={(itemId, values) => state.importInventoryAsAccessory(itemId, values)}
      />
    </div>
  );
}

/* ============ Inventory page ============ */
function Inventory({ state, invFilter, setInvFilter, initialEventFilter }) {
  const [occFilter, setOccFilter] = useState(initialEventFilter || "all");
  const { selMode, selected, toggle, toggleMode, reset } = useMultiSelect();
  const [addOpen, setAddOpen] = useState(false);
  const [revealed, setRevealed] = useState(() => new Set());
  const toggleReveal = (id, e) => {
    e.stopPropagation();
    setRevealed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const items = state.inventory.filter(
    (i) =>
      (invFilter === "all" || i.status === invFilter) &&
      (occFilter === "all" || i.occasions.includes(occFilter) || i.occasions.includes("global"))
  );
  const bulkDelete = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`确定删除选中的 ${selected.size} 件物品吗？`)) return;
    for (const id of selected) await state.deleteInventoryItem(id);
    reset();
  };
  return (
    <div className="wrap">
      <div className="section">
        <div className="section-head">
          <h2>物品与资产清单</h2>
          <span className="meta">还没付款的物品不计入已购预算</span>
        </div>
        <div className="filterbar">
          <MultiSelectBar me={state.me} selMode={selMode} count={selected.size} onToggleMode={toggleMode} onDelete={bulkDelete} />
          {state.me && (
            <button className="btn btn-primary" onClick={() => setAddOpen(true)}>
              <Icon name="plus" size={13} /> 添加物品
            </button>
          )}
        </div>
        <div className="filterbar">
          <button className={"chip" + (invFilter === "all" ? " on" : "")} onClick={() => setInvFilter("all")}>
            全部状态
          </button>
          {Object.entries(STATUS_META).map(([k, v]) => (
            <button key={k} className={"chip" + (invFilter === k ? " on" : "")} onClick={() => setInvFilter(k)}>
              {v.label}
            </button>
          ))}
        </div>
        <div className="filterbar">
          <button className={"chip" + (occFilter === "all" ? " on" : "")} onClick={() => setOccFilter("all")}>
            全部场合
          </button>
          {state.events.map((ev) => (
            <button key={ev.id} className={"chip" + (occFilter === ev.id ? " on" : "")} onClick={() => setOccFilter(ev.id)}>
              {ev.en}
            </button>
          ))}
        </div>
        {items.length === 0 ? (
          <div className="empty-state">没有符合筛选条件的物品</div>
        ) : (
          <div className="grid g4">
            {items.map((it) => {
              const photos = state.photosByItem[it.id] || [];
              const isRevealed = revealed.has(it.id);
              return (
                <div
                  key={it.id}
                  className="card"
                  role="button"
                  tabIndex={0}
                  onClick={() => (selMode ? toggle(it.id) : state.openDrawer("inventory", it.id))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") (selMode ? toggle(it.id) : state.openDrawer("inventory", it.id));
                  }}
                >
                  <div className="card-cover" style={{ background: "#F7EFE4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {photos.length > 0 ? (
                      <img src={photos[0].url} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
                    ) : (
                      <Icon name={STATUS_ICON[it.status]} size={34} color={STATUS_META[it.status].color} />
                    )}
                    <span className={"corner-badge badge " + it.status}>{STATUS_META[it.status].label}</span>
                    {selMode && (
                      <span className="corner-ring">
                        <SelectCheckbox checked={selected.has(it.id)} />
                      </span>
                    )}
                    {it.is_private && (
                      <span
                        className="sel-check"
                        style={{ top: "auto", bottom: 10, left: 10, right: "auto", background: "var(--plum)" }}
                        title="仅自己可见"
                      >
                        <Icon name="lock" size={12} color="#fff" />
                      </span>
                    )}
                    <OccChips occasions={it.occasions} />
                  </div>
                  <div className="card-body">
                    <div className="card-title">{it.name}</div>
                    <div className="card-sub">
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => toggleReveal(it.id, e)}
                        style={{ display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer" }}
                      >
                        <Icon name={isRevealed ? "eye" : "eye-off"} size={12} />
                        {isRevealed ? (
                          <span className="tabular">
                            ${Number(it.price_usd).toLocaleString()} · ¥
                            {(it.price_usd * RATE).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                        ) : (
                          "价格已隐藏"
                        )}
                      </span>
                    </div>
                    {!selMode && (it.links || []).some(isOpenableLink) && (
                      <div className="shop-links">
                        {it.links.filter(isOpenableLink).map((l, i) => (
                          <a
                            key={i}
                            className="shop-link"
                            href={l}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          >
                            <Icon name="link" size={11} /> {linkHost(l) || "去购买"}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <FormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="添加物品"
        onCreate={(values) => state.addInventoryItem(values)}
        initialValues={{
          status: "to_buy", price_usd: 0, occasions: occFilter !== "all" ? [occFilter] : [],
          create_look: false, wearer: "ch", look_shape: "aline", is_private: false,
        }}
        fields={[
          { key: "name", label: "名称", required: true, autoFocus: true },
          { key: "status", label: "状态", type: "select", options: Object.entries(STATUS_META).map(([k, v]) => ({ value: k, label: v.label })) },
          { key: "price_usd", label: "价格 (USD)", type: "number" },
          { key: "channel", label: "购买渠道" },
          { key: "links", label: "购买链接（可选，可以加多个）", type: "links" },
          { key: "occasions", label: "跨场合复用计划", type: "chips", options: state.events.map((ev) => ({ value: ev.id, label: ev.en })) },
          { key: "notes", label: "备注", type: "textarea" },
          { key: "is_private", label: "仅自己可见（惊喜款，对方暂时看不到）", type: "checkbox" },
          { key: "create_look", label: "同时添加为造型候选（婚纱 / 礼服等）", type: "checkbox" },
          {
            key: "wearer", label: "造型适用对象", type: "select",
            options: [{ value: "ch", label: "她" }, { value: "hs", label: "他" }],
            showIf: (v) => v.create_look,
          },
          {
            key: "look_shape", label: "剪影款式", type: "select",
            options: LOOK_SHAPES.map((s) => ({ value: s.id, label: s.name })),
            showIf: (v) => v.create_look,
          },
        ]}
      />
    </div>
  );
}

/* ============ Tasks page ============ */
function TaskTagChips({ tags, events }) {
  if (!tags || tags.length === 0) return <span className="tmeta">无标签</span>;
  // Showing every tag as its own wrapping chip blew up row height on narrow
  // screens once a task had 3+ tags; show the first and collapse the rest
  // behind a "…" (full list still available on hover / in the drawer).
  const rest = tags.slice(1);
  return (
    <span style={{ display: "flex", gap: 4, alignItems: "center", minWidth: 0 }}>
      <span
        className="tmeta"
        style={{ background: "var(--champagne)", borderRadius: 999, padding: "2px 8px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
      >
        {tagLabel(tags[0], events)}
      </span>
      {rest.length > 0 && (
        <span className="tmeta" title={rest.map((t) => tagLabel(t, events)).join("、")}>
          …
        </span>
      )}
    </span>
  );
}

function Tasks({ state, initialTag }) {
  const [tagFilter, setTagFilter] = useState(initialTag || "all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const profiles = useProfiles();
  const { selMode, selected, toggle, toggleMode, reset } = useMultiSelect();
  const [addOpen, setAddOpen] = useState(false);
  const [icsEvents, setIcsEvents] = useState([]);
  const [icsOpen, setIcsOpen] = useState(false);
  const icsInputRef = useRef();
  const tagPool = [...new Set([...state.events.map((e) => e.id), ...state.tasks.flatMap((t) => t.tags || [])])];
  // RLS already hides other people's private tasks server-side — no client-side privacy filter needed.
  const visible = sortTaskList(
    state.tasks.filter((t) => {
      if (tagFilter !== "all" && !(t.tags || []).includes(tagFilter)) return false;
      if (assigneeFilter !== "all" && t.assignee !== assigneeFilter) return false;
      return true;
    })
  );
  const bulkDelete = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`确定删除选中的 ${selected.size} 条待办吗？`)) return;
    for (const id of selected) await state.deleteTask(id);
    reset();
  };
  return (
    <div className="wrap">
      <div className="section">
        <div className="section-head">
          <h2>待办管理</h2>
          <span className="meta">私密任务仅创建者本人可见</span>
        </div>
        <div className="filterbar">
          <MultiSelectBar me={state.me} selMode={selMode} count={selected.size} onToggleMode={toggleMode} onDelete={bulkDelete} />
          {state.me && (
            <button className="btn btn-primary" onClick={() => setAddOpen(true)}>
              <Icon name="plus" size={13} /> 添加待办
            </button>
          )}
          {state.me && (
            <button className="btn btn-ghost" onClick={() => icsInputRef.current.click()}>
              <Icon name="calendar" size={13} /> 从日历文件导入
            </button>
          )}
          <input
            ref={icsInputRef}
            type="file"
            accept=".ics,text/calendar"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const text = await file.text();
              setIcsEvents(parseICSEvents(text));
              setIcsOpen(true);
              e.target.value = "";
            }}
          />
        </div>
        <div className="filterbar">
          <button className={"chip" + (tagFilter === "all" ? " on" : "")} onClick={() => setTagFilter("all")}>
            全部标签
          </button>
          {tagPool.map((tag) => (
            <button key={tag} className={"chip" + (tagFilter === tag ? " on" : "")} onClick={() => setTagFilter(tag)}>
              {tagLabel(tag, state.events)}
            </button>
          ))}
        </div>
        <div className="filterbar">
          <button className={"chip" + (assigneeFilter === "all" ? " on" : "")} onClick={() => setAssigneeFilter("all")}>
            全部负责人
          </button>
          {profiles.map((m) => (
            <button key={m.member_key} className={"chip" + (assigneeFilter === m.member_key ? " on" : "")} onClick={() => setAssigneeFilter(m.member_key)}>
              {m.name}
            </button>
          ))}
        </div>
        <div className="tasklist">
          {visible.length === 0 && <div className="empty-state">没有符合筛选条件的待办</div>}
          {visible.map((t) => {
            const done = t.status === "done";
            return (
              <div
                key={t.id}
                className={"taskrow" + (isDeadlineAlert(t.deadline, done) ? " alert" : "")}
                role="button"
                tabIndex={0}
                style={{ borderLeft: "6px solid " + (memberOf(profiles, t.assignee)?.bg_color || "var(--line)") }}
                onClick={() => (selMode ? toggle(t.id) : state.openDrawer("task", t.id))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") (selMode ? toggle(t.id) : state.openDrawer("task", t.id));
                }}
              >
                {selMode && <SelectCheckbox checked={selected.has(t.id)} />}
                <button
                  className="checkdot"
                  aria-label={done ? "标记为未完成" : "标记为已完成"}
                  style={{ background: done ? "var(--good)" : "#fff", borderColor: done ? "var(--good)" : "var(--line)" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    state.toggleTaskDone(t.id);
                  }}
                >
                  {done && <Icon name="check" size={13} color="#fff" />}
                </button>
                <Avatar id={t.assignee} />
                <span className="ttitle" style={done ? { textDecoration: "line-through", opacity: 0.55 } : null}>
                  {t.title}
                </span>
                {t.is_private && (
                  <span className="lockdot">
                    <Icon name="lock" size={14} />
                  </span>
                )}
                <TaskTagChips tags={t.tags} events={state.events} />
                <DeadlineBadge deadline={t.deadline} done={done} />
                <span className={"statuspill " + (t.status === "todo" ? "todo" : t.status === "doing" ? "doing" : "done")}>
                  {TASK_STATUS[t.status]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <AddItemModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreate={state.addTask}
        events={state.events}
        tagSuggestions={tagPool}
        showAssignee
        defaultAssignee={state.me?.member_key}
        suggestedTag={tagFilter !== "all" ? tagFilter : null}
      />
      <ImportIcsModal
        open={icsOpen}
        onClose={() => setIcsOpen(false)}
        events={icsEvents}
        onImport={(selected) => {
          selected.forEach((ev) => {
            state.addTask({
              title: ev.summary,
              deadline: ev.date,
              tags: tagFilter !== "all" ? [tagFilter] : [],
              isPrivate: false,
              notes: ev.description,
              assignee: state.me?.member_key,
            });
          });
        }}
      />
    </div>
  );
}

/* ============ Daily page ============ */
function Daily({ state }) {
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const profiles = useProfiles();
  const { selMode, selected, toggle, toggleMode, reset } = useMultiSelect();
  const [addOpen, setAddOpen] = useState(false);
  const tagPool = [...new Set(state.dailyTasks.flatMap((t) => t.tags || []))];
  const visible = state.dailyTasks.filter((t) => {
    if (assigneeFilter !== "all" && t.assignee !== assigneeFilter) return false;
    if (tagFilter !== "all" && !(t.tags || []).includes(tagFilter)) return false;
    return true;
  });
  const sorted = sortTaskList(visible);
  const bulkDelete = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`确定删除选中的 ${selected.size} 条日常待办吗？`)) return;
    for (const id of selected) await state.deleteDailyTask(id);
    reset();
  };
  return (
    <div className="daily-theme">
    <div className="wrap">
      <div className="section">
        <div className="section-head">
          <h2>Daily</h2>
          <span className="meta">跟婚礼无关的日常待办，一样支持私密、标签和截止日期</span>
        </div>
        <div className="filterbar">
          <MultiSelectBar me={state.me} selMode={selMode} count={selected.size} onToggleMode={toggleMode} onDelete={bulkDelete} />
          {state.me && (
            <button className="btn btn-primary" onClick={() => setAddOpen(true)}>
              <Icon name="plus" size={13} /> 添加
            </button>
          )}
        </div>
        <div className="filterbar">
          <button className={"chip" + (tagFilter === "all" ? " on" : "")} onClick={() => setTagFilter("all")}>
            全部标签
          </button>
          {tagPool.map((tag) => (
            <button key={tag} className={"chip" + (tagFilter === tag ? " on" : "")} onClick={() => setTagFilter(tag)}>
              {tagLabel(tag, state.events)}
            </button>
          ))}
        </div>
        <div className="filterbar">
          <button className={"chip" + (assigneeFilter === "all" ? " on" : "")} onClick={() => setAssigneeFilter("all")}>
            全部负责人
          </button>
          {profiles.map((m) => (
            <button key={m.member_key} className={"chip" + (assigneeFilter === m.member_key ? " on" : "")} onClick={() => setAssigneeFilter(m.member_key)}>
              {m.name}
            </button>
          ))}
        </div>
        <div className="tasklist">
          {sorted.length === 0 && <div className="empty-state">没有日常待办</div>}
          {sorted.map((t) => {
            const done = t.status === "done";
            return (
              <div
                key={t.id}
                className={"taskrow" + (isDeadlineAlert(t.deadline, done) ? " alert" : "")}
                role="button"
                tabIndex={0}
                style={{ borderLeft: "6px solid " + (memberOf(profiles, t.assignee)?.bg_color || "var(--line)") }}
                onClick={() => (selMode ? toggle(t.id) : state.openDrawer("daily", t.id))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") (selMode ? toggle(t.id) : state.openDrawer("daily", t.id));
                }}
              >
                {selMode && <SelectCheckbox checked={selected.has(t.id)} />}
                <button
                  className="checkdot"
                  aria-label={done ? "标记为未完成" : "标记为已完成"}
                  style={{ background: done ? "var(--good)" : "#fff", borderColor: done ? "var(--good)" : "var(--line)" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    state.toggleDailyTaskDone(t.id);
                  }}
                >
                  {done && <Icon name="check" size={13} color="#fff" />}
                </button>
                <Avatar id={t.assignee} />
                <span className="ttitle" style={done ? { textDecoration: "line-through", opacity: 0.55 } : null}>
                  {t.title}
                </span>
                {t.is_private && (
                  <span className="lockdot">
                    <Icon name="lock" size={14} />
                  </span>
                )}
                <TaskTagChips tags={t.tags} events={state.events} />
                <DeadlineBadge deadline={t.deadline} done={done} />
                <span className={"statuspill " + (t.status === "todo" ? "todo" : t.status === "doing" ? "doing" : "done")}>
                  {TASK_STATUS[t.status]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <AddItemModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreate={state.addDailyTask}
        tagSuggestions={tagPool}
        events={[]}
        showAssignee
        defaultAssignee={state.me?.member_key}
        suggestedTag={tagFilter !== "all" ? tagFilter : null}
      />
    </div>
    </div>
  );
}

/* ============ Log page ============ */
// A log entry's displayed date/time is fixed to whatever timezone it's
// tagged with (tz_offset_min, minutes east of UTC) — not derived from
// whoever happens to be viewing the page, since the two of you may well be
// in different zones when one of you reads an entry the other wrote.
// created_at stays the single source of truth (a real UTC instant);
// log_date/the time field/the timezone picker are each just a view onto
// it, and editing any one of them reconstructs created_at so the other two
// stay consistent.
const TZ_OPTIONS = [
  { label: "美国太平洋时间 (UTC-8)", value: -480 },
  { label: "美国太平洋夏令时 (UTC-7)", value: -420 },
  { label: "美国东部时间 (UTC-5)", value: -300 },
  { label: "美国东部夏令时 (UTC-4)", value: -240 },
  { label: "中国标准时间 (UTC+8)", value: 480 },
  { label: "格林尼治时间 (UTC+0)", value: 0 },
];
function tzSelectOptions(current) {
  if (TZ_OPTIONS.some((o) => o.value === current)) return TZ_OPTIONS;
  return [...TZ_OPTIONS, { label: `当前 (${offsetLabel(current)})`, value: current }];
}
function offsetLabel(offsetMin) {
  const sign = offsetMin >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMin);
  const pad = (n) => String(n).padStart(2, "0");
  return `UTC${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}
// Friendlier names for the exported image only (meant for family/friends);
// the 日志 page itself keeps the UTC-offset "log" look. Anything outside
// these falls back to the raw offset.
const TZ_NAMES = {
  480: ["北京时间", "北京"],
  [-480]: ["美西时间", "美西"],
  [-420]: ["美西时间", "美西"],
  [-300]: ["美东时间", "美东"],
  [-240]: ["美东时间", "美东"],
};
function tzName(offsetMin, short = false) {
  const n = TZ_NAMES[offsetMin];
  return n ? n[short ? 1 : 0] : offsetLabel(offsetMin);
}
// The wall-clock date/time an instant reads as under a fixed UTC offset.
function getWallClock(createdAtIso, offsetMin) {
  const shifted = new Date(new Date(createdAtIso).getTime() + offsetMin * 60000);
  return {
    y: shifted.getUTCFullYear(), mo: shifted.getUTCMonth(), d: shifted.getUTCDate(),
    h: shifted.getUTCHours(), mi: shifted.getUTCMinutes(),
  };
}
// The reverse: given wall-clock components meant to be read under a fixed
// UTC offset, the real UTC instant that produces them.
function wallClockToUTC(y, mo, d, h, mi, offsetMin) {
  return new Date(Date.UTC(y, mo, d, h, mi, 0) - offsetMin * 60000).toISOString();
}
function formatLogStamp(createdAtIso, offsetMin) {
  const wc = getWallClock(createdAtIso, offsetMin);
  const pad = (n) => String(n).padStart(2, "0");
  return `${wc.y}-${pad(wc.mo + 1)}-${pad(wc.d)} ${pad(wc.h)}:${pad(wc.mi)} ${offsetLabel(offsetMin)}`;
}
function ExportLogModal({ open, onClose, entries }) {
  const profiles = useProfiles();
  const [withPhotos, setWithPhotos] = useState(true);
  const [includePrivate, setIncludePrivate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const replaceResult = (next) =>
    setResult((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return next;
    });
  useEffect(() => {
    if (!open) {
      replaceResult(null);
      setBusy(false);
      setError("");
    }
  }, [open]);
  if (!open) return null;

  const privateCount = entries.filter((e) => e.is_private).length;
  const chosen = entries.filter((e) => includePrivate || !e.is_private);
  const hasPhotos = chosen.some((e) => e.photo_url);
  const today = new Date().toISOString().slice(0, 10);

  const generate = async () => {
    setBusy(true);
    setError("");
    try {
      const first = chosen[0], last = chosen[chosen.length - 1];
      const range = first ? `${formatLogStamp(first.created_at, first.tz_offset_min).slice(0, 10)} — ${formatLogStamp(last.created_at, last.tz_offset_min).slice(0, 10)}` : "";
      // One shared timezone goes in the header once, so each line keeps just
      // "YYYY-MM-DD HH:MM" and the content has room to sit on the same line.
      const sharedTz = chosen.every((e) => e.tz_offset_min === first?.tz_offset_min);
      const { blob, missingPhotos } = await renderLogImage(
        chosen.map((e) => {
          const full = formatLogStamp(e.created_at, e.tz_offset_min);
          const date = full.slice(0, 10);
          const time = full.slice(11, 16);
          return {
            stamp: sharedTz ? `${date} ${time}` : `${date} ${tzName(e.tz_offset_min, true)} ${time}`,
            content: e.content,
            photoUrl: e.photo_url,
          };
        }),
        {
          withPhotos: withPhotos && hasPhotos,
          title: "H.S. & C.H. · 日志",
          subtitle: `${range} · 共 ${chosen.length} 条${sharedTz && first ? ` · ${tzName(first.tz_offset_min)}` : ""}`,
          footer: `Wedding Workbook · 导出于 ${today}`,
        }
      );
      if (!blob) throw new Error("no blob");
      replaceResult({ blob, url: URL.createObjectURL(blob), missingPhotos });
    } catch {
      setError("生成失败了，换成只导出文字再试一次？");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    const name = `wedding-log-${today}.png`;
    const file = new File([result.blob], name, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] }) && matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share({ files: [file] });
        return;
      } catch (e) {
        if (e?.name === "AbortError") return;
      }
    }
    const a = document.createElement("a");
    a.href = result.url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="drawer" role="dialog" aria-label="导出长图">
        <div className="drawer-head">
          <h3>导出长图</h3>
          <button className="drawer-close" onClick={onClose} aria-label="关闭">
            <Icon name="x" size={15} />
          </button>
        </div>
        <div className="drawer-body">
          {!result ? (
            <>
              <div className="field">
                <label>内容</label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", textTransform: "none", letterSpacing: 0, fontSize: 14, color: "var(--plum)", fontWeight: 500 }}>
                  <input type="radio" checked={!withPhotos} onChange={() => setWithPhotos(false)} />
                  只导出文字
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", textTransform: "none", letterSpacing: 0, fontSize: 14, color: "var(--plum)", fontWeight: 500 }}>
                  <input type="radio" checked={withPhotos} onChange={() => setWithPhotos(true)} />
                  文字 + 配图小图{!hasPhotos && "（目前没有配图的日志）"}
                </label>
              </div>
              {privateCount > 0 && (
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13.5 }}>
                  <input type="checkbox" checked={includePrivate} onChange={(e) => setIncludePrivate(e.target.checked)} style={{ width: 14, height: 14 }} />
                  也导出 {privateCount} 条"仅自己可见"的日志（默认不导出，防止分享时带出私密内容）
                </label>
              )}
              <p className="note">将导出 {chosen.length} 条日志。</p>
              {error && <p className="note" style={{ color: "var(--critical)" }}>{error}</p>}
              <button
                className="btn btn-primary"
                style={{ justifyContent: "center" }}
                disabled={busy || chosen.length === 0}
                onClick={generate}
              >
                {busy ? "生成中…" : "生成长图"}
              </button>
            </>
          ) : (
            <>
              {result.missingPhotos > 0 && (
                <p className="note">有 {result.missingPhotos} 张配图没加载出来，已跳过。</p>
              )}
              <p className="note">手机上可以直接长按下面的图片保存到相册。</p>
              <div style={{ maxHeight: "55vh", overflowY: "auto", border: "1px solid var(--line)", borderRadius: 12 }}>
                <img src={result.url} alt="日志长图预览" style={{ width: "100%", display: "block" }} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={save}>
                  保存图片
                </button>
                <button className="btn btn-ghost" onClick={() => replaceResult(null)}>
                  重新选择
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function WeddingLog({ state }) {
  const [draft, setDraft] = useState("");
  const [zoomSrc, setZoomSrc] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const profiles = useProfiles();
  const listRef = useRef(null);

  const sorted = [...state.weddingLog].sort((a, b) => {
    if (a.log_date !== b.log_date) return a.log_date.localeCompare(b.log_date);
    return a.created_at.localeCompare(b.created_at);
  });

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [state.weddingLog.length]);

  const submit = (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    state.addLogEntry(draft);
    setDraft("");
  };

  if (!state.me) {
    return (
      <div className="wrap">
        <div className="section">
          <div className="section-head">
            <h2>日志</h2>
          </div>
          <div className="empty-state">
            这部分内容仅 H.S. 和 C.H. 可见（保护日志里可能配的图片），
            <a href="/login">登录</a>后查看。
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="wrap" style={{ paddingBottom: 96 }}>
        <div className="section">
          <div className="section-head">
            <h2>日志</h2>
            <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="meta">一行一条，记下今天完成了什么</span>
              {sorted.length > 0 && (
                <button className="btn btn-ghost" onClick={() => setExportOpen(true)}>
                  <Icon name="image" size={13} /> 导出长图
                </button>
              )}
            </span>
          </div>
          <div className="loglist" ref={listRef}>
            {sorted.length === 0 && <div className="empty-state">还没有日志，在下面写第一条吧</div>}
            {sorted.map((l) => (
              <div key={l.id} className="logline">
                <span className="logtime tabular">{formatLogStamp(l.created_at, l.tz_offset_min)}</span>
                <Avatar id={l.owner} size={18} />
                <span
                  className="logcontent"
                  role={l.photo_url ? "button" : undefined}
                  tabIndex={l.photo_url ? 0 : undefined}
                  style={l.photo_url ? { cursor: "pointer" } : undefined}
                  title={l.photo_url ? "点击查看图片" : undefined}
                  onClick={() => l.photo_url && setZoomSrc(l.photo_url)}
                >
                  {l.content}
                </span>
                {l.photo_url && (
                  <span className="lockdot" title="这条日志配了图片">
                    <Icon name="image" size={13} />
                  </span>
                )}
                {l.is_private && (
                  <span className="lockdot">
                    <Icon name="lock" size={12} />
                  </span>
                )}
                <button
                  className="lockdot"
                  title="编辑这条日志"
                  style={{ border: "none", background: "none", cursor: "pointer" }}
                  onClick={() => state.openDrawer("logentry", l.id)}
                >
                  <Icon name="edit" size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      {state.me && (
        <div className="log-input-bar">
          <form className="wrap" style={{ display: "flex", gap: 10 }} onSubmit={submit}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="记一笔，比如：今天定下了 SF City Hall 的领证日期…"
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" type="submit" aria-label="记录">
              <Icon name="send" size={14} />
            </button>
          </form>
        </div>
      )}
      {zoomSrc && (
        <div
          className="overlay"
          style={{ zIndex: 95, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={() => setZoomSrc(null)}
        >
          <img src={zoomSrc} style={{ maxWidth: "100%", maxHeight: "88vh", borderRadius: 14, boxShadow: "0 20px 60px rgba(74,43,51,.4)" }} />
        </div>
      )}
      <ExportLogModal open={exportOpen} onClose={() => setExportOpen(false)} entries={sorted} />
    </>
  );
}

/* ============ Run of Show page ============ */
// time_label is free text ("09:30", "9点半", "下午3点", "3:30 PM",
// "14:00-15:00"…), so pull the first clock time out of it to sort by.
// Returns minutes since midnight, or null when there's no time in it
// (e.g. "时间待定"), and those sort after every timed node.
function parseTimeLabel(label) {
  const s = String(label || "").replace(/：/g, ":").trim();
  if (!s) return null;
  const m = s.match(/(\d{1,2})\s*(?::\s*(\d{2})|点\s*(半|\d{1,2})?|时\s*(\d{1,2})?|\.(\d{2})(?!\d))?\s*(am|pm|a\.m\.|p\.m\.)?/i);
  if (!m) return null;
  let h = Number(m[1]);
  const minStr = m[2] ?? m[4] ?? m[5] ?? (m[3] && m[3] !== "半" ? m[3] : null);
  let min = m[3] === "半" ? 30 : Number(minStr || 0);
  // A bare number with no colon/点/am-pm ("第2场") isn't a time.
  if (m[2] == null && m[5] == null && !/[点时]/.test(m[0]) && !m[6]) return null;
  if (h > 24 || min > 59) return null;
  const before = s.slice(0, m.index);
  const ampm = (m[6] || "").toLowerCase();
  const isPM = ampm.startsWith("p") || /(下午|晚上|傍晚|晚)\s*$/.test(before);
  const isAM = ampm.startsWith("a") || /(凌晨|早上|早晨|上午|清晨)\s*$/.test(before);
  const isNoon = /中午\s*$/.test(before);
  if (isPM && h < 12) h += 12;
  else if (isNoon && h < 6) h += 12;
  else if (isAM && h === 12) h = 0;
  return h * 60 + min;
}

// The day a node belongs to for grouping/sorting. A node left without a
// date joins the event's only date when the event has exactly one — so
// forgetting the optional date on one node doesn't push it to the bottom
// as a separate, header-less group under everything else.
function nodeDayFn(list) {
  const dates = [...new Set(list.map((n) => n.node_date).filter(Boolean))];
  return (n) => n.node_date || (dates.length === 1 ? dates[0] : null);
}

// Day first (undated last), then clock time, then the manual sort_order
// as the tie-breaker and for nodes whose time can't be read.
function compareNodes(a, b, day = (n) => n.node_date) {
  const da = day(a) || "";
  const db = day(b) || "";
  if (da !== db) {
    if (!da) return 1;
    if (!db) return -1;
    return da.localeCompare(db);
  }
  const ta = parseTimeLabel(a.time_label);
  const tb = parseTimeLabel(b.time_label);
  if (ta !== tb) {
    if (ta == null) return 1;
    if (tb == null) return -1;
    return ta - tb;
  }
  return (a.sort_order || 0) - (b.sort_order || 0);
}

function RunOfShow({ state, evTab, setEvTab }) {
  const [addOpen, setAddOpen] = useState(false);
  const nodes = state.nodesByEvent[evTab] || [];
  const ev = state.events.find((e) => e.id === evTab);

  // Group into date buckets so a multi-day event reads as separate flows,
  // each from early to late (nodesByEvent is already sorted by compareNodes);
  // undated nodes (the common case for a single-day event) get one bucket
  // with no header, same as before this feature existed.
  const day = nodeDayFn(nodes);
  const groups = [];
  for (const n of nodes) {
    const key = day(n) || "__undated";
    let g = groups.find((g) => g.key === key);
    if (!g) {
      g = { key, date: day(n), items: [] };
      groups.push(g);
    }
    g.items.push(n);
  }
  groups.sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date.localeCompare(b.date);
  });

  return (
    <div className="wrap">
      <div className="section">
        <div className="section-head">
          <h2>当天流程</h2>
          <span className="meta">点击节点查看执行细节</span>
        </div>
        <div className="filterbar">
          {state.events.map((e) => (
            <button key={e.id} className={"chip" + (evTab === e.id ? " on" : "")} onClick={() => setEvTab(e.id)}>
              {e.name}
            </button>
          ))}
        </div>
        {state.me && (
          <button className="btn btn-primary" style={{ marginBottom: 16 }} onClick={() => setAddOpen(true)}>
            <Icon name="plus" size={13} /> 添加环节
          </button>
        )}
        {nodes.length === 0 ? (
          <div className="empty-state">还没有流程节点</div>
        ) : (
          groups.map((g) => {
            const fd = formatNodeDate(g.date);
            return (
              <div key={g.key} className="rosday">
                {fd ? (
                  <div className="rosday-head">
                    <span className="d1">{fd.label}</span>
                    <span className="d2">{fd.weekday}</span>
                  </div>
                ) : (
                  groups.length > 1 && (
                    <div className="rosday-head">
                      <span className="d1">未设日期</span>
                      <span className="d2">点开环节补上日期</span>
                    </div>
                  )
                )}
                <div className="timeline">
                  {g.items.map((n) => (
                    <div key={n.id} className="tnode" onClick={() => state.openDrawer("node", n.id)}>
                      <span className="dot">
                        <Icon name="pin" size={13} color="#fff" />
                      </span>
                      <div className="card2">
                        <div className="time tabular">{formatNodeTime(n.time_label) || "时间待定"}</div>
                        <div className="ttl">{n.title}</div>
                        {n.location && <div className="loc">{n.location}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
        {ev?.status === "tbd" && <p className="note" style={{ marginTop: 12 }}>该活动日程仍为草稿，细节确认后将同步更新。</p>}
      </div>
      <FormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={`添加环节 · ${ev?.name || ""}`}
        initialValues={{ node_date: groups.find((g) => g.date)?.date && groups.filter((g) => g.date).length === 1 ? groups.find((g) => g.date).date : undefined }}
        onCreate={(values) => state.addNode(evTab, values)}
        fields={[
          { key: "title", label: "标题", required: true, autoFocus: true },
          { key: "node_date", label: "日期（可选，多天流程用来分组）", type: "date" },
          { key: "time_label", label: "时间（结束时间可不填）", type: "time" },
          { key: "location", label: "地点" },
          { key: "notes", label: "执行细节 / 注意事项", type: "textarea" },
        ]}
      />
    </div>
  );
}

/* ============ Vendors & Budget page ============ */
function VendorsBudget({ state, initialEventFilter }) {
  const [groupBy, setGroupBy] = useState("event");
  const [vendorEvFilter, setVendorEvFilter] = useState(initialEventFilter || "all");
  const { selMode, selected, toggle, toggleMode, reset } = useMultiSelect();
  const [addOpen, setAddOpen] = useState(false);
  const bulkDelete = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`确定删除选中的 ${selected.size} 个供应商吗？`)) return;
    for (const id of selected) await state.deleteVendor(id);
    reset();
  };
  const visibleVendors = state.vendors.filter(
    (v) => vendorEvFilter === "all" || (v.event_id || "global") === vendorEvFilter
  );
  return (
    <div className="wrap">
      <div className="section">
        <div className="section-head">
          <h2>供应商</h2>
          <span className="meta">点击卡片查看联系人与沟通记录</span>
        </div>
        <div className="filterbar">
          <MultiSelectBar me={state.me} selMode={selMode} count={selected.size} onToggleMode={toggleMode} onDelete={bulkDelete} />
          {state.me && (
            <button className="btn btn-primary" onClick={() => setAddOpen(true)}>
              <Icon name="plus" size={13} /> 添加供应商
            </button>
          )}
        </div>
        <div className="filterbar">
          <button className={"chip" + (vendorEvFilter === "all" ? " on" : "")} onClick={() => setVendorEvFilter("all")}>
            全部活动
          </button>
          {state.events.map((ev) => (
            <button key={ev.id} className={"chip" + (vendorEvFilter === ev.id ? " on" : "")} onClick={() => setVendorEvFilter(ev.id)}>
              {ev.en}
            </button>
          ))}
          <button className={"chip" + (vendorEvFilter === "global" ? " on" : "")} onClick={() => setVendorEvFilter("global")}>
            全局
          </button>
        </div>
        <div className="grid g3">
          {visibleVendors.map((v) => {
            const dleft = daysUntil(v.deadline);
            return (
              <button
                key={v.id}
                className="vcard"
                style={{ position: "relative" }}
                onClick={() => (selMode ? toggle(v.id) : state.openDrawer("vendor", v.id))}
              >
                {selMode && (
                  <span style={{ position: "absolute", top: 12, right: 12 }}>
                    <SelectCheckbox checked={selected.has(v.id)} />
                  </span>
                )}
                <div className="vcard-top">
                  <div className="vlogo">{v.name.slice(0, 1)}</div>
                  <div>
                    <div className="vname">{v.name}</div>
                    <div className="vcat">{v.category}</div>
                  </div>
                </div>
                <div className="vquote tabular">{v.quote > 0 ? "$" + Number(v.quote).toLocaleString() : "报价待定"}</div>
                <div className="vfoot">
                  {v.is_rush ? (
                    <span className="badge rush">
                      <Icon name="bolt" size={11} color="#fff" /> 加急
                    </span>
                  ) : (
                    <span />
                  )}
                  {dleft !== null && <span className="countdown">还剩 {dleft} 天回复</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <h2>动态预算</h2>
          <div className="filterbar" style={{ margin: 0 }}>
            <button className={"chip" + (groupBy === "event" ? " on" : "")} onClick={() => setGroupBy("event")}>
              按活动
            </button>
            <button className={"chip" + (groupBy === "category" ? " on" : "")} onClick={() => setGroupBy("category")}>
              按类别
            </button>
          </div>
        </div>
        <div className="legend">
          <span className="lg">
            <span className="sw" style={{ background: "var(--good)" }} />
            已确认支出
          </span>
          <span className="lg">
            <span className="sw" style={{ background: "var(--pending)" }} />
            预估待支出
          </span>
          <span className="lg">
            <span className="sw" style={{ background: "var(--reserve)" }} />
            预留余量
          </span>
        </div>
        {groupBy === "event"
          ? state.events.map((ev) => {
              if (!ev.budget_tracking) {
                return (
                  <div key={ev.id} className="eventrow">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="name">{ev.name}</span>
                      <button className="chip" onClick={() => state.toggleBudgetTracking(ev.id)}>
                        开启预算追踪
                      </button>
                    </div>
                    <p className="note" style={{ marginTop: 8 }}>
                      该活动已关闭预算追踪，保持纯粹的仪式感氛围，不在此处展示金额。
                    </p>
                  </div>
                );
              }
              const allocated = Number(ev.budget_allocated),
                confirmed = Number(ev.budget_confirmed),
                estimated = Number(ev.budget_estimated);
              const reserve = Math.max(allocated - confirmed - estimated, 0);
              const total = allocated || 1;
              return (
                <button
                  key={ev.id}
                  className="eventrow"
                  style={{ width: "100%", textAlign: "left", border: "1px solid var(--line)", cursor: "pointer" }}
                  onClick={() => state.openDrawer("event", ev.id)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span className="name">{ev.name}</span>
                    <span className="nums tabular">
                      ${confirmed.toLocaleString()} / ${allocated.toLocaleString()}
                    </span>
                  </div>
                  <div className="track barstack">
                    <span style={{ width: (confirmed / total) * 100 + "%", background: "var(--good)" }} />
                    <span style={{ width: (estimated / total) * 100 + "%", background: "var(--pending)" }} />
                    <span style={{ width: (reserve / total) * 100 + "%", background: "var(--reserve)" }} />
                  </div>
                  <p className="note" style={{ marginTop: 8 }}>点击编辑预算数字</p>
                </button>
              );
            })
          : ["造型配饰", "场地", "餐饮/花艺", "摄影", "其他"].map((cat, idx) => {
              const vals = [[2800, 900], [5400, 2000], [980, 600], [3200, 1500], [600, 1200]][idx];
              const total = vals[0] + vals[1] + 500;
              return (
                <div key={cat} className="eventrow">
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span className="name">{cat}</span>
                    <span className="nums tabular">
                      ${vals[0].toLocaleString()} / ${total.toLocaleString()}
                    </span>
                  </div>
                  <div className="track barstack">
                    <span style={{ width: (vals[0] / total) * 100 + "%", background: "var(--good)" }} />
                    <span style={{ width: (vals[1] / total) * 100 + "%", background: "var(--pending)" }} />
                    <span style={{ width: (500 / total) * 100 + "%", background: "var(--reserve)" }} />
                  </div>
                </div>
              );
            })}
      </div>
      <FormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="添加供应商"
        onCreate={(values) => state.addVendor(values)}
        initialValues={{ quote: 0, is_rush: false, event_id: "" }}
        fields={[
          { key: "name", label: "名称", required: true, autoFocus: true },
          { key: "category", label: "类别" },
          { key: "quote", label: "报价 (USD)", type: "number" },
          { key: "is_rush", label: "加急", type: "checkbox" },
          { key: "deadline", label: "回复截止日期 (YYYY-MM-DD)" },
          {
            key: "event_id", label: "所属活动", type: "select",
            options: [{ value: "", label: "全局" }, ...state.events.map((ev) => ({ value: ev.id, label: ev.name }))],
          },
          { key: "contact", label: "联系人" },
          { key: "phone", label: "电话" },
          { key: "email", label: "邮箱" },
          { key: "next_step", label: "下一步行动", type: "textarea", rows: 2 },
          { key: "log", label: "沟通摘要", type: "textarea" },
        ]}
      />
    </div>
  );
}

/* ============ App ============ */
export default function BoardApp({ me: initialMe }) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const me = initialMe;

  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState(me ? [me] : []);
  const [events, setEvents] = useState([]);
  const [looks, setLooks] = useState([]);
  const [accessories, setAccessories] = useState([]);
  const [savedLooks, setSavedLooks] = useState([]);
  const [tryonResults, setTryonResults] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [photosByItem, setPhotosByItem] = useState({});
  const [tasks, setTasks] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [runOfShowNodes, setRunOfShowNodes] = useState([]);
  const [dailyTasks, setDailyTasks] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [messages, setMessages] = useState([]);
  const [weddingLog, setWeddingLog] = useState([]);

  // Kept in the URL (?tab=...), not just React state, so a reload — or a
  // bookmarked/shared link — lands back on the same section instead of
  // always resetting to 总览.
  const [tab, setTabState] = useState(() => {
    const t = searchParams.get("tab");
    return VALID_TABS.has(t) ? t : "overview";
  });
  const setTab = (next) => {
    setTabState(next);
    router.replace(`/board?tab=${next}`, { scroll: false });
  };
  const [rosTab, setRosTab] = useState("sf");
  const [invFilter, setInvFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [activityOpen, setActivityOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [eventJump, setEventJump] = useState("all");

  const requireAuth = useCallback(() => {
    if (!me) {
      router.push("/login");
      return false;
    }
    return true;
  }, [me, router]);

  const loadPhotos = useCallback(async () => {
    const { data: photoRows } = await supabase.from("inventory_photos").select("*").order("created_at");
    const grouped = {};
    (photoRows || []).forEach((p) => {
      const { data } = supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(p.storage_path);
      (grouped[p.item_id] ||= []).push({ id: p.id, storage_path: p.storage_path, url: data.publicUrl });
    });
    setPhotosByItem(grouped);
  }, [supabase]);

  const loadAll = useCallback(async () => {
    const [
      profilesRes, eventsRes, looksRes, accRes, savedRes, tryonRes,
      invRes, tasksRes, vendorsRes, nodesRes, dailyRes, activityRes, messagesRes, logRes,
    ] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("events").select("*").order("sort_order"),
      supabase.from("looks").select("*"),
      supabase.from("accessories").select("*"),
      supabase.from("saved_looks").select("*").order("created_at"),
      supabase.from("tryon_results").select("*").order("created_at", { ascending: false }),
      supabase.from("inventory_items").select("*"),
      supabase.from("tasks").select("*").order("updated_at", { ascending: false }),
      supabase.from("vendors").select("*"),
      supabase.from("run_of_show_nodes").select("*").order("sort_order"),
      supabase.from("daily_tasks").select("*").order("deadline", { ascending: true, nullsFirst: false }),
      supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(30),
      me ? supabase.from("messages").select("*").order("created_at") : Promise.resolve({ data: [] }),
      me ? supabase.from("wedding_log").select("*").order("created_at") : Promise.resolve({ data: [] }),
    ]);
    if (profilesRes.data?.length) setProfiles(profilesRes.data);
    if (eventsRes.data) setEvents(eventsRes.data);
    if (looksRes.data) setLooks(looksRes.data);
    if (accRes.data) setAccessories(accRes.data);
    if (savedRes.data) setSavedLooks(savedRes.data);
    if (tryonRes.data) setTryonResults(tryonRes.data);
    if (invRes.data) setInventory(invRes.data.map((i) => ({ ...i, occasions: i.occasions || [] })));
    if (tasksRes.data) setTasks(tasksRes.data);
    if (vendorsRes.data) setVendors(vendorsRes.data);
    if (nodesRes.data) setRunOfShowNodes(nodesRes.data);
    if (dailyRes.data) setDailyTasks(dailyRes.data);
    if (activityRes.data) setActivityLog(activityRes.data);
    if (messagesRes.data) setMessages(messagesRes.data);
    if (logRes.data) setWeddingLog(logRes.data);
    await loadPhotos();
    setLoading(false);
  }, [supabase, loadPhotos, me]);

  const logActivity = useCallback(
    async (summary) => {
      if (!me) return;
      await supabase.from("activity_log").insert({ actor: me.member_key, summary });
    },
    [supabase, me]
  );

  const sendMessage = async (body) => {
    if (!requireAuth()) return;
    const v = (body || "").trim();
    if (!v) return;
    const id = crypto.randomUUID();
    const row = { id, sender: me.member_key, body: v, created_at: new Date().toISOString() };
    setMessages((ms) => [...ms, row]);
    await supabase.from("messages").insert({ id, sender: me.member_key, body: v });
  };
  const deleteMessage = async (id) => {
    if (!requireAuth()) return;
    setMessages((ms) => ms.filter((m) => m.id !== id));
    await supabase.from("messages").delete().eq("id", id);
  };
  // `me` is frozen at first server render (see initialMe above), so its own
  // messages_read_at never updates — read the live copy from `profiles`
  // instead, which does get refreshed on every realtime sync.
  const myProfile = (me && profiles.find((p) => p.member_key === me.member_key)) || me;
  const hasUnreadMessages = !!me && messages.some(
    (m) => m.sender !== me.member_key && (!myProfile?.messages_read_at || new Date(m.created_at) > new Date(myProfile.messages_read_at))
  );
  const markMessagesRead = async () => {
    if (!me) return;
    const now = new Date().toISOString();
    setProfiles((ps) => ps.map((p) => (p.member_key === me.member_key ? { ...p, messages_read_at: now } : p)));
    await supabase.from("profiles").update({ messages_read_at: now }).eq("id", me.id);
  };

  const addLogEntry = async (content) => {
    if (!requireAuth()) return;
    const v = (content || "").trim();
    if (!v) return;
    const id = crypto.randomUUID();
    const now = new Date();
    const tzOffsetMin = -now.getTimezoneOffset();
    const wc = getWallClock(now.toISOString(), tzOffsetMin);
    const pad = (n) => String(n).padStart(2, "0");
    const row = {
      id, owner: me.member_key, content: v, is_private: false,
      created_at: now.toISOString(), tz_offset_min: tzOffsetMin,
      log_date: `${wc.y}-${pad(wc.mo + 1)}-${pad(wc.d)}`,
    };
    setWeddingLog((ls) => [...ls, row]);
    await supabase.from("wedding_log").insert(row);
  };
  const updateLogEntry = async (id, patch) => {
    if (!requireAuth()) return;
    setWeddingLog((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    await supabase.from("wedding_log").update(patch).eq("id", id);
  };
  const deleteLogEntry = async (id) => {
    if (!requireAuth()) return;
    const entry = weddingLog.find((l) => l.id === id);
    if (entry?.photo_path) await supabase.storage.from(PHOTOS_BUCKET).remove([entry.photo_path]);
    setWeddingLog((ls) => ls.filter((l) => l.id !== id));
    await supabase.from("wedding_log").delete().eq("id", id);
    closeDrawer();
  };
  const setLogPhoto = async (id, file) => {
    if (!requireAuth()) return;
    const prev = weddingLog.find((l) => l.id === id)?.photo_path;
    const ext = file.name.split(".").pop() || "jpg";
    const path = `log/${id}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from(PHOTOS_BUCKET).upload(path, file);
    if (upErr) return;
    if (prev) await supabase.storage.from(PHOTOS_BUCKET).remove([prev]);
    setWeddingLog((ls) => ls.map((l) => (l.id === id ? { ...l, photo_path: path } : l)));
    await supabase.from("wedding_log").update({ photo_path: path }).eq("id", id);
  };
  const removeLogPhoto = async (id) => {
    if (!requireAuth()) return;
    const prev = weddingLog.find((l) => l.id === id)?.photo_path;
    if (!prev) return;
    setWeddingLog((ls) => ls.map((l) => (l.id === id ? { ...l, photo_path: null } : l)));
    await supabase.storage.from(PHOTOS_BUCKET).remove([prev]);
    await supabase.from("wedding_log").update({ photo_path: null }).eq("id", id);
  };

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const reloadTimer = { current: null };
    const scheduleReload = () => {
      clearTimeout(reloadTimer.current);
      reloadTimer.current = setTimeout(loadAll, 400);
    };
    const channel = supabase
      .channel("board-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, scheduleReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "looks" }, scheduleReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "accessories" }, scheduleReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "saved_looks" }, scheduleReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "tryon_results" }, scheduleReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "inventory_items" }, scheduleReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "inventory_photos" }, scheduleReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, scheduleReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "vendors" }, scheduleReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "run_of_show_nodes" }, scheduleReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, scheduleReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_tasks" }, scheduleReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "activity_log" }, scheduleReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, scheduleReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "wedding_log" }, scheduleReload)
      .subscribe();
    return () => {
      clearTimeout(reloadTimer.current);
      supabase.removeChannel(channel);
    };
  }, [supabase, loadAll]);

  const nodesByEvent = useMemo(() => {
    const grouped = {};
    runOfShowNodes.forEach((n) => (grouped[n.event_id] ||= []).push(n));
    Object.values(grouped).forEach((list) => {
      const day = nodeDayFn(list);
      list.sort((a, b) => compareNodes(a, b, day));
    });
    return grouped;
  }, [runOfShowNodes]);
  // Public-bucket URLs are pure string templating, no network call — fine
  // to derive on every render, but memoized to avoid new object identity
  // on every keystroke elsewhere.
  const weddingLogWithPhotos = useMemo(
    () =>
      weddingLog.map((l) =>
        l.photo_path ? { ...l, photo_url: supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(l.photo_path).data.publicUrl } : l
      ),
    [weddingLog, supabase]
  );

  /* ---------- mutators: optimistic local update + Supabase write ---------- */
  const toggleBudgetTracking = async (id) => {
    if (!requireAuth()) return;
    const ev = events.find((e) => e.id === id);
    const next = !ev.budget_tracking;
    setEvents((es) => es.map((e) => (e.id === id ? { ...e, budget_tracking: next } : e)));
    await supabase.from("events").update({ budget_tracking: next }).eq("id", id);
    logActivity(`把「${ev.name}」的预算追踪${next ? "打开了" : "关闭了"}`);
  };
  const updateEvent = async (id, patch) => {
    if (!requireAuth()) return;
    setEvents((es) => es.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    await supabase.from("events").update(patch).eq("id", id);
  };
  const reorderEvent = async (id, direction) => {
    if (!requireAuth()) return;
    const sorted = [...events].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((e) => e.id === id);
    const swapIdx = idx + direction;
    if (idx === -1 || swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx], b = sorted[swapIdx];
    setEvents((es) =>
      es.map((e) => {
        if (e.id === a.id) return { ...e, sort_order: b.sort_order };
        if (e.id === b.id) return { ...e, sort_order: a.sort_order };
        return e;
      })
    );
    await supabase.from("events").update({ sort_order: b.sort_order }).eq("id", a.id);
    await supabase.from("events").update({ sort_order: a.sort_order }).eq("id", b.id);
  };

  const updateLook = async (id, patch) => {
    if (!requireAuth()) return;
    setLooks((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    await supabase.from("looks").update(patch).eq("id", id);
    // Keep the linked inventory row (created when this look was added) in sync on the
    // two fields that matter for budgeting — name and price.
    if ("price" in patch || "name" in patch || "is_private" in patch) {
      const linkedPatch = {};
      if ("price" in patch) linkedPatch.price_usd = patch.price;
      if ("name" in patch) linkedPatch.name = patch.name;
      if ("is_private" in patch) linkedPatch.is_private = patch.is_private;
      setInventory((is) => is.map((i) => (i.look_id === id ? { ...i, ...linkedPatch } : i)));
      await supabase.from("inventory_items").update(linkedPatch).eq("look_id", id);
    }
  };
  const toggleLookOccasion = async (id, evId) => {
    if (!requireAuth()) return;
    const look = looks.find((l) => l.id === id);
    const has = look.occasions.includes(evId);
    const occasions = has ? look.occasions.filter((o) => o !== evId) : [...look.occasions, evId];
    await updateLook(id, { occasions });
  };
  const addLookCandidate = async ({
    name, wearer, look_shape, price, silhouette, fabric, sheen,
    availability, alteration, occasions, notes, is_private,
  }) => {
    if (!requireAuth()) return;
    const id = crypto.randomUUID();
    const row = {
      id, name, wearer, look_shape: look_shape || "aline", added_by: me.member_key,
      subtitle: "", price: price || 0, silhouette: silhouette || "", fabric: fabric || "", sheen: sheen || "",
      availability: availability || "", alteration: alteration || "", occasions: occasions || [], notes: notes || "",
      is_private: !!is_private, owner: me.member_key,
    };
    setLooks((ls) => [...ls, row]);
    const { data } = await supabase.from("looks").insert(row).select().single();
    if (data) setLooks((ls) => ls.map((l) => (l.id === id ? data : l)));
    // Linked so it shows up in 物品清单 too — "选择中" since adding a candidate isn't
    // a purchase decision yet. updateLook keeps the name/price/privacy in sync afterward.
    const invId = crypto.randomUUID();
    const invRow = {
      id: invId, name, status: "pending", price_usd: price || 0, occasions: occasions || [],
      channel: "", added_by: me.member_key, notes: "", look_id: id,
      is_private: !!is_private, owner: me.member_key,
    };
    setInventory((is) => [...is, invRow]);
    await supabase.from("inventory_items").insert(invRow);
    logActivity(`添加了造型候选「${name}」`);
  };
  const deleteLookCandidate = async (id) => {
    if (!requireAuth()) return;
    const name = looks.find((l) => l.id === id)?.name || "";
    setLooks((ls) => ls.filter((l) => l.id !== id));
    await supabase.from("looks").delete().eq("id", id);
    closeDrawer();
    logActivity(`删除了造型候选「${name}」`);
  };

  const addAccessory = async ({ name, category, wearer, price, is_private }) => {
    if (!requireAuth()) return;
    const id = crypto.randomUUID();
    const row = { id, name, category, wearer, price, is_private: !!is_private, owner: me.member_key };
    setAccessories((as) => [...as, row]);
    await supabase.from("accessories").insert(row);
    // Linked so it also shows up in 物品清单, same as a look candidate does.
    const invId = crypto.randomUUID();
    const invRow = {
      id: invId, name, status: "pending", price_usd: price || 0, occasions: [],
      channel: "", added_by: me.member_key, notes: "", accessory_id: id,
      is_private: !!is_private, owner: me.member_key,
    };
    setInventory((is) => [...is, invRow]);
    await supabase.from("inventory_items").insert(invRow);
    logActivity(`添加了配饰「${name}」`);
  };
  const importInventoryAsLook = async (inventoryId, { wearer, look_shape }) => {
    if (!requireAuth()) return;
    const item = inventory.find((i) => i.id === inventoryId);
    if (!item) return;
    const lookId = crypto.randomUUID();
    const lookRow = {
      id: lookId, name: item.name, wearer: wearer || "ch", look_shape: look_shape || "aline", added_by: me.member_key,
      subtitle: "", price: item.price_usd || 0, silhouette: "", fabric: "", sheen: "",
      availability: "", alteration: "", occasions: item.occasions || [], notes: item.notes || "",
      is_private: item.is_private || false, owner: item.owner || me.member_key,
    };
    setLooks((ls) => [...ls, lookRow]);
    const { data } = await supabase.from("looks").insert(lookRow).select().single();
    if (data) setLooks((ls) => ls.map((l) => (l.id === lookId ? data : l)));
    setInventory((is) => is.map((i) => (i.id === inventoryId ? { ...i, look_id: lookId } : i)));
    await supabase.from("inventory_items").update({ look_id: lookId }).eq("id", inventoryId);
    logActivity(`把物品「${item.name}」导入为造型候选`);
  };
  const importInventoryAsAccessory = async (inventoryId, { wearer, category }) => {
    if (!requireAuth()) return;
    const item = inventory.find((i) => i.id === inventoryId);
    if (!item) return;
    const accId = crypto.randomUUID();
    const accRow = {
      id: accId, name: item.name, category: category || ACC_CATS[0].id, wearer: wearer || "ch", price: item.price_usd || 0,
      is_private: item.is_private || false, owner: item.owner || me.member_key,
    };
    setAccessories((as) => [...as, accRow]);
    await supabase.from("accessories").insert(accRow);
    setInventory((is) => is.map((i) => (i.id === inventoryId ? { ...i, accessory_id: accId } : i)));
    await supabase.from("inventory_items").update({ accessory_id: accId }).eq("id", inventoryId);
    logActivity(`把物品「${item.name}」导入为配饰`);
  };
  const importInventoryAsTask = async (inventoryId) => {
    if (!requireAuth()) return;
    const item = inventory.find((i) => i.id === inventoryId);
    if (!item) return;
    await addTask({
      title: `购买「${item.name}」`,
      tags: item.occasions || [],
      isPrivate: item.is_private,
      notes: item.notes || "",
    });
  };
  const deleteAccessory = async (id) => {
    if (!requireAuth()) return;
    const name = accessories.find((a) => a.id === id)?.name || "";
    setAccessories((as) => as.filter((a) => a.id !== id));
    await supabase.from("accessories").delete().eq("id", id);
    logActivity(`删除了配饰「${name}」`);
  };

  const updateInventory = async (id, patch) => {
    if (!requireAuth()) return;
    const item = inventory.find((i) => i.id === id);
    setInventory((is) => is.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    const { error } = await supabase.from("inventory_items").update(patch).eq("id", id);
    if (error) {
      if (item) setInventory((is) => is.map((i) => (i.id === id ? item : i)));
      alertSaveFailed(error);
      return;
    }
    // Mirror privacy onto whichever look/accessory this item is linked to —
    // they're the same thing, so hiding one hides both.
    if ("is_private" in patch && item) {
      if (item.look_id) {
        setLooks((ls) => ls.map((l) => (l.id === item.look_id ? { ...l, is_private: patch.is_private } : l)));
        await supabase.from("looks").update({ is_private: patch.is_private }).eq("id", item.look_id);
      }
      if (item.accessory_id) {
        setAccessories((as) => as.map((a) => (a.id === item.accessory_id ? { ...a, is_private: patch.is_private } : a)));
        await supabase.from("accessories").update({ is_private: patch.is_private }).eq("id", item.accessory_id);
      }
    }
  };
  const toggleInvOccasion = async (id, evId) => {
    if (!requireAuth()) return;
    const item = inventory.find((i) => i.id === id);
    const has = item.occasions.includes(evId);
    const occasions = has ? item.occasions.filter((o) => o !== evId) : [...item.occasions, evId];
    await updateInventory(id, { occasions });
  };
  const addInventoryItem = async ({ name, status, price_usd, occasions, channel, links, notes, create_look, wearer, look_shape, is_private }) => {
    if (!requireAuth()) return;
    const id = crypto.randomUUID();
    let lookId = null;
    if (create_look) {
      lookId = crypto.randomUUID();
      const lookRow = {
        id: lookId, name, wearer: wearer || "ch", look_shape: look_shape || "aline", added_by: me.member_key,
        subtitle: "", price: price_usd || 0, silhouette: "", fabric: "", sheen: "",
        availability: "", alteration: "", occasions: occasions || [], notes: notes || "",
        is_private: !!is_private, owner: me.member_key,
      };
      setLooks((ls) => [...ls, lookRow]);
      const { data } = await supabase.from("looks").insert(lookRow).select().single();
      if (data) setLooks((ls) => ls.map((l) => (l.id === lookId ? data : l)));
    }
    const row = {
      id, name, status: status || "to_buy", price_usd: price_usd || 0,
      occasions: occasions || [], channel: channel || "", added_by: me.member_key, notes: notes || "",
      ...(links?.length ? { links } : {}),
      look_id: lookId, is_private: !!is_private, owner: me.member_key,
    };
    setInventory((is) => [...is, row]);
    const { error } = await supabase.from("inventory_items").insert(row);
    if (error) {
      setInventory((is) => is.filter((i) => i.id !== id));
      alertSaveFailed(error);
      return;
    }
    logActivity(`添加了物品「${name}」${lookId ? "（同时创建了造型候选）" : ""}`);
  };
  const deleteInventoryItem = async (id) => {
    if (!requireAuth()) return;
    const name = inventory.find((i) => i.id === id)?.name || "";
    const paths = (photosByItem[id] || []).map((p) => p.storage_path);
    if (paths.length) await supabase.storage.from(PHOTOS_BUCKET).remove(paths);
    setInventory((is) => is.filter((i) => i.id !== id));
    await supabase.from("inventory_items").delete().eq("id", id);
    closeDrawer();
    logActivity(`删除了物品「${name}」`);
  };
  const addInventoryPhotos = async (itemId, files) => {
    if (!requireAuth()) return;
    for (const file of files) {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${itemId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(PHOTOS_BUCKET).upload(path, file);
      if (upErr) continue;
      await supabase.from("inventory_photos").insert({ item_id: itemId, storage_path: path });
    }
    await loadPhotos();
  };
  const removeInventoryPhoto = async (photo) => {
    if (!requireAuth()) return;
    setPhotosByItem((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => (next[k] = next[k].filter((p) => p.id !== photo.id)));
      return next;
    });
    await supabase.storage.from(PHOTOS_BUCKET).remove([photo.storage_path]);
    await supabase.from("inventory_photos").delete().eq("id", photo.id);
  };

  const updateTask = async (id, patch) => {
    if (!requireAuth()) return;
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    await supabase.from("tasks").update(patch).eq("id", id);
  };
  const toggleTaskDone = async (id) => {
    if (!requireAuth()) return;
    const t = tasks.find((x) => x.id === id);
    const nowDone = t.status !== "done";
    await updateTask(id, { status: nowDone ? "done" : "todo" });
    if (!t.is_private) logActivity(`把待办「${t.title}」标记为${nowDone ? "已完成" : "未完成"}`);
  };
  const addTask = async ({ title, deadline, tags, isPrivate, notes, assignee }) => {
    if (!requireAuth()) return;
    const { data } = await supabase
      .from("tasks")
      .insert({
        title, deadline: deadline || null, tags: tags || [], assignee: assignee || me.member_key,
        owner: me.member_key, event_id: null, status: "todo", is_private: !!isPrivate, notes: notes || "",
      })
      .select()
      .single();
    if (data) setTasks((ts) => [data, ...ts]);
    if (!isPrivate) logActivity(`添加了待办「${title}」`);
  };
  const deleteTask = async (id) => {
    if (!requireAuth()) return;
    const t = tasks.find((x) => x.id === id);
    setTasks((ts) => ts.filter((x) => x.id !== id));
    await supabase.from("tasks").delete().eq("id", id);
    closeDrawer();
    if (!t?.is_private) logActivity(`删除了待办「${t?.title}」`);
  };

  const updateVendor = async (id, patch) => {
    if (!requireAuth()) return;
    setVendors((vs) => vs.map((v) => (v.id === id ? { ...v, ...patch } : v)));
    await supabase.from("vendors").update(patch).eq("id", id);
  };
  const addVendor = async ({ name, category, quote, is_rush, deadline, event_id, contact, phone, email, next_step, log: logText }) => {
    if (!requireAuth()) return;
    const id = crypto.randomUUID();
    const row = {
      id, name, category: category || "", quote: quote || 0, is_rush: !!is_rush,
      deadline: deadline || null, event_id: event_id || null, next_step: next_step || "",
      log: logText || "", contact: contact || "", phone: phone || "", email: email || "",
    };
    setVendors((vs) => [...vs, row]);
    await supabase.from("vendors").insert(row);
    logActivity(`添加了供应商「${name}」`);
  };
  const deleteVendor = async (id) => {
    if (!requireAuth()) return;
    const name = vendors.find((v) => v.id === id)?.name || "";
    setVendors((vs) => vs.filter((v) => v.id !== id));
    await supabase.from("vendors").delete().eq("id", id);
    closeDrawer();
    logActivity(`删除了供应商「${name}」`);
  };

  const updateNode = async (id, patch) => {
    if (!requireAuth()) return;
    setRunOfShowNodes((ns) => ns.map((n) => (n.id === id ? { ...n, ...patch } : n)));
    await supabase.from("run_of_show_nodes").update(patch).eq("id", id);
  };
  const addNode = async (eventId, { title, time_label, location, notes, node_date }) => {
    if (!requireAuth()) return;
    const existing = nodesByEvent[eventId] || [];
    const sortOrder = existing.length ? Math.max(...existing.map((n) => n.sort_order)) + 1 : 1;
    const { data } = await supabase
      .from("run_of_show_nodes")
      .insert({
        event_id: eventId, title, time_label: time_label || "", location: location || "",
        responsible: me.member_key, notes: notes || "", sort_order: sortOrder, node_date: node_date || null,
      })
      .select()
      .single();
    if (data) setRunOfShowNodes((ns) => [...ns, data]);
    logActivity(`在流程里添加了环节「${title}」`);
  };
  const deleteNode = async (id) => {
    if (!requireAuth()) return;
    const title = runOfShowNodes.find((n) => n.id === id)?.title || "";
    setRunOfShowNodes((ns) => ns.filter((n) => n.id !== id));
    await supabase.from("run_of_show_nodes").delete().eq("id", id);
    closeDrawer();
    logActivity(`删除了流程环节「${title}」`);
  };

  const createSavedLook = async ({ lookId, accessoryIds, occasion }) => {
    if (!requireAuth()) return;
    const name = `造型 #${savedLooks.length + 1}`;
    const { data } = await supabase
      .from("saved_looks")
      .insert({ name, look_id: lookId, accessory_ids: accessoryIds, occasion })
      .select()
      .single();
    if (data) setSavedLooks((ls) => [...ls, data]);
    logActivity(`保存了一张造型卡「${name}」`);
  };
  const deleteSavedLook = async (id) => {
    if (!requireAuth()) return;
    const name = savedLooks.find((l) => l.id === id)?.name || "";
    setSavedLooks((ls) => ls.filter((l) => l.id !== id));
    await supabase.from("saved_looks").delete().eq("id", id);
    closeDrawer();
    logActivity(`删除了造型卡「${name}」`);
  };
  const addTryon = async ({ lookName, accessoryNames }) => {
    if (!requireAuth()) return;
    const { data } = await supabase
      .from("tryon_results")
      .insert({ look_name: lookName, accessory_names: accessoryNames, created_by: me.member_key })
      .select()
      .single();
    if (data) setTryonResults((rs) => [data, ...rs]);
  };

  const addDailyTask = async ({ title, deadline, tags, isPrivate, notes, assignee }) => {
    if (!requireAuth()) return;
    const { data } = await supabase
      .from("daily_tasks")
      .insert({
        title, deadline: deadline || null, tags: tags || [], owner: me.member_key,
        assignee: assignee || me.member_key, status: "todo", is_private: !!isPrivate, notes: notes || "",
      })
      .select()
      .single();
    if (data) setDailyTasks((ts) => [...ts, data]);
    if (!isPrivate) logActivity(`添加了日常待办「${title}」`);
  };
  const updateDailyTask = async (id, patch) => {
    if (!requireAuth()) return;
    setDailyTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    await supabase.from("daily_tasks").update(patch).eq("id", id);
  };
  const toggleDailyTaskDone = async (id) => {
    if (!requireAuth()) return;
    const t = dailyTasks.find((x) => x.id === id);
    const nowDone = t.status !== "done";
    await updateDailyTask(id, { status: nowDone ? "done" : "todo" });
    if (!t.is_private) logActivity(`把日常待办「${t.title}」标记为${nowDone ? "已完成" : "未完成"}`);
  };
  const deleteDailyTask = async (id) => {
    if (!requireAuth()) return;
    const t = dailyTasks.find((x) => x.id === id);
    setDailyTasks((ts) => ts.filter((x) => x.id !== id));
    await supabase.from("daily_tasks").delete().eq("id", id);
    closeDrawer();
    if (!t?.is_private) logActivity(`删除了日常待办「${t?.title}」`);
  };

  const openDrawer = (type, id) => {
    setSelected({ type, id });
    setActivityOpen(false);
  };
  const closeDrawer = () => setSelected(null);
  const goToRunOfShow = (evId) => {
    setRosTab(evId);
    setTab("runofshow");
  };
  const jumpToEventSection = (tabName, evId) => {
    setEventJump(evId);
    setTab(tabName);
    closeDrawer();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const state = {
    me,
    events,
    looks,
    accessories,
    savedLooks,
    tryonResults,
    inventory,
    photosByItem,
    tasks,
    vendors,
    runOfShowNodes,
    nodesByEvent,
    dailyTasks,
    toggleBudgetTracking,
    updateEvent,
    reorderEvent,
    updateLook,
    toggleLookOccasion,
    addLookCandidate,
    deleteLookCandidate,
    addAccessory,
    deleteAccessory,
    importInventoryAsLook,
    importInventoryAsAccessory,
    importInventoryAsTask,
    updateInventory,
    toggleInvOccasion,
    addInventoryItem,
    deleteInventoryItem,
    addInventoryPhotos,
    removeInventoryPhoto,
    updateTask,
    toggleTaskDone,
    addTask,
    deleteTask,
    updateVendor,
    addVendor,
    deleteVendor,
    updateNode,
    addNode,
    deleteNode,
    createSavedLook,
    deleteSavedLook,
    addTryon,
    addDailyTask,
    updateDailyTask,
    toggleDailyTaskDone,
    deleteDailyTask,
    weddingLog: weddingLogWithPhotos,
    addLogEntry,
    updateLogEntry,
    deleteLogEntry,
    setLogPhoto,
    removeLogPhoto,
    openDrawer,
    jumpToEventSection,
  };

  if (loading) {
    return <div className="loading-state">正在加载婚礼工作台…</div>;
  }

  return (
    <MembersCtx.Provider value={profiles}>
      <Topbar
        tab={tab}
        setTab={setTab}
        me={me}
        onSignOut={handleSignOut}
        hasUnreadMessages={hasUnreadMessages}
        onToggleActivity={() => {
          setActivityOpen((v) => !v);
          setSelected(null);
        }}
        onToggleChat={() => {
          setChatOpen((v) => !v);
          setSelected(null);
        }}
      />
      {tab === "overview" && <Overview state={state} setTab={setTab} setInvFilter={setInvFilter} goToRunOfShow={goToRunOfShow} />}
      {tab === "tasks" && <Tasks state={state} initialTag={eventJump} />}
      {tab === "inventory" && <Inventory state={state} invFilter={invFilter} setInvFilter={setInvFilter} initialEventFilter={eventJump} />}
      {tab === "lookbook" && <Lookbook state={state} />}
      {tab === "runofshow" && <RunOfShow state={state} evTab={rosTab} setEvTab={setRosTab} />}
      {tab === "vendors" && <VendorsBudget state={state} initialEventFilter={eventJump} />}
      {tab === "daily" && <Daily state={state} />}
      {tab === "log" && <WeddingLog state={state} />}
      <footer>H.S. &amp; C.H. · 云端工作台 · 公开可看，登录后才能修改</footer>
      <Drawer selected={selected} onClose={closeDrawer} state={state} />
      <ActivityPanel open={activityOpen} onClose={() => setActivityOpen(false)} log={activityLog} />
      <ChatPanel
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        messages={messages}
        me={me}
        onSend={sendMessage}
        onDelete={deleteMessage}
        onMarkRead={markMessagesRead}
      />
    </MembersCtx.Provider>
  );
}
