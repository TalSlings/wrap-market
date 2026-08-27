# wrap-market — development build

## התקנה
1. ב-Supabase SQL Editor הריצי `supabase/migrations/002_wrap_market.sql`.
2. לאחר הצלחה הריצי `supabase/seed.sql`.
3. ב-Vercel/GitHub העלי את תוכן התיקייה לשורש ה-repository.
4. Environment Variables:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
   - NEXT_PUBLIC_SITE_URL
   - SUPABASE_SERVICE_ROLE_KEY (server only; never expose as NEXT_PUBLIC)
   - CRON_SECRET
   - RESEND_API_KEY
   - CLEANUP_FROM_EMAIL
5. ב-Supabase Auth הגדירי Site URL ו-Redirect URLs לכתובת Vercel.
6. Google: הפעילי Google provider לפי Supabase Auth.
7. Email OTP: בתבנית המייל השתמשי ב-`{{ .Token }}` כדי לשלוח קוד ולא רק Magic Link.

## מה כבר בפנים
- Auth: Google + Email OTP
- לוח mobile-first, List/Grid
- מיון סופי לפי האפיון
- פילטרים ראשוניים: מידה, חומרים, טבעוני/טבעי, GSM, אזורים, חיפוש חופשי
- עמוד מודעה
- פרטי קשר רק למשתמשת מחוברת דרך RPC
- פרסום/טיוטה/עריכה/השהיה/מחיקה
- תמונות פרטיות + signed URLs
- re-encode לתמונות לפני העלאה
- אזור אישי + מוני צפיות/מועדפים
- חיפושים שמורים ושיתוף חיפוש
- שכפול מודעה
- זיכרון זמני לאזור/משלוח בפרסום רציף

## עדיין לא מושלם

Admin area
- ממשק מנהלת
- עריכת פרופיל וברירות מחדל קבועות
- מועדפים במסך נפרד (המונה והתשתית קיימים)
- כל הפילטרים המתקדמים מהאפיון
- הפעלה ואימות של אוטומציית מחיקת החשבונות הלא פעילים (הקוד קיים;
  נדרשים migration, משתני סביבה ושירות שליחת מיילים)
- rate-limit מתקדם לחשיפת פרטי קשר
- כלי סטיקרים לפנים
