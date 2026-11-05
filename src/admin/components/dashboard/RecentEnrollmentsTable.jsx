import { useMemo, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faEye,
  faMagnifyingGlass,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import {
  enrollmentStatusClass,
  formatDate,
  getInitials,
  matchesSearch,
} from '../../adminUtils'

const PAGE_SIZE = 5

const EnrollmentDetailsModal = ({ enrollment, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
    <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
      <header className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
        <div>
          <h3 className="text-lg font-black text-slate-950">Enrollment #{enrollment.id}</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">Read-only record from GET /enrollments</p>
        </div>
        <button
          aria-label="Close enrollment details"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"
          onClick={onClose}
          type="button"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </header>

      <div className="grid gap-3 p-5 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Student</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">
              {getInitials(enrollment.student?.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-900">{enrollment.student?.name || 'Unknown student'}</p>
              <p className="truncate text-xs text-slate-500">{enrollment.student?.email || 'No email on file'}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Course</p>
          <p className="mt-2 text-sm font-black text-slate-900">{enrollment.course?.title || 'Unknown course'}</p>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Enrolled</p>
          <p className="mt-2 text-sm font-bold text-slate-800">{formatDate(enrollment.enrolledAt, true)}</p>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</p>
          <p className="mt-2">
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${enrollmentStatusClass(enrollment.status)}`}>
              {enrollment.status}
            </span>
          </p>
        </div>
      </div>
    </div>
  </div>
)

const RecentEnrollmentsTable = ({ enrollments = [], loading, error, globalSearch = '' }) => {
  const [search, setSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)

  const courseOptions = useMemo(() => {
    const map = new Map()

    enrollments.forEach((enrollment) => {
      if (enrollment.course?.id) {
        map.set(String(enrollment.course.id), enrollment.course.title || `Course #${enrollment.course.id}`)
      }
    })

    return Array.from(map, ([value, label]) => ({ value, label }))
  }, [enrollments])

  const statusOptions = useMemo(() => {
    const set = new Set(enrollments.map((enrollment) => enrollment.status).filter(Boolean))

    return Array.from(set).sort()
  }, [enrollments])

  const filtered = useMemo(() => {
    const query = `${globalSearch} ${search}`.trim()

    return enrollments.filter((enrollment) => {
      const matches = matchesSearch(query, [
        enrollment.student?.name,
        enrollment.student?.email,
        enrollment.course?.title,
        enrollment.status,
      ])
      const matchesCourse = !courseFilter || String(enrollment.course?.id) === String(courseFilter)
      const matchesStatus = !statusFilter || enrollment.status === statusFilter

      return matches && matchesCourse && matchesStatus
    })
  }, [courseFilter, enrollments, globalSearch, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-950">Recent Enrollments</h2>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">Students joining your courses</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <FontAwesomeIcon
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400"
                icon={faMagnifyingGlass}
              />
              <input
                aria-label="Search students"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-semibold outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 sm:w-48"
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
                placeholder="Search students..."
                type="search"
                value={search}
              />
            </div>
            <select
              aria-label="Filter by course"
              className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400 focus:bg-white"
              onChange={(event) => {
                setCourseFilter(event.target.value)
                setPage(1)
              }}
              value={courseFilter}
            >
              <option value="">All courses</option>
              {courseOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select
              aria-label="Filter by status"
              className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400 focus:bg-white"
              onChange={(event) => {
                setStatusFilter(event.target.value)
                setPage(1)
              }}
              value={statusFilter}
            >
              <option value="">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        {error ? (
          <p className="m-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-6 text-center text-sm font-semibold text-rose-600">
            {error}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Course</th>
                  <th className="px-5 py-3">Enrollment Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && enrollments.length === 0 && (
                  Array.from({ length: 4 }).map((_, index) => (
                    <tr key={`enrollment-skeleton-${index}`}>
                      <td className="px-5 py-4" colSpan={5}>
                        <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                      </td>
                    </tr>
                  ))
                )}

                {!loading && visible.length === 0 && (
                  <tr>
                    <td className="px-5 py-12 text-center text-sm font-semibold text-slate-500" colSpan={5}>
                      No enrollments match these filters.
                    </td>
                  </tr>
                )}

                {visible.map((enrollment) => (
                  <tr className="transition hover:bg-slate-50/70" key={enrollment.id}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[11px] font-black text-blue-700">
                          {getInitials(enrollment.student?.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="max-w-48 truncate font-black text-slate-900">{enrollment.student?.name || 'Unknown'}</p>
                          <p className="max-w-48 truncate text-xs text-slate-500">{enrollment.student?.email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-56 truncate px-5 py-3 text-xs font-semibold text-slate-700">
                      {enrollment.course?.title || `Course #${enrollment.courseId ?? '—'}`}
                    </td>
                    <td className="px-5 py-3 text-xs font-semibold text-slate-600">
                      {formatDate(enrollment.enrolledAt)}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${enrollmentStatusClass(enrollment.status)}`}>
                        {enrollment.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end">
                        <button
                          aria-label={`View enrollment for ${enrollment.student?.name || 'student'}`}
                          className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold text-blue-600 transition hover:bg-blue-50"
                          onClick={() => setSelected(enrollment)}
                          type="button"
                        >
                          <FontAwesomeIcon icon={faEye} />
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold text-slate-500">
            {filtered.length.toLocaleString()} enrollment{filtered.length === 1 ? '' : 's'} found
          </p>
          <div className="flex items-center gap-2">
            <button
              className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
              type="button"
            >
              Prev
            </button>
            <span className="text-xs font-bold text-slate-500">
              Page {currentPage} / {totalPages}
            </span>
            <button
              className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={currentPage >= totalPages}
              onClick={() => setPage(currentPage + 1)}
              type="button"
            >
              Next
            </button>
            <a className="hidden text-xs font-black text-blue-600 hover:underline sm:block" href="/admin/enrollments">
              View all
            </a>
          </div>
        </div>
      </section>

      {selected && <EnrollmentDetailsModal enrollment={selected} onClose={() => setSelected(null)} />}
    </>
  )
}

export default RecentEnrollmentsTable
