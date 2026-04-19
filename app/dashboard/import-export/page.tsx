"use client"

import { ImportExport } from "@/components/dashboard/import-export"

export default function ImportExportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Importar / Exportar</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona tus datos financieros en diferentes formatos
        </p>
      </div>

      <ImportExport />
    </div>
  )
}
