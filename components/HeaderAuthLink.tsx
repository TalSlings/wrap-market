"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  EmptyPawnAvatar,
  normalizePawnAvatar,
  PawnAvatar,
  pawnAvatarForSeed,
} from "@/components/PawnAvatar";
import { createClient } from "@/lib/supabase/client";

type HeaderProfile = {
  display_name?: string | null;
  avatar_key?: string | null;
  profile_image_path?: string | null;
  profile_setup_complete?: boolean | null;
};

export default function HeaderAuthLink({
  initialAuthenticated,
  initialUserId = null,
}: {
  initialAuthenticated: boolean;
  initialUserId?: string | null;
}) {
  const supabase = useMemo(() => createClient(), []);
  const rootRef = useRef<HTMLDivElement>(null);
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [userId, setUserId] = useState<string | null>(initialUserId);
  const [profile, setProfile] = useState<HeaderProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    let active = true;

    async function applySession(session: any) {
      const nextUserId = session?.user?.id || null;
      if (!active) return;

      setAuthenticated(Boolean(nextUserId));
      setUserId(nextUserId);

      if (!nextUserId) {
        setProfile(null);
        setIsAdmin(false);
        setOpen(false);
        return;
      }

      const [{ data: nextProfile }, { data: adminRow }] = await Promise.all([
        supabase
          .from("user_profiles")
          .select(
            "display_name,avatar_key,profile_image_path,profile_setup_complete"
          )
          .eq("user_id", nextUserId)
          .maybeSingle(),
        supabase
          .from("admin_users")
          .select("user_id")
          .eq("user_id", nextUserId)
          .maybeSingle(),
      ]);

      if (!active) return;
      setProfile(nextProfile || null);
      setIsAdmin(Boolean(adminRow));
    }

    supabase.auth.getSession().then(({ data }) => applySession(data.session));

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      void applySession(session);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const profileImageUrl = useMemo(() => {
    if (!profile?.profile_image_path) return null;
    return supabase.storage
      .from("profile-images")
      .getPublicUrl(profile.profile_image_path).data.publicUrl;
  }, [profile?.profile_image_path, supabase]);

  useEffect(() => setImageFailed(false), [profileImageUrl]);

  useEffect(() => {
    const updateProfile = (event: Event) => {
      const detail = (event as CustomEvent<HeaderProfile>).detail;
      setProfile((current) => ({ ...current, ...detail }));
    };

    window.addEventListener("wrap-market-profile-updated", updateProfile);
    return () =>
      window.removeEventListener("wrap-market-profile-updated", updateProfile);
  }, []);

  const avatarKey = profile?.profile_setup_complete
    ? normalizePawnAvatar(profile.avatar_key)
    : pawnAvatarForSeed(userId || "guest");

  if (!authenticated) {
    return (
      <Link
        className="header-avatar-trigger guest"
        href="/login"
        aria-label="כניסה"
        title="כניסה"
      >
        <EmptyPawnAvatar size={38} />
      </Link>
    );
  }

  const closeMenu = () => setOpen(false);

  const signOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    await supabase.auth.signOut();
    location.href = "/";
  };

  return (
    <div className="header-account" ref={rootRef}>
      <button
        type="button"
        className="header-avatar-trigger"
        aria-label="פתיחת תפריט האזור האישי"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {profileImageUrl && !imageFailed ? (
          <img
            className="header-profile-image"
            src={profileImageUrl}
            alt=""
            width={38}
            height={38}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <PawnAvatar avatarKey={avatarKey} size={38} decorative />
        )}
      </button>

      {open && (
        <div className="header-account-menu" role="menu">
          {profile?.display_name && (
            <div className="header-account-name">{profile.display_name}</div>
          )}

          <Link href="/account?tab=profile" role="menuitem" onClick={closeMenu}>
            הפרופיל שלי
          </Link>
          <Link href="/account?tab=listings" role="menuitem" onClick={closeMenu}>
            המודעות שלי
          </Link>
          <Link href="/account?tab=favorites" role="menuitem" onClick={closeMenu}>
            מועדפים
          </Link>
          <Link href="/account?tab=searches" role="menuitem" onClick={closeMenu}>
            חיפושים שמורים
          </Link>

          {isAdmin && (
            <Link href="/admin" role="menuitem" onClick={closeMenu}>
              אזור ניהול
            </Link>
          )}

          <div className="header-account-menu-divider" />
          <button
            type="button"
            className="header-signout"
            role="menuitem"
            disabled={signingOut}
            onClick={signOut}
          >
            {signingOut ? "מתנתקת…" : "התנתקות"}
          </button>
        </div>
      )}
    </div>
  );
}
