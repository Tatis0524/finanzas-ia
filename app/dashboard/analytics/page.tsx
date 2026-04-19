"use client"

import { StatsCards } from "@/components/dashboard/stats-cards"
import {
  IncomeVsExpensesChart,
  ExpensesByCategoryChart,
  BalanceTrendChart,
} from "@/components/dashboard/finance-charts"

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Analisis Financiero</h1>
        <p className="text-muted-foreground mt-1">
          Visualiza tus finanzas con graficos detallados
        </p>
      </div>

      <StatsCards />

      <div className="grid gap-6 lg:grid-cols-2">
        <IncomeVsExpensesChart />
        <ExpensesByCategoryChart />
      </div>

      <BalanceTrendChart />
    </div>
  )
}
