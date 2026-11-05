import { useEffect, useMemo, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowRight,
  faBullhorn,
  faBriefcase,
  faCertificate,
  faClock,
  faCode,
  faFire,
  faPalette,
  faPlay,
  faQuoteRight,
  faStar,
  faUser,
  faUsers,
} from '@fortawesome/free-solid-svg-icons'
import Reveal from '../Reveal'
import { getCategories, getCourses } from '../../lib/courseApi'

const categoryIcons = [faPalette, faBullhorn, faCode, faBriefcase]

const categoryBadge = {
  Design: 'bg-violet-100 text-violet-700',
  Business: 'bg-emerald-100 text-emerald-700',
  'Data Science': 'bg-cyan-100 text-cyan-700',
}

const numericStudents = (course) => Number(String(course.students || '0').replace(/,/g, '')) || 0

const Home = () => {
  const [categories, setCategories] = useState([])
  const [courses, setCourses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let isMounted = true

    Promise.allSettled([getCategories(), getCourses()])
      .then(([categoriesResult, coursesResult]) => {
        if (!isMounted) return

        setCategories(categoriesResult.status === 'fulfilled' ? categoriesResult.value : [])
        setCourses(coursesResult.status === 'fulfilled' ? coursesResult.value : [])

        const failed = [categoriesResult, coursesResult].filter((result) => result.status === 'rejected')

        if (failed.length > 0) {
          setLoadError(failed.map((result) => result.reason?.message).filter(Boolean).join(' '))
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

  const featuredCourse = courses[0]
  const sideCourses = courses.slice(1, 4)

  const getCourseUrl = (course) => `/course-detail?course=${course.id || ''}`

  const maxStudents = useMemo(
    () => courses.reduce((max, course) => Math.max(max, numericStudents(course)), 0),
    [courses],
  )

  const featuredDemand = featuredCourse
    ? maxStudents
      ? Math.max(18, Math.round((numericStudents(featuredCourse) / maxStudents) * 100))
      : 55
    : 0

  return (
    <main>
      {loadError && (
        <p className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
          <span className="block rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            Courses could not load from the API. {loadError}
          </span>
        </p>
      )}

      <section id="courses" className="bg-[#edf2ff] py-14 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">Popular Categories</p>
              <h2 className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                Explore courses by top-performing industry sectors
              </h2>
            </div>
            <a
              className="inline-flex w-fit items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#302be2] shadow-sm ring-1 ring-indigo-100 transition hover:bg-[#f7f8ff]"
              href="#courses"
            >
              View All
              <FontAwesomeIcon className="text-xs" icon={faArrowRight} />
            </a>
          </div>

          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, index) => (
              <article
                key={category.id || category.name}
                className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#edf0ff] text-lg font-black text-[#302be2]">
                  <FontAwesomeIcon icon={categoryIcons[index % categoryIcons.length]} />
                </span>
                <h3 className="mt-7 text-base font-semibold text-slate-950">{category.name}</h3>
                <p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">{category.description || 'Course category'}</p>
                <p className="mt-5 text-sm font-bold text-[#302be2]">
                  {courses.filter((course) => String(course.categoryId) === String(category.id) || course.category === category.name).length} Courses
                </p>
              </article>
            ))}
            {categories.length === 0 && (
              <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500 sm:col-span-2 lg:col-span-4">
                {isLoading ? 'Loading categories...' : 'No categories yet.'}
              </p>
            )}
          </div>
        </div>
      </section>

      <section id="featured" className="relative overflow-hidden bg-[#f7f8ff] py-16 md:py-24">
        <div
          className="pointer-events-none absolute -right-32 top-10 h-96 w-96 rounded-full bg-indigo-300/20 blur-3xl"
          style={{ animation: 'courseBlob 18s ease-in-out infinite' }}
        />
        <div
          className="pointer-events-none absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-sky-300/20 blur-3xl"
          style={{ animation: 'courseBlob 22s ease-in-out 3s infinite' }}
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <span className="inline-flex items-center gap-2.5 rounded-full border border-indigo-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#332fe0] shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="course-avatar-ring absolute inline-flex h-full w-full rounded-full bg-indigo-500" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-600" />
                  </span>
                  Handpicked by mentors
                </span>
                <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                  Featured{' '}
                  <span className="bg-gradient-to-r from-[#302be2] to-[#0ea5e9] bg-clip-text text-transparent">
                    Courses
                  </span>
                </h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
                  A curated spotlight of the top-rated learning experiences on the platform right
                  now.
                </p>
              </div>
              <a
                className="group inline-flex w-fit items-center gap-2 rounded-full bg-[#302be2] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:-translate-y-0.5 hover:bg-[#1916b8]"
                href="/courses"
              >
                View All Courses
                <FontAwesomeIcon
                  className="text-xs transition-transform group-hover:translate-x-1"
                  icon={faArrowRight}
                />
              </a>
            </div>
          </Reveal>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <Reveal delay={90}>
              {featuredCourse ? (
                <a
                  className="group relative block h-full cursor-pointer overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                  href={getCourseUrl(featuredCourse)}
                >
                  <div className="relative h-[420px] sm:h-[480px]">
                    <img
                      alt={featuredCourse.title}
                      className="h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-110"
                      src={featuredCourse.image}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/90 via-indigo-900/40 to-transparent" />
                    <div className="course-shine absolute inset-0" />

                    <span className="absolute left-6 top-6 flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-black text-slate-900 shadow-lg backdrop-blur">
                      <FontAwesomeIcon className="text-amber-500" icon={faFire} />
                      Featured
                    </span>
                    <span
                      className={`absolute right-6 top-6 rounded-full px-3.5 py-1.5 text-xs font-black shadow-lg backdrop-blur ${categoryBadge[featuredCourse.category] || 'bg-[#4137e8] text-white'}`}
                    >
                      {featuredCourse.category}
                    </span>

                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="relative flex h-20 w-20 scale-75 items-center justify-center opacity-90 transition-transform duration-500 group-hover:scale-110 group-hover:opacity-100">
                        <span className="course-avatar-ring absolute inline-flex h-full w-full rounded-full bg-white/60" />
                        <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-2xl text-[#302be2] shadow-2xl backdrop-blur">
                          <FontAwesomeIcon className="ml-1" icon={faPlay} />
                        </span>
                      </span>
                    </span>

                    <div className="absolute inset-x-0 bottom-0 p-7 sm:p-9">
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                        <span className="flex items-center gap-2.5">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500 text-sm text-white shadow-lg">
                            <FontAwesomeIcon icon={faUser} />
                          </span>
                          <span className="text-xs font-semibold text-white/90">
                            {featuredCourse.instructor}
                          </span>
                        </span>
                        <span className="hidden h-1 w-1 rounded-full bg-white/50 lg:block" />
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-white/90">
                          <FontAwesomeIcon className="text-amber-400" icon={faStar} />
                          {featuredCourse.rating}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-white/90">
                          <FontAwesomeIcon icon={faUsers} />
                          {featuredCourse.students} learners
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-white/90">
                          <FontAwesomeIcon icon={faClock} />
                          {featuredCourse.duration}
                        </span>
                      </div>
                      <h3 className="mt-4 max-w-2xl text-2xl font-black leading-tight text-white sm:text-3xl">
                        {featuredCourse.title}
                      </h3>
                      <p className="mt-3 line-clamp-2 max-w-xl text-sm leading-6 text-white/75">
                        {featuredCourse.description ||
                          featuredCourse.category ||
                          'Course details coming soon.'}
                      </p>
                      <div className="mt-6 max-w-sm">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-white/85">Learning demand</span>
                          <span className="text-white">{featuredDemand}%</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/25">
                          <span
                            className="course-bar block h-full rounded-full bg-gradient-to-r from-amber-300 to-orange-400"
                            style={{ '--course-w': `${featuredDemand}%` }}
                          />
                        </div>
                      </div>
                      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/20 pt-6">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
                            Price
                          </p>
                          <p className="mt-1 text-3xl font-black text-white">{featuredCourse.price}</p>
                        </div>
                        <span className="inline-flex items-center gap-2 rounded-lg bg-white/95 px-6 py-3 text-sm font-black text-[#302be2] shadow-lg transition-transform duration-300 group-hover:translate-x-1">
                          Enroll Now
                          <FontAwesomeIcon icon={faArrowRight} />
                        </span>
                      </div>
                    </div>
                  </div>
                </a>
              ) : (
                <div className="flex h-full min-h-[420px] items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-white p-10 text-center text-sm font-semibold text-slate-500">
                  No featured course yet.
                </div>
              )}
            </Reveal>

            <Reveal delay={180}>
              <div className="grid h-full gap-4">
                {sideCourses.map((course, index) => (
                  <a
                    className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-slate-200 sm:gap-5"
                    href={getCourseUrl(course)}
                    key={course.id || course.title}
                  >
                    <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl sm:h-24 sm:w-32">
                      <img
                        alt={course.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                        src={course.image}
                      />
                      <span className="absolute -bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#302be2] to-sky-500 text-xs font-black text-white shadow-lg">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      {categoryBadge[course.category] ? (
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${categoryBadge[course.category]}`}
                        >
                          {course.category}
                        </span>
                      ) : (
                        <p className="text-[10px] font-black uppercase tracking-wide text-[#075a73]">
                          {course.category}
                        </p>
                      )}
                      <h3 className="mt-2 line-clamp-2 text-sm font-bold leading-snug text-slate-950 transition-colors group-hover:text-[#302be2] sm:text-base">
                        {course.title}
                      </h3>
                      <div className="mt-2 flex items-center gap-3 text-xs text-slate-600">
                        <span className="flex items-center gap-1 font-semibold text-amber-500">
                          <FontAwesomeIcon icon={faStar} />
                          {course.rating}
                        </span>
                        <span className="font-bold text-[#2114e8]">{course.price}</span>
                      </div>
                      <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                        <FontAwesomeIcon icon={faUsers} />
                        {course.students} learners
                      </p>
                    </div>
                    <span className="flex h-9 w-9 shrink-0 -translate-x-2 items-center justify-center rounded-full bg-[#edf0ff] text-[#332fe0] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                      <FontAwesomeIcon className="text-xs" icon={faArrowRight} />
                    </span>
                  </a>
                ))}
                {sideCourses.length === 0 && (
                  <div className="flex h-full min-h-[180px] items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center text-sm font-semibold text-slate-500">
                    More courses coming soon.
                  </div>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section id="reviews" className="bg-[#3326d9] py-16 text-white md:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-indigo-200">Success Stories</p>
            <h2 className="mt-4 text-xl font-semibold">Why students love learning with EduPro</h2>
            <div className="mt-9 grid gap-6">
              <div className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 font-black">
                  <FontAwesomeIcon icon={faCertificate} />
                </span>
                <div>
                  <h3 className="font-semibold">Industry Recognized</h3>
                  <p className="mt-1 text-sm leading-6 text-indigo-100">
                    Certificates trusted by Fortune 500 companies.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 font-black">
                  <FontAwesomeIcon icon={faUsers} />
                </span>
                <div>
                  <h3 className="font-semibold">Global Community</h3>
                  <p className="mt-1 text-sm leading-6 text-indigo-100">
                    Network with learners from your online course platform.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <article className="rounded-2xl bg-white p-7 text-slate-950 shadow-2xl shadow-indigo-950/20 sm:p-10">
            <div className="flex items-center justify-between">
              <div className="flex gap-1 text-lg text-amber-400">
                {Array.from({ length: 5 }, (_, index) => (
                  <FontAwesomeIcon icon={faStar} key={index} />
                ))}
              </div>
              <FontAwesomeIcon className="text-5xl text-indigo-100" icon={faQuoteRight} />
            </div>
            <p className="mt-6 text-sm italic leading-7 text-slate-600">
              The structured approach and quality of mentors at EduPro completely changed
              my career path. I went from a junior dev to a tech lead in less than 18 months.
            </p>
            <div className="mt-7 flex items-center gap-3">
              <img
                className="h-11 w-11 rounded-full object-cover"
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80"
                alt="Student testimonial avatar"
              />
              <div>
                <h3 className="text-sm font-semibold">Student testimonial</h3>
                <p className="text-xs text-slate-500">Learner feedback</p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section id="newsletter" className="bg-[#f7f8ff] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 rounded-3xl bg-[#e6eeff] px-6 py-10 sm:px-10 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="text-lg font-semibold">Start your learning journey today</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Subscribe to our newsletter for exclusive discounts and new course alerts.
            </p>
          </div>
          <form className="grid gap-3 sm:grid-cols-[minmax(220px,320px)_auto]">
            <input
              className="h-12 rounded-lg border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-[#302be2] focus:ring-4 focus:ring-indigo-100"
              placeholder="Enter your email"
              type="email"
            />
            <button
              className="h-12 rounded-lg bg-[#302be2] px-7 text-sm font-bold text-white transition hover:bg-[#1916b8]"
              type="button"
            >
              Join Now
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}

export default Home
