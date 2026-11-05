import { useEffect, useMemo, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCircleCheck,
  faCircleXmark,
  faListCheck,
  faMagnifyingGlass,
  faPercent,
  faPlay,
} from '@fortawesome/free-solid-svg-icons'
import AdminPageHeader from './AdminPageHeader'
import { getAdminLessonProgress } from '../../lib/adminApi'
import { formatDate, getInitials, matchesSearch } from '../adminUtils'

const ProgressPage = ({ searchQuery = '' }) => {
  const [progress, setProgress] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let isMounted = true

    getAdminLessonProgress()
      .then((result) => {
        if (isMounted) setProgress(result)
      })
      .catch((requestError) => {
        if (isMounted) setLoadError(requestError?.message || 'Lesson progress could not be loaded.')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const stats = useMemo(() => {
    const completed = progress.filter((item) => item.isCompleted).length

    return {
      tracked: progress.length,
      completed,
      pending: progress.length - completed,
      rate: progress.length > 0 ? Math.round((completed / progress.length) * 100) : 0,
    }
  }, [progress])

  const filteredProgress = useMemo(() => progress
    .filter((item) => {
      if (filter === 'all') return true

      return filter === 'completed' ? item.isCompleted : !item.isCompleted
    })
    .filter((item) => matchesSearch(searchQuery, [
      item.user?.name,
      item.user?.email,
      item.lesson?.title,
      item.course?.title,
    ])), [progress, filter, searchQuery])

  return (
    <div className="px-5 py-8 xl:px-8">
      <AdminPageHeader
        title="Lesson Progress"
        text="Tracking rows from GET /lesson-progress. Every row ties a user to a lesson; the course is nested under lesson.course because the API has no direct course_id on progress records."
      />

      {loadError && (
        <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          {loadError}
        </p>
      )}

      <div className="mt-8 grid gap-5 md:grid-cols-4">
        {[
          { label: 'Tracking Rows', value: stats.tracked.toLocaleString(), icon: faListCheck, color: 'bg-violet-100 text-violet-700' },
          { label: 'Completed Lessons', value: stats.completed.toLocaleString(), icon: faCircleCheck, color: 'bg-emerald-100 text-emerald-700' },
          { label: 'In Progress', value: stats.pending.toLocaleString(), icon: faCircleXmark, color: 'bg-amber-100 text-amber-700' },
          { label: 'Completion Rate', value: `${stats.rate}%`, icon: faPercent, color: 'bg-cyan-100 text-cyan-700' },
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
            <h2 className="text-xl font-black">Progress Records</h2>
            <p className="mt-1 text-sm text-slate-500">
              Use the header search box to filter by student, lesson or course.
            </p>
          </div>
          <label className="block">
            <span className="sr-only">Filter by completion</span>
            <select
              className="h-11 rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              onChange={(event) => setFilter(event.target.value)}
              value={filter}
            >
              <option value="all">All records</option>
              <option value="completed">Completed</option>
              <option value="pending">Not completed</option>
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
                <th className="px-5 py-4">Lesson</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Completed At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td className="px-5 py-6 text-slate-500" colSpan={6}>Loading lesson progress...</td>
                </tr>
              )}
              {!loading && filteredProgress.length === 0 && (
                <tr>
                  <td className="px-5 py-6 text-slate-500" colSpan={6}>No progress records match this view.</td>
                </tr>
              )}
              {filteredProgress.map((item) => (
                <tr className="hover:bg-slate-50/70" key={item.id}>
                  <td className="px-5 py-4 font-bold text-slate-500">#{item.id}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf0ff] text-xs font-black text-[#302be2]">
                        {getInitials(item.user?.name)}
                      </span>
                      <div>
                        <p className="font-black">{item.user?.name || 'Unknown'}</p>
                        <p className="text-slate-500">{item.user?.email || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-700">{item.course?.title || '—'}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-2 font-semibold text-slate-700">
                      <FontAwesomeIcon className="text-[#302be2]" icon={faPlay} />
                      {item.lesson?.title || 'Unknown lesson'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${item.isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {item.isCompleted ? 'COMPLETED' : 'IN PROGRESS'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {item.isCompleted ? formatDate(item.completedAt, true) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="flex items-start gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 text-sm font-semibold text-slate-600">
          <FontAwesomeIcon className="mt-1" icon={faMagnifyingGlass} />
          Progress rows are created by the student app; the admin API exposes them read-only, so this table
          cannot mark a lesson complete for a learner.
        </p>
      </section>
    </div>
  )
}

export default ProgressPage