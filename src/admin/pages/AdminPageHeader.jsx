const AdminPageHeader = ({ title, text, children }) => (
  <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
    <div>
      <h2 className="text-3xl font-black tracking-tight text-slate-950">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{text}</p>
    </div>
    {children ? <div className="flex flex-wrap items-center gap-3">{children}</div> : null}
  </div>
)

export default AdminPageHeader
