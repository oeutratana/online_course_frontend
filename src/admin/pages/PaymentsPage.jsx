import { useCallback, useEffect, useMemo, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowRotateRight,
  faCircleCheck,
  faClock,
  faCoins,
  faMagnifyingGlass,
  faReceipt,
  faTriangleExclamation,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import AdminPageHeader from './AdminPageHeader'
import {
  PAYMENT_STATUSES,
  getAdminPayment,
  getAdminPayments,
  getPaymentOption,
  isPaymentPaid,
  recheckAdminPayment,
} from '../../lib/adminApi'
import {
  formatDateTime,
  formatMoney,
  matchesSearch,
  paymentStatusClass,
  prettyJson,
} from '../adminUtils'

const PaymentDetailsModal = ({ paymentId, onClose, onUpdated }) => {
  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let isMounted = true

    getAdminPayment(paymentId)
      .then((result) => {
        if (isMounted) setPayment(result)
      })
      .catch((requestError) => {
        if (isMounted) setError(requestError?.message || 'Could not load this payment.')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [paymentId])

  const handleRecheck = async () => {
    setChecking(true)
    setError('')
    setNotice('')

    try {
      const result = await recheckAdminPayment(paymentId)

      setNotice(result.message || 'Status re-checked.')
      setPayment(await getAdminPayment(paymentId))
      onUpdated?.()
    } catch (requestError) {
      setError(requestError?.message || 'Could not re-check this payment.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
          <div>
            <h3 className="text-xl font-black tracking-tight text-slate-950">
              Payment details — {payment?.transactionId || `#${paymentId}`}
            </h3>
            <p className="mt-1 text-sm text-slate-500">GET /payments/{paymentId} · provider_payload as stored by PayWay</p>
          </div>
          <button
            aria-label="Close payment details"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
            onClick={onClose}
            type="button"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </header>

        <div className="grid gap-6 p-6">
          {loading && <p className="text-sm font-semibold text-slate-500">Loading payment...</p>}
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </p>
          )}
          {notice && !error && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              {notice}
            </p>
          )}

          {payment && (
            <>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <dt className="text-xs font-black uppercase tracking-widest text-slate-500">User</dt>
                  <dd className="mt-1 font-black text-slate-900">{payment.user?.name || 'Unknown user'}</dd>
                  <dd className="text-sm text-slate-500">{payment.user?.email || '—'}</dd>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <dt className="text-xs font-black uppercase tracking-widest text-slate-500">Course</dt>
                  <dd className="mt-1 font-black text-slate-900">{payment.course?.title || 'Unknown course'}</dd>
                  <dd className="text-sm text-slate-500">Method: {payment.method}</dd>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <dt className="text-xs font-black uppercase tracking-widest text-slate-500">Amount</dt>
                  <dd className="mt-1 text-lg font-black text-slate-900">
                    {formatMoney(payment.amount, payment.currency)} {payment.currency}
                  </dd>
                  <dd className="text-sm text-slate-500">Created {formatDateTime(payment.createdAt)}</dd>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <dt className="text-xs font-black uppercase tracking-widest text-slate-500">Statuses</dt>
                  <dd className="mt-1 flex flex-wrap gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${paymentStatusClass(payment.status)}`}>
                      {payment.status.toUpperCase()}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${payment.providerSuccess ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      Provider: {payment.providerStatus || 'n/a'}
                    </span>
                  </dd>
                  <dd className="mt-2 text-sm text-slate-500">Paid at: {formatDateTime(payment.paidAt)}</dd>
                </div>
              </dl>

              <div>
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-500">
                  Raw provider payload (provider_payload)
                </h4>
                <pre className="mt-3 max-h-72 overflow-auto rounded-xl bg-slate-950 p-5 text-xs leading-6 text-slate-100">
                  {prettyJson(payment.providerPayload)}
                </pre>
              </div>
            </>
          )}
        </div>

        <footer className="flex flex-col gap-3 border-t border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-end">
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#302be2] px-5 text-sm font-black text-white transition hover:bg-[#1916b8] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={checking || !payment?.transactionId || payment?.status === 'failed' || payment?.status === 'expired'}
            title={(payment?.status === 'failed' || payment?.status === 'expired') ? 'Failed/expired payments need a fresh checkout' : ''}
            onClick={handleRecheck}
            type="button"
          >
            <FontAwesomeIcon icon={faArrowRotateRight} />
            {checking ? 'Checking with PayWay...' : 'Re-check payment status'}
          </button>
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

const PaymentsPage = ({ searchQuery = '' }) => {
  const [payments, setPayments] = useState([])
  const [status, setStatus] = useState('')
  const [localSearch, setLocalSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [rowError, setRowError] = useState('')
  const [checkingId, setCheckingId] = useState(null)
  const [inspectId, setInspectId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')

    try {
      setPayments(await getAdminPayments())
    } catch (requestError) {
      setLoadError(requestError?.message || 'Payments could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    getAdminPayments()
      .then((result) => {
        if (isMounted) setPayments(result)
      })
      .catch((requestError) => {
        if (isMounted) setLoadError(requestError?.message || 'Payments could not be loaded.')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const stats = useMemo(() => {
    const paid = payments.filter(isPaymentPaid)

    return {
      total: payments.length,
      paid: paid.length,
      pending: payments.filter((payment) => payment.status === 'pending').length,
      revenue: paid.reduce((total, payment) => total + payment.amount, 0),
      currency: payments[0]?.currency || 'USD',
    }
  }, [payments])

  const filteredPayments = useMemo(() => payments
    .filter((payment) => (status ? payment.status === status : true))
    .filter((payment) => matchesSearch(localSearch || searchQuery, [
      payment.transactionId,
      payment.user?.name,
      payment.user?.email,
      payment.course?.title,
      payment.status,
      getPaymentOption(payment),
    ])), [payments, localSearch, searchQuery, status])

  const handleCheck = async (payment) => {
    setCheckingId(payment.id)
    setRowError('')

    try {
      await recheckAdminPayment(payment.id)
      await load()
    } catch (requestError) {
      setRowError(requestError?.message || 'Could not re-check this payment.')
    } finally {
      setCheckingId(null)
    }
  }

  return (
    <div className="px-5 py-8 xl:px-8">
      <AdminPageHeader
        title="Payments"
        text="Monitor PayWay transactions from GET /payments. Inspect any row to read the raw provider_payload, or re-check a transaction against the gateway."
      />

      {loadError && (
        <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          {loadError}
        </p>
      )}
      {rowError && (
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {rowError}
        </p>
      )}

      <div className="mt-8 grid gap-5 md:grid-cols-4">
        {[
          { label: 'Total Payments', value: stats.total.toLocaleString(), icon: faReceipt, color: 'bg-violet-100 text-violet-700' },
          { label: 'Paid', value: stats.paid.toLocaleString(), icon: faCircleCheck, color: 'bg-emerald-100 text-emerald-700' },
          { label: 'Pending', value: stats.pending.toLocaleString(), icon: faClock, color: 'bg-amber-100 text-amber-700' },
          { label: 'Revenue', value: formatMoney(stats.revenue, stats.currency), icon: faCoins, color: 'bg-cyan-100 text-cyan-700' },
        ].map((stat) => (
          <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/50" key={stat.label}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight">{stat.value}</h2>
              </div>
              <span className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${stat.color}`}>
                <FontAwesomeIcon icon={stat.icon} />
              </span>
            </div>
          </article>
        ))}
      </div>

      <section className="mt-8 rounded-2xl border border-slate-100 bg-white shadow-lg shadow-slate-200/50">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-black">Transaction Log</h2>
            <p className="mt-1 text-sm text-slate-500">Newest first, as ordered by the API.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative block">
              <span className="sr-only">Search transactions</span>
              <FontAwesomeIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" icon={faMagnifyingGlass} />
              <input
                className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 sm:w-72"
                onChange={(event) => setLocalSearch(event.target.value)}
                placeholder="Search transactions..."
                type="search"
                value={localSearch || searchQuery}
              />
            </label>
            <label className="block">
              <span className="sr-only">Filter by status</span>
              <select
                className="h-11 rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                onChange={(event) => setStatus(event.target.value)}
                value={status}
              >
                <option value="">All statuses</option>
                {PAYMENT_STATUSES.map((item) => (
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
                <th className="px-5 py-4">Tran ID</th>
                <th className="px-5 py-4">User</th>
                <th className="px-5 py-4">Course</th>
                <th className="px-5 py-4">Amount</th>
                <th className="px-5 py-4">Option</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td className="px-5 py-6 text-slate-500" colSpan={7}>Loading payments...</td>
                </tr>
              )}
              {!loading && filteredPayments.length === 0 && (
                <tr>
                  <td className="px-5 py-6 text-slate-500" colSpan={7}>No payments match this view.</td>
                </tr>
              )}
              {filteredPayments.map((payment) => (
                <tr className="hover:bg-slate-50/70" key={payment.id}>
                  <td className="px-5 py-4 font-mono text-xs font-bold text-slate-700">
                    {payment.transactionId || '—'}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-black">{payment.user?.name || 'Unknown'}</p>
                    <p className="text-slate-500">{payment.user?.email || '—'}</p>
                  </td>
                  <td className="px-5 py-4 text-slate-700">{payment.course?.title || '—'}</td>
                  <td className="px-5 py-4 font-black">{formatMoney(payment.amount, payment.currency)}</td>
                  <td className="px-5 py-4 font-mono text-xs text-slate-600">{getPaymentOption(payment)}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${paymentStatusClass(payment.status)}`}>
                      {payment.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={checkingId === payment.id || !payment.transactionId || payment.status === 'failed' || payment.status === 'expired'}
                        onClick={() => handleCheck(payment)}
                        title={payment.status === 'failed' || payment.status === 'expired' ? 'Failed/expired payments need a fresh checkout' : ''}
                        type="button"
                      >
                        <FontAwesomeIcon icon={faArrowRotateRight} />
                        {checkingId === payment.id ? 'Checking...' : 'Check'}
                      </button>
                      <button
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#302be2] px-3 text-xs font-black text-white transition hover:bg-[#1916b8]"
                        onClick={() => setInspectId(payment.id)}
                        type="button"
                      >
                        <FontAwesomeIcon icon={faMagnifyingGlass} />
                        Inspect
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPayments.some((payment) => payment.status === 'failed' || payment.status === 'expired') && (
          <p className="flex items-start gap-3 border-t border-slate-100 bg-amber-50/60 px-5 py-4 text-sm font-semibold text-amber-800">
            <FontAwesomeIcon className="mt-1" icon={faTriangleExclamation} />
            Failed or expired rows need a fresh checkout — the customer has to start a new PayWay payment
            because each transaction_id is single-use.
          </p>
        )}
      </section>

      {inspectId !== null && (
        <PaymentDetailsModal
          onClose={() => setInspectId(null)}
          onUpdated={load}
          paymentId={inspectId}
        />
      )}
    </div>
  )
}

export default PaymentsPage