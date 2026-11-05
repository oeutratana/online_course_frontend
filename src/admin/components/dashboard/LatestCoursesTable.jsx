import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBookOpen,
  faChevronLeft,
  faChevronRight,
  faEye,
  faMagnifyingGlass,
  faPen,
  faPlus,
  faTrash,
} from '@fortawesome/free-solid-svg-icons'
import { formatMoney } from '../../adminUtils'

const StatusBadge = ({ published }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
      published ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
    }`}
  >
    <span className={`h-1.5 w-1.5 rounded-full ${published ? 'bg-emerald-500' : 'bg-amber-500'}`} />
    {published ? 'Published' : 'Draft'}
  </span>
)

const Thumbnail = ({ course }) => (
  course.thumbnail ? (
    <img
      alt=""
      className="h-11 w-16 shrink-0 rounded-lg object-cover ring-1 ring-slate-200"
      loading="lazy"
      src={course.thumbnail}
    />
  ) : (
    <span className="flex h-11 w-16 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
      <FontAwesomeIcon icon={faBookOpen} />
    </span>
  )
)

const LatestCoursesTable = ({
  courses = [],
  loading,
  error,
  page,
  lastPage,
  total,
  perPage,
  search,
  onSearchChange,
  onPageChange,
  onDelete,
  deletingId,
}) => {
  const from = total === 0 ? 0 : (page - 1) * perPage + 1
  const to = Math.min(page * perPage, total)

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">Latest Courses</h2>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">
            Newest courses returned by the admin API
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <FontAwesomeIcon
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400"
              icon={faMagnifyingGlass}
            />
            <input
              aria-label="Search courses"
              className="h-10 w-full min-w-48 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 sm:w-56"
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search courses..."
              type="search"
              value={search}
            />
          </div>
          <a
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-black text-white transition hover:bg-blue-700"
            href="/admin/courses"
          >
            <FontAwesomeIcon icon={faPlus} />
            View All
          </a>
        </div>
      </div>

      {error ? (
        <p className="m-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-6 text-center text-sm font-semibold text-rose-600">
          {error}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Course</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Instructor</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && courses.length === 0 && (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={`skeleton-${index}`}>
                    <td className="px-5 py-4" colSpan={7}>
                      <div className="h-11 animate-pulse rounded-lg bg-slate-100" />
                    </td>
                  </tr>
                ))
              )}

              {!loading && courses.length === 0 && (
                <tr>
                  <td className="px-5 py-12 text-center text-sm font-semibold text-slate-500" colSpan={7}>
                    No courses found{search ? ` for “${search}”` : ''}.
                  </td>
                </tr>
              )}

              {courses.map((course) => (
                <tr className="transition hover:bg-slate-50/70" key={course.id}>
                  <td className="px-5 py-3 text-xs font-black text-slate-500">#{course.id}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Thumbnail course={course} />
                      <div className="min-w-0">
                        <p className="max-w-64 truncate font-black text-slate-900">{course.title}</p>
                        <p className="max-w-64 truncate text-xs text-slate-500">{course.slug || 'No slug'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                      {course.category}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs font-semibold text-slate-600">{course.instructor}</td>
                  <td className="px-5 py-3 text-sm font-black text-slate-900">
                    {course.price > 0 ? formatMoney(course.price) : 'Free'}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge published={course.isPublished} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <a
                        aria-label={`View ${course.title}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                        href={`/course-detail?course=${course.id}`}
                        title="View course"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </a>
                      <a
                        aria-label={`Edit ${course.title}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-amber-50 hover:text-amber-600"
                        href={`/admin/courses?edit=${course.id}`}
                        title="Edit course"
                      >
                        <FontAwesomeIcon icon={faPen} />
                      </a>
                      <button
                        aria-label={`Delete ${course.title}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                        disabled={deletingId === course.id}
                        onClick={() => onDelete(course)}
                        title="Delete course"
                        type="button"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold text-slate-500">
          Showing <span className="font-black text-slate-800">{from}</span>–
          <span className="font-black text-slate-800">{to}</span> of{' '}
          <span className="font-black text-slate-800">{total}</span> courses
        </p>
        <div className="flex items-center gap-2">
          <button
            className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={page <= 1 || loading}
            onClick={() => onPageChange(page - 1)}
            type="button"
          >
            <FontAwesomeIcon icon={faChevronLeft} />
            Prev
          </button>
          <span className="text-xs font-bold text-slate-500">
            Page {page} / {Math.max(lastPage, 1)}
          </span>
          <button
            className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={page >= lastPage || loading}
            onClick={() => onPageChange(page + 1)}
            type="button"
          >
            Next
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      </div>
    </section>
  )
}

export default LatestCoursesTable
