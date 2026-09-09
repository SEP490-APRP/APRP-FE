/* ===== Sidebar Component ===== */
const Sidebar = () => {
  return (
    <aside className="hidden w-64 border-r border-border bg-surface lg:block">
      <div className="flex h-full flex-col p-4">
        <nav className="flex flex-col gap-1">
          {/* Sidebar navigation items will be added per feature */}
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Menu
          </p>
        </nav>
      </div>
    </aside>
  )
}

export default Sidebar
