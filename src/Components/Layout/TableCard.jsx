const getPurchasedCourses = () => {
  try {
    return JSON.parse(localStorage.getItem('course_purchases') || '[]')
  } catch {
    return []
  }
}

const isPurchased = (course, purchases) => purchases.some((item) => (
  String(item.course_id || item.id).split('-')[0] === String(course.id)
))

const isSameUser = (item, user) => {
  if (!user) return false

  return String(item.user_id || item.student_id || '') === String(user.id || '')
    || String(item.user_email || item.student_email || '').toLowerCase() === String(user.email || '').toLowerCase()
}

const TableCard = ({ courses = [], purchases = getPurchasedCourses(), isAuthenticated = false, currentUser = null, onWatchCourse }) => {
  const cardItems = courses.length > 0
    ? courses
    : purchases.map((item) => ({
      id: item.course_id || item.id,
      title: item.title,
      image: item.image,
      category: item.category || 'Course',
      price: `$${Number(item.amount || 0).toFixed(2)}`,
    }))

  return (
  <section id="table-card" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-14 sm:px-6 lg:px-8">
    <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-6">
        <h2 className="text-xl font-black">Purchased Courses</h2>
        <p className="mt-1 text-sm text-slate-500">Sign in and unlock a course before watching its video.</p>
      </div>

      <div className="grid gap-4 border-b border-slate-100 p-6 md:grid-cols-2 xl:grid-cols-3">
        {cardItems.map((course) => {
          const userPurchases = currentUser ? purchases.filter((item) => isSameUser(item, currentUser)) : purchases
          const unlocked = isAuthenticated && isPurchased(course, userPurchases)

          return (
            <article className={`overflow-hidden rounded-xl border ${unlocked ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 bg-slate-50'}`} key={course.id || course.title}>
              <img
                className="h-36 w-full object-cover"
                src={course.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=85'}
                alt={course.title}
              />
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-black">{course.title}</h3>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{course.category || 'Course'}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${unlocked ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                    {unlocked ? 'Can watch' : 'Locked'}
                  </span>
                </div>
                <button
                  className={`mt-4 h-10 w-full rounded-lg text-sm font-black transition ${unlocked ? 'bg-[#302be2] text-white hover:bg-[#1916b8]' : 'cursor-not-allowed bg-slate-200 text-slate-500'}`}
                  disabled={!unlocked}
                  onClick={() => onWatchCourse?.(course)}
                  type="button"
                >
                  {unlocked ? 'Watch Video' : 'Buy to Watch'}
                </button>
              </div>
            </article>
          )
        })}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-500">
            <tr>
              <th className="px-6 py-4">Course</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Purchased At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {purchases.length > 0 ? purchases.map((item) => (
              <tr className="hover:bg-slate-50/70" key={item.id}>
                <td className="px-6 py-4 font-black">{item.title}</td>
                <td className="px-6 py-4 text-slate-700">${Number(item.amount || 0).toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black capitalize text-emerald-700">
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {item.purchased_at ? new Date(item.purchased_at).toLocaleString() : 'Unknown'}
                </td>
              </tr>
            )) : (
              <tr>
                <td className="px-6 py-8 text-center text-slate-500" colSpan="4">
                  No purchased courses yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </section>
  )
}

export default TableCard
