"use client"

import { AlertTriangle, AlertOctagon } from "lucide-react"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { useBalanceAlert } from "@/hooks/use-balance-alert"

export function BalanceAlert() {
  const { level, percentage, balance } = useBalanceAlert()

  if (level === "normal") return null

  const isCritico = level === "critico"

  return (
    <Alert
      variant={isCritico ? "destructive" : "default"}
      className={
        !isCritico
          ? "border-yellow-500 text-yellow-700 [&>svg]:text-yellow-500"
          : undefined
      }
    >
      {isCritico ? (
        <AlertOctagon className="h-4 w-4" />
      ) : (
        <AlertTriangle className="h-4 w-4" />
      )}
      <AlertTitle>
        {isCritico ? "Nivel crítico de saldo" : "Nivel de precaución de saldo"}
      </AlertTitle>
      <AlertDescription>
        Tu saldo disponible (${balance.toFixed(2)}) representa el{" "}
        {percentage?.toFixed(1)}% de tus ingresos de este mes.{" "}
        {isCritico
          ? "Evita nuevos gastos hasta recuperar tu saldo."
          : "Empieza a moderar tus gastos."}
      </AlertDescription>
    </Alert>
  )
}