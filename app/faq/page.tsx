import Link from "next/link";
import { CONDITION_HELP, CONDITIONS } from "@/lib/constants";
import { ColorPatternExamples } from "@/components/ColorPatternGuide";

export const metadata = {
  title: "שאלות נפוצות על מנשאים ארוגים",
  description:
    "מידות, GSM, חומרים, מצב ותמחור של מנשאים ארוגים ומנשאי טבעות יד שנייה.",
};

export default function FaqPage() {
  return <main className="page">
    <h1>שאלות נפוצות</h1>
    <div className="section"><p>העמוד נמצא בבנייה. ריכזנו כאן תשובות קצרות למונחים שמופיעים בלוח, ובהמשך נוסיף תשובות מפורטות יותר למי שרק מתחיל או מתחילה.</p></div>
    <div className="section" id="sizes"><h2>מידות מנשאים</h2><p><b>טבלת עזר לאורכים משוערים:</b></p><ul><li>טבעות קצר — 1.7 מ׳</li><li>טבעות רגיל — 2 מ׳</li><li>טבעות ארוך — 2.2–2.3 מ׳</li><li>מידה 1 — 2.2 מ׳</li><li>מידה 2 — 2.7–2.8 מ׳</li><li>מידה 3 — 3.2 מ׳</li><li>מידה 4 — 3.6–3.7 מ׳</li><li>מידה 5 — 4.2 מ׳</li><li>מידה 6 — 4.6–4.7 מ׳</li><li>מידה 7 — 5.2 מ׳</li><li>מידה 8 — 5.6–5.8 מ׳</li><li>מידה 9 — 6.2 מ׳</li></ul><p>האורך בפועל עשוי להשתנות מעט בין יצרנים ובין מדידות. זו טבלת עזר בלבד, ולא רשימת אפשרויות נוספת בטופס. בהמשך יתווסף כאן גם הסבר לבחירת מידה.</p></div>
    <div className="section" id="gsm"><h2>מה זה GSM?</h2><p>GSM הוא משקל הבד בגרמים למטר רבוע. בדרך כלל אפשר למצוא אותו בתווית, באתר היצרן או ב־WrapTrack. אם אי־אפשר לברר, אפשר לסמן „לא ידוע”.</p></div>
    <div className="section" id="materials"><h2>חומרים וסיווגים</h2><p><b>טבעי</b> — הסיב גדל בצורתו כסיב, למשל כותנה או צמר.</p><p><b>מלאכותי</b> — חומר ממקור טבעי שעובד בתהליך תעשייתי לסיב.</p><p><b>סינתטי</b> — סיב שמיוצר מפולימרים, למשל פוליאסטר או ניילון.</p><p><b>טבעוני</b> — ההרכב אינו כולל משי, צמר או סיבים מן החי.</p><p><b>איזיקייר</b> — בלוח, הסיווג ניתן למשפחות הכותנה והסינתטיים. הוא אינו ניתן לצמר, משי או פשתן; במשפחות אחרות לא מסמנים אותו מחמת הספק.</p></div>
    <div className="section" id="color-patterns">
      <h2>תכונות צבע</h2>
      <p>אפשר לסמן יותר מתכונת צבע אחת כאשר שתיהן מתאימות. חלק מהתכונות הן עיצוביות, ואחרות יכולות לשמש סימון חזותי בזמן לימוד הקשירה וההידוק.</p>
      <h3 id="color-pattern-single_color">צבע חלק — עיצובי</h3>
      <p>המראה חלק, גם אם האריגה עשויה משני צבעים. בד חלק לגמרי ודוגמה קטנה וצפופה שמתמזגת למראה אחיד שייכים לקטגוריה הזו.</p>
      <ColorPatternExamples patternId="single_color" />
      <h3 id="color-pattern-two_color_positive_negative">דו צדדי — עוזר ללמוד קשירות ומקל על זיהוי היפוך בבד</h3>
      <p>לכל צד של הבד יש צבע מובחן משלו. ההבדל מקל לראות איזה צד פונה החוצה ולזהות היפוך שנוצר בזמן הקשירה.</p>
      <ColorPatternExamples patternId="two_color_positive_negative" />
      <h3 id="color-pattern-stripes_ombre_symmetric">פסים סימטרי — עוזר ללמוד להדק סיב אחרי סיב</h3>
      <p>הצבע משתנה לרוחב המנשא בסידור סימטרי, והשוליים הארוכים דומים זה לזה. אפשר לעקוב אחרי הפסים בזמן ההידוק, אבל הדמיון בין השוליים אינו נותן אינדיקציה ברורה להיפוך בבד.</p>
      <ColorPatternExamples patternId="stripes_ombre_symmetric" />
      <h3 id="color-pattern-stripes_ombre_asymmetric">פסים אסימטרי — עוזר בהידוק וגם בזיהוי היפוכים</h3>
      <p>הצבע משתנה לרוחב המנשא בסידור אסימטרי, ושני השוליים הארוכים שונים זה מזה. לכן אפשר גם לעקוב אחרי ההידוק סיב אחרי סיב וגם לזהות היפוך בבד.</p>
      <ColorPatternExamples patternId="stripes_ombre_asymmetric" />
      <h3 id="color-pattern-rainbow">קשת — עיצובי</h3>
      <p>רצף צבעי הקשת מופיע על פני רוחב הבד. הסיווג מתאר את מראה המנשא.</p>
      <ColorPatternExamples patternId="rainbow" />
      <h3 id="color-pattern-multicolor">רב גוני — עיצובי</h3>
      <p>יש ריבוי צבעים.</p>
    </div>
    <div className="section" id="pricing"><h2>איך קובעים מחיר?</h2><p>אין בלוח מחירון מחייב. אפשר להביא בחשבון את המחיר החדש, זמינות, מצב, פגמים, ביקוש ומודעות או עסקאות דומות. הלוח אינו מעריך או מאשר את שווי המנשא.</p></div>
    <div className="section" id="condition"><h2>מצב ורמות שימוש</h2><ul className="condition-legend">{CONDITIONS.map(([key,label])=><li key={key}><b>{label}</b> — {CONDITION_HELP[key]}</li>)}</ul><p>פגמים מתוארים בנפרד מרמת השימוש, ויכולים להופיע כמעט בכל רמה.</p></div>
    <div className="section"><p>ללימוד שימוש במנשא אפשר לעבור לעמוד <Link href="/safety">לומדות להשתמש במנשא</Link>.</p></div>
  </main>;
}
