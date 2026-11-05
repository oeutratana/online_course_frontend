import { useCallback, useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBookOpen,
  faCheck,
  faChevronLeft,
  faChevronRight,
  faCircleExclamation,
  faEye,
  faListCheck,
  faPen,
  faPlus,
  faRotateRight,
  faTrash,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import AdminPageHeader from './AdminPageHeader'
import {
  createLesson,
  deleteLesson,
  getAdminLessons,
  getCourses,
  updateLesson,
} from '../../lib/courseApi'

const emptyLessonForm = {
  course_id: '',
  title: '',
  description: '',
  video_url: '',
  content: '',
  order: 0,
  is_preview: false,
}

const LessonsPage = ({ searchQuery = '' }) => {
  const [lessonItems, setLessonItems] = useState([])
  const [courseItems, setCourseItems] = useState([])
  const [meta, setMeta] = useState({ total: 0, currentPage: 1, lastPage: 1, perPage: 10 })
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingLesson, setEditingLesson] = useState(null)
  const [formData, setFormData] = useState(emptyLessonForm)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const resetForm = useCallback(() => {
    setEditingLesson(null)
    setFormData(emptyLessonForm)
    setFormError('')
  }, [])

  const applyLessonResult = (result) => {
    setLessonItems(result.items)
    setMeta({
      total: result.total,
      currentPage: result.currentPage,
      lastPage: result.lastPage,
      perPage: result.perPage,
    })
    setPage(result.currentPage)
  }

  const loadLessons = useCallback(async (targetPage = 1) => {
    setIsLoading(true)
    setLoadError('')

    try {
      const result = await getAdminLessons({
        page: targetPage,
        perPage: 10,
        search: searchQuery.trim(),
      })

      applyLessonResult(result)
    } catch (error) {
      setLoadError(error.message)
      setLessonItems([])
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery])

  useEffect(() => {
    getCourses()
      .then(setCourseItems)
      .catch(() => setCourseItems([]))
  }, [])

  useEffect(() => {
    let isMounted = true

    getAdminLessons({ page: 1, perPage: 10, search: searchQuery.trim() })
      .then((result) => {
        if (isMounted) {
          applyLessonResult(result)
        }
      })
      .catch((error) => {
        if (isMounted) {
          setLoadError(error.message)
          setLessonItems([])
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
  }, [searchQuery])

  const handleFormChange = (event) => {
    const { checked, name, type, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleStartEdit = (lesson) => {
    setEditingLesson(lesson)
    setFormData({
      course_id: String(lesson.courseId ?? ''),
      title: lesson.title === 'Untitled lesson' ? '' : lesson.title,
      description: lesson.description || '',
      video_url: lesson.raw?.video_url || '',
      content: lesson.content || '',
      order: lesson.order ?? 0,
      is_preview: lesson.isPreview,
    })
    setFormError('')
    setFormSuccess('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setFormError('')
    setFormSuccess('')

    const payload = {
      ...formData,
      course_id: Number(formData.course_id),
      order: Number(formData.order) || 0,
    }

    try {
      if (editingLesson) {
        await updateLesson(editingLesson.id, payload)
        setFormSuccess(`Lesson "${payload.title}" updated.`)
      } else {
        await createLesson(payload)
        setFormSuccess(`Lesson "${payload.title}" created.`)
        setFormData(emptyLessonForm)
      }

      await loadLessons(editingLesson ? page : 1)
      setEditingLesson(null)
    } catch (error) {
      setFormError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (lesson) => {
    const confirmed = window.confirm(`Delete lesson "${lesson.title}"? This cannot be undone.`)

    if (!confirmed) return

    setDeletingId(lesson.id)
    setFormError('')
    setFormSuccess('')

    try {
      await deleteLesson(lesson.id)
      setFormSuccess(`Lesson "${lesson.title}" deleted.`)

      if (String(editingLesson?.id) === String(lesson.id)) {
        resetForm()
      }

      const nextPage = lessonItems.length === 1 && page > 1 ? page - 1 : page
      await loadLessons(nextPage)
    } catch (error) {
      setFormError(error.message)
    } finally {
      setDeletingId(null)
    }
  }

  const stats = [
    { label: 'Total Lessons', value: meta.total.toLocaleString(), icon: faListCheck, color: 'bg-violet-100 text-violet-700' },
    { label: 'Preview Lessons', value: lessonItems.filter((lesson) => lesson.isPreview).length.toLocaleString(), icon: faEye, color: 'bg-emerald-100 text-emerald-700' },
    { label: 'On This Page', value: lessonItems.length.toLocaleString(), icon: faBookOpen, color: 'bg-amber-100 text-amber-700' },
  ]

  const normalizedSearch = searchQuery.trim().toLowerCase()
  const from = meta.total === 0 ? 0 : (meta.currentPage - 1) * meta.perPage + 1
  const to = Math.min(meta.currentPage * meta.perPage, meta.total)

  return (
    <div className="px-5 py-8 xl:px-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <AdminPageHeader title="Lessons" text="Create, edit and organize the lessons that belong to each course." />
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 shadow-sm"
          onClick={() => loadLessons(page)}
          type="button"
        >
          <FontAwesomeIcon icon={faRotateRight} />
          Refresh
        </button>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {stats.map((stat) => (
          <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-md shadow-slate-200/50" key={stat.label}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight">{stat.value}</h2>
              </div>
              <span className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${stat.color}`}>
                <FontAwesomeIcon icon={stat.icon} />
              </span>
            </div>
          </article>
        ))}
      </div>

      <section className="mt-8 rounded-2xl border border-slate-100 bg-white p-6 shadow-md shadow-slate-200/50">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-violet-600">{editingLesson ? 'Edit Lesson' : 'Add Lesson'}</p>
            <h2 className="mt-1 text-2xl font-black">{editingLesson ? editingLesson.title : 'Lesson Manager'}</h2>
            <p className="mt-1 text-sm text-slate-500">Every lesson must be attached to a course.</p>
          </div>
          {editingLesson && (
            <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-black text-slate-600" onClick={resetForm} type="button">
              <FontAwesomeIcon icon={faXmark} />
              Cancel Edit
            </button>
          )}
        </div>

        <form className="mt-6 grid gap-5 lg:grid-cols-2" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Course
            <select
              className="h-12 rounded-lg border border-slate-200 bg-slate-50 px-4 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              name="course_id"
              onChange={handleFormChange}
              required
              value={formData.course_id}
            >
              <option value="">Select a course</option>
              {courseItems.map((course) => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Lesson Title
            <input
              className="h-12 rounded-lg border border-slate-200 bg-slate-50 px-4 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              name="title"
              onChange={handleFormChange}
              placeholder="Introduction to the course"
              required
              type="text"
              value={formData.title}
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Order
            <input
              className="h-12 rounded-lg border border-slate-200 bg-slate-50 px-4 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              min="0"
              name="order"
              onChange={handleFormChange}
              type="number"
              value={formData.order}
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Video URL
            <input
              className="h-12 rounded-lg border border-slate-200 bg-slate-50 px-4 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              name="video_url"
              onChange={handleFormChange}
              placeholder="https://example.com/lesson-1.mp4"
              type="text"
              value={formData.video_url}
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-700 lg:col-span-2">
            Description
            <textarea
              className="min-h-28 rounded-lg border border-slate-200 bg-slate-50 p-4 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              name="description"
              onChange={handleFormChange}
              placeholder="What will students learn in this lesson?"
              value={formData.description}
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-700 lg:col-span-2">
            Content
            <textarea
              className="min-h-32 rounded-lg border border-slate-200 bg-slate-50 p-4 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              name="content"
              onChange={handleFormChange}
              placeholder="Full lesson notes or markdown"
              value={formData.content}
            />
          </label>

          <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
            <input
              checked={formData.is_preview}
              className="h-5 w-5 rounded border-slate-300 text-violet-600 focus:ring-violet-400"
              name="is_preview"
              onChange={handleFormChange}
              type="checkbox"
            />
            Free preview lesson
          </label>

          <button
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-violet-600 px-7 text-sm font-black text-white shadow-lg shadow-violet-200 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={isSubmitting}
            type="submit"
          >
            <FontAwesomeIcon icon={editingLesson ? faPen : faPlus} />
            {isSubmitting ? 'Saving...' : editingLesson ? 'Update' : 'Add'}
          </button>

          {formError && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 lg:col-span-2">{formError}</p>
          )}
          {formSuccess && (
            <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 lg:col-span-2">{formSuccess}</p>
          )}
        </form>
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-md shadow-slate-200/50">
        <div className="flex flex-col gap-2 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black">Lesson List</h2>
            <p className="mt-1 text-sm text-slate-500">Edit or remove lessons that belong to your courses.</p>
          </div>
          <p className="text-sm font-semibold text-slate-500">Showing {from}-{to} of {meta.total}</p>
        </div>

        {loadError && (
          <p className="m-6 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <FontAwesomeIcon icon={faCircleExclamation} />
            {loadError}
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-6 py-4">Lesson</th>
                <th className="px-6 py-4">Course</th>
                <th className="px-6 py-4">Order</th>
                <th className="px-6 py-4">Preview</th>
                <th className="px-6 py-4">Quizzes</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td className="px-6 py-10 text-center text-slate-500" colSpan="6">
                    Loading lessons...
                  </td>
                </tr>
              ) : lessonItems.length > 0 ? lessonItems.map((lesson) => (
                <tr className="hover:bg-slate-50/70" key={lesson.id}>
                  <td className="px-6 py-5">
                    <p className="font-black">{lesson.title}</p>
                    <p className="mt-1 max-w-md text-xs text-slate-500">{lesson.description || 'No description added yet.'}</p>
                  </td>
                  <td className="px-6 py-5 font-semibold text-slate-700">{lesson.courseName}</td>
                  <td className="px-6 py-5 font-semibold text-slate-700">{lesson.order}</td>
                  <td className="px-6 py-5">
                    {lesson.isPreview ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                        <FontAwesomeIcon icon={faCheck} />
                        Yes
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">No</span>
                    )}
                  </td>
                  <td className="px-6 py-5 font-semibold text-slate-700">{lesson.quizzesCount}</td>
                  <td className="px-6 py-5">
                    <div className="flex justify-end gap-2">
                      <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700" onClick={() => handleStartEdit(lesson)} type="button" aria-label={`Edit ${lesson.title}`}>
                        <FontAwesomeIcon icon={faPen} />
                      </button>
                      <button
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={deletingId === lesson.id}
                        onClick={() => handleDelete(lesson)}
                        type="button"
                        aria-label={`Delete ${lesson.title}`}
                      >
                        <FontAwesomeIcon icon={deletingId === lesson.id ? faRotateRight : faTrash} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td className="px-6 py-10 text-center text-slate-500" colSpan="6">
                    {normalizedSearch
                      ? 'No lessons match your search.'
                      : 'No lessons yet. Add your first lesson above.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-500">Page {meta.currentPage} of {meta.lastPage}</p>
          <div className="flex gap-2">
            <button
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-xs font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={isLoading || meta.currentPage <= 1}
              onClick={() => loadLessons(meta.currentPage - 1)}
              type="button"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
              Previous
            </button>
            <button
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-xs font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={isLoading || meta.currentPage >= meta.lastPage}
              onClick={() => loadLessons(meta.currentPage + 1)}
              type="button"
            >
              Next
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default LessonsPage
