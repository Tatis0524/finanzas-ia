"use client"

import { TransactionList } from "@/components/dashboard/transaction-list"
import { TransactionForm } from "@/components/dashboard/transaction-form"

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Transacciones</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona todos tus ingresos y gastos
          </p>
        </div>
        <TransactionForm />
      </div>

      <TransactionList showHeader={false} />
    </div>
  )
}
