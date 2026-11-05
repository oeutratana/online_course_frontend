import { useEffect, useMemo, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowRight,
  faBookOpen,
  faChevronLeft,
  faChevronRight,
  faClock,
  faGraduationCap,
  faLayerGroup,
  faMagnifyingGlass,
  faPlay,
  faRotateLeft,
  faSliders,
  faStar,
  faUsers,
} from '@fortawesome/free-solid-svg-icons'
import Reveal from '../Reveal'
import { getCategories, getCourses } from '../../lib/courseApi'

const filters = {
  Categories: [],
  'Difficulty Level': ['Beginner', 'Intermediate', 'Advanced'],
  'Price Range': ['Free', 'Paid'],
}

const categoryBadge = {
  Design: 'bg-violet-100 text-violet-700',
  Business: 'bg-emerald-100 text-emerald-700',
  'Data Science': 'bg-cyan-100 text-cyan-700',
}

const fallbackHeroImage =
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=85'

const useCountUp = (target, active, duration = 1400) => {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!active) return undefined

    let frame
    const start = performance.now()
    const to = Number(target) || 0

    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(to * eased)
      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      }
    }

    frame = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(frame)
  }, [active, duration, target])

  return value
}

const Stat = ({ active, format, icon, label, value }) => {
  const current = useCountUp(value, active)

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm backdrop-blur">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#edf0ff] text-xl text-[#332fe0]">
        <FontAwesomeIcon icon={icon} />
      </span>
      <div>
        <p className="text-2xl font-black text-slate-950">
          {format ? format(current) : Math.round(current).toLocaleString()}
        </p>
        <p className="mt-0.5 text-xs font-semibold text-slate-500">{label}</p>
      </div>
    </div>
  )
}

const Coursre = () => {
  const [courseItems, setCourseItems] = useState([])
  const [categoryItems, setCategoryItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [priceRange, setPriceRange] = useState('')
  const [sortBy, setSortBy] = useState('Most Popular')
  const [page, setPage] = useState(1)
  const coursesPerPage = 6

  const statsRef = useRef(null)
  const [statsVisible, setStatsVisible] = useState(() => typeof IntersectionObserver === 'undefined')

  const categoryNames = useMemo(
    () => categoryItems.map((item) => item.name).filter(Boolean),
    [categoryItems],
  )

  const categoryIdByName = useMemo(
    () => Object.fromEntries(categoryItems.map((item) => [item.name, item.id])),
    [categoryItems],
  )

  const pageFilters = {
    ...filters,
    Categories: categoryNames,
  }

  useEffect(() => {
    let isMounted = true

    Promise.allSettled([getCourses(), getCategories()])
      .then(([coursesResult, categoriesResult]) => {
        if (!isMounted) return

        if (coursesResult.status === 'fulfilled') {
          setCourseItems(coursesResult.value)
        } else {
          setLoadError(`Courses could not load from /api/courses. ${coursesResult.reason.message}`)
        }

        if (categoriesResult.status === 'fulfilled') {
          setCategoryItems(categoriesResult.value)
        } else if (coursesResult.status === 'fulfilled') {
          setLoadError(`Categories could not load from /api/categories. ${categoriesResult.reason.message}`)
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

  useEffect(() => {
    const element = statsRef.current
    if (!element || typeof IntersectionObserver === 'undefined') return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting) {
          setStatsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase()
    const selectedCategoryId = category ? categoryIdByName[category] : null

    return courseItems
      .filter((course) => {
        const matchesSearch =
          !query ||
          course.title.toLowerCase().includes(query) ||
          course.instructor.toLowerCase().includes(query) ||
          course.category.toLowerCase().includes(query)
        // Match the API category by id first, then fall back to the name so
        // courses still group correctly when the API omits category_id.
        const matchesCategory = !category
          || (selectedCategoryId !== undefined
            && String(course.categoryId) === String(selectedCategoryId))
          || course.category === category
        const matchesDifficulty = !difficulty || course.difficulty === difficulty
        const matchesPrice = !priceRange || course.paid === priceRange

        return matchesSearch && matchesCategory && matchesDifficulty && matchesPrice
      })
      .sort((a, b) => {
        if (sortBy === 'Highest Rated') return Number(b.rating) - Number(a.rating)
        if (sortBy === 'Lowest Price') {
          const priceA = a.price === 'Free' ? 0 : Number(a.price.replace('$', ''))
          const priceB = b.price === 'Free' ? 0 : Number(b.price.replace('$', ''))
          return priceA - priceB
        }
        if (sortBy === 'Newest') return b.title.localeCompare(a.title)
        return Number(b.students.replace(',', '')) - Number(a.students.replace(',', ''))
      })
  }, [category, categoryIdByName, courseItems, difficulty, priceRange, search, sortBy])

  const categoryCounts = useMemo(() => {
    const counts = {}
    courseItems.forEach((course) => {
      counts[course.category] = (counts[course.category] || 0) + 1
    })
    return counts
  }, [courseItems])

  const totalStudents = useMemo(
    () =>
      courseItems.reduce(
        (sum, course) => sum + (Number(String(course.students).replace(/,/g, '')) || 0),
        0,
      ),
    [courseItems],
  )

  const averageRating = useMemo(() => {
    if (courseItems.length === 0) return 0
    const total = courseItems.reduce((sum, course) => sum + (Number(course.rating) || 0), 0)
    return Math.round((total / courseItems.length) * 10) / 10
  }, [courseItems])

  const totalCourses = courseItems.length
  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / coursesPerPage))
  const visibleCourses = filteredCourses.slice((page - 1) * coursesPerPage, page * coursesPerPage)

  const hasActiveFilters = Boolean(search || category || difficulty || priceRange)

  const gridKey = [page, search, category, difficulty, priceRange, sortBy].join('|')
  const heroImage = courseItems[0]?.image || fallbackHeroImage

  const updateFilter = (setter, value) => {
    setter(value)
    setPage(1)
  }

  const changePage = (nextPage) => {
    setPage(Math.min(Math.max(nextPage, 1), totalPages))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const clearFilters = () => {
    setSearch('')
    setCategory('')
    setDifficulty('')
    setPriceRange('')
    setSortBy('Most Popular')
    setPage(1)
  }

  return (
    <main className="bg-[#f6f7ff] text-slate-950">
      <section className="relative overflow-hidden bg-[#eef3ff]">
        <div className="course-hero-bg" />
        <div
          className="pointer-events-none absolute -left-24 top-4 h-72 w-72 rounded-full bg-indigo-400/25 blur-3xl"
          style={{ animation: 'courseBlob 14s ease-in-out infinite' }}
        />
        <div
          className="pointer-events-none absolute -right-16 top-24 h-80 w-80 rounded-full bg-fuchsia-400/20 blur-3xl"
          style={{ animation: 'courseBlob 18s ease-in-out 1.5s infinite' }}
        />
        <div
          className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-sky-400/25 blur-3xl"
          style={{ animation: 'courseBlob 16s ease-in-out 3s infinite' }}
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 md:pb-20 md:pt-20 lg:px-8">
          <div className="grid items-center gap-14 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <Reveal>
                <span className="inline-flex items-center gap-2.5 rounded-full border border-indigo-200 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#332fe0] shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="course-avatar-ring absolute inline-flex h-full w-full rounded-full bg-indigo-500" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-600" />
                  </span>
                  Live learning platform
                </span>
              </Reveal>
              <Reveal delay={90}>
                <h1 className="mt-6 text-4xl font-black leading-[1.08] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                  Explore Courses
                  <span
                    className="mt-3 block bg-gradient-to-r from-[#302be2] via-[#7c3aed] to-[#0ea5e9] bg-clip-text text-transparent"
                    style={{ animation: 'courseGradient 8s ease infinite', backgroundSize: '200% 200%' }}
                  >
                    Designed For Your Growth
                  </span>
                </h1>
              </Reveal>
              <Reveal delay={180}>
                <p className="mt-7 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                  Handpicked courses built by industry mentors. Learn by doing, land real projects,
                  and earn skills that get you hired.
                </p>
              </Reveal>
              <Reveal delay={270}>
                <div className="mt-9 flex flex-wrap items-center gap-3">
                  <a
                    className="inline-flex items-center gap-2 rounded-md bg-[#302be2] px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:-translate-y-0.5 hover:bg-[#1916b8]"
                    href="#course-toolbar"
                  >
                    Start Browsing
                    <FontAwesomeIcon icon={faArrowRight} />
                  </a>
                  <a
                    className="inline-flex items-center gap-2 rounded-md border border-[#302be2] bg-white px-7 py-3.5 text-sm font-bold text-[#302be2] transition hover:-translate-y-0.5 hover:bg-[#eef0ff]"
                    href="#course-sidebar"
                  >
                    <FontAwesomeIcon icon={faSliders} />
                    Filter Courses
                  </a>
                </div>
              </Reveal>
            </div>

            <Reveal className="hidden lg:block" delay={220}>
              <div className="relative mx-auto max-w-md">
                <div
                  className="absolute -left-12 top-4 h-28 w-28 rounded-3xl bg-indigo-200/70 blur-sm"
                  style={{ animation: 'courseFloat 7s ease-in-out infinite' }}
                />
                <div
                  className="absolute -bottom-8 -right-6 h-32 w-32 rounded-3xl bg-sky-200/70 blur-sm"
                  style={{ animation: 'courseFloat 9s ease-in-out 1.4s infinite' }}
                />

                <div className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-white p-3 shadow-2xl shadow-indigo-200/60">
                  <img
                    alt="Students learning together"
                    className="h-80 w-full rounded-2xl object-cover"
                    src={heroImage}
                  />
                  <div className="absolute inset-x-8 bottom-8 rounded-2xl bg-white/92 p-4 shadow-xl backdrop-blur">
                    <p className="text-sm font-black text-slate-950">New courses weekly</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Curated by mentors with 10+ years of experience
                    </p>
                  </div>

                  <div
                    className="absolute -left-9 top-10 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl"
                    style={{ animation: 'courseFloat 6s ease-in-out infinite' }}
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-lg text-amber-600">
                      <FontAwesomeIcon icon={faStar} />
                    </span>
                    <div>
                      <p className="text-sm font-black">{averageRating}/5</p>
                      <p className="text-xs text-slate-500">Top rated courses</p>
                    </div>
                  </div>

                  <div
                    className="absolute -right-9 bottom-20 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl"
                    style={{ animation: 'courseFloat 8s ease-in-out 0.8s infinite' }}
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-lg text-[#332fe0]">
                      <FontAwesomeIcon icon={faGraduationCap} />
                    </span>
                    <div>
                      <p className="text-sm font-black">Certified</p>
                      <p className="text-xs text-slate-500">Accredited certificates</p>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          <div ref={statsRef} className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Reveal delay={0}>
              <Stat
                active={statsVisible}
                format={(value) => `${Math.round(value).toLocaleString()}`}
                icon={faUsers}
                label="Total learners"
                value={totalStudents}
              />
            </Reveal>
            <Reveal delay={90}>
              <Stat
                active={statsVisible}
                format={(value) => `${Math.round(value)}`}
                icon={faBookOpen}
                label="Courses offered"
                value={totalCourses}
              />
            </Reveal>
            <Reveal delay={180}>
              <Stat
                active={statsVisible}
                format={(value) => `${Math.round(value)}`}
                icon={faLayerGroup}
                label="Categories"
                value={categoryItems.length}
              />
            </Reveal>
            <Reveal delay={270}>
              <Stat
                active={statsVisible}
                format={(value) => value.toFixed(1)}
                icon={faStar}
                label="Average rating"
                value={averageRating}
              />
            </Reveal>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
        <div
          className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center"
          id="course-toolbar"
        >
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
            <label className="relative block">
              <FontAwesomeIcon
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                icon={faMagnifyingGlass}
              />
              <input
                className="h-12 w-full rounded-lg border border-slate-300 bg-white pl-12 pr-4 text-sm outline-none transition placeholder:text-slate-500 focus:border-[#302be2] focus:ring-4 focus:ring-indigo-100"
                onChange={(event) => updateFilter(setSearch, event.target.value)}
                placeholder="Search courses, instructors..."
                type="search"
                value={search}
              />
            </label>
            <a
              className="flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-[#332fe0] transition hover:border-[#403be5] hover:bg-[#eef0ff] lg:hidden"
              href="#course-sidebar"
            >
              <FontAwesomeIcon icon={faSliders} />
              Filters
            </a>
          </div>
          <p className="text-sm text-slate-600">
            {isLoading ? (
              'Loading courses...'
            ) : (
              <>
                Showing <span className="font-black text-slate-950">{filteredCourses.length}</span>{' '}
                {filteredCourses.length === 1 ? 'course' : 'courses'}
              </>
            )}
          </p>
          <div className="flex items-center gap-5 text-sm">
            <span className="hidden text-slate-950 sm:block">Sort by:</span>
            <select
              className="min-w-44 cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-semibold text-[#2114e8] outline-none transition hover:border-[#403be5] focus:border-[#403be5] focus:ring-4 focus:ring-indigo-100"
              onChange={(event) => updateFilter(setSortBy, event.target.value)}
              value={sortBy}
            >
              <option>Most Popular</option>
              <option>Highest Rated</option>
              <option>Lowest Price</option>
              <option>Newest</option>
            </select>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-6 self-start" id="course-sidebar">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">
                  Refine results
                </h2>
                {hasActiveFilters && (
                  <button
                    className="flex items-center gap-1.5 rounded-full bg-[#edf0ff] px-3 py-1.5 text-xs font-bold text-[#332fe0] transition hover:bg-[#dfe3ff]"
                    onClick={clearFilters}
                    type="button"
                  >
                    <FontAwesomeIcon icon={faRotateLeft} />
                    Reset
                  </button>
                )}
              </div>
            </div>

            {Object.entries(pageFilters).map(([title, items]) => (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" key={title}>
                <h3 className="flex items-center gap-2.5 text-sm font-black uppercase tracking-wide text-slate-950">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#edf0ff] text-xs text-[#332fe0]">
                    <FontAwesomeIcon icon={title === 'Categories' ? faLayerGroup : faSliders} />
                  </span>
                  {title}
                </h3>
                <div className="mt-5 grid gap-3">
                  {items.map((item) => {
                    const type = title === 'Difficulty Level' ? 'radio' : 'checkbox'
                    const isCategory = title === 'Categories'
                    const isDifficulty = title === 'Difficulty Level'
                    const checked =
                      (isCategory && category === item) ||
                      (isDifficulty && difficulty === item) ||
                      (title === 'Price Range' && priceRange === item)

                    const onChange = () => {
                      if (isCategory) updateFilter(setCategory, checked ? '' : item)
                      if (isDifficulty) updateFilter(setDifficulty, checked ? '' : item)
                      if (title === 'Price Range') updateFilter(setPriceRange, checked ? '' : item)
                    }

                    const count = categoryCounts[item]

                    return (
                      <label
                        className="group flex cursor-pointer items-center gap-3 text-sm text-slate-700 transition-colors hover:text-slate-950"
                        key={item}
                      >
                        <input
                          checked={checked}
                          className="h-4.5 w-4.5 shrink-0 rounded accent-[#332fe0] transition-transform group-hover:scale-110"
                          name={title}
                          onChange={onChange}
                          type={type}
                        />
                        <span className={checked ? 'font-bold text-slate-950' : 'font-medium'}>
                          {item}
                        </span>
                        {count ? (
                          <span className="ml-auto rounded-full bg-[#edf0ff] px-2 py-0.5 text-xs font-bold text-[#332fe0]">
                            {count}
                          </span>
                        ) : null}
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
          </aside>

          <div>
            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }, (_, index) => (
                  <div
                    className="skeleton-shine overflow-hidden rounded-2xl border border-slate-200 bg-white"
                    key={index}
                  >
                    <div className="h-52 bg-slate-200" />
                    <div className="space-y-4 p-6">
                      <div className="h-3 w-24 rounded bg-slate-200" />
                      <div className="h-5 w-4/5 rounded bg-slate-200" />
                      <div className="h-4 w-3/5 rounded bg-slate-200" />
                      <div className="flex items-center justify-between pt-2">
                        <div className="h-7 w-16 rounded bg-slate-200" />
                        <div className="h-7 w-14 rounded bg-slate-200" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : visibleCourses.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white/60 p-12 text-center">
                <div className="mx-auto flex h-24 items-end justify-center gap-2">
                  {[34, 48, 64, 42, 56].map((height, index) => (
                    <span
                      className="w-3 rounded-t bg-indigo-300"
                      key={index}
                      style={{
                        animation: `courseBars 1.2s ease-in-out ${index * 0.12}s infinite`,
                        height: `${height}px`,
                        transformOrigin: 'bottom',
                      }}
                    />
                  ))}
                </div>
                <h2 className="mt-8 text-xl font-black text-slate-950">No courses found</h2>
                <p className="mt-3 text-sm text-slate-600">
                  Try another search word or choose fewer options.
                </p>
                {hasActiveFilters && (
                  <button
                    className="mt-6 inline-flex items-center gap-2 rounded-md bg-[#302be2] px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#1916b8]"
                    onClick={clearFilters}
                    type="button"
                  >
                    <FontAwesomeIcon icon={faRotateLeft} />
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3" key={gridKey}>
                {visibleCourses.map((course, index) => (
                  <Reveal
                    delay={(index % 3) * 90}
                    key={`${course.id || ''}-${course.title}`}
                  >
                    <div className="course-card-inner">
                      <article className="course-card group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors duration-300 hover:border-indigo-200">
                        <a
                          className="relative block cursor-pointer"
                          href={`/course-detail?course=${course.id || ''}#table-card`}
                          title={course.title}
                        >
                          <div className="relative overflow-hidden">
                            <img
                              alt={course.title}
                              className="h-52 w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                              loading="lazy"
                              src={course.image}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/60 via-indigo-900/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                            <div className="course-shine absolute inset-0" />
                            <span
                              className={`absolute left-4 top-4 rounded-full px-3.5 py-1.5 text-xs font-black shadow-sm backdrop-blur ${
                                categoryBadge[course.category] || course.badgeClass
                              }`}
                            >
                              {course.category}
                            </span>
                            <span
                              className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm backdrop-blur"
                              style={{ animation: 'courseFloat 5s ease-in-out infinite' }}
                            >
                              <FontAwesomeIcon className="text-amber-500" icon={faStar} />
                              {course.rating}
                            </span>
                            <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100">
                              <span className="flex h-14 w-14 scale-75 items-center justify-center rounded-full bg-white/95 text-[#332fe0] shadow-xl transition-transform duration-300 group-hover:scale-100">
                                <FontAwesomeIcon icon={faPlay} />
                              </span>
                            </span>
                          </div>
                        </a>
                        <div className="flex flex-1 flex-col p-6">
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                            {course.instructor}
                          </p>
                          <a
                            className="group/title mt-2 flex items-start justify-between gap-3"
                            href={`/course-detail?course=${course.id || ''}#table-card`}
                          >
                            <h3 className="text-[1.1rem] font-extrabold leading-snug text-slate-950 transition-colors duration-300 group-hover/title:text-[#302be2]">
                              {course.title}
                            </h3>
                            <span className="mt-1 flex h-7 w-7 shrink-0 -translate-x-1 items-center justify-center rounded-full bg-[#edf0ff] text-xs text-[#332fe0] opacity-0 transition-all duration-300 group-hover/title:translate-x-0 group-hover/title:opacity-100">
                              <FontAwesomeIcon icon={faArrowRight} />
                            </span>
                          </a>
                          <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">
                            {course.description || course.category || 'Course details coming soon.'}
                          </p>
                          <div className="mt-4 flex items-center gap-2 text-sm">
                            <span className="flex items-center gap-1 text-amber-500">
                              <FontAwesomeIcon icon={faStar} />
                            </span>
                            <span className="font-bold text-slate-950">{course.rating}</span>
                            <span className="text-xs font-semibold text-slate-400">
                              ({course.students} learners)
                            </span>
                          </div>
                          <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4">
                            <span className="flex items-center gap-2 text-xs font-bold text-[#075a73]">
                              <FontAwesomeIcon icon={faClock} />
                              {course.duration}
                            </span>
                            <span className="text-[1.35rem] font-black text-[#2114e8]">
                              {course.price}
                            </span>
                          </div>
                        </div>
                      </article>
                    </div>
                  </Reveal>
                ))}
              </div>
            )}

            {loadError && !isLoading && (
              <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                Backend courses could not load. {loadError}
              </p>
            )}

            {!isLoading && visibleCourses.length > 0 && (
              <div className="mt-16 flex justify-center gap-2">
                {['prev', ...Array.from({ length: totalPages }, (_, index) => String(index + 1)), 'next'].map((item) => (
                  <button
                    className={`flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-medium transition-all duration-200 ${
                      item === String(page)
                        ? 'scale-110 border-transparent bg-gradient-to-r from-[#302be2] to-[#7c3aed] text-white shadow-lg shadow-indigo-500/30'
                        : 'border-slate-300 bg-white text-slate-950 hover:-translate-y-0.5 hover:border-[#403be5] hover:text-[#2114e8]'
                    } ${(item === 'prev' && page === 1) || (item === 'next' && page === totalPages) ? 'cursor-not-allowed opacity-40' : ''}`}
                    disabled={(item === 'prev' && page === 1) || (item === 'next' && page === totalPages)}
                    key={item}
                    onClick={() => {
                      if (item === 'prev') changePage(page - 1)
                      else if (item === 'next') changePage(page + 1)
                      else changePage(Number(item))
                    }}
                  >
                    {item === 'prev' && <FontAwesomeIcon icon={faChevronLeft} />}
                    {item === 'next' && <FontAwesomeIcon icon={faChevronRight} />}
                    {item !== 'prev' && item !== 'next' && item}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

export default Coursre