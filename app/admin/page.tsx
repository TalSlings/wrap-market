import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import AdminClient from "@/components/AdminClient";
import EducatorWorkspace from "@/components/EducatorWorkspace";
import { ksharimPageMetadata } from "@/lib/siteMetadata";

export const dynamic = "force-dynamic";
export const metadata:Metadata={
  ...ksharimPageMetadata({
    title:"קשרים — אזור ניהול",
    description:"אזור הניהול והמדריכות של קשרים.",
    url:"/admin",
  }),
  robots:{index:false,follow:false},
};

export default async function AdminPage({
  searchParams,
}: { searchParams: Promise<{ tab?: string | string[] }> }) {
  const s=await createClient();
  const {data:{user}}=await s.auth.getUser();
  if (!user) redirect("/login?next=/admin");
  const {tab}=await searchParams;
  const initialTab=tab==="educators" || tab==="my-card" ? tab : undefined;

  const [contextResult,workspaceResult,regionsResult,subregionsResult,legacyAdminResult]=await Promise.all([
    s.rpc("get_my_dashboard_context"),
    s.rpc("get_my_educator_workspace"),
    s.from("regions").select("id,name,sort_order,active").eq("active",true).order("sort_order"),
    s.from("subregions").select("id,name,region_id,sort_order,active").eq("active",true).order("sort_order"),
    s.from("admin_users").select("user_id").eq("user_id",user.id).maybeSingle(),
  ]);
  const context=(contextResult.data || {}) as any;
  const profile=(workspaceResult.data || null) as any;
  const isManager=Boolean(context.is_manager || legacyAdminResult.data);
  if (!isManager && !profile) redirect("/account");

  const regions=regionsResult.data || [];
  const subregions=subregionsResult.data || [];
  let managerProfiles:any[]=[];
  let listings:any[]=[]; let manufacturers:any[]=[]; let materials:any[]=[];
  let colors:any[]=[]; let notes:any[]=[]; let sellers:any[]=[]; let allowIncomplete=false;
  let marketRegions:any[]=[]; let marketSubregions:any[]=[];
  let educatorManagerUnavailable=false;

  if (isManager) {
    const [educatorsResult,listingsResult,manufacturersResult,materialsResult,colorsResult,
      notesResult,sellersResult,settingsResult,marketRegionsResult,marketSubregionsResult]=await Promise.all([
      s.rpc("get_admin_educator_workspace"),
      s.from("listings").select(`id,owner_id,manufacturer_id,design,model,price,status,created_at,updated_at,
        manufacturer:manufacturers(name),materials:listing_materials(material_id)`)
        .neq("status","deleted").order("updated_at",{ascending:false}),
      s.from("manufacturers").select("*").order("name"),
      s.from("materials").select("*").order("name"),
      s.from("colors").select("*").order("sort_order"),
      s.from("help_notes").select("*").order("section_label").order("placement"),
      s.rpc("admin_list_sellers"),
      s.from("site_settings").select("allow_incomplete_listings").eq("singleton",true).maybeSingle(),
      s.from("regions").select("*").order("sort_order"),
      s.from("subregions").select("*").order("sort_order"),
    ]);
    educatorManagerUnavailable=Boolean(educatorsResult.error);
    marketRegions=marketRegionsResult.data || [];
    marketSubregions=marketSubregionsResult.data || [];
    managerProfiles=Array.isArray(educatorsResult.data) ? educatorsResult.data : [];
    listings=listingsResult.data || []; manufacturers=manufacturersResult.data || [];
    materials=materialsResult.data || []; colors=colorsResult.data || [];
    notes=notesResult.data || []; sellers=sellersResult.data || [];
    allowIncomplete=Boolean(settingsResult.data?.allow_incomplete_listings);
  }

  const areasUnavailable=Boolean(regionsResult.error || subregionsResult.error);
  const unavailable=<p role="status">אזור המדריכות אינו זמין כרגע. כדאי לנסות שוב בהמשך.</p>;
  const myCard=workspaceResult.error || areasUnavailable ? unavailable : (
    <EducatorWorkspace profile={profile} managerProfiles={[]} view="own"
      regions={regions} subregions={subregions} />
  );

  return <main className="page">
    <h1>לוח בקרה</h1>
    {isManager ? <AdminClient userId={user.id} listings={listings} manufacturers={manufacturers}
      materials={materials} colors={colors} regions={marketRegions} subregions={marketSubregions}
      notes={notes} sellers={sellers} allowIncomplete={allowIncomplete} initialTab={initialTab}
      myCard={myCard}
      educatorManagement={educatorManagerUnavailable || areasUnavailable ? unavailable : (
        <EducatorWorkspace profile={null} managerProfiles={managerProfiles} view="manager"
          regions={regions} subregions={subregions} />
      )} /> : <>
      <div className="toolbar"><span className="btn primary">הכרטיס שלי</span></div>
      {myCard}
    </>}
  </main>;
}
