export function formatDurationToken(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const remainder = minutes % 60
    if (remainder === 0) {
      return `${hours}h`
    }
    return `${hours}h ${remainder}m`
  }
  return `${minutes}m`
}

