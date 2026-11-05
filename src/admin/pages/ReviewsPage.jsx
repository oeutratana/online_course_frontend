import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChevronLeft,
  faChevronRight,
  faMagnifyingGlass,
  faStar,
  faTrashCan,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons'
import AdminPageHeader from './AdminPageHeader'
import { deleteAdminReview, getAdminReviews } from '../../lib/adminDashboardApi'
import { formatDate, getInitials } from '../adminUtils'

const PAGE_SIZE = 10

const Stars = ({ rating }) => (
  <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
    {Array.from({ length: 5 }).map((_, index) => (
      <FontAwesomeIcon
        className={index < rating ? 'text-amber-400' : 'text-slate-200'}
        icon={faStar}
        key={index}
      />
    ))}
  </span>
)

const ReviewsPage = ({ searchQuery = '' }) => {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [rating, setRating] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState({ items: [], total: 0, currentPage: 1, lastPage: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true)
      setError('')
      setDebouncedSearch(`${searchQuery} ${search}`.trim())
      setPage(1)
    }, 350)

    return () => clearTimeout(timeout)
  }, [search, searchQuery])

  useEffect(() => {
    let isMounted = true

    getAdminReviews({ page, perPage: PAGE_SIZE, search: debouncedSearch, rating })
      .then((result) => {
        if (isMounted) setData(result)
      })
      .catch((requestError) => {
        if (isMounted) setError(requestError?.message || 'Reviews could not be loaded.')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [debouncedSearch, page, rating, reloadKey])

  const averageRating = data.items.length > 0
    ? (data.items.reduce((sum, review) => sum + review.rating, 0) / data.items.length).toFixed(1)
    : '0.0'

  const handleDelete = async (review) => {
    const courseId = review.course?.id

    if (!courseId) {
      setError('This review is missing its course reference and cannot be deleted here.')
      return
    }

    if (!window.confirm(`Delete this ${review.rating}-star review from ${review.studentName}? This cannot be undone.`)) {
      return
    }

    setDeletingId(review.id)
    setError('')

    try {
      await deleteAdminReview({ courseId, reviewId: review.id })
      setLoading(true)

      if (data.items.length === 1 && page > 1) {
        setPage((current) => current - 1)
      } else {
        setReloadKey((current) => current + 1)
      }
    } catch (requestError) {
      setError(requestError?.message || 'The review could not be deleted.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 xl:px-8">
      <AdminPageHeader
        title="Reviews"
        text="Student course reviews with moderation. Deleting a review also recalculates the course rating and review count."
      />

      {error && (
        <p className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          <FontAwesomeIcon className="mt-0.5" icon={faTriangleExclamation} />
          {error}
          <button
            className="ml-auto font-black underline"
            onClick={() => {
              setLoading(true)
              setError('')
              setReloadKey((current) => current + 1)
            }}
            type="button"
          >
            Retry
          </button>
        </p>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-950">Course Reviews</h2>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">
              {data.total.toLocaleString()} reviews · {averageRating} average on this page
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <FontAwesomeIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" icon={faMagnifyingGlass} />
              <input
                aria-label="Search reviews"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-semibold outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 sm:w-60"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search student, course, review..."
                type="search"
                value={search}
              />
            </div>
            <select
              aria-label="Filter by rating"
              className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400 focus:bg-white"
              onChange={(event) => {
                setLoading(true)
                setError('')
                setRating(event.target.value)
                setPage(1)
              }}
              value={rating}
            >
              <option value="">All ratings</option>
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>{value} star{value === 1 ? '' : 's'}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-5 py-3">Student</th>
                <th className="px-5 py-3">Course</th>
                <th className="px-5 py-3">Rating</th>
                <th className="px-5 py-3">Review</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td className="px-5 py-8" colSpan={6}>
                    <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                  </td>
                </tr>
              )}

              {!loading && data.items.length === 0 && (
                <tr>
                  <td className="px-5 py-12 text-center text-sm font-semibold text-slate-500" colSpan={6}>
                    No reviews match these filters.
                  </td>
                </tr>
              )}

              {data.items.map((review) => (
                <tr className="transition hover:bg-slate-50/70" key={review.id}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[10px] font-black text-blue-600">
                        {getInitials(review.studentName)}
                      </span>
                      <span className="text-xs font-bold text-slate-800">{review.studentName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="block max-w-48 truncate text-xs font-semibold text-slate-600">
                      {review.course?.title || 'Unknown course'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <Stars rating={review.rating} />
                  </td>
                  <td className="px-5 py-3">
                    <p className="max-w-sm line-clamp-2 text-xs font-medium text-slate-600">{review.review || '—'}</p>
                  </td>
                  <td className="px-5 py-3 text-xs font-semibold text-slate-600">{formatDate(review.createdAt)}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      aria-label={`Delete review by ${review.studentName}`}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-black text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={deletingId === review.id}
                      onClick={() => handleDelete(review)}
                      type="button"
                    >
                      <FontAwesomeIcon icon={faTrashCan} />
                      {deletingId === review.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
          <p className="text-xs font-semibold text-slate-500">{data.total.toLocaleString()} reviews</p>
          <div className="flex items-center gap-2">
            <button
              className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={page <= 1 || loading}
              onClick={() => {
                setLoading(true)
                setError('')
                setPage((current) => Math.max(1, current - 1))
              }}
              type="button"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
              Prev
            </button>
            <span className="text-xs font-bold text-slate-500">Page {page} / {data.lastPage || 1}</span>
            <button
              className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={page >= data.lastPage || loading}
              onClick={() => {
                setLoading(true)
                setError('')
                setPage((current) => current + 1)
              }}
              type="button"
            >
              Next
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ReviewsPage
