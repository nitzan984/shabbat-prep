import type { ShabbatWeekView } from '../../hooks/useShabbatWeek'
import type { useWeather } from '../../hooks/useWeather'
import type { Reading } from '../../lib/hebrew'
import { addDays, formatGregorianLong, formatTime, formatWeekday, type IsoDate } from '../../lib/time'
import { describeWeather } from '../../lib/weatherCodes'
import type { DayZmanim } from '../../services/hebcal'
import type { Forecast } from '../../services/weather'
import { InfoCard } from '../ui/InfoCard'
import { WeatherIcon } from '../ui/WeatherIcon'

type WeatherQuery = ReturnType<typeof useWeather>

function HebrewDateCard({ week }: { week: ShabbatWeekView }) {
  return (
    <InfoCard title="לוח עברי" icon="calendar" tone="calendar" query={week.query} errorText="לא הצלחנו לטעון את התאריך העברי.">
      {(data) => (
        <dl className="facts">
          <div className="facts__row">
            <dt>היום</dt>
            <dd className="facts__big">{data.hebrewDates[week.today] ?? '—'}</dd>
          </div>
          <div className="facts__row">
            <dt>שבת</dt>
            <dd className="facts__big">{data.hebrewDates[week.saturday] ?? '—'}</dd>
          </div>
          <div className="facts__row">
            <dt>לועזי</dt>
            <dd>{formatGregorianLong(week.today)}</dd>
          </div>
        </dl>
      )}
    </InfoCard>
  )
}

function Readings({ items }: { items: Reading[] }) {
  if (items.length === 0) return <>—</>
  return (
    <>
      {items.map((r, i) => (
        <span key={i} className="reading">
          {r.book}{' '}
          <span dir="ltr" className="reading__ref">
            {r.ref}
          </span>
        </span>
      ))}
    </>
  )
}

function ParashaCard({ week }: { week: ShabbatWeekView }) {
  return (
    <InfoCard title="פרשת השבוע" icon="book" tone="parasha" query={week.query} errorText="לא הצלחנו לטעון את פרשת השבוע.">
      {(data) => (
        <>
          <p className="parasha__name">{data.title ?? 'אין פרשה השבוע'}</p>
          {data.specialDays.length > 0 && (
            <ul className="tag-list" aria-label="מיוחד בשבת הזו">
              {data.specialDays.map((d) => (
                <li key={d} className="tag">
                  {d}
                </li>
              ))}
            </ul>
          )}
          <dl className="facts">
            <div className="facts__row facts__row--stack">
              <dt>קריאה בתורה</dt>
              <dd>
                <Readings items={data.torah} />
              </dd>
            </div>
            <div className="facts__row facts__row--stack">
              <dt>הפטרה (ספרדים)</dt>
              <dd>
                <Readings items={data.haftarah} />
              </dd>
            </div>
          </dl>
        </>
      )}
    </InfoCard>
  )
}

const ZMANIM_ROWS: { key: keyof DayZmanim; label: string }[] = [
  { key: 'alotHaShachar', label: 'עלות השחר' },
  { key: 'sunrise', label: 'הנץ החמה' },
  { key: 'sofZmanShmaMGA', label: 'סוף זמן ק״ש (מג״א)' },
  { key: 'sofZmanShmaGRA', label: 'סוף זמן ק״ש (גר״א)' },
  { key: 'chatzot', label: 'חצות היום' },
  { key: 'plagHaMincha', label: 'פלג המנחה' },
  { key: 'sunset', label: 'שקיעה' },
]

function ZmanimCard({ week }: { week: ShabbatWeekView }) {
  return (
    <InfoCard title="זמני היום ברחובות" icon="sunrise" tone="zmanim" query={week.query} errorText="לא הצלחנו לטעון את זמני היום.">
      {(data) => (
        <table className="zmanim">
          <caption className="sr-only">זמני היום לשישי ולשבת, לפי שיטת הרב עובדיה יוסף</caption>
          <thead>
            <tr>
              <th scope="col">
                <span className="sr-only">זמן</span>
              </th>
              <th scope="col">שישי</th>
              <th scope="col">שבת</th>
            </tr>
          </thead>
          <tbody>
            {ZMANIM_ROWS.map((row) => (
              <tr key={row.key}>
                <th scope="row">{row.label}</th>
                <td>{formatTime(data.zmanim.friday[row.key])}</td>
                <td>{formatTime(data.zmanim.saturday[row.key])}</td>
              </tr>
            ))}
            <tr className="zmanim__highlight">
              <th scope="row">צאת השבת</th>
              <td aria-label="לא רלוונטי">—</td>
              <td>{formatTime(data.havdalah)}</td>
            </tr>
            <tr className="zmanim__highlight">
              <th scope="row">צאת השבת לר״ת</th>
              <td aria-label="לא רלוונטי">—</td>
              <td>{formatTime(data.zmanim.saturday.tzeit72min)}</td>
            </tr>
          </tbody>
        </table>
      )}
    </InfoCard>
  )
}

function DayWeather({ title, forecast, current }: { title: string; forecast: Forecast['days'][IsoDate] | undefined; current?: Forecast['current'] }) {
  if (!forecast) {
    return (
      <div className="weather-day">
        <h3 className="weather-day__title">{title}</h3>
        <p className="muted">התחזית עדיין לא זמינה</p>
      </div>
    )
  }
  const info = describeWeather(forecast.code)
  return (
    <div className="weather-day">
      <h3 className="weather-day__title">{title}</h3>
      <WeatherIcon kind={info.kind} />
      <p className="weather-day__desc">{info.label}</p>
      <p className="weather-day__temps">
        <span>
          <span className="sr-only">מקסימום </span>
          {Math.round(forecast.max)}°
        </span>
        <span className="weather-day__min">
          <span className="sr-only">מינימום </span>
          {Math.round(forecast.min)}°
        </span>
      </p>
      <p className="weather-day__rain">גשם: {forecast.rainChance ?? 0}%</p>
      {current && <p className="weather-day__now">עכשיו {Math.round(current.temperature)}°</p>}
    </div>
  )
}

function WeatherCard({ week, weather }: { week: ShabbatWeekView; weather: WeatherQuery }) {
  // בשבת עצמה "היום" ו"שבת" הם אותו יום, אז מציגים את מחר במקום
  const isShabbatToday = week.today === week.saturday
  const second = isShabbatToday ? addDays(week.today, 1) : week.saturday
  return (
    <InfoCard title="מזג האוויר ברחובות" icon="cloud" tone="weather" query={weather} errorText="לא הצלחנו לטעון את התחזית.">
      {(data) => (
        <div className="weather">
          <DayWeather
            title={isShabbatToday ? 'היום, שבת' : `היום, ${formatWeekday(week.today)}`}
            forecast={data.days[week.today]}
            current={data.current}
          />
          <DayWeather title={isShabbatToday ? 'מחר' : 'שבת'} forecast={data.days[second]} />
        </div>
      )}
    </InfoCard>
  )
}

export function InfoCards({ week, weather }: { week: ShabbatWeekView; weather: WeatherQuery }) {
  return (
    <div className="info-grid">
      <HebrewDateCard week={week} />
      <ParashaCard week={week} />
      <ZmanimCard week={week} />
      <WeatherCard week={week} weather={weather} />
    </div>
  )
}
