import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAY = 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Missing Supabase configuration" },
      { status: 500 }
    );
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const now = new Date();
  const result = {
    inactiveAccountCleanupEnabled: false,
    purgedListings: 0,
    purgedFeedback: 0,
    clearedDeletionEmailQueue: 0,
    errors: 0,
  };

  // A deleted listing remains recoverable for 60 days, then its files and row
  // are permanently removed.
  const deletedListingCutoff = new Date(
    now.getTime() - 60 * DAY
  ).toISOString();
  const { data: expiredListings, error: expiredListingsError } = await supabase
    .from("listings")
    .select("id")
    .eq("status", "deleted")
    .lt("deleted_at", deletedListingCutoff);

  if (expiredListingsError) {
    return NextResponse.json(
      { error: expiredListingsError.message },
      { status: 500 }
    );
  }

  for (const listing of expiredListings || []) {
    try {
      const { data: images, error: imageError } = await supabase
        .from("listing_images")
        .select("storage_path")
        .eq("listing_id", listing.id);
      if (imageError) throw imageError;

      const paths = (images || []).map((image) => image.storage_path);
      if (paths.length) {
        const { error } = await supabase.storage
          .from("listing-images")
          .remove(paths);
        if (error) throw error;
      }

      const { error: deleteListingError } = await supabase
        .from("listings")
        .delete()
        .eq("id", listing.id);
      if (deleteListingError) throw deleteListingError;

      result.purgedListings += 1;
    } catch (error) {
      result.errors += 1;
      console.error("Deleted listing purge failed", listing.id, error);
    }
  }

  // Feedback is operational data and is kept for no more than 30 days.
  const feedbackCutoff = new Date(now.getTime() - 30 * DAY).toISOString();
  const { data: purgedFeedback, error: feedbackPurgeError } = await supabase
    .from("feedback_items")
    .delete()
    .lt("created_at", feedbackCutoff)
    .select("id");

  if (feedbackPurgeError) {
    result.errors += 1;
    console.error("Feedback purge failed", feedbackPurgeError);
  } else {
    result.purgedFeedback = purgedFeedback?.length || 0;
  }

  // Confirmation emails are not part of the launch version. Remove any
  // addresses left in the former retry queue instead of retaining them.
  const { data: clearedQueue, error: queueClearError } = await supabase
    .from("account_deletion_email_queue")
    .delete()
    .not("id", "is", null)
    .select("id");

  if (queueClearError) {
    result.errors += 1;
    console.error("Deletion email queue cleanup failed", queueClearError);
  } else {
    result.clearedDeletionEmailQueue = clearedQueue?.length || 0;
  }

  return NextResponse.json(result);
}
