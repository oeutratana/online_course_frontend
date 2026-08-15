import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowUp,
  faBookOpen,
  faCalendarDays,
  faCartShopping,
  faChevronDown,
  faStar,
  faUserGroup,
} from '@fortawesome/free-solid-svg-icons'
import AdminPageHeader from './AdminPageHeader'
import { getCourses, getEnrollments, getPayments, getUsers } from '../../lib/courseApi'
import { getUserRole } from '../../lib/authApi'

const stats = [
  { title: 'Total Courses', value: '0', growth: '0%', icon: faBookOpen, color: 'from-violet-500 to-indigo-600' },
  { title: 'Total Students', value: '0', growth: '0%', icon: faUserGroup, color: 'from-sky-500 to-blue-600' },
  { title: 'Total Sales', value: '$0', growth: '0%', icon: faCartShopping, color: 'from-amber-400 to-orange-500' },
  { title: 'Total Reviews', value: '0', growth: '0%', icon: faStar, color: 'from-rose-400 to-pink-600' },
]

const topCourses = []
const students = []

const chartMonthLabels = ['Jan', 'Feb', 'Mar', 'April', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const chartBounds = { left: 56, right: 844, top: 48, bottom: 288 }
const chartRangeOptions = ['Hour', 'Day', 'Week', 'Month']

const currentYear = new Date().getFullYear()
const previousYear = currentYear - 1
const currentMonthIndex = new Date().getMonth()
const currentYearStudents = Array(12).fill(0)
const previousYearStudents = Array(12).fill(0)

const getChartMax = (series) => {
  const values = series
    .flatMap((item) => item.values)
    .filter((value) => Number.isFinite(value))
  const highestValue = Math.max(...values, 1)

  return Math.max(5, Math.ceil(highestValue / 5) * 5)
}

const getChartGrid = (max) => Array.from({ length: 5 }, (_, index) => {
  const value = Math.round(max - (max / 4) * index)
  return value.toLocaleString()
})

const getChartPoints = (values, labels, max) => {
  const xStep = labels.length > 1 ? (chartBounds.right - chartBounds.left) / (labels.length - 1) : 0

  return values.map((value, index) => ({
    label: labels[index],
    value,
    x: chartBounds.left + index * xStep,
    y: Number.isFinite(value)
      ? chartBounds.bottom - (value / max) * (chartBounds.bottom - chartBounds.top)
      : null,
    isPlotted: Number.isFinite(value),
  }))
}

const getSmoothPath = (points) => points.filter((point) => point.isPlotted).reduce((path, point, index, plottedPoints) => {
  if (index === 0) {
    return `M${point.x},${point.y}`
  }

  const previous = plottedPoints[index - 1]
  const controlDistance = (point.x - previous.x) * 0.42

  return `${path} C${previous.x + controlDistance},${previous.y} ${point.x - controlDistance},${point.y} ${point.x},${point.y}`
}, '')

const getAreaPath = (points) => {
  const plottedPoints = points.filter((point) => point.isPlotted)

  if (plottedPoints.length === 0) return ''

  return `${getSmoothPath(plottedPoints)} L${plottedPoints.at(-1).x},298 L${plottedPoints[0].x},298 Z`
}

const limitToPastAndCurrentMonths = (values) => values.map((value, index) => (
  index <= currentMonthIndex ? value : null
))

const defaultChartValues = [
  { label: `${currentYear}`, color: '#1887ff', areaId: 'studentArea', values: limitToPastAndCurrentMonths(currentYearStudents).slice(0, currentMonthIndex + 1), dashed: false },
  { label: `${previousYear}`, color: '#ff3b45', areaId: 'previousStudentArea', values: limitToPastAndCurrentMonths(previousYearStudents).slice(0, currentMonthIndex + 1), dashed: true },
]

const defaultChartLabels = chartMonthLabels.slice(0, currentMonthIndex + 1)

const getRecordDate = (item, fields) => {
  const rawDate = fields.map((field) => item?.[field]).find(Boolean)
  const date = rawDate ? new Date(rawDate) : null

  return date && !Number.isNaN(date.getTime()) ? date : null
}

const addTime = (date, range, amount) => {
  const nextDate = new Date(date)

  if (range === 'Hour') nextDate.setHours(nextDate.getHours() + amount)
  if (range === 'Day') nextDate.setDate(nextDate.getDate() + amount)
  if (range === 'Week') nextDate.setDate(nextDate.getDate() + (amount * 7))
  if (range === 'Month') nextDate.setMonth(nextDate.getMonth() + amount)

  return nextDate
}

const endOfBucket = (date, range) => {
  const nextDate = new Date(date)

  if (range === 'Hour') nextDate.setMinutes(59, 59, 999)
  if (range === 'Day') nextDate.setHours(23, 59, 59, 999)
  if (range === 'Week') nextDate.setDate(nextDate.getDate() + 6)
  if (range === 'Week') nextDate.setHours(23, 59, 59, 999)
  if (range === 'Month') nextDate.setMonth(nextDate.getMonth() + 1, 0)
  if (range === 'Month') nextDate.setHours(23, 59, 59, 999)

  return nextDate
}

const startOfBucket = (date, range) => {
  const nextDate = new Date(date)

  if (range === 'Hour') nextDate.setMinutes(0, 0, 0)
  if (range === 'Day') nextDate.setHours(0, 0, 0, 0)
  if (range === 'Week') {
    const day = nextDate.getDay()
    nextDate.setDate(nextDate.getDate() - day)
    nextDate.setHours(0, 0, 0, 0)
  }
  if (range === 'Month') {
    nextDate.setDate(1)
    nextDate.setHours(0, 0, 0, 0)
  }

  return nextDate
}

const formatChartLabel = (date, range) => {
  if (range === 'Hour') {
    return date.toLocaleTimeString([], { hour: '2-digit' })
  }

  if (range === 'Day') {
    return date.toLocaleDateString([], { weekday: 'short' })
  }

  if (range === 'Week') {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  return chartMonthLabels[date.getMonth()]
}

const getBucketCount = (range) => {
  if (range === 'Hour') return 12
  if (range === 'Day') return 7
  if (range === 'Week') return 8

  return currentMonthIndex + 1
}

const getCurrentBucketStarts = (range) => {
  const bucketCount = getBucketCount(range)
  const currentBucket = startOfBucket(new Date(), range)

  if (range === 'Month') {
    return Array.from({ length: bucketCount }, (_, index) => {
      const date = new Date(currentYear, index, 1)
      date.setHours(0, 0, 0, 0)
      return date
    })
  }

  return Array.from({ length: bucketCount }, (_, index) => (
    addTime(currentBucket, range, index - bucketCount + 1)
  ))
}

const getStudentTotalsForBuckets = (users, bucketStarts, range) => bucketStarts.map((bucketStart) => {
  const bucketEnd = endOfBucket(bucketStart, range)

  return users.filter((user) => {
    const date = getRecordDate(user, ['created_at', 'email_verified_at', 'updated_at'])
    return date && date <= bucketEnd
  }).length
})

const buildStudentChart = (users, range) => {
  const currentBuckets = getCurrentBucketStarts(range)
  const previousBuckets = range === 'Month'
    ? currentBuckets.map((date) => new Date(previousYear, date.getMonth(), 1))
    : currentBuckets.map((date) => addTime(date, range, -currentBuckets.length))

  return {
    labels: currentBuckets.map((date) => formatChartLabel(date, range)),
    series: [
      { ...defaultChartValues[0], label: range === 'Month' ? `${currentYear}` : 'Current', values: getStudentTotalsForBuckets(users, currentBuckets, range) },
      { ...defaultChartValues[1], label: range === 'Month' ? `${previousYear}` : 'Previous', values: getStudentTotalsForBuckets(users, previousBuckets, range) },
    ],
  }
}

const buildEmptyStudentChart = (range) => {
  const labels = getCurrentBucketStarts(range).map((date) => formatChartLabel(date, range))
  const emptyValues = Array(labels.length).fill(0)

  return {
    labels,
    series: [
      { ...defaultChartValues[0], label: range === 'Month' ? `${currentYear}` : 'Current', values: emptyValues },
      { ...defaultChartValues[1], label: range === 'Month' ? `${previousYear}` : 'Previous', values: emptyValues },
    ],
  }
}

const getCourseViewerCount = (course, enrollments, payments) => {
  const courseId = String(course.id || course.raw?.id || '')
  const viewerKeys = new Set()

  enrollments
    .filter((item) => String(item.course_id || item.course?.id || '') === courseId)
    .forEach((item) => {
      viewerKeys.add(String(item.user_id || item.user?.id || item.user?.email || item.id))
    })

  payments
    .filter((item) => String(item.course_id || item.course?.id || '') === courseId)
    .forEach((item) => {
      viewerKeys.add(String(item.user_id || item.user?.id || item.user?.email || item.id))
    })

  if (viewerKeys.size > 0) return viewerKeys.size

  return Number(String(course.students || course.raw?.students_count || course.raw?.enrollments_count || 0).replace(/,/g, '')) || 0
}

const getStudentUsers = (users) => users.filter((user) => getUserRole(user) === 'student')

const DashboardPage = ({ searchQuery = '' }) => {
  const [dashboardCourses, setDashboardCourses] = useState(topCourses)
  const [dashboardStudents, setDashboardStudents] = useState(students)
  const [dashboardStats, setDashboardStats] = useState(stats)
  const [dashboardUsers, setDashboardUsers] = useState([])
  const [activeChartRange, setActiveChartRange] = useState('Month')
  const [dashboardChartValues, setDashboardChartValues] = useState(defaultChartValues)
  const [dashboardChartLabels, setDashboardChartLabels] = useState(defaultChartLabels)
  const chartMax = getChartMax(dashboardChartValues)
  const chartGrid = getChartGrid(chartMax)
  const chartSeries = dashboardChartValues.map((series) => ({
    ...series,
    points: getChartPoints(series.values, dashboardChartLabels, chartMax),
  }))
  const normalizedSearch = searchQuery.trim().toLowerCase()
  const filteredDashboardCourses = normalizedSearch
    ? dashboardCourses.filter((course) => course.join(' ').toLowerCase().includes(normalizedSearch))
    : dashboardCourses
  const filteredDashboardStudents = normalizedSearch
    ? dashboardStudents.filter((student) => student.join(' ').toLowerCase().includes(normalizedSearch))
    : dashboardStudents

  const updateStudentChart = (users, range) => {
    const chart = users.length > 0
      ? buildStudentChart(users, range)
      : buildEmptyStudentChart(range)

    setDashboardChartLabels(chart.labels)
    setDashboardChartValues(chart.series)
  }

  const handleChartRangeChange = (range) => {
    setActiveChartRange(range)
    updateStudentChart(dashboardUsers, range)
  }

  useEffect(() => {
    let isMounted = true

    Promise.all([getCourses(), getUsers(), getPayments(), getEnrollments()])
      .then(([courses, users, payments, enrollments]) => {
        if (!isMounted) return

        if (courses.length > 0) {
          setDashboardCourses(courses
            .map((course) => ({
              course,
              viewers: getCourseViewerCount(course, enrollments, payments),
            }))
            .sort((a, b) => b.viewers - a.viewers)
            .slice(0, 4)
            .map(({ course, viewers }) => [
              course.title,
              `${viewers.toLocaleString()} ${viewers === 1 ? 'Viewer' : 'Viewers'}`,
              course.price,
              course.image,
            ]))
        }

        const studentUsers = getStudentUsers(users)

        if (studentUsers.length > 0) {
          setDashboardUsers(studentUsers)
          setDashboardStudents(studentUsers.slice(0, 4).map((user) => [
            user.name || 'Student',
            user.email || 'No email',
            user.course?.title || 'Online Course',
            user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown',
          ]))
        }

        setDashboardStats([
          { ...stats[0], value: courses.length.toLocaleString() },
          { ...stats[1], value: studentUsers.length.toLocaleString() },
          { ...stats[2], value: `$${payments.reduce((total, payment) => total + Number(payment.amount || payment.price || 0), 0).toLocaleString()}` },
          stats[3],
        ])

        if (studentUsers.length > 0) {
          updateStudentChart(studentUsers, activeChartRange)
        }
      })
      .catch(() => {
        if (isMounted) {
          setDashboardCourses([])
          setDashboardStudents([])
          setDashboardStats(stats)
          setDashboardUsers([])
          setDashboardChartLabels(defaultChartLabels)
          setDashboardChartValues(defaultChartValues)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  return (
  <div className="px-5 py-8 xl:px-8">
    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <AdminPageHeader title="Dashboard" text="Welcome back, Admin! Here is what is happening on your platform." />
      <button className="inline-flex h-12 items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-5 font-semibold shadow-sm" type="button">
        <FontAwesomeIcon icon={faCalendarDays} />
        May 1, 2024 - May 31, 2024
        <FontAwesomeIcon icon={faChevronDown} />
      </button>
    </div>

    <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {dashboardStats.map((stat) => (
        <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-md shadow-slate-200/50" key={stat.title}>
          <div className="flex items-center gap-4">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} text-xl text-white shadow-md`}>
              <FontAwesomeIcon icon={stat.icon} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500">{stat.title}</p>
              <p className="mt-1 whitespace-nowrap text-2xl font-black leading-tight tracking-tight">{stat.value}</p>
            </div>
          </div>
          <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 font-black text-emerald-500">
              <FontAwesomeIcon icon={faArrowUp} />
              {stat.growth}
            </span>
            from last month
          </p>
        </article>
      ))}
    </div>

    <div className="mt-6 grid gap-6 2xl:grid-cols-[1fr_480px]">
      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/60">
        <div className="flex flex-col gap-5 border-b border-slate-100 pb-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black  tracking-wide text-violet-600">Students Overview</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">Time vs Total Students</h2>
            <p className="mt-1 text-sm text-slate-500">Compare student growth by selected time range.</p>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="grid grid-cols-4 rounded-xl bg-slate-100 p-1">
              {chartRangeOptions.map((item) => (
                <button
                  className={`h-10 rounded-lg px-4 text-xs font-black transition ${item === activeChartRange ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-100' : 'text-slate-500 hover:bg-white hover:text-slate-800'}`}
                  key={item}
                  onClick={() => handleChartRangeChange(item)}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs font-black  text-slate-500">
              {chartSeries.map((series) => (
                <span className="inline-flex items-center gap-2" key={series.label}>
                  <span className="h-1 w-7 rounded-full" style={{ backgroundColor: series.color }} />
                  {series.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 h-80 overflow-hidden">
          <svg className="h-full w-full" viewBox="0 0 860 320" preserveAspectRatio="none" role="img" aria-label={`Total students by ${activeChartRange.toLowerCase()} compared with the previous period`}>
            <defs>
              <linearGradient id="studentArea" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#1887ff" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#1887ff" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="previousStudentArea" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#ff3b45" stopOpacity="0.10" />
                <stop offset="100%" stopColor="#ff3b45" stopOpacity="0.01" />
              </linearGradient>
            </defs>

            {[48, 98, 148, 198, 248].map((y) => (
              <line key={y} x1="54" x2="838" y1={y} y2={y} stroke="#eef2f7" />
            ))}

            {chartGrid.map((label, index) => (
              <text key={label} x="8" y={52 + index * 50} fill="#6b7280" fontSize="13" fontWeight="600">
                {label}
              </text>
            ))}

            {chartSeries.map((series) => {
              const areaPath = getAreaPath(series.points)

              return areaPath ? (
                <path key={`${series.label}-area`} d={areaPath} fill={`url(#${series.areaId})`} />
              ) : null
            })}

            {chartSeries.map((series) => {
              const linePath = getSmoothPath(series.points)

              return linePath ? (
                <path
                  key={`${series.label}-line`}
                  d={linePath}
                  fill="none"
                  stroke={series.color}
                  strokeDasharray={series.dashed ? '7 7' : undefined}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.8"
                />
              ) : null
            })}

            {chartSeries.flatMap((series) => series.points.filter((point) => point.isPlotted).map((point, index, plottedPoints) => {
              const previousValue = plottedPoints[index - 1]?.value ?? point.value
              const trend = point.value - previousValue
              const trendText = trend > 0 ? `increased by ${trend}` : trend < 0 ? `decreased by ${Math.abs(trend)}` : 'no change'

              return (
                <circle key={`${series.label}-${point.label}`} cx={point.x} cy={point.y} r={series.dashed ? '0' : '4.8'} fill="#ffffff" stroke={series.color} strokeWidth="2.5">
                  <title>{`${series.label} ${point.label}: ${point.value.toLocaleString()} total students, ${trendText}`}</title>
                </circle>
              )
            }))}

            {dashboardChartLabels.map((label, index) => {
              const xStep = dashboardChartLabels.length > 1 ? (chartBounds.right - chartBounds.left) / (dashboardChartLabels.length - 1) : 0

              return (
              <text key={`${label}-${index}`} x={chartBounds.left + index * xStep} y="316" fill="#6b7280" fontSize="13" fontWeight="600" textAnchor="middle">
                {label}
              </text>
              )
            })}
          </svg>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/50">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">Top Courses</h2>
          <a className="text-sm font-semibold text-violet-600" href="#top">View all</a>
        </div>
        <div className="mt-7 grid gap-6">
          {filteredDashboardCourses.map((course, index) => (
            <article className="grid grid-cols-[36px_72px_minmax(0,1fr)] gap-4 sm:grid-cols-[36px_72px_minmax(0,1fr)_auto] sm:items-center" key={course[0]}>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 font-black text-violet-600">{index + 1}</span>
              <img className="h-14 w-20 rounded-md object-cover" src={course[3]} alt={course[0]} />
              <div className="min-w-0">
                <h3 className="truncate font-semibold">{course[0]}</h3>
                <p className="mt-1 text-sm text-slate-500">{course[1]}</p>
              </div>
              <p className="col-start-3 font-black text-emerald-600 sm:col-start-auto">{course[2]}</p>
            </article>
          ))}
        </div>
      </section>
    </div>

    <section className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/50">
      <h2 className="text-xl font-black">Recent Students</h2>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="text-slate-500"><tr><th className="py-3">Student</th><th>Email</th><th>Course</th><th>Joined Date</th><th>Status</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
          {filteredDashboardStudents.map((student) => (
              <tr key={student[1]}>
                <td className="py-4 font-semibold">{student[0]}</td>
                <td className="text-slate-600">{student[1]}</td>
                <td className="text-slate-600">{student[2]}</td>
                <td className="text-slate-600">{student[3]}</td>
                <td><span className="rounded-full bg-emerald-100 px-3 py-1 font-black text-emerald-700">Active</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  </div>
  )
}

export default DashboardPage
