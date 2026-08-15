import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBookOpen,
  faCirclePlay,
  faChevronRight,
  faDollarSign,
  faLayerGroup,
  faPen,
  faPlus,
  faTrash,
  faXmark,
  faUsers,
} from '@fortawesome/free-solid-svg-icons'
import AdminPageHeader from './AdminPageHeader'
import { createCourse, deleteCourse, getCategories, getCourses, getEnrollments, getLessons, getPayments, updateCourse } from '../../lib/courseApi'

const courseStats = [
  { label: 'Total Courses', value: '0', icon: faBookOpen, color: 'bg-violet-100 text-violet-700' },
  { label: 'Categories', value: '0', icon: faLayerGroup, color: 'bg-cyan-100 text-cyan-700' },
  { label: 'Viewers', value: '0', icon: faUsers, color: 'bg-emerald-100 text-emerald-700' },
  { label: 'Revenue', value: '$0', icon: faDollarSign, color: 'bg-amber-100 text-amber-700' },
]

const emptyCourseForm = {
  title: '',
  categoryName: '',
  price: '',
  description: '',
  image: '',
  originalImage: '',
  imageFile: null,
  imageFileName: '',
  videoUrl: '',
  originalVideoUrl: '',
  videoFile: null,
  videoFileName: '',
  status: 'Published',
}

const makeSlug = (value) => value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')

const buildCoursePayload = (formData, categories) => {
  const category = categories.find((item) => item.name === formData.categoryName)
  const price = Number(String(formData.price).replace(/[^0-9.]/g, '')) || 0
  const payload = {
    title: formData.title,
    slug: makeSlug(formData.title),
    description: formData.description,
    thumbnail: formData.image,
    video_url: formData.videoUrl,
    video: formData.videoUrl,
    preview_video: formData.videoUrl,
    price,
    is_published: formData.status === 'Published',
    status: formData.status,
  }

  if (category?.id && !category.isLocal && Number.isInteger(Number(category.id))) {
    payload.category_id = Number(category.id)
  }

  if (formData.imageFile || formData.videoFile) {
    const filePayload = new FormData()

    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        filePayload.append(key, typeof value === 'boolean' ? Number(value) : value)
      }
    })
    if (formData.imageFile) {
      filePayload.append('image_file', formData.imageFile)
    }
    if (formData.videoFile) {
      filePayload.append('video_file', formData.videoFile)
    }

    return filePayload
  }

  return payload
}

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

const saveCourseVideo = (course, videoUrl) => {
  if (!course || !videoUrl) return

  const videos = getSavedCourseVideos()

  getCourseVideoKeys(course).forEach((key) => {
    videos[key] = videoUrl
  })

  localStorage.setItem('course_video_urls', JSON.stringify(videos))
}

const getFormFromCourse = (course) => ({
  title: course.title || '',
  categoryName: course.category || '',
  price: course.price === 'Free' ? '0' : String(course.price || '').replace('$', ''),
  description: course.description || course.raw?.description || '',
  image: course.image || '',
  originalImage: course.image || '',
  imageFile: null,
  imageFileName: '',
  videoUrl: getCourseVideoUrl(course),
  originalVideoUrl: getCourseVideoUrl(course),
  videoFile: null,
  videoFileName: '',
  status: course.status || 'Published',
})

const getCourseVideoUrl = (course) => {
  const videos = getSavedCourseVideos()

  return course?.videoUrl
    || course?.raw?.video_url
    || course?.raw?.video
    || course?.raw?.preview_video
    || course?.video_url
    || getCourseVideoKeys(course).map((key) => videos[key]).find(Boolean)
    || ''
}

const isVideoFile = (url) => /\.(mp4|webm|ogg|mov|avi)(\?.*)?$/i.test(url)

const getLocalPurchases = () => {
  try {
    return JSON.parse(localStorage.getItem('course_purchases') || '[]')
  } catch {
    return []
  }
}

const normalizeValue = (value) => String(value || '').trim().toLowerCase()

const getCourseMatchValues = (course) => [
  course.id,
  course.raw?.id,
  course.title,
  course.raw?.title,
  course.raw?.name,
].filter(Boolean).map(normalizeValue)

const getRecordCourseValue = (item) => normalizeValue(
  item.course_id
  || item.course?.id
  || item.course?.title
  || item.course_title
  || item.title
)

const getRecordViewerKey = (item) => normalizeValue(
  item.user_id
  || item.student_id
  || item.user?.id
  || item.user?.email
  || item.student_email
  || item.email
  || item.id
)

const recordBelongsToCourse = (item, courseValues) => courseValues.includes(getRecordCourseValue(item))

const getCourseViewerCount = (course, enrollments, payments, purchases = []) => {
  const courseValues = getCourseMatchValues(course)
  const viewerKeys = new Set()

  enrollments
    .filter((item) => recordBelongsToCourse(item, courseValues))
    .forEach((item) => {
      viewerKeys.add(getRecordViewerKey(item))
    })

  payments
    .filter((item) => recordBelongsToCourse(item, courseValues))
    .forEach((item) => {
      viewerKeys.add(getRecordViewerKey(item))
    })

  purchases
    .filter((item) => recordBelongsToCourse(item, courseValues))
    .forEach((item) => {
      viewerKeys.add(getRecordViewerKey(item))
    })

  viewerKeys.delete('')
  if (viewerKeys.size > 0) {
    return viewerKeys.size
  }

  return Number(String(course.students || course.raw?.students_count || course.raw?.enrollments_count || 0).replace(/,/g, '')) || 0
}

const getCourseRevenue = (course, payments) => {
  const courseValues = getCourseMatchValues(course)
  const coursePayments = payments.filter((payment) => recordBelongsToCourse(payment, courseValues))
  const revenue = coursePayments.reduce((total, payment) => total + Number(payment.amount || payment.price || 0), 0)

  return revenue > 0 ? `$${revenue.toLocaleString()}` : course.price
}

const getEmbedVideoUrl = (url) => {
  if (!url) return ''

  if (url.includes('youtube.com/embed/')) {
    return url
  }

  if (url.includes('youtube.com/watch')) {
    const videoId = new URL(url).searchParams.get('v')
    return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : ''
  }

  if (url.includes('youtube.com/shorts/')) {
    return `https://www.youtube-nocookie.com/embed/${url.split('/shorts/')[1].split('?')[0]}`
  }

  if (url.includes('youtu.be/')) {
    return `https://www.youtube-nocookie.com/embed/${url.split('youtu.be/')[1].split('?')[0]}`
  }

  return url
}

const CoursesPage = ({ searchQuery = '' }) => {
  const [courseItems, setCourseItems] = useState([])
  const [categoryItems, setCategoryItems] = useState([])
  const [paymentItems, setPaymentItems] = useState([])
  const [lessonItems, setLessonItems] = useState([])
  const [formData, setFormData] = useState(emptyCourseForm)
  const [editingCourse, setEditingCourse] = useState(null)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAllCourses, setShowAllCourses] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)

  useEffect(() => {
    let isMounted = true

    Promise.all([getCourses(), getCategories(), getPayments(), getLessons(), getEnrollments()])
      .then(([backendCourses, backendCategories, payments, lessons, enrollments]) => {
        if (!isMounted) return
        const savedCourseVideos = getSavedCourseVideos()
        const localPurchases = getLocalPurchases()

        if (backendCourses.length > 0) {
          const mappedCourses = backendCourses.map((course) => {
            return {
              ...course,
              videoUrl: course.videoUrl || savedCourseVideos[course.id] || '',
              viewers: getCourseViewerCount(course, enrollments, payments, localPurchases),
              revenue: getCourseRevenue(course, payments),
              status: course.raw?.status || course.raw?.published_status || 'Published',
            }
          })

          setCourseItems(mappedCourses)
        }

        if (backendCategories.length > 0) {
          setCategoryItems(backendCategories)
          setFormData((current) => (
            current.categoryName ? current : { ...current, categoryName: '' }
          ))
        }

        setPaymentItems(payments)
        setLessonItems(lessons)
      })
      .catch(() => {
        if (isMounted) {
          setCourseItems([])
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const dynamicCourseStats = [
    { ...courseStats[0], value: courseItems.length.toLocaleString() },
    { ...courseStats[1], value: categoryItems.length.toLocaleString() },
    { ...courseStats[2], value: courseItems.reduce((total, course) => total + Number(course.viewers || 0), 0).toLocaleString() },
    { ...courseStats[3], value: `$${paymentItems.reduce((total, payment) => total + Number(payment.amount || payment.price || 0), 0).toLocaleString()}` },
  ]
  const normalizedSearch = searchQuery.trim().toLowerCase()
  const filteredCourseItems = normalizedSearch
    ? courseItems.filter((course) => [
      course.title,
      course.category,
      course.description,
      course.price,
      course.revenue,
      course.status,
      course.viewers,
    ].join(' ').toLowerCase().includes(normalizedSearch))
    : courseItems
  const visibleCourses = showAllCourses ? filteredCourseItems : filteredCourseItems.slice(0, 3)
  const detailCourse = selectedCourse
  const detailLessonVideo = lessonItems.find((lesson) => String(lesson.course_id) === String(detailCourse?.id) && (lesson.video_url || lesson.video || lesson.preview_video))
  const detailVideoUrl = getEmbedVideoUrl(getCourseVideoUrl(detailCourse) || detailLessonVideo?.video_url || detailLessonVideo?.video || detailLessonVideo?.preview_video || '')

  const handleFormChange = (event) => {
    const { files, name, value } = event.target

    if (name === 'imageFile' || name === 'videoFile') {
      const file = files?.[0] || null

      setFormData((current) => ({
        ...current,
        [name]: file,
        [`${name}Name`]: file?.name || '',
      }))
      return
    }

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))

    if (name === 'videoUrl' && editingCourse) {
      saveCourseVideo(editingCourse, value)
      setSelectedCourse((current) => (
        String(current?.id) === String(editingCourse.id)
          ? { ...current, videoUrl: value }
          : current
      ))
    }
  }

  const resetForm = ({ keepMessage = false } = {}) => {
    setEditingCourse(null)
    setFormData({
      ...emptyCourseForm,
      categoryName: '',
    })
    if (!keepMessage) {
      setFormError('')
      setFormSuccess('')
    }
  }

  const handleEditCourse = (course) => {
    setEditingCourse(course)
    setFormData(getFormFromCourse(course))
    setFormError('')
    setFormSuccess('')
  }

  const mergeCourseMeta = (course) => ({
    ...course,
    revenue: course.revenue || course.price,
    status: course.raw?.status || course.raw?.published_status || course.status || (course.raw?.is_published === false ? 'Draft' : 'Published'),
  })

  const handleSaveCourse = async (event) => {
    event.preventDefault()
    setFormError('')
    setFormSuccess('')

    const imageUrlChanged = formData.image !== formData.originalImage
    const videoUrlChanged = formData.videoUrl !== formData.originalVideoUrl

    if (formData.image && formData.imageFile && (!editingCourse || imageUrlChanged)) {
      setFormError('Please choose only one thumbnail source: use Thumbnail URL or Thumbnail Image File, not both.')
      return
    }

    if (formData.videoUrl && formData.videoFile && (!editingCourse || videoUrlChanged)) {
      setFormError('Please choose only one video source: use Video URL or Video File, not both.')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = buildCoursePayload(formData, categoryItems)
      const formPrice = Number(String(formData.price).replace(/[^0-9.]/g, '')) || 0
      const savedCourse = editingCourse?.id
        ? await updateCourse(editingCourse.id, payload)
        : await createCourse(payload)
      const nextCourse = mergeCourseMeta({
        ...savedCourse,
        category: formData.categoryName || savedCourse.category,
        categoryId: !categoryItems.find((item) => item.name === formData.categoryName)?.isLocal
          ? categoryItems.find((item) => item.name === formData.categoryName)?.id || savedCourse.categoryId
          : savedCourse.categoryId,
        image: savedCourse.image || formData.image,
        videoUrl: savedCourse.videoUrl || formData.videoUrl,
        viewers: editingCourse?.viewers || 0,
        price: savedCourse.price || `$${formPrice.toFixed(2)}`,
        revenue: editingCourse?.revenue || '$0',
        status: formData.status,
      })

      saveCourseVideo(nextCourse, nextCourse.videoUrl)

      setCourseItems((current) => {
        if (editingCourse?.id) {
          return current.map((course) => String(course.id) === String(editingCourse.id) ? nextCourse : course)
        }

        return [nextCourse, ...current]
      })
      setSelectedCourse(nextCourse)
      const successMessage = editingCourse ? 'Course updated successfully.' : 'Course added successfully.'
      resetForm({ keepMessage: true })
      setFormSuccess(successMessage)
    } catch (error) {
      setFormError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCourse = async (course) => {
    if (!course.id) {
      setCourseItems((current) => current.filter((item) => item.title !== course.title))
      setSelectedCourse((current) => current?.title === course.title ? null : current)
      return
    }

    const confirmed = window.confirm(`Delete "${course.title}"?`)
    if (!confirmed) return

    setFormError('')
    setFormSuccess('')

    try {
      await deleteCourse(course.id)
      setCourseItems((current) => current.filter((item) => String(item.id) !== String(course.id)))
      setSelectedCourse((current) => String(current?.id) === String(course.id) ? null : current)
      if (String(editingCourse?.id) === String(course.id)) {
        resetForm()
      }
      setFormSuccess('Course deleted successfully.')
    } catch (error) {
      setFormError(error.message)
    }
  }

  return (
  <div className="px-5 py-8 xl:px-8">
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <AdminPageHeader title="Courses" text="Manage course content, categories, and publishing status." />
      <button className="inline-flex h-12 items-center justify-center gap-3 rounded-lg bg-violet-600 px-7 text-sm font-black text-white shadow-lg shadow-violet-200" onClick={resetForm} type="button">
        <FontAwesomeIcon icon={faPlus} />
        Add Course
      </button>
    </div>

    <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {dynamicCourseStats.map((item) => (
        <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-md shadow-slate-200/50" key={item.label}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-500">{item.label}</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">{item.value}</h2>
            </div>
            <span className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${item.color}`}>
              <FontAwesomeIcon icon={item.icon} />
            </span>
          </div>
        </article>
      ))}
    </div>

    <section className="mt-8 rounded-2xl border border-slate-100 bg-white p-6 shadow-md shadow-slate-200/50">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-violet-600">{editingCourse ? 'Edit Course' : 'Add Course'}</p>
          <h2 className="mt-1 text-2xl font-black">{editingCourse ? editingCourse.title : 'Course Manager'}</h2>
          <p className="mt-1 text-sm text-slate-500">Create, update, and publish courses from one simple panel.</p>
        </div>
        {editingCourse && (
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-black text-slate-600" onClick={resetForm} type="button">
            <FontAwesomeIcon icon={faXmark} />
            Cancel Edit
          </button>
        )}
      </div>

      <form className="mt-6 grid gap-5 lg:grid-cols-2" onSubmit={handleSaveCourse}>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Course Title
          <input
            className="h-12 rounded-lg border border-slate-200 bg-slate-50 px-4 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
            name="title"
            onChange={handleFormChange}
            placeholder="Enter course title"
            required
            type="text"
            value={formData.title}
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Category
          <select
            className="h-12 rounded-lg border border-slate-200 bg-slate-50 px-4 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
            disabled={categoryItems.length === 0}
            name="categoryName"
            onChange={handleFormChange}
            value={formData.categoryName}
          >
            {categoryItems.length > 0 ? categoryItems.map((category) => (
              <option key={category.id || category.name} value={category.name}>{category.name}</option>
            )) : (
              <option value="">No categories from API</option>
            )}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Price
          <input
            className="h-12 rounded-lg border border-slate-200 bg-slate-50 px-4 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
            name="price"
            onChange={handleFormChange}
            placeholder="$99.00"
            type="text"
            value={formData.price}
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Status
          <select
            className="h-12 rounded-lg border border-slate-200 bg-slate-50 px-4 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
            name="status"
            onChange={handleFormChange}
            value={formData.status}
          >
            <option>Published</option>
            <option>Draft</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700 lg:col-span-2">
          Thumbnail URL
          <input
            className="h-12 rounded-lg border border-slate-200 bg-slate-50 px-4 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
            name="image"
            onChange={handleFormChange}
            placeholder="https://example.com/course-image.jpg"
            type="url"
            value={formData.image}
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700 lg:col-span-2">
          Thumbnail Image File
          <input
            accept="image/*"
            className="block w-full rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-600 outline-none file:mr-4 file:h-12 file:border-0 file:bg-violet-600 file:px-5 file:text-sm file:font-black file:text-white focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
            name="imageFile"
            onChange={handleFormChange}
            type="file"
          />
          {formData.imageFileName && (
            <span className="text-xs font-medium text-slate-500">Selected file: {formData.imageFileName}</span>
          )}
          {editingCourse && !formData.imageFileName && formData.originalImage && (
            <span className="text-xs font-medium text-slate-500">Current thumbnail will be kept if no new file is chosen.</span>
          )}
          {formData.image && formData.imageFile && (!editingCourse || formData.image !== formData.originalImage) && (
            <span className="text-xs font-semibold text-red-600">
              Choose either Thumbnail URL or Thumbnail Image File, not both.
            </span>
          )}
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700 lg:col-span-2">
          Video URL
          <input
            className="h-12 rounded-lg border border-slate-200 bg-slate-50 px-4 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
            name="videoUrl"
            onChange={handleFormChange}
            placeholder="https://www.youtube.com/watch?v=..."
            type="url"
            value={formData.videoUrl}
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700 lg:col-span-2">
          Video File
          <input
            accept="video/*"
            className="block w-full rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-600 outline-none file:mr-4 file:h-12 file:border-0 file:bg-violet-600 file:px-5 file:text-sm file:font-black file:text-white focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
            name="videoFile"
            onChange={handleFormChange}
            type="file"
          />
          {formData.videoFileName && (
            <span className="text-xs font-medium text-slate-500">Selected file: {formData.videoFileName}</span>
          )}
          {editingCourse && !formData.videoFileName && formData.originalVideoUrl && (
            <span className="text-xs font-medium text-slate-500">Current video will be kept if no new file is chosen.</span>
          )}
          {formData.videoUrl && formData.videoFile && (!editingCourse || formData.videoUrl !== formData.originalVideoUrl) && (
            <span className="text-xs font-semibold text-red-600">
              Choose either Video URL or Video File, not both.
            </span>
          )}
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700 lg:col-span-2">
          Description
          <textarea
            className="min-h-28 rounded-lg border border-slate-200 bg-slate-50 p-4 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
            name="description"
            onChange={handleFormChange}
            placeholder="Describe what students will learn..."
            value={formData.description}
          />
        </label>
        {formError && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 lg:col-span-2">{formError}</p>
        )}
        {formSuccess && (
          <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 lg:col-span-2">{formSuccess}</p>
        )}
        <button
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-violet-600 px-7 text-sm font-black text-white shadow-lg shadow-violet-200 disabled:cursor-not-allowed disabled:bg-slate-400 lg:col-span-2"
          disabled={isSubmitting}
          type="submit"
        >
          <FontAwesomeIcon icon={editingCourse ? faPen : faPlus} />
          {isSubmitting ? 'Saving course...' : editingCourse ? 'Update Course' : 'Add Course'}
        </button>
      </form>
    </section>

    {detailCourse && (
      <section className="mt-8 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-md shadow-slate-200/50">
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-violet-600">Course Detail</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">{detailCourse.title}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                  {detailCourse.description || 'No description has been added for this course yet.'}
                </p>
              </div>
              <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-black ${detailCourse.status === 'Published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {detailCourse.status}
              </span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-4">
              {[
                ['Category', detailCourse.category],
                ['Viewers', Number(detailCourse.viewers || 0).toLocaleString()],
                ['Price', detailCourse.price],
                ['Revenue', detailCourse.revenue],
              ].map(([label, value]) => (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4" key={label}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                  <p className="mt-2 text-lg font-black text-slate-950">{value || 'N/A'}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 bg-slate-950 p-4 xl:border-l xl:border-t-0">
            <div className="flex h-full min-h-64 items-center justify-center overflow-hidden rounded-xl bg-slate-900">
              {detailVideoUrl ? (
                isVideoFile(detailVideoUrl) ? (
                  <video
                    className="h-full min-h-64 w-full"
                    controls
                    src={detailVideoUrl}
                    title={`${detailCourse.title} video`}
                  />
                ) : (
                  <iframe
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="h-full min-h-64 w-full"
                    src={detailVideoUrl}
                    title={`${detailCourse.title} video`}
                  />
                )
              ) : (
                <div className="grid justify-items-center gap-3 px-6 text-center text-white">
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-white/10 text-2xl">
                    <FontAwesomeIcon icon={faCirclePlay} />
                  </span>
                  <p className="font-black">No video added</p>
                  <p className="text-sm text-slate-300">Add a video URL in this form, or add a `video_url` column to courses / lessons in the backend.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    )}

    <section className="mt-8 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-md shadow-slate-200/50">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-black">Course List</h2>
          <p className="mt-1 text-sm text-slate-500">
            Showing {visibleCourses.length} of {filteredCourseItems.length} courses. Click a course to view details.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 text-sm font-black text-violet-600" onClick={() => setShowAllCourses((current) => !current)} type="button">
          {showAllCourses ? 'Show less' : 'View all'}
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-500">
            <tr>
              <th className="px-6 py-4">Course</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Viewers</th>
              <th className="px-6 py-4">Revenue</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleCourses.map((course) => (
              <tr className={`${String(detailCourse?.id || detailCourse?.title) === String(course.id || course.title) ? 'bg-violet-50/60' : 'hover:bg-slate-50/70'}`} key={course.id || course.title}>
                <td className="px-6 py-5">
                  <button className="flex w-full items-center gap-4 text-left" onClick={() => setSelectedCourse(course)} type="button">
                    <img className="h-14 w-20 rounded-lg object-cover" src={course.image} alt={course.title} />
                    <div>
                      <p className="font-black">{course.title}</p>
                      <p className="mt-1 text-xs text-slate-500">Click to view detail and video</p>
                    </div>
                  </button>
                </td>
                <td className="px-6 py-5 text-slate-700">{course.category}</td>
                <td className="px-6 py-5">
                  <span className="inline-flex items-center gap-2 font-semibold">
                    <FontAwesomeIcon className="text-violet-500" icon={faUsers} />
                    {Number(course.viewers || 0).toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-5 font-black text-emerald-600">{course.revenue}</td>
                <td className="px-6 py-5">
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${course.status === 'Published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {course.status}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex justify-end gap-2">
                    <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700" onClick={() => handleEditCourse(course)} type="button" aria-label={`Edit ${course.title}`}>
                      <FontAwesomeIcon icon={faPen} />
                    </button>
                    <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600" onClick={() => handleDeleteCourse(course)} type="button" aria-label={`Delete ${course.title}`}>
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  </div>
  )
}

export default CoursesPage
