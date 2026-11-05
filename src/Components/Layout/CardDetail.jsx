import { useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBookOpen,
  faCartShopping,
  faCertificate,
  faCheck,
  faChevronRight,
  faFileLines,
  faInfinity,
  faMedal,
  faPlay,
  faSpinner,
  faStar,
  faUsers,
  faVideo,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { getCourse, getCourses, getLessons, getMyCourses } from '../../lib/courseApi'
import { getCurrentUser, ApiError } from '../../lib/authApi'
import { createPayment } from '../../lib/paymentApi'
import { getEmbedVideoUrl, isVideoFile } from '../../lib/videoUtils'
import { addUnseenCartItem } from '../../lib/cartNotifications'
import TableCard from './TableCard'

const outcomes = []

const curriculum = []

const fallbackPreviewVideoUrl = ''

const reviews = []

const getCourseVideoUrl = (course) => course?.videoUrl || course?.raw?.video_url || course?.raw?.video || course?.raw?.preview_video || ''

const getSavedCourseVideos = () => {
  try {
    return JSON.parse(localStorage.getItem('course_video_urls') || '{}')
  } catch {
    return {}
  }
}

const getCourseVideoKeys = (course) => [
  course?.id,
  course?.slug || course?.raw?.slug,
  course?.title,
].filter(Boolean)

const getStoredCourseVideoUrl = (course) => {
  const videos = getSavedCourseVideos()

  return getCourseVideoUrl(course)
    || getCourseVideoKeys(course).map((key) => videos[key]).find(Boolean)
    || ''
}

const getNumericPrice = (price) => Number(String(price).replace(/[^0-9.]/g, '')) || 0

const isFreeCourse = (course) => (
  String(course?.price).toLowerCase() === 'free' || getNumericPrice(course?.price) === 0
)

const getFirstValue = (source, keys) => keys.map((key) => source?.[key]).find((value) => (
  value !== undefined && value !== null && value !== ''
))

const normalizeTextList = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean)
  if (typeof value !== 'string') return []

  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

const getCourseOutcomes = (course) => {
  const raw = course?.raw || {}
  const values = getFirstValue(raw, ['outcomes', 'learning_outcomes', 'objectives', 'what_you_will_learn'])
  const dynamicOutcomes = normalizeTextList(values)

  if (dynamicOutcomes.length > 0) return dynamicOutcomes
  if (course?.description) return [course.description]

  return outcomes
}

const getInstructorInfo = (course) => {
  const rawInstructor = course?.raw?.instructor || course?.raw?.teacher || course?.raw?.user

  if (rawInstructor && typeof rawInstructor === 'object') {
    return {
      name: rawInstructor.name || 'Course Instructor',
      role: rawInstructor.specialty || rawInstructor.title || rawInstructor.role || 'Instructor',
      bio: rawInstructor.bio || rawInstructor.description || 'Instructor information is not available yet.',
      avatar: rawInstructor.avatar || rawInstructor.photo || rawInstructor.profile_photo_url || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=85',
    }
  }

  return {
    name: course?.instructor || course?.raw?.instructor_name || 'Course Instructor',
    role: course?.category ? `${course.category} Instructor` : 'Instructor',
    bio: course?.raw?.instructor_bio || 'Instructor information is not available yet.',
    avatar: course?.raw?.instructor_avatar || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=85',
  }
}

const getDynamicIncludes = (course, lessons) => {
  const raw = course?.raw || {}
  const resourceCount = getFirstValue(raw, ['resources_count', 'downloadable_resources', 'downloads'])

  return [
    { icon: faVideo, text: `${lessons.length} lesson${lessons.length === 1 ? '' : 's'}${course?.duration ? ` - ${course.duration}` : ''}` },
    { icon: faFileLines, text: resourceCount ? `${resourceCount} downloadable resources` : 'Course learning materials' },
    { icon: faInfinity, text: 'Full lifetime access' },
    { icon: faCertificate, text: raw.certificate === false ? 'Certificate not included' : 'Certificate of completion' },
  ]
}

const getDynamicReviews = (course) => {
  const dynamicReviews = course?.raw?.reviews || course?.raw?.ratings

  if (!Array.isArray(dynamicReviews) || dynamicReviews.length === 0) return reviews

  return dynamicReviews.map((review, index) => ({
    name: review.user?.name || review.name || `Student ${index + 1}`,
    role: review.role || 'Student',
    avatar: review.user?.name?.slice(0, 2).toUpperCase() || review.name?.slice(0, 2).toUpperCase() || 'ST',
    text: review.comment || review.review || review.text || 'Great course.',
  }))
}

const isAuthError = (error) => {
  const message = error.message.toLowerCase()

  return message.includes('unauthenticated') || message.includes('unauthorized')
}

const getPurchaseErrorMessage = (error) => {
  if (error instanceof ApiError) {
    return error.message
  }

  return error.message || 'An unexpected error occurred. Please try again.'
}

const isSameUser = (item, user) => {
  if (!user) return false

  const itemUser = item.user_id || item.student_id || item.user?.id
  const itemEmail = item.user_email || item.student_email || item.user?.email

  return String(itemUser || '') === String(user.id || '')
    || String(itemEmail || '').toLowerCase() === String(user.email || '').toLowerCase()
}

const isPurchasedByUser = (course, user, purchases) => purchases.some((item) => {
  const itemCourseId = String(item.course_id || item.id || '').split('-')[0]
  const courseId = String(course?.id || '')

  return courseId && itemCourseId === courseId && isSameUser(item, user)
})

const canWatchCourse = (course, user, purchases) => {
  if (isFreeCourse(course)) return true
  if (!user) return false
  if (course?.raw?.has_access || course?.raw?.is_enrolled) return true

  return isPurchasedByUser(course, user, purchases)
}

const CardDetail = () => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [course, setCourse] = useState(null)
  const [courseItems, setCourseItems] = useState([])
  const [lessonItems, setLessonItems] = useState(curriculum)
  const [lessonVideoUrl, setLessonVideoUrl] = useState('')
  const [purchaseMessage, setPurchaseMessage] = useState('')
  const [purchaseError, setPurchaseError] = useState('')
  const [isBuying, setIsBuying] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [myCourses, setMyCourses] = useState([])
  const [purchasedCourses] = useState(() => (
    JSON.parse(localStorage.getItem('course_purchases') || '[]')
  ))
  const buyingRef = useRef(false)

  useEffect(() => {
    let isMounted = true

    getCurrentUser()
      .then((user) => {
        if (isMounted) {
          setCurrentUser(user)
        }
      })
      .catch(() => {
        if (isMounted) {
          setCurrentUser(null)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!currentUser) return undefined

    let isMounted = true

    getMyCourses()
      .then((enrolledCourses) => {
        if (isMounted) {
          setMyCourses(enrolledCourses)
        }
      })
      .catch(() => {
        if (isMounted) {
          setMyCourses([])
        }
      })

    return () => {
      isMounted = false
    }
  }, [currentUser])

  useEffect(() => {
    let isMounted = true
    const courseId = new URLSearchParams(window.location.search).get('course')

    Promise.allSettled([getCourses(), getLessons(), courseId ? getCourse(courseId) : Promise.resolve(null)])
      .then(([coursesResult, lessonsResult, courseDetailResult]) => {
        if (!isMounted) return
        const backendCourses = coursesResult.status === 'fulfilled' ? coursesResult.value : []
        const backendLessons = lessonsResult.status === 'fulfilled' ? lessonsResult.value : []
        const backendCourseDetail = courseDetailResult.status === 'fulfilled' ? courseDetailResult.value : null
        const listCourse = courseId
          ? backendCourses.find((item) => String(item.id) === String(courseId))
          : backendCourses[0]
        const backendCourse = backendCourseDetail || listCourse

        setCourseItems(backendCourses)

        if (backendCourse) {
          setCourse(backendCourse)
        }

        const filteredLessons = backendCourse?.id
          ? backendLessons.filter((lesson) => String(lesson.course_id) === String(backendCourse.id))
          : backendLessons

        if (filteredLessons.length > 0) {
          const previewLesson = filteredLessons.find((lesson) => lesson.video_url || lesson.video || lesson.preview_video)
          setLessonVideoUrl(previewLesson?.video_url || previewLesson?.video || previewLesson?.preview_video || '')
          setLessonItems(filteredLessons.map((lesson, index) => ({
            title: lesson.title || lesson.name || `Lesson ${index + 1}`,
            meta: lesson.duration || lesson.video_duration || lesson.type || 'Lesson',
          })))
        }
      })
      .catch(() => {
        if (isMounted) {
          setCourse(null)
          setCourseItems([])
          setLessonItems(curriculum)
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const detail = course || {
    title: 'Course not found',
    category: 'Course',
    description: 'Choose a course from the course list.',
    rating: '0.0',
    students: '0',
    price: '$0.00',
    image: '',
    videoUrl: fallbackPreviewVideoUrl,
  }
  const previewVideoUrl = getEmbedVideoUrl(getStoredCourseVideoUrl(detail) || lessonVideoUrl)
  const courseOutcomes = getCourseOutcomes(detail)
  const instructor = getInstructorInfo(detail)
  const courseIncludes = getDynamicIncludes(detail, lessonItems)
  const courseReviews = getDynamicReviews(detail)
  const oldPrice = getFirstValue(detail.raw || {}, ['old_price', 'compare_at_price', 'regular_price'])
  const discountPercent = oldPrice && getNumericPrice(oldPrice) > getNumericPrice(detail.price)
    ? Math.round(((getNumericPrice(oldPrice) - getNumericPrice(detail.price)) / getNumericPrice(oldPrice)) * 100)
    : 0
  const isCourseFree = isFreeCourse(detail)
  const activeMyCourses = currentUser ? myCourses : []
  const backendPurchases = activeMyCourses.map((course) => ({
    id: `${course.id}-${currentUser?.id || 'user'}`,
    user_id: currentUser?.id,
    course_id: course.id,
    title: course.title,
    category: course.category,
    amount: getNumericPrice(course.price),
    status: 'paid',
    is_backend: true,
  }))
  const derivedPurchases = [...backendPurchases, ...purchasedCourses]
  const hasUnlockedCourse = canWatchCourse(detail, currentUser, derivedPurchases)

  const requireLogin = () => {
    const redirectPath = encodeURIComponent(`${window.location.pathname}${window.location.search}`)
    window.location.href = `/login?redirect=${redirectPath}`
  }

  const getRequiredUser = async () => {
    try {
      const user = await getCurrentUser()
      setCurrentUser(user)

      return user
    } catch (error) {
      if (isAuthError(error)) {
        setCurrentUser(null)
        requireLogin()
        return null
      }

      throw error
    }
  }

  const handlePreviewCourse = async () => {
    setPurchaseError('')

    try {
      const user = await getRequiredUser()

      if (!user) return

      if (!canWatchCourse(detail, user, derivedPurchases)) {
        await handleBuyNow()
        return
      }

      setIsPreviewOpen(true)
    } catch (error) {
      setPurchaseError(getPurchaseErrorMessage(error))
    }
  }

  const handleAddToCart = async () => {
    if (!detail.id) {
      setPurchaseError('Please choose a backend course before adding to cart.')
      return
    }

    try {
      const user = await getCurrentUser()
      setCurrentUser(user)
      const cartItems = JSON.parse(localStorage.getItem('course_cart') || '[]')
      const cartId = `${detail.id}-${user?.id || user?.email || 'guest'}`
      const isNewCartItem = !cartItems.some((item) => item.id === cartId)
      const cartItem = {
        id: cartId,
        course_id: detail.id,
        title: detail.title,
        category: detail.category,
        price: detail.price,
        image: detail.image,
        videoUrl: canWatchCourse(detail, user, derivedPurchases) ? getStoredCourseVideoUrl(detail) : '',
        student_id: user?.id,
        student_name: user?.name || 'Student',
        student_email: user?.email || 'No email',
        added_at: new Date().toISOString(),
      }
      const nextCartItems = [
        cartItem,
        ...cartItems.filter((item) => item.id !== cartId),
      ]

      localStorage.setItem('course_cart', JSON.stringify(nextCartItems))
      if (isNewCartItem) {
        addUnseenCartItem(user)
      }
      setPurchaseError('')
      setPurchaseMessage('Course added to cart.')
    } catch (error) {
      if (isAuthError(error)) {
        requireLogin()
        return
      }

      setPurchaseError(getPurchaseErrorMessage(error))
    }
  }

  const handleBuyNow = async () => {
    if (!detail.id) {
      setPurchaseError('Please choose a backend course before buying.')
      return
    }

    if (buyingRef.current) return

    buyingRef.current = true
    setIsBuying(true)
    setPurchaseError('')
    setPurchaseMessage('')

    try {
      const user = await getRequiredUser()
      if (!user) return

      const alreadyEnrolled = canWatchCourse(detail, user, derivedPurchases)

      if (alreadyEnrolled && !isFreeCourse(detail)) {
        setPurchaseMessage('Course unlocked. You can watch the video now.')
        setIsPreviewOpen(true)
        return
      }

      const payment = await createPayment(detail.id)

      if (payment.status === 'paid') {
        setPurchaseMessage('Course unlocked. You can watch the video now.')
        setIsPreviewOpen(true)
        return
      }

      if (!payment.id) {
        throw new Error('A payment was created but no payment id was returned by the backend.')
      }

      sessionStorage.setItem(`payment_draft_${payment.id}`, JSON.stringify({
        ...payment,
        courseTitle: detail.title || payment.courseTitle || '',
        paidLabel: detail.price || '',
      }))
      window.location.href = `/payment/${payment.id}`
    } catch (error) {
      if (isAuthError(error)) {
        requireLogin()
        return
      }

      setPurchaseError(getPurchaseErrorMessage(error))
    } finally {
      buyingRef.current = false
      setIsBuying(false)
    }
  }

  const handleWatchCourse = async (selectedCourse) => {
    setPurchaseError('')

    try {
      const user = await getRequiredUser()

      if (!user) return

      if (!canWatchCourse(selectedCourse, user, derivedPurchases)) {
        setCourse(selectedCourse)
        setIsBuying(true)
        const payment = await createPayment(selectedCourse.id)
        if (payment.status === 'paid') {
          setIsPreviewOpen(true)
          return
        }
        sessionStorage.setItem(`payment_draft_${payment.id}`, JSON.stringify({
          ...payment,
          courseTitle: selectedCourse.title || payment.courseTitle || '',
          paidLabel: selectedCourse.price || '',
        }))
        window.location.href = `/payment/${payment.id}`
        return
      }

      setCourse(selectedCourse)
      setIsPreviewOpen(true)
    } catch (error) {
      setPurchaseError(getPurchaseErrorMessage(error))
    }
  }

  if (isLoading && !course) {
    return (
      <main className="grid min-h-[60vh] place-items-center bg-[#f7f8ff] text-slate-950">
        <div className="flex flex-col items-center gap-4">
          <FontAwesomeIcon className="animate-spin text-3xl text-[#4b3ff0]" icon={faSpinner} />
          <p className="text-sm font-semibold text-slate-500">Loading course details...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="bg-[#f7f8ff] text-slate-950">
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_390px] lg:px-8">
        <div>
          <span className="inline-flex rounded-full bg-[#4b3ff0] px-4 py-2 text-sm font-bold uppercase text-white">
            {detail.category}
          </span>
          <h1 className="mt-6 text-3xl font-black leading-tight tracking-tight sm:text-4xl">
            {detail.title}
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-slate-700">
            {detail.description}
          </p>

          <div className="mt-7 flex flex-wrap gap-6 text-sm text-slate-700">
            <span className="inline-flex items-center gap-2">
              <FontAwesomeIcon className="text-amber-500" icon={faStar} />
              {detail.rating} rating
            </span>
            <span className="inline-flex items-center gap-2">
              <FontAwesomeIcon className="text-[#302be2]" icon={faUsers} />
              {detail.students} Students enrolled
            </span>
          </div>

          <section className="mt-10 rounded-xl border border-slate-300 bg-white p-7 shadow-sm sm:p-10">
            <h2 className="font-semibold">About this course</h2>
            <div className="mt-7 grid gap-6 md:grid-cols-2">
              {courseOutcomes.map((item) => (
                <div className="flex gap-4" key={item}>
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#302be2] text-[10px] text-white">
                    <FontAwesomeIcon icon={faCheck} />
                  </span>
                  <p className="text-sm leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-14">
            <h2 className="font-semibold">Curriculum</h2>
            <div className="mt-6 grid gap-4">
              {lessonItems.map((item, index) => (
                <article
                  className="flex items-center justify-between gap-4 rounded-xl border border-slate-300 bg-white p-5 shadow-sm"
                  key={item.title}
                >
                  <div className="flex items-center gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#dfe8ff] font-black text-[#302be2]">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        {item.meta}
                      </p>
                    </div>
                  </div>
                  <FontAwesomeIcon className="text-slate-800" icon={faChevronRight} />
                </article>
              ))}
            </div>
          </section>

          <section className="mt-14">
            <h2 className="font-semibold">Instructor</h2>
            <article className="mt-6 rounded-xl border border-slate-300 bg-[#edf3ff] p-7 shadow-sm sm:flex sm:gap-8">
              <img
                className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-lg"
                src={instructor.avatar}
                alt={instructor.name}
              />
              <div className="mt-5 sm:mt-0">
                <h3 className="font-semibold">{instructor.name}</h3>
                <p className="mt-1 text-sm font-medium text-[#302be2]">
                  {instructor.role}
                </p>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-700">
                  {instructor.bio}
                </p>
                <div className="mt-5 flex flex-wrap gap-5 text-sm text-slate-700">
                  <span className="inline-flex items-center gap-2">
                    <FontAwesomeIcon icon={faUsers} />
                    {detail.students} Students
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <FontAwesomeIcon icon={faBookOpen} />
                    {lessonItems.length} Lessons
                  </span>
                </div>
              </div>
            </article>
          </section>

          <section className="mt-14">
            <h2 className="font-semibold">Reviews</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {courseReviews.map((review) => (
                <article className="rounded-xl border border-slate-300 bg-white p-7 shadow-sm" key={review.name}>
                  <div className="flex gap-1 text-amber-500">
                    {Array.from({ length: 5 }, (_, index) => (
                      <FontAwesomeIcon icon={faStar} key={index} />
                    ))}
                  </div>
                  <p className="mt-5 text-sm leading-7 text-slate-800">"{review.text}"</p>
                  <div className="mt-6 flex items-center gap-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-300 font-semibold text-[#064f60]">
                      {review.avatar}
                    </span>
                    <div>
                      <h3 className="font-semibold">{review.name}</h3>
                      <p className="text-sm text-slate-600">{review.role}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <article className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-2xl shadow-slate-300/60">
            <div className="relative">
              <img
                className="h-56 w-full object-cover"
                src={detail.image}
                alt={detail.title}
              />
              <button
                className="absolute inset-0 flex items-center justify-center bg-slate-950/30"
                type="button"
                aria-label="Preview course video"
                onClick={handlePreviewCourse}
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/80 text-xl text-[#302be2] shadow-xl backdrop-blur transition hover:scale-105 hover:bg-white">
                  <FontAwesomeIcon icon={faPlay} />
                </span>
              </button>
              <span className="absolute bottom-4 left-4 rounded bg-slate-950 px-3 py-1.5 text-[10px] font-black uppercase text-white">
                Preview Course
              </span>
            </div>

            <div className="p-8">
              <div className="flex items-center gap-3">
                <span className="text-xl font-semibold">{detail.price}</span>
                {oldPrice && <span className="text-sm text-slate-500 line-through">{String(oldPrice).startsWith('$') ? oldPrice : `$${oldPrice}`}</span>}
                {discountPercent > 0 && <span className="ml-auto text-sm font-black text-red-600">{discountPercent}% OFF</span>}
              </div>

              <div className="mt-8 grid gap-4">
                {purchaseError && (
                  <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {purchaseError}
                  </p>
                )}
                {purchaseMessage && (
                  <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                    {purchaseMessage}
                  </p>
                )}
                <button
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-[#302be2] text-sm font-black text-white transition hover:bg-[#1916b8] disabled:cursor-not-allowed disabled:bg-slate-400"
                  disabled={isBuying}
                  onClick={handleBuyNow}
                  type="button"
                >
                  {isBuying ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin />
                      Creating payment...
                    </>
                  ) : hasUnlockedCourse || isCourseFree ? (
                    'Watch Now'
                  ) : (
                    'Buy Now'
                  )}
                </button>
                <button className="inline-flex h-14 items-center justify-center gap-2 rounded-lg border-2 border-[#302be2] bg-white text-sm font-black text-[#302be2] transition hover:bg-[#edf0ff]" onClick={handleAddToCart} type="button">
                  <FontAwesomeIcon icon={faCartShopping} />
                  Add to Cart
                </button>
              </div>

              <div className="mt-8 border-t border-slate-300 pt-8">
                <h2 className="font-semibold">This course includes:</h2>
                <div className="mt-5 grid gap-4">
                  {courseIncludes.map((item) => (
                    <div className="flex items-center gap-3 text-sm text-slate-700" key={item.text}>
                      <FontAwesomeIcon className="w-5 text-[#302be2]" icon={item.icon} />
                      {item.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>
          <p className="mt-6 text-center text-sm text-slate-600">
            <FontAwesomeIcon className="mr-2" icon={faMedal} />
            30-Day Money-Back Guarantee
          </p>
        </aside>
      </section>

      <TableCard courses={courseItems} purchases={derivedPurchases} isAuthenticated={Boolean(currentUser)} currentUser={currentUser} onWatchCourse={handleWatchCourse} />

      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 p-4">
          <button
            className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-xl text-white transition hover:bg-white/20"
            type="button"
            aria-label="Close preview video"
            onClick={() => setIsPreviewOpen(false)}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
          {!previewVideoUrl ? (
            <div className="grid w-full max-w-2xl justify-items-center gap-3 rounded-xl bg-slate-900 px-6 py-16 text-center text-white">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl">
                <FontAwesomeIcon icon={faVideo} />
              </span>
              <h2 className="text-xl font-black">No video URL found</h2>
              <p className="max-w-md text-sm text-slate-300">
                Add a YouTube URL to this course in the database field `video_url`, `video`, or `preview_video`.
              </p>
            </div>
          ) : isVideoFile(previewVideoUrl) ? (
            <video
              autoPlay
              className="h-[min(72vw,82vh)] w-full max-w-6xl rounded-xl bg-black shadow-2xl"
              controls
              src={previewVideoUrl}
              title={`${detail.title} preview video`}
            />
          ) : (
            <iframe
              className="h-[min(72vw,82vh)] w-full max-w-6xl rounded-xl bg-black shadow-2xl"
              src={previewVideoUrl}
              title={`${detail.title} preview video`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          )}
        </div>
      )}
    </main>
  )
}

export default CardDetail
