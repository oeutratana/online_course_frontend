import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faEnvelope,
  faLocationDot,
  faMap,
  faPaperPlane,
  faPhone,
} from '@fortawesome/free-solid-svg-icons'

const contactCards = [
  {
    icon: faEnvelope,
    title: 'Email Support',
    text: 'Typically responds within 2 hours.',
    link: 'support@onlinecourse.edu',
    bg: 'bg-[#dfe8ff]',
    iconBg: 'bg-[#cbd5ff]',
    iconColor: 'text-[#332fe0]',
  },
  {
    icon: faPhone,
    title: 'Call Us',
    text: 'Mon - Fri from 8am to 5pm.',
    link: '+1 (555) 123-4567',
    bg: 'bg-[#dfe8ff]',
    iconBg: 'bg-[#d7ecff]',
    iconColor: 'text-[#086e80]',
  },
]

const offices = [
  {
    city: 'San Francisco HQ',
    address: '123 Tech Plaza, Suite 500',
    location: 'San Francisco, CA 94105',
  },
  {
    city: 'London Campus',
    address: '45 Innovation Street, Clerkenwell',
    location: 'London, EC1R 0AT, UK',
  },
]

const Contact = () => {
  return (
    <main className="bg-[#f6f7ff] text-slate-950">
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-16 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Let's connect.</h1>
          <p className="mt-6 text-base leading-7 text-slate-700 sm:text-lg">
            Have questions about our curriculum or need technical assistance? Our team of
            academic advisors is ready to help you navigate your learning journey.
          </p>
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-[1.15fr_0.8fr]">
          <form className="rounded-xl border border-slate-300 bg-white p-6 shadow-sm sm:p-9 md:p-12">
            <div className="grid gap-6 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-950">
                Full Name
                <input
                  className="h-12 rounded-lg border border-slate-300 bg-white px-4 text-base font-normal text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#302be2] focus:ring-4 focus:ring-indigo-100"
                  placeholder="John Doe"
                  type="text"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-950">
                Email Address
                <input
                  className="h-12 rounded-lg border border-slate-300 bg-white px-4 text-base font-normal text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#302be2] focus:ring-4 focus:ring-indigo-100"
                  placeholder="john@example.com"
                  type="email"
                />
              </label>
            </div>

            <label className="mt-6 grid gap-2 text-sm font-medium text-slate-950">
              Subject
              <select className="h-12 rounded-lg border border-slate-300 bg-white px-4 text-base font-normal text-slate-950 outline-none transition focus:border-[#302be2] focus:ring-4 focus:ring-indigo-100">
                <option>Course Inquiry</option>
                <option>Technical Support</option>
                <option>Billing Question</option>
                <option>Partnership</option>
              </select>
            </label>

            <label className="mt-6 grid gap-2 text-sm font-medium text-slate-950">
              Message
              <textarea
                className="min-h-40 resize-none rounded-lg border border-slate-300 bg-white px-4 py-4 text-base font-normal text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#302be2] focus:ring-4 focus:ring-indigo-100"
                placeholder="Tell us how we can help..."
              />
            </label>

            <button
              className="mt-8 h-14 w-full rounded-lg bg-[#332bdc] text-base font-black text-white shadow-sm shadow-indigo-500/25 transition hover:bg-[#1916b8]"
              type="button"
            >
              Send Message <FontAwesomeIcon className="ml-2" icon={faPaperPlane} />
            </button>
          </form>

          <aside className="grid gap-6">
            {contactCards.map((card) => (
              <article className={`rounded-xl p-6 ${card.bg}`} key={card.title}>
                <div className="flex gap-5">
                  <span
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-lg font-black ${card.iconBg} ${card.iconColor}`}
                  >
                    <FontAwesomeIcon icon={card.icon} />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold">{card.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{card.text}</p>
                    <a className="mt-3 inline-block text-sm font-medium text-[#332fe0]" href="#">
                      {card.link}
                    </a>
                  </div>
                </div>
              </article>
            ))}

            <article className="rounded-xl border border-slate-300 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black">Office Locations</h2>
              <div className="mt-7 grid gap-7">
                {offices.map((office) => (
                  <div className="flex gap-4" key={office.city}>
                    <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-500 text-xs font-black text-white">
                      <FontAwesomeIcon icon={faLocationDot} />
                    </span>
                    <div className="text-sm leading-6">
                      <h3 className="font-semibold">{office.city}</h3>
                      <p className="text-slate-600">{office.address}</p>
                      <p className="text-slate-600">{office.location}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-7 flex h-40 items-center justify-center overflow-hidden rounded-lg border border-slate-300 bg-slate-300">
                <div className="h-full w-full bg-[linear-gradient(90deg,rgba(255,255,255,.35)_1px,transparent_1px),linear-gradient(rgba(255,255,255,.35)_1px,transparent_1px)] bg-[length:22px_22px] p-6">
                  <div className="flex h-full items-center justify-center rounded-lg bg-slate-500/20">
                    <a
                      className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-lg transition hover:text-[#332fe0]"
                      href="#"
                    >
                      <FontAwesomeIcon className="mr-2 text-[#332fe0]" icon={faMap} />
                      View Full Map
                    </a>
                  </div>
                </div>
              </div>
            </article>
          </aside>
        </div>

        <section className="mt-16 rounded-xl bg-[#332bdc] px-6 py-16 text-center text-white shadow-sm shadow-indigo-400/40 sm:px-10 md:py-20">
          <h2 className="text-3xl font-black">Already checked our FAQ?</h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-indigo-50">
            We might have already answered your question in our comprehensive help center
            for students and instructors.
          </p>
          <a
            className="mt-8 inline-flex h-12 items-center justify-center rounded-lg bg-white px-10 text-base font-semibold text-[#2114e8] transition hover:bg-indigo-50"
            href="#"
          >
            Browse Help Center
          </a>
        </section>
      </section>
    </main>
  )
}

export default Contact
