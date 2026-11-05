# Agent Guide — Online Course Platform

## Project Overview

React (Vite) frontend for an online course e-commerce platform with a Laravel backend (provided as patch files only). Supports course browsing, purchasing via Bakong KHQR (Cambodia), enrollment, video lessons, and a full admin dashboard.

**This repo contains only the frontend and backend patch files — not a full Laravel installation.**

---

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React 19, Vite 8, Tailwind CSS 4 |
| Icons | FontAwesome 7 (free-solid) |
| Language | JavaScript (JSX), no TypeScript |
| Backend | Laravel (separate repo, patch files in `backend-patches/`) |
| Payment | Bakong KHQR |
| Auth | Laravel Sanctum (token or cookie-based) |
| Linting | ESLint 10 (react-hooks, react-refresh) |

---

## Directory Structure

```
src/
  main.jsx                  # Entry point
  App.jsx                   # Root component, pathname-based routing
  index.css                 # Tailwind + dark mode overrides
  lib/
    authApi.js              # Auth helpers, apiRequest(), CSRF, token mgmt
    bakongApi.js            # Bakong payment API wrapper
    cartNotifications.js    # Cart badge tracking via localStorage
    courseApi.js            # All data-fetching + normalization functions
  Components/
    Views/                  # Public pages (Home, Banner, Navbar, Footer, About, Contact, Coursre, Popular, Profile)
    Layout/                 # Interactive pages (CardDetail, CartPage, Login, Register, TableCard)
  admin/
    AdminDashboard.jsx      # Admin shell with sidebar routing
    pages/                  # Admin sub-pages (Dashboard, Courses, Categories, Students, Settings, Announcements)
backend-patches/            # Drop-in Laravel files (models, controllers, routes, migrations)
database/                   # SQL seeds
```

---

## Coding Conventions

### Files & Naming
- **Components**: PascalCase filenames (`CardDetail.jsx`, `AdminDashboard.jsx`)
- **Utilities**: camelCase filenames (`authApi.js`, `courseApi.js`)
- **Exports**: `export default` at end of file (arrow-function components)
- **Known typo**: `Coursre.jsx` — do not rename without updating all imports

### Component Patterns
- All functional components, no class components
- State: `useState` / `useEffect` only — no Redux, Context, or Zustand
- Async cleanup: always use `isMounted` / `ignore` flags in useEffect returns
- Routing: manual via `window.location.pathname` in `App.jsx` (no react-router)
- Data fetching: raw `fetch()` through `apiRequest()` in `authApi.js` (no Axios)

### Styling
- Tailwind utility classes inline — no CSS modules or styled-components
- Dark mode: `.dark` class on `<html>`, custom overrides in `index.css`
- Public site: indigo/blue palette; admin: violet palette

### JavaScript Style
- Single quotes for JSX attribute strings
- Arrow functions for components: `const Foo = () => {}`
- camelCase for all variables and functions
- Relative imports (`../../lib/...`) — no path aliases

---

## API Communication

- **Base URL**: `VITE_BACKEND_URL` env var, defaults to `http://127.0.0.1:8000`
- **Client**: `fetch()` wrapped in `apiRequest()` (`src/lib/authApi.js`)
- **Auth**: Bearer token (localStorage) or Sanctum cookie (CSRF)
- **401 handling**: automatic session clear + redirect to `/login`
- **Data normalization**: `normalizeCourse()`, `normalizeCategory()`, `normalizePayment()` in `src/lib/courseApi.js` and `bakongApi.js` handle inconsistent backend field names

### Key Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/user` | Current user |
| `POST /api/login`, `/register`, `/logout` | Auth |
| `GET/POST /api/courses` | Course CRUD |
| `GET/POST /api/categories` | Category CRUD |
| `POST /api/payments` | Create Bakong payment |
| `POST /api/payments/:id/check` | Poll payment status |
| `POST /api/enrollments` | Create enrollment |

---

## Payment Flow (Bakong KHQR)

1. User clicks "Buy Now" on `CardDetail.jsx`
2. Frontend calls `POST /api/payments` with `course_id` and `method: 'bakong'`
3. Backend returns a KHQR QR code (base64 or data URL)
4. QR displayed in a modal; frontend polls `POST /api/payments/:id/check` every 5 seconds
5. On confirmation → enrollment created, course unlocked

**Backend logic** lives in `backend-patches/PaymentController.php` and references a `BakongPaymentService` in the actual Laravel project.

---

## Local Storage Keys

| Key | Purpose |
|-----|---------|
| `auth_token` | Sanctum bearer token |
| `current_user` | Cached user object |
| `course_cart` | Cart items (per-user) |
| `course_purchases` | Purchase records (per-user) |
| `dark_mode` | Theme preference |

Cart and purchase data are scoped by `user.id` or `user.email`. Cart badge updates via `cart-unseen-change` custom event.

---

## Backend Patches

The `backend-patches/` directory contains Laravel files to drop into the backend:

| File | Purpose |
|------|---------|
| `Payment.php` | Eloquent model |
| `PaymentController.php` | Payment creation, Bakong QR, verification, enrollment |
| `Course.php` / `Category.php` | Eloquent models |
| `CourseController.php` / `CategoryController.php` | CRUD controllers |
| `api-routes.php` | Combined route definitions |
| `migration_payments.php` | Payments table migration |

These are **not** a standalone Laravel app — they integrate into an existing installation.

---

## Commands

```bash
npm run dev       # Start Vite dev server
npm run build     # Production build to dist/
npm run lint      # ESLint check
npm run preview   # Preview production build
```

---

## Gotchas

- **No client-side router** — all navigation is full page loads via `<a href>`. `App.jsx` uses a ternary chain on `window.location.pathname` to pick which component renders.
- **`Coursre.jsx`** is misspelled — imports reference this exact name.
- **localStorage is the source of truth** for cart and purchases — no backend cart API exists.
- **Admin routing** is simulated with `useState('Dashboard')` inside `AdminDashboard.jsx`, not via URL paths (except the top-level `/admin` check).
- **Backend is separate** — changes to `backend-patches/` must be manually applied to the Laravel project. They are not deployed by this repo's build process.
