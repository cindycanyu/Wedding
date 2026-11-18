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
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
const STATUS_META = {
  pending: { label: "选择中", color: "var(--pending)" },
  to_buy: { label: "待购买", color: "var(--neutral2)" },
  purchased: { label: "已购买", color: "var(--good)" },
};
const STATUS_ICON = { pending: "question", purchased: "check", to_buy: "cart" };
const TASK_STATUS = { todo: "待处理", doing: "进行中", done: "已完成" };
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
function DeadlineBadge({ deadline, done }) {
  if (done) return <span className="statuspill done">已完成</span>;
  if (!deadline) return <span className="tmeta">无截止日期</span>;
  const days = daysUntil(deadline);
  if (days === null) return null;
  if (days < 0) return <span className="countdown">已超期 {-days} 天</span>;
  if (days === 0) return <span className="countdown">今天到期</span>;
  if (days <= 3) return <span className="countdown">还剩 {days} 天</span>;
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
function QuickAddRow({ placeholder, onCreate, me, children, buttonLabel = "添加" }) {
  const [title, setTitle] = useState("");
  if (!me) return null;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onCreate(title.trim());
        setTitle("");
      }}
      style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={placeholder}
        style={{ flex: "1 1 180px", border: "1px solid var(--line)", borderRadius: 10, padding: "9px 11px", fontSize: 13.5, background: "var(--blush)", color: "var(--plum)" }}
      />
      {children}
      <button className="btn btn-primary" type="submit">
        <Icon name="plus" size={13} /> {buttonLabel}
      </button>
    </form>
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
  const [zoomSrc, setZoomSrc] = useState(null);
  const profiles = useProfiles();
  if (!selected) return null;
  const { type, id } = selected;
  let content = null,
    title = "",
    sub = "";
  const tagSuggestionPool = [...new Set([...state.tasks, ...state.dailyTasks].flatMap((x) => x.tags || []))];

  const onPhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    state.addInventoryPhotos(id, files);
    e.target.value = "";
  };

  if (type === "event") {
    const ev = state.events.find((x) => x.id === id);
    title = ev.name;
    sub = ev.en;
    const relTasks = state.tasks.filter((t) => (t.tags || []).includes(id));
    const relInventory = state.inventory.filter((i) => i.occasions.includes(id));
    const relVendors = state.vendors.filter((v) => v.event_id === id);
    content = (
      <>
        <div className="drawer-cover">
          <Cover type={ev.cover} />
        </div>
        <div className="field">
          <label>名称</label>
          <input value={ev.name} onChange={(e) => state.updateEvent(id, { name: e.target.value })} />
        </div>
        <div className="rowfields">
          <div className="field">
            <label>英文 / 简称</label>
            <input value={ev.en} onChange={(e) => state.updateEvent(id, { en: e.target.value })} />
          </div>
          <div className="field">
            <label>状态标签</label>
            <input value={ev.status_label} onChange={(e) => state.updateEvent(id, { status_label: e.target.value })} />
          </div>
        </div>
        <div className="field">
          <label>日期 / 地点</label>
          <input value={ev.date_label} onChange={(e) => state.updateEvent(id, { date_label: e.target.value })} />
        </div>
        <div className="field">
          <label>说明</label>
          <textarea rows="3" value={ev.description} onChange={(e) => state.updateEvent(id, { description: e.target.value })} />
        </div>
        <div className="field">
          <label>证婚人（没有就留空）</label>
          <input value={ev.witness_name || ""} onChange={(e) => state.updateEvent(id, { witness_name: e.target.value || null })} />
        </div>
        <div className="field">
          <label>整体进度</label>
          <RingProgress value={ev.progress} size={60} />
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
                <input
                  type="number"
                  value={ev.budget_allocated}
                  onChange={(e) => state.updateEvent(id, { budget_allocated: +e.target.value || 0 })}
                />
              </div>
              <div className="field">
                <label>已确认支出 (USD)</label>
                <input
                  type="number"
                  value={ev.budget_confirmed}
                  onChange={(e) => state.updateEvent(id, { budget_confirmed: +e.target.value || 0 })}
                />
              </div>
            </div>
            <div className="field">
              <label>预估待支出 (USD)</label>
              <input
                type="number"
                value={ev.budget_estimated}
                onChange={(e) => state.updateEvent(id, { budget_estimated: +e.target.value || 0 })}
              />
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
    title = d.name;
    sub = d.subtitle;
    content = (
      <>
        <div className="drawer-cover">
          <LookSilhouette look={d.look_shape} />
        </div>
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
            <input value={d.price} onChange={(e) => state.updateLook(id, { price: +e.target.value || 0 })} />
          </div>
          <div className="field">
            <label>版型</label>
            <input value={d.silhouette} onChange={(e) => state.updateLook(id, { silhouette: e.target.value })} />
          </div>
        </div>
        <div className="rowfields">
          <div className="field">
            <label>面料</label>
            <input value={d.fabric} onChange={(e) => state.updateLook(id, { fabric: e.target.value })} />
          </div>
          <div className="field">
            <label>光泽度</label>
            <input value={d.sheen} onChange={(e) => state.updateLook(id, { sheen: e.target.value })} />
          </div>
        </div>
        <div className="rowfields">
          <div className="field">
            <label>现货 / 加急周期</label>
            <input value={d.availability} onChange={(e) => state.updateLook(id, { availability: e.target.value })} />
          </div>
          <div className="field">
            <label>改衣预估</label>
            <input value={d.alteration} onChange={(e) => state.updateLook(id, { alteration: e.target.value })} />
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
          <textarea rows="3" value={d.notes} onChange={(e) => state.updateLook(id, { notes: e.target.value })} />
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
          <input value={it.name} onChange={(e) => state.updateInventory(id, { name: e.target.value })} />
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
        {it.status === "purchased" && (
          <div className="field">
            <label>实物照片</label>
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
        )}
        <div className="rowfields">
          <div className="field">
            <label>价格 (USD)</label>
            <input
              type="number"
              value={it.price_usd}
              onChange={(e) => state.updateInventory(id, { price_usd: +e.target.value || 0 })}
            />
          </div>
          <div className="field">
            <label>价格 (CNY · 汇率 {RATE})</label>
            <input
              type="number"
              value={Math.round(it.price_usd * RATE)}
              onChange={(e) => state.updateInventory(id, { price_usd: (+e.target.value || 0) / RATE })}
            />
          </div>
        </div>
        <div className="field">
          <label>购买渠道</label>
          <input value={it.channel} onChange={(e) => state.updateInventory(id, { channel: e.target.value })} />
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
          <textarea rows="3" value={it.notes} onChange={(e) => state.updateInventory(id, { notes: e.target.value })} />
        </div>
        {it.status !== "purchased" && (
          <p className="note">提示：该物品尚未标记为「已购买」，因此不计入已确认支出预算。</p>
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
          <input value={t.title} onChange={(e) => state.updateTask(id, { title: e.target.value })} />
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
          <textarea rows="4" value={t.notes} onChange={(e) => state.updateTask(id, { notes: e.target.value })} />
        </div>
        {state.me && <DeleteButton onDelete={() => state.deleteTask(id)} />}
      </>
    );
  }

  if (type === "node") {
    const n = state.runOfShowNodes.find((x) => x.id === id);
    title = n.title;
    sub = n.time_label;
    content = (
      <>
        <div className="rowfields">
          <div className="field">
            <label>时间</label>
            <input value={n.time_label} onChange={(e) => state.updateNode(id, { time_label: e.target.value })} />
          </div>
          <div className="field">
            <label>标题</label>
            <input value={n.title} onChange={(e) => state.updateNode(id, { title: e.target.value })} />
          </div>
        </div>
        <div className="field">
          <label>地点</label>
          <input value={n.location} onChange={(e) => state.updateNode(id, { location: e.target.value })} />
        </div>
        <div className="field">
          <label>负责人</label>
          <input value={n.responsible} onChange={(e) => state.updateNode(id, { responsible: e.target.value })} placeholder="hs / ch / 或填写姓名" />
        </div>
        <div className="field">
          <label>执行细节 / 注意事项</label>
          <textarea rows="3" value={n.notes} onChange={(e) => state.updateNode(id, { notes: e.target.value })} />
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
            <input value={v.name} onChange={(e) => state.updateVendor(id, { name: e.target.value })} />
          </div>
          <div className="field">
            <label>类别</label>
            <input value={v.category} onChange={(e) => state.updateVendor(id, { category: e.target.value })} />
          </div>
        </div>
        <div className="rowfields">
          <div className="field">
            <label>报价 (USD)</label>
            <input type="number" value={v.quote} onChange={(e) => state.updateVendor(id, { quote: +e.target.value || 0 })} />
          </div>
          <div className="field">
            <label>回复截止日期</label>
            <input value={v.deadline || ""} onChange={(e) => state.updateVendor(id, { deadline: e.target.value })} />
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
            <input value={v.contact} onChange={(e) => state.updateVendor(id, { contact: e.target.value })} />
          </div>
          <div className="field">
            <label>电话</label>
            <input value={v.phone} onChange={(e) => state.updateVendor(id, { phone: e.target.value })} />
          </div>
        </div>
        <div className="field">
          <label>邮箱</label>
          <input value={v.email} onChange={(e) => state.updateVendor(id, { email: e.target.value })} />
        </div>
        <div className="field">
          <label>沟通摘要</label>
          <textarea rows="3" value={v.log} onChange={(e) => state.updateVendor(id, { log: e.target.value })} />
        </div>
        <div className="field">
          <label>下一步行动</label>
          <textarea rows="2" value={v.next_step} onChange={(e) => state.updateVendor(id, { next_step: e.target.value })} />
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
          <input value={d.title} onChange={(e) => state.updateDailyTask(id, { title: e.target.value })} />
        </div>
        <div className="rowfields">
          <div className="field">
            <label>截止日期</label>
            <input type="date" value={d.deadline || ""} onChange={(e) => state.updateDailyTask(id, { deadline: e.target.value || null })} />
          </div>
          <div className="field">
            <label>状态</label>
            <select value={d.status} onChange={(e) => state.updateDailyTask(id, { status: e.target.value })}>
              <option value="todo">待处理</option>
              <option value="done">已完成</option>
            </select>
          </div>
        </div>
        <TagEditor
          tags={d.tags || []}
          onChange={(tags) => state.updateDailyTask(id, { tags })}
          events={state.events}
          suggestions={tagSuggestionPool}
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
          <textarea rows="3" value={d.notes} onChange={(e) => state.updateDailyTask(id, { notes: e.target.value })} />
        </div>
        {state.me && <DeleteButton onDelete={() => state.deleteDailyTask(id)} />}
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

/* ============ Topbar ============ */
function Topbar({ tab, setTab, me, onSignOut, onToggleActivity }) {
  const tabs = [
    ["overview", "总览"],
    ["tasks", "待办"],
    ["inventory", "物品清单"],
    ["lookbook", "造型"],
    ["runofshow", "当天流程"],
    ["vendors", "供应商 & 预算"],
    ["daily", "Daily"],
  ];
  return (
    <div className="topbar">
      <div className="wrap topbar-inner">
        <div className="brandmark">
          <div className="mono serif">H·C</div>
          <div className="brand-text">
            <span className="name">H.S. &amp; C.H.</span>
            <span className="sub">Wedding Workbook</span>
          </div>
        </div>
        <div className="navtabs">
          {tabs.map(([k, label]) => (
            <button key={k} className={"tab" + (tab === k ? " active" : "")} onClick={() => setTab(k)}>
              {label}
            </button>
          ))}
        </div>
        <button className="chip" onClick={onToggleActivity} title="最近动态">
          <Icon name="bell" size={12} /> 动态
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
    const c = { to_buy: 0, purchased: 0 };
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
        <div className="grid g3">
          {state.events.map((ev) => (
            <button key={ev.id} className="card" onClick={() => state.openDrawer("event", ev.id)}>
              <div className="card-cover">
                <Cover type={ev.cover} />
                <span className={"corner-badge badge " + ev.status}>{ev.status_label}</span>
                <span className="corner-ring">
                  <RingProgress value={ev.progress} size={44} />
                </span>
              </div>
              <div className="card-body">
                <div className="card-title">{ev.name}</div>
                <div className="card-sub">
                  {ev.en} · {ev.date_label}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <h2>婚礼当天流程</h2>
          <span className="meta">点击进入完整时间轴</span>
        </div>
        <div className="grid g3">
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
                    {first ? `${first.time_label} · ${first.title}` : "日程待添加"}
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
        <div className="grid g3" style={{ alignItems: "start" }}>
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
          <div className="grid g4" style={{ gridColumn: "span 2" }}>
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

  const [newLookShape, setNewLookShape] = useState("aline");
  const [newAccPrice, setNewAccPrice] = useState("");
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
        accessoryNames: tryonAcc.map((a) => state.accessories.find((x) => x.id === a).name),
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
          <QuickAddRow
            placeholder={`新造型名称，比如 ${wearerKey === "ch" ? "Juliet" : "Windsor"}`}
            buttonLabel="添加造型"
            me={state.me}
            onCreate={(name) => state.addLookCandidate({ name, wearer: wearerKey, lookShape: newLookShape })}
          >
            <select value={newLookShape} onChange={(e) => setNewLookShape(e.target.value)}>
              {LOOK_SHAPES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </QuickAddRow>
        )}
        {zoneLooks.length === 0 ? (
          <div className="empty-state">还没有造型候选，用上面的框添加一个</div>
        ) : (
          <div className="grid g3">
            {zoneLooks.map((d) => (
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
                  <LookSilhouette look={d.look_shape} />
                  {lookSel.selMode && (
                    <span className="corner-ring">
                      <SelectCheckbox checked={lookSel.selected.has(d.id)} />
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
            ))}
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
              <QuickAddRow
                placeholder="新配饰名称"
                buttonLabel="添加配饰"
                me={state.me}
                onCreate={(name) =>
                  state.addAccessory({ name, category: activeCat, wearer: builderWearer, price: +newAccPrice || 0 })
                }
              >
                <input
                  type="number"
                  placeholder="价格"
                  value={newAccPrice}
                  onChange={(e) => setNewAccPrice(e.target.value)}
                  style={{ width: 90, border: "1px solid var(--line)", borderRadius: 10, padding: "9px 11px", fontSize: 13.5, background: "var(--blush)" }}
                />
              </QuickAddRow>
            )}
            <div className="acc-grid">
              {state.accessories
                .filter((a) => a.category === activeCat && a.wearer === builderWearer)
                .map((a) => (
                  <div key={a.id} style={{ position: "relative" }}>
                    <button className={"acc-card" + (builderAcc.includes(a.id) ? " sel" : "")} onClick={() => toggleBuilderAcc(a.id)}>
                      {builderAcc.includes(a.id) && (
                        <span className="sel-check">
                          <Icon name="check" size={12} color="#fff" />
                        </span>
                      )}
                      <div className="acc-cover">
                        <AccIllustration cat={a.category} />
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
                ))}
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
    </div>
  );
}

/* ============ Inventory page ============ */
function Inventory({ state, invFilter, setInvFilter, initialEventFilter }) {
  const [occFilter, setOccFilter] = useState(initialEventFilter || "all");
  const { selMode, selected, toggle, toggleMode, reset } = useMultiSelect();
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
    (i) => (invFilter === "all" || i.status === invFilter) && (occFilter === "all" || i.occasions.includes(occFilter))
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
          <span className="meta">未确认购买的物品不计入已购预算</span>
        </div>
        <MultiSelectBar me={state.me} selMode={selMode} count={selected.size} onToggleMode={toggleMode} onDelete={bulkDelete} />
        <QuickAddRow placeholder="新物品名称" buttonLabel="添加物品" me={state.me} onCreate={(name) => state.addInventoryItem(name)} />
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
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============ Tasks page ============ */
function TaskTagChips({ tags, events }) {
  if (!tags || tags.length === 0) return <span className="tmeta">无标签</span>;
  return (
    <span style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {tags.map((t) => (
        <span key={t} className="tmeta" style={{ background: "var(--champagne)", borderRadius: 999, padding: "2px 8px" }}>
          {tagLabel(t, events)}
        </span>
      ))}
    </span>
  );
}

function Tasks({ state, initialTag }) {
  const [tagFilter, setTagFilter] = useState(initialTag || "all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const profiles = useProfiles();
  const { selMode, selected, toggle, toggleMode, reset } = useMultiSelect();
  const [addOpen, setAddOpen] = useState(false);
  const tagPool = [...new Set([...state.events.map((e) => e.id), ...state.tasks.flatMap((t) => t.tags || [])])];
  // RLS already hides other people's private tasks server-side — no client-side privacy filter needed.
  const visible = state.tasks.filter((t) => {
    if (tagFilter !== "all" && !(t.tags || []).includes(tagFilter)) return false;
    if (assigneeFilter !== "all" && t.assignee !== assigneeFilter) return false;
    return true;
  });
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
                className="taskrow"
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
    </div>
  );
}

/* ============ Daily page ============ */
function Daily({ state }) {
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const profiles = useProfiles();
  const { selMode, selected, toggle, toggleMode, reset } = useMultiSelect();
  const [addOpen, setAddOpen] = useState(false);
  const tagPool = [...new Set([...state.events.map((e) => e.id), ...state.dailyTasks.flatMap((t) => t.tags || [])])];
  const visible = state.dailyTasks.filter((t) => {
    if (ownerFilter !== "all" && t.owner !== ownerFilter) return false;
    if (tagFilter !== "all" && !(t.tags || []).includes(tagFilter)) return false;
    return true;
  });
  const sorted = [...visible].sort((a, b) => {
    if (!a.deadline && !b.deadline) return 0;
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return a.deadline.localeCompare(b.deadline);
  });
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
          <button className={"chip" + (ownerFilter === "all" ? " on" : "")} onClick={() => setOwnerFilter("all")}>
            全部
          </button>
          {profiles.map((m) => (
            <button key={m.member_key} className={"chip" + (ownerFilter === m.member_key ? " on" : "")} onClick={() => setOwnerFilter(m.member_key)}>
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
                className="taskrow"
                role="button"
                tabIndex={0}
                style={{ borderLeft: "6px solid " + (memberOf(profiles, t.owner)?.bg_color || "var(--line)") }}
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
                <Avatar id={t.owner} />
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
              </div>
            );
          })}
        </div>
      </div>
      <AddItemModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreate={state.addDailyTask}
        events={state.events}
        tagSuggestions={tagPool}
        showAssignee={false}
        defaultAssignee={state.me?.member_key}
        suggestedTag={tagFilter !== "all" ? tagFilter : null}
      />
    </div>
    </div>
  );
}

/* ============ Run of Show page ============ */
function RunOfShow({ state, evTab, setEvTab }) {
  const nodes = state.nodesByEvent[evTab] || [];
  const ev = state.events.find((e) => e.id === evTab);
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
        <QuickAddRow
          placeholder="新环节标题"
          buttonLabel="添加环节"
          me={state.me}
          onCreate={(title) => state.addNode(evTab, title)}
        />
        {nodes.length === 0 ? (
          <div className="empty-state">还没有流程节点</div>
        ) : (
          <div className="timeline">
            {nodes.map((n) => (
              <div key={n.id} className="tnode" onClick={() => state.openDrawer("node", n.id)}>
                <span className="dot">
                  <Icon name="pin" size={11} color="#fff" />
                </span>
                <div className="card2">
                  <div className="time tabular">{n.time_label}</div>
                  <div className="ttl">{n.title}</div>
                  <div className="loc">{n.location}</div>
                  <div style={{ marginTop: 8 }}>
                    <Avatar id={n.responsible} size={22} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {ev?.status === "tbd" && <p className="note" style={{ marginTop: 12 }}>该活动日程仍为草稿，细节确认后将同步更新。</p>}
      </div>
    </div>
  );
}

/* ============ Vendors & Budget page ============ */
function VendorsBudget({ state, initialEventFilter }) {
  const [groupBy, setGroupBy] = useState("event");
  const [vendorEvFilter, setVendorEvFilter] = useState(initialEventFilter || "all");
  const { selMode, selected, toggle, toggleMode, reset } = useMultiSelect();
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
        <MultiSelectBar me={state.me} selMode={selMode} count={selected.size} onToggleMode={toggleMode} onDelete={bulkDelete} />
        <QuickAddRow placeholder="新供应商名称" buttonLabel="添加供应商" me={state.me} onCreate={(name) => state.addVendor(name)} />
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
    </div>
  );
}

/* ============ App ============ */
export default function BoardApp({ me: initialMe }) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
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

  const [tab, setTab] = useState("overview");
  const [rosTab, setRosTab] = useState("sf");
  const [invFilter, setInvFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [activityOpen, setActivityOpen] = useState(false);
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
      invRes, tasksRes, vendorsRes, nodesRes, dailyRes, activityRes,
    ] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("events").select("*"),
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
    await loadPhotos();
    setLoading(false);
  }, [supabase, loadPhotos]);

  const logActivity = useCallback(
    async (summary) => {
      if (!me) return;
      await supabase.from("activity_log").insert({ actor: me.member_key, summary });
    },
    [supabase, me]
  );

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
      .subscribe();
    return () => {
      clearTimeout(reloadTimer.current);
      supabase.removeChannel(channel);
    };
  }, [supabase, loadAll]);

  const nodesByEvent = useMemo(() => {
    const grouped = {};
    runOfShowNodes.forEach((n) => (grouped[n.event_id] ||= []).push(n));
    return grouped;
  }, [runOfShowNodes]);

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

  const updateLook = async (id, patch) => {
    if (!requireAuth()) return;
    setLooks((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    await supabase.from("looks").update(patch).eq("id", id);
    // Keep the linked inventory row (created when this look was added) in sync on the
    // two fields that matter for budgeting — name and price.
    if ("price" in patch || "name" in patch) {
      const linkedPatch = {};
      if ("price" in patch) linkedPatch.price_usd = patch.price;
      if ("name" in patch) linkedPatch.name = patch.name;
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
  const addLookCandidate = async ({ name, wearer, lookShape }) => {
    if (!requireAuth()) return;
    const id = crypto.randomUUID();
    const row = {
      id, name, wearer, look_shape: lookShape, added_by: me.member_key,
      subtitle: "", price: 0, silhouette: "", fabric: "", sheen: "",
      availability: "", alteration: "", occasions: [], notes: "",
    };
    setLooks((ls) => [...ls, row]);
    const { data } = await supabase.from("looks").insert(row).select().single();
    if (data) setLooks((ls) => ls.map((l) => (l.id === id ? data : l)));
    // Linked so it shows up in 物品清单 too — "待定" since adding a candidate isn't
    // a purchase decision yet. updateLook keeps the name/price in sync afterward.
    const invId = crypto.randomUUID();
    const invRow = {
      id: invId, name, status: "pending", price_usd: 0, occasions: [],
      channel: "", added_by: me.member_key, notes: "", look_id: id,
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

  const addAccessory = async ({ name, category, wearer, price }) => {
    if (!requireAuth()) return;
    const id = crypto.randomUUID();
    const row = { id, name, category, wearer, price };
    setAccessories((as) => [...as, row]);
    await supabase.from("accessories").insert(row);
    logActivity(`添加了配饰「${name}」`);
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
    setInventory((is) => is.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    await supabase.from("inventory_items").update(patch).eq("id", id);
  };
  const toggleInvOccasion = async (id, evId) => {
    if (!requireAuth()) return;
    const item = inventory.find((i) => i.id === id);
    const has = item.occasions.includes(evId);
    const occasions = has ? item.occasions.filter((o) => o !== evId) : [...item.occasions, evId];
    await updateInventory(id, { occasions });
  };
  const addInventoryItem = async (name) => {
    if (!requireAuth()) return;
    const id = crypto.randomUUID();
    const row = { id, name, status: "to_buy", price_usd: 0, occasions: [], channel: "", added_by: me.member_key, notes: "" };
    setInventory((is) => [...is, row]);
    await supabase.from("inventory_items").insert(row);
    logActivity(`添加了物品「${name}」`);
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
  const addVendor = async (name) => {
    if (!requireAuth()) return;
    const id = crypto.randomUUID();
    const row = { id, name, category: "", quote: 0, is_rush: false, event_id: null, next_step: "", log: "", contact: "", phone: "", email: "" };
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
  const addNode = async (eventId, title) => {
    if (!requireAuth()) return;
    const existing = nodesByEvent[eventId] || [];
    const sortOrder = existing.length ? Math.max(...existing.map((n) => n.sort_order)) + 1 : 1;
    const { data } = await supabase
      .from("run_of_show_nodes")
      .insert({ event_id: eventId, title, time_label: "", location: "", responsible: me.member_key, notes: "", sort_order: sortOrder })
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

  const addDailyTask = async ({ title, deadline, tags, isPrivate, notes }) => {
    if (!requireAuth()) return;
    const { data } = await supabase
      .from("daily_tasks")
      .insert({
        title, deadline: deadline || null, tags: tags || [], owner: me.member_key,
        status: "todo", is_private: !!isPrivate, notes: notes || "",
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
    updateLook,
    toggleLookOccasion,
    addLookCandidate,
    deleteLookCandidate,
    addAccessory,
    deleteAccessory,
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
        onToggleActivity={() => {
          setActivityOpen((v) => !v);
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
      <footer>H.S. &amp; C.H. · 云端工作台 · 公开可看，登录后才能修改</footer>
      <Drawer selected={selected} onClose={closeDrawer} state={state} />
      <ActivityPanel open={activityOpen} onClose={() => setActivityOpen(false)} log={activityLog} />
    </MembersCtx.Provider>
  );
}
