"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm({
  next = "/account",
}: {
  next?: string;
}) {
  const s = createClient();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState("");

  const google = async () => {
    const { error } = await s.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: "openid email",
        redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) setMsg(error.message);
  };

  const send = async () => {
    const { error } = await s.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) setMsg(error.message);
    else setSent(true);
  };

  const verify = async () => {
    const { error } = await s.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });
    if (error) setMsg(error.message);
    else location.href = next;
  };

  return (
    <div className="section">
      <button
        type="button"
        className="btn primary"
        style={{ width: "100%" }}
        onClick={google}
      >
        המשך עם Google
      </button>

      <hr
        style={{
          border: 0,
          borderTop: "1px solid var(--line)",
          margin: "18px 0",
        }}
      />

      {!sent ? (
        <>
          <div className="field">
            <label htmlFor="login-email">כתובת מייל</label>
            <input
              id="login-email"
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button type="button" className="btn" onClick={send}>
            שלחי קוד חד־פעמי
          </button>
        </>
      ) : (
        <>
          <div className="field">
            <label htmlFor="login-code">הקוד שקיבלת במייל</label>
            <input
              id="login-code"
              className="input"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="btn primary"
            onClick={verify}
          >
            כניסה
          </button>
        </>
      )}

      {msg && (
        <p className="danger" role="alert">
          {msg}
        </p>
      )}
    </div>
  );
}
