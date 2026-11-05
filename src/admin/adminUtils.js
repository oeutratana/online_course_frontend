export const toNumber = (value) => {
  const parsed = Number(String(value ?? '').replace(/[^0-9.]/g, ''))

  return Number.isFinite(parsed) ? parsed : 0
}

export const formatMoney = (value, currency = 'USD') => {
  const amount = toNumber(value)
  const symbol = currency === 'KHR' ? '៛' : '$'

  if (currency === 'KHR') {
    return `${symbol}${Math.round(amount).toLocaleString('en-US')}`
  }

  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export const formatDate = (value, withTime = false) => {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  })
}

export const formatDateTime = (value) => formatDate(value, true)

export const formatRelativeTime = (value) => {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '—'

  const minutes = Math.round((Date.now() - date.getTime()) / 60000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.round(minutes / 60)

  if (hours < 24) return `${hours}h ago`

  const days = Math.round(hours / 24)

  if (days < 7) return `${days}d ago`

  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

const paymentStatusClasses = {
  paid: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  failed: 'bg-red-100 text-red-700',
  expired: 'bg-slate-100 text-slate-600',
}

export const paymentStatusClass = (status) => (
  paymentStatusClasses[String(status ?? '').toLowerCase()] ?? 'bg-slate-100 text-slate-600'
)

export const enrollmentStatusClass = (status) => (
  String(status ?? '').toLowerCase() === 'active'
    ? 'bg-emerald-100 text-emerald-700'
    : 'bg-slate-100 text-slate-600'
)

export const roleClass = (role) => {
  switch (String(role ?? '').toLowerCase()) {
    case 'admin':
      return 'bg-violet-100 text-violet-700'
    case 'instructor':
      return 'bg-cyan-100 text-cyan-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

export const getInitials = (name) => (name || 'U')
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part.charAt(0).toUpperCase())
  .join('') || 'U'

export const matchesSearch = (query, values) => {
  const normalized = query.trim().toLowerCase()

  if (!normalized) return true

  return values
    .map((value) => String(value ?? '').toLowerCase())
    .join(' ')
    .includes(normalized)
}

/**
 * The API stores no percentage anywhere: Enrollment has no progress column and
 * LessonProgress has no percent column. Percentages are always derived here from
 * the completed rows of the enrolled course.
 */
export const getCourseProgress = ({ totalLessons, completedLessons }) => {
  if (!totalLessons) return 0

  return Math.round((Math.min(completedLessons, totalLessons) / totalLessons) * 100)
}

export const prettyJson = (value) => {
  if (value === null || value === undefined) return 'No payload stored.'

  if (typeof value === 'string') return value

  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}