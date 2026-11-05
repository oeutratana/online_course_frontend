import { useEffect, useRef, useState } from 'react'

const Reveal = ({ children, className = '', delay = 0 }) => {
  const ref = useRef(null)
  const [shown, setShown] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const element = ref.current
    if (!element || typeof IntersectionObserver === 'undefined') return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting) {
          setShown(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -40px 0px', threshold: 0.12 },
    )
    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  return (
    <div
      className={`reveal-element h-full ${shown ? 'reveal-visible' : 'reveal-hidden'} ${className}`}
      ref={ref}
      style={{ transitionDelay: shown ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  )
}

export default Reveal