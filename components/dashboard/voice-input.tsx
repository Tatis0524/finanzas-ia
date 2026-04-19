"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTransactions, useCategories } from "@/hooks/use-transactions"
import { Mic, MicOff, Loader2, CheckCircle, XCircle } from "lucide-react"

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

export function VoiceInput() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [status, setStatus] = useState<"idle" | "listening" | "processing" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [isSupported, setIsSupported] = useState(true)

  const { addTransaction } = useTransactions()
  const { expenseCategories, incomeCategories } = useCategories()

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsSupported("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    }
  }, [])

  const parseTranscript = useCallback((text: string) => {
    const normalizedText = text.toLowerCase().trim()
    
    // Detect type
    let type: "income" | "expense" = "expense"
    if (normalizedText.includes("ingreso") || normalizedText.includes("gane") || normalizedText.includes("recibi")) {
      type = "income"
    }

    // Extract amount
    const amountMatch = normalizedText.match(/(\d+(?:[.,]\d+)?)\s*(?:pesos|dolares|euros)?/)
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(",", ".")) : null

    // Match category
    const categories = type === "income" ? incomeCategories : expenseCategories
    let matchedCategory = null

    const categoryKeywords: Record<string, string[]> = {
      "alimentacion": ["comida", "almuerzo", "cena", "desayuno", "restaurante", "cafe", "super", "mercado"],
      "transporte": ["uber", "taxi", "gasolina", "metro", "autobus", "transporte", "estacionamiento"],
      "entretenimiento": ["cine", "netflix", "spotify", "juego", "concierto", "fiesta"],
      "servicios": ["luz", "agua", "gas", "internet", "telefono", "celular"],
      "salud": ["doctor", "medicina", "farmacia", "hospital", "dentista"],
      "educacion": ["curso", "libro", "escuela", "universidad", "clase"],
      "compras": ["ropa", "zapatos", "tienda", "amazon", "compra"],
      "salario": ["salario", "sueldo", "nomina", "pago"],
      "freelance": ["freelance", "proyecto", "cliente", "trabajo"],
      "inversiones": ["inversion", "dividendo", "interes", "rendimiento"],
    }

    for (const [categoryName, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => normalizedText.includes(keyword))) {
        matchedCategory = categories.find(c => 
          c.name.toLowerCase().includes(categoryName) || 
          categoryName.includes(c.name.toLowerCase())
        )
        if (matchedCategory) break
      }
    }

    // Extract description (use original text after removing amount)
    let description = text
    if (amountMatch) {
      description = text.replace(amountMatch[0], "").trim()
    }
    description = description.replace(/^(gaste|gane|recibi|pague)\s*/i, "").trim()

    return { type, amount, category: matchedCategory, description }
  }, [expenseCategories, incomeCategories])

  const startListening = useCallback(() => {
    if (!isSupported) return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = "es-MX"

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const current = event.results[event.results.length - 1]
      const transcriptText = current[0].transcript
      setTranscript(transcriptText)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error)
      setStatus("error")
      setMessage("Error al reconocer la voz. Intenta de nuevo.")
      setIsListening(false)
    }

    recognition.onend = async () => {
      setIsListening(false)
      if (transcript) {
        setStatus("processing")
        try {
          const parsed = parseTranscript(transcript)
          
          if (!parsed.amount || parsed.amount <= 0) {
            setStatus("error")
            setMessage("No se detecto un monto valido. Intenta decir algo como 'Gaste 150 pesos en comida'")
            return
          }

          await addTransaction({
            type: parsed.type,
            amount: parsed.amount,
            description: parsed.description || null,
            category_id: parsed.category?.id || null,
            date: new Date().toISOString().split("T")[0],
          })

          setStatus("success")
          setMessage(`Se registro un ${parsed.type === "income" ? "ingreso" : "gasto"} de $${parsed.amount.toFixed(2)}${parsed.category ? ` en ${parsed.category.name}` : ""}`)
          
          setTimeout(() => {
            setStatus("idle")
            setTranscript("")
            setMessage("")
          }, 3000)
        } catch (error) {
          console.error("Error saving transaction:", error)
          setStatus("error")
          setMessage("Error al guardar la transaccion")
        }
      }
    }

    recognition.start()
    setIsListening(true)
    setStatus("listening")
    setTranscript("")
    setMessage("")
  }, [isSupported, transcript, parseTranscript, addTransaction])

  const stopListening = () => {
    setIsListening(false)
  }

  if (!isSupported) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MicOff className="h-5 w-5" />
            Entrada por Voz
          </CardTitle>
          <CardDescription>
            Tu navegador no soporta reconocimiento de voz. Intenta usar Chrome o Edge.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Entrada por Voz
        </CardTitle>
        <CardDescription>
          Registra gastos e ingresos usando tu voz. Di algo como &quot;Gaste 150 pesos en comida&quot; o &quot;Recibi 5000 pesos de salario&quot;
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center gap-4">
          <Button
            size="lg"
            variant={isListening ? "destructive" : "default"}
            className={`h-24 w-24 rounded-full ${isListening ? "animate-pulse" : ""}`}
            onClick={isListening ? stopListening : startListening}
          >
            {status === "processing" ? (
              <Loader2 className="h-10 w-10 animate-spin" />
            ) : isListening ? (
              <MicOff className="h-10 w-10" />
            ) : (
              <Mic className="h-10 w-10" />
            )}
          </Button>

          <p className="text-sm text-muted-foreground">
            {isListening
              ? "Escuchando... Habla ahora"
              : status === "processing"
              ? "Procesando..."
              : "Presiona para hablar"}
          </p>
        </div>

        {transcript && (
          <div className="p-4 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground mb-1">Transcripcion:</p>
            <p className="font-medium">&quot;{transcript}&quot;</p>
          </div>
        )}

        {message && (
          <div
            className={`p-4 rounded-lg flex items-center gap-3 ${
              status === "success"
                ? "bg-green-500/10 text-green-500"
                : status === "error"
                ? "bg-red-500/10 text-red-500"
                : "bg-muted"
            }`}
          >
            {status === "success" && <CheckCircle className="h-5 w-5 shrink-0" />}
            {status === "error" && <XCircle className="h-5 w-5 shrink-0" />}
            <p className="text-sm">{message}</p>
          </div>
        )}

        <div className="text-sm text-muted-foreground space-y-2">
          <p className="font-medium">Ejemplos de comandos:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>&quot;Gaste 200 pesos en el supermercado&quot;</li>
            <li>&quot;Pague 500 pesos de uber&quot;</li>
            <li>&quot;Recibi 10000 pesos de salario&quot;</li>
            <li>&quot;Gane 3000 pesos de freelance&quot;</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
