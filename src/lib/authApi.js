export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000'
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

    throw new Error(getErrorMessage(data, 'Something went wrong. Please try again.'))
  }

  return data
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

const getStoredAuthUser = () => {
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
  const name = `${profile.firstName || ''} ${profile.lastName || ''}`.trim()

  const data = await apiRequest('/user/profile', {
    method: 'PUT',
    body: JSON.stringify({
      ...profile,
      name,
    }),
  })

  const user = getResponseUser(data) || data

  if (isValidAuthUser(user)) {
    localStorage.setItem('auth_user', JSON.stringify(user))
  }

  return data
}
