import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCircleExclamation,
  faClipboardQuestion,
  faRotateLeft,
} from '@fortawesome/free-solid-svg-icons'
import {
  getCourse,
  getMyCourses,
  getQuestionsForQuiz,
  getQuizAttempts,
  getQuizzesForCourse,
  submitQuizAttempt,
} from '../../lib/courseApi'
import { getCurrentUser } from '../../lib/authApi'

const letters = ['A', 'B', 'C', 'D', 'E']

const getCorrectIndex = (question) => {
  const answer = question?.correctAnswer

  if (answer === null || answer === undefined || answer === '') return null

  if (typeof answer === 'number') {
    if (answer >= 1 && answer <= question.options.length) return answer - 1
    return answer
  }

  if (typeof answer !== 'string') return null

  const normalized = answer.trim().toLowerCase().replace(/^option[_\s-]?/, '')
  const letterIndex = letters.findIndex((letter) => letter.toLowerCase() === normalized)

  if (letterIndex !== -1) return letterIndex

  if (/^\d+$/.test(normalized)) return Number(normalized) - 1

  return question.options.findIndex(
    (option) => String(option?.text || '').trim().toLowerCase() === normalized,
  )
}

const isCourseEnrolled = (courseId, myCourses, course) => {
  if (course?.raw?.is_free) return true
  if (course?.raw?.has_access || course?.raw?.is_enrolled) return true

  return myCourses.some((item) => String(item.id) === String(courseId))
}

const QuizPage = () => {
  const query = new URLSearchParams(window.location.search)
  const courseId = query.get('course')
  const [course, setCourse] = useState(null)
  const [quizzes, setQuizzes] = useState([])
  const [currentQuiz, setCurrentQuiz] = useState(null)
  const [questions, setQuestions] = useState([])
  const [attempts, setAttempts] = useState([])
  const [answers, setAnswers] = useState({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState(null)
  const [submitError, setSubmitError] = useState('')
  const [hasAccess, setHasAccess] = useState(null)
  const [isFetching, setIsFetching] = useState(true)
  const [loadError, setLoadError] = useState('')
  const isLoading = isFetching && Boolean(courseId)

  const resetAttempt = () => {
    setAnswers({})
    setIsSubmitted(false)
    setSubmitResult(null)
    setSubmitError('')
  }

  const selectQuiz = (quiz) => {
    if (!quiz) return

    setCurrentQuiz(quiz)
    setAttempts([])
    resetAttempt()
    window.history.replaceState(null, '', `/quiz?course=${courseId}&quiz=${quiz.id}`)
  }

  useEffect(() => {
    let isMounted = true

    getCurrentUser().catch(() => {
      if (!isMounted) return

      const redirectPath = encodeURIComponent(window.location.pathname + window.location.search)
      window.location.replace(`/login?redirect=${redirectPath}`)
    })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!courseId) return undefined

    let isMounted = true

    Promise.allSettled([
      getCourse(courseId),
      getQuizzesForCourse(courseId),
      getMyCourses(),
    ]).then(([courseResult, quizzesResult, myCoursesResult]) => {
      if (!isMounted) return

      const backendCourse = courseResult.status === 'fulfilled' ? courseResult.value : null
      const backendQuizzes = quizzesResult.status === 'fulfilled' ? quizzesResult.value : []
      const myCourses = myCoursesResult.status === 'fulfilled' ? myCoursesResult.value : []

      if (courseResult.status === 'rejected') {
        setLoadError(courseResult.reason?.status === 404
          ? 'This course could not be found.'
          : `Could not load the course from the backend. ${courseResult.reason?.message || 'Unknown error'}`)
      }

      setCourse(backendCourse)
      setQuizzes(backendQuizzes)

      const requestedQuizId = query.get('quiz')
      const requested = backendQuizzes.find((quiz) => String(quiz.id) === String(requestedQuizId))
        || backendQuizzes[0]
        || null

      setHasAccess(isCourseEnrolled(courseId, myCourses, backendCourse))
      setCurrentQuiz(requested)
    }).finally(() => {
      if (isMounted) setIsFetching(false)
    })

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId])

  useEffect(() => {
    if (!currentQuiz?.id) return undefined

    let isMounted = true

    Promise.allSettled([
      getQuestionsForQuiz(currentQuiz.id),
      getQuizAttempts(currentQuiz.id),
    ]).then(([questionsResult, attemptsResult]) => {
      if (!isMounted) return

      setQuestions(questionsResult.status === 'fulfilled' ? questionsResult.value : [])
      setAttempts(attemptsResult.status === 'fulfilled' ? attemptsResult.value : [])
    })

    return () => {
      isMounted = false
    }
  }, [currentQuiz?.id])

  const attemptsUsed = attempts.length
  const maxAttempts = currentQuiz?.maxAttempts ?? 0
  const attemptLimitReached = maxAttempts > 0 && attemptsUsed >= maxAttempts
  const bestAttempt = attempts.reduce(
    (best, attempt) => (!best || attempt.score > best.score ? attempt : best),
    null,
  )
  const hasPassedAttempt = attempts.some((attempt) => attempt.passed)
  const score = submitResult?.score ?? null

  const selectAnswer = (questionId, optionIndex) => {
    if (isSubmitted) return
    setAnswers((current) => ({ ...current, [questionId]: optionIndex }))
  }

  const handleSubmit = async () => {
    if (
      Object.keys(answers).length < questions.length
      || isSubmitting
      || attemptLimitReached
    ) return

    const payload = {}

    questions.forEach((question) => {
      const optionIndex = answers[question.id]
      if (optionIndex === undefined || optionIndex === null) return

      payload[question.id] = letters[optionIndex]?.toLowerCase()
    })

    setIsSubmitting(true)
    setSubmitError('')

    try {
      const result = await submitQuizAttempt(currentQuiz.id, payload)
      setSubmitResult(result)
      setAttempts((current) => [...current, result])
      setIsSubmitted(true)
    } catch (error) {
      setSubmitError(error.message || 'Could not submit your quiz attempt.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#f7f8ff] px-6 text-slate-700">
        <div>
          <p className="text-lg font-bold text-[#111827]">Loading quiz...</p>
          <p className="mt-2 text-sm">Preparing your quiz questions.</p>
        </div>
      </main>
    )
  }

  if (!courseId) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#f7f8ff] px-6 text-slate-700">
        <div className="max-w-md rounded-xl border border-slate-300 bg-white p-8 text-center shadow-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-xl text-amber-500">
            <FontAwesomeIcon icon={faCircleExclamation} />
          </span>
          <h1 className="mt-4 text-xl font-black">No course was selected.</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Open a quiz from My Courses.
          </p>
          <a
            className="mt-6 inline-flex h-12 items-center justify-center rounded-lg bg-[#302be2] px-7 text-sm font-black text-white transition hover:bg-[#1916b8]"
            href="/my-courses"
          >
            Back to My Courses
          </a>
        </div>
      </main>
    )
  }

  if (hasAccess === false) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#f7f8ff] px-6 text-slate-700">
        <div className="max-w-md rounded-xl border border-slate-300 bg-white p-8 text-center shadow-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-xl text-red-500">
            <FontAwesomeIcon icon={faCircleExclamation} />
          </span>
          <h1 className="mt-4 text-xl font-black">You do not have access to this course.</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Buy this course to unlock its quizzes.
          </p>
          <a
            className="mt-6 inline-flex h-12 items-center justify-center rounded-lg bg-[#302be2] px-7 text-sm font-black text-white transition hover:bg-[#1916b8]"
            href={`/course-detail?course=${courseId}`}
          >
            View Course
          </a>
        </div>
      </main>
    )
  }

  return (
    <main className="bg-[#f7f8ff] px-4 py-10 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-wide text-[#302be2]">
              <FontAwesomeIcon icon={faClipboardQuestion} />
              Quiz
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">{course?.title}</h1>
          </div>
          <a
            className="text-sm font-semibold text-[#302be2] transition hover:text-[#1916b8]"
            href="/my-courses"
          >
            Back to My Courses
          </a>
        </div>

        {loadError && (
          <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            {loadError}
          </p>
        )}

        {!loadError && quizzes.length === 0 && (
          <div className="mt-8 rounded-xl border border-slate-300 bg-white p-12 text-center shadow-sm">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-xl text-[#302be2]">
              <FontAwesomeIcon icon={faClipboardQuestion} />
            </span>
            <h2 className="mt-4 text-xl font-black">No quizzes published yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              The instructor has not added quizzes to this course yet.
            </p>
            <a
              className="mt-6 inline-flex h-12 items-center justify-center rounded-lg bg-[#302be2] px-7 text-sm font-black text-white transition hover:bg-[#1916b8]"
              href={`/course-detail?course=${courseId}`}
            >
              Back to Course
            </a>
          </div>
        )}

        {currentQuiz && (
          <div className="mt-8 space-y-6">
            <div className="rounded-xl border border-slate-300 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-black">{currentQuiz.title}</h2>
                  {currentQuiz.description && (
                    <p className="mt-2 text-sm leading-6 text-slate-600">{currentQuiz.description}</p>
                  )}
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    {questions.length || currentQuiz.questionsCount} question{(questions.length || currentQuiz.questionsCount) === 1 ? '' : 's'}
                    {' · '}Passing score {currentQuiz.passingScore}%
                    {' · '}Attempts {attemptsUsed}
                    {maxAttempts > 0 ? `/${maxAttempts}` : ' (unlimited)'}
                  </p>
                  {bestAttempt && (
                    <p className="mt-1 text-xs font-bold text-slate-600">
                      Best score: {bestAttempt.score}% ({bestAttempt.passed ? 'Passed' : 'Not passed'})
                    </p>
                  )}
                </div>
                {quizzes.length > 1 && (
                  <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
                    Switch quiz
                    <select
                      className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold outline-none transition focus:border-[#302be2] focus:ring-4 focus:ring-indigo-100"
                      onChange={(event) => {
                        const quiz = quizzes.find((item) => String(item.id) === event.target.value)
                        selectQuiz(quiz)
                      }}
                      value={currentQuiz.id}
                    >
                      {quizzes.map((quiz) => (
                        <option key={quiz.id} value={quiz.id}>
                          {quiz.title}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm text-slate-600 shadow-sm">
              <span>{questions.length} question{questions.length === 1 ? '' : 's'} · Pass mark {currentQuiz.passingScore}%</span>
              <span className="font-black text-[#302be2]">
                Attempts used: {attemptsUsed}
                {maxAttempts > 0 ? `/${maxAttempts}` : ''}
              </span>
            </div>

            {questions.length === 0 && (
              <p className="rounded-xl border border-slate-300 bg-white p-8 text-center text-sm font-semibold text-slate-500 shadow-sm">
                No questions have been added to this quiz yet.
              </p>
            )}

            {questions.length > 0 && (
              <div className="space-y-6">
                {questions.map((question, questionIndex) => {
                  const selectedIndex = answers[question.id]
                  const attemptAnswer = submitResult?.answersByQuestion?.[question.id]
                  const correctIndex = isSubmitted
                    ? (submitResult
                        ? getCorrectIndex({ ...question, correctAnswer: attemptAnswer?.correctOption })
                        : getCorrectIndex(question))
                    : null

                  return (
                    <div
                      className="rounded-xl border border-slate-300 bg-white p-6 shadow-sm sm:p-8"
                      key={question.id || `${currentQuiz.id}-${questionIndex}`}
                    >
                      <h3 className="font-black">
                        <span className="text-[#302be2]">{questionIndex + 1}.</span>{' '}
                        {question.text}
                      </h3>

                      <div className="mt-5 grid gap-3">
                        {question.options.map((option, optionIndex) => {
                          const isSelected = selectedIndex === optionIndex
                          const showCorrect = isSubmitted && correctIndex === optionIndex
                          const showWrong = isSubmitted && isSelected && correctIndex !== null && correctIndex !== optionIndex
                          const showReveal = isSubmitted && correctIndex === null && isSelected

                          return (
                            <label
                              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3.5 text-sm transition ${
                                showCorrect
                                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                  : showWrong
                                    ? 'border-red-300 bg-red-50 text-red-700'
                                    : showReveal
                                      ? 'border-slate-300 bg-slate-50 text-slate-800'
                                      : isSelected
                                        ? 'border-[#302be2] bg-indigo-50 text-[#302be2]'
                                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                              key={`${question.id}-${optionIndex}`}
                            >
                              <input
                                className="h-4 w-4 accent-[#302be2]"
                                checked={isSelected}
                                disabled={isSubmitted}
                                name={`question-${question.id}`}
                                onChange={() => selectAnswer(question.id, optionIndex)}
                                type="radio"
                              />
                              <span className="font-black">{letters[optionIndex]}.</span>
                              <span>{option.text}</span>
                              {showCorrect && <span className="ml-auto text-xs font-black">Correct</span>}
                              {showWrong && <span className="ml-auto text-xs font-black">Wrong</span>}
                            </label>
                          )
                        })}
                      </div>

                      {isSubmitted && question.explanation && (
                        <p className="mt-4 rounded-lg bg-indigo-50 px-4 py-3 text-sm text-slate-700">
                          {question.explanation}
                        </p>
                      )}
                    </div>
                  )
                })}

                {submitError && (
                  <p className="rounded-lg bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
                    {submitError}
                  </p>
                )}

                {!isSubmitted && attemptLimitReached && !hasPassedAttempt && (
                  <p className="rounded-lg bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-800">
                    You have used all {maxAttempts} attempts for this quiz and did not reach the pass mark.
                  </p>
                )}

                {!isSubmitted && attemptLimitReached && hasPassedAttempt && (
                  <p className="rounded-lg bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800">
                    You have already passed this quiz with a best score of {bestAttempt?.score ?? 0}%.
                  </p>
                )}

                {!isSubmitted && !attemptLimitReached && (
                  <button
                    className="h-14 w-full rounded-lg bg-[#302be2] text-sm font-black text-white transition hover:bg-[#1916b8] disabled:cursor-not-allowed disabled:bg-slate-400"
                    disabled={Object.keys(answers).length < questions.length || isSubmitting}
                    onClick={handleSubmit}
                    type="button"
                  >
                    {isSubmitting
                      ? 'Submitting your answers...'
                      : Object.keys(answers).length < questions.length
                        ? `Answer all ${questions.length} questions to submit`
                        : 'Submit Answers'}
                  </button>
                )}

                {isSubmitted && submitResult && (
                  <>
                    <div className={`rounded-xl border p-5 ${
                      submitResult.passed
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-red-200 bg-red-50'
                    }`}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${
                          submitResult.passed
                            ? 'bg-emerald-600 text-white'
                            : 'bg-red-600 text-white'
                        }`}>
                          {submitResult.passed ? 'PASS' : 'FAIL'}
                        </span>
                        <span className="text-xs font-bold text-slate-600">
                          Attempt {submitResult.attemptNumber}
                          {maxAttempts > 0 ? ` of ${maxAttempts}` : ''}
                        </span>
                      </div>

                      <p className={`mt-4 text-sm font-semibold ${
                        submitResult.passed ? 'text-emerald-800' : 'text-red-700'
                      }`}>
                        {submitResult.passed
                          ? 'You passed this quiz.'
                          : `You need ${currentQuiz.passingScore}% to pass this quiz.`}
                      </p>

                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-lg bg-white/70 px-4 py-3">
                          <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">Score</p>
                          <p className="mt-1 text-lg font-black text-slate-900">{score}%</p>
                        </div>
                        <div className="rounded-lg bg-white/70 px-4 py-3">
                          <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">Correct</p>
                          <p className="mt-1 text-lg font-black text-slate-900">
                            {submitResult.correctAnswers}/{submitResult.totalQuestions}
                          </p>
                        </div>
                        <div className="rounded-lg bg-white/70 px-4 py-3">
                          <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">Passing score</p>
                          <p className="mt-1 text-lg font-black text-slate-900">{currentQuiz.passingScore}%</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {!attemptLimitReached && (
                        <button
                          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                          onClick={resetAttempt}
                          type="button"
                        >
                          <FontAwesomeIcon icon={faRotateLeft} />
                          Try Again
                        </button>
                      )}
                      <a
                        className="inline-flex h-12 items-center justify-center rounded-lg bg-[#302be2] px-6 text-sm font-black text-white transition hover:bg-[#1916b8]"
                        href={currentQuiz.lessonId
                          ? `/lesson?course=${courseId}&lesson=${currentQuiz.lessonId}`
                          : `/lesson?course=${courseId}`}
                      >
                        Back to Lesson
                      </a>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  )
}

export default QuizPage