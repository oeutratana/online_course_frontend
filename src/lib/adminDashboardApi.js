import { BACKEND_URL, apiRequest } from './authApi'

/**
 * Read helpers for the admin dashboard.
 *
 * Everything here is backed by the real Laravel API:
 *
 *   GET /admin/dashboard?range=7d|30d|3m|1y
 *     -> summary, enrollment_overview, courses_by_category, recent_activity,
 *        recent_courses, recent_enrollments, recent_payments
 *   GET /admin/courses?page&per_page&search&is_published
 *     -> Laravel paginator of every course (drafts included)
 *   GET /admin/certificates, GET /admin/reviews
 *     -> admin-only paginators used by the sidebar pages
 *
 * Nothing in this file hardcodes statistics. Missing values fall back to
 * zero/empty so the UI can render honest loading, empty and error states.
 */

const toNumber = (value) => {
  const parsed = Number(String(value ?? '').replace(/[^0-9.-]/g, ''))

  return Number.isFinite(parsed) ? parsed : 0
}

const unwrapList = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.data?.data)) return data.data.data

  return []
}

const unwrapPaginator = (data, fallbackPage = 1) => {
  const items = unwrapList(data)

  return {
    items,
    total: Number(data?.total ?? items.length),
    currentPage: Number(data?.current_page ?? fallbackPage),
    lastPage: Number(data?.last_page ?? 1),
    perPage: Number(data?.per_page ?? items.length),
  }
}

export const normalizeMediaUrl = (url) => {
  if (!url) return ''
  if (/^(https?:|blob:|data:)/i.test(url)) return url
  if (url.startsWith('/')) return `${BACKEND_URL}${url}`

  return url
}

export const normalizeAdminCourseRow = (course) => ({
  id: course?.id ?? null,
  title: course?.title ?? 'Untitled course',
  slug: course?.slug ?? '',
  thumbnail: normalizeMediaUrl(course?.thumbnail),
  category: course?.category?.name ?? course?.category ?? 'Uncategorized',
  categoryId: course?.category_id ?? course?.category?.id ?? null,
  instructor: course?.instructor?.name ?? course?.instructor ?? 'Unassigned',
  price: toNumber(course?.price),
  isPublished: Boolean(course?.is_published),
  status: course?.is_published ? 'Published' : 'Draft',
  createdAt: course?.created_at ?? null,
  updatedAt: course?.updated_at ?? null,
  raw: course ?? null,
})

const normalizeDashboardSummary = (summary) => ({
  totalCourses: Number(summary?.total_courses ?? 0),
  totalStudents: Number(summary?.total_students ?? 0),
  totalEnrollments: Number(summary?.total_enrollments ?? 0),
  totalRevenue: toNumber(summary?.total_revenue),
  currency: String(summary?.currency ?? 'USD').toUpperCase(),
  totalUsers: Number(summary?.total_users ?? 0),
  totalCategories: Number(summary?.total_categories ?? 0),
  totalLessons: Number(summary?.total_lessons ?? 0),
  totalQuizzes: Number(summary?.total_quizzes ?? 0),
  totalQuestions: Number(summary?.total_questions ?? 0),
  publishedCourses: Number(summary?.published_courses ?? 0),
  draftCourses: Number(summary?.draft_courses ?? 0),
  activeEnrollments: Number(summary?.active_enrollments ?? 0),
  completedEnrollments: Number(summary?.completed_enrollments ?? 0),
  successfulPayments: Number(summary?.successful_payments ?? 0),
  pendingPayments: Number(summary?.pending_payments ?? 0),
  failedPayments: Number(summary?.failed_payments ?? 0),
  coursesThisMonth: Number(summary?.courses_this_month ?? 0),
  courseGrowth: {
    currentMonth: Number(summary?.course_growth?.current_month ?? 0),
    previousMonth: Number(summary?.course_growth?.previous_month ?? 0),
    percentage: summary?.course_growth?.percentage === null
      || summary?.course_growth?.percentage === undefined
      ? null
      : Number(summary.course_growth.percentage),
  },
})

const normalizeEnrollmentRow = (enrollment) => ({
  id: enrollment?.id ?? null,
  userId: enrollment?.user_id ?? enrollment?.student?.id ?? null,
  courseId: enrollment?.course_id ?? enrollment?.course?.id ?? null,
  status: String(enrollment?.status ?? 'unknown').toLowerCase(),
  enrolledAt: enrollment?.enrolled_at ?? enrollment?.created_at ?? null,
  student: enrollment?.user ?? enrollment?.student ?? null,
  course: enrollment?.course ?? null,
})

const normalizeActivity = (activity) => ({
  id: String(activity?.id ?? ''),
  type: String(activity?.type ?? 'activity'),
  title: activity?.title ?? 'Activity',
  description: activity?.description ?? '',
  timestamp: activity?.timestamp ?? null,
})

export const getAdminDashboard = async ({ range = '30d' } = {}) => {
  const response = await apiRequest(`/admin/dashboard?range=${encodeURIComponent(range)}`)

  return {
    range: response?.range ?? range,
    summary: normalizeDashboardSummary(response?.summary),
    enrollmentOverview: (response?.enrollment_overview?.data ?? []).map((point) => ({
      label: point?.label ?? '',
      key: point?.key ?? point?.label ?? '',
      count: Number(point?.count ?? 0),
    })),
    enrollmentOverviewTotal: Number(response?.enrollment_overview?.total ?? 0),
    coursesByCategory: (response?.courses_by_category?.data ?? []).map((item) => ({
      id: item?.id ?? null,
      name: item?.name ?? 'Uncategorized',
      count: Number(item?.count ?? 0),
      percentage: Number(item?.percentage ?? 0),
    })),
    recentActivity: (response?.recent_activity ?? []).map(normalizeActivity),
    recentCourses: (response?.recent_courses ?? []).map(normalizeAdminCourseRow),
    recentEnrollments: (response?.recent_enrollments ?? []).map(normalizeEnrollmentRow),
    recentPayments: response?.recent_payments ?? [],
  }
}

export const getAdminCoursePage = async ({
  page = 1,
  perPage = 6,
  search = '',
  isPublished = '',
} = {}) => {
  const query = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
    sort_by: 'created_at',
    sort_order: 'desc',
  })

  if (search.trim()) query.set('search', search.trim())
  if (isPublished !== '') query.set('is_published', isPublished ? '1' : '0')

  const response = await apiRequest(`/admin/courses?${query.toString()}`)
  const pageData = unwrapPaginator(response, page)

  return {
    ...pageData,
    items: pageData.items.map(normalizeAdminCourseRow),
  }
}

export const getAdminCertificates = async ({ page = 1, perPage = 10, search = '' } = {}) => {
  const query = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  })

  if (search.trim()) query.set('search', search.trim())

  const response = await apiRequest(`/admin/certificates?${query.toString()}`)
  const pageData = unwrapPaginator(response, page)

  return {
    ...pageData,
    items: pageData.items.map((certificate) => ({
      id: certificate?.id ?? null,
      number: certificate?.certificate_number ?? '',
      issuedAt: certificate?.issued_at ?? null,
      downloadUrl: certificate?.download_url ?? '',
      verifyUrl: certificate?.verify_url ?? '',
      studentName: certificate?.student_name ?? certificate?.user?.name ?? 'Unknown student',
      course: certificate?.course ?? null,
    })),
  }
}

export const getAdminReviews = async ({ page = 1, perPage = 10, search = '', rating = '' } = {}) => {
  const query = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  })

  if (search.trim()) query.set('search', search.trim())
  if (rating !== '') query.set('rating', String(rating))

  const response = await apiRequest(`/admin/reviews?${query.toString()}`)
  const pageData = unwrapPaginator(response, page)

  return {
    ...pageData,
    items: pageData.items.map((review) => ({
      id: review?.id ?? null,
      rating: Number(review?.rating ?? 0),
      review: review?.review ?? '',
      studentName: review?.user?.name ?? 'Unknown student',
      course: review?.course ?? null,
      createdAt: review?.created_at ?? null,
    })),
  }
}

export const deleteAdminReview = async ({ courseId, reviewId }) => apiRequest(
  `/courses/${courseId}/reviews/${reviewId}`,
  { method: 'DELETE' },
)

export { normalizeEnrollmentRow, toNumber }
