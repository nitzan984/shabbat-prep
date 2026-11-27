# מכינים שבת

אפליקציית ווב לניהול ההכנות ליום שישי: ספירה לאחור להדלקת נרות, זמני היום ברחובות (מנהג ספרדי), פרשת השבוע, מזג אוויר, טיימר, מטלות, רשימה קבועה ומתכונים.

אתר חי: https://shabbat-prep-two.vercel.app

## פקודות

```bash
pnpm install
pnpm dev          # שרת פיתוח
pnpm build        # בדיקת טיפוסים ובנייה
pnpm test         # בדיקות יחידה
pnpm test:live    # בדיקה מול Hebcal ו־Open-Meteo האמיתיים
pnpm deploy       # בנייה מקומית ופריסה ל־Vercel (production)
```

## מבנה

- `src/services/` גישה ל־API עם טיפוסים (Hebcal, Open-Meteo) והמרה למודל של האפליקציה.
- `src/hooks/` התנהגות: stores עם `useSyncExternalStore` (מטלות, רשימה, מתכונים, פריסה, טיימר) ו־server state (`useShabbatWeek`, `useWeather`).
- `src/lib/` לוגיקה טהורה: תאריכים בשעון ישראל, חישוב השבוע, עברית, מטמון שאילתות, צליל.
- `src/components/` תצוגה בלבד.

אין `useEffect` ואין Context: כל state משותף יושב ב־store חיצוני.
נתוני Hebcal נשמרים ב־localStorage לפי תאריך יום שישי ונמשכים מחדש רק כשהשבוע מתחלף. מזג האוויר מתרענן כל 3 שעות.
