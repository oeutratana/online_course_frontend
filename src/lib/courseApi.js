import { BACKEND_URL, apiRequest } from './authApi'

const fallbackImage =
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=85'

const unwrapList = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.data?.data)) return data.data.data
  if (Array.isArray(data?.items)) return data.items

  return []
}

const unwrapItem = (data) => data?.data || data

const isUnsupportedMethodError = (error) => {
  const message = error.message.toLowerCase()

  return message.includes('method is not supported') || message.includes('supported methods')
}

const missingCategoryWriteRouteMessage =
  'Category was not saved to database because the backend is missing POST/PUT/DELETE routes for /api/categories.'

const formatPrice = (course) => {
  const rawPrice = course.price ?? course.cost ?? course.amount
  const numericPrice = Number(String(rawPrice ?? '').replace(/[^0-9.]/g, ''))
  const isFree = course.is_free || rawPrice === 0 || rawPrice === '0' || rawPrice === null || numericPrice === 0

  if (isFree) return 'Free'
  if (!rawPrice) return '$0.00'
  if (String(rawPrice).startsWith('$')) return String(rawPrice)

  return `$${Number(rawPrice).toFixed(2)}`
}

const getCategoryName = (category) => {
  if (!category) return 'General'
  if (typeof category === 'string') return category

  return category.name || category.title || 'General'
}

const normalizeMediaUrl = (url) => {
  if (!url) return ''
  if (/^(https?:|blob:|data:)/i.test(url)) return url
  if (url.startsWith('/')) return `${BACKEND_URL}${url}`

  return url
}

export const normalizeCategory = (category) => ({
  id: category.id,
  slug: category.slug,
  name: category.name || category.title || `Category ${category.id}`,
  description: category.description || '',
  raw: category,
})

export const normalizeCourse = (course) => {
  const category = getCategoryName(course.category)
  const instructor = course.instructor?.name || course.teacher?.name || course.user?.name || course.instructor || 'Online Course'
  const students = course.students_count || course.enrollments_count || course.students || 0
  const duration = course.duration || course.total_duration || course.hours || '0h'
  const rating = course.rating || course.average_rating || '0.0'
  const image = normalizeMediaUrl(course.image || course.thumbnail || course.cover_image || course.photo) || fallbackImage
  const videoUrl = normalizeMediaUrl(course.video_url || course.video || course.preview_video || course.lesson_video)

  return {
    id: course.id,
    categoryId: course.category_id,
    title: course.title || course.name || 'Untitled course',
    instructor,
    category,
    difficulty: course.difficulty || course.level || 'Beginner',
    paid: formatPrice(course) === 'Free' ? 'Free' : 'Paid',
    badgeClass: 'bg-[#4137e8] text-white',
    rating: String(rating),
    students: Number(students).toLocaleString(),
    duration: String(duration),
    price: formatPrice(course),
    image,
    videoUrl,
    description: course.description || course.short_description || course.summary || '',
    raw: course,
  }
}

export const getCategories = async () => {
  return unwrapList(await apiRequest('/categories')).map(normalizeCategory)
}

export const getCategory = async (id) => normalizeCategory(unwrapItem(await apiRequest(`/categories/${id}`)))

export const createCategory = async (category) => {
  try {
    return normalizeCategory(unwrapItem(await apiRequest('/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    })))
  } catch (error) {
    if (isUnsupportedMethodError(error)) {
      throw new Error(missingCategoryWriteRouteMessage)
    }

    throw error
  }
}

export const updateCategory = async (id, category) => {
  try {
    return normalizeCategory(unwrapItem(await apiRequest(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    })))
  } catch (error) {
    if (isUnsupportedMethodError(error)) {
      throw new Error(missingCategoryWriteRouteMessage)
    }

    throw error
  }
}

export const deleteCategory = async (id) => {
  try {
    return await apiRequest(`/categories/${id}`, {
      method: 'DELETE',
    })
  } catch (error) {
    if (isUnsupportedMethodError(error)) {
      throw new Error(missingCategoryWriteRouteMessage)
    }

    throw error
  }
}

export const getCourses = async () => unwrapList(await apiRequest('/courses')).map(normalizeCourse)

export const getCourse = async (id) => normalizeCourse(unwrapItem(await apiRequest(`/courses/${id}`)))

const getRequestBody = (data) => data instanceof FormData ? data : JSON.stringify(data)

export const createCourse = async (course) => normalizeCourse(unwrapItem(await apiRequest('/courses', {
  method: 'POST',
  body: getRequestBody(course),
})))

export const updateCourse = async (id, course) => {
  if (course instanceof FormData) {
    course.append('_method', 'PUT')

    return normalizeCourse(unwrapItem(await apiRequest(`/courses/${id}`, {
      method: 'POST',
      body: course,
    })))
  }

  return normalizeCourse(unwrapItem(await apiRequest(`/courses/${id}`, {
    method: 'PUT',
    body: getRequestBody(course),
  })))
}

export const deleteCourse = async (id) => apiRequest(`/courses/${id}`, {
  method: 'DELETE',
})

export const getLessons = async () => unwrapList(await apiRequest('/lessons'))

export const getLesson = async (id) => unwrapItem(await apiRequest(`/lessons/${id}`))

export const getQuizzes = async () => unwrapList(await apiRequest('/quizzes'))

export const getQuiz = async (id) => unwrapItem(await apiRequest(`/quizzes/${id}`))

export const getQuestions = async () => unwrapList(await apiRequest('/questions'))

export const getQuestion = async (id) => unwrapItem(await apiRequest(`/questions/${id}`))

export const getUsers = async () => unwrapList(await apiRequest('/users'))

export const getUser = async (id) => unwrapItem(await apiRequest(`/users/${id}`))

export const getEnrollments = async () => unwrapList(await apiRequest('/enrollments'))

export const getEnrollment = async (id) => unwrapItem(await apiRequest(`/enrollments/${id}`))

export const createEnrollment = async (enrollment) => unwrapItem(await apiRequest('/enrollments', {
  method: 'POST',
  body: JSON.stringify(enrollment),
}))

export const getLessonProgress = async () => unwrapList(await apiRequest('/lesson-progress'))

export const getLessonProgressItem = async (id) => unwrapItem(await apiRequest(`/lesson-progress/${id}`))

export const getPayments = async () => unwrapList(await apiRequest('/payments'))

export const getPayment = async (id) => unwrapItem(await apiRequest(`/payments/${id}`))

export const createPayment = async (payment) => unwrapItem(await apiRequest('/payments', {
  method: 'POST',
  body: JSON.stringify(payment),
}))
