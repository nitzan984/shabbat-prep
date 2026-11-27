import type { WeatherKind } from '../../lib/weatherCodes'

/** אייקוני מזג אוויר צבעוניים ב־SVG. */

const Sun = ({ cx = 24, cy = 24, r = 9 }: { cx?: number; cy?: number; r?: number }) => (
  <g>
    <g stroke="#F59E0B" strokeWidth="3" strokeLinecap="round">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <line
          key={deg}
          x1={cx}
          y1={cy - r - 4}
          x2={cx}
          y2={cy - r - 8}
          transform={`rotate(${deg} ${cx} ${cy})`}
        />
      ))}
    </g>
    <circle cx={cx} cy={cy} r={r} fill="#FBBF24" stroke="#F59E0B" strokeWidth="2" />
  </g>
)

const Cloud = ({ dark = false, y = 0 }: { dark?: boolean; y?: number }) => (
  <path
    d={`M14 ${38 + y}h21a8 8 0 0 0 .6-16A11 11 0 0 0 14.5 ${24 + y}a7 7 0 0 0-.5 14z`}
    fill={dark ? '#94A3B8' : '#E2E8F0'}
    stroke={dark ? '#64748B' : '#94A3B8'}
    strokeWidth="2"
    strokeLinejoin="round"
  />
)

const Drops = ({ heavy = false }: { heavy?: boolean }) => (
  <g stroke="#2563EB" strokeWidth="3" strokeLinecap="round">
    <line x1="17" y1="41" x2="15" y2="45" />
    <line x1="25" y1="41" x2="23" y2="45" />
    <line x1="33" y1="41" x2="31" y2="45" />
    {heavy && <line x1="21" y1="45" x2="19.5" y2="47" />}
  </g>
)

export function WeatherIcon({ kind, size = 56 }: { kind: WeatherKind; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      {kind === 'clear' && <Sun />}
      {kind === 'partly' && (
        <>
          <Sun cx={18} cy={17} r={7} />
          <Cloud y={2} />
        </>
      )}
      {kind === 'cloudy' && (
        <>
          <path d="M22 26h16a6 6 0 0 0 .4-12A8.5 8.5 0 0 0 22.4 16a5 5 0 0 0-.4 10z" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="2" />
          <Cloud dark />
        </>
      )}
      {kind === 'fog' && (
        <>
          <Cloud y={-6} />
          <g stroke="#64748B" strokeWidth="3" strokeLinecap="round">
            <line x1="10" y1="38" x2="38" y2="38" />
            <line x1="14" y1="44" x2="34" y2="44" />
          </g>
        </>
      )}
      {(kind === 'drizzle' || kind === 'rain') && (
        <>
          <Cloud dark y={-4} />
          <Drops heavy={kind === 'rain'} />
        </>
      )}
      {kind === 'snow' && (
        <>
          <Cloud y={-4} />
          <g fill="#38BDF8">
            <circle cx="16" cy="42" r="2.2" />
            <circle cx="24" cy="45" r="2.2" />
            <circle cx="32" cy="42" r="2.2" />
          </g>
        </>
      )}
      {kind === 'storm' && (
        <>
          <Cloud dark y={-6} />
          <path d="M26 32l-6 9h5l-3 7 9-11h-5l3-5z" fill="#FACC15" stroke="#CA8A04" strokeWidth="1.5" strokeLinejoin="round" />
        </>
      )}
    </svg>
  )
}
