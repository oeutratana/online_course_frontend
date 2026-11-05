import { createPayment, checkPayment, normalizePayment } from './paymentApi'

// Backward-compatible wrappers.
// The canonical payment logic now lives in ./paymentApi.
// Payment communication happens ONLY through the Laravel backend;
// this file never contacts Bakong directly.

export const normalizeBakongPayment = normalizePayment

export const createBakongPayment = async ({ course_id }) => createPayment(course_id)

export const verifyBakongPayment = async (payment) => checkPayment(payment?.id)