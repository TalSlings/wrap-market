import LoginForm from "@/components/LoginForm";
export default async function Login({searchParams}:{searchParams:Promise<{next?:string}>}){const p=await searchParams;return <main className="page"><h1>כניסה</h1><LoginForm next={p.next??"/account"}/><p className="muted">בהמשך ההרשמה את מאשרת את תנאי השימוש ומדיניות הפרטיות.</p></main>}
