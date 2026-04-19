"use client"

import { VoiceInput } from "@/components/dashboard/voice-input"
import { TransactionList } from "@/components/dashboard/transaction-list"

export default function VoicePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Entrada por Voz</h1>
        <p className="text-muted-foreground mt-1">
          Registra gastos e ingresos usando comandos de voz
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <VoiceInput />
        <TransactionList limit={5} />
      </div>
    </div>
  )
}
