"use client"

import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import type { Transaction, Category } from "@/lib/types"
import { useMonthFilter } from "@/hooks/use-month-filter"

const supabase = createClient()

function getMonthRange(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number)
  const start = `${year}-${String(month).padStart(2, "0")}-01`
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const end = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`
  return { start, end }
}

async function fetchTransactions(monthKey: string): Promise<Transaction[]> {
  let query = supabase
    .from("transactions")
    .select("*, category:categories(*)")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })

  if (monthKey !== "all") {
    const { start, end } = getMonthRange(monthKey)
    query = query.gte("date", start).lt("date", end)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name")

  if (error) throw error
  return data || []
}

export function useTransactions() {
  const { selectedMonth } = useMonthFilter()

  const { data, error, isLoading, mutate } = useSWR<Transaction[]>(
    ["transactions", selectedMonth],
    () => fetchTransactions(selectedMonth)
  )

  const addTransaction = async (transaction: Omit<Transaction, "id" | "user_id" | "created_at" | "updated_at" | "category">) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("No user")

    const { data: newTransaction, error } = await supabase
      .from("transactions")
      .insert({ ...transaction, user_id: user.id })
      .select("*, category:categories(*)")
      .single()

    if (error) throw error
    mutate()
    return newTransaction
  }

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    const { error } = await supabase
      .from("transactions")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) throw error
    mutate()
  }

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id)

    if (error) throw error
    mutate()
  }

  return {
    transactions: data || [],
    isLoading,
    error,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refresh: mutate,
  }
}

export function useCategories() {
  const { data, error, isLoading, mutate } = useSWR<Category[]>(
    "categories",
    fetchCategories
  )

  const addCategory = async (category: Omit<Category, "id" | "user_id" | "created_at">) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("No user")

    const { data: newCategory, error } = await supabase
      .from("categories")
      .insert({ ...category, user_id: user.id })
      .select()
      .single()

    if (error) throw error
    mutate()
    return newCategory
  }

  return {
    categories: data || [],
    incomeCategories: data?.filter(c => c.type === "income") || [],
    expenseCategories: data?.filter(c => c.type === "expense") || [],
    isLoading,
    error,
    addCategory,
    refresh: mutate,
  }
}