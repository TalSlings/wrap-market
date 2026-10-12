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

export default async function AdminPage() {
  const s=await createClient();
  const {data:{user}}=await s.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const [contextResult,workspaceResult,regionsResult,subregionsResult]=await Promise.all([
    s.rpc("get_my_dashboard_context"),
    s.rpc("get_my_educator_workspace"),
    s.from("regions").select("id,name,sort_order,active").eq("active",true).order("sort_order"),
    s.from("subregions").select("id,name,region_id,sort_order,active").eq("active",true).order("sort_order"),
  ]);
  const context=(contextResult.data || {}) as any;
  const profile=(workspaceResult.data || null) as any;
  const isManager=Boolean(context.is_manager);
  if (!isManager && !profile) redirect("/account");

  const regions=regionsResult.data || [];
  const subregions=subregionsResult.data || [];
  let managerProfiles:any[]=[];
  let listings:any[]=[]; let manufacturers:any[]=[]; let materials:any[]=[];
  let colors:any[]=[]; let notes:any[]=[]; let sellers:any[]=[]; let allowIncomplete=false;

  if (isManager) {
    const [educatorsResult,listingsResult,manufacturersResult,materialsResult,colorsResult,
      notesResult,sellersResult,settingsResult]=await Promise.all([
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
    ]);
    managerProfiles=Array.isArray(educatorsResult.data) ? educatorsResult.data : [];
    listings=listingsResult.data || []; manufacturers=manufacturersResult.data || [];
    materials=materialsResult.data || []; colors=colorsResult.data || [];
    notes=notesResult.data || []; sellers=sellersResult.data || [];
    allowIncomplete=Boolean(settingsResult.data?.allow_incomplete_listings);
  }

  return <main className="page dashboard-page">
    <div className="dashboard-heading"><div><p>קשרים</p><h1>לוח בקרה</h1></div>
      <a className="btn" href="/educators">מעבר למאגר המדריכות</a></div>

    <EducatorWorkspace profile={profile} managerProfiles={managerProfiles} isManager={isManager}
      regions={regions} subregions={subregions} />

    {isManager && <details className="dashboard-panel market-admin-panel">
      <summary><span>ניהול שוק יד שנייה</span><small>מודעות, חומרים, משתמשות והגדרות</small></summary>
      <div className="dashboard-panel-body">
        <AdminClient userId={user.id} listings={listings} manufacturers={manufacturers}
          materials={materials} colors={colors} regions={regions} subregions={subregions}
          notes={notes} sellers={sellers} allowIncomplete={allowIncomplete} />
      </div>
    </details>}
  </main>;
}
