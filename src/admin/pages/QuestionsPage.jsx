import { useEffect, useMemo, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChevronLeft,
  faChevronRight,
  faCircleCheck,
  faCircleQuestion,
  faListCheck,
  faMagnifyingGlass,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons'
import AdminPageHeader from './AdminPageHeader'
import { getAdminQuestions } from '../../lib/adminApi'
import { normalizeQuestion } from '../../lib/courseApi'
import { matchesSearch } from '../adminUtils'

const PAGE_SIZE = 10
const optionLetters = ['a', 'b', 'c', 'd']

const QuestionsPage = ({ searchQuery = '' }) => {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [quizFilter, setQuizFilter] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    let isMounted = true

    getAdminQuestions()
      .then((items) => {
        if (isMounted) setQuestions(items.map(normalizeQuestion))
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(requestError.message || 'Questions could not load.')
          setQuestions([])
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const quizTitles = useMemo(() => {
    const map = new Map()

    questions.forEach((question) => {
      if (question.quizId === null || question.quizId === undefined) return

      map.set(
        String(question.quizId),
        question.raw?.quiz?.title || `Quiz #${question.quizId}`,
      )
    })

    return map
  }, [questions])

  const quizOptions = useMemo(() => (
    [...quizTitles.entries()]
      .map(([id, title]) => ({ id, title }))
      .sort((first, second) => first.title.localeCompare(second.title))
  ), [quizTitles])

  const filtered = useMemo(() => {
    const query = `${searchQuery} ${search}`.trim()

    return questions.filter((question) => (
      matchesSearch(query, [
        question.text,
        quizTitles.get(String(question.quizId)),
        question.correctAnswer,
        question.points,
        ...question.options.map((option) => option.text),
      ])
      && (!quizFilter || String(question.quizId) === String(quizFilter))
    ))
  }, [questions, quizFilter, quizTitles, search, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const quizCount = new Set(questions.map((question) => String(question.quizId))).size

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 xl:px-8">
      <AdminPageHeader
        title="Questions"
        text="Browse every quiz question. Add, edit and reorder questions from Quiz Management."
      >
        <a
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"
          href="/admin/quizzes"
        >
          <FontAwesomeIcon icon={faListCheck} />
          Quiz Management
        </a>
      </AdminPageHeader>

      {error && (
        <p className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          <FontAwesomeIcon className="mt-0.5" icon={faTriangleExclamation} />
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total questions', value: questions.length, icon: faCircleQuestion, tone: 'bg-blue-50 text-blue-600' },
          { label: 'Quizzes covered', value: quizCount, icon: faListCheck, tone: 'bg-violet-50 text-violet-600' },
          { label: 'Questions shown', value: filtered.length, icon: faCircleCheck, tone: 'bg-emerald-50 text-emerald-600' },
        ].map((item) => (
          <article className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm" key={item.label}>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{item.label}</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{item.value.toLocaleString()}</p>
            </div>
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.tone}`}>
              <FontAwesomeIcon icon={item.icon} />
            </span>
          </article>
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-950">Question Bank</h2>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">Read-only view of the quiz catalog</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <FontAwesomeIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" icon={faMagnifyingGlass} />
              <input
                aria-label="Search questions"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-semibold outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 sm:w-56"
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
                placeholder="Search questions..."
                type="search"
                value={search}
              />
            </div>
            <select
              aria-label="Filter by quiz"
              className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400 focus:bg-white"
              onChange={(event) => {
                setQuizFilter(event.target.value)
                setPage(1)
              }}
              value={quizFilter}
            >
              <option value="">All quizzes</option>
              {quizOptions.map((quiz) => (
                <option key={quiz.id} value={quiz.id}>{quiz.title}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Question</th>
                <th className="px-5 py-3">Quiz</th>
                <th className="px-5 py-3">Options</th>
                <th className="px-5 py-3">Correct</th>
                <th className="px-5 py-3">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td className="px-5 py-8" colSpan={6}>
                    <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                  </td>
                </tr>
              )}

              {!loading && visible.length === 0 && (
                <tr>
                  <td className="px-5 py-12 text-center" colSpan={6}>
                    <FontAwesomeIcon className="text-3xl text-slate-300" icon={faCircleQuestion} />
                    <p className="mt-3 text-sm font-black text-slate-700">
                      {questions.length === 0 ? 'No questions have been created yet.' : 'No questions match these filters.'}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {questions.length === 0
                        ? 'Create a quiz, then add its questions from Quiz Management.'
                        : 'Try a different search or quiz filter.'}
                    </p>
                    {questions.length === 0 && (
                      <a
                        className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-violet-600 px-4 text-xs font-black text-white transition hover:bg-violet-700"
                        href="/admin/quizzes"
                      >
                        Open Quiz Management
                      </a>
                    )}
                  </td>
                </tr>
              )}

              {visible.map((question) => (
                <tr className="align-top transition hover:bg-slate-50/70" key={question.id}>
                  <td className="px-5 py-4 text-xs font-black text-slate-500">#{question.id}</td>
                  <td className="px-5 py-4">
                    <p className="max-w-md font-bold text-slate-900">{question.text}</p>
                  </td>
                  <td className="max-w-48 truncate px-5 py-4 text-xs font-semibold text-slate-600">
                    {quizTitles.get(String(question.quizId)) || `Quiz #${question.quizId ?? '—'}`}
                  </td>
                  <td className="px-5 py-4">
                    <ul className="grid gap-1">
                      {optionLetters.map((letter, index) => {
                        const option = question.options[index]
                        const isCorrect = question.correctAnswer === letter

                        return (
                          <li
                            className={`text-xs font-semibold ${isCorrect ? 'text-emerald-700' : 'text-slate-600'}`}
                            key={letter}
                          >
                            <span className="font-black uppercase">{letter}.</span>{' '}
                            {option?.text || '—'}
                          </li>
                        )
                      })}
                    </ul>
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700">
                      {question.correctAnswer ? question.correctAnswer.toUpperCase() : '—'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs font-black text-slate-700">{question.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
          <p className="text-xs font-semibold text-slate-500">{filtered.length.toLocaleString()} questions</p>
          <div className="flex items-center gap-2">
            <button
              className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
              type="button"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
              Prev
            </button>
            <span className="text-xs font-bold text-slate-500">Page {currentPage} / {totalPages}</span>
            <button
              className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={currentPage >= totalPages}
              onClick={() => setPage(currentPage + 1)}
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

export default QuestionsPage
