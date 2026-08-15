import AdminPageHeader from './AdminPageHeader'

const AnnouncementsPage = () => (
  <div className="px-5 py-8 xl:px-8">
    <AdminPageHeader title="Announcements" text="Create platform updates for learners and instructors." />
    <textarea className="mt-8 min-h-56 w-full rounded-xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 outline-none" placeholder="Write a new announcement..." />
  </div>
)

export default AnnouncementsPage
