import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import EducatorJoinClient from "@/components/EducatorJoinClient";
import { ksharimPageMetadata } from "@/lib/siteMetadata";

export const dynamic="force-dynamic";
export const metadata:Metadata={
  ...ksharimPageMetadata({
    title:"הצטרפות למאגר מדריכות נשיאת התינוקות",
    description:"חיבור כרטיס מדריכה קיים או הצטרפות למאגר מדריכות נשיאת התינוקות.",
    url:"/educators/join",
  }),
  robots:{index:false,follow:false},
};

export default async function EducatorJoinPage() {
  const s=await createClient();
  const {data:{user}}=await s.auth.getUser();
  if (!user) redirect("/login?next=/educators/join");
  const [{data:workspace},{data:regions},{data:subregions}]=await Promise.all([
    s.rpc("get_my_educator_workspace"),
    s.from("regions").select("id,name,sort_order").eq("active",true).order("sort_order"),
    s.from("subregions").select("id,name,region_id,sort_order").eq("active",true).order("sort_order"),
  ]);
  if (workspace) redirect("/admin");
  return <main className="page educator-join-page">
    <h1>הצטרפות למאגר המדריכות</h1>
    <p className="educator-join-intro">אפשר לחבר כרטיס שכבר ייבאנו מהאתר הישן, או ליצור כרטיס חדש לבדיקה.</p>
    <EducatorJoinClient regions={regions || []} subregions={subregions || []} />
  </main>;
}
