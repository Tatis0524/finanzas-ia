"use client"

import { AIAdvisor } from "@/components/dashboard/ai-advisor"

export default function AIAdvisorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Asesor Financiero IA</h1>
        <p className="text-muted-foreground mt-1">
          Recibe recomendaciones personalizadas basadas en tus habitos
        </p>
      </div>

      <AIAdvisor />
    </div>
  )
}
