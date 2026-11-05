import { useCallback, useEffect, useMemo, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCircleInfo,
  faMagnifyingGlass,
  faPen,
  faUserPlus,
  faUsers,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import AdminPageHeader from './AdminPageHeader'
import {
  ASSIGNABLE_USER_ROLES,
  USER_ROLES,
  createAdminUser,
  getAdminEnrollments,
  getAdminUser,
  getAdminUsers,
} from '../../lib/adminApi'
import { formatDate, getInitials, matchesSearch, roleClass } from '../adminUtils'

const UserFormModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const created = await createAdminUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      })

      onCreated(created)
      onClose()
    } catch (requestError) {
      setError(requestError?.message || 'The user could not be created.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
          <div>
            <h3 className="text-xl font-black tracking-tight text-slate-950">Add User</h3>
            <p className="mt-1 text-sm text-slate-500">POST /users · name, email, password and role are validated server-side</p>
          </div>
          <button
            aria-label="Close add user"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
            onClick={onClose}
            type="button"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </header>

        <form className="grid gap-4 p-6" onSubmit={handleSubmit}>
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </p>
          )}

          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Name
            <input
              className="h-12 rounded-lg border border-slate-200 bg-slate-50 px-4 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              onChange={handleChange('name')}
              placeholder="Alex Morgan"
              required
              type="text"
              value={form.name}
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Email
            <input
              className="h-12 rounded-lg border border-slate-200 bg-slate-50 px-4 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              onChange={handleChange('email')}
              placeholder="alex@example.com"
              required
              type="email"
              value={form.email}
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Password
            <input
              className="h-12 rounded-lg border border-slate-200 bg-slate-50 px-4 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              minLength={8}
              onChange={handleChange('password')}
              placeholder="Minimum 8 characters"
              required
              type="password"
              value={form.password}
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Role
            <select
              className="h-12 rounded-lg border border-slate-200 bg-slate-50 px-4 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              onChange={handleChange('role')}
              value={form.role}
            >
              {ASSIGNABLE_USER_ROLES.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </label>

          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#302be2] px-5 text-sm font-black text-white transition hover:bg-[#1916b8] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving}
              type="submit"
            >
              <FontAwesomeIcon icon={faUserPlus} />
              {saving ? 'Creating...' : 'Create user'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const UserDetailModal = ({ userId, onClose }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    getAdminUser(userId)
      .then((result) => {
        if (isMounted) setUser(result)
      })
      .catch((requestError) => {
        if (isMounted) setError(requestError?.message || 'Could not load this user.')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [userId])

  const completedLessons = useMemo(() => (
    (user?.lessonProgress || []).filter((item) => item?.is_completed).length
  ), [user])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
          <div>
            <h3 className="text-xl font-black tracking-tight text-slate-950">{user?.name || `User #${userId}`}</h3>
            <p className="mt-1 text-sm text-slate-500">GET /users/{userId} · courses, enrollments, lessonProgress and payments</p>
          </div>
          <button
            aria-label="Close user details"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
            onClick={onClose}
            type="button"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </header>

        <div className="grid gap-6 p-6">
          {loading && <p className="text-sm font-semibold text-slate-500">Loading user...</p>}
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </p>
          )}

          {user && (
            <>
              <p className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                <FontAwesomeIcon className="mt-1" icon={faCircleInfo} />
                The API has no PUT /users/{user.id} or DELETE /users/{user.id} route, so an admin cannot edit a
                user or change a role after creation. Name, email and password changes go through the
                self-service PUT /user/profile endpoint.
              </p>

              <dl className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <dt className="text-xs font-black uppercase tracking-widest text-slate-500">Email</dt>
                  <dd className="mt-1 font-black text-slate-900">{user.email}</dd>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <dt className="text-xs font-black uppercase tracking-widest text-slate-500">Role</dt>
                  <dd className="mt-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${roleClass(user.role)}`}>
                      {user.role.toUpperCase()}
                    </span>
                  </dd>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <dt className="text-xs font-black uppercase tracking-widest text-slate-500">Registered</dt>
                  <dd className="mt-1 font-black text-slate-900">{formatDate(user.createdAt)}</dd>
                </div>
              </dl>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: 'Enrollments', value: user.enrollments.length },
                  { label: 'Lessons Completed', value: `${completedLessons}/${user.lessonProgress.length}` },
                  { label: 'Payments', value: user.payments.length },
                ].map((item) => (
                  <div className="rounded-xl border border-slate-100 p-4" key={item.label}>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">{item.label}</p>
                    <p className="mt-1 text-2xl font-black text-slate-950">{item.value}</p>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-500">
                  Enrolled Courses ({user.enrollments.length})
                </h4>
                {user.enrollments.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">This user is not enrolled in any course.</p>
                ) : (
                  <ul className="mt-3 grid gap-2">
                    {user.enrollments.map((enrollment) => (
                      <li className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3" key={enrollment.id}>
                        <span className="font-semibold text-slate-700">
                          {enrollment.course?.title || `Course #${enrollment.course_id}`}
                        </span>
                        <span className="text-xs font-black uppercase text-slate-500">
                          {enrollment.status} · {formatDate(enrollment.enrolled_at)}
                        </span>
                      </li>
                    ))}
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

const UsersPage = ({ searchQuery = '' }) => {
  const [users, setUsers] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [role, setRole] = useState('')
  const [localSearch, setLocalSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [inspectId, setInspectId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')

    try {
      const [userList, enrollmentList] = await Promise.all([
        getAdminUsers(),
        getAdminEnrollments(),
      ])

      setUsers(userList)
      setEnrollments(enrollmentList)
    } catch (requestError) {
      setLoadError(requestError?.message || 'Users could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    Promise.all([getAdminUsers(), getAdminEnrollments()])
      .then(([userList, enrollmentList]) => {
        if (!isMounted) return

        setUsers(userList)
        setEnrollments(enrollmentList)
        setLoading(false)
      })
      .catch((requestError) => {
        if (!isMounted) return

        setLoadError(requestError?.message || 'Users could not be loaded.')
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const enrolledCourseCount = useMemo(() => enrollments.reduce((counts, enrollment) => {
    const key = String(enrollment.userId)
    const courseKey = String(enrollment.courseId)

    if (!counts.has(key)) counts.set(key, new Set())
    counts.get(key).add(courseKey)

    return counts
  }, new Map()), [enrollments])

  const rows = useMemo(() => users.map((user) => ({
    user,
    enrolledCourses: enrolledCourseCount.get(String(user.id))?.size ?? 0,
  })), [users, enrolledCourseCount])

  const stats = useMemo(() => ({
    total: rows.length,
    admins: rows.filter((row) => row.user.role === 'admin').length,
    instructors: rows.filter((row) => row.user.role === 'instructor').length,
    enrolled: rows.filter((row) => row.enrolledCourses > 0).length,
  }), [rows])

  const filteredRows = useMemo(() => rows
    .filter((row) => (role ? row.user.role === role : true))
    .filter((row) => matchesSearch(localSearch || searchQuery, [
      row.user.id,
      row.user.name,
      row.user.email,
      row.user.role,
    ])), [rows, role, localSearch, searchQuery])

  return (
    <div className="px-5 py-8 xl:px-8">
      <AdminPageHeader
        title="Users"
        text="Every account from GET /users. The API only accepts a role filter here, so free-text search runs in the browser, and enrolled-course counts come from GET /enrollments."
      >
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#302be2] px-5 text-sm font-black text-white shadow-lg shadow-indigo-200 transition hover:bg-[#1916b8]"
          onClick={() => setShowCreate(true)}
          type="button"
        >
          <FontAwesomeIcon icon={faUserPlus} />
          Add User
        </button>
      </AdminPageHeader>

      {loadError && (
        <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          {loadError}
        </p>
      )}

      <div className="mt-8 grid gap-5 md:grid-cols-4">
        {[
          { label: 'Total Users', value: stats.total.toLocaleString(), tone: 'bg-violet-100 text-violet-700' },
          { label: 'Admins', value: stats.admins.toLocaleString(), tone: 'bg-[#edf0ff] text-[#302be2]' },
          { label: 'Instructors', value: stats.instructors.toLocaleString(), tone: 'bg-cyan-100 text-cyan-700' },
          { label: 'With Enrollments', value: stats.enrolled.toLocaleString(), tone: 'bg-emerald-100 text-emerald-700' },
        ].map((stat) => (
          <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/50" key={stat.label}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight">{stat.value}</h2>
              </div>
              <span className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${stat.tone}`}>
                <FontAwesomeIcon icon={faUsers} />
              </span>
            </div>
          </article>
        ))}
      </div>

      <section className="mt-8 rounded-2xl border border-slate-100 bg-white shadow-lg shadow-slate-200/50">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-black">User Directory</h2>
            <p className="mt-1 text-sm text-slate-500">Search by name, email, role or id.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative block">
              <span className="sr-only">Search users</span>
              <FontAwesomeIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" icon={faMagnifyingGlass} />
              <input
                className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 sm:w-72"
                onChange={(event) => setLocalSearch(event.target.value)}
                placeholder="Search users..."
                type="search"
                value={localSearch || searchQuery}
              />
            </label>
            <label className="block">
              <span className="sr-only">Filter by role</span>
              <select
                className="h-11 rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                onChange={(event) => setRole(event.target.value)}
                value={role}
              >
                <option value="">All Roles</option>
                {USER_ROLES.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-5 py-4">ID</th>
                <th className="px-5 py-4">Name</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4">Enrolled Courses</th>
                <th className="px-5 py-4">Registered</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td className="px-5 py-6 text-slate-500" colSpan={7}>Loading users...</td>
                </tr>
              )}
              {!loading && filteredRows.length === 0 && (
                <tr>
                  <td className="px-5 py-6 text-slate-500" colSpan={7}>No users match this view.</td>
                </tr>
              )}
              {filteredRows.map((row) => (
                <tr className="hover:bg-slate-50/70" key={row.user.id}>
                  <td className="px-5 py-4 font-bold text-slate-500">{row.user.id}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf0ff] text-xs font-black text-[#302be2]">
                        {getInitials(row.user.name)}
                      </span>
                      <p className="font-black">{row.user.name || 'Unnamed'}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{row.user.email}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${roleClass(row.user.role)}`}>
                      {row.user.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-semibold text-slate-700">
                    {row.enrolledCourses > 0 ? `${row.enrolledCourses} Courses` : 'N/A'}
                  </td>
                  <td className="px-5 py-4 text-slate-600">{formatDate(row.user.createdAt)}</td>
                  <td className="px-5 py-4 text-right">
                    <button
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-black text-slate-700 transition hover:bg-slate-50"
                      onClick={() => setInspectId(row.user.id)}
                      type="button"
                    >
                      <FontAwesomeIcon icon={faPen} />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {showCreate && (
        <UserFormModal
          onClose={() => setShowCreate(false)}
          onCreated={() => load()}
        />
      )}

      {inspectId !== null && (
        <UserDetailModal onClose={() => setInspectId(null)} userId={inspectId} />
      )}
    </div>
  )
}

export default UsersPage