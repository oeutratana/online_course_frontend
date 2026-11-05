import { apiRequest } from './authApi'

/**
 * Admin-only read/write helpers for the Laravel API.
 *
 * Response shapes (see Laravel_Online_Course/agent-guide.md and
 * routes/api.php in that project):
 *
 *   GET /payments          -> bare array of raw Payment models + user/course
 *                             (amount is a decimal STRING, provider_payload is
 *                             a decoded JSON object, there is no `currency` or
 *                             `payment_option` column)
 *   GET /payments/{id}     -> same shape as a single item
 *   POST /payments/{id}/check
 *                         -> { success, message, data: { payment_id, course_id,
 *                             amount (number), currency, status,
 *                             transaction_id, checkout_url, checkout_form,
 *                             qr_url, qr_string, abapay_deeplink, paid_at } }
 *                             202 while still pending, 403 for a non-owner
 *                             non-admin, 409 without a transaction id.
 *   GET /users             -> bare array; `?role=` is the ONLY filter the API
 *                             supports (no search, no pagination)
 *   GET /users/{id}        -> user + courses, enrollments.course,
 *                             lessonProgress.lesson, payments.course
 *   GET /enrollments       -> bare array (id, user_id, course_id, enrolled_at,
 *                             status, user, course) - no progress field
 *   GET /lesson-progress   -> bare array (id, user_id, lesson_id, is_completed,
 *                             completed_at, user, lesson.course) - the course is
 *                             nested under lesson, the flag is `is_completed`
 *   GET /quizzes           -> bare array (id, lesson_id, title, lesson.course);
 *                             no questions_count, so counts come from
 *                             GET /questions
 */

export const USER_ROLES = ['admin', 'student', 'instructor']

// POST /users only validates `in:student,admin` (UserController::store).
export const ASSIGNABLE_USER_ROLES = ['student', 'instructor', 'admin']

export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'expired']

const PAID_STATUSES = new Set(['paid', 'completed', 'complete', 'success', 'successful', 'captured', 'confirmed'])

const unwrapList = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.data?.data)) return data.data.data
  if (Array.isArray(data?.items)) return data.items

  return []
}

const unwrapItem = (data) => {
  if (data && typeof data === 'object' && data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
    return data.data
  }

  return data ?? null
}

const toNumber = (value) => {
  const parsed = Number(String(value ?? '').replace(/[^0-9.]/g, ''))

  return Number.isFinite(parsed) ? parsed : 0
}

const readProvider = (payment, key) => {
  const provider = payment?.provider_payload

  if (!provider || typeof provider !== 'object') return undefined

  return provider[key]
    ?? provider.check?.data?.[key]
    ?? provider.check?.[key]
    ?? provider.callback?.[key]
}

/**
 * Reads a single key out of the stored PayWay payload, checking the purchase
 * response, the latest check response and the callback body in that order.
 */
export const readProviderOption = (payment, key) => readProvider(payment, key)

export const isPaymentPaid = (payment) => PAID_STATUSES.has(String(payment?.status ?? '').toLowerCase())

export const getPaymentProviderStatus = (payment) => {
  const raw = readProvider(payment, 'status')

  return raw === undefined || raw === null ? '' : String(raw)
}

// PayWay uses "0" for a completed transaction in both the check response
// (data.status) and the server-to-server callback body.
export const isProviderStatusSuccess = (payment) => getPaymentProviderStatus(payment) === '0'

// `payment_option` is never persisted as a column: PayWayPaymentService only
// sends it on purchase. Fall back to whatever the check/callback echoed back,
// then to the stored `method` column.
export const getPaymentOption = (payment) => (
  readProvider(payment, 'payment_option') ?? payment?.method ?? 'unknown'
)

export const getPaymentCurrency = (payment) => (
  readProvider(payment, 'currency') ?? 'USD'
)

export const normalizeAdminPayment = (payment) => ({
  id: payment?.id ?? null,
  userId: payment?.user_id ?? null,
  courseId: payment?.course_id ?? null,
  user: payment?.user ?? null,
  course: payment?.course ?? null,
  amount: toNumber(payment?.amount),
  currency: getPaymentCurrency(payment),
  method: payment?.method ?? 'payway',
  status: String(payment?.status ?? 'pending').toLowerCase(),
  transactionId: payment?.transaction_id ?? '',
  qrUrl: payment?.qr_url ?? '',
  providerStatus: getPaymentProviderStatus(payment),
  providerSuccess: isProviderStatusSuccess(payment),
  providerPayload: payment?.provider_payload ?? null,
  paidAt: payment?.paid_at ?? null,
  createdAt: payment?.created_at ?? null,
  updatedAt: payment?.updated_at ?? null,
})

export const getAdminPayments = async ({ status = '', userId = '', courseId = '' } = {}) => {
  const query = new URLSearchParams()

  if (status) query.set('status', status)
  if (userId) query.set('user_id', String(userId))
  if (courseId) query.set('course_id', String(courseId))

  const suffix = query.toString() ? `?${query.toString()}` : ''

  return unwrapList(await apiRequest(`/payments${suffix}`)).map(normalizeAdminPayment)
}

export const getAdminPayment = async (id) => normalizeAdminPayment(
  unwrapItem(await apiRequest(`/payments/${id}`)),
)

/**
 * POST /payments/{payment}/check re-queries PayWay and updates the local row.
 * Throws ApiError on 403/409/502 so callers can surface the gateway message.
 */
export const recheckAdminPayment = async (id) => {
  const response = await apiRequest(`/payments/${id}/check`, { method: 'POST' })

  return {
    message: response?.message ?? '',
    status: String(response?.data?.status ?? '').toLowerCase(),
  }
}

export const normalizeAdminUser = (user) => ({
  id: user?.id ?? null,
  name: user?.name ?? '',
  email: user?.email ?? '',
  role: String(user?.role ?? 'student').toLowerCase(),
  emailVerifiedAt: user?.email_verified_at ?? null,
  createdAt: user?.created_at ?? null,
  raw: user ?? null,
})

export const normalizeAdminUserDetail = (user) => ({
  ...normalizeAdminUser(user),
  courses: Array.isArray(user?.courses) ? user.courses : [],
  enrollments: Array.isArray(user?.enrollments) ? user.enrollments : [],
  lessonProgress: Array.isArray(user?.lessonProgress) ? user.lessonProgress : [],
  payments: Array.isArray(user?.payments) ? user.payments : [],
})

export const getAdminUsers = async ({ role = '' } = {}) => {
  const suffix = role ? `?role=${encodeURIComponent(role)}` : ''

  return unwrapList(await apiRequest(`/users${suffix}`)).map(normalizeAdminUser)
}

export const getAdminUser = async (id) => normalizeAdminUserDetail(
  unwrapItem(await apiRequest(`/users/${id}`)),
)

export const createAdminUser = async (payload) => normalizeAdminUser(
  unwrapItem(await apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  })),
)

export const normalizeAdminEnrollment = (enrollment) => ({
  id: enrollment?.id ?? null,
  userId: enrollment?.user_id ?? null,
  courseId: enrollment?.course_id ?? null,
  status: String(enrollment?.status ?? '').toLowerCase(),
  enrolledAt: enrollment?.enrolled_at ?? null,
  createdAt: enrollment?.created_at ?? null,
  user: enrollment?.user ?? null,
  course: enrollment?.course ?? null,
  raw: enrollment ?? null,
})

export const getAdminEnrollments = async ({ status = '', userId = '', courseId = '' } = {}) => {
  const query = new URLSearchParams()

  if (status) query.set('status', status)
  if (userId) query.set('user_id', String(userId))
  if (courseId) query.set('course_id', String(courseId))

  const suffix = query.toString() ? `?${query.toString()}` : ''

  return unwrapList(await apiRequest(`/enrollments${suffix}`)).map(normalizeAdminEnrollment)
}

export const normalizeAdminLessonProgress = (progress) => ({
  id: progress?.id ?? null,
  userId: progress?.user_id ?? null,
  lessonId: progress?.lesson_id ?? null,
  courseId: progress?.lesson?.course_id ?? null,
  isCompleted: Boolean(progress?.is_completed),
  completedAt: progress?.completed_at ?? null,
  createdAt: progress?.created_at ?? null,
  user: progress?.user ?? null,
  lesson: progress?.lesson ?? null,
  course: progress?.lesson?.course ?? null,
  raw: progress ?? null,
})

export const getAdminLessonProgress = async ({ userId = '', lessonId = '', completed = '' } = {}) => {
  const query = new URLSearchParams()

  if (userId) query.set('user_id', String(userId))
  if (lessonId) query.set('lesson_id', String(lessonId))
  if (completed !== '') query.set('completed', completed ? '1' : '0')

  const suffix = query.toString() ? `?${query.toString()}` : ''

  return unwrapList(await apiRequest(`/lesson-progress${suffix}`)).map(normalizeAdminLessonProgress)
}

export const normalizeAdminQuiz = (quiz) => ({
  id: quiz?.id ?? null,
  lessonId: quiz?.lesson_id ?? null,
  courseId: quiz?.lesson?.course_id ?? null,
  title: quiz?.title ?? 'Untitled quiz',
  description: quiz?.description ?? '',
  passingScore: Number(quiz?.passing_score ?? 60),
  maxAttempts: Number(quiz?.max_attempts ?? 0),
  isPublished: Boolean(quiz?.is_published),
  isRequired: Boolean(quiz?.is_required),
  questionsCount: Number(quiz?.questions_count ?? (Array.isArray(quiz?.questions) ? quiz.questions.length : 0)),
  createdAt: quiz?.created_at ?? null,
  lesson: quiz?.lesson ?? null,
  course: quiz?.lesson?.course ?? null,
  questions: Array.isArray(quiz?.questions) ? quiz.questions : [],
  raw: quiz ?? null,
})

export const getAdminQuizzes = async ({
  page = 1,
  perPage = 10,
  search = '',
  courseId = '',
  lessonId = '',
  status = '',
} = {}) => {
  const query = new URLSearchParams({ page: String(page), per_page: String(perPage) })

  if (search) query.set('search', search)
  if (courseId) query.set('course_id', String(courseId))
  if (lessonId) query.set('lesson_id', String(lessonId))
  if (status) query.set('status', status)

  const response = await apiRequest(`/admin/quizzes?${query.toString()}`)

  return {
    items: unwrapList(response).map(normalizeAdminQuiz),
    total: Number(response?.total ?? 0),
    currentPage: Number(response?.current_page ?? page),
    lastPage: Number(response?.last_page ?? 1),
    perPage: Number(response?.per_page ?? perPage),
    stats: response?.stats ?? { total: 0, published: 0, draft: 0, required: 0 },
  }
}

export const getAdminQuiz = async (id) => normalizeAdminQuiz(
  unwrapItem(await apiRequest(`/admin/quizzes/${id}`)),
)

export const createAdminQuiz = async (quiz) => normalizeAdminQuiz(
  unwrapItem(await apiRequest('/quizzes', {
    method: 'POST',
    body: JSON.stringify(quiz),
  })),
)

export const updateAdminQuiz = async (id, quiz) => normalizeAdminQuiz(
  unwrapItem(await apiRequest(`/quizzes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(quiz),
  })),
)

export const deleteAdminQuiz = async (id) => apiRequest(`/quizzes/${id}`, {
  method: 'DELETE',
})

export const getAdminQuestions = async (quizId = '') => {
  const suffix = quizId ? `?quiz_id=${encodeURIComponent(quizId)}` : ''

  return unwrapList(await apiRequest(`/admin/questions${suffix}`))
}

export const createAdminQuestion = async (quizId, question) => unwrapItem(
  await apiRequest(`/quizzes/${quizId}/questions`, {
    method: 'POST',
    body: JSON.stringify(question),
  }),
)

export const updateAdminQuestion = async (id, question) => unwrapItem(
  await apiRequest(`/questions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(question),
  }),
)

export const deleteAdminQuestion = async (id) => apiRequest(`/questions/${id}`, {
  method: 'DELETE',
})

export const reorderAdminQuestions = async (quizId, questionIds) => unwrapItem(
  await apiRequest(`/quizzes/${quizId}/questions/reorder`, {
    method: 'PUT',
    body: JSON.stringify({ question_ids: questionIds }),
  }),
)

export { toNumber }