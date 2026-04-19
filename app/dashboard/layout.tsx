import { Sidebar } from "@/components/dashboard/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="md:ml-64 p-4 md:p-8 pt-20 md:pt-8">
        {children}
      </main>
    </div>
  )
}
