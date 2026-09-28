עדכון מעטפת האתר קשרים — 28.09.2026
====================================

מה העדכון כולל
---------------
- תפריט המבורגר קבוע עם שני קישורים: מדריכות נשיאה ושוק יד שנייה.
- מיתוג „רק ארוגים (וטבעות)” במסכי השוק ומיתוג „קשרים” בשאר האתר.
- כפתור „הוספת מודעה” מופיע רק באזורי השוק.
- כפתור השיתוף בפוטר משתף את /market באזורי השוק ואת /educators באזורי המדריכות.
- כותרות הדפדפן והמטא־דאטה מותאמות לאזור באתר.
- התנתקות מחזירה לאזור שממנו המשתמשת התנתקה.

התקנה
------
1. להעתיק את כל התיקיות והקבצים שבחבילה אל שורש הפרויקט.
2. לאשר החלפה של הקבצים הקיימים.
3. להעלות ל־GitHub/Vercel בדרך הרגילה.

קבצים חדשים
------------
components/SiteHeader.tsx
lib/siteSection.ts

קבצים להחלפה
-------------
app/layout.tsx
app/globals.css
app/opengraph-image.tsx
app/market/page.tsx
app/new/page.tsx
app/listing/[id]/page.tsx
app/listing/[id]/edit/page.tsx
app/seller/[publicId]/page.tsx
app/faq/page.tsx
app/safety/page.tsx
app/account/page.tsx
components/HeaderAuthLink.tsx
components/SiteFooter.tsx

מסד נתונים
-----------
אין צורך להריץ SQL בעדכון הזה.

בדיקות
-------
- TypeScript עבר ללא שגיאות.
- בניית Production של Next.js עברה בהצלחה.
