"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from "lucide-react"
import { useTransactions } from "@/hooks/use-transactions"
import { useProfile } from "@/hooks/use-profile"
import { useMemo } from "react"

export function StatsCards() {
  const { transactions } = useTransactions()
  const { profile } = useProfile()

  const stats = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const monthlyTransactions = transactions.filter((t) => {
      const date = new Date(t.date)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })

    const totalIncome = monthlyTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const totalExpenses = monthlyTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const balance = totalIncome - totalExpenses
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0

    return { totalIncome, totalExpenses, balance, savingsRate }
  }, [transactions])

  const currency = profile?.currency || "MXN"

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency,
    }).format(amount)
  }

  const cards = [
    {
      title: "Ingresos del Mes",
      value: formatCurrency(stats.totalIncome),
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Gastos del Mes",
      value: formatCurrency(stats.totalExpenses),
      icon: TrendingDown,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      title: "Balance",
      value: formatCurrency(stats.balance),
      icon: Wallet,
      color: stats.balance >= 0 ? "text-blue-500" : "text-orange-500",
      bgColor: stats.balance >= 0 ? "bg-blue-500/10" : "bg-orange-500/10",
    },
    {
      title: "Tasa de Ahorro",
      value: `${stats.savingsRate.toFixed(1)}%`,
      icon: PiggyBank,
      color: stats.savingsRate >= 20 ? "text-emerald-500" : "text-amber-500",
      bgColor: stats.savingsRate >= 20 ? "bg-emerald-500/10" : "bg-amber-500/10",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`rounded-lg p-2 ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
