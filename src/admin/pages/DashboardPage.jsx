import { useEffect, useMemo, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBookOpen,
  faRotateRight,
  faTriangleExclamation,
  faUserGraduate,
  faUsers,
  faWallet,
} from '@fortawesome/free-solid-svg-icons'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import StatCard from '../components/dashboard/StatCard'
import EnrollmentOverviewChart from '../components/dashboard/EnrollmentOverviewChart'
import CategoryDoughnut from '../components/dashboard/CategoryDoughnut'
import LatestCoursesTable from '../components/dashboard/LatestCoursesTable'
import RecentActivityPanel from '../components/dashboard/RecentActivityPanel'
import RecentEnrollmentsTable from '../components/dashboard/RecentEnrollmentsTable'
import QuickActions from '../components/dashboard/QuickActions'
import { getAdminDashboard, getAdminCoursePage } from '../../lib/adminDashboardApi'
import { getAdminEnrollments } from '../../lib/adminApi'
import { deleteCourse } from '../../lib/courseApi'
import { getStoredAuthUser } from '../../lib/authApi'
import { formatMoney } from '../adminUtils'

const EMPTY_SUMMARY = {
  totalCourses: 0,
  totalStudents: 0,
  totalEnrollments: 0,
  totalRevenue: 0,
  currency: 'USD',
  publishedCourses: 0,
  draftCourses: 0,
  activeEnrollments: 0,
  completedEnrollments: 0,
  successfulPayments: 0,
  pendingPayments: 0,
  failedPayments: 0,
  courseGrowth: { percentage: null },
}

const COURSE_PAGE_SIZE = 6

const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white" key={`stat-${index}`} />
      ))}
    </div>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <div className="h-96 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      <div className="h-96 animate-pulse rounded-2xl border border-slate-200 bg-white" />
    </div>
    <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white" />
  </div>
)

const DashboardPage = ({ searchQuery = '' }) => {
  const [range, setRange] = useState('30d')
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const [courseSearch, setCourseSearch] = useState('')
  const [debouncedCourseSearch, setDebouncedCourseSearch] = useState('')
  const [coursePage, setCoursePage] = useState(1)
  const [courses, setCourses] = useState({ items: [], total: 0, currentPage: 1, lastPage: 1, perPage: COURSE_PAGE_SIZE })
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [coursesError, setCoursesError] = useState('')
  const [deletingCourseId, setDeletingCourseId] = useState(null)

  const [enrollments, setEnrollments] = useState([])
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(true)
  const [enrollmentsError, setEnrollmentsError] = useState('')

  const adminName = getStoredAuthUser()?.name || 'Admin'

  useEffect(() => {
    let isMounted = true

    getAdminDashboard({ range })
      .then((data) => {
        if (isMounted) setDashboard(data)
      })
      .catch((requestError) => {
        if (isMounted) setError(requestError?.message || 'The dashboard could not be loaded.')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [range, reloadKey])

  useEffect(() => {
    let isMounted = true

    getAdminEnrollments()
      .then((rows) => {
        if (isMounted) {
          setEnrollments(rows.map((row) => ({ ...row, student: row.user ?? row.student ?? null })))
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setEnrollmentsError(requestError?.message || 'Enrollments could not be loaded.')
        }
      })
      .finally(() => {
        if (isMounted) setEnrollmentsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [reloadKey])

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedCourseSearch(courseSearch)
      setCoursePage(1)
    }, 350)

    return () => clearTimeout(timeout)
  }, [courseSearch])

  useEffect(() => {
    let isMounted = true

    getAdminCoursePage({
      page: coursePage,
      perPage: COURSE_PAGE_SIZE,
      search: debouncedCourseSearch,
    })
      .then((page) => {
        if (isMounted) setCourses(page)
      })
      .catch((requestError) => {
        if (isMounted) setCoursesError(requestError?.message || 'Courses could not be loaded.')
      })
      .finally(() => {
        if (isMounted) setCoursesLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [coursePage, debouncedCourseSearch, reloadKey])

  const summary = dashboard?.summary ?? EMPTY_SUMMARY

  const stats = useMemo(() => [
    {
      title: 'Total Courses',
      value: summary.totalCourses.toLocaleString(),
      hint: `${summary.publishedCourses} published · ${summary.draftCourses} draft`,
      icon: faBookOpen,
      tone: 'bg-blue-50 text-blue-600',
      trend: summary.courseGrowth?.percentage ?? null,
    },
    {
      title: 'Total Students',
      value: summary.totalStudents.toLocaleString(),
      hint: 'Registered learner accounts',
      icon: faUsers,
      tone: 'bg-emerald-50 text-emerald-600',
      trend: null,
    },
    {
      title: 'Total Enrollments',
      value: summary.totalEnrollments.toLocaleString(),
      hint: `${summary.activeEnrollments} active · ${summary.completedEnrollments} completed`,
      icon: faUserGraduate,
      tone: 'bg-amber-50 text-amber-600',
      trend: null,
    },
    {
      title: 'Total Revenue',
      value: formatMoney(summary.totalRevenue, summary.currency),
      hint: `${summary.successfulPayments} confirmed payments`,
      icon: faWallet,
      tone: 'bg-violet-50 text-violet-600',
      trend: null,
    },
  ], [summary])

  const enrollmentRows = enrollments.length > 0 ? enrollments : (dashboard?.recentEnrollments ?? [])

  const handleRangeChange = (nextRange) => {
    if (nextRange === range) return

    setLoading(true)
    setError('')
    setRange(nextRange)
  }

  const handleReload = () => {
    setLoading(true)
    setError('')
    setCoursesLoading(true)
    setCoursesError('')
    setReloadKey((current) => current + 1)
  }

  const handleCourseSearchChange = (value) => {
    setCoursesLoading(true)
    setCoursesError('')
    setCourseSearch(value)
  }

  const handleCoursePageChange = (nextPage) => {
    if (nextPage === coursePage) return

    setCoursesLoading(true)
    setCoursesError('')
    setCoursePage(nextPage)
  }

  const handleDeleteCourse = async (course) => {
    const confirmed = window.confirm(`Delete "${course.title}"? This action cannot be undone.`)

    if (!confirmed) return

    setDeletingCourseId(course.id)
    setCoursesError('')
    setCoursesLoading(true)

    try {
      await deleteCourse(course.id)

      if (courses.items.length === 1 && coursePage > 1) {
        setCoursePage((current) => current - 1)
      } else {
        setReloadKey((current) => current + 1)
      }
    } catch (requestError) {
      setCoursesError(requestError?.message || 'The course could not be deleted.')
      setCoursesLoading(false)
    } finally {
      setDeletingCourseId(null)
    }
  }

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 xl:px-8">
      <DashboardHeader adminName={adminName} />

      {error && (
        <div className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-start gap-2">
            <FontAwesomeIcon className="mt-0.5" icon={faTriangleExclamation} />
            {error}
          </span>
          <button
            className="inline-flex h-9 items-center gap-2 self-start rounded-lg bg-white px-3 text-xs font-black text-rose-700 shadow-sm transition hover:bg-rose-100 sm:self-auto"
            onClick={handleReload}
            type="button"
          >
            <FontAwesomeIcon icon={faRotateRight} />
            Retry
          </button>
        </div>
      )}

      {loading && !dashboard ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <StatCard key={stat.title} {...stat} />
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <EnrollmentOverviewChart
              data={dashboard?.enrollmentOverview ?? []}
              error={error}
              loading={loading}
              onRangeChange={handleRangeChange}
              range={range}
              total={dashboard?.enrollmentOverviewTotal ?? 0}
            />
            <CategoryDoughnut
              data={dashboard?.coursesByCategory ?? []}
              error={error}
              loading={loading}
              total={dashboard?.coursesByCategory?.reduce((accumulator, item) => accumulator + item.count, 0) ?? 0}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <LatestCoursesTable
              courses={courses.items}
              deletingId={deletingCourseId}
              error={coursesError}
              lastPage={courses.lastPage}
              loading={coursesLoading}
              onDelete={handleDeleteCourse}
              onPageChange={handleCoursePageChange}
              onSearchChange={handleCourseSearchChange}
              page={courses.currentPage}
              perPage={courses.perPage || COURSE_PAGE_SIZE}
              search={courseSearch}
              total={courses.total}
            />

            <div className="grid content-start gap-6">
              <QuickActions />
              <RecentActivityPanel activities={dashboard?.recentActivity ?? []} loading={loading} />
            </div>
          </div>

          <RecentEnrollmentsTable
            enrollments={enrollmentRows}
            error={enrollmentsError}
            globalSearch={searchQuery}
            loading={enrollmentsLoading}
          />
        </>
      )}
    </div>
  )
}

export default DashboardPage
