import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCommentDots, faLink, faShareNodes } from '@fortawesome/free-solid-svg-icons'

const socialLinks = [
  { label: 'Share', icon: faShareNodes },
  { label: 'Community', icon: faCommentDots },
  { label: 'Links', icon: faLink },
]

const Footer = () => {
  return (
    <footer className="border-t border-slate-200 bg-white py-12">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 text-sm sm:px-6 md:grid-cols-4 lg:px-8">
        <div>
          <a href="#" className="text-base font-black text-slate-950">
            EduPro
          </a>
          <p className="mt-6 max-w-xs leading-6 text-slate-500">
            (c) 2024 EduPro Learning Inc. Empowering lifelong learners globally through
            premium digital education.
          </p>
          <div className="mt-6 flex gap-3">
            {socialLinks.map((item) => (
              <a
                key={item.label}
                aria-label={item.label}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#edf0ff] text-xs font-black text-[#302be2]"
                href="#"
              >
                <FontAwesomeIcon icon={item.icon} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-black text-slate-950">Company</h3>
          <div className="mt-6 grid gap-4 text-slate-500">
            <a className="hover:text-[#302be2]" href="#">
              About Us
            </a>
            <a className="hover:text-[#302be2]" href="#">
              Careers
            </a>
            <a className="hover:text-[#302be2]" href="#">
              Affiliates
            </a>
          </div>
        </div>

        <div>
          <h3 className="font-black text-slate-950">Support</h3>
          <div className="mt-6 grid gap-4 text-slate-500">
            <a className="hover:text-[#302be2]" href="#">
              Help Center
            </a>
            <a className="hover:text-[#302be2]" href="#">
              Privacy Policy
            </a>
            <a className="hover:text-[#302be2]" href="#">
              Terms of Service
            </a>
          </div>
        </div>

        <div>
          <h3 className="font-black text-slate-950">Mobile App</h3>
          <p className="mt-6 text-slate-500">Learn on the go with our app.</p>
          <div className="mt-5 grid gap-3">
            <a className="rounded-lg bg-slate-950 px-5 py-3 text-center text-xs font-bold text-white" href="#">
              Download on the App Store
            </a>
            <a className="rounded-lg bg-slate-950 px-5 py-3 text-center text-xs font-bold text-white" href="#">
              Get it on Google Play
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
