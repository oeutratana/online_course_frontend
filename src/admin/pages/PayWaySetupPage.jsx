import { useEffect, useMemo, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCircleCheck,
  faCoins,
  faKey,
  faLink,
  faLock,
  faQrcode,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons'
import AdminPageHeader from './AdminPageHeader'
import { getAdminPayments, isPaymentPaid, readProviderOption } from '../../lib/adminApi'
import { formatMoney, matchesSearch } from '../adminUtils'

// Mirrors the PayWay block in config/services.php and the env table in
// Laravel_Online_Course/agent-guide.md. Values come from the server .env and are
// never exposed by the API, so this page is a reference, not an editor.
const merchantSettings = [
  { env: 'PAYWAY_ENV', required: true, defaultValue: 'sandbox', description: 'sandbox or production', live: '' },
  { env: 'PAYWAY_BASE_URL', required: false, defaultValue: 'https://checkout-sandbox.payway.com.kh', description: 'Checkout base URL per environment', live: '' },
  { env: 'PAYWAY_MERCHANT_ID', required: true, defaultValue: '—', description: 'Merchant ID issued by ABA Bank', live: 'never exposed' },
  { env: 'PAYWAY_API_KEY', required: true, defaultValue: '—', description: 'HMAC-SHA512 key for request hashing', live: 'never exposed' },
  { env: 'PAYWAY_CALLBACK_SECRET', required: true, defaultValue: '—', description: 'Verifies the X-PAYWAY-HMAC-SHA512 callback', live: 'never exposed' },
  { env: 'PAYWAY_PURCHASE_URL', required: false, defaultValue: '${PAYWAY_BASE_URL}/api/payment-gateway/v1/payments/purchase', description: 'Purchase endpoint override', live: '' },
  { env: 'PAYWAY_CHECK_URL', required: false, defaultValue: '${PAYWAY_BASE_URL}/api/payment-gateway/v1/payments/check-transaction-2', description: 'Check endpoint override', live: '' },
  { env: 'PAYWAY_FRONTEND_RETURN_URL', required: true, defaultValue: '${APP_URL}', description: 'Customer return URL after success', live: '' },
  { env: 'PAYWAY_CANCEL_URL', required: false, defaultValue: '${PAYWAY_FRONTEND_RETURN_URL}', description: 'Customer redirect on cancel', live: '' },
  { env: 'PAYWAY_CALLBACK_URL', required: true, defaultValue: '—', description: 'Whitelisted server-to-server callback', live: 'never exposed' },
  { env: 'PAYWAY_CURRENCY', required: false, defaultValue: 'USD', description: 'USD or KHR', live: 'observed' },
  { env: 'PAYWAY_PAYMENT_OPTION', required: false, defaultValue: 'abapay_khqr_deeplink', description: 'abapay_khqr_deeplink, cards, or empty for hosted selection', live: 'observed' },
  { env: 'PAYWAY_LIFETIME_MINUTES', required: false, defaultValue: '60', description: 'Checkout lifetime in minutes (min 3)', live: '' },
]

const paywayEndpoints = [
  { method: 'POST', path: '/api/payments', guard: 'auth:sanctum', note: 'Creates the PayWay purchase and stores provider_payload on the payment.' },
  { method: 'POST', path: '/api/payments/{payment}/check', guard: 'auth:sanctum (owner or admin)', note: 'Re-queries PayWay; 202 while pending, 200 once confirmed.' },
  { method: 'POST', path: '/api/payments/payway/callback', guard: 'public + HMAC header', note: 'Server-to-server result, authenticated by X-PAYWAY-HMAC-SHA512.' },
]

const PayWaySetupPage = ({ searchQuery = '' }) => {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

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

  const insights = useMemo(() => {
    const paid = payments.filter(isPaymentPaid)
    const currencies = [...new Set(payments.map((payment) => payment.currency).filter(Boolean))]

    return {
      currency: currencies[0] || 'USD',
      mixedCurrencies: currencies.length > 1,
      revenue: paid.reduce((total, payment) => total + payment.amount, 0),
      withQr: payments.filter((payment) => readProviderOption(payment, 'qr_string')).length,
      withDeeplink: payments.filter((payment) => readProviderOption(payment, 'abapay_deeplink')).length,
      withCheckout: payments.filter((payment) => readProviderOption(payment, 'checkout_url')).length,
      needsAttention: payments.filter((payment) => ['failed', 'expired'].includes(payment.status)).length,
    }
  }, [payments])

  const filteredSettings = useMemo(() => merchantSettings.filter((setting) => matchesSearch(searchQuery, [
    setting.env,
    setting.description,
    setting.defaultValue,
  ])), [searchQuery])

  const filteredEndpoints = useMemo(() => paywayEndpoints.filter((endpoint) => matchesSearch(searchQuery, [
    endpoint.method,
    endpoint.path,
    endpoint.guard,
    endpoint.note,
  ])), [searchQuery])

  return (
    <div className="px-5 py-8 xl:px-8">
      <AdminPageHeader
        title="PayWay Setup"
        text="Reference for the PayWay merchant configuration that lives in the Laravel .env file and is read through config/services.php."
      />

      {loadError && (
        <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          {loadError}
        </p>
      )}

      <p className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-800">
        <FontAwesomeIcon className="mt-1" icon={faTriangleExclamation} />
        There is no admin settings endpoint in the API, so these values cannot be edited from this console and
        no secret is ever returned. Change them in the Laravel <span className="font-black">.env</span> file and
        clear the config cache.
      </p>

      <div className="mt-8 grid gap-5 md:grid-cols-4">
        {[
          { label: 'Currency In Use', value: insights.currency, icon: faCoins, color: 'bg-violet-100 text-violet-700' },
          { label: 'Paid Revenue', value: formatMoney(insights.revenue, insights.currency), icon: faCircleCheck, color: 'bg-emerald-100 text-emerald-700' },
          { label: 'KHQR Issued', value: `${insights.withQr} / ${insights.withDeeplink}`, icon: faQrcode, color: 'bg-cyan-100 text-cyan-700' },
          { label: 'Needs Attention', value: insights.needsAttention.toLocaleString(), icon: faTriangleExclamation, color: 'bg-amber-100 text-amber-700' },
        ].map((stat) => (
          <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/50" key={stat.label}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight">{loading ? '—' : stat.value}</h2>
              </div>
              <span className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${stat.color}`}>
                <FontAwesomeIcon icon={stat.icon} />
              </span>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8 grid gap-6 2xl:grid-cols-[1fr_420px]">
        <section className="rounded-2xl border border-slate-100 bg-white shadow-lg shadow-slate-200/50">
          <div className="flex items-center gap-4 border-b border-slate-100 p-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#edf0ff] text-xl text-[#302be2]">
              <FontAwesomeIcon icon={faKey} />
            </span>
            <div>
              <h2 className="text-xl font-black">Merchant Environment</h2>
              <p className="mt-1 text-sm text-slate-500">Minimum required: merchant id, api key and callback url.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="px-6 py-4">Env Var</th>
                  <th className="px-6 py-4">Required</th>
                  <th className="px-6 py-4">Default</th>
                  <th className="px-6 py-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSettings.map((setting) => (
                  <tr className="align-top hover:bg-slate-50/70" key={setting.env}>
                    <td className="px-6 py-4">
                      <p className="font-mono text-xs font-black text-slate-800">{setting.env}</p>
                      {setting.live === 'never exposed' && (
                        <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                          <FontAwesomeIcon icon={faLock} />
                          never exposed by the API
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${setting.required ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                        {setting.required ? 'YES' : 'NO'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">
                      {setting.live === 'observed' ? insights.currency : setting.defaultValue}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{setting.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="grid gap-6">
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/50">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 text-xl text-cyan-700">
                <FontAwesomeIcon icon={faLink} />
              </span>
              <div>
                <h2 className="text-xl font-black">PayWay Endpoints</h2>
                <p className="mt-1 text-sm text-slate-500">Routes that talk to the gateway.</p>
              </div>
            </div>

            <ul className="mt-6 grid gap-3">
              {filteredEndpoints.map((endpoint) => (
                <li className="rounded-xl bg-slate-50 p-4" key={endpoint.path}>
                  <p className="font-mono text-xs font-black text-slate-800">{endpoint.method} {endpoint.path}</p>
                  <p className="mt-1 text-xs font-bold text-[#302be2]">{endpoint.guard}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{endpoint.note}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/50">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-xl text-emerald-700">
                <FontAwesomeIcon icon={faQrcode} />
              </span>
              <div>
                <h2 className="text-xl font-black">Checkout Coverage</h2>
                <p className="mt-1 text-sm text-slate-500">What PayWay returned for stored payments.</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {[
                { label: 'KHQR payload', value: insights.withQr },
                { label: 'ABA deeplink', value: insights.withDeeplink },
                { label: 'Hosted checkout URL', value: insights.withCheckout },
                { label: 'Total payments', value: payments.length },
              ].map((item) => (
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3" key={item.label}>
                  <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                  <span className="font-black">{loading ? '—' : item.value}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}

export default PayWaySetupPage