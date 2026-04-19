"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTransactions } from "@/hooks/use-transactions"
import { useProfile } from "@/hooks/use-profile"
import { Sparkles, Loader2, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Target } from "lucide-react"
import type { AIRecommendation } from "@/lib/types"

export function AIAdvisor() {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [analyzed, setAnalyzed] = useState(false)

  const { transactions } = useTransactions()
  const { profile } = useProfile()

  const financialData = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

    const currentMonthTransactions = transactions.filter((t) => {
      const date = new Date(t.date)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })

    const lastMonthTransactions = transactions.filter((t) => {
      const date = new Date(t.date)
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear
    })

    const currentIncome = currentMonthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const currentExpenses = currentMonthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const lastMonthExpenses = lastMonthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const expensesByCategory: Record<string, { amount: number; name: string }> = {}
    currentMonthTransactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const categoryName = t.category?.name || "Sin categoria"
        if (!expensesByCategory[categoryName]) {
          expensesByCategory[categoryName] = { amount: 0, name: categoryName }
        }
        expensesByCategory[categoryName].amount += Number(t.amount)
      })

    const topExpenses = Object.values(expensesByCategory)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    return {
      currentIncome,
      currentExpenses,
      lastMonthExpenses,
      balance: currentIncome - currentExpenses,
      savingsRate: currentIncome > 0 ? ((currentIncome - currentExpenses) / currentIncome) * 100 : 0,
      topExpenses,
      monthlyBudget: profile?.monthly_budget || 0,
    }
  }, [transactions, profile])

  const generateRecommendations = () => {
    setLoading(true)
    
    // Simulate AI processing delay
    setTimeout(() => {
      const newRecommendations: AIRecommendation[] = []

      // Analyze savings rate
      if (financialData.savingsRate < 0) {
        newRecommendations.push({
          title: "Gastos mayores que ingresos",
          description: `Este mes estas gastando mas de lo que ganas. Tus gastos superan tus ingresos por $${Math.abs(financialData.balance).toFixed(2)}. Considera reducir gastos no esenciales.`,
          priority: "high",
          category: "savings",
        })
      } else if (financialData.savingsRate < 10) {
        newRecommendations.push({
          title: "Tasa de ahorro baja",
          description: `Tu tasa de ahorro es del ${financialData.savingsRate.toFixed(1)}%. Los expertos recomiendan ahorrar al menos el 20% de tus ingresos. Intenta reducir gastos en categorias no prioritarias.`,
          priority: "medium",
          category: "savings",
        })
      } else if (financialData.savingsRate >= 20) {
        newRecommendations.push({
          title: "Excelente tasa de ahorro",
          description: `Felicidades! Tu tasa de ahorro del ${financialData.savingsRate.toFixed(1)}% esta por encima del objetivo recomendado. Considera invertir tu excedente para hacer crecer tu dinero.`,
          priority: "low",
          category: "savings",
        })
      }

      // Analyze expense growth
      if (financialData.lastMonthExpenses > 0) {
        const expenseGrowth = ((financialData.currentExpenses - financialData.lastMonthExpenses) / financialData.lastMonthExpenses) * 100
        if (expenseGrowth > 20) {
          newRecommendations.push({
            title: "Aumento significativo de gastos",
            description: `Tus gastos aumentaron un ${expenseGrowth.toFixed(1)}% comparado con el mes pasado. Revisa tus compras recientes para identificar gastos innecesarios.`,
            priority: "high",
            category: "expenses",
          })
        }
      }

      // Analyze top expense categories
      if (financialData.topExpenses.length > 0) {
        const topExpense = financialData.topExpenses[0]
        const percentOfTotal = (topExpense.amount / financialData.currentExpenses) * 100
        
        if (percentOfTotal > 40) {
          newRecommendations.push({
            title: `Alto gasto en ${topExpense.name}`,
            description: `La categoria "${topExpense.name}" representa el ${percentOfTotal.toFixed(1)}% de tus gastos totales ($${topExpense.amount.toFixed(2)}). Considera buscar alternativas mas economicas.`,
            priority: "medium",
            category: "category",
          })
        }
      }

      // Budget analysis
      if (financialData.monthlyBudget > 0) {
        const budgetUsage = (financialData.currentExpenses / financialData.monthlyBudget) * 100
        if (budgetUsage > 100) {
          newRecommendations.push({
            title: "Presupuesto excedido",
            description: `Has superado tu presupuesto mensual de $${financialData.monthlyBudget.toFixed(2)} por $${(financialData.currentExpenses - financialData.monthlyBudget).toFixed(2)}. Ajusta tus gastos para el resto del mes.`,
            priority: "high",
            category: "budget",
          })
        } else if (budgetUsage > 80) {
          newRecommendations.push({
            title: "Cerca del limite de presupuesto",
            description: `Has usado el ${budgetUsage.toFixed(1)}% de tu presupuesto mensual. Te quedan $${(financialData.monthlyBudget - financialData.currentExpenses).toFixed(2)} para el resto del mes.`,
            priority: "medium",
            category: "budget",
          })
        }
      }

      // General tips based on patterns
      if (financialData.topExpenses.some(e => e.name.toLowerCase().includes("entretenimiento"))) {
        const entertainmentExpense = financialData.topExpenses.find(e => e.name.toLowerCase().includes("entretenimiento"))
        if (entertainmentExpense && entertainmentExpense.amount > financialData.currentIncome * 0.1) {
          newRecommendations.push({
            title: "Optimiza gastos de entretenimiento",
            description: "Considera alternativas gratuitas como parques, eventos comunitarios o noches de peliculas en casa para reducir gastos de entretenimiento sin sacrificar la diversion.",
            priority: "low",
            category: "tips",
          })
        }
      }

      // Add a positive recommendation if finances are healthy
      if (newRecommendations.filter(r => r.priority === "high").length === 0) {
        newRecommendations.push({
          title: "Finanzas saludables",
          description: "Tus finanzas van por buen camino. Mantén tus habitos de gasto controlados y considera establecer metas de ahorro a largo plazo como un fondo de emergencia o inversiones.",
          priority: "low",
          category: "general",
        })
      }

      setRecommendations(newRecommendations)
      setLoading(false)
      setAnalyzed(true)
    }, 1500)
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case "medium":
        return <Target className="h-5 w-5 text-amber-500" />
      case "low":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      default:
        return <Sparkles className="h-5 w-5 text-blue-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-red-500/50 bg-red-500/5"
      case "medium":
        return "border-amber-500/50 bg-amber-500/5"
      case "low":
        return "border-green-500/50 bg-green-500/5"
      default:
        return "border-border"
    }
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Asesor Financiero IA
        </CardTitle>
        <CardDescription>
          Analiza tus habitos financieros y recibe recomendaciones personalizadas para mejorar tu salud financiera.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-green-500/10">
            <div className="flex items-center gap-2 text-green-500 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Ingresos</span>
            </div>
            <p className="text-xl font-bold">${financialData.currentIncome.toFixed(0)}</p>
          </div>
          <div className="p-4 rounded-lg bg-red-500/10">
            <div className="flex items-center gap-2 text-red-500 mb-1">
              <TrendingDown className="h-4 w-4" />
              <span className="text-sm font-medium">Gastos</span>
            </div>
            <p className="text-xl font-bold">${financialData.currentExpenses.toFixed(0)}</p>
          </div>
          <div className={`p-4 rounded-lg ${financialData.balance >= 0 ? "bg-blue-500/10" : "bg-orange-500/10"}`}>
            <div className={`flex items-center gap-2 ${financialData.balance >= 0 ? "text-blue-500" : "text-orange-500"} mb-1`}>
              <Target className="h-4 w-4" />
              <span className="text-sm font-medium">Balance</span>
            </div>
            <p className="text-xl font-bold">${financialData.balance.toFixed(0)}</p>
          </div>
          <div className={`p-4 rounded-lg ${financialData.savingsRate >= 20 ? "bg-emerald-500/10" : "bg-amber-500/10"}`}>
            <div className={`flex items-center gap-2 ${financialData.savingsRate >= 20 ? "text-emerald-500" : "text-amber-500"} mb-1`}>
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Ahorro</span>
            </div>
            <p className="text-xl font-bold">{financialData.savingsRate.toFixed(1)}%</p>
          </div>
        </div>

        {/* Analyze Button */}
        <Button 
          onClick={generateRecommendations} 
          disabled={loading || transactions.length === 0}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Analizando tus finanzas...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              {analyzed ? "Volver a Analizar" : "Analizar Mis Finanzas"}
            </>
          )}
        </Button>

        {transactions.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            Agrega algunas transacciones para recibir recomendaciones personalizadas.
          </p>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Recomendaciones:</h3>
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getPriorityColor(rec.priority)}`}
              >
                <div className="flex items-start gap-3">
                  {getPriorityIcon(rec.priority)}
                  <div>
                    <h4 className="font-medium">{rec.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
