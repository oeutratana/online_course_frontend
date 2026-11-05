import { useCallback, useEffect, useMemo, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowDown,
  faArrowUp,
  faCheck,
  faChevronLeft,
  faChevronRight,
  faCircleCheck,
  faCircleQuestion,
  faClipboardQuestion,
  faEye,
  faEyeSlash,
  faMagnifyingGlass,
  faPen,
  faPlus,
  faRotateRight,
  faTrash,
  faTriangleExclamation,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import AdminPageHeader from './AdminPageHeader'
import {
  createAdminQuestion,
  createAdminQuiz,
  deleteAdminQuestion,
  deleteAdminQuiz,
  getAdminQuestions,
  getAdminQuizzes,
  reorderAdminQuestions,
  updateAdminQuestion,
  updateAdminQuiz,
} from '../../lib/adminApi'
import { getCourses, getLessons, normalizeQuestion } from '../../lib/courseApi'
import { formatDate } from '../adminUtils'

const PAGE_SIZE = 8

const emptyQuizForm = {
  lesson_id: '',
  title: '',
  description: '',
  passing_score: 60,
  max_attempts: 0,
  is_published: true,
  is_required: false,
}

const emptyQuestionForm = {
  question: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_option: 'a',
  points: 1,
  explanation: '',
}

const optionLetters = ['a', 'b', 'c', 'd']

const inputClass = 'h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100'
const labelClass = 'grid gap-2 text-sm font-semibold text-slate-700'
const primaryButtonClass = 'inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-400'
const secondaryButtonClass = 'inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50'
const iconButtonClass = 'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40'
const dangerIconButtonClass = 'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40'

const StatusBadge = ({ published }) => (
  published ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
      <FontAwesomeIcon icon={faCheck} />
      Published
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">
      <FontAwesomeIcon icon={faEyeSlash} />
      Draft
    </span>
  )
)

const RequiredBadge = ({ required }) => (
  required ? (
    <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700">Required</span>
  ) : (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">Optional</span>
  )
)

const QuestionManagerModal = ({ quiz, onClose, onChanged }) => {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [formData, setFormData] = useState(emptyQuestionForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [reordering, setReordering] = useState(false)

  const fetchQuestions = useCallback(async () => {
    const items = await getAdminQuestions(quiz.id)

    return items.map(normalizeQuestion)
  }, [quiz.id])

  const loadQuestions = async () => {
    setLoading(true)
    setError('')

    try {
      setQuestions(await fetchQuestions())
    } catch (requestError) {
      setError(requestError.message)
      setQuestions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    fetchQuestions()
      .then((items) => {
        if (isMounted) setQuestions(items)
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(requestError.message)
          setQuestions([])
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [fetchQuestions])

  const resetForm = () => {
    setEditingQuestion(null)
    setFormData(emptyQuestionForm)
  }

  const handleFormChange = (event) => {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
  }

  const handleStartEdit = (question) => {
    setEditingQuestion(question)
    setFormData({
      question: question.text === 'Untitled question' ? '' : question.text,
      option_a: question.options[0]?.text || '',
      option_b: question.options[1]?.text || '',
      option_c: question.options[2]?.text || '',
      option_d: question.options[3]?.text || '',
      correct_option: question.correctAnswer || 'a',
      points: question.points || 1,
      explanation: question.explanation || '',
    })
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    const payload = {
      question: formData.question.trim(),
      type: 'multiple_choice',
      option_a: formData.option_a.trim(),
      option_b: formData.option_b.trim(),
      option_c: formData.option_c.trim(),
      option_d: formData.option_d.trim(),
      correct_option: formData.correct_option,
      points: Number(formData.points) || 1,
      explanation: formData.explanation.trim() || null,
    }

    if (!optionLetters.includes(payload.correct_option)) {
      setError('Choose exactly one correct answer.')
      setSaving(false)
      return
    }

    try {
      if (editingQuestion) {
        await updateAdminQuestion(editingQuestion.id, payload)
        setSuccess('Question updated.')
      } else {
        await createAdminQuestion(quiz.id, payload)
        setSuccess('Question added.')
      }

      resetForm()
      await loadQuestions()
      onChanged()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (question) => {
    const confirmed = window.confirm('Delete this question? This cannot be undone.')

    if (!confirmed) return

    setDeletingId(question.id)
    setError('')
    setSuccess('')

    try {
      await deleteAdminQuestion(question.id)
      setSuccess('Question deleted.')

      if (String(editingQuestion?.id) === String(question.id)) {
        resetForm()
      }

      await loadQuestions()
      onChanged()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setDeletingId(null)
    }
  }

  const handleMove = async (index, direction) => {
    const targetIndex = index + direction

    if (targetIndex < 0 || targetIndex >= questions.length || reordering) return

    const next = [...questions]
    const [moved] = next.splice(index, 1)
    next.splice(targetIndex, 0, moved)

    setQuestions(next)
    setReordering(true)
    setError('')
    setSuccess('')

    try {
      await reorderAdminQuestions(quiz.id, next.map((question) => question.id))
      setSuccess('Question order saved.')
      onChanged()
    } catch (requestError) {
      setError(requestError.message)
      await loadQuestions()
    } finally {
      setReordering(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-3 sm:p-6">
      <div className="my-4 w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-white p-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-violet-600">Quiz Details</p>
            <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{quiz.title}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {quiz.course?.title || 'Unknown course'} · {quiz.lesson?.title || 'Unknown lesson'}
            </p>
          </div>
          <button
            aria-label="Close quiz details"
            className={secondaryButtonClass}
            onClick={onClose}
            type="button"
          >
            <FontAwesomeIcon icon={faXmark} />
            Close
          </button>
        </header>

        <div className="grid gap-5 border-b border-slate-100 p-5 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Passing score', value: `${quiz.passingScore}%` },
            { label: 'Max attempts', value: quiz.maxAttempts === 0 ? 'Unlimited' : quiz.maxAttempts },
            { label: 'Status', value: <StatusBadge published={quiz.isPublished} /> },
            { label: 'Requirement', value: <RequiredBadge required={quiz.isRequired} /> },
          ].map((item) => (
            <div className="rounded-xl bg-slate-50 p-4" key={item.label}>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{item.label}</p>
              <div className="mt-2 text-base font-black text-slate-900">{item.value}</div>
            </div>
          ))}
        </div>

        {quiz.description && (
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Description</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">{quiz.description}</p>
          </div>
        )}

        {(error || success) && (
          <div className="space-y-2 px-5 pt-4">
            {error && (
              <p className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                <FontAwesomeIcon className="mt-0.5" icon={faTriangleExclamation} />
                {error}
              </p>
            )}
            {success && (
              <p className="flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                <FontAwesomeIcon className="mt-0.5" icon={faCircleCheck} />
                {success}
              </p>
            )}
          </div>
        )}

        <div className="grid gap-6 p-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <section>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-lg font-black text-slate-950">Questions</h4>
                <p className="text-xs font-semibold text-slate-500">
                  {loading ? 'Loading...' : `${questions.length} question${questions.length === 1 ? '' : 's'}`}
                </p>
              </div>
              <button className={secondaryButtonClass} onClick={loadQuestions} type="button">
                <FontAwesomeIcon icon={faRotateRight} />
                Refresh
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              {loading && (
                <>
                  {[1, 2, 3].map((item) => (
                    <div className="h-28 animate-pulse rounded-xl bg-slate-100" key={item} />
                  ))}
                </>
              )}

              {!loading && questions.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
                  <FontAwesomeIcon className="text-2xl text-slate-300" icon={faCircleQuestion} />
                  <p className="mt-3 font-black text-slate-700">No questions yet</p>
                  <p className="mt-1 text-sm text-slate-500">Add the first question using the form.</p>
                </div>
              )}

              {!loading && questions.map((question, index) => (
                <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm" key={question.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-xs font-black text-violet-700">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-black text-slate-900">{question.text}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          Multiple choice · {question.points} point{question.points === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        aria-label="Move question up"
                        className={iconButtonClass}
                        disabled={index === 0 || reordering}
                        onClick={() => handleMove(index, -1)}
                        type="button"
                      >
                        <FontAwesomeIcon icon={faArrowUp} />
                      </button>
                      <button
                        aria-label="Move question down"
                        className={iconButtonClass}
                        disabled={index === questions.length - 1 || reordering}
                        onClick={() => handleMove(index, 1)}
                        type="button"
                      >
                        <FontAwesomeIcon icon={faArrowDown} />
                      </button>
                      <button
                        aria-label="Edit question"
                        className={iconButtonClass}
                        onClick={() => handleStartEdit(question)}
                        type="button"
                      >
                        <FontAwesomeIcon icon={faPen} />
                      </button>
                      <button
                        aria-label="Delete question"
                        className={dangerIconButtonClass}
                        disabled={deletingId === question.id}
                        onClick={() => handleDelete(question)}
                        type="button"
                      >
                        <FontAwesomeIcon icon={deletingId === question.id ? faRotateRight : faTrash} />
                      </button>
                    </div>
                  </div>

                  <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                    {optionLetters.map((letter, optionIndex) => {
                      const correct = question.correctAnswer === letter

                      return (
                        <li
                          className={`rounded-lg px-3 py-2 text-xs font-semibold ${correct ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600'}`}
                          key={letter}
                        >
                          <span className="font-black uppercase">{letter}.</span> {question.options[optionIndex]?.text || '—'}
                          {correct && <FontAwesomeIcon className="ml-2" icon={faCheck} />}
                        </li>
                      )
                    })}
                  </ul>

                  {question.explanation && (
                    <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                      <span className="font-black">Explanation:</span> {question.explanation}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </section>

          <section className="h-fit rounded-2xl border border-slate-200 bg-slate-50 p-5 xl:sticky xl:top-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-violet-600">
                  {editingQuestion ? 'Edit Question' : 'Add Question'}
                </p>
                <h4 className="mt-1 text-xl font-black text-slate-950">
                  {editingQuestion ? `Question #${questions.findIndex((item) => String(item.id) === String(editingQuestion.id)) + 1}` : 'New question'}
                </h4>
              </div>
              {editingQuestion && (
                <button className={secondaryButtonClass} onClick={resetForm} type="button">
                  Cancel
                </button>
              )}
            </div>

            <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
              <label className={labelClass}>
                Question Text
                <textarea
                  className="min-h-24 rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                  name="question"
                  onChange={handleFormChange}
                  placeholder="What do you want to ask?"
                  required
                  value={formData.question}
                />
              </label>

              <div className="grid gap-3">
                {optionLetters.map((letter) => (
                  <label className="grid gap-1.5 text-xs font-black uppercase tracking-wide text-slate-600" key={letter}>
                    Option {letter.toUpperCase()}
                    <input
                      className={inputClass}
                      name={`option_${letter}`}
                      onChange={handleFormChange}
                      required
                      type="text"
                      value={formData[`option_${letter}`]}
                    />
                  </label>
                ))}
              </div>

              <fieldset className="grid gap-2">
                <legend className="text-xs font-black uppercase tracking-wide text-slate-600">Correct Answer</legend>
                <div className="grid grid-cols-4 gap-2">
                  {optionLetters.map((letter) => (
                    <label
                      className={`flex h-10 cursor-pointer items-center justify-center gap-1 rounded-lg border text-xs font-black uppercase transition ${formData.correct_option === letter ? 'border-violet-500 bg-violet-600 text-white' : 'border-slate-200 bg-white text-slate-600'}`}
                      key={letter}
                    >
                      <input
                        checked={formData.correct_option === letter}
                        className="sr-only"
                        name="correct_option"
                        onChange={handleFormChange}
                        type="radio"
                        value={letter}
                      />
                      {letter}
                    </label>
                  ))}
                </div>
                <p className="text-xs font-medium text-slate-500">Exactly one correct answer is required.</p>
              </fieldset>

              <label className={labelClass}>
                Points
                <input
                  className={inputClass}
                  min="1"
                  name="points"
                  onChange={handleFormChange}
                  type="number"
                  value={formData.points}
                />
              </label>

              <label className={labelClass}>
                Explanation (optional)
                <textarea
                  className="min-h-20 rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                  name="explanation"
                  onChange={handleFormChange}
                  placeholder="Shown to admins and after grading."
                  value={formData.explanation}
                />
              </label>

              <button className={primaryButtonClass} disabled={saving} type="submit">
                <FontAwesomeIcon icon={editingQuestion ? faPen : faPlus} />
                {saving ? 'Saving...' : editingQuestion ? 'Update Question' : 'Add Question'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  )
}

const QuizzesPage = ({ searchQuery = '' }) => {
  const [quizzes, setQuizzes] = useState([])
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, required: 0 })
  const [meta, setMeta] = useState({ total: 0, currentPage: 1, lastPage: 1, perPage: PAGE_SIZE })
  const [page, setPage] = useState(1)
  const [courses, setCourses] = useState([])
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState('')
  const [formCourseFilter, setFormCourseFilter] = useState('')
  const [lessonFilter, setLessonFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [editingQuiz, setEditingQuiz] = useState(null)
  const [formData, setFormData] = useState(emptyQuizForm)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [togglingId, setTogglingId] = useState(null)
  const [questionQuiz, setQuestionQuiz] = useState(null)

  const searchTerm = search || searchQuery

  useEffect(() => {
    let isMounted = true

    Promise.allSettled([getCourses(), getLessons()])
      .then(([coursesResult, lessonsResult]) => {
        if (!isMounted) return

        if (coursesResult.status === 'fulfilled') {
          setCourses(coursesResult.value)
        }

        if (lessonsResult.status === 'fulfilled') {
          setLessons(lessonsResult.value.map((lesson) => ({
            id: lesson.id,
            title: lesson.title || lesson.name || 'Untitled lesson',
            courseId: lesson.course_id,
            courseTitle: lesson.course?.title || 'Unknown course',
          })))
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const loadQuizzes = useCallback(async (targetPage = 1) => {
    setLoading(true)
    setLoadError('')

    try {
      const result = await getAdminQuizzes({
        page: targetPage,
        perPage: PAGE_SIZE,
        search: searchTerm.trim(),
        courseId: courseFilter,
        lessonId: lessonFilter,
        status: statusFilter,
      })

      setQuizzes(result.items)
      setStats(result.stats)
      setMeta({
        total: result.total,
        currentPage: result.currentPage,
        lastPage: result.lastPage,
        perPage: result.perPage,
      })
      setPage(result.currentPage)
    } catch (requestError) {
      setLoadError(requestError.message)
      setQuizzes([])
    } finally {
      setLoading(false)
    }
  }, [courseFilter, lessonFilter, searchTerm, statusFilter])

  useEffect(() => {
    const timer = window.setTimeout(() => loadQuizzes(1), 250)

    return () => window.clearTimeout(timer)
  }, [loadQuizzes])

  const resetForm = () => {
    setEditingQuiz(null)
    setFormData(emptyQuizForm)
    setFormCourseFilter('')
    setFormError('')
  }

  const handleFormChange = (event) => {
    const { checked, name, type, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleStartEdit = (quiz) => {
    setEditingQuiz(quiz)
    setFormData({
      lesson_id: String(quiz.lessonId ?? ''),
      title: quiz.title === 'Untitled quiz' ? '' : quiz.title,
      description: quiz.description || '',
      passing_score: quiz.passingScore,
      max_attempts: quiz.maxAttempts,
      is_published: quiz.isPublished,
      is_required: quiz.isRequired,
    })
    setFormCourseFilter(quiz.courseId ? String(quiz.courseId) : '')
    setFormError('')
    setFormSuccess('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    setFormSuccess('')

    const payload = {
      lesson_id: Number(formData.lesson_id),
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      passing_score: Number(formData.passing_score),
      max_attempts: Number(formData.max_attempts),
      is_published: formData.is_published,
      is_required: formData.is_required,
    }

    try {
      if (editingQuiz) {
        await updateAdminQuiz(editingQuiz.id, payload)
        setFormSuccess(`Quiz "${payload.title}" updated.`)
        setEditingQuiz(null)
      } else {
        await createAdminQuiz(payload)
        setFormSuccess(`Quiz "${payload.title}" created.`)
        setFormData(emptyQuizForm)
        setFormCourseFilter('')
      }

      await loadQuizzes(editingQuiz ? page : 1)
    } catch (requestError) {
      setFormError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleTogglePublish = async (quiz) => {
    setTogglingId(quiz.id)
    setFormError('')
    setFormSuccess('')

    try {
      await updateAdminQuiz(quiz.id, { is_published: !quiz.isPublished })
      setFormSuccess(`Quiz "${quiz.title}" ${quiz.isPublished ? 'moved to draft' : 'published'}.`)
      await loadQuizzes(page)
    } catch (requestError) {
      setFormError(requestError.message)
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (quiz) => {
    const confirmed = window.confirm(`Delete quiz "${quiz.title}"? This also removes its questions. This cannot be undone.`)

    if (!confirmed) return

    setDeletingId(quiz.id)
    setFormError('')
    setFormSuccess('')

    try {
      await deleteAdminQuiz(quiz.id)
      setFormSuccess(`Quiz "${quiz.title}" deleted.`)

      if (String(editingQuiz?.id) === String(quiz.id)) {
        resetForm()
      }

      const nextPage = quizzes.length === 1 && page > 1 ? page - 1 : page
      await loadQuizzes(nextPage)
    } catch (requestError) {
      setFormError(requestError.message)
    } finally {
      setDeletingId(null)
    }
  }

  const handleQuestionsChanged = useCallback(() => {
    loadQuizzes(page)
  }, [loadQuizzes, page])

  const formLessons = useMemo(() => (
    formCourseFilter
      ? lessons.filter((lesson) => String(lesson.courseId) === String(formCourseFilter))
      : lessons
  ), [formCourseFilter, lessons])

  const libraryLessons = useMemo(() => (
    courseFilter
      ? lessons.filter((lesson) => String(lesson.courseId) === String(courseFilter))
      : lessons
  ), [courseFilter, lessons])

  const selectedLesson = lessons.find((lesson) => String(lesson.id) === String(formData.lesson_id))
  const resolvedCourseName = selectedLesson?.courseTitle
    || (editingQuiz?.course?.title ?? '')

  const from = meta.total === 0 ? 0 : (meta.currentPage - 1) * meta.perPage + 1
  const to = Math.min(meta.currentPage * meta.perPage, meta.total)
  const hasFilters = Boolean(searchTerm.trim() || courseFilter || lessonFilter || statusFilter)

  return (
    <div className="px-4 py-6 sm:px-6 xl:px-8">
      <AdminPageHeader
        title="Quiz Management"
        text="Create and manage quizzes for course lessons."
      >
        <button className={secondaryButtonClass} onClick={() => loadQuizzes(page)} type="button">
          <FontAwesomeIcon icon={faRotateRight} />
          Refresh
        </button>
      </AdminPageHeader>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total Quizzes', value: stats.total, icon: faClipboardQuestion, tone: 'bg-violet-100 text-violet-700' },
          { label: 'Published', value: stats.published, icon: faEye, tone: 'bg-emerald-100 text-emerald-700' },
          { label: 'Draft', value: stats.draft, icon: faEyeSlash, tone: 'bg-slate-100 text-slate-600' },
          { label: 'Required', value: stats.required, icon: faCircleCheck, tone: 'bg-amber-100 text-amber-700' },
        ].map((stat) => (
          <article className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/50" key={stat.label}>
            <div>
              <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
              <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{Number(stat.value).toLocaleString()}</p>
            </div>
            <span className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${stat.tone}`}>
              <FontAwesomeIcon icon={stat.icon} />
            </span>
          </article>
        ))}
      </div>

      {(loadError || formError || formSuccess) && (
        <div className="mt-5 space-y-2">
          {loadError && (
            <p className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              <FontAwesomeIcon className="mt-0.5" icon={faTriangleExclamation} />
              {loadError}
            </p>
          )}
          {formError && (
            <p className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              <FontAwesomeIcon className="mt-0.5" icon={faTriangleExclamation} />
              {formError}
            </p>
          )}
          {formSuccess && (
            <p className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              <FontAwesomeIcon className="mt-0.5" icon={faCircleCheck} />
              {formSuccess}
            </p>
          )}
        </div>
      )}

      <section className="mt-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/50 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-violet-600">{editingQuiz ? 'Edit Quiz' : 'Create Quiz'}</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">{editingQuiz ? editingQuiz.title : 'Add a new quiz'}</h2>
            <p className="mt-1 text-sm text-slate-500">
              Choose a course to narrow the lessons, then pick the lesson that owns this quiz.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {editingQuiz && (
              <button className={secondaryButtonClass} onClick={resetForm} type="button">
                <FontAwesomeIcon icon={faXmark} />
                Cancel Edit
              </button>
            )}
            <button className={secondaryButtonClass} onClick={resetForm} type="button">
              <FontAwesomeIcon icon={faRotateRight} />
              Reset
            </button>
          </div>
        </div>

        <form className="mt-5 grid gap-4 lg:grid-cols-2" onSubmit={handleSubmit}>
          <label className={labelClass}>
            Course (filter)
            <select
              className={inputClass}
              onChange={(event) => {
                setFormCourseFilter(event.target.value)
                setFormData((previous) => ({ ...previous, lesson_id: '' }))
              }}
              value={formCourseFilter}
            >
              <option value="">All courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </label>

          <label className={labelClass}>
            Lesson
            <select
              className={inputClass}
              name="lesson_id"
              onChange={handleFormChange}
              required
              value={formData.lesson_id}
            >
              <option value="">Select a lesson</option>
              {formLessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {formCourseFilter ? lesson.title : `${lesson.courseTitle} — ${lesson.title}`}
                </option>
              ))}
            </select>
            {resolvedCourseName && (
              <span className="text-xs font-medium text-slate-500">Course: {resolvedCourseName}</span>
            )}
          </label>

          <label className={labelClass}>
            Quiz Title
            <input
              className={inputClass}
              name="title"
              onChange={handleFormChange}
              placeholder="Lesson checkpoint"
              required
              type="text"
              value={formData.title}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              Passing Score (%)
              <input
                className={inputClass}
                max="100"
                min="60"
                name="passing_score"
                onChange={handleFormChange}
                type="number"
                value={formData.passing_score}
              />
            </label>

            <label className={labelClass}>
              Max Attempts
              <input
                className={inputClass}
                min="0"
                name="max_attempts"
                onChange={handleFormChange}
                type="number"
                value={formData.max_attempts}
              />
              <span className="text-xs font-medium text-slate-500">0 = unlimited</span>
            </label>
          </div>

          <label className={`${labelClass} lg:col-span-2`}>
            Description
            <textarea
              className="min-h-24 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
              name="description"
              onChange={handleFormChange}
              placeholder="What does this quiz cover?"
              value={formData.description}
            />
          </label>

          <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
            <input
              checked={formData.is_published}
              className="h-5 w-5 rounded border-slate-300 text-violet-600 focus:ring-violet-400"
              name="is_published"
              onChange={handleFormChange}
              type="checkbox"
            />
            Published for students
          </label>

          <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
            <input
              checked={formData.is_required}
              className="h-5 w-5 rounded border-slate-300 text-violet-600 focus:ring-violet-400"
              name="is_required"
              onChange={handleFormChange}
              type="checkbox"
            />
            Required to finish the lesson
          </label>

          <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
            <button className={primaryButtonClass} disabled={saving} type="submit">
              <FontAwesomeIcon icon={editingQuiz ? faPen : faPlus} />
              {saving ? 'Saving...' : editingQuiz ? 'Save Changes' : 'Add Quiz'}
            </button>
            <p className="text-xs font-medium text-slate-500">
              Passing score must be 60-100. Required quizzes are enforced by the certificate rule.
            </p>
          </div>
        </form>
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-lg shadow-slate-200/50">
        <div className="border-b border-slate-100 p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950">Quiz Library</h2>
              <p className="mt-1 text-sm text-slate-500">Showing {from}-{to} of {meta.total} quizzes</p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <div className="relative">
                <FontAwesomeIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" icon={faMagnifyingGlass} />
                <input
                  aria-label="Search quizzes"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-semibold outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search quiz title..."
                  type="search"
                  value={searchTerm}
                />
              </div>

              <select
                aria-label="Filter by course"
                className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-violet-400 focus:bg-white"
                onChange={(event) => {
                  setCourseFilter(event.target.value)
                  setLessonFilter('')
                }}
                value={courseFilter}
              >
                <option value="">All courses</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>

              <select
                aria-label="Filter by lesson"
                className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-violet-400 focus:bg-white"
                onChange={(event) => setLessonFilter(event.target.value)}
                value={lessonFilter}
              >
                <option value="">All lessons</option>
                {libraryLessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>{lesson.title}</option>
                ))}
              </select>

              <select
                aria-label="Filter by status"
                className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-violet-400 focus:bg-white"
                onChange={(event) => setStatusFilter(event.target.value)}
                value={statusFilter}
              >
                <option value="">All statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-4 py-3">Quiz Title</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Lesson</th>
                <th className="px-4 py-3">Questions</th>
                <th className="px-4 py-3">Passing</th>
                <th className="px-4 py-3">Max Attempts</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Required</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <>
                  {[1, 2, 3, 4].map((row) => (
                    <tr key={row}>
                      <td className="px-4 py-4" colSpan={9}>
                        <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                      </td>
                    </tr>
                  ))}
                </>
              )}

              {!loading && quizzes.length === 0 && (
                <tr>
                  <td className="px-4 py-12 text-center" colSpan={9}>
                    <FontAwesomeIcon className="text-3xl text-slate-300" icon={faClipboardQuestion} />
                    <p className="mt-3 font-black text-slate-700">
                      {hasFilters ? 'No quizzes match these filters.' : 'No quizzes yet.'}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {hasFilters ? 'Try a different search or filter.' : 'Create your first quiz using the form above.'}
                    </p>
                  </td>
                </tr>
              )}

              {!loading && quizzes.map((quiz) => (
                <tr className="transition hover:bg-slate-50/70" key={quiz.id}>
                  <td className="px-4 py-4">
                    <p className="font-black text-slate-900">{quiz.title}</p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-500">
                      #{quiz.id} · {formatDate(quiz.createdAt)}
                    </p>
                  </td>
                  <td className="max-w-44 truncate px-4 py-4 text-xs font-semibold text-slate-600">
                    {quiz.course?.title || 'Unknown course'}
                  </td>
                  <td className="max-w-44 truncate px-4 py-4 text-xs font-semibold text-slate-600">
                    {quiz.lesson?.title || 'Unknown lesson'}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${quiz.questionsCount > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {quiz.questionsCount}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs font-black text-slate-700">{quiz.passingScore}%</td>
                  <td className="px-4 py-4 text-xs font-semibold text-slate-600">
                    {quiz.maxAttempts === 0 ? 'Unlimited' : quiz.maxAttempts}
                  </td>
                  <td className="px-4 py-4"><StatusBadge published={quiz.isPublished} /></td>
                  <td className="px-4 py-4"><RequiredBadge required={quiz.isRequired} /></td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-1.5">
                      <button
                        aria-label={`View questions for ${quiz.title}`}
                        className={iconButtonClass}
                        onClick={() => setQuestionQuiz(quiz)}
                        title="View Questions"
                        type="button"
                      >
                        <FontAwesomeIcon icon={faCircleQuestion} />
                      </button>
                      <button
                        aria-label={`Add questions to ${quiz.title}`}
                        className={iconButtonClass}
                        onClick={() => setQuestionQuiz(quiz)}
                        title="Add Questions"
                        type="button"
                      >
                        <FontAwesomeIcon icon={faPlus} />
                      </button>
                      <button
                        aria-label={`${quiz.isPublished ? 'Unpublish' : 'Publish'} ${quiz.title}`}
                        className={iconButtonClass}
                        disabled={togglingId === quiz.id}
                        onClick={() => handleTogglePublish(quiz)}
                        title={quiz.isPublished ? 'Unpublish' : 'Publish'}
                        type="button"
                      >
                        <FontAwesomeIcon icon={togglingId === quiz.id ? faRotateRight : quiz.isPublished ? faEyeSlash : faEye} />
                      </button>
                      <button
                        aria-label={`Edit ${quiz.title}`}
                        className={iconButtonClass}
                        onClick={() => handleStartEdit(quiz)}
                        title="Edit"
                        type="button"
                      >
                        <FontAwesomeIcon icon={faPen} />
                      </button>
                      <button
                        aria-label={`Delete ${quiz.title}`}
                        className={dangerIconButtonClass}
                        disabled={deletingId === quiz.id}
                        onClick={() => handleDelete(quiz)}
                        title="Delete"
                        type="button"
                      >
                        <FontAwesomeIcon icon={deletingId === quiz.id ? faRotateRight : faTrash} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold text-slate-500">Page {meta.currentPage} of {meta.lastPage}</p>
          <div className="flex gap-2">
            <button
              className={secondaryButtonClass}
              disabled={loading || meta.currentPage <= 1}
              onClick={() => loadQuizzes(meta.currentPage - 1)}
              type="button"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
              Previous
            </button>
            <button
              className={secondaryButtonClass}
              disabled={loading || meta.currentPage >= meta.lastPage}
              onClick={() => loadQuizzes(meta.currentPage + 1)}
              type="button"
            >
              Next
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        </div>
      </section>

      {questionQuiz && (
        <QuestionManagerModal
          onChanged={handleQuestionsChanged}
          onClose={() => setQuestionQuiz(null)}
          quiz={questionQuiz}
        />
      )}
    </div>
  )
}

export default QuizzesPage
