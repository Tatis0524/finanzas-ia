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
      dispararNotificacionCritica(percentage).catch((err) => {
        console.warn("[BalanceAlert] Notificación falló silenciosamente:", err)
      })
      lastNotifiedAt.current = now
    }
    previousLevel.current = level
  }, [level, percentage])

  return { monthlyIncome, balance, percentage, level }
}

async function dispararNotificacionCritica(percentage: number | null) {
  if (typeof window === "undefined" || !("Notification" in window)) return

  const body = `Tu saldo disponible es el ${percentage?.toFixed(1)}% de tus ingresos del mes.`

  const enviar = async () => {
    try {
      // En Chrome de escritorio el constructor Notification() funciona directo.
      // En Chrome Android (y muchos otros navegadores moviles), ese constructor
      // esta BLOQUEADO y lanza "Illegal constructor" - solo se permite mostrar
      // notificaciones a traves de un Service Worker registrado.
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration) {
          await registration.showNotification("⚠️ Saldo en nivel crítico", {
            body,
            icon: "/icons/icon-192.png",
          })
          return
        }
      }

      // Fallback: navegadores de escritorio que si soportan el constructor directo
      new Notification("⚠️ Saldo en nivel crítico", {
        body,
        icon: "/icons/icon-192.png",
      })
    } catch (err) {
      // Nunca dejar que un fallo de notificaciones rompa el render de la app
      console.warn("[BalanceAlert] No se pudo mostrar la notificación:", err)
    }
  }

  try {
    if (Notification.permission === "granted") {
      await enviar()
    } else if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission()
      if (permission === "granted") await enviar()
    }
  } catch (err) {
    console.warn("[BalanceAlert] Error al solicitar permiso de notificación:", err)
  }
}