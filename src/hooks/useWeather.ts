import { defineQuery, useQuery } from '../lib/query'
import { fetchForecast, type Forecast } from '../services/weather'

const THREE_HOURS = 3 * 60 * 60 * 1000

const forecastQuery = defineQuery<'rehovot', Forecast>({
  name: 'forecast',
  fetch: (_place, signal) => fetchForecast(signal),
  staleTime: THREE_HOURS,
  refetchInterval: THREE_HOURS,
  persist: { keep: 1 },
})

export const useWeather = () => useQuery(forecastQuery, 'rehovot')
