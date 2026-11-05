import { useEffect, useMemo, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCircleCheck,
  faCircleXmark,
  faGraduationCap,
  faListCheck,
  faMagnifyingGlass,
  faUserGraduate,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import AdminPageHeader from './AdminPageHeader'
import { getAdminEnrollments, getAdminLessonProgress } from '../../lib/adminApi'
import { getLessons } from '../../lib/courseApi'
import {
  enrollmentStatusClass,
  formatDate,
  getCourseProgress,
  getInitials,
  matchesSearch,
} from '../adminUtils'

const EnrollmentDetailsModal = ({ enrollmentId, onClose, progressIndex }) => {
  const [enrollment, setEnrollment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    getAdminEnrollments({ userId: enrollmentId.userId, courseId: enrollmentId.courseId })
      .then((result) => {
        if (!isMounted) return

        const match = result.find((item) => String(item.id) === String(enrollmentId.id))

        if (match) setEnrollment(match)
        else setError('This enrollment is no longer available.')
      })
      .catch((requestError) => {
        if (isMounted) setError(requestError?.message || 'Could not load this enrollment.')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [enrollmentId])

  const rows = useMemo(() => progressIndex.lessons.filter((lesson) => (
    String(lesson.courseId) === String(enrollmentId.courseId)
  )), [enrollmentId.courseId, progressIndex.lessons])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
          <div>
            <h3 className="text-xl font-black tracking-tight text-slate-950">
              Enrollment #{enrollmentId.id}
            </h3>
            <p className="mt-1 text-sm text-slate-500">GET /enrollments · progress derived from /lesson-progress</p>
          </div>
          <button
            aria-label="Close enrollment details"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
            onClick={onClose}
            type="button"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </header>

        <div className="grid gap-6 p-6">
          {loading && <p className="text-sm font-semibold text-slate-500">Loading enrollment...</p>}
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </p>
          )}

          {enrollment && (
            <>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <dt className="text-xs font-black uppercase tracking-widest text-slate-500">Student</dt>
                  <dd className="mt-1 font-black text-slate-900">{enrollment.user?.name || 'Unknown'}</dd>
                  <dd className="text-sm text-slate-500">{enrollment.user?.email || '—'}</dd>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <dt className="text-xs font-black uppercase tracking-widest text-slate-500">Course</dt>
                  <dd className="mt-1 font-black text-slate-900">{enrollment.course?.title || 'Unknown'}</dd>
                  <dd className="text-sm text-slate-500">{formatDate(enrollment.enrolledAt)}</dd>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
                  <dt className="text-xs font-black uppercase tracking-widest text-slate-500">Status</dt>
                  <dd className="mt-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${enrollmentStatusClass(enrollment.status)}`}>
                      {(enrollment.status || 'unknown').toUpperCase()}
                    </span>
                  </dd>
                  <dd className="mt-2 text-sm text-slate-500">
                    Enrolled at: {formatDate(enrollment.enrolledAt, true)} · created {formatDate(enrollment.createdAt, true)}
                  </dd>
                </div>
              </dl>

              <div>
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-500">Lesson progress</h4>
                {rows.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">This course has no lessons yet.</p>
                ) : (
                  <ul className="mt-3 grid gap-2">
                    {rows.map((lesson) => {
                      const record = progressIndex.byKey.get(`${enrollmentId.userId}:${lesson.id}`)
                      const done = Boolean(record?.isCompleted)

                      return (
                        <li className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3" key={lesson.id}>
                          <span className="font-semibold text-slate-700">{lesson.title}</span>
                          <span className={`inline-flex items-center gap-2 text-xs font-black ${done ? 'text-emerald-600' : 'text-slate-400'}`}>
                            <FontAwesomeIcon icon={done ? faCircleCheck : faCircleXmark} />
                            {done ? formatDate(record?.completedAt) : 'Not completed'}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>

        <footer className="flex justify-end border-t border-slate-100 p-6">
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            onClick={onClose}
            type="button"
          >
            Close window
          </button>
        </footer>
      </div>
    </div>
  )
}

const EnrollmentsPage = ({ searchQuery = '' }) => {
  const [enrollments, setEnrollments] = useState([])
  const [lessons, setLessons] = useState([])
  const [progress, setProgress] = useState([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [inspect, setInspect] = useState(null)

  useEffect(() => {
    let isMounted = true

    Promise.allSettled([getAdminEnrollments(), getLessons(), getAdminLessonProgress()])
      .then(([enrollmentsResult, lessonsResult, progressResult]) => {
        if (!isMounted) return

        const failures = [enrollmentsResult, lessonsResult, progressResult]
          .filter((result) => result.status === 'rejected')
          .map((result) => result.reason?.message)
          .filter(Boolean)

        if (failures.length > 0) {
          setLoadError(`Some enrollment data could not load. ${failures.join(' ')}`)
        }

        setEnrollments(enrollmentsResult.status === 'fulfilled' ? enrollmentsResult.value : [])
        setLessons(lessonsResult.status === 'fulfilled' ? lessonsResult.value : [])
        setProgress(progressResult.status === 'fulfilled' ? progressResult.value : [])
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const progressIndex = useMemo(() => ({
    lessons: lessons.map((lesson) => ({
      id: lesson.id,
      courseId: lesson.courseId,
      title: lesson.title || 'Untitled lesson',
      order: lesson.order ?? 0,
    })),
    byKey: new Map(progress.map((item) => [
      `${item.userId}:${item.lessonId}`,
      item,
    ])),
  }), [lessons, progress])

  const rows = useMemo(() => enrollments.map((enrollment) => {
    const courseLessons = progressIndex.lessons.filter((lesson) => (
      String(lesson.courseId) === String(enrollment.courseId)
    ))
    const completedLessons = courseLessons.filter((lesson) => (
      progressIndex.byKey.get(`${enrollment.userId}:${lesson.id}`)?.isCompleted
    )).length

    return {
      enrollment,
      totalLessons: courseLessons.length,
      completedLessons,
      percent: getCourseProgress({ totalLessons: courseLessons.length, completedLessons }),
    }
  }), [enrollments, progressIndex])

  const stats = useMemo(() => ({
    total: rows.length,
    active: rows.filter((row) => row.enrollment.status === 'active').length,
    completed: rows.filter((row) => row.totalLessons > 0 && row.percent === 100).length,
    averageProgress: rows.length > 0
      ? Math.round(rows.reduce((total, row) => total + row.percent, 0) / rows.length)
      : 0,
  }), [rows])

  const filteredRows = useMemo(() => rows
    .filter((row) => (status ? row.enrollment.status === status : true))
    .filter((row) => matchesSearch(searchQuery, [
      row.enrollment.user?.name,
      row.enrollment.user?.email,
      row.enrollment.course?.title,
      row.enrollment.status,
    ])), [rows, searchQuery, status])

  return (
    <div className="px-5 py-8 xl:px-8">
      <AdminPageHeader
        title="Enrollments"
        text="Every enrollment from GET /enrollments. The API stores no percentage, so course progress here is derived by matching /lesson-progress rows against each course's lessons."
      />

      {loadError && (
        <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          {loadError}
        </p>
      )}

      <div className="mt-8 grid gap-5 md:grid-cols-4">
        {[
          { label: 'Total Enrollments', value: stats.total.toLocaleString(), icon: faGraduationCap, color: 'bg-violet-100 text-violet-700' },
          { label: 'Active', value: stats.active.toLocaleString(), icon: faUserGraduate, color: 'bg-emerald-100 text-emerald-700' },
          { label: 'Courses Completed', value: stats.completed.toLocaleString(), icon: faCircleCheck, color: 'bg-cyan-100 text-cyan-700' },
          { label: 'Average Progress', value: `${stats.averageProgress}%`, icon: faListCheck, color: 'bg-amber-100 text-amber-700' },
        ].map((stat) => (
          <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/50" key={stat.label}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight">{stat.value}</h2>
              </div>
              <span className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${stat.color}`}>
                <FontAwesomeIcon icon={stat.icon} />
              </span>
            </div>
          </article>
        ))}
      </div>

      <section className="mt-8 rounded-2xl border border-slate-100 bg-white shadow-lg shadow-slate-200/50">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-black">Enrollment Directory</h2>
            <p className="mt-1 text-sm text-slate-500">
              Use the search box in the header to filter by student, course or status.
            </p>
          </div>
          <label className="block">
            <span className="sr-only">Filter by status</span>
            <select
              className="h-11 rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              onChange={(event) => setStatus(event.target.value)}
              value={status}
            >
              <option value="">All statuses</option>
              <option value="active">active</option>
              <option value="cancelled">cancelled</option>
            </select>
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-5 py-4">ID</th>
                <th className="px-5 py-4">Student</th>
                <th className="px-5 py-4">Course</th>
                <th className="px-5 py-4">Progress</th>
                <th className="px-5 py-4">Enrolled</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td className="px-5 py-6 text-slate-500" colSpan={7}>Loading enrollments...</td>
                </tr>
              )}
              {!loading && filteredRows.length === 0 && (
                <tr>
                  <td className="px-5 py-6 text-slate-500" colSpan={7}>No enrollments match this view.</td>
                </tr>
              )}
              {filteredRows.map((row) => (
                <tr className="hover:bg-slate-50/70" key={row.enrollment.id}>
                  <td className="px-5 py-4 font-bold text-slate-500">#{row.enrollment.id}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf0ff] text-xs font-black text-[#302be2]">
                        {getInitials(row.enrollment.user?.name)}
                      </span>
                      <div>
                        <p className="font-black">{row.enrollment.user?.name || 'Unknown'}</p>
                        <p className="text-slate-500">{row.enrollment.user?.email || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-700">{row.enrollment.course?.title || '—'}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-28 rounded-full bg-slate-100">
                        <span className="block h-full rounded-full bg-[#302be2]" style={{ width: `${row.percent}%` }} />
                      </div>
                      <span className="font-black">{row.percent}%</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {row.completedLessons} / {row.totalLessons} lessons
                    </p>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{formatDate(row.enrollment.enrolledAt)}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${enrollmentStatusClass(row.enrollment.status)}`}>
                      {(row.enrollment.status || 'unknown').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#302be2] px-3 text-xs font-black text-white transition hover:bg-[#1916b8]"
                      onClick={() => setInspect(row.enrollment)}
                      type="button"
                    >
                      <FontAwesomeIcon icon={faMagnifyingGlass} />
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {inspect && (
        <EnrollmentDetailsModal
          enrollmentId={{ id: inspect.id, userId: inspect.userId, courseId: inspect.courseId }}
          onClose={() => setInspect(null)}
          progressIndex={progressIndex}
        />
      )}
    </div>
  )
}

export default EnrollmentsPage