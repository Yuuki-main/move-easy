import DashboardNav from '@/components/DashboardNav'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />
      <main>{children}</main>
    </div>
  )
}
