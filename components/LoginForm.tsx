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
    setMsg("");
    const { error } = await s.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) setMsg(error.message);
    else setSent(true);
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
            שליחת קישור התחברות
          </button>
        </>
      ) : (
        <div className="notice" role="status">
          <b>שלחנו אלייך קישור התחברות</b>
          <p>
            פתחי את ההודעה שנשלחה ל־{email} ולחצי על הקישור כדי להיכנס.
          </p>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setSent(false);
              setMsg("");
            }}
          >
            שימוש בכתובת אחרת
          </button>
        </div>
      )}

      {msg && (
        <p className="danger" role="alert">
          {msg}
        </p>
      )}
    </div>
  );
}
