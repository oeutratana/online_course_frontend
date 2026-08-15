import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCartShopping,
  faClock,
  faEnvelope,
  faTrash,
  faUserGraduate,
} from '@fortawesome/free-solid-svg-icons'
import { getCurrentUser } from '../../lib/authApi'
import { clearUnseenCartCount } from '../../lib/cartNotifications'

const getCartItems = () => {
  try {
    return JSON.parse(localStorage.getItem('course_cart') || '[]')
  } catch {
    return []
  }
}

const formatDate = (value) => {
  const date = value ? new Date(value) : null

  return date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : 'Unknown'
}

const isUserCartItem = (item, user) => {
  if (!user) return false

  return String(item.student_id || '') === String(user.id || '')
    || String(item.student_email || '').toLowerCase() === String(user.email || '').toLowerCase()
}

const CartPage = () => {
  const [cartItems, setCartItems] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pendingDeleteItem, setPendingDeleteItem] = useState(null)

  useEffect(() => {
    let isMounted = true

    getCurrentUser()
      .then((user) => {
        if (!isMounted) return

        setCurrentUser(user)
        setCartItems(getCartItems().filter((item) => isUserCartItem(item, user)))
        clearUnseenCartCount(user)
      })
      .catch(() => {
        if (!isMounted) return

        setCurrentUser(null)
        setCartItems([])
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const handleRemove = (cartItem) => {
    const allCartItems = getCartItems()
    const nextAllCartItems = allCartItems.filter((item) => !(
      item.id === cartItem.id && isUserCartItem(item, currentUser)
    ))
    const nextUserCartItems = nextAllCartItems.filter((item) => isUserCartItem(item, currentUser))

    localStorage.setItem('course_cart', JSON.stringify(nextAllCartItems))
    setCartItems(nextUserCartItems)
    setPendingDeleteItem(null)
  }

  return (
    <main className="bg-[#f7f8ff] px-4 py-12 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-[#302be2]">Course Cart</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Students Added To Cart</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Review courses added to the current account cart.
            </p>
          </div>
          <a
            className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-lg bg-[#302be2] px-5 text-sm font-black text-white transition hover:bg-[#1916b8]"
            href="/courses"
          >
            <FontAwesomeIcon icon={faCartShopping} />
            Add More Courses
          </a>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-md shadow-slate-200/50">
            <p className="text-sm font-semibold text-slate-500">Cart Records</p>
            <h2 className="mt-2 text-3xl font-black">{cartItems.length}</h2>
          </article>
          <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-md shadow-slate-200/50">
            <p className="text-sm font-semibold text-slate-500">Students</p>
            <h2 className="mt-2 text-3xl font-black">
              {new Set(cartItems.map((item) => item.student_email || item.student_id || item.student_name)).size}
            </h2>
          </article>
          <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-md shadow-slate-200/50">
            <p className="text-sm font-semibold text-slate-500">Courses</p>
            <h2 className="mt-2 text-3xl font-black">
              {new Set(cartItems.map((item) => item.course_id || item.title)).size}
            </h2>
          </article>
        </div>

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-md shadow-slate-200/50">
          <div className="border-b border-slate-100 p-6">
            <h2 className="text-xl font-black">Cart List</h2>
            <p className="mt-1 text-sm text-slate-500">Student and course records saved from the Add to Cart button.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Course</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Added At</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!isLoading && cartItems.length > 0 ? cartItems.map((item) => (
                  <tr className="hover:bg-slate-50/70" key={item.id || `${item.course_id}-${item.student_email}`}>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <span className="grid h-11 w-11 place-items-center rounded-full bg-violet-100 text-violet-700">
                          <FontAwesomeIcon icon={faUserGraduate} />
                        </span>
                        <div>
                          <p className="font-black">{item.student_name || 'Student'}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            <FontAwesomeIcon className="mr-1" icon={faEnvelope} />
                            {item.student_email || 'No email'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        {item.image && <img className="h-14 w-20 rounded-lg object-cover" src={item.image} alt={item.title} />}
                        <div>
                          <p className="font-black">{item.title}</p>
                          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{item.category || 'Course'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-black text-[#302be2]">{item.price || '$0.00'}</td>
                    <td className="px-6 py-5 text-slate-600">
                      <FontAwesomeIcon className="mr-2 text-slate-400" icon={faClock} />
                      {formatDate(item.added_at)}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                        onClick={() => setPendingDeleteItem(item)}
                        type="button"
                        aria-label={`Remove ${item.title}`}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td className="px-6 py-12 text-center text-sm font-semibold text-slate-500" colSpan="5">
                      {isLoading ? 'Loading your cart...' : 'No courses have been added to this account cart yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>

      {pendingDeleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <section className="w-full max-w-md rounded-2xl bg-white p-6 text-slate-950 shadow-2xl">
            <h2 className="text-xl font-black">Are you sure?</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Remove "{pendingDeleteItem.title}" from this account cart?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="h-11 rounded-lg border border-slate-200 px-5 text-sm font-black text-slate-600 transition hover:bg-slate-50"
                onClick={() => setPendingDeleteItem(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="h-11 rounded-lg bg-red-600 px-5 text-sm font-black text-white transition hover:bg-red-700"
                onClick={() => handleRemove(pendingDeleteItem)}
                type="button"
              >
                Delete
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

export default CartPage
