import { NextResponse } from "next/server";
import { createPublicServerClient } from "@/lib/supabase/public-server";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))
    return NextResponse.json({ error: "invalid educator" }, { status: 400 });
  const supabase = createPublicServerClient();
  const { data, error } = await supabase.rpc("get_public_educator_contact", { p_educator_id: id });
  if (error) return NextResponse.json({ error: "contact unavailable" }, { status: 503 });
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  const phone = typeof row.phone === "string" ? row.phone.trim() : "";
  const whatsapp = phone.replace(/\D/g, "").replace(/^0/, "972");
  return NextResponse.json({ phone: phone || null, whatsapp: whatsapp.length >= 11 ? whatsapp : null },
    { headers: { "Cache-Control": "private, no-store" } });
}
