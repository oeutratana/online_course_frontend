import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBookOpen,
  faCartShopping,
  faCertificate,
  faCheck,
  faChevronRight,
  faClock,
  faFileLines,
  faInfinity,
  faMedal,
  faPlay,
  faQrcode,
  faStar,
  faUsers,
  faVideo,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { createEnrollment, getCourse, getCourses, getLessons } from '../../lib/courseApi'
import { getCurrentUser } from '../../lib/authApi'
import { createBakongPayment, verifyBakongPayment } from '../../lib/bakongApi'
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

const getEmbedVideoUrl = (url) => {
  if (!url) return fallbackPreviewVideoUrl

  if (url.includes('youtube.com/embed/')) {
    return `${url}${url.includes('?') ? '&' : '?'}autoplay=1&rel=0`
  }

  if (url.includes('youtube.com/watch')) {
    const videoId = new URL(url).searchParams.get('v')
    return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0` : fallbackPreviewVideoUrl
  }

  if (url.includes('youtube.com/shorts/')) {
    return `https://www.youtube-nocookie.com/embed/${url.split('/shorts/')[1].split('?')[0]}?autoplay=1&rel=0`
  }

  if (url.includes('youtu.be/')) {
    return `https://www.youtube-nocookie.com/embed/${url.split('youtu.be/')[1].split('?')[0]}?autoplay=1&rel=0`
  }

  return url
}

const isVideoFile = (url) => /\.(mp4|webm|ogg|mov|avi)(\?.*)?$/i.test(url)

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

const isUnsupportedMethodError = (error) => {
  const message = error.message.toLowerCase()

  return message.includes('method is not supported') || message.includes('supported methods')
}

const isAuthError = (error) => {
  const message = error.message.toLowerCase()

  return message.includes('unauthenticated') || message.includes('unauthorized')
}

const getPurchaseErrorMessage = (error) => {
  if (error.message.includes('Bakong QR generation failed')) {
    return 'Bakong QR generation failed. The backend Bakong API base URL is not responding correctly. Please check BAKONG_API_BASE_URL and your Bakong merchant account settings.'
  }

  return error.message
}

const saveLocalPurchase = (course, user, amount) => {
  const purchases = JSON.parse(localStorage.getItem('course_purchases') || '[]')
  const purchase = {
    id: `${course.id}-${user?.id || 'guest'}`,
    user_id: user?.id,
    course_id: course.id,
    title: course.title,
    category: course.category,
    image: course.image,
    videoUrl: getStoredCourseVideoUrl(course),
    amount,
    status: amount > 0 ? 'paid' : 'free',
    purchased_at: new Date().toISOString(),
  }
  const nextPurchases = [
    purchase,
    ...purchases.filter((item) => item.id !== purchase.id),
  ]

  localStorage.setItem('course_purchases', JSON.stringify(nextPurchases))

  return nextPurchases
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

const isPaidPayment = (payment) => {
  const status = String(payment?.status || payment?.payment?.status || '').toLowerCase()
  const responseCode = payment?.responseCode ?? payment?.data?.responseCode

  return status === 'paid'
    || status === 'success'
    || status === 'completed'
    || responseCode === 0
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
  const [isConfirmingBakong, setIsConfirmingBakong] = useState(false)
  const [bakongPayment, setBakongPayment] = useState(null)
  const [receipt, setReceipt] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [purchasedCourses, setPurchasedCourses] = useState(() => (
    JSON.parse(localStorage.getItem('course_purchases') || '[]')
  ))

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
  const hasUnlockedCourse = canWatchCourse(detail, currentUser, purchasedCourses)

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

      if (!canWatchCourse(detail, user, purchasedCourses)) {
        setPurchaseError('Please buy this course before watching the video.')
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
        videoUrl: canWatchCourse(detail, user, purchasedCourses) ? getStoredCourseVideoUrl(detail) : '',
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

    setIsBuying(true)
    setPurchaseError('')
    setPurchaseMessage('')

    try {
      const user = await getRequiredUser()
      if (!user) return

      const amount = getNumericPrice(detail.price)

      if (canWatchCourse(detail, user, purchasedCourses)) {
        setPurchaseMessage('Course unlocked. You can watch the video now.')
        setIsPreviewOpen(true)
        return
      }

      if (isCourseFree) {
        const nextPurchases = saveLocalPurchase(detail, user, amount)
        setPurchasedCourses(nextPurchases)
        setPurchaseMessage('Free course unlocked. You can watch the video now.')
        setIsPreviewOpen(true)
        return
      }

      const payment = await createBakongPayment({
        user_id: user.id,
        user_email: user.email,
        course_id: detail.id,
        course_title: detail.title,
        amount,
        currency: 'USD',
        description: `Online Course - ${detail.title}`,
      })

      if (isPaidPayment(payment)) {
        const nextPurchases = saveLocalPurchase(detail, user, amount)
        setPurchasedCourses(nextPurchases)
        setPurchaseMessage('Course unlocked. You can watch the video now.')
        setIsPreviewOpen(true)
        return
      }

      if (!payment.qrImage && !payment.qrText) {
        throw new Error('Bakong payment was created but no KHQR code was returned by the backend.')
      }

      setBakongPayment(payment)
      setPurchaseMessage('Scan the Bakong KHQR code to pay for this course.')
    } catch (error) {
      if (isAuthError(error)) {
        requireLogin()
        return
      }

      setPurchaseError(getPurchaseErrorMessage(error))
    } finally {
      setIsBuying(false)
    }
  }

  const completePaidPurchase = async (verifiedPayment = null) => {
    const user = currentUser || await getRequiredUser()
    if (!user) return

    const amount = getNumericPrice(detail.price)
    const nextPurchases = saveLocalPurchase(detail, user, amount)

    setPurchasedCourses(nextPurchases)
    setBakongPayment(null)
    setPurchaseMessage('Purchase complete. You are enrolled in this course.')
    setReceipt({
      title: detail.title,
      amount,
      paymentId: verifiedPayment?.id || verifiedPayment?.payment?.id || bakongPayment?.id || '',
      md5: verifiedPayment?.md5 || verifiedPayment?.payment?.bakong_md5 || bakongPayment?.md5 || '',
      paidAt: new Date().toISOString(),
    })

    createEnrollment({
      user_id: user.id,
      course_id: detail.id,
      enrolled_at: new Date().toISOString(),
      status: 'active',
    }).catch((enrollmentError) => {
        if (!isUnsupportedMethodError(enrollmentError)) {
          setPurchaseError(getPurchaseErrorMessage(enrollmentError))
        }
    })
  }

  const handleConfirmBakongPayment = async () => {
    setIsConfirmingBakong(true)
    setPurchaseError('')
    setPurchaseMessage('')

    try {
      const verifiedPayment = await verifyBakongPayment(bakongPayment)

      if (!isPaidPayment(verifiedPayment)) {
        setPurchaseError('Waiting for Bakong to confirm this payment.')
        return
      }

      await completePaidPurchase(verifiedPayment)
    } catch (error) {
      if (isAuthError(error)) {
        requireLogin()
        return
      }

      setPurchaseError(getPurchaseErrorMessage(error))
    } finally {
      setIsConfirmingBakong(false)
    }
  }

  useEffect(() => {
    if (!bakongPayment) return undefined

    let isActive = true

    const checkBakongPayment = async () => {
      try {
        const verifiedPayment = await verifyBakongPayment(bakongPayment)

        if (!isActive || !isPaidPayment(verifiedPayment)) return

        await completePaidPurchase(verifiedPayment)
      } catch {
        // Keep the QR modal open while the payment provider is still pending or temporarily unavailable.
      }
    }

    const timer = window.setInterval(checkBakongPayment, 5000)
    checkBakongPayment()

    return () => {
      isActive = false
      window.clearInterval(timer)
    }
  }, [bakongPayment])

  const handleWatchCourse = async (selectedCourse) => {
    setPurchaseError('')

    try {
      const user = await getRequiredUser()

      if (!user) return

      if (!canWatchCourse(selectedCourse, user, purchasedCourses)) {
        setCourse(selectedCourse)
        setPurchaseError('Please buy this course before watching the video.')
        return
      }

      setCourse(selectedCourse)
      setIsPreviewOpen(true)
    } catch (error) {
      setPurchaseError(getPurchaseErrorMessage(error))
    }
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
                className={`absolute inset-0 flex items-center justify-center bg-slate-950/30 ${hasUnlockedCourse ? '' : 'cursor-not-allowed'}`}
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
                  className="h-14 rounded-lg bg-[#302be2] text-sm font-black text-white transition hover:bg-[#1916b8] disabled:cursor-not-allowed disabled:bg-slate-400"
                  disabled={isBuying}
                  onClick={handleBuyNow}
                  type="button"
                >
                  {isBuying ? 'Processing...' : hasUnlockedCourse || isCourseFree ? 'Watch Now' : 'Buy Now'}
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

      <TableCard courses={courseItems} purchases={purchasedCourses} isAuthenticated={Boolean(currentUser)} currentUser={currentUser} onWatchCourse={handleWatchCourse} />

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

      {bakongPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <section className="max-h-[calc(100vh-2rem)] w-full max-w-sm overflow-y-auto rounded-xl bg-white p-5 text-slate-950 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-[#302be2]">
                  <FontAwesomeIcon icon={faQrcode} />
                  Bakong KHQR
                </p>
                <h2 className="mt-1 text-xl font-black">Scan to pay</h2>
                <p className="mt-1 text-sm leading-5 text-slate-600">
                  Scan this QR code, then confirm after payment.
                </p>
              </div>
              <button
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                onClick={() => setBakongPayment(null)}
                type="button"
                aria-label="Close Bakong QR modal"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="mt-4 grid justify-items-center rounded-lg border border-slate-200 bg-slate-50 p-4">
              {bakongPayment.qrImage ? (
                <img className="h-52 w-52 rounded-lg bg-white object-contain p-2" src={bakongPayment.qrImage} alt="Bakong KHQR payment code" />
              ) : (
                <div className="grid h-52 w-52 place-items-center rounded-lg bg-white p-4 text-center text-sm text-slate-500">
                  KHQR code text returned without an image.
                </div>
              )}
              <p className="mt-3 max-w-full truncate text-center text-sm font-semibold text-slate-700">{detail.title}</p>
              <p className="text-center text-xl font-black text-[#302be2]">
                ${getNumericPrice(detail.price).toFixed(2)}
              </p>
              {bakongPayment.md5 && (
                <p className="mt-1 max-w-full truncate text-xs text-slate-500">Ref: {bakongPayment.md5}</p>
              )}
            </div>

            <div className="mt-4 grid gap-2">
              <button
                className="h-11 cursor-wait rounded-lg bg-[#302be2] text-sm font-black text-white"
                disabled
                onClick={handleConfirmBakongPayment}
                type="button"
              >
                Waiting QR code
              </button>
              <button
                className="h-10 rounded-lg border border-slate-200 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                onClick={() => setBakongPayment(null)}
                type="button"
              >
                Cancel
              </button>
            </div>
          </section>
        </div>
      )}

      {receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <section className="w-full max-w-sm rounded-xl bg-white p-6 text-center text-slate-950 shadow-2xl">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-xl text-emerald-700">
              <FontAwesomeIcon icon={faCheck} />
            </span>
            <h2 className="mt-4 text-2xl font-black">Payment received</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              You paid for {receipt.title}. The course is unlocked now.
            </p>
            <div className="mt-5 rounded-lg bg-slate-50 p-4 text-left text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Amount</span>
                <strong>${Number(receipt.amount || 0).toFixed(2)}</strong>
              </div>
              {receipt.md5 && (
                <div className="mt-2 flex justify-between gap-4">
                  <span className="text-slate-500">Reference</span>
                  <strong className="max-w-40 truncate">{receipt.md5}</strong>
                </div>
              )}
              <div className="mt-2 flex justify-between gap-4">
                <span className="text-slate-500">Paid at</span>
                <strong>{new Date(receipt.paidAt).toLocaleString()}</strong>
              </div>
            </div>
            <button
              className="mt-5 h-12 w-full rounded-lg bg-[#302be2] text-sm font-black text-white transition hover:bg-[#1916b8]"
              onClick={() => setReceipt(null)}
              type="button"
            >
              Close
            </button>
          </section>
        </div>
      )}
    </main>
  )
}

export default CardDetail
