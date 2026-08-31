import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CleanupState = {
  user_id: string;
  last_activity_at: string;
  deletion_scheduled_at: string;
  has_listing_history: boolean;
  warning_30_sent_at: string | null;
  warning_7_sent_at: string | null;
  warning_3_sent_at: string | null;
  warning_1_sent_at: string | null;
};

const DAY = 24 * 60 * 60 * 1000;

function addMonths(value: string, months: number) {
  const date = new Date(value);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date;
}

function daysUntil(date: Date, now: Date) {
  return Math.ceil((date.getTime() - now.getTime()) / DAY);
}

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://market.talslings.info";
}

async function sendEmail(to: string, subject: string, text: string) {
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_APP_PASSWORD;
  const from = process.env.CLEANUP_FROM_EMAIL;
  const replyTo = process.env.CLEANUP_REPLY_TO;

  if (!user || !password || !from) {
    throw new Error(
      "Missing SMTP_USER, SMTP_APP_PASSWORD or CLEANUP_FROM_EMAIL"
    );
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass: password },
  });

  await transporter.sendMail({ from, to, replyTo: replyTo || undefined, subject, text });
}

function warningCopy(days: number, hasHistory: boolean) {
  const when = days === 1 ? "מחר" : `בעוד ${days} ימים`;
  const historyNote = hasHistory
    ? "לחשבון שלך יש היסטוריית מודעות, ולכן נשלחות כמה תזכורות לפני המחיקה."
    : "";

  return {
    subject: `החשבון שלך בלוח יימחק ${when}`,
    text: `שלום,

לא התחברת זמן רב לחשבון שלך בלוח „רק ארוגים (וטבעות)”. בהתאם למדיניות שמירת המידע, החשבון מיועד למחיקה ${when}.

${historyNote}

כדי להשאיר את החשבון פעיל, מספיק להתחבר אליו לפני מועד המחיקה:
${siteUrl()}/login

אם אין לך צורך בחשבון, אין צורך לעשות דבר.

רק ארוגים (וטבעות)`,
  };
}

function deletedCopy() {
  return {
    subject: "החשבון שלך בלוח נמחק",
    text: `שלום,

החשבון שלך בלוח „רק ארוגים (וטבעות)” נמחק לאחר תקופה ממושכת ללא התחברות, בהתאם להתראות שנשלחו מראש.

אם תרצי להשתמש שוב בלוח בעתיד, נשמח לראות אותך. אפשר להירשם מחדש בכל עת:
${siteUrl()}/login

רק ארוגים (וטבעות)`,
  };
}

async function deleteAccount(
  // This project does not generate Supabase database types yet. The service
  // client is intentionally untyped until generated types are added.
  supabase: any,
  userId: string
) {
  const { data: images, error: imageQueryError } = await supabase
    .from("listing_images")
    .select("storage_path")
    .eq("owner_id", userId);

  if (imageQueryError) throw imageQueryError;

  const paths = (images || []).map(
    (image: { storage_path: string }) => image.storage_path
  );
  if (paths.length) {
    const { error } = await supabase.storage.from("listing-images").remove(paths);
    if (error) throw error;
  }

  // References created by this user are retained, but no longer identify them.
  await supabase.from("manufacturers").update({ created_by: null }).eq("created_by", userId);
  await supabase.from("materials").update({ created_by: null }).eq("created_by", userId);
  await supabase.from("field_help").update({ updated_by: null }).eq("updated_by", userId);
  await supabase.from("user_roles").update({ granted_by: null }).eq("granted_by", userId);

  const { error: listingError } = await supabase
    .from("listings")
    .delete()
    .eq("owner_id", userId);
  if (listingError) throw listingError;

  const { error: userError } = await supabase.auth.admin.deleteUser(userId);
  if (userError) throw userError;
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.INACTIVE_CLEANUP_ENABLED !== "true") {
    return NextResponse.json({ enabled: false, message: "Inactive account cleanup is disabled" });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    return NextResponse.json({ error: "Missing Supabase configuration" }, { status: 500 });
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const now = new Date();
  const result = { checked: 0, scheduled: 0, warned: 0, deleted: 0, errors: 0 };

  // Retry post-deletion messages that could not be delivered on an earlier run.
  const { data: pendingDeletionEmails } = await supabase
    .from("account_deletion_email_queue")
    .select("id,email")
    .eq("ready_to_send", true);
  for (const pending of pendingDeletionEmails || []) {
    try {
      const copy = deletedCopy();
      await sendEmail(pending.email, copy.subject, copy.text);
      await supabase.from("account_deletion_email_queue").delete().eq("id", pending.id);
    } catch (error) {
      result.errors += 1;
      console.error("Post-deletion email retry failed", pending.id, error);
    }
  }

  const { data: roles, error: rolesError } = await supabase
    .from("roles")
    .select("id,key")
    .in("key", ["admin", "instructor"]);
  if (rolesError) return NextResponse.json({ error: rolesError.message }, { status: 500 });

  const protectedRoleIds = (roles || []).map((role) => role.id);
  const protectedUsers = new Set<string>();
  if (protectedRoleIds.length) {
    const { data } = await supabase
      .from("user_roles")
      .select("user_id")
      .in("role_id", protectedRoleIds);
    (data || []).forEach((row) => protectedUsers.add(row.user_id));
  }

  const listingOwners = new Set<string>();
  let listingFrom = 0;
  while (true) {
    const { data, error } = await supabase
      .from("listings")
      .select("owner_id")
      .range(listingFrom, listingFrom + 999);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    (data || []).forEach((row) => listingOwners.add(row.owner_id));
    if (!data || data.length < 1000) break;
    listingFrom += 1000;
  }

  const { data: states, error: statesError } = await supabase
    .from("account_cleanup_state")
    .select("*");
  if (statesError) return NextResponse.json({ error: statesError.message }, { status: 500 });
  const stateByUser = new Map<string, CleanupState>(
    (states || []).map((state) => [state.user_id, state as CleanupState])
  );

  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    for (const user of data.users) {
      result.checked += 1;
      if (!user.email || protectedUsers.has(user.id)) continue;

      try {
        const lastActivity = user.last_sign_in_at || user.created_at;
        const hasHistory = listingOwners.has(user.id);
        const inactivityDeadline = addMonths(lastActivity, hasHistory ? 30 : 18);
        let state = stateByUser.get(user.id);

        if (state && new Date(lastActivity) > new Date(state.last_activity_at)) {
          await supabase.from("account_cleanup_state").delete().eq("user_id", user.id);
          state = undefined;
        }

        const firstWarningAt = new Date(inactivityDeadline.getTime() - 30 * DAY);
        if (!state && now < firstWarningAt) continue;

        if (!state) {
          const scheduledAt = new Date(Math.max(inactivityDeadline.getTime(), now.getTime() + 30 * DAY));
          const { data: inserted, error: insertError } = await supabase
            .from("account_cleanup_state")
            .insert({
              user_id: user.id,
              last_activity_at: lastActivity,
              deletion_scheduled_at: scheduledAt.toISOString(),
              has_listing_history: hasHistory,
            })
            .select("*")
            .single();
          if (insertError) throw insertError;
          state = inserted as CleanupState;
          stateByUser.set(user.id, state);
          result.scheduled += 1;
        }

        const scheduledAt = new Date(state.deletion_scheduled_at);
        const remaining = daysUntil(scheduledAt, now);
        const warnings = hasHistory
          ? [
              { days: 30, field: "warning_30_sent_at" as const },
              { days: 7, field: "warning_7_sent_at" as const },
              { days: 3, field: "warning_3_sent_at" as const },
              { days: 1, field: "warning_1_sent_at" as const },
            ]
          : [{ days: 30, field: "warning_30_sent_at" as const }];

        const dueWarning = warnings.find(
          (warning) => remaining <= warning.days && !state?.[warning.field]
        );
        if (dueWarning) {
          const copy = warningCopy(dueWarning.days, hasHistory);
          await sendEmail(user.email, copy.subject, copy.text);
          const sentAt = now.toISOString();
          await supabase
            .from("account_cleanup_state")
            .update({ [dueWarning.field]: sentAt })
            .eq("user_id", user.id);
          state[dueWarning.field] = sentAt;
          result.warned += 1;
          continue;
        }

        const allWarningsSent = warnings.every((warning) => state?.[warning.field]);
        if (remaining <= 0 && allWarningsSent) {
          const { error: queueError } = await supabase
            .from("account_deletion_email_queue")
            .upsert(
              { user_id: user.id, email: user.email, ready_to_send: false },
              { onConflict: "user_id" }
            );
          if (queueError) throw queueError;

          await deleteAccount(supabase, user.id);
          const { error: readyError } = await supabase
            .from("account_deletion_email_queue")
            .update({ ready_to_send: true })
            .eq("user_id", user.id);
          if (readyError) throw readyError;

          const copy = deletedCopy();
          await sendEmail(user.email, copy.subject, copy.text);
          await supabase
            .from("account_deletion_email_queue")
            .delete()
            .eq("user_id", user.id);
          result.deleted += 1;
        }
      } catch (error) {
        result.errors += 1;
        console.error("Inactive account cleanup failed", user.id, error);
      }
    }

    if (data.users.length < 1000) break;
    page += 1;
  }

  return NextResponse.json(result);
}
