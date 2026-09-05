"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useMonthFilter } from "@/hooks/use-month-filter"

const monthNames = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

function generateMonthOptions(rangeMonths = 12) {
  const options: { value: string; label: string }[] = []
  const now = new Date()
  for (let i = 0; i < rangeMonths; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`
    options.push({ value, label })
  }
  return options
}

export function MonthFilter() {
  const { selectedMonth, setSelectedMonth } = useMonthFilter()
  const options = generateMonthOptions(12)

  return (
    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
      <SelectTrigger className="w-[180px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos los meses</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}