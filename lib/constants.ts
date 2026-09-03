export const SIZES=[["ring_sling","מנשא טבעות"],["scrap","סקראפ"],["size_2","מידה 2"],["size_3","מידה 3"],["size_4","מידה 4"],["size_5","מידה 5"],["size_6","מידה 6"],["size_7","מידה 7"],["size_8","מידה 8"],["size_9","מידה 9"],["other","אחר"]] as const;
export const GSM=[["lte_180","180 או פחות"],["190","190"],["200","200"],["210","210"],["220","220"],["230","230"],["240","240"],["250","250"],["260","260"],["270","270"],["280","280"],["290","290"],["300","300"],["310","310"],["320","320"],["330","330"],["340","340"],["gte_350","350 ומעלה"],["unknown","לא ידוע"]] as const;
export const CONDITIONS=[["unused","לא היה בשימוש"],["lightly_used","היה קצת בשימוש"],["used_not_broken_in","היה בשימוש"],["broken_in","מרוכך"],["lightly_worn","מעט בלוי"],["worn","בלוי"]] as const;
export const CONDITION_HELP:Record<string,string>={unused:"המנשא לא כובס, לא נוסה ולא נלבש. עדיין במצב שבו נמכר.",lightly_used:"המנשא כובס או נמדד, אבל לא נעשה בו שימוש.",used_not_broken_in:"המנשא היה בשימוש תקופה, אבל עדיין לא התרכך.",broken_in:"המנשא עבר שימוש מספיק כדי להיות רך ונוח לקשירה.",lightly_worn:"המנשא כבר שחוק, רך מדי או גמיש.",worn:"קיימים סימני שימוש ובלאי משמעותיים."};
export const DEFECTS=[["none","ללא פגמים ידועים"],["stain","כתם"],["pull","משיכת חוט / Pull"],["broken_thread","חוט שבור"],["hole","חור"],["edge_damage","קצה או מכפלת פגומים"],["repair","תיקון"],["color_change","שינוי צבע"],["off_center_middle_marker","מידל מרקר לא ממורכז"],["shortened_from_larger_size","קוצר ממידה גדולה יותר"],["other","אחר"]] as const;
export const COLOR_PATTERNS = [
  ["single_color", "צבע חלק"],
  ["two_color_positive_negative", "דו צדדי"],
  ["stripes_ombre_symmetric", "פסים סימטרי"],
  ["stripes_ombre_asymmetric", "פסים אסימטרי"],
  ["rainbow", "קשת"],
  ["multicolor", "רב גוני"],
] as const;

export const COLOR_PATTERN_DESCRIPTIONS: Record<string, string> = {
  single_color: "עיצובי",
  two_color_positive_negative:
    "עוזר ללמוד קשירות ומקל על זיהוי היפוך בבד",
  stripes_ombre_symmetric:
    "עוזר ללמוד להדק סיב אחרי סיב, אבל לא נותן אינדיקציה להיפוכים בבד",
  stripes_ombre_asymmetric:
    "עוזר ללמוד להדק סיב אחרי סיב, וגם לזהות את ההיפוכים בבד",
  rainbow: "עיצובי",
  multicolor: "עיצובי",
};
export const SORTS=[["stable_random","דיפולט"],["price_asc","מחיר: נמוך → גבוה"],["price_desc","מחיר: גבוה → נמוך"],["newest","חדש → ישן"],["oldest","ישן → חדש"],["manufacturer","יצרן: א׳ → ת׳"]] as const;
export const labelOf=(items:readonly (readonly [string,string])[],key?:string|null)=>items.find(([k])=>k===key)?.[1]??key??"";
