"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTransactions, useCategories } from "@/hooks/use-transactions"
import { Download, Upload, FileSpreadsheet, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import * as XLSX from "xlsx"
import Papa from "papaparse"

export function ImportExport() {
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { transactions, addTransaction, refresh } = useTransactions()
  const { categories } = useCategories()

  const exportToCSV = () => {
    setExporting(true)
    try {
      const data = transactions.map((t) => ({
        Fecha: t.date,
        Tipo: t.type === "income" ? "Ingreso" : "Gasto",
        Monto: Number(t.amount),
        Categoria: t.category?.name || "Sin categoria",
        Descripcion: t.description || "",
      }))

      const csv = Papa.unparse(data)
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `finanzas_${new Date().toISOString().split("T")[0]}.csv`
      link.click()

      setMessage({ type: "success", text: "Archivo CSV exportado exitosamente" })
    } catch (error) {
      console.error("Error exporting CSV:", error)
      setMessage({ type: "error", text: "Error al exportar CSV" })
    } finally {
      setExporting(false)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const exportToExcel = () => {
    setExporting(true)
    try {
      const data = transactions.map((t) => ({
        Fecha: t.date,
        Tipo: t.type === "income" ? "Ingreso" : "Gasto",
        Monto: Number(t.amount),
        Categoria: t.category?.name || "Sin categoria",
        Descripcion: t.description || "",
      }))

      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Transacciones")

      // Add summary sheet
      const totalIncome = transactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0)
      const totalExpenses = transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0)

      const summaryData = [
        { Concepto: "Total Ingresos", Monto: totalIncome },
        { Concepto: "Total Gastos", Monto: totalExpenses },
        { Concepto: "Balance", Monto: totalIncome - totalExpenses },
      ]
      const summaryWs = XLSX.utils.json_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(wb, summaryWs, "Resumen")

      XLSX.writeFile(wb, `finanzas_${new Date().toISOString().split("T")[0]}.xlsx`)

      setMessage({ type: "success", text: "Archivo Excel exportado exitosamente" })
    } catch (error) {
      console.error("Error exporting Excel:", error)
      setMessage({ type: "error", text: "Error al exportar Excel" })
    } finally {
      setExporting(false)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    setMessage(null)

    try {
      const fileExtension = file.name.split(".").pop()?.toLowerCase()
      let importedData: Array<{
        Fecha?: string
        Tipo?: string
        Monto?: number | string
        Categoria?: string
        Descripcion?: string
      }> = []

      if (fileExtension === "csv") {
        const text = await file.text()
        const result = Papa.parse(text, { header: true, skipEmptyLines: true })
        importedData = result.data as typeof importedData
      } else if (fileExtension === "xlsx" || fileExtension === "xls") {
        const buffer = await file.arrayBuffer()
        const wb = XLSX.read(buffer)
        const ws = wb.Sheets[wb.SheetNames[0]]
        importedData = XLSX.utils.sheet_to_json(ws)
      } else {
        throw new Error("Formato de archivo no soportado")
      }

      let successCount = 0
      let errorCount = 0

      for (const row of importedData) {
        try {
          const type = row.Tipo?.toLowerCase().includes("ingreso") ? "income" : "expense"
          const amount = typeof row.Monto === "string" ? parseFloat(row.Monto) : row.Monto
          
          if (!amount || isNaN(amount) || amount <= 0) {
            errorCount++
            continue
          }

          // Try to match category
          let categoryId = null
          if (row.Categoria) {
            const matchedCategory = categories.find(
              (c) => c.name.toLowerCase() === row.Categoria?.toLowerCase() && c.type === type
            )
            categoryId = matchedCategory?.id || null
          }

          // Parse date
          let date = new Date().toISOString().split("T")[0]
          if (row.Fecha) {
            const parsedDate = new Date(row.Fecha)
            if (!isNaN(parsedDate.getTime())) {
              date = parsedDate.toISOString().split("T")[0]
            }
          }

          await addTransaction({
            type,
            amount,
            description: row.Descripcion || null,
            category_id: categoryId,
            date,
          })
          successCount++
        } catch (e) {
          console.error("Error importing row:", e)
          errorCount++
        }
      }

      await refresh()
      setMessage({
        type: successCount > 0 ? "success" : "error",
        text: `Importacion completada: ${successCount} transacciones importadas${errorCount > 0 ? `, ${errorCount} errores` : ""}`,
      })
    } catch (error) {
      console.error("Error importing file:", error)
      setMessage({ type: "error", text: "Error al importar el archivo" })
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      setTimeout(() => setMessage(null), 5000)
    }
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Importar / Exportar
        </CardTitle>
        <CardDescription>
          Exporta tus transacciones a CSV o Excel, o importa datos desde un archivo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export Section */}
        <div className="space-y-3">
          <h3 className="font-medium">Exportar Transacciones</h3>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={exportToCSV}
              disabled={exporting || transactions.length === 0}
              variant="outline"
              className="gap-2"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Exportar CSV
            </Button>
            <Button
              onClick={exportToExcel}
              disabled={exporting || transactions.length === 0}
              variant="outline"
              className="gap-2"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Exportar Excel
            </Button>
          </div>
          {transactions.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No hay transacciones para exportar
            </p>
          )}
        </div>

        {/* Import Section */}
        <div className="space-y-3">
          <h3 className="font-medium">Importar Transacciones</h3>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileImport}
              className="hidden"
              id="file-import"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              variant="outline"
              className="gap-2"
            >
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {importing ? "Importando..." : "Seleccionar Archivo"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Formatos soportados: CSV, Excel (.xlsx, .xls). El archivo debe tener columnas: Fecha, Tipo, Monto, Categoria, Descripcion.
          </p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`p-4 rounded-lg flex items-center gap-3 ${
              message.type === "success"
                ? "bg-green-500/10 text-green-500"
                : "bg-red-500/10 text-red-500"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="h-5 w-5 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0" />
            )}
            <p className="text-sm">{message.text}</p>
          </div>
        )}

        {/* Template Download */}
        <div className="pt-4 border-t border-border">
          <h3 className="font-medium mb-2">Plantilla de Importacion</h3>
          <Button
            variant="ghost"
            className="gap-2 text-muted-foreground"
            onClick={() => {
              const template = [
                { Fecha: "2024-01-15", Tipo: "Gasto", Monto: 150.00, Categoria: "Alimentacion", Descripcion: "Supermercado" },
                { Fecha: "2024-01-16", Tipo: "Ingreso", Monto: 5000.00, Categoria: "Salario", Descripcion: "Pago quincenal" },
              ]
              const csv = Papa.unparse(template)
              const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
              const link = document.createElement("a")
              link.href = URL.createObjectURL(blob)
              link.download = "plantilla_finanzas.csv"
              link.click()
            }}
          >
            <Download className="h-4 w-4" />
            Descargar plantilla CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
