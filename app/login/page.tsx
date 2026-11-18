"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "not_invited") {
      setError("这个邮箱不在受邀名单里，请用 H.S. 或 C.H. 的邮箱。");
    }
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const supabase = createClient();

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      setSubmitting(false);
      if (error) {
        setError(error.message);
        return;
      }
      if (!data.session) {
        setError("账号已创建，但还需要邮箱确认才能登录——请到 Supabase 后台关闭「Confirm email」，或去邮箱点确认链接后再登录。");
        return;
      }
      router.push("/board");
      router.refresh();
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      setError(error.message === "Invalid login credentials" ? "邮箱或密码不对。" : error.message);
      return;
    }
    router.push("/board");
    router.refresh();
  };

  return (
    <main className="login-wrap">
      <p className="eyebrow">Wedding Workbook</p>
      <h1 className="serif">H.S. &amp; C.H.</h1>
      <p className="tagline script">You are my end and my beginning</p>

      <div className="filterbar" style={{ justifyContent: "center", marginTop: 24, marginBottom: 0 }}>
        <button className={"chip" + (mode === "signin" ? " on" : "")} onClick={() => setMode("signin")} type="button">
          登录
        </button>
        <button className={"chip" + (mode === "signup" ? " on" : "")} onClick={() => setMode("signup")} type="button">
          注册（只用一次）
        </button>
      </div>

      <form onSubmit={submit} className="login-form">
        <input
          type="email"
          required
          placeholder="你的邮箱"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder={mode === "signup" ? "设一个密码（至少 6 位）" : "密码"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "处理中…" : mode === "signup" ? "创建账号" : "登录"}
        </button>
        {error && (
          <p className="note" style={{ color: "var(--critical)" }}>
            {error}
          </p>
        )}
      </form>
      <p className="note" style={{ marginTop: 16 }}>
        只有 H.S. 和 C.H. 两个受邀邮箱能注册成功，别人填了也进不来。每人只需要注册一次，之后一直用"登录"。
      </p>
    </main>
  );
}
