"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function HeaderAuthLink({
  initialAuthenticated,
}: {
  initialAuthenticated: boolean;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (active) setAuthenticated(Boolean(data.session));
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(Boolean(session));
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <Link
      className="iconbtn"
      href={authenticated ? "/account" : "/login"}
    >
      {authenticated ? "אזור אישי" : "כניסה"}
    </Link>
  );
}
