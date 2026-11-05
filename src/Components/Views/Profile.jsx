import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowRightFromBracket,
  faBookOpen,
  faCheck,
  faCircleCheck,
  faCircleUser,
  faClock,
  faEnvelope,
  faGraduationCap,
  faKey,
  faLock,
  faReceipt,
  faTriangleExclamation,
  faUser,
} from '@fortawesome/free-solid-svg-icons'
import { getUserProfile, updateUserProfile, logout, getUserRole } from '../../lib/authApi'

const TABS = [
  { key: 'account', label: 'Account', icon: faUser },
  { key: 'security', label: 'Password', icon: faKey },
  { key: 'activity', label: 'Activity', icon: faClock },
]

const toNumber = (value) => {
  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : 0
}

const formatDate = (value) => {
  if (!value) return '—'

  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const PAYMENT_BADGE = {
  paid: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  expired: 'bg-slate-200 text-slate-600',
  failed: 'bg-red-100 text-red-700',
}

const Profile = () => {
  const [activeTab, setActiveTab] = useState('account')
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [account, setAccount] = useState({ name: '', email: '' })
  const [passwords, setPasswords] = useState({ password: '', confirmation: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false

    getUserProfile()
      .then((user) => {
        if (ignore) return

        setProfile(user)
        setAccount({ name: user.name || '', email: user.email || '' })
      })
      .catch((err) => {
        if (ignore) return

        if (err?.status === 401) {
          window.location.href = '/login'
          return
        }

        setLoadError(err?.message || 'Your profile could not be loaded from the backend.')
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [])

  const handleAccountChange = (field) => (event) => {
    const { value } = event.target
    setAccount((current) => ({ ...current, [field]: value }))
    setSaved(false)
    setError('')
  }

  const handlePasswordChange = (field) => (event) => {
    const { value } = event.target
    setPasswords((current) => ({ ...current, [field]: value }))
    setSaved(false)
    setError('')
  }

  const saveAccount = async () => {
    setSaving(true)
    setError('')

    try {
      const user = await updateUserProfile({
        name: account.name.trim(),
        email: account.email.trim(),
      })

      setProfile((current) => ({ ...current, ...user }))
      setAccount({ name: user.name || '', email: user.email || '' })
      setSaved(true)
    } catch (err) {
      setError(err?.message || "Couldn't save your changes. Try again.")
    } finally {
      setSaving(false)
    }
  }

  const savePassword = async () => {
    if (passwords.password.length < 8) {
      setError('Your new password must be at least 8 characters long.')
      return
    }

    if (passwords.password !== passwords.confirmation) {
      setError('The two passwords do not match.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const user = await updateUserProfile({ password: passwords.password })

      setProfile((current) => ({ ...current, ...user }))
      setPasswords({ password: '', confirmation: '' })
      setSaved(true)
    } catch (err) {
      setError(err?.message || "Couldn't update your password. Try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#f7f8ff] px-6 text-slate-700">
        <div className="text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#edf0ff] text-xl text-[#302be2]">
            <FontAwesomeIcon icon={faCircleUser} />
          </span>
          <p className="mt-4 text-lg font-black text-[#111827]">Loading your profile...</p>
          <p className="mt-1 text-sm">Fetching your account details from the backend.</p>
        </div>
      </main>
    )
  }

  if (loadError) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#f7f8ff] px-6">
        <div className="w-full max-w-lg rounded-xl border border-red-200 bg-white p-10 text-center shadow-sm">
          <h1 className="text-xl font-black text-slate-900">Profile unavailable</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{loadError}</p>
          <a
            href="/my-courses"
            className="mt-6 inline-flex h-12 items-center justify-center rounded-lg bg-[#302be2] px-7 text-sm font-black text-white transition hover:bg-[#1916b8]"
          >
            Back to My Courses
          </a>
        </div>
      </main>
    )
  }

  const role = getUserRole(profile) || 'student'
  const enrollments = Array.isArray(profile?.enrollments) ? profile.enrollments : []
  const lessonProgress = Array.isArray(profile?.lessonProgress) ? profile.lessonProgress : []
  const payments = Array.isArray(profile?.payments) ? profile.payments : []
  const authoredCourses = Array.isArray(profile?.courses) ? profile.courses : []

  const completedLessons = lessonProgress.filter((item) => item?.is_completed).length
  const totalSpent = payments
    .filter((payment) => String(payment?.status).toLowerCase() === 'paid')
    .reduce((sum, payment) => sum + toNumber(payment?.amount), 0)

  const initials = (profile?.name || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'U'

  const stats = [
    { label: 'Enrolled courses', value: enrollments.length, icon: faBookOpen },
    { label: 'Lessons completed', value: completedLessons, icon: faGraduationCap },
    { label: 'Published courses', value: authoredCourses.length, icon: faClock },
    { label: 'Total spent', value: `$${totalSpent.toFixed(2)}`, icon: faReceipt },
  ]

  return (
    <main className="bg-[#f7f8ff] px-4 py-10 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
          <div className="h-24 w-full bg-[#302be2] sm:h-28" />
          <div className="px-6 pb-8 sm:px-10">
            <div className="-mt-12 flex flex-col gap-6 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-end">
                <span className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-[#edf0ff] text-3xl font-black text-[#302be2] shadow-lg sm:h-32 sm:w-32">
                  {initials}
                </span>
                <div className="pb-1">
                  <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                    {profile?.name || 'Your name'}
                  </h1>
                  <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                    <FontAwesomeIcon className="text-slate-400" icon={faEnvelope} />
                    {profile?.email || 'No email on file'}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#edf0ff] px-3 py-1 text-[10px] font-black uppercase tracking-wide text-[#302be2]">
                      {role}
                    </span>
                    {profile?.email_verified_at ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700">
                        <FontAwesomeIcon icon={faCircleCheck} />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-amber-700">
                        Unverified
                      </span>
                    )}
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600">
                      Joined {formatDate(profile?.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                  href="/my-courses"
                >
                  <FontAwesomeIcon icon={faBookOpen} />
                  My Courses
                </a>
                <button
                  onClick={handleLogout}
                  type="button"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-5 text-sm font-black text-red-600 transition hover:bg-red-100"
                >
                  <FontAwesomeIcon icon={faArrowRightFromBracket} />
                  Log out
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <article
              key={stat.label}
              className="flex items-center gap-4 rounded-xl border border-slate-300 bg-white p-5 shadow-sm"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#edf0ff] text-[#302be2]">
                <FontAwesomeIcon icon={stat.icon} />
              </span>
              <div>
                <p className="text-2xl font-black leading-none">{stat.value}</p>
                <p className="mt-1.5 text-xs font-medium text-slate-600">{stat.label}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[15rem_1fr]">
          <aside className="h-fit rounded-xl border border-slate-300 bg-white p-3 shadow-sm lg:sticky lg:top-6">
            <nav className="flex gap-1 overflow-x-auto lg:flex-col">
              {TABS.map((tab) => {
                const active = activeTab === tab.key

                return (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setActiveTab(tab.key)
                      setSaved(false)
                      setError('')
                    }}
                    type="button"
                    className={`flex shrink-0 items-center gap-3 rounded-lg px-4 py-3 text-sm font-black transition ${
                      active ? 'bg-[#302be2] text-white' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <FontAwesomeIcon icon={tab.icon} />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </aside>

          <section className="rounded-xl border border-slate-300 bg-white p-6 shadow-sm sm:p-9">
            {activeTab === 'account' && (
              <>
                <PanelHeader
                  title="Account details"
                  subtitle="These values map directly to the name and email columns on the users table."
                  icon={faUser}
                />
                <div className="mt-8 grid gap-6 sm:grid-cols-2">
                  <Field
                    label="Full name"
                    value={account.name}
                    onChange={handleAccountChange('name')}
                    placeholder="John Doe"
                    maxLength={255}
                  />
                  <Field
                    label="Email address"
                    type="email"
                    value={account.email}
                    onChange={handleAccountChange('email')}
                    placeholder="john@example.com"
                    maxLength={255}
                  />
                  <Field label="User ID" value={`#${profile?.id ?? '—'}`} disabled />
                  <Field label="Role" value={role} disabled />
                </div>
                <ActionBar
                  error={error}
                  saved={saved}
                  saving={saving}
                  onSave={saveAccount}
                />
              </>
            )}

            {activeTab === 'security' && (
              <>
                <PanelHeader
                  title="Change password"
                  subtitle="Passwords are hashed by the backend with bcrypt. Minimum length is 8 characters."
                  icon={faLock}
                />
                <div className="mt-8 grid gap-6 sm:grid-cols-2">
                  <Field
                    label="New password"
                    type="password"
                    value={passwords.password}
                    onChange={handlePasswordChange('password')}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                  />
                  <Field
                    label="Confirm new password"
                    type="password"
                    value={passwords.confirmation}
                    onChange={handlePasswordChange('confirmation')}
                    placeholder="Repeat your new password"
                    autoComplete="new-password"
                  />
                </div>
                <ActionBar
                  error={error}
                  saved={saved}
                  saving={saving}
                  onSave={savePassword}
                />
              </>
            )}

            {activeTab === 'activity' && (
              <>
                <PanelHeader
                  title="Learning activity"
                  subtitle="Enrollments, lesson progress and payments returned by GET /user/profile."
                  icon={faClock}
                />

                <div className="mt-8 space-y-8">
                  <ActivityGroup title="Enrollments" empty="You are not enrolled in any course yet.">
                    {enrollments.map((enrollment) => (
                      <li
                        key={enrollment.id}
                        className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-b-0"
                      >
                        <div>
                          <p className="text-sm font-black">
                            {enrollment.course?.title || `Course #${enrollment.course_id ?? '—'}`}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            Enrolled {formatDate(enrollment.enrolled_at)}
                          </p>
                        </div>
                        <span className="rounded-full bg-[#edf0ff] px-3 py-1 text-[10px] font-black uppercase tracking-wide text-[#302be2]">
                          {enrollment.status || 'active'}
                        </span>
                      </li>
                    ))}
                  </ActivityGroup>

                  <ActivityGroup
                    title="Lesson progress"
                    empty="No lessons have been started yet."
                  >
                    {lessonProgress.map((item) => (
                      <li
                        key={item.id}
                        className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-b-0"
                      >
                        <div>
                          <p className="text-sm font-black">
                            {item.lesson?.title || `Lesson #${item.lesson_id ?? '—'}`}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {item.is_completed
                              ? `Completed ${formatDate(item.completed_at)}`
                              : 'In progress'}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide ${
                            item.is_completed
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {item.is_completed ? 'Completed' : 'Active'}
                        </span>
                      </li>
                    ))}
                  </ActivityGroup>

                  <ActivityGroup title="Payments" empty="No payments have been recorded yet.">
                    {payments.map((payment) => {
                      const status = String(payment.status || 'pending').toLowerCase()

                      return (
                        <li
                          key={payment.id}
                          className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-b-0"
                        >
                          <div>
                            <p className="text-sm font-black">
                              {payment.course?.title || `Course #${payment.course_id ?? '—'}`}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {payment.method || 'PayWay'} · {formatDate(payment.paid_at || payment.created_at)}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-black text-[#2114e8]">
                              ${toNumber(payment.amount).toFixed(2)}
                            </span>
                            <span
                              className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide ${
                                PAYMENT_BADGE[status] || 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {status}
                            </span>
                          </div>
                        </li>
                      )
                    })}
                  </ActivityGroup>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}

function PanelHeader({ title, subtitle, icon }) {
  return (
    <div className="flex items-start gap-4 border-b border-slate-200 pb-6">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#edf0ff] text-[#302be2]">
        <FontAwesomeIcon icon={icon} />
      </span>
      <div>
        <h2 className="text-xl font-black tracking-tight sm:text-2xl">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">{subtitle}</p>
      </div>
    </div>
  )
}

function ActivityGroup({ title, empty, children }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children
  const hasItems = Array.isArray(items) ? items.length > 0 : Boolean(items)

  return (
    <div>
      <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">{title}</h3>
      {hasItems ? (
        <ul className="mt-3">{items}</ul>
      ) : (
        <p className="mt-3 rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
          {empty}
        </p>
      )}
    </div>
  )
}

function ActionBar({ error, saved, saving, onSave }) {
  return (
    <>
      {error && (
        <p className="mt-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          <FontAwesomeIcon className="mt-0.5" icon={faTriangleExclamation} />
          {error}
        </p>
      )}

      {saved && (
        <p className="mt-6 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          <FontAwesomeIcon icon={faCheck} />
          Saved successfully.
        </p>
      )}

      <div className="mt-8 flex justify-end border-t border-slate-200 pt-6">
        <button
          onClick={onSave}
          disabled={saving}
          type="button"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#302be2] px-7 text-sm font-black text-white transition hover:bg-[#1916b8] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FontAwesomeIcon icon={faCheck} />
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  disabled,
  maxLength,
  autoComplete,
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-950">
      <span>{label}</span>
      <input
        type={type}
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        autoComplete={autoComplete}
        className="h-12 rounded-lg border border-slate-300 bg-white px-4 text-base font-normal text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#302be2] focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
      />
    </label>
  )
}

export default Profile
