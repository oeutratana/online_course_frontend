import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight, faPlus, faUser } from '@fortawesome/free-solid-svg-icons'

const Banner = () => {
  return (
    <section className="overflow-hidden bg-[#f7f8ff]">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-[0.9fr_1.1fr] md:py-20 lg:px-8">
        <div>
          <span className="inline-flex rounded-full bg-[#edf0ff] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#4442f0]">
            Next-generation learning
          </span>
          <h1 className="mt-8 max-w-xl text-4xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Master the Skills That <span className="text-[#2f2bdc]">Shape the Future.</span>
          </h1>
          <p className="mt-7 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
            Join 20,000+ students worldwide and learn from top industry experts in
            development, design, and business.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <a
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[#302be2] px-7 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-[#1916b8]"
              href="/mentors"
            >
              Explore Courses
              <FontAwesomeIcon icon={faArrowRight} />
            </a>
            <a
              className="inline-flex items-center justify-center rounded-md border border-[#302be2] bg-white px-7 py-4 text-sm font-bold text-[#302be2] transition hover:bg-[#eef0ff]"
              href="/popular"
            >
              View Popular
            </a>
          </div>

          <div className="mt-10 flex flex-col gap-4 text-sm text-slate-600 sm:flex-row sm:items-center">
            <div className="flex -space-x-2">
              {['A', 'M', 'J', 'L'].map((item, index) => (
                <span
                  key={item}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-black text-white ${
                    ['bg-rose-500', 'bg-cyan-600', 'bg-amber-500', 'bg-emerald-600'][index]
                  }`}
                >
                  <FontAwesomeIcon icon={faUser} />
                </span>
              ))}
            </div>
            <p>Trusted by 20,000+ professionals</p>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute -right-3 -top-3 h-full w-full rounded-3xl bg-[#d9dcff]" />
          <div className="relative rounded-3xl bg-white p-4 shadow-2xl shadow-slate-300/70">
            <div className="overflow-hidden rounded-2xl bg-[#fffaf5]">
              <img
                className="h-64 w-full object-cover sm:h-80 lg:h-[390px]"
                src="https://images.unsplash.com/photo-1573497491208-6b1acb260507?auto=format&fit=crop&w=1100&q=85"
                alt="Mentor teaching a student during an online course"
              />
            </div>
            <div className="absolute bottom-9 left-8 right-8 rounded-2xl bg-white/92 p-4 shadow-xl backdrop-blur">
              <p className="text-sm font-bold text-slate-700">Live Mentorship</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Join real-time interactive sessions
              </p>
              <span className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#302be2] text-lg font-black text-white">
                <FontAwesomeIcon icon={faPlus} />
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Banner
