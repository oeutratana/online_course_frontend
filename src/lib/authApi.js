export const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL ?? '').replace(/\/+$/, '')
export const API_BASE_URL = import.meta.env.VITE_API_URL || `${BACKEND_URL}/api`

const getErrorMessage = (data, fallback) => {
  if (data?.message) return data.message

  if (data?.errors) {
    const firstError = Object.values(data.errors).flat()[0]
    if (firstError) return firstError
  }

  return fallback
}

export const getResponseUser = (data) => data?.user || data?.data?.user || data?.data || null

export const getUserRole = (user) => {
  const role = user?.role || user?.role_name || user?.type || user?.account_type

  if (typeof role === 'string') {
    return role.toLowerCase()
  }

  if (role?.name) {
    return role.name.toLowerCase()
  }

  if (Array.isArray(user?.roles) && user.roles.length > 0) {
    const firstRole = user.roles[0]
    return typeof firstRole === 'string' ? firstRole.toLowerCase() : firstRole?.name?.toLowerCase()
  }

  return ''
}

export const isAdminUser = (user) => {
  const role = getUserRole(user)

  return role === 'admin' || role === 'super admin' || role === 'super_admin'
}

export const saveAuthSession = (data) => {
  const token = data?.token || data?.access_token || data?.data?.token
  const user = getResponseUser(data)

  if (token) {
    localStorage.setItem('auth_token', token)
    localStorage.setItem('auth_mode', 'token')
    localStorage.setItem('auth_logged_in', 'true')
  }

  if (user) {
    localStorage.setItem('auth_user', JSON.stringify(user))
    localStorage.setItem('auth_logged_in', 'true')
  }
}

export const clearAuthSession = () => {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('auth_user')
  localStorage.removeItem('auth_mode')
  localStorage.removeItem('auth_logged_in')
}

const getCookie = (name) => {
  const cookie = document.cookie
    .split('; ')
    .find((item) => item.startsWith(`${name}=`))

  return cookie ? decodeURIComponent(cookie.split('=')[1]) : ''
}

const getAuthHeaders = ({ includeXsrf = true } = {}) => {
  const token = localStorage.getItem('auth_token')
  const xsrfToken = getCookie('XSRF-TOKEN')
  const headers = {
    Accept: 'application/json',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  if (includeXsrf && xsrfToken) {
    headers['X-XSRF-TOKEN'] = xsrfToken
  }

  return headers
}

export const getCsrfCookie = async () => {
  const response = await fetch(`${BACKEND_URL}/sanctum/csrf-cookie`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Could not connect to the backend CSRF endpoint.')
  }
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export const apiRequest = async (path, options = {}) => {
  const authMode = localStorage.getItem('auth_mode')
  const includeCredentials = options.includeCredentials ?? authMode === 'cookie'
  const includeXsrf = includeCredentials && options.includeXsrf !== false
  const isFormData = options.body instanceof FormData
  const headers = {
    ...getAuthHeaders({ includeXsrf }),
    ...options.headers,
  }

  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: includeCredentials ? 'include' : 'omit',
    headers,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthSession()
    }

    throw new ApiError(
      getErrorMessage(data, 'Something went wrong. Please try again.'),
      response.status,
      data,
    )
  }

  return data
}

const getResponseFilename = (contentDisposition) => {
  if (!contentDisposition) return ''

  const encoded = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (encoded?.[1]) return decodeURIComponent(encoded[1].replace(/^"|"$/g, '').trim())

  const plain = contentDisposition.match(/filename="?([^";]+)"?/i)
  return plain?.[1]?.trim() || ''
}

export const apiBlobRequest = async (path, options = {}) => {
  const authMode = localStorage.getItem('auth_mode')
  const includeCredentials = options.includeCredentials ?? authMode === 'cookie'
  const includeXsrf = includeCredentials && options.includeXsrf !== false
  const headers = {
    ...getAuthHeaders({ includeXsrf }),
    ...options.headers,
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: includeCredentials ? 'include' : 'omit',
    headers,
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))

    if (response.status === 401) {
      clearAuthSession()
    }

    throw new ApiError(
      getErrorMessage(data, 'The file could not be downloaded. Please try again.'),
      response.status,
      data,
    )
  }

  return {
    blob: await response.blob(),
    filename: getResponseFilename(response.headers.get('content-disposition')),
    contentType: response.headers.get('content-type') || '',
  }
}

export const authRequest = async (path, body) => {
  if (path === '/login' || path === '/register') {
    try {
      return await apiRequest(path, {
        method: 'POST',
        body: JSON.stringify(body),
        includeCredentials: false,
        includeXsrf: false,
      })
    } catch (tokenError) {
      if (!tokenError.message.includes('Session store not set')) {
        throw tokenError
      }
    }
  }

  try {
    await getCsrfCookie()

    const data = await apiRequest(path, {
      method: 'POST',
      body: JSON.stringify(body),
      includeCredentials: true,
    })

    if (!localStorage.getItem('auth_token')) {
      localStorage.setItem('auth_mode', 'cookie')
    }

    return data
  } catch (error) {
    if (error instanceof TypeError || error.message.includes('CSRF')) {
      return apiRequest(path, {
        method: 'POST',
        body: JSON.stringify(body),
        includeCredentials: false,
        includeXsrf: false,
      })
    }

    throw error
  }
}

const isValidAuthUser = (user) => Boolean(
  user
    && !Array.isArray(user)
    && typeof user === 'object'
    && (user.id || user.email || user.name)
)

export const getStoredAuthUser = () => {
  try {
    return JSON.parse(localStorage.getItem('auth_user') || 'null')
  } catch {
    return null
  }
}

export const hasTokenSession = () => Boolean(localStorage.getItem('auth_token'))

export const hasAuthSession = () => Boolean(
  localStorage.getItem('auth_logged_in') === 'true'
    && (localStorage.getItem('auth_token') || localStorage.getItem('auth_mode'))
    && isValidAuthUser(getStoredAuthUser())
)

export const getCurrentUser = async () => {
  const data = await apiRequest('/user')
  const user = getResponseUser(data) || data

  if (!isValidAuthUser(user)) {
    clearAuthSession()
    throw new Error('No authenticated user found.')
  }

  if (user) {
    localStorage.setItem('auth_user', JSON.stringify(user))
  }

  return user
}

export const logout = async () => {
  const authMode = localStorage.getItem('auth_mode')

  try {
    if (authMode !== 'token') {
      await getCsrfCookie()
    }

    await apiRequest('/logout', {
      method: 'POST',
      includeCredentials: authMode !== 'token',
      includeXsrf: authMode !== 'token',
    })
  } finally {
    clearAuthSession()
  }
}

export const getGoogleAuthUrl = (redirectPath = '') => {
  const configuredUrl = (import.meta.env.VITE_GOOGLE_AUTH_URL || '').trim()
  const fallbackUrl = `${BACKEND_URL}/api/auth/google/redirect`

  let authUrl
  try {
    authUrl = new URL(configuredUrl || fallbackUrl, window.location.origin)
  } catch {
    authUrl = new URL('/api/auth/google/redirect', window.location.origin)
  }

  if (redirectPath?.startsWith('/') && !redirectPath.startsWith('//')) {
    authUrl.searchParams.set('redirect', redirectPath)
  }

  return authUrl.toString()
}

export const exchangeGoogleCode = (code) => apiRequest('/auth/google/exchange', {
  method: 'POST',
  body: JSON.stringify({ code }),
  includeCredentials: false,
  includeXsrf: false,
})

export const requestPasswordReset = (email) => apiRequest('/auth/forgot-password', {
  method: 'POST',
  body: JSON.stringify({ email }),
  includeCredentials: false,
  includeXsrf: false,
})

export const resetPassword = ({ token, email, password, password_confirmation }) => apiRequest('/auth/reset-password', {
  method: 'POST',
  body: JSON.stringify({ token, email, password, password_confirmation }),
  includeCredentials: false,
  includeXsrf: false,
})

export const getRedirectPath = () => {
  const redirectPath = new URLSearchParams(window.location.search).get('redirect')

  return redirectPath?.startsWith('/') ? redirectPath : '/profile'
}

export const getLoginRedirectPath = (user) => {
  const redirectPath = getRedirectPath()

  if (redirectPath !== '/profile') {
    return redirectPath
  }

  return isAdminUser(user) ? '/admin/dashboard' : '/profile'
}

export const updateUserProfile = async (profile) => {
  const payload = {}

  if (profile.name) payload.name = profile.name
  if (profile.email) payload.email = profile.email
  if (profile.password) payload.password = profile.password

  const data = await apiRequest('/user/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

  const user = getResponseUser(data) || data

  if (isValidAuthUser(user)) {
    localStorage.setItem('auth_user', JSON.stringify(user))
  }

  return user
}

// GET /user/profile returns the authenticated user eager-loaded with courses,
// enrollments.course, lessonProgress.lesson and payments.course.
export const getUserProfile = async () => {
  const data = await apiRequest('/user/profile')
  const user = getResponseUser(data) || data

  if (isValidAuthUser(user)) {
    localStorage.setItem('auth_user', JSON.stringify(user))
  }

  return user
}
