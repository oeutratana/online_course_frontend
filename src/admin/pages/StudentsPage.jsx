import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowUp,
  faBookOpen,
  faCalendarCheck,
  faCertificate,
  faEllipsisVertical,
  faFilter,
  faMagnifyingGlass,
  faPen,
  faUserGraduate,
} from '@fortawesome/free-solid-svg-icons'
import AdminPageHeader from './AdminPageHeader'
import { getEnrollments, getLessonProgress, getUsers } from '../../lib/courseApi'
import { getUserRole } from '../../lib/authApi'

const stats = [
  { label: 'Active Students', value: '0', note: '0% from last month', icon: faUserGraduate, color: 'bg-violet-100 text-violet-700' },
  { label: 'New This Month', value: '0', note: '0% from last month', icon: faCalendarCheck, color: 'bg-cyan-100 text-cyan-700' },
  { label: 'Completion Rate', value: '0%', note: '0% from last month', icon: faCertificate, color: 'bg-emerald-100 text-emerald-700' },
]

const StudentsPage = ({ searchQuery = '' }) => {
  const [studentItems, setStudentItems] = useState([])
  const [progressItems, setProgressItems] = useState([])
  const [enrollmentItems, setEnrollmentItems] = useState([])
  const [localSearch, setLocalSearch] = useState('')

  useEffect(() => {
    let isMounted = true

    Promise.all([getUsers(), getEnrollments(), getLessonProgress()])
      .then(([users, enrollments, progress]) => {
        if (!isMounted) return

        if (users.length > 0) {
          const studentUsers = users.filter((user) => getUserRole(user) === 'student')
          const studentUserIds = new Set(studentUsers.map((user) => String(user.id)))
          const studentEnrollments = enrollments.filter((item) => studentUserIds.has(String(item.user_id)))
          const studentProgress = progress.filter((item) => studentUserIds.has(String(item.user_id)))

          setStudentItems(studentUsers.map((user) => {
            const enrollment = enrollments.find((item) => String(item.user_id) === String(user.id))
            const progressItem = progress.find((item) => String(item.user_id) === String(user.id))
            const progressValue = progressItem?.progress || progressItem?.percentage || enrollment?.progress || 0

            return {
              name: user.name || 'Student',
              email: user.email || 'No email',
              course: enrollment?.course?.title || enrollment?.course_title || 'No course',
              progress: `${progressValue}%`,
              joined: user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown',
              status: user.status || 'Active',
              avatar: user.avatar || user.photo || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
            }
          }))

          setEnrollmentItems(studentEnrollments)
          setProgressItems(studentProgress)
        } else {
          setEnrollmentItems([])
          setProgressItems([])
        }
      })
      .catch(() => {
        if (isMounted) {
          setStudentItems([])
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const dynamicStats = [
    { ...stats[0], value: studentItems.length.toLocaleString() },
    { ...stats[1], value: enrollmentItems.length.toLocaleString() },
    {
      ...stats[2],
      value: progressItems.length > 0
        ? `${Math.round(progressItems.reduce((total, item) => total + Number(item.progress || item.percentage || 0), 0) / progressItems.length)}%`
        : '0%',
    },
  ]
  const normalizedSearch = (localSearch || searchQuery).trim().toLowerCase()
  const filteredStudentItems = normalizedSearch
    ? studentItems.filter((student) => [
      student.name,
      student.email,
      student.course,
      student.progress,
      student.joined,
      student.status,
    ].join(' ').toLowerCase().includes(normalizedSearch))
    : studentItems

  return (
  <div className="px-5 py-8 xl:px-8">
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <AdminPageHeader title="Students" text="Track student enrollments, activity, and account status." />
      <button className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 text-sm font-black text-white shadow-lg shadow-violet-200" type="button">
        <FontAwesomeIcon icon={faPen} />
        Edit Student
      </button>
    </div>

    <div className="mt-8 grid gap-5 md:grid-cols-3">
      {dynamicStats.map((stat) => (
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
          <p className="mt-5 flex items-center gap-2 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1 font-black text-emerald-500">
              <FontAwesomeIcon icon={faArrowUp} />
              {stat.note.split(' ')[0]}
            </span>
            {stat.note.replace(stat.note.split(' ')[0], '')}
          </p>
        </article>
      ))}
    </div>

    <section className="mt-8 rounded-2xl border border-slate-100 bg-white shadow-lg shadow-slate-200/50">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-black">Student Directory</h2>
          <p className="mt-1 text-sm text-slate-500">Review learner progress and enrollment status.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative">
            <FontAwesomeIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" icon={faMagnifyingGlass} />
            <input
              className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 sm:w-72"
              onChange={(event) => setLocalSearch(event.target.value)}
              placeholder="Search students..."
              type="search"
              value={localSearch || searchQuery}
            />
          </label>
          <button className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700" type="button">
            <FontAwesomeIcon icon={faFilter} />
            Filter
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-500">
            <tr>
              <th className="px-5 py-4">Student</th>
              <th className="px-5 py-4">Course</th>
              <th className="px-5 py-4">Progress</th>
              <th className="px-5 py-4">Joined</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStudentItems.map((student) => (
              <tr className="hover:bg-slate-50/70" key={student.email}>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <img className="h-11 w-11 rounded-full object-cover" src={student.avatar} alt={student.name} />
                    <div>
                      <p className="font-black">{student.name}</p>
                      <p className="text-slate-500">{student.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="inline-flex items-center gap-2 font-semibold text-slate-700">
                    <FontAwesomeIcon className="text-violet-500" icon={faBookOpen} />
                    {student.course}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-28 rounded-full bg-slate-100">
                      <span className="block h-full rounded-full bg-violet-500" style={{ width: student.progress }} />
                    </div>
                    <span className="font-black">{student.progress}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-slate-600">{student.joined}</td>
                <td className="px-5 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${student.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {student.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-right text-slate-400">
                  <FontAwesomeIcon icon={faEllipsisVertical} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  </div>
  )
}

export default StudentsPage
