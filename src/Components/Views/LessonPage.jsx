import { useEffect, useMemo, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCertificate,
  faCheck,
  faChevronLeft,
  faChevronRight,
  faCircleExclamation,
  faClipboardQuestion,
  faClock,
  faDownload,
  faLock,
  faPlay,
  faQrcode,
  faSpinner,
  faVideo,
} from '@fortawesome/free-solid-svg-icons'
import {
  claimCertificate,
  downloadCertificatePdf,
  getCertificates,
  getCourse,
  getCourseProgress,
  getLessonsForCourse,
  getMyCourses,
  markLessonComplete,
  unmarkLessonComplete,
} from '../../lib/courseApi'
import { createPayment } from '../../lib/paymentApi'
import { getEmbedVideoUrl, isVideoFile } from '../../lib/videoUtils'

const formatCertificateDate = (value) => {
  if (!value) return ''

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString()
}

const isCourseEnrolled = (courseId, myCourses, course) => {
  if (course?.raw?.is_free) return true
  if (course?.raw?.has_access || course?.raw?.is_enrolled) return true

  return myCourses.some((item) => String(item.id) === String(courseId))
}

const LessonPage = () => {
  const query = new URLSearchParams(window.location.search)
  const courseId = query.get('course')
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [currentLesson, setCurrentLesson] = useState(null)
  const [courseProgress, setCourseProgress] = useState(null)
  const [certificates, setCertificates] = useState([])
  const [hasAccess, setHasAccess] = useState(null)
  const [isFetching, setIsFetching] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [progressError, setProgressError] = useState('')
  const [certificateError, setCertificateError] = useState('')
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false)
  const [isClaimingCertificate, setIsClaimingCertificate] = useState(false)
  const [isDownloadingCertificate, setIsDownloadingCertificate] = useState(false)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [unlockError, setUnlockError] = useState('')

  useEffect(() => {
    if (!courseId) return undefined

    let isMounted = true

    Promise.allSettled([
      getCourse(courseId),
      getLessonsForCourse(courseId),
      getMyCourses(),
      getCourseProgress(courseId),
      getCertificates(),
    ])
      .then(([courseResult, lessonsResult, myCoursesResult, progressResult, certificatesResult]) => {
        if (!isMounted) return

        const backendCourse = courseResult.status === 'fulfilled' ? courseResult.value : null
        const backendLessons = lessonsResult.status === 'fulfilled' ? lessonsResult.value : []
        const myCourses = myCoursesResult.status === 'fulfilled' ? myCoursesResult.value : []

        if (courseResult.status === 'rejected') {
          setLoadError(courseResult.reason?.status === 404
            ? 'This course could not be found.'
            : `Could not load the course from the backend. ${courseResult.reason?.message || 'Unknown error'}`)
        }

        if (progressResult.status === 'rejected' && progressResult.reason?.status !== 403) {
          setProgressError(progressResult.reason?.message || 'Course progress could not be loaded.')
        }

        setCourse(backendCourse)
        setLessons(backendLessons)
        setHasAccess(isCourseEnrolled(courseId, myCourses, backendCourse))
        setCourseProgress(progressResult.status === 'fulfilled' ? progressResult.value : null)
        setCertificates(certificatesResult.status === 'fulfilled' ? certificatesResult.value : [])

        const requestedLessonId = query.get('lesson')
        const requested = backendLessons.find(
          (lesson) => String(lesson.id) === String(requestedLessonId),
        ) || backendLessons[0] || null

        setCurrentLesson(requested)
      })
      .finally(() => {
        if (isMounted) {
          setIsFetching(false)
        }
      })

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId])

  const completedLessons = useMemo(
    () => new Set(
      (courseProgress?.lessons || [])
        .filter((lesson) => lesson.is_completed)
        .map((lesson) => lesson.id),
    ),
    [courseProgress],
  )

  const progressByLesson = useMemo(
    () => new Map((courseProgress?.lessons || []).map((lesson) => [lesson.id, lesson])),
    [courseProgress],
  )

  const currentIndex = useMemo(
    () => lessons.findIndex((lesson) => lesson.id === currentLesson?.id),
    [lessons, currentLesson],
  )

  const previousLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null
  const nextLesson = currentIndex >= 0 && currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null
  const currentLessonProgress = progressByLesson.get(currentLesson?.id) || null
  const currentQuizzes = currentLessonProgress?.quizzes || []
  const currentLessonCompleted = Boolean(currentLessonProgress?.is_completed)
  const requiredQuizMissing = currentQuizzes.some((quiz) => quiz.isRequired && !quiz.passed)
  const courseCertificate = certificates.find(
    (certificate) => String(certificate.courseId) === String(courseId),
  ) || null
  const allLessonsCompleted = Boolean(courseProgress?.isComplete)
  const requiredQuizzesSatisfied = Boolean(courseProgress?.quizzes?.satisfied)
  const certificateEligible = Boolean(courseProgress?.certificate?.eligible)

  const selectLesson = (lesson) => {
    if (!lesson) return

    setCurrentLesson(lesson)
    window.history.replaceState(
      null,
      '',
      `/lesson?course=${courseId}&lesson=${lesson.id}`,
    )
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const refreshCourseData = async () => {
    const [freshProgress, freshCertificates] = await Promise.all([
      getCourseProgress(courseId),
      getCertificates().catch(() => null),
    ])

    setCourseProgress(freshProgress)

    if (freshCertificates) {
      setCertificates(freshCertificates)
    }
  }

  const toggleComplete = async () => {
    if (!currentLesson?.id || isUpdatingProgress) return

    setIsUpdatingProgress(true)
    setProgressError('')

    try {
      if (currentLessonCompleted) {
        await unmarkLessonComplete(currentLesson.id)
      } else {
        if (requiredQuizMissing) {
          throw new Error('Pass every required quiz before completing this lesson.')
        }

        await markLessonComplete(currentLesson.id)
      }

      await refreshCourseData()

      if (!currentLessonCompleted && nextLesson) {
        selectLesson(nextLesson)
      }
    } catch (error) {
      setProgressError(error.message || 'Your lesson progress could not be saved.')
    } finally {
      setIsUpdatingProgress(false)
    }
  }

  const handleDownloadCertificate = async () => {
    if (!courseCertificate?.id || isDownloadingCertificate) return

    setIsDownloadingCertificate(true)
    setCertificateError('')

    try {
      await downloadCertificatePdf(courseCertificate.id)
    } catch (error) {
      setCertificateError(error.message || 'The certificate PDF could not be downloaded.')
    } finally {
      setIsDownloadingCertificate(false)
    }
  }

  const handleClaimCertificate = async () => {
    if (!courseId || isClaimingCertificate) return

    setIsClaimingCertificate(true)
    setCertificateError('')

    try {
      await claimCertificate(courseId)
      await refreshCourseData()
    } catch (error) {
      setCertificateError(error.message || 'Your certificate could not be issued.')
    } finally {
      setIsClaimingCertificate(false)
    }
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
            Open a lesson from My Courses.
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

  if (isFetching) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#f7f8ff] px-6 text-slate-700">
        <div>
          <p className="text-lg font-bold text-[#111827]">Loading lesson...</p>
          <p className="mt-2 text-sm">Preparing your course content.</p>
        </div>
      </main>
    )
  }

  const handleUnlockWithQr = async () => {
    if (!courseId) return
    setIsUnlocking(true)
    setUnlockError('')
    try {
      const payment = await createPayment(courseId)
      if (payment.status === 'paid') {
        window.location.reload()
        return
      }
      sessionStorage.setItem(`payment_draft_${payment.id}`, JSON.stringify({
        ...payment,
        courseTitle: course?.title || '',
        paidLabel: course?.price || '',
      }))
      window.location.href = `/payment/${payment.id}`
    } catch (err) {
      setUnlockError(err.message || 'Failed to create payment QR.')
    } finally {
      setIsUnlocking(false)
    }
  }

  if (hasAccess === false) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#f7f8ff] px-6 text-slate-700">
        <div className="max-w-md rounded-xl border border-slate-300 bg-white p-8 text-center shadow-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-xl text-[#302be2]">
            <FontAwesomeIcon icon={faQrcode} />
          </span>
          <h1 className="mt-4 text-xl font-black">Course Video Locked</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Get your PayWay QR code now. Once payment is confirmed, the full video will unlock automatically.
          </p>
          {unlockError && (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700">{unlockError}</p>
          )}
          <div className="mt-6 grid gap-3">
            <button
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#302be2] px-7 text-sm font-black text-white transition hover:bg-[#1916b8] disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={isUnlocking}
              onClick={handleUnlockWithQr}
              type="button"
            >
              {isUnlocking ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin />
                  Generating QR Code...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faQrcode} />
                  Pay with QR to Watch Video
                </>
              )}
            </button>
            <a
              className="inline-flex h-12 w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-7 text-sm font-black text-slate-700 transition hover:bg-slate-50"
              href={`/course-detail?course=${courseId}`}
            >
              Back to Course Details
            </a>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="bg-[#f7f8ff] px-4 py-10 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-[#302be2]">
              {course?.category || 'Course'}
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{course?.title}</h1>
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

        {!loadError && lessons.length === 0 && (
          <div className="mt-8 rounded-xl border border-slate-300 bg-white p-12 text-center shadow-sm">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-xl text-[#302be2]">
              <FontAwesomeIcon icon={faVideo} />
            </span>
            <h2 className="mt-4 text-xl font-black">No lessons published yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              The instructor has not added lessons to this course yet. Please check back later.
            </p>
            <a
              className="mt-6 inline-flex h-12 items-center justify-center rounded-lg bg-[#302be2] px-7 text-sm font-black text-white transition hover:bg-[#1916b8]"
              href={`/course-detail?course=${courseId}`}
            >
              View Course Details
            </a>
          </div>
        )}

        {currentLesson && (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
            <div>
              <div className="relative overflow-hidden rounded-xl border border-slate-300 bg-slate-950 shadow-sm">
                {currentLesson.videoUrl ? (
                  isVideoFile(currentLesson.videoUrl) ? (
                    <video
                      className="aspect-video w-full bg-black"
                      controls
                      src={currentLesson.videoUrl}
                      title={`${currentLesson.title} video`}
                    />
                  ) : (
                    <iframe
                      className="aspect-video w-full bg-black"
                      src={getEmbedVideoUrl(currentLesson.videoUrl)}
                      title={`${currentLesson.title} video`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  )
                ) : (
                  <div className="grid aspect-video w-full place-items-center bg-slate-900 px-6 text-center text-slate-300">
                    <div>
                      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl">
                        <FontAwesomeIcon icon={faVideo} />
                      </span>
                      <p className="mt-4 text-sm font-semibold">No video is attached to this lesson yet.</p>
                      <p className="mt-1 text-xs text-slate-400">
                        The lesson content is available in the description below.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 rounded-xl border border-slate-300 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-[#302be2]">
                      Lesson {currentIndex + 1} of {lessons.length}
                    </p>
                    <h2 className="mt-1 text-xl font-black">{currentLesson.title}</h2>
                  </div>
                  <button
                    className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-black transition disabled:cursor-not-allowed ${
                      currentLessonCompleted
                        ? 'bg-emerald-100 text-emerald-700'
                        : requiredQuizMissing
                          ? 'border border-amber-200 bg-amber-50 text-amber-700'
                          : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                    disabled={isUpdatingProgress || (!currentLessonCompleted && requiredQuizMissing)}
                    onClick={toggleComplete}
                    type="button"
                  >
                    <FontAwesomeIcon
                      icon={isUpdatingProgress ? faSpinner : currentLessonCompleted ? faCheck : requiredQuizMissing ? faLock : faPlay}
                      spin={isUpdatingProgress}
                    />
                    {isUpdatingProgress
                      ? 'Saving...'
                      : currentLessonCompleted
                        ? 'Completed'
                        : requiredQuizMissing
                          ? 'Quiz Required'
                          : 'Mark Complete'}
                  </button>
                </div>

                {progressError && (
                  <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {progressError}
                  </p>
                )}

                {currentLesson.duration && (
                  <p className="mt-3 inline-flex items-center gap-2 text-sm text-slate-500">
                    <FontAwesomeIcon className="text-slate-400" icon={faClock} />
                    {currentLesson.duration}
                  </p>
                )}

                {currentLesson.description && (
                  <p className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-700">
                    {currentLesson.description}
                  </p>
                )}

                {currentQuizzes.length > 0 && (
                  <div className="mt-6 border-t border-slate-200 pt-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-700">
                        <FontAwesomeIcon className="text-[#302be2]" icon={faClipboardQuestion} />
                        Lesson Quiz
                      </h3>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide ${
                        requiredQuizMissing ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {requiredQuizMissing ? 'Required quiz pending' : 'Quiz requirements met'}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3">
                      {currentQuizzes.map((quiz) => {
                        const attemptsExhausted = quiz.maxAttempts > 0 && quiz.attemptsUsed >= quiz.maxAttempts
                        const quizHref = `/quiz?course=${courseId}&quiz=${quiz.id}`
                        const canOpenQuiz = quiz.questionsCount > 0

                        return (
                          <div
                            className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4"
                            key={quiz.id}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="font-black text-slate-900">{quiz.title}</h4>
                                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
                                    quiz.isRequired
                                      ? 'bg-indigo-100 text-[#302be2]'
                                      : 'bg-slate-200 text-slate-600'
                                  }`}>
                                    {quiz.isRequired ? 'Required' : 'Optional'}
                                  </span>
                                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
                                    quiz.passed
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : quiz.attemptsUsed > 0
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-slate-200 text-slate-600'
                                  }`}>
                                    {quiz.passed ? 'Passed' : quiz.attemptsUsed > 0 ? 'Not passed' : 'Not attempted'}
                                  </span>
                                </div>

                                {quiz.description && (
                                  <p className="mt-2 text-sm leading-6 text-slate-600">{quiz.description}</p>
                                )}

                                <p className="mt-2 text-xs font-semibold text-slate-500">
                                  {quiz.questionsCount} question{quiz.questionsCount === 1 ? '' : 's'}
                                  {' · '}Passing score {quiz.passingScore}%
                                  {' · '}Attempts {quiz.attemptsUsed}
                                  {quiz.maxAttempts > 0 ? `/${quiz.maxAttempts}` : ' (unlimited)'}
                                </p>

                                {quiz.bestScore !== null && (
                                  <p className="mt-1 text-xs font-bold text-slate-600">
                                    Best score: {quiz.bestScore}%
                                  </p>
                                )}
                              </div>

                              {canOpenQuiz && !(attemptsExhausted && !quiz.passed) ? (
                                <a
                                  className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-[#302be2] px-4 text-xs font-black text-white transition hover:bg-[#1916b8]"
                                  href={quizHref}
                                >
                                  {attemptsExhausted && quiz.passed
                                    ? 'View Quiz'
                                    : quiz.attemptsUsed > 0
                                      ? 'Retake Quiz'
                                      : 'Start Quiz'}
                                </a>
                              ) : (
                                <span className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-slate-200 px-4 text-xs font-black text-slate-600">
                                  {canOpenQuiz ? 'No attempts left' : 'No questions yet'}
                                </span>
                              )}
                            </div>

                            {quiz.isRequired && !quiz.passed && (
                              <p className="mt-3 text-xs font-semibold text-amber-700">
                                Pass this quiz to unlock lesson completion.
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center justify-between gap-4">
                <button
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                  disabled={!previousLesson}
                  onClick={() => selectLesson(previousLesson)}
                  type="button"
                >
                  <FontAwesomeIcon icon={faChevronLeft} />
                  Previous
                </button>
                <button
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#302be2] px-6 text-sm font-black text-white transition hover:bg-[#1916b8] disabled:cursor-not-allowed disabled:bg-slate-400"
                  disabled={!nextLesson}
                  onClick={() => selectLesson(nextLesson)}
                  type="button"
                >
                  Next Lesson
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>
              </div>
            </div>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
                <div className="border-b border-slate-200 p-5">
                  <h2 className="text-sm font-black uppercase tracking-wide text-slate-700">
                    Lessons ({lessons.length})
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {completedLessons.size} completed
                  </p>
                </div>
                <div className="max-h-[28rem] overflow-y-auto p-3">
                  {lessons.map((lesson, index) => {
                    const isActive = lesson.id === currentLesson?.id
                    const isCompleted = completedLessons.has(lesson.id)

                    return (
                      <button
                        className={`mb-2 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition ${
                          isActive ? 'bg-[#edf0ff] text-[#302be2]' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                        key={lesson.id || `${lesson.courseId}-${index}`}
                        onClick={() => selectLesson(lesson)}
                        type="button"
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-700'
                              : isActive
                                ? 'bg-[#302be2] text-white'
                                : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isCompleted ? <FontAwesomeIcon icon={faCheck} /> : index + 1}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">{lesson.title}</span>
                          {lesson.duration && (
                            <span className="mt-0.5 block text-xs text-slate-500">{lesson.duration}</span>
                          )}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </aside>
          </div>
        )}

        {courseProgress && (allLessonsCompleted || courseCertificate) && (
          <div className="mt-8 rounded-xl border border-slate-300 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-[#302be2]">
                  <FontAwesomeIcon icon={faCertificate} />
                  Course Certificate
                </p>
                <h2 className="mt-2 text-xl font-black">
                  {courseCertificate ? 'Your certificate is ready' : 'Finish the course requirements'}
                </h2>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                {courseProgress.completedLessons}/{courseProgress.totalLessons} lessons
              </span>
            </div>

            {courseCertificate ? (
              <div className="mt-5 flex flex-col gap-4 rounded-lg bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-mono text-sm font-black text-emerald-800">
                    {courseCertificate.certificateNumber}
                  </p>
                  <p className="mt-1 text-sm text-emerald-700">
                    Issued {formatCertificateDate(courseCertificate.issuedAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <a
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#302be2] px-5 text-sm font-black text-white transition hover:bg-[#1916b8]"
                    href={`/certificate?id=${encodeURIComponent(courseCertificate.id)}`}
                  >
                    <FontAwesomeIcon icon={faCertificate} />
                    View Certificate
                  </a>
                  <button
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-white px-5 text-sm font-black text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:text-slate-400"
                    disabled={isDownloadingCertificate}
                    onClick={handleDownloadCertificate}
                    type="button"
                  >
                    <FontAwesomeIcon icon={isDownloadingCertificate ? faSpinner : faDownload} spin={isDownloadingCertificate} />
                    {isDownloadingCertificate ? 'Downloading...' : 'Download PDF'}
                  </button>
                </div>
              </div>
            ) : certificateEligible ? (
              <div className="mt-5 flex flex-col gap-4 rounded-lg bg-indigo-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Every lesson and required quiz is complete.
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Issue your certificate now and download the PDF.
                  </p>
                </div>
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#302be2] px-5 text-sm font-black text-white transition hover:bg-[#1916b8] disabled:cursor-not-allowed disabled:bg-slate-400"
                  disabled={isClaimingCertificate}
                  onClick={handleClaimCertificate}
                  type="button"
                >
                  <FontAwesomeIcon icon={isClaimingCertificate ? faSpinner : faCertificate} spin={isClaimingCertificate} />
                  {isClaimingCertificate ? 'Issuing Certificate...' : 'Get Certificate'}
                </button>
              </div>
            ) : (
              <div className="mt-5 rounded-lg bg-amber-50 p-5">
                <p className="text-sm font-bold text-amber-800">
                  {courseProgress.certificate?.reason || 'Complete all course requirements to unlock your certificate.'}
                </p>
                {!requiredQuizzesSatisfied && courseProgress.quizzes.requiredTotal > 0 && (
                  <p className="mt-2 text-sm text-amber-700">
                    Required quizzes passed: {courseProgress.quizzes.requiredPassed}/{courseProgress.quizzes.requiredTotal}.
                  </p>
                )}
              </div>
            )}

            {certificateError && (
              <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {certificateError}
              </p>
            )}
          </div>
        )}
      </section>
    </main>
  )
}

export default LessonPage