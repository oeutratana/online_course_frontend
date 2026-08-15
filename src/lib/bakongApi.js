import { apiRequest } from './authApi'

const defaultBakongPaymentPath = '/payments'
const getFirstValue = (source, keys) => keys.map((key) => source?.[key]).find((value) => (
  value !== undefined && value !== null && value !== ''
))

const getQrImageUrl = (qrText) => (
  qrText
    ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(qrText)}`
    : ''
)

const isImageUrl = (value) => /^https?:\/\//i.test(String(value || ''))

export const normalizeBakongPayment = (data) => {
  const payment = data?.data || data?.payment || data?.result || data
  const providerPayload = payment?.provider_payload || payment?.providerPayload || {}
  const source = {
    ...providerPayload,
    ...payment,
  }
  const rawQr = getFirstValue(source, ['qr', 'khqr', 'qrCode', 'qr_code', 'payment_qr'])
  const qrText = getFirstValue(source, ['qr_string', 'qrString', 'khqr_string', 'khqrString'])
    || (isImageUrl(rawQr) ? '' : rawQr)
  const qrImage = getFirstValue(source, ['qr_url', 'qrUrl', 'qr_image', 'qrImage', 'qr_image_url', 'qrImageUrl', 'image', 'image_url'])
    || (isImageUrl(rawQr) ? rawQr : '')

  return {
    id: getFirstValue(payment, ['id', 'payment_id', 'paymentId', 'transaction_id', 'transactionId', 'reference']),
    md5: getFirstValue(payment, ['md5', 'bakong_md5', 'hash', 'payment_hash', 'paymentHash']),
    qrText,
    qrImage: qrImage || getQrImageUrl(qrText),
    amount: getFirstValue(payment, ['amount', 'total']),
    currency: getFirstValue(payment, ['currency']) || 'USD',
    status: getFirstValue(payment, ['status']) || 'pending',
    raw: payment,
  }
}

export const createBakongPayment = async (payload) => {
  const path = import.meta.env.VITE_BAKONG_PAYMENT_ENDPOINT || defaultBakongPaymentPath
  const data = await apiRequest(path, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return normalizeBakongPayment(data)
}

export const verifyBakongPayment = async (payment) => {
  const configuredPath = import.meta.env.VITE_BAKONG_VERIFY_ENDPOINT
  const path = configuredPath || (payment?.id ? `/payments/${payment.id}/check` : '')

  if (!path) {
    return { status: 'skipped' }
  }

  const data = await apiRequest(path, {
    method: 'POST',
    body: JSON.stringify({
      payment_id: payment?.id,
      md5: payment?.md5,
      reference: payment?.id,
    }),
  })

  return data?.data || data?.payment || data
}
