"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTransactions } from "@/hooks/use-transactions"
import { useProfile } from "@/hooks/use-profile"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts"

export function IncomeVsExpensesChart() {
  const { transactions } = useTransactions()
  const { profile } = useProfile()
  const currency = profile?.currency || "MXN"

  const data = useMemo(() => {
    const monthlyData: Record<string, { month: string; income: number; expenses: number }> = {}

    transactions.forEach((t) => {
      const date = new Date(t.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      const monthLabel = date.toLocaleDateString("es-MX", { month: "short", year: "2-digit" })

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthLabel, income: 0, expenses: 0 }
      }

      if (t.type === "income") {
        monthlyData[monthKey].income += Number(t.amount)
      } else {
        monthlyData[monthKey].expenses += Number(t.amount)
      }
    })

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([, data]) => data)
  }, [transactions])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency,
      notation: "compact",
    }).format(value)
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Ingresos vs Gastos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {data.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No hay datos suficientes para mostrar el grafico
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis tickFormatter={formatCurrency} className="text-xs" />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="income" name="Ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function ExpensesByCategoryChart() {
  const { transactions } = useTransactions()
  const { profile } = useProfile()
  const currency = profile?.currency || "MXN"

  const data = useMemo(() => {
    const categoryTotals: Record<string, { name: string; value: number; color: string }> = {}

    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const categoryName = t.category?.name || "Sin categoria"
        const categoryColor = t.category?.color || "#6b7280"

        if (!categoryTotals[categoryName]) {
          categoryTotals[categoryName] = { name: categoryName, value: 0, color: categoryColor }
        }
        categoryTotals[categoryName].value += Number(t.amount)
      })

    return Object.values(categoryTotals).sort((a, b) => b.value - a.value)
  }, [transactions])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency,
    }).format(value)
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Gastos por Categoria</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {data.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No hay gastos registrados
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function BalanceTrendChart() {
  const { transactions } = useTransactions()
  const { profile } = useProfile()
  const currency = profile?.currency || "MXN"

  const data = useMemo(() => {
    const dailyBalance: { date: string; balance: number }[] = []
    let runningBalance = 0

    const sortedTransactions = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    const dailyData: Record<string, number> = {}

    sortedTransactions.forEach((t) => {
      const dateKey = t.date
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = 0
      }
      if (t.type === "income") {
        dailyData[dateKey] += Number(t.amount)
      } else {
        dailyData[dateKey] -= Number(t.amount)
      }
    })

    Object.entries(dailyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .forEach(([date, change]) => {
        runningBalance += change
        dailyBalance.push({
          date: new Date(date).toLocaleDateString("es-MX", { day: "numeric", month: "short" }),
          balance: runningBalance,
        })
      })

    return dailyBalance
  }, [transactions])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency,
      notation: "compact",
    }).format(value)
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Tendencia del Balance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {data.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No hay datos suficientes
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis tickFormatter={formatCurrency} className="text-xs" />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  name="Balance"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
