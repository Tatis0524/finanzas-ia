export interface Profile {
  id: string
  full_name: string | null
  currency: string
  monthly_budget: number
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  type: "income" | "expense"
  icon: string
  color: string
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  category_id: string | null
  type: "income" | "expense"
  amount: number
  description: string | null
  date: string
  created_at: string
  updated_at: string
  category?: Category
}

export interface AIImage {
  id: string
  user_id: string
  image_url: string
  prompt: string | null
  lifestyle_type: string | null
  created_at: string
}

export interface FinancialSummary {
  totalIncome: number
  totalExpenses: number
  balance: number
  savingsRate: number
  topExpenseCategories: { name: string; amount: number; color: string }[]
  monthlyTrend: { month: string; income: number; expenses: number }[]
}

export interface AIRecommendation {
  title: string
  description: string
  priority: "high" | "medium" | "low"
  category: string
}
