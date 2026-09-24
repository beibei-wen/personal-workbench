import dayjs from 'dayjs'

export function todayString() {
  return dayjs().format('YYYY-MM-DD')
}
