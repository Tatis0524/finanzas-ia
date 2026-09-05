"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type MonthFilterContextType = {
  selectedMonth: string // formato "YYYY-MM", o "all" para ver todo
  setSelectedMonth: (month: string) => void
}

const MonthFilterContext = createContext<MonthFilterContextType | undefined>(undefined)

function getCurrentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

export function MonthFilterProvider({ children }: { children: ReactNode }) {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey())

  return (
    <MonthFilterContext.Provider value={{ selectedMonth, setSelectedMonth }}>
      {children}
    </MonthFilterContext.Provider>
  )
}

export function useMonthFilter() {
  const context = useContext(MonthFilterContext)
  if (!context) {
    throw new Error("useMonthFilter debe usarse dentro de un MonthFilterProvider")
  }
  return context
}