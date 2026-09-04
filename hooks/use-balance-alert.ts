"use client"

import { useEffect, useMemo, useRef } from "react"
import { useTransactions } from "@/hooks/use-transactions"

export type BalanceAlertLevel = "normal" | "precaucion" | "critico"

interface BalanceAlertResult {
  monthlyIncome: number
  balance: number
  percentage: number | null // null si aun no hay ingresos registrados este mes
  level: BalanceAlertLevel
}

const UMBRAL_PRECAUCION = 0.3 // 30%
const UMBRAL_CRITICO = 0.1 // 10%

export function useBalanceAlert(): BalanceAlertResult {
  const { transactions } = useTransactions()

  const { monthlyIncome, balance } = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    let monthlyIncome = 0
    let totalIncome = 0
    let totalExpense = 0

    for (const t of transactions ?? []) {
      const tDate = new Date(t.date)
      const isCurrentMonth =
        tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear

      if (t.type === "income") {
        totalIncome += t.amount
        if (isCurrentMonth) monthlyIncome += t.amount
      } else {
        totalExpense += t.amount
      }
    }

    return { monthlyIncome, balance: totalIncome - totalExpense }
  }, [transactions])

  const percentage = monthlyIncome > 0 ? (balance / monthlyIncome) * 100 : null

  let level: BalanceAlertLevel = "normal"
  if (percentage !== null) {
    if (percentage <= UMBRAL_CRITICO * 100) {
      level = "critico"
    } else if (percentage <= UMBRAL_PRECAUCION * 100) {
      level = "precaucion"
    }
  }

  // Notificación local: al cruzar a crítico, y luego cada 10 min si sigue en crítico
  const previousLevel = useRef<BalanceAlertLevel>("normal")
  const lastNotifiedAt = useRef<number>(0)
  const COOLDOWN_MS = 10 * 60 * 1000 // 10 minutos

  useEffect(() => {
    const now = Date.now()
    const cruzoAcritico = level === "critico" && previousLevel.current !== "critico"
    const siguecriticoYPasoElTiempo =
      level === "critico" && now - lastNotifiedAt.current > COOLDOWN_MS

    if (cruzoAcritico || siguecriticoYPasoElTiempo) {
      dispararNotificacionCritica(percentage)
      lastNotifiedAt.current = now
    }
    previousLevel.current = level
  }, [level, percentage])

  return { monthlyIncome, balance, percentage, level }
}

function dispararNotificacionCritica(percentage: number | null) {
  if (typeof window === "undefined" || !("Notification" in window)) return

  const body = `Tu saldo disponible es el ${percentage?.toFixed(1)}% de tus ingresos del mes.`

  const enviar = () => {
    new Notification("⚠️ Saldo en nivel crítico", {
      body,
      icon: "/icons/icon-192.png",
    })
  }

  if (Notification.permission === "granted") {
    enviar()
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") enviar()
    })
  }
}