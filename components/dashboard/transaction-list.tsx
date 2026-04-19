"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useTransactions } from "@/hooks/use-transactions"
import { useProfile } from "@/hooks/use-profile"
import { TransactionForm } from "./transaction-form"
import { Pencil, Trash2, TrendingUp, TrendingDown } from "lucide-react"
import type { Transaction } from "@/lib/types"

interface TransactionListProps {
  limit?: number
  showHeader?: boolean
}

export function TransactionList({ limit, showHeader = true }: TransactionListProps) {
  const { transactions, deleteTransaction, isLoading } = useTransactions()
  const { profile } = useProfile()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const displayTransactions = limit ? transactions.slice(0, limit) : transactions

  const currency = profile?.currency || "MXN"

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const handleDelete = async () => {
    if (deleteId) {
      await deleteTransaction(deleteId)
      setDeleteId(null)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-muted rounded" />
                  <div className="h-3 w-1/4 bg-muted rounded" />
                </div>
                <div className="h-5 w-20 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border-border/50">
        {showHeader && (
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Transacciones Recientes</CardTitle>
            <TransactionForm />
          </CardHeader>
        )}
        <CardContent className={showHeader ? "" : "pt-6"}>
          {displayTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No hay transacciones registradas</p>
              <p className="text-sm mt-1">Comienza agregando tu primer ingreso o gasto</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayTransactions.map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                  onDelete={() => setDeleteId(transaction.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar transaccion</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. Se eliminara permanentemente esta transaccion de tu historial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function TransactionItem({
  transaction,
  formatCurrency,
  formatDate,
  onDelete,
}: {
  transaction: Transaction
  formatCurrency: (amount: number) => string
  formatDate: (date: string) => string
  onDelete: () => void
}) {
  const isIncome = transaction.type === "income"
  const category = transaction.category

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors group">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full"
        style={{ backgroundColor: category?.color ? `${category.color}20` : isIncome ? "#22c55e20" : "#ef444420" }}
      >
        {isIncome ? (
          <TrendingUp className="h-5 w-5 text-green-500" />
        ) : (
          <TrendingDown className="h-5 w-5 text-red-500" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          {transaction.description || category?.name || (isIncome ? "Ingreso" : "Gasto")}
        </p>
        <p className="text-sm text-muted-foreground">
          {category?.name && transaction.description ? `${category.name} • ` : ""}
          {formatDate(transaction.date)}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className={`font-semibold ${isIncome ? "text-green-500" : "text-red-500"}`}>
          {isIncome ? "+" : "-"}{formatCurrency(Number(transaction.amount))}
        </span>

        <div className="hidden group-hover:flex items-center gap-1">
          <TransactionForm
            transaction={transaction}
            trigger={
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Pencil className="h-4 w-4" />
              </Button>
            }
          />
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
