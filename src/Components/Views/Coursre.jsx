import { useEffect, useMemo, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChevronLeft,
  faChevronRight,
  faClock,
  faMagnifyingGlass,
  faStar,
} from '@fortawesome/free-solid-svg-icons'
import { getCategories, getCourses } from '../../lib/courseApi'

const courses = []

const filters = {
  Categories: [],
  'Difficulty Level': ['Beginner', 'Intermediate', 'Advanced'],
  'Price Range': ['Free', 'Paid'],
}

const Coursre = () => {
  const [courseItems, setCourseItems] = useState(courses)
  const [categoryItems, setCategoryItems] = useState(filters.Categories)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [priceRange, setPriceRange] = useState('')
  const [sortBy, setSortBy] = useState('Most Popular')
  const [page, setPage] = useState(1)
  const coursesPerPage = 6

  const categoryMap = {
    'Design & Creative': 'Design',
    'Business Management': 'Business',
    'Data Science': 'Data Science',
  }
  const pageFilters = {
    ...filters,
    Categories: categoryItems,
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
          setCategoryItems(categoriesResult.value.map((item) => item.name))
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

  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase()
    const selectedCategory = categoryMap[category] || category

    return courseItems
      .filter((course) => {
        const matchesSearch =
          !query ||
          course.title.toLowerCase().includes(query) ||
          course.instructor.toLowerCase().includes(query) ||
          course.category.toLowerCase().includes(query)
        const matchesCategory = !category || course.category === selectedCategory
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
  }, [category, courseItems, difficulty, priceRange, search, sortBy])

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / coursesPerPage))
  const visibleCourses = filteredCourses.slice((page - 1) * coursesPerPage, page * coursesPerPage)

  const updateFilter = (setter, value) => {
    setter(value)
    setPage(1)
  }

  const changePage = (nextPage) => {
    setPage(Math.min(Math.max(nextPage, 1), totalPages))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="bg-[#f6f7ff] text-slate-950">
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Explore Our Courses</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700 sm:text-lg">
            Elevate your skills with professional-led courses designed for real-world
            application and academic excellence.
          </p>
        </div>

        <div className="mt-10 grid gap-5 border-b border-slate-300 pb-5 lg:grid-cols-[260px_1fr_auto] lg:items-center">
          <label className="relative block">
            <FontAwesomeIcon
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              icon={faMagnifyingGlass}
            />
            <input
              className="h-12 w-full rounded-lg border border-slate-300 bg-white pl-12 pr-4 text-sm outline-none transition placeholder:text-slate-500 focus:border-[#302be2] focus:ring-4 focus:ring-indigo-100"
              onChange={(event) => updateFilter(setSearch, event.target.value)}
              placeholder="Search courses..."
              type="search"
              value={search}
            />
          </label>
          <p className="text-sm text-slate-700">
            {isLoading ? 'Loading courses...' : (
              <>
                Showing <span className="font-black text-slate-950">{filteredCourses.length}</span> courses
              </>
            )}
          </p>
          <div className="flex items-center gap-5 text-sm">
            <span className="text-slate-950">Sort by:</span>
            <select
              className="min-w-44 rounded-md bg-transparent px-2 py-2 font-medium text-[#2114e8] outline-none transition hover:bg-white"
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

        <div className="mt-7 grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="space-y-9">
            {Object.entries(pageFilters).map(([title, items]) => (
              <div key={title}>
                <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
                <div className="mt-5 grid gap-4">
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

                    return (
                      <label key={item} className="flex items-center gap-3 text-sm text-slate-700">
                        <input
                          className="h-5 w-5 accent-[#332fe0]"
                          checked={checked}
                          name={title}
                          onChange={onChange}
                          type={type}
                        />
                        <span>{item}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
          </aside>

          <div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {visibleCourses.map((course) => (
                <article
                  key={course.title}
                  className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200"
                >
                  <a className="block" href={`/course-detail?course=${course.id || ''}#table-card`}>
                    <div className="relative">
                    <img className="h-48 w-full object-cover" src={course.image} alt={course.title} />
                    <span
                      className={`absolute left-4 top-4 rounded-full px-4 py-1.5 text-xs font-bold ${course.badgeClass}`}
                    >
                      {course.category}
                    </span>
                    </div>
                  </a>
                  <div className="p-6">
                    <a
                      className="card-title-font block min-h-16 text-[1.35rem] font-extrabold leading-snug tracking-normal text-slate-950 transition hover:text-[#302be2]"
                      href={`/course-detail?course=${course.id || ''}#table-card`}
                    >
                      {course.title}
                    </a>
                    <p className="mt-4 line-clamp-2 min-h-10 text-sm leading-5 text-slate-700">
                      {course.description || course.category || 'Course details coming soon.'}
                    </p>
                    <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
                      <FontAwesomeIcon className="text-amber-500" icon={faStar} />
                      <span className="font-semibold">{course.rating}</span>
                      <span className="text-xs font-semibold text-slate-500">
                        ({course.students} students)
                      </span>
                    </div>
                    <div className="mt-5 border-t border-slate-300 pt-5">
                      <div className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-2 text-sm font-semibold text-[#064f60]">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#086e80] text-[10px] text-white">
                            <FontAwesomeIcon icon={faClock} />
                          </span>
                          {course.duration}
                        </span>
                        <span className="text-2xl font-black text-[#2114e8]">{course.price}</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {visibleCourses.length === 0 && (
              <div className="rounded-lg border border-slate-300 bg-white p-10 text-center">
                <h2 className="text-xl font-black">No courses found</h2>
                <p className="mt-3 text-sm text-slate-600">
                  Try another search word or choose fewer options.
                </p>
              </div>
            )}

            {loadError && (
              <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                Backend courses could not load. {loadError}
              </p>
            )}

            <div className="mt-16 flex justify-center gap-2">
              {['prev', ...Array.from({ length: totalPages }, (_, index) => String(index + 1)), 'next'].map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    if (item === 'prev') changePage(page - 1)
                    else if (item === 'next') changePage(page + 1)
                    else changePage(Number(item))
                  }}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-sm font-medium transition ${
                    item === String(page)
                      ? 'bg-[#403be5] text-white'
                      : 'bg-white text-slate-950 hover:border-[#403be5] hover:text-[#2114e8]'
                  }`}
                  disabled={(item === 'prev' && page === 1) || (item === 'next' && page === totalPages)}
                >
                  {item === 'prev' && <FontAwesomeIcon icon={faChevronLeft} />}
                  {item === 'next' && <FontAwesomeIcon icon={faChevronRight} />}
                  {item !== 'prev' && item !== 'next' && item}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Coursre
