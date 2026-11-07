import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowRight,
  faEnvelope,
  faGraduationCap,
  faLocationDot,
  faPhone,
} from '@fortawesome/free-solid-svg-icons'

const exploreLinks = [
  { label: 'Home', href: '/' },
  { label: 'Courses', href: '/courses' },
  { label: 'Popular', href: '/popular' },
  { label: 'About', href: '/about' },
]

const supportLinks = [
  { label: 'Contact', href: '/contact' },
  { label: 'Login', href: '/login' },
  { label: 'Register', href: '/register' },
  { label: 'My Courses', href: '/my-courses' },
]

const contactItems = [
  { icon: faEnvelope, label: 'support@onlinecourse.edu', href: 'mailto:support@onlinecourse.edu' },
  { icon: faPhone, label: '+1 (555) 123-4567', href: 'tel:+15551234567' },
  { icon: faLocationDot, label: '123 Tech Plaza, San Francisco', href: '/contact' },
]

const linkClass =
  'w-fit text-sm text-slate-600 transition hover:text-[#2d2be8] dark:text-slate-300 dark:hover:text-indigo-200'

const Footer = () => {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-slate-200 bg-[#f7f8ff] dark:border-slate-700 dark:bg-[#152033]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl bg-[#3326d9] px-6 py-8 text-white shadow-lg shadow-indigo-500/20 sm:px-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-indigo-200">
                Start learning
              </p>
              <h2 className="mt-2 max-w-xl text-2xl font-semibold tracking-tight sm:text-3xl">
                Master the skills that shape the future.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100">
                Join students learning development, design, and business with instructors on Online Course.
              </p>
            </div>
            <a
              className="inline-flex w-fit items-center justify-center gap-2 rounded-lg bg-white px-6 py-3.5 text-sm font-bold text-[#2d2be8] transition hover:bg-indigo-50"
              href="/courses"
            >
              Explore Courses
              <FontAwesomeIcon icon={faArrowRight} />
            </a>
          </div>
        </div>

        <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <a className="inline-flex items-center gap-2 text-lg font-black tracking-tight text-[#1f22e8] dark:text-indigo-200" href="/">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#edf0ff] text-sm text-[#2d2be8] dark:bg-indigo-400/15 dark:text-indigo-200">
                <FontAwesomeIcon icon={faGraduationCap} />
              </span>
              Online Course
            </a>
            <p className="mt-5 max-w-xs text-sm leading-6 text-slate-600 dark:text-slate-300">
              Premium digital lessons for lifelong learners, built around expert instructors and flexible study.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-black text-slate-950 dark:text-white">Explore</h3>
            <div className="mt-5 grid gap-3">
              {exploreLinks.map((item) => (
                <a className={linkClass} href={item.href} key={item.href}>
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-black text-slate-950 dark:text-white">Support</h3>
            <div className="mt-5 grid gap-3">
              {supportLinks.map((item) => (
                <a className={linkClass} href={item.href} key={item.href}>
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-black text-slate-950 dark:text-white">Contact</h3>
            <div className="mt-5 grid gap-4">
              {contactItems.map((item) => (
                <a className="flex items-start gap-3 text-sm text-slate-600 transition hover:text-[#2d2be8] dark:text-slate-300 dark:hover:text-indigo-200" href={item.href} key={item.label}>
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#edf0ff] text-xs text-[#2d2be8] dark:bg-indigo-400/15 dark:text-indigo-200">
                    <FontAwesomeIcon icon={item.icon} />
                  </span>
                  <span className="pt-1.5 leading-5">{item.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-slate-200 pt-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Online Course. All rights reserved.</p>
          <p>Learn from industry experts, on your schedule.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
