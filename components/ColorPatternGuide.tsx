import HelpNote from "@/components/HelpNote";

type Example = {
  src: string;
  alt: string;
  caption?: string;
  rotate?: boolean;
};

type GuideEntry = {
  title: string;
  description: string;
  good?: Example[];
  bad?: Example[];
};

export const COLOR_PATTERN_GUIDE: Record<string, GuideEntry> = {
  single_color: {
    title: "צבע חלק",
    description: "המראה חלק, גם אם האריגה עשויה משני צבעים. בד חלק לגמרי ודוגמה קטנה וצפופה שמתמזגת למראה אחיד שייכים לקטגוריה הזו.",
    bad: [{ src: "/color-patterns/solid-bad.jpg", alt: "בד שבו כמה צבעים ודוגמה מובחנים בבירור", caption: "כמה צבעים ודוגמה מובחנים" }],
    good: [
      { src: "/color-patterns/solid-plain-good.jpg", alt: "בד חלק לגמרי", caption: "חלק לגמרי", rotate: true },
      { src: "/color-patterns/solid-dense-good.webp", alt: "דוגמה צפופה שנראית אחידה", caption: "דוגמה צפופה שנראית אחידה" },
    ],
  },
  two_color_positive_negative: {
    title: "דו צדדי",
    description: "לכל צד של הבד יש צבע מובחן משלו, כך שההבדל בין שני פני המנשא נראה בבירור.",
    bad: [{ src: "/color-patterns/two-sided-bad.jpg", alt: "מנשא שאין בו שני צדדים מובחנים", caption: "לא שני צדדים מובחנים" }],
    good: [{ src: "/color-patterns/two-sided-good.jpg", alt: "שני צדי הבד בצבעים שונים", caption: "שני הצדדים בצבעים שונים" }],
  },
  stripes_ombre_symmetric: {
    title: "פסים או אומברה - סימטרי",
    description: "הצבע משתנה לרוחב המנשא בסידור סימטרי, אבל השוליים הארוכים דומים זה לזה.",
    bad: [
      { src: "/color-patterns/symmetric-direction-bad.jpg", alt: "פסים שנמשכים בכיוון הלא נכון", caption: "הפסים בכיוון הלא נכון" },
      { src: "/color-patterns/symmetric-asymmetric-bad.jpg", alt: "פסים בכיוון הנכון בדוגמה אסימטרית", caption: "הפסים בכיוון הנכון, אבל הדוגמה לא סימטרית - שייך לקטגוריה השנייה" },
    ],
    good: [
      { src: "/color-patterns/symmetric-stripes-good.jpg", alt: "פסים סימטריים על פני רוחב הבד", caption: "פסים סימטריים" },
      { src: "/color-patterns/symmetric-ombre-good.jpg", alt: "אומברה סימטרי על פני רוחב הבד", caption: "אומברה סימטרי" },
    ],
  },
  stripes_ombre_asymmetric: {
    title: "פסים או אומברה - אסימטרי",
    description: "הצבע משתנה לרוחב המנשא בסידור אסימטרי, ושני השוליים הארוכים שונים זה מזה.",
    bad: [
      { src: "/color-patterns/asymmetric-direction-bad.jpg", alt: "פסים שנמשכים בכיוון הלא נכון", caption: "הפסים בכיוון הלא נכון" },
      { src: "/color-patterns/symmetric-stripes-good.jpg", alt: "דוגמת פסים סימטרית", caption: "דוגמת הפסים סימטרית - מתאים לקטגוריה השנייה" },
    ],
    good: [
      { src: "/color-patterns/asymmetric-stripes-good.jpg", alt: "פסים אסימטריים על פני רוחב הבד", caption: "פסים אסימטריים" },
      { src: "/color-patterns/asymmetric-ombre-good.jpg", alt: "אומברה אסימטרי על פני רוחב הבד", caption: "אומברה אסימטרי" },
    ],
  },
  rainbow: {
    title: "קשת",
    description: "רצף צבעי הקשת מופיע על פני רוחב הבד.",
    bad: [{ src: "/color-patterns/rainbow-bad.jpg", alt: "בד רב גוני שאינו מציג את רצף צבעי הקשת" }],
    good: [
      { src: "/color-patterns/rainbow-good-1.jpg", alt: "מנשא שמציג את מלוא רצף צבעי הקשת" },
      { src: "/color-patterns/rainbow-good-2.webp", alt: "בד שמציג את מלוא רצף צבעי הקשת" },
    ],
  },
  multicolor: {
    title: "רב גוני",
    description: "בד שיש בו כמה צבעים או שילובי צבעים, ואינו מתאים לאחת מקטגוריות הצבע האחרות. זהו מאפיין עיצובי.",
  },
};

function ExampleCard({ example, good }: { example: Example; good: boolean }) {
  return (
    <figure className={`color-pattern-example ${good ? "is-good" : "is-bad"}`}>
      <div className="color-pattern-image-wrap">
        <img src={example.src} alt={example.alt} className={example.rotate ? "rotate-180" : undefined} />
        <span className="color-pattern-mark" aria-hidden="true">{good ? "✓" : "×"}</span>
      </div>
      {example.caption && <figcaption>{example.caption}</figcaption>}
    </figure>
  );
}

function ExampleColumn({ title, good, examples }: { title: string; good: boolean; examples: Example[] }) {
  return (
    <div className="color-pattern-column">
      <b>{title}</b>
      <div className="color-pattern-example-stack">
        {examples.map((example) => <ExampleCard key={example.src} example={example} good={good} />)}
      </div>
    </div>
  );
}

export function ColorPatternExamples({ patternId }: { patternId: string }) {
  const entry = COLOR_PATTERN_GUIDE[patternId];
  if (!entry?.good?.length && !entry?.bad?.length) return null;

  return (
    <div className="color-pattern-comparison">
      <ExampleColumn title="מה לא" good={false} examples={entry.bad || []} />
      <ExampleColumn title="מה כן" good examples={entry.good || []} />
    </div>
  );
}

export default function ColorPatternHelp({ patternId }: { patternId: string }) {
  const entry = COLOR_PATTERN_GUIDE[patternId];
  if (!entry) return null;

  return (
    <HelpNote
      content={
        <div className="color-pattern-guide">
          <b>{entry.title}</b>
          <p>{entry.description}</p>
          <ColorPatternExamples patternId={patternId} />
        </div>
      }
      label={`הסבר ודוגמאות: ${entry.title}`}
      faqHref={`/faq#color-pattern-${patternId}`}
      wide
    />
  );
}
