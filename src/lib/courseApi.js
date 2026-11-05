import { BACKEND_URL, apiBlobRequest, apiRequest } from './authApi'

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
      throw new Error(missingCategoryWriteRouteMessage, { cause: error })
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
      throw new Error(missingCategoryWriteRouteMessage, { cause: error })
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
      throw new Error(missingCategoryWriteRouteMessage, { cause: error })
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

export const formatCoursePrice = (course) => formatPrice(course)

export const normalizeLesson = (lesson) => ({
  id: lesson.id ?? null,
  courseId: lesson.course_id ?? null,
  title: lesson.title || lesson.name || 'Untitled lesson',
  description: lesson.description || lesson.content || lesson.summary || '',
  videoUrl: normalizeMediaUrl(
    lesson.video_url || lesson.video || lesson.preview_video || lesson.videoUrl || '',
  ),
  duration: lesson.duration || lesson.video_duration || '',
  type: lesson.type || 'lesson',
  order: Number(lesson.order ?? lesson.position ?? lesson.sort_order ?? lesson.id ?? 0),
  raw: lesson,
})

export const getLessonsForCourse = async (courseId) => {
  const lessons = unwrapList(await apiRequest('/lessons'))

  return (courseId
    ? lessons.filter((lesson) => String(lesson.course_id) === String(courseId))
    : lessons
  ).map(normalizeLesson)
}

export const normalizeAdminLesson = (lesson) => ({
  ...normalizeLesson(lesson),
  content: lesson.content || '',
  isPreview: Boolean(lesson.is_preview),
  courseName: getCategoryName(lesson.course),
  courseSlug: lesson.course?.slug || '',
  quizzesCount: Number(lesson.quizzes_count ?? lesson.quizzes?.length ?? 0),
})

export const getAdminLessons = async ({ page = 1, perPage = 10, search = '', courseId = '' } = {}) => {
  const query = new URLSearchParams({ page: String(page), per_page: String(perPage) })

  if (search) query.set('search', search)
  if (courseId) query.set('course_id', courseId)

  const response = await apiRequest(`/admin/lessons?${query.toString()}`)

  return {
    items: unwrapList(response).map(normalizeAdminLesson),
    total: response?.total ?? unwrapList(response).length,
    currentPage: Number(response?.current_page ?? page),
    lastPage: Number(response?.last_page ?? 1),
    perPage: Number(response?.per_page ?? perPage),
  }
}

export const createLesson = async (lesson) => normalizeAdminLesson(
  unwrapItem(await apiRequest('/admin/lessons', {
    method: 'POST',
    body: getRequestBody(lesson),
  })),
)

export const updateLesson = async (id, lesson) => normalizeAdminLesson(
  unwrapItem(await apiRequest(`/admin/lessons/${id}`, {
    method: 'PUT',
    body: getRequestBody(lesson),
  })),
)

export const deleteLesson = async (id) => apiRequest(`/admin/lessons/${id}`, {
  method: 'DELETE',
})

export const normalizeQuiz = (quiz) => ({
  id: quiz.id ?? null,
  courseId: quiz.course_id ?? quiz.lesson?.course_id ?? quiz.lesson?.course?.id ?? null,
  lessonId: quiz.lesson_id ?? null,
  title: quiz.title || quiz.name || 'Untitled quiz',
  description: quiz.description || quiz.instructions || '',
  passingScore: Number(quiz.passing_score ?? 60),
  maxAttempts: Number(quiz.max_attempts ?? 0),
  questionsCount: Number(quiz.questions_count ?? quiz.questions?.length ?? 0),
  isRequired: Boolean(quiz.is_required),
  isPublished: quiz.is_published !== false,
  raw: quiz,
})

export const getQuizzesForCourse = async (courseId) => {
  const path = courseId ? `/quizzes?course_id=${encodeURIComponent(courseId)}` : '/quizzes'
  const quizzes = unwrapList(await apiRequest(path))

  return quizzes.map(normalizeQuiz)
}

export const normalizeCourseQuiz = (quiz) => ({
  id: quiz.id ?? null,
  title: quiz.title || 'Untitled quiz',
  description: quiz.description || '',
  passingScore: Number(quiz.passing_score ?? 60),
  maxAttempts: Number(quiz.max_attempts ?? 0),
  isRequired: Boolean(quiz.is_required),
  questionsCount: Number(quiz.questions_count ?? 0),
  attemptsUsed: Number(quiz.attempts_used ?? 0),
  bestScore: quiz.best_score === null || quiz.best_score === undefined ? null : Number(quiz.best_score),
  passed: Boolean(quiz.passed),
  canAttempt: Boolean(quiz.can_attempt),
  lastAttempt: quiz.last_attempt ? {
    attemptNumber: Number(quiz.last_attempt.attempt_number ?? 0),
    score: Number(quiz.last_attempt.score ?? 0),
    passed: Boolean(quiz.last_attempt.passed),
    submittedAt: quiz.last_attempt.submitted_at ?? null,
  } : null,
})

export const normalizeCourseProgress = (progress) => ({
  ...progress,
  totalLessons: Number(progress?.total_lessons ?? 0),
  completedLessons: Number(progress?.completed_lessons ?? 0),
  progress: Number(progress?.progress ?? 0),
  isComplete: Boolean(progress?.is_complete),
  lessons: (Array.isArray(progress?.lessons) ? progress.lessons : []).map((lesson) => ({
    ...lesson,
    quizzes: (Array.isArray(lesson?.quizzes) ? lesson.quizzes : []).map(normalizeCourseQuiz),
  })),
  quizzes: {
    requiredTotal: Number(progress?.quizzes?.required_total ?? 0),
    requiredPassed: Number(progress?.quizzes?.required_passed ?? 0),
    satisfied: Boolean(progress?.quizzes?.satisfied),
  },
  certificate: {
    eligible: Boolean(progress?.certificate?.eligible),
    reason: progress?.certificate?.reason ?? null,
  },
})

export const getCourseProgress = async (courseId) => normalizeCourseProgress(
  unwrapItem(await apiRequest(`/courses/${courseId}/progress`)),
)

export const markLessonComplete = async (lessonId) => unwrapItem(
  await apiRequest(`/lessons/${lessonId}/progress`, { method: 'POST' }),
)

export const unmarkLessonComplete = async (lessonId) => unwrapItem(
  await apiRequest(`/lessons/${lessonId}/progress`, { method: 'DELETE' }),
)

export const normalizeQuestion = (question) => {
  let options = question.options

  if (typeof options === 'string') {
    try {
      options = JSON.parse(options)
    } catch {
      options = null
    }
  }

  if (!Array.isArray(options)) {
    options = ['a', 'b', 'c', 'd', 'e']
      .map((letter) => question[`option_${letter}`] ?? question[`option_${letter.toUpperCase()}`])
      .filter(Boolean)
      .map((text) => ({ text }))
  }

  const rawCorrect = question.correct_option ?? question.correct_answer ?? question.answer
  const correctLetter = String(rawCorrect ?? '').toLowerCase().replace(/^option_/, '')
  const correctIndex = ['a', 'b', 'c', 'd'].includes(correctLetter) ? correctLetter : ''

  return {
    id: question.id ?? null,
    quizId: question.quiz_id ?? null,
    text: question.question || question.text || question.title || 'Untitled question',
    type: question.type || 'multiple_choice',
    options: options.map((option) => (
      typeof option === 'string' ? { text: option } : { text: option?.text ?? option?.value ?? '' }
    )),
    correctAnswer: correctIndex,
    points: Number(question.points ?? 1),
    explanation: question.explanation || '',
    order: Number(question.order ?? 0),
    raw: question,
  }
}

export const getQuestionsForQuiz = async (quizId) => {
  const path = quizId ? `/questions?quiz_id=${encodeURIComponent(quizId)}` : '/questions'
  const questions = unwrapList(await apiRequest(path))

  return questions.map(normalizeQuestion)
}

export const normalizeQuizAttempt = (attempt) => {
  const data = attempt?.attempt && typeof attempt.attempt === 'object' ? attempt.attempt : attempt
  const attemptAnswers = Array.isArray(data?.answers) ? data.answers : []
  const answersByQuestion = {}

  attemptAnswers.forEach((answer) => {
    if (answer?.question_id === undefined || answer?.question_id === null) return

    answersByQuestion[answer.question_id] = {
      selectedOption: answer.selected_option ?? null,
      correctOption: answer.question?.correct_option ?? null,
      isCorrect: Boolean(answer.is_correct),
      raw: answer,
    }
  })

  return {
    id: data?.id ?? null,
    score: Number(data?.score ?? 0),
    passed: Boolean(data?.passed),
    correctAnswers: Number(data?.correct_answers ?? 0),
    totalQuestions: Number(data?.total_questions ?? attemptAnswers.length),
    attemptNumber: Number(data?.attempt_number ?? 0),
    submittedAt: data?.submitted_at ?? null,
    answersByQuestion,
    raw: data,
  }
}

export const submitQuizAttempt = async (quizId, answers) => normalizeQuizAttempt(
  unwrapItem(await apiRequest(`/quizzes/${quizId}/attempts`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  })),
)

export const getQuizAttempts = async (quizId) => unwrapList(
  await apiRequest(`/quizzes/${quizId}/attempts`),
).map(normalizeQuizAttempt)

export const normalizeMyCourse = (item) => {
  const course = item?.course && typeof item.course === 'object' ? item.course : item

  return {
    ...normalizeCourse(course),
    enrollment: item?.pivot || item?.enrollment || item,
  }
}

export const getMyCourses = async () => unwrapList(await apiRequest('/my/courses')).map(normalizeMyCourse)

export const normalizeCertificate = (certificate) => ({
  id: certificate?.id ?? null,
  certificateNumber: certificate?.certificate_number ?? '',
  issuedAt: certificate?.issued_at ?? null,
  viewUrl: certificate?.view_url ?? certificate?.download_url ?? '',
  downloadUrl: certificate?.download_url ?? '',
  verifyUrl: certificate?.verify_url ?? '',
  courseId: certificate?.course?.id ?? null,
  courseTitle: certificate?.course?.title ?? '',
  courseInstructor: certificate?.course?.instructor ?? '',
  courseCategory: certificate?.course?.category ?? '',
  studentName: certificate?.student_name ?? '',
  raw: certificate,
})

export const getCertificates = async ({ perPage = 60 } = {}) => unwrapList(
  await apiRequest(`/certificates?per_page=${encodeURIComponent(perPage)}`),
).map(normalizeCertificate)

export const getCertificate = async (id) => normalizeCertificate(
  unwrapItem(await apiRequest(`/certificates/${encodeURIComponent(id)}`)),
)

export const fetchCertificatePdf = async (id, { inline = false } = {}) => apiBlobRequest(
  `/certificates/${encodeURIComponent(id)}/${inline ? 'view' : 'download'}`,
)

export const downloadCertificatePdf = async (id) => {
  const { blob, filename } = await fetchCertificatePdf(id)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename || `certificate-${id}.pdf`
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const claimCertificate = async (courseId) => normalizeCertificate(unwrapItem(
  await apiRequest('/certificates', {
    method: 'POST',
    body: JSON.stringify({ course_id: courseId }),
  }),
))

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
