-- מכינים שבת: נתונים משותפים למשפחה.
-- גישה רק עם קוד משפחה בכותרת x-family-code. הקוד עצמו לא נשמר, רק sha256 שלו.

create schema if not exists app_private;

create table app_private.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code_hash text not null unique,
  created_at timestamptz not null default now()
);

-- הבית של מי ששלח את הבקשה, לפי הקוד בכותרת. null אם אין קוד או שהוא שגוי.
create or replace function app_private.household_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select h.id
  from app_private.households h
  where h.code_hash = encode(
    sha256(convert_to(
      coalesce(nullif(current_setting('request.headers', true), '')::json ->> 'x-family-code', ''),
      'UTF8'
    )),
    'hex'
  )
$$;

grant usage on schema app_private to anon, authenticated;
grant execute on function app_private.household_id() to anon, authenticated;

create or replace function app_private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- טבלאות ----------

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null default app_private.household_id()
    references app_private.households (id) on delete cascade,
  list text not null check (list in ('shabbat', 'weekday')),
  text text not null check (char_length(text) between 1 and 300),
  done boolean not null default false,
  assignee text check (assignee in ('shir', 'michal', 'eitan')),
  due_date date,
  position double precision not null default extract(epoch from clock_timestamp()),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weekday_tasks_have_date check (list = 'shabbat' or due_date is not null)
);

create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null default app_private.household_id()
    references app_private.households (id) on delete cascade,
  text text not null check (char_length(text) between 1 and 300),
  done boolean not null default false,
  position double precision not null default extract(epoch from clock_timestamp()),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null default app_private.household_id()
    references app_private.households (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  category text not null check (category in ('pastries', 'mains', 'sides', 'salads', 'desserts')),
  prep_minutes integer check (prep_minutes > 0),
  servings integer check (servings > 0),
  timer_minutes integer check (timer_minutes > 0),
  ingredients text[] not null default '{}',
  steps text[] not null default '{}',
  in_menu boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null default app_private.household_id()
    references app_private.households (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  -- null = כל המשפחה
  person text check (person in ('shir', 'michal', 'eitan')),
  kind text not null check (kind in ('class', 'event')),
  -- לאירוע: התאריך. לחוג: המפגש הראשון (וממנו היום בשבוע)
  date date not null,
  start_time time,
  end_time time,
  repeat text not null default 'none' check (repeat in ('none', 'weekly')),
  repeat_until date,
  skip_dates date[] not null default '{}',
  notes text check (char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_household_idx on public.tasks (household_id, list, due_date);
create index checklist_household_idx on public.checklist_items (household_id);
create index recipes_household_idx on public.recipes (household_id);
create index events_household_idx on public.events (household_id, date);

-- ---------- updated_at ו־RLS ----------

do $$
declare
  t text;
begin
  foreach t in array array['tasks', 'checklist_items', 'recipes', 'events'] loop
    execute format(
      'create trigger touch_updated_at before update on public.%I
         for each row execute function app_private.touch_updated_at()', t);
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy household_rows on public.%I for all to anon, authenticated
         using (household_id = (select app_private.household_id()))
         with check (household_id = (select app_private.household_id()))', t);
  end loop;
end;
$$;

-- ---------- בדיקת קוד ----------

-- שם הבית אם הקוד נכון, אחרת null. משמש גם את בדיקת ה"חיים" היומית.
create or replace function public.family_name()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select h.name from app_private.households h where h.id = app_private.household_id()
$$;

grant execute on function public.family_name() to anon, authenticated;

-- ---------- בית חדש עם ברירות מחדל ----------

create or replace function app_private.create_household(p_name text, p_code_hash text)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  hid uuid;
begin
  insert into app_private.households (name, code_hash) values (p_name, p_code_hash) returning id into hid;

  insert into public.checklist_items (household_id, text, position)
  select hid, item, ord
  from unnest(array[
    'פלטה מחוברת', 'מיחם מלא ודולק', 'שעון שבת מכוון', 'נרות ופמוטים', 'יין לקידוש',
    'אור במקרר כבוי', 'נייר טואלט חתוך', 'דוד מים חמים', 'טלפונים בצד', 'בגדי שבת לילדים'
  ]) with ordinality as x(item, ord);

  insert into public.recipes (household_id, name, category, prep_minutes, servings, timer_minutes, in_menu, ingredients, steps)
  values
    (hid, 'חלה מתוקה', 'pastries', 150, 2, 30, true,
      array['1 ק״ג קמח לבן', '50 גרם שמרים טריים', '3/4 כוס סוכר', '2 כפיות מלח', '2 ביצים', '3/4 כוס שמן', '2 כוסות מים פושרים', 'ביצה להברשה ושומשום'],
      array['מערבבים קמח, שמרים וסוכר.', 'מוסיפים ביצים, שמן ומים ולשים כ־10 דקות.', 'מוסיפים מלח ולשים עוד 2 דקות עד לבצק רך.', 'מכסים ומתפיחים כשעה, עד שהנפח מוכפל.', 'קולעים חלות ומתפיחים עוד חצי שעה.', 'מברישים בביצה, מפזרים שומשום ואופים ב־180 מעלות כ־30 דקות.']),
    (hid, 'חמין ספרדי', 'mains', 45, 8, null, true,
      array['1 ק״ג בשר בקר (שפונדרה או כתף)', '6 תפוחי אדמה', '1 כוס חומוס מושרה', '1 כוס חיטה מושרה', '8 ביצים בקליפה', '2 בצלים', '4 שיני שום', '2 כפות פפריקה מתוקה', '1 כפית כורכום', 'מלח ופלפל'],
      array['מטגנים בצל קצוץ עד הזהבה, מוסיפים שום ותבלינים.', 'מסדרים בסיר את הבשר, החומוס והחיטה.', 'מוסיפים תפוחי אדמה חצויים וביצים שטופות.', 'מכסים במים, מביאים לרתיחה ומתבלים.', 'מעבירים לפלטה לפני שבת ומבשלים לאט כל הלילה.']),
    (hid, 'אורז עם שקדים', 'sides', 30, 6, 20, false,
      array['2 כוסות אורז בסמטי', '1/2 כוס אטריות דקות', '3 כוסות מים רותחים', '1/2 כוס שקדים פרוסים', '3 כפות שמן', '1.5 כפיות מלח'],
      array['מטגנים את האטריות בשמן עד הזהבה.', 'מוסיפים את האורז ומערבבים דקה.', 'מוסיפים מים רותחים ומלח, מכסים ומבשלים 20 דקות על אש נמוכה.', 'קולים את השקדים במחבת יבשה ומפזרים מעל.']),
    (hid, 'מטבוחה', 'salads', 90, 10, 60, true,
      array['1 ק״ג עגבניות בשלות', '3 פלפלים אדומים קלויים', '6 שיני שום', '1 פלפל חריף', '1/3 כוס שמן', '1 כפית פפריקה', 'מלח וסוכר לפי הטעם'],
      array['קולפים וקוצצים את העגבניות והפלפלים.', 'מחממים שמן ומטגנים שום ופלפל חריף.', 'מוסיפים את הירקות ומבשלים על אש נמוכה כשעה.', 'מתבלים וממשיכים לבשל עד שהסלט סמיך.']),
    (hid, 'עוגת תפוזים', 'desserts', 15, 12, 45, false,
      array['4 ביצים', '1.5 כוסות סוכר', '1 כוס מיץ תפוזים', '3/4 כוס שמן', 'גרידה מתפוז אחד', '2 כוסות קמח תופח'],
      array['מחממים תנור ל־170 מעלות.', 'טורפים ביצים וסוכר.', 'מוסיפים מיץ, שמן וגרידה.', 'מוסיפים קמח ומערבבים לתערובת אחידה.', 'אופים כ־45 דקות, עד שקיסם יוצא יבש.']);

  return hid;
end;
$$;

revoke all on function app_private.create_household(text, text) from public, anon, authenticated;
