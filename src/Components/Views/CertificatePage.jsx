import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft,
  faCalendarDays,
  faCertificate,
  faCircleCheck,
  faDownload,
  faGraduationCap,
  faShieldHalved,
  faSpinner,
  faUpRightFromSquare,
} from '@fortawesome/free-solid-svg-icons'
import {
  downloadCertificatePdf,
  fetchCertificatePdf,
  getCertificate,
} from '../../lib/courseApi'

const formatDate = (value) => {
  if (!value) return ''

  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

const CertificatePage = () => {
  const certificateId = new URLSearchParams(window.location.search).get('id')
  const [certificate, setCertificate] = useState(null)
  const [isLoading, setIsLoading] = useState(Boolean(certificateId))
  const [error, setError] = useState(certificateId ? '' : 'No certificate was selected.')
  const [isDownloading, setIsDownloading] = useState(false)
  const [isOpening, setIsOpening] = useState(false)
  const [pdfError, setPdfError] = useState('')

  useEffect(() => {
    if (!certificateId) {
      return undefined
    }

    let isMounted = true

    getCertificate(certificateId)
      .then((result) => {
        if (isMounted) {
          setCertificate(result)
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(requestError?.status === 404
            ? 'This certificate could not be found.'
            : requestError?.message || 'Your certificate could not be loaded.')
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
  }, [certificateId])

  const handleDownloadPdf = async () => {
    if (!certificate || isDownloading) return

    setIsDownloading(true)
    setPdfError('')

    try {
      await downloadCertificatePdf(certificate.id)
    } catch (requestError) {
      setPdfError(requestError?.message || 'The certificate PDF could not be downloaded.')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleOpenPdf = async () => {
    if (!certificate || isOpening) return

    const pdfWindow = window.open('', '_blank')

    if (!pdfWindow) {
      setPdfError('Allow pop-ups for this site to open the certificate PDF.')
      return
    }

    setIsOpening(true)
    setPdfError('')

    try {
      const { blob } = await fetchCertificatePdf(certificate.id, { inline: true })
      const url = URL.createObjectURL(blob)

      pdfWindow.location.href = url
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (requestError) {
      pdfWindow.close()
      setPdfError(requestError?.message || 'The certificate PDF could not be opened.')
    } finally {
      setIsOpening(false)
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#f7f8ff] px-6 text-slate-700">
        <div className="text-center">
          <FontAwesomeIcon className="text-3xl text-[#302be2]" icon={faSpinner} spin />
          <p className="mt-4 text-lg font-bold text-[#111827]">Loading your certificate...</p>
          <p className="mt-2 text-sm">Preparing your achievement record.</p>
        </div>
      </main>
    )
  }

  if (error || !certificate) {
    return (
      <main className="bg-[#f7f8ff] px-4 py-16 text-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl rounded-xl border border-slate-300 bg-white p-8 text-center shadow-sm">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-2xl text-amber-700">
            <FontAwesomeIcon icon={faCertificate} />
          </span>
          <h1 className="mt-5 text-2xl font-black">Certificate unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {error || 'This certificate could not be found.'}
          </p>
          <a
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#302be2] px-5 text-sm font-black text-white transition hover:bg-[#1916b8]"
            href="/my-courses"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Back to My Courses
          </a>
        </div>
      </main>
    )
  }

  const courseHref = certificate.courseId
    ? `/lesson?course=${encodeURIComponent(certificate.courseId)}`
    : '/my-courses'

  return (
    <main className="bg-[#f7f8ff] px-4 py-10 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <a
              className="inline-flex items-center gap-2 text-sm font-black text-[#302be2] transition hover:text-[#1916b8]"
              href="/my-courses"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              Back to My Courses
            </a>
            <p className="mt-5 inline-flex items-center gap-2 text-sm font-black uppercase tracking-wide text-[#302be2]">
              <FontAwesomeIcon icon={faGraduationCap} />
              Student Achievement
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Your Certificate</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              This certificate confirms that you completed all course requirements.
            </p>
          </div>
          <a
            className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-lg bg-[#302be2] px-5 text-sm font-black text-white transition hover:bg-[#1916b8]"
            href={courseHref}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Back to Course
          </a>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <article className="relative overflow-hidden rounded-2xl border-[10px] border-double border-amber-500 bg-[linear-gradient(135deg,#fffdf7_0%,#ffffff_48%,#fff7e6_100%)] p-5 shadow-2xl shadow-slate-200 sm:p-10">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-100/70"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-indigo-100/50"
            />

            <div className="relative rounded-xl border border-amber-200/80 px-5 py-10 text-center sm:px-10 sm:py-14">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-amber-700">
                Online Course
              </p>

              <div className="mx-auto mt-6 h-px w-24 bg-amber-300" />

              <h2 className="mt-7 font-serif text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Certificate of Completion
              </h2>
              <p className="mt-4 text-sm font-semibold text-slate-500">
                This certificate is proudly presented to
              </p>

              <p className="mt-8 inline-block border-b-2 border-amber-300 px-4 pb-3 font-serif text-3xl font-black text-slate-950 sm:px-10 sm:text-5xl">
                {certificate.studentName || 'Student'}
              </p>

              <p className="mt-8 text-sm font-semibold text-slate-500">
                for successfully completing the course
              </p>
              <p className="mx-auto mt-3 max-w-2xl font-serif text-2xl font-black leading-snug text-[#241b8f] sm:text-3xl">
                {certificate.courseTitle || 'Course'}
              </p>

              <div className="mx-auto mt-10 grid max-w-2xl gap-4 border-y border-amber-200 py-6 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Issued on
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {formatDate(certificate.issuedAt) || 'Issued'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    {certificate.courseInstructor ? 'Instructed by' : 'Category'}
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {certificate.courseInstructor || certificate.courseCategory || 'Online Course'}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <span className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-amber-400 bg-amber-50 text-3xl text-amber-600 shadow-inner">
                  <FontAwesomeIcon icon={faCertificate} />
                </span>
                <div className="text-center sm:text-left">
                  <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-emerald-700">
                    <FontAwesomeIcon icon={faCircleCheck} />
                    Verified achievement
                  </p>
                  <p className="mt-1 font-mono text-xs font-bold text-slate-500">
                    {certificate.certificateNumber}
                  </p>
                </div>
              </div>
            </div>
          </article>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-black uppercase tracking-wide text-slate-700">
                Certificate details
              </h2>
              <dl className="mt-4 space-y-4 text-sm">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Student</dt>
                  <dd className="mt-1 font-bold text-slate-800">{certificate.studentName || 'Student'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Course</dt>
                  <dd className="mt-1 font-bold text-slate-800">{certificate.courseTitle || 'Course'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Certificate number</dt>
                  <dd className="mt-1 break-all font-mono text-xs font-bold text-slate-700">
                    {certificate.certificateNumber}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Issued</dt>
                  <dd className="mt-1 inline-flex items-center gap-2 font-bold text-slate-800">
                    <FontAwesomeIcon className="text-slate-400" icon={faCalendarDays} />
                    {formatDate(certificate.issuedAt) || 'Issued'}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
              <button
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#302be2] text-sm font-black text-white transition hover:bg-[#1916b8] disabled:cursor-not-allowed disabled:bg-slate-400"
                disabled={isDownloading}
                onClick={handleDownloadPdf}
                type="button"
              >
                <FontAwesomeIcon icon={isDownloading ? faSpinner : faDownload} spin={isDownloading} />
                {isDownloading ? 'Downloading...' : 'Download PDF'}
              </button>
              <button
                className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                disabled={isOpening}
                onClick={handleOpenPdf}
                type="button"
              >
                <FontAwesomeIcon icon={isOpening ? faSpinner : faUpRightFromSquare} spin={isOpening} />
                {isOpening ? 'Opening...' : 'Open PDF'}
              </button>
              <a
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#302be2] transition hover:text-[#1916b8]"
                href={certificate.verifyUrl}
                rel="noreferrer"
                target="_blank"
              >
                <FontAwesomeIcon icon={faShieldHalved} />
                Verify this certificate
              </a>
              {pdfError && (
                <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                  {pdfError}
                </p>
              )}
            </div>

            <p className="px-1 text-xs leading-5 text-slate-500">
              Keep this certificate number for reference. Anyone can verify it online without
              accessing your private account details.
            </p>
          </aside>
        </div>
      </section>
    </main>
  )
}

export default CertificatePage
