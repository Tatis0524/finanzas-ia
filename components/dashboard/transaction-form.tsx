"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

// Devuelve la fecha de HOY en hora local como "YYYY-MM-DD".
// No usar new Date().toISOString() aqui: eso convierte a UTC y puede
// adelantar la fecha un dia cuando la hora local esta detras de UTC (ej: Colombia UTC-5).
function getLocalDateString(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
}
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { useTransactions, useCategories } from "@/hooks/use-transactions"
import { Plus, Loader2 } from "lucide-react"
import type { Transaction } from "@/lib/types"

interface TransactionFormProps {
  transaction?: Transaction
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function TransactionForm({ transaction, onSuccess, trigger }: TransactionFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState<"income" | "expense">(transaction?.type || "expense")
  const [amount, setAmount] = useState(transaction?.amount?.toString() || "")
  const [description, setDescription] = useState(transaction?.description || "")
  const [categoryId, setCategoryId] = useState(transaction?.category_id || "")
  const [date, setDate] = useState(transaction?.date || getLocalDateString())

  const { addTransaction, updateTransaction, transactions } = useTransactions()
  const { incomeCategories, expenseCategories } = useCategories()

  const categories = type === "income" ? incomeCategories : expenseCategories

  // Saldo actual = ingresos - egresos
  const currentBalance = (transactions ?? []).reduce(
    (acc, t) => (t.type === "income" ? acc + t.amount : acc - t.amount),
    0
  )

  // Si estamos editando un egreso existente, se le "devuelve" su monto original
  // al saldo disponible, porque ese egreso ya estaba descontado.
  const availableBalance =
    transaction && transaction.type === "expense"
      ? currentBalance + transaction.amount
      : currentBalance

  const parsedAmount = parseFloat(amount) || 0
  const exceedsBalance = type === "expense" && parsedAmount > availableBalance

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (transaction) {
        await updateTransaction(transaction.id, {
          type,
          amount: parseFloat(amount),
          description,
          category_id: categoryId || null,
          date,
        })
      } else {
        await addTransaction({
          type,
          amount: parseFloat(amount),
          description,
          category_id: categoryId || null,
          date,
        })
      }
      setOpen(false)
      resetForm()
      onSuccess?.()
    } catch (error) {
      console.error("Error saving transaction:", error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    if (!transaction) {
      setType("expense")
      setAmount("")
      setDescription("")
      setCategoryId("")
      setDate(getLocalDateString())
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2" size="sm">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nueva Transaccion</span>
            <span className="sm:hidden">Nueva</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {transaction ? "Editar Transaccion" : "Nueva Transaccion"}
          </DialogTitle>
          <DialogDescription>
            {transaction
              ? "Modifica los detalles de tu transaccion"
              : "Registra un nuevo ingreso o gasto"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel>Tipo</FieldLabel>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={type === "expense" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => {
                    setType("expense")
                    setCategoryId("")
                  }}
                >
                  Gasto
                </Button>
                <Button
                  type="button"
                  variant={type === "income" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => {
                    setType("income")
                    setCategoryId("")
                  }}
                >
                  Ingreso
                </Button>
              </div>
            </Field>

            <Field>
              <FieldLabel htmlFor="amount">Monto</FieldLabel>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                aria-invalid={exceedsBalance}
              />
              {exceedsBalance && (
                <p className="text-sm text-destructive">
                  No se puede registrar este egreso porque supera el saldo disponible.
                  Monto máximo permitido: ${availableBalance.toFixed(2)}
                </p>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="description">Descripcion</FieldLabel>
              <Input
                id="description"
                placeholder="Ej: Almuerzo en restaurante"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="category">Categoria</FieldLabel>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="date">Fecha</FieldLabel>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </Field>
          </FieldGroup>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || exceedsBalance}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : transaction ? (
                "Actualizar"
              ) : (
                "Guardar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
