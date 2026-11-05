import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBookOpen,
  faCertificate,
  faClock,
  faGraduationCap,
  faPlay,
} from '@fortawesome/free-solid-svg-icons'
import {
  formatCoursePrice,
  getCertificates,
  getLessons,
  getMyCourses,
} from '../../lib/courseApi'
import { getCurrentUser } from '../../lib/authApi'

const getProgressValue = (course) => {
  const enrollment = course?.enrollment || {}

  const rawProgress = enrollment.progress
    ?? enrollment.progress_percent
    ?? enrollment.completed_percentage
    ?? course.raw?.progress

  const numericProgress = Number(rawProgress)

  if (!Number.isNaN(numericProgress) && numericProgress >= 0) {
    return Math.min(100, Math.round(numericProgress))
  }

  return null
}

const getEnrollmentStatus = (course) => {
  const status = String(course?.enrollment?.status || '').toLowerCase()
  const paymentStatus = String(course?.enrollment?.payment_status || '').toLowerCase()

  if (paymentStatus === 'pending' || paymentStatus === 'unpaid') return 'Payment pending'
  if (status === 'active' || status === 'paid' || status === 'enrolled') return 'Enrolled'
  if (status) return status

  return 'Enrolled'
}

const MyCourses = () => {
  const [courses, setCourses] = useState([])
  const [lessonCounts, setLessonCounts] = useState({})
  const [certificates, setCertificates] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let isMounted = true

    getCurrentUser().catch(() => {
      if (isMounted) {
        window.location.href = '/login'
      }
    })

    Promise.allSettled([getMyCourses(), getLessons(), getCertificates()])
      .then(([coursesResult, lessonsResult, certificatesResult]) => {
        if (!isMounted) return

        if (coursesResult.status === 'fulfilled') {
          setCourses(coursesResult.value)
        } else {
          setLoadError(
            `Your courses could not load from the backend. ${coursesResult.reason.message}`,
          )
        }

        if (lessonsResult.status === 'fulfilled') {
          const counts = {}
          lessonsResult.value.forEach((lesson) => {
            const courseId = String(lesson.course_id || '')
            if (!courseId) return
            counts[courseId] = (counts[courseId] || 0) + 1
          })
          setLessonCounts(counts)
        }

        if (certificatesResult.status === 'fulfilled') {
          setCertificates(certificatesResult.value)
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  if (isLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#f7f8ff] px-6 text-slate-700">
        <div>
          <p className="text-lg font-bold text-[#111827]">Loading your courses...</p>
          <p className="mt-2 text-sm">Fetching your enrolled courses from the backend.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="bg-[#f7f8ff] px-4 py-12 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-wide text-[#302be2]">
              <FontAwesomeIcon icon={faGraduationCap} />
              Learning Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">My Courses</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Continue where you left off, or open a course you have purchased.
            </p>
          </div>
          <a
            className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-lg bg-[#302be2] px-5 text-sm font-black text-white transition hover:bg-[#1916b8]"
            href="/courses"
          >
            <FontAwesomeIcon icon={faBookOpen} />
            Browse More Courses
          </a>
        </div>

        {loadError && (
          <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            {loadError}
          </p>
        )}

        {courses.length === 0 && !loadError && (
          <div className="mt-8 rounded-xl border border-slate-300 bg-white p-12 text-center shadow-sm">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-2xl text-[#302be2]">
              <FontAwesomeIcon icon={faGraduationCap} />
            </span>
            <h2 className="mt-5 text-xl font-black">No enrolled courses yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              When you buy a course, it will appear here and you can start learning right away.
            </p>
            <a
              className="mt-6 inline-flex h-12 items-center justify-center rounded-lg bg-[#302be2] px-7 text-sm font-black text-white transition hover:bg-[#1916b8]"
              href="/courses"
            >
              Explore Courses
            </a>
          </div>
        )}

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => {
            const progress = getProgressValue(course)
            const status = getEnrollmentStatus(course)
            const lessons = lessonCounts[String(course.id)] || 0
            const certificate = certificates.find(
              (item) => String(item.courseId) === String(course.id),
            )

            return (
              <article
                className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200"
                key={course.id || course.title}
              >
                <img className="h-44 w-full object-cover" src={course.image} alt={course.title} />
                <div className="p-6">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-[#edf0ff] px-3 py-1 text-[10px] font-black uppercase tracking-wide text-[#302be2]">
                      {course.category}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide ${
                        status.toLowerCase().includes('pending')
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  <h2 className="mt-4 min-h-12 text-lg font-extrabold leading-snug">
                    {course.title}
                  </h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-600">
                    {course.description || 'Course content coming soon.'}
                  </p>

                  <div className="mt-5 flex items-center justify-between text-sm text-slate-600">
                    <span className="inline-flex items-center gap-2">
                      <FontAwesomeIcon className="text-slate-400" icon={faClock} />
                      {lessons} lesson{lessons === 1 ? '' : 's'}
                    </span>
                    <span className="text-lg font-black text-[#2114e8]">{formatCoursePrice(course)}</span>
                  </div>

                  {progress !== null && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-[#302be2] transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-6 grid gap-3">
                    <a
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#302be2] text-sm font-black text-white transition hover:bg-[#1916b8]"
                      href={`/lesson?course=${course.id}`}
                    >
                      <FontAwesomeIcon icon={faPlay} />
                      Continue Learning
                    </a>
                    {certificate && (
                      <a
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 text-sm font-black text-amber-800 transition hover:bg-amber-100"
                        href={`/certificate?id=${encodeURIComponent(certificate.id)}`}
                      >
                        <FontAwesomeIcon icon={faCertificate} />
                        View Certificate
                      </a>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}

export default MyCourses