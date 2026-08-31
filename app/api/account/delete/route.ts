import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function sendDeletedEmail(to: string) {
  const smtpUser = process.env.SMTP_USER;
  const password = process.env.SMTP_APP_PASSWORD;
  const from = process.env.CLEANUP_FROM_EMAIL;
  const replyTo = process.env.CLEANUP_REPLY_TO;

  if (!smtpUser || !password || !from) {
    throw new Error("Missing email configuration");
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: smtpUser, pass: password },
  });

  await transporter.sendMail({
    from,
    to,
    replyTo: replyTo || undefined,
    subject: "החשבון שלך בלוח נמחק",
    text: `שלום,

החשבון שלך בלוח „רק ארוגים (וטבעות)” נמחק לפי בקשתך, יחד עם המודעות, התמונות והמידע האישי שהיה משויך אליו.

אם תרצי להשתמש שוב בלוח בעתיד, נשמח לראות אותך. אפשר להירשם מחדש בכל עת:
${process.env.NEXT_PUBLIC_SITE_URL || "https://market.talslings.info"}/login

רק ארוגים (וטבעות)`,
  });
}

export async function POST() {
  const sessionClient = await createClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "צריך להתחבר מחדש לפני מחיקת החשבון." }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    return NextResponse.json({ error: "מחיקת החשבון אינה זמינה כרגע." }, { status: 500 });
  }

  const admin: any = createAdminClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: adminRow } = await admin
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (adminRow) {
    return NextResponse.json(
      { error: "אי אפשר למחוק חשבון מנהלת מתוך האתר." },
      { status: 403 }
    );
  }

  try {
    const { error: queueError } = await admin
      .from("account_deletion_email_queue")
      .upsert(
        { user_id: user.id, email: user.email, ready_to_send: false },
        { onConflict: "user_id" }
      );
    if (queueError) throw queueError;

    const { data: images, error: imageQueryError } = await admin
      .from("listing_images")
      .select("storage_path")
      .eq("owner_id", user.id);
    if (imageQueryError) throw imageQueryError;

    const paths = (images || []).map(
      (image: { storage_path: string }) => image.storage_path
    );
    if (paths.length) {
      const { error } = await admin.storage.from("listing-images").remove(paths);
      if (error) throw error;
    }

    // Retain shared catalog values but remove their link to the deleted user.
    await admin.from("manufacturers").update({ created_by: null }).eq("created_by", user.id);
    await admin.from("materials").update({ created_by: null }).eq("created_by", user.id);
    await admin.from("field_help").update({ updated_by: null }).eq("updated_by", user.id);
    await admin.from("user_roles").update({ granted_by: null }).eq("granted_by", user.id);

    await admin.from("feedback_items").delete().eq("user_id", user.id);
    await admin.from("listings").delete().eq("owner_id", user.id);
    await admin.from("favorites").delete().eq("user_id", user.id);
    await admin.from("saved_searches").delete().eq("user_id", user.id);
    await admin.from("public_seller_profiles").delete().eq("user_id", user.id);
    await admin.from("user_profiles").delete().eq("user_id", user.id);

    const { error: deleteUserError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteUserError) throw deleteUserError;

    const { error: readyError } = await admin
      .from("account_deletion_email_queue")
      .update({ ready_to_send: true })
      .eq("user_id", user.id);
    if (readyError) throw readyError;

    try {
      await sendDeletedEmail(user.email);
      await admin
        .from("account_deletion_email_queue")
        .delete()
        .eq("user_id", user.id);
    } catch (emailError) {
      console.error("Post-deletion email will be retried", emailError);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Self-service account deletion failed", user.id, error);
    return NextResponse.json(
      { error: "לא הצלחנו להשלים את מחיקת החשבון. אפשר לפנות לתמיכה." },
      { status: 500 }
    );
  }
}
