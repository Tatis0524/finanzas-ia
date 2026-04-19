"use client"

import { useAuth } from "@/hooks/use-auth"
import { useProfile } from "@/hooks/use-profile"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { TransactionList } from "@/components/dashboard/transaction-list"
import { IncomeVsExpensesChart, ExpensesByCategoryChart } from "@/components/dashboard/finance-charts"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const { profile, isLoading: profileLoading } = useProfile()

  if (authLoading || profileLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  const firstName = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Usuario"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">
          Hola, {firstName}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Aqui tienes un resumen de tus finanzas
        </p>
      </div>

      <StatsCards />

      <div className="grid gap-6 lg:grid-cols-2">
        <IncomeVsExpensesChart />
        <ExpensesByCategoryChart />
      </div>

      <TransactionList limit={5} />
    </div>
  )
}
