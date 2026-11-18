"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "not_invited") {
      setError("这个邮箱不在受邀名单里，请用 H.S. 或 C.H. 的邮箱登录。");
    } else if (params.get("error") === "auth") {
      setError("登录链接已失效，请重新发送一次。");
    }
  }, []);

  const sendLink = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setSubmitting(false);
    if (error) setError(error.message);
    else setSent(true);
  };

  return (
    <main className="login-wrap">
      <p className="eyebrow">Wedding Workbook</p>
      <h1 className="serif">H.S. &amp; C.H.</h1>
      <p className="tagline script">You are my end and my beginning</p>
      {sent ? (
        <p className="note" style={{ marginTop: 24 }}>
          登录链接已发送到 {email}，请到邮箱点击链接登录。只有受邀的两位邮箱可以登录。
        </p>
      ) : (
        <form onSubmit={sendLink} className="login-form">
          <input
            type="email"
            required
            placeholder="你的邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? "发送中…" : "发送登录链接"}
          </button>
          {error && (
            <p className="note" style={{ color: "var(--critical)" }}>
              {error}
            </p>
          )}
        </form>
      )}
    </main>
  );
}
