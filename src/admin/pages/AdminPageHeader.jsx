const AdminPageHeader = ({ title, text }) => (
  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
    <div>
      <h2 className="text-3xl font-black">{title}</h2>
      <p className="mt-2 text-slate-600">{text}</p>
    </div>
  </div>
)

export default AdminPageHeader
