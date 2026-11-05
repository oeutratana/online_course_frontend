import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarDays } from '@fortawesome/free-solid-svg-icons'

const getGreeting = () => {
  const hour = new Date().getHours()

  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'

  return 'Good evening'
}

const DashboardHeader = ({ adminName = 'Admin' }) => {
  const today = new Date().toISOString().slice(0, 10)
  const [reportDate, setReportDate] = useState(today)
  const firstName = String(adminName).trim().split(' ')[0] || 'Admin'
  const formattedDate = new Date(`${reportDate}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Dashboard</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
          {getGreeting()}, {firstName}!
        </h1>
        <p className="mt-1.5 text-sm font-medium text-slate-500">
          Here&apos;s what&apos;s happening with your online course platform today.
        </p>
      </div>

      <label className="flex w-full max-w-xs flex-col gap-1.5">
        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
          Report date
        </span>
        <span className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm">
          <FontAwesomeIcon className="text-sm text-blue-500" icon={faCalendarDays} />
          <input
            aria-label="Select report date"
            className="w-full bg-transparent text-xs font-bold text-slate-700 outline-none"
            max={today}
            onChange={(event) => setReportDate(event.target.value)}
            type="date"
            value={reportDate}
          />
        </span>
        <span className="truncate text-[10px] font-semibold text-slate-400">{formattedDate}</span>
      </label>
    </div>
  )
}

export default DashboardHeader
