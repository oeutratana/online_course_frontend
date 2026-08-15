const cartNotificationKey = 'course_cart_unseen'

const userCartNotificationKey = (user) => {
  const userKey = user?.id || user?.email || 'guest'

  return `${cartNotificationKey}_${userKey}`
}

export const getUnseenCartCount = (user) => {
  try {
    return Number(localStorage.getItem(userCartNotificationKey(user)) || 0)
  } catch {
    return 0
  }
}

export const addUnseenCartItem = (user) => {
  const nextCount = getUnseenCartCount(user) + 1

  localStorage.setItem(userCartNotificationKey(user), String(nextCount))
  window.dispatchEvent(new CustomEvent('cart-unseen-change'))

  return nextCount
}

export const clearUnseenCartCount = (user) => {
  localStorage.removeItem(userCartNotificationKey(user))
  window.dispatchEvent(new CustomEvent('cart-unseen-change'))
}
