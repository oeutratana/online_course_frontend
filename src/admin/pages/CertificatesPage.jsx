import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowUpRightFromSquare,
  faBookOpen,
  faCertificate,
  faChevronLeft,
  faChevronRight,
  faMagnifyingGlass,
  faTriangleExclamation,
  faUserGraduate,
} from '@fortawesome/free-solid-svg-icons'
import AdminPageHeader from './AdminPageHeader'
import { getAdminCertificates } from '../../lib/adminDashboardApi'
import { formatDate } from '../adminUtils'

const PAGE_SIZE = 10

const CertificatesPage = ({ searchQuery = '' }) => {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState({ items: [], total: 0, currentPage: 1, lastPage: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
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

    getAdminCertificates({ page, perPage: PAGE_SIZE, search: debouncedSearch })
      .then((result) => {
        if (isMounted) setData(result)
      })
      .catch((requestError) => {
        if (isMounted) setError(requestError?.message || 'Certificates could not be loaded.')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [debouncedSearch, page, reloadKey])

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 xl:px-8">
      <AdminPageHeader
        title="Certificates"
        text="Every certificate issued by the platform, loaded from the admin certificates endpoint. Certificates are created automatically when a student completes a course."
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

      <div className="grid gap-4 sm:grid-cols-2">
        <article className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Certificates issued</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{data.total.toLocaleString()}</p>
          </div>
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <FontAwesomeIcon icon={faCertificate} />
          </span>
        </article>
        <article className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Results on this page</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{data.items.length.toLocaleString()}</p>
          </div>
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FontAwesomeIcon icon={faUserGraduate} />
          </span>
        </article>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-950">Issued Certificates</h2>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">Verification links are public and read-only</p>
          </div>
          <div className="relative">
            <FontAwesomeIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" icon={faMagnifyingGlass} />
            <input
              aria-label="Search certificates"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-semibold outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 sm:w-64"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search number, student, course..."
              type="search"
              value={search}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-5 py-3">Certificate</th>
                <th className="px-5 py-3">Student</th>
                <th className="px-5 py-3">Course</th>
                <th className="px-5 py-3">Issued</th>
                <th className="px-5 py-3 text-right">Verify</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td className="px-5 py-8" colSpan={5}>
                    <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                  </td>
                </tr>
              )}

              {!loading && data.items.length === 0 && (
                <tr>
                  <td className="px-5 py-12 text-center text-sm font-semibold text-slate-500" colSpan={5}>
                    No certificates found.
                  </td>
                </tr>
              )}

              {data.items.map((certificate) => (
                <tr className="transition hover:bg-slate-50/70" key={certificate.id}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                        <FontAwesomeIcon icon={faCertificate} />
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-700">{certificate.number}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs font-bold text-slate-800">{certificate.studentName}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                      <FontAwesomeIcon className="text-slate-400" icon={faBookOpen} />
                      <span className="max-w-56 truncate">{certificate.course?.title || 'Unknown course'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs font-semibold text-slate-600">{formatDate(certificate.issuedAt)}</td>
                  <td className="px-5 py-3 text-right">
                    {certificate.verifyUrl ? (
                      <a
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-black text-blue-600 transition hover:bg-blue-50"
                        href={certificate.verifyUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Verify
                        <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
          <p className="text-xs font-semibold text-slate-500">{data.total.toLocaleString()} certificates</p>
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

export default CertificatesPage
