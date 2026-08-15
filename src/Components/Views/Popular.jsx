import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowRight,
  faCartShopping,
  faChartLine,
  faCode,
  faMagnifyingGlass,
  faStar,
  faUsers,
} from '@fortawesome/free-solid-svg-icons'
import { getCourses } from '../../lib/courseApi'

const heroStats = []
const mostPopular = []
const topRated = []

const newCourses = []
const designCourses = []

const getCourseDetailUrl = (course) => `/course-detail?course=${course.id || ''}`

const Rating = ({ value, reviews }) => (
  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-500">
    <FontAwesomeIcon icon={faStar} />
    {value}
    {reviews && <span className="font-medium text-slate-500">({reviews})</span>}
  </span>
)

const Popular = () => {
  const [backendCourses, setBackendCourses] = useState([])

  useEffect(() => {
    let isMounted = true

    getCourses()
      .then((courses) => {
        if (isMounted) {
          setBackendCourses(courses)
        }
      })
      .catch(() => {
        if (isMounted) {
          setBackendCourses([])
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const popularCourses = backendCourses.slice(0, 3).map((course) => ({
    ...course,
    badge: course.paid === 'Free' ? 'Free' : 'Popular',
    reviews: course.students,
    oldPrice: '',
  }))
  const ratedCourses = backendCourses.slice(0, 4)
  const newCourseItems = backendCourses.slice(0, 2).map((course) => ({
    ...course,
    label: course.paid === 'Free' ? 'Free' : 'New',
    text: course.description || course.category,
  }))
  const designItems = backendCourses.filter((course) => course.category === 'Design').slice(0, 4)

  return (
    <main className="bg-[#f7f8ff] text-slate-950">
      <section className="bg-[#eaf0ff]">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-[0.9fr_1.1fr] md:py-20 lg:px-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-cyan-200 px-4 py-2 text-xs font-bold uppercase text-[#075a73]">
              <FontAwesomeIcon icon={faChartLine} />
              Trending Now
            </span>
            <h1 className="mt-8 max-w-xl text-4xl font-black leading-tight tracking-tight sm:text-5xl">
              Master the Skills of the Future Today.
            </h1>
            <p className="mt-6 max-w-lg text-sm leading-7 text-slate-600 sm:text-base">
              Explore our most popular courses curated by industry experts. Join over 2
              million learners worldwide and accelerate your career growth.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a
                className="inline-flex h-12 items-center justify-center rounded-md bg-[#332bdc] px-7 text-sm font-bold text-white transition hover:bg-[#1916b8]"
                href="#most-popular"
              >
                Browse All Popular
              </a>
              <a
                className="inline-flex h-12 items-center justify-center rounded-md border border-[#332bdc] bg-white/50 px-7 text-sm font-bold text-[#332bdc] transition hover:bg-white"
                href="#top-rated"
              >
                View Learning Paths
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -right-10 -top-10 h-72 w-72 rounded-full bg-[#d9e2ff]" />
            <img
              className="relative h-72 w-full rounded-xl object-cover shadow-2xl shadow-slate-300 md:h-[340px]"
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1300&q=85"
              alt="Students discussing popular online courses"
            />
            {heroStats.map((stat, index) => (
              <div
                className="absolute left-4 flex items-center gap-3 rounded-lg bg-white p-4 shadow-xl shadow-slate-300"
                style={{ bottom: `${1 + index * 5.25}rem` }}
                key={stat.label}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100 text-[#086e80]">
                  <FontAwesomeIcon icon={faUsers} />
                </span>
                <div>
                  <p className="text-sm font-black">{stat.value}</p>
                  <p className="text-[10px] font-bold relative  uppercase text-slate-500">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="most-popular" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black">Most Popular</h2>
            <p className="mt-2 text-sm text-slate-600">The courses everyone is talking about this month.</p>
          </div>
          <a className="hidden text-sm font-semibold text-[#332bdc] sm:inline-flex" href="#top-rated">
            View All <FontAwesomeIcon className="ml-2" icon={faArrowRight} />
          </a>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {popularCourses.map((course) => (
            <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200" key={course.id || course.title}>
              <a className="block" href={getCourseDetailUrl(course)}>
                <div className="relative">
                  <img className="h-48 w-full object-cover" src={course.image} alt={course.title} />
                  <span className="absolute left-3 top-3 rounded bg-[#332bdc] px-3 py-1 text-[10px] font-black  text-white">
                    {course.badge}
                  </span>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-black uppercase tracking-wide text-[#086e80]">{course.category}</p>
                    <Rating value={course.rating} reviews={course.reviews} />
                  </div>
                  <h3 className="mt-4 min-h-12 text-base font-semibold leading-snug">{course.title}</h3>
                  <p className="mt-2 text-xs text-slate-500">{course.instructor}</p>
                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
                    <p>
                      <span className="font-semibold">{course.price}</span>
                      {course.oldPrice && <span className="ml-2 text-xs text-slate-400 line-through">{course.oldPrice}</span>}
                    </p>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f1f4ff] text-[#332bdc]">
                    <FontAwesomeIcon icon={faCartShopping} />
                    </span>
                  </div>
                </div>
              </a>
            </article>
          ))}
        </div>
      </section>

      <section id="top-rated" className="bg-[#e7eeff] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#332bdc] text-white">
              <FontAwesomeIcon icon={faCode} />
            </span>
            <div>
              <h2 className="text-2xl font-semibold">Top Rated in Development</h2>
              <p className="text-sm text-slate-600">Master coding from foundational to advanced.</p>
            </div>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ratedCourses.map((course) => (
              <article className="rounded-lg bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200" key={course.id || course.title}>
                <a className="block" href={getCourseDetailUrl(course)}>
                  <img className="h-36 w-full rounded-md object-cover" src={course.image} alt={course.title} />
                  <h3 className="mt-4 text-sm font-semibold">{course.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">{course.instructor}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#332bdc]">{course.price}</span>
                    <Rating value={course.rating} />
                  </div>
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-black">New & Noteworthy</h2>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {newCourseItems.map((course) => (
            <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200" key={course.id || course.title}>
              <a className="grid sm:grid-cols-[180px_1fr]" href={getCourseDetailUrl(course)}>
                <img className="h-52 w-full object-cover sm:h-full" src={course.image} alt={course.title} />
                <div className="p-6">
                  <span className="rounded bg-[#edf0ff] px-3 py-1 text-[10px] font-black uppercase text-[#332bdc]">
                    {course.label}
                  </span>
                  <h3 className="mt-4 font-semibold">{course.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{course.text}</p>
                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-sm">{course.price}</span>
                    <span className="text-sm font-semibold text-[#332bdc]">
                    Learn more <FontAwesomeIcon className="ml-1" icon={faArrowRight} />
                    </span>
                  </div>
                </div>
              </a>
            </article>
          ))}
          {newCourseItems.length === 0 && (
            <p className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-500 lg:col-span-2">
              No course data yet.
            </p>
          )}
        </div>
      </section>

      <section id="design" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div>
          <h2 className="text-3xl font-black">Most Viewed in Design</h2>
          <p className="mt-2 text-sm text-slate-600">Creative skills for the modern digital era.</p>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {designItems.map((course) => (
            <article className="transition hover:-translate-y-1" key={course.id || course.title}>
              <a className="block" href={getCourseDetailUrl(course)}>
                <img className="h-56 w-full rounded-lg object-cover" src={course.image} alt={course.title} />
                <h3 className="mt-4 text-sm font-semibold">{course.title}</h3>
                <p className="mt-1 text-xs text-slate-500">{course.instructor}</p>
                <div className="mt-3">
                  <Rating value={course.rating} reviews={course.reviews} />
                </div>
                <p className="mt-3 text-sm font-semibold">{course.price}</p>
              </a>
            </article>
          ))}
          {designItems.length === 0 && (
            <p className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-500 sm:col-span-2 lg:col-span-4">
              No design courses yet.
            </p>
          )}
        </div>
      </section>

      <section className="bg-[#332bdc] px-4 py-16 text-center text-white sm:px-6 lg:px-8">
        <h2 className="text-3xl font-black">Ready to start learning?</h2>
        <p className="mt-5 text-sm text-indigo-50">
          Get access to the courses published on your platform.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
          <a className="rounded-md bg-cyan-300 px-8 py-3 text-sm font-bold text-slate-950" href="/contact">
            Get Online Course for Business
          </a>
          <a className="rounded-md border border-white/50 px-8 py-3 text-sm font-bold text-white" href="/pricing">
            Start Your Free Trial
          </a>
        </div>
      </section>
    </main>
  )
}

export default Popular
