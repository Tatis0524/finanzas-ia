"use client"

import { LifestyleGenerator } from "@/components/dashboard/lifestyle-generator"

export default function LifestylePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Estilo de Vida Financiero</h1>
        <p className="text-muted-foreground mt-1">
          Genera imagenes y videos con IA basados en tu perfil financiero
        </p>
      </div>

      <LifestyleGenerator />
    </div>
  )
}
