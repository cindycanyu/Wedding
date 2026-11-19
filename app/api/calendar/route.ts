import { createServerClient } from "@supabase/ssr";

// Public, read-only iCalendar feed of upcoming deadlines (tasks + daily
// to-dos) for H.S. and C.H. to subscribe to from their own phone's
// Calendar app — native reminders, no email service, no cron job needed
// (the calendar app itself polls this URL periodically). Uses the plain
// anon key with no session, so RLS applies exactly as it does for any
// anonymous visitor: private items are excluded automatically. That's
// deliberate, not just simpler — a surprise item's title showing up as a
// lock-screen notification would defeat the point of marking it private.

function escapeICal(s: string) {
  return String(s ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

// RFC5545 requires folding lines longer than 75 octets; our text is short
// but Chinese characters are multi-byte, so fold conservatively by chars.
function foldLine(line: string) {
  const max = 70;
  if (line.length <= max) return line;
  let out = line.slice(0, max);
  let i = max;
  while (i < line.length) {
    out += "\r\n " + line.slice(i, i + max);
    i += max;
  }
  return out;
}

function compactDate(isoDate: string) {
  return isoDate.replaceAll("-", "");
}

function addDays(isoDate: string, days: number) {
  const d = new Date(isoDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function dtstamp() {
  return new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export async function GET() {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  const [profilesRes, tasksRes, dailyRes] = await Promise.all([
    supabase.from("profiles").select("member_key,name"),
    supabase.from("tasks").select("id,title,notes,deadline,assignee").not("deadline", "is", null).neq("status", "done"),
    supabase.from("daily_tasks").select("id,title,notes,deadline,assignee").not("deadline", "is", null).neq("status", "done"),
  ]);

  const nameOf = (key: string) => profilesRes.data?.find((p) => p.member_key === key)?.name || key;

  type Row = { id: string; title: string; notes: string | null; deadline: string; assignee: string };
  const items: { uid: string; row: Row }[] = [
    ...(tasksRes.data || []).map((row: Row) => ({ uid: `task-${row.id}@hc-wedding-workbook`, row })),
    ...(dailyRes.data || []).map((row: Row) => ({ uid: `daily-${row.id}@hc-wedding-workbook`, row })),
  ];

  const stamp = dtstamp();
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//H.S. and C.H. Wedding Workbook//Deadlines//ZH",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:婚礼待办 Deadline",
    "X-WR-TIMEZONE:Asia/Shanghai",
  ];

  for (const { uid, row } of items) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`DTSTART;VALUE=DATE:${compactDate(row.deadline)}`);
    lines.push(`DTEND;VALUE=DATE:${compactDate(addDays(row.deadline, 1))}`);
    lines.push(foldLine(`SUMMARY:${escapeICal(`${nameOf(row.assignee)}：${row.title}`)}`));
    if (row.notes) lines.push(foldLine(`DESCRIPTION:${escapeICal(row.notes)}`));
    lines.push("BEGIN:VALARM");
    lines.push("ACTION:DISPLAY");
    lines.push("DESCRIPTION:Reminder");
    lines.push("TRIGGER:-P3D");
    lines.push("END:VALARM");
    lines.push("BEGIN:VALARM");
    lines.push("ACTION:DISPLAY");
    lines.push("DESCRIPTION:Reminder");
    lines.push("TRIGGER:-P1D");
    lines.push("END:VALARM");
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  return new Response(lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="wedding-deadlines.ics"',
      "Cache-Control": "public, max-age=1800",
    },
  });
}
