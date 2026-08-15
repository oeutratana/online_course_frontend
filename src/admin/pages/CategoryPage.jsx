import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBookOpen,
  faLayerGroup,
  faPen,
  faPlus,
  faRotateRight,
  faTags,
  faTrash,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import AdminPageHeader from './AdminPageHeader'
import { createCategory, deleteCategory, getCategories, getCourses, updateCategory } from '../../lib/courseApi'

const emptyCategoryForm = {
  name: '',
  description: '',
}

const makeSlug = (value) => value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')

const getCategoryDescription = (category) => category.description || category.raw?.description || 'No description added yet.'

const CategoryPage = ({ searchQuery = '' }) => {
  const [categoryItems, setCategoryItems] = useState([])
  const [courseItems, setCourseItems] = useState([])
  const [formData, setFormData] = useState(emptyCategoryForm)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadCategoryData = () => (
    Promise.all([getCategories(), getCourses()])
      .then(([categories, courses]) => {
        setCategoryItems(categories)
        setCourseItems(courses)
      })
  )

  useEffect(() => {
    let isMounted = true

    loadCategoryData()
      .then(() => {
        if (!isMounted) return
      })
      .catch((error) => {
        if (isMounted) {
          setFormError(error.message)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const getCourseCount = (category) => courseItems.filter((course) => (
    String(course.categoryId) === String(category.id) || course.category === category.name
  )).length

  const resetForm = ({ keepMessage = false } = {}) => {
    setEditingCategory(null)
    setFormData(emptyCategoryForm)

    if (!keepMessage) {
      setFormError('')
      setFormSuccess('')
    }
  }

  const handleFormChange = (event) => {
    const { name, value } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleEditCategory = (category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name || '',
      description: getCategoryDescription(category) === 'No description added yet.' ? '' : getCategoryDescription(category),
    })
    setFormError('')
    setFormSuccess('')
  }

  const handleSaveCategory = async (event) => {
    event.preventDefault()
    setFormError('')
    setFormSuccess('')
    setIsSubmitting(true)

    try {
      const payload = {
        name: formData.name,
        slug: makeSlug(formData.name),
        description: formData.description,
      }
      const savedCategory = editingCategory?.id
        ? await updateCategory(editingCategory.id, payload)
        : await createCategory(payload)
      await loadCategoryData()

      const successMessage = editingCategory ? 'Category updated in database.' : 'Category added to database.'
      resetForm({ keepMessage: true })
      setFormSuccess(successMessage)
    } catch (error) {
      setFormError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCategory = async (category) => {
    const confirmed = window.confirm(`Delete "${category.name}"?`)
    if (!confirmed) return

    setFormError('')
    setFormSuccess('')

    try {
      await deleteCategory(category.id)
      await loadCategoryData()

      if (String(editingCategory?.id) === String(category.id)) {
        resetForm()
      }

      setFormSuccess('Category deleted from database.')
    } catch (error) {
      setFormError(error.message)
    }
  }

  const stats = [
    { label: 'Total Categories', value: categoryItems.length.toLocaleString(), icon: faLayerGroup, color: 'bg-violet-100 text-violet-700' },
    { label: 'Assigned Courses', value: courseItems.filter((course) => course.categoryId).length.toLocaleString(), icon: faBookOpen, color: 'bg-emerald-100 text-emerald-700' },
    { label: 'Unassigned Courses', value: courseItems.filter((course) => !course.categoryId).length.toLocaleString(), icon: faTags, color: 'bg-amber-100 text-amber-700' },
  ]
  const normalizedSearch = searchQuery.trim().toLowerCase()
  const filteredCategoryItems = normalizedSearch
    ? categoryItems.filter((category) => [
      category.name,
      category.slug || category.raw?.slug || makeSlug(category.name),
      getCategoryDescription(category),
      getCourseCount(category),
    ].join(' ').toLowerCase().includes(normalizedSearch))
    : categoryItems

  return (
    <div className="px-5 py-8 xl:px-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <AdminPageHeader title="Categories" text="Create and organize course categories for the platform." />
        {/* <button className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 text-sm font-black text-white shadow-lg shadow-violet-200" onClick={() => resetForm()} type="button">
          <FontAwesomeIcon icon={faPlus} />
          Add Category
        </button>  */}
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 shadow-sm"
          onClick={() => {
            setFormError('')
            setFormSuccess('')
            loadCategoryData()
              .then(() => setFormSuccess('Category list refreshed from database.'))
              .catch((error) => setFormError(error.message))
          }}
          type="button"
        >
          <FontAwesomeIcon icon={faRotateRight} />
          Refresh
        </button>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {stats.map((stat) => (
          <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-md shadow-slate-200/50" key={stat.label}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight">{stat.value}</h2>
              </div>
              <span className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${stat.color}`}>
                <FontAwesomeIcon icon={stat.icon} />
              </span>
            </div>
          </article>
        ))}
      </div>

      <section className="mt-8 rounded-2xl border border-slate-100 bg-white p-6 shadow-md shadow-slate-200/50">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-violet-600">{editingCategory ? 'Edit Category' : 'Add Category'}</p>
            <h2 className="mt-1 text-2xl font-black">{editingCategory ? editingCategory.name : 'Category Manager'}</h2>
            <p className="mt-1 text-sm text-slate-500">Categories are used when creating and filtering courses.</p>
          </div>
          {editingCategory && (
            <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-black text-slate-600" onClick={() => resetForm()} type="button">
              <FontAwesomeIcon icon={faXmark} />
              Cancel Edit
            </button>
          )}
        </div>

        <form className="mt-6 grid gap-5 lg:grid-cols-[1fr_auto]" onSubmit={handleSaveCategory}>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Category Name
            <input
              className="h-12 rounded-lg border border-slate-200 bg-slate-50 px-4 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              name="name"
              onChange={handleFormChange}
              placeholder="Development"
              required
              type="text"
              value={formData.name}
            />
          </label>
          <button
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-violet-600 px-7 text-sm font-black text-white shadow-lg shadow-violet-200 disabled:cursor-not-allowed disabled:bg-slate-400 lg:self-end"
            disabled={isSubmitting}
            type="submit"
          >
            <FontAwesomeIcon icon={editingCategory ? faPen : faPlus} />
            {isSubmitting ? 'Saving...' : editingCategory ? 'Update' : 'Add'}
          </button>
          <label className="grid gap-2 text-sm font-semibold text-slate-700 lg:col-span-2">
            Description
            <textarea
              className="min-h-28 rounded-lg border border-slate-200 bg-slate-50 p-4 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              name="description"
              onChange={handleFormChange}
              placeholder="Short category description"
              required
              value={formData.description}
            />
          </label>
          {formError && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 lg:col-span-2">{formError}</p>
          )}
          {formSuccess && (
            <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 lg:col-span-2">{formSuccess}</p>
          )}
        </form>
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-md shadow-slate-200/50">
        <div className="border-b border-slate-100 p-6">
          <h2 className="text-xl font-black">Category List</h2>
          <p className="mt-1 text-sm text-slate-500">Edit or remove categories used by your courses.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Slug</th>
                <th className="px-6 py-4">Courses</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCategoryItems.length > 0 ? filteredCategoryItems.map((category) => (
                <tr className="hover:bg-slate-50/70" key={category.id || category.name}>
                  <td className="px-6 py-5 font-black">{category.name}</td>
                  <td className="px-6 py-5 text-slate-600">{category.slug || category.raw?.slug || makeSlug(category.name)}</td>
                  <td className="px-6 py-5 font-semibold text-slate-700">{getCourseCount(category)}</td>
                  <td className="max-w-md px-6 py-5 text-slate-600">{getCategoryDescription(category)}</td>
                  <td className="px-6 py-5">
                    <div className="flex justify-end gap-2">
                      <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700" onClick={() => handleEditCategory(category)} type="button" aria-label={`Edit ${category.name}`}>
                        <FontAwesomeIcon icon={faPen} />
                      </button>
                      <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600" onClick={() => handleDeleteCategory(category)} type="button" aria-label={`Delete ${category.name}`}>
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td className="px-6 py-10 text-center text-slate-500" colSpan="5">
                    {normalizedSearch ? 'No categories match your search.' : 'No categories yet. Add your first category above.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default CategoryPage
