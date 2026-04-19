"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const finalTranscriptRef = useRef("")

  const { addTransaction } = useTransactions()
  const { expenseCategories, incomeCategories } = useCategories()

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsSupported("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    }
  }, [])

  // Parse Colombian number format: "50.000" -> 50000, "cincuenta mil" -> 50000
  const parseColombianAmount = useCallback((text: string): number | null => {
    const normalizedText = text.toLowerCase()
    
    // Word to number mapping for Spanish
    const wordToNum: Record<string, number> = {
      "un": 1, "uno": 1, "una": 1,
      "dos": 2, "tres": 3, "cuatro": 4, "cinco": 5,
      "seis": 6, "siete": 7, "ocho": 8, "nueve": 9, "diez": 10,
      "once": 11, "doce": 12, "trece": 13, "catorce": 14, "quince": 15,
      "veinte": 20, "treinta": 30, "cuarenta": 40, "cincuenta": 50,
      "sesenta": 60, "setenta": 70, "ochenta": 80, "noventa": 90,
      "cien": 100, "ciento": 100, "doscientos": 200, "trescientos": 300,
      "cuatrocientos": 400, "quinientos": 500, "seiscientos": 600,
      "setecientos": 700, "ochocientos": 800, "novecientos": 900,
    }
    
    // Check for "X mil" pattern (e.g., "cincuenta mil" = 50000)
    const milMatch = normalizedText.match(/(\w+)\s*mil/)
    if (milMatch) {
      const wordNum = wordToNum[milMatch[1]]
      if (wordNum) {
        // Check for additional thousands
        const afterMil = normalizedText.split("mil")[1] || ""
        let additionalAmount = 0
        
        // Check for hundreds after mil
        for (const [word, num] of Object.entries(wordToNum)) {
          if (afterMil.includes(word)) {
            additionalAmount += num
          }
        }
        
        return wordNum * 1000 + additionalAmount
      }
    }
    
    // Try to extract numeric values
    // Match patterns like: 50.000, 50,000, 50000, 50.000.000
    const numericMatches = normalizedText.match(/[\d.,]+/g)
    
    if (numericMatches) {
      for (const match of numericMatches) {
        let numStr = match
        
        // Count periods and commas to determine format
        const periodCount = (numStr.match(/\./g) || []).length
        const commaCount = (numStr.match(/,/g) || []).length
        
        // Colombian format: periods as thousands separators
        if (periodCount >= 1 && commaCount === 0) {
          // Check if it looks like Colombian format (xxx.xxx or x.xxx)
          if (/^\d{1,3}(\.\d{3})+$/.test(numStr)) {
            // Colombian thousands format
            numStr = numStr.replace(/\./g, "")
          } else if (/^\d+\.\d{1,2}$/.test(numStr)) {
            // Decimal number like 50.00
            // Keep as is
          } else {
            // Ambiguous, assume Colombian thousands
            numStr = numStr.replace(/\./g, "")
          }
        } else if (commaCount >= 1 && periodCount === 0) {
          // Comma as thousands separator
          numStr = numStr.replace(/,/g, "")
        }
        
        const num = parseFloat(numStr)
        if (!isNaN(num) && num > 0) {
          return num
        }
      }
    }
    
    return null
  }, [])

  const parseTranscript = useCallback((text: string) => {
    const normalizedText = text.toLowerCase().trim()
    
    // Detect type - expanded keywords for income
    let type: "income" | "expense" = "expense"
    const incomeKeywords = [
      "ingreso", "ingrese", "recibi", "recibí", "gane", "gané", 
      "me pagaron", "me dieron", "cobre", "cobré", "entre", "entró",
      "deposito", "depósito", "transferencia recibida"
    ]
    
    if (incomeKeywords.some(keyword => normalizedText.includes(keyword))) {
      type = "income"
    }

    // Extract amount using Colombian parser
    const amount = parseColombianAmount(normalizedText)

    // Match category
    const categories = type === "income" ? incomeCategories : expenseCategories
    let matchedCategory = null

    const categoryKeywords: Record<string, string[]> = {
      "alimentacion": ["comida", "almuerzo", "cena", "desayuno", "restaurante", "cafe", "café", "super", "mercado", "tienda", "panaderia", "panadería"],
      "transporte": ["uber", "taxi", "gasolina", "metro", "autobus", "autobús", "transporte", "estacionamiento", "parqueadero", "tanqueo", "bus", "moto"],
      "entretenimiento": ["cine", "netflix", "spotify", "juego", "concierto", "fiesta", "bar", "cerveza", "trago"],
      "servicios": ["luz", "agua", "gas", "internet", "telefono", "teléfono", "celular", "factura", "recibo"],
      "salud": ["doctor", "medicina", "farmacia", "hospital", "dentista", "drogueria", "droguería", "cita", "medico", "médico"],
      "educacion": ["curso", "libro", "escuela", "universidad", "clase", "colegio", "matricula", "matrícula"],
      "compras": ["ropa", "zapatos", "tienda", "amazon", "compra", "centro comercial", "mall"],
      "salario": ["salario", "sueldo", "nomina", "nómina", "pago", "quincena"],
      "freelance": ["freelance", "proyecto", "cliente", "trabajo", "servicio"],
      "inversiones": ["inversion", "inversión", "dividendo", "interes", "interés", "rendimiento", "ahorro"],
    }

    for (const [categoryName, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => normalizedText.includes(keyword))) {
        matchedCategory = categories.find(c => 
          c.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(categoryName) || 
          categoryName.includes(c.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
        )
        if (matchedCategory) break
      }
    }

    // Extract description
    let description = text
    // Remove common command words
    const removeWords = [
      "gaste", "gasté", "gane", "gané", "recibi", "recibí", "pague", "pagué",
      "ingreso", "ingrese", "peso", "pesos", "en", "de", "por", "para", "mil"
    ]
    for (const word of removeWords) {
      const regex = new RegExp(`\\b${word}\\b`, "gi")
      description = description.replace(regex, "")
    }
    // Remove numbers
    description = description.replace(/[\d.,]+/g, "").trim()
    // Clean up extra spaces
    description = description.replace(/\s+/g, " ").trim()

    return { type, amount, category: matchedCategory, description: description || null }
  }, [expenseCategories, incomeCategories, parseColombianAmount])

  const processTranscript = useCallback(async (transcriptText: string) => {
    if (!transcriptText.trim()) return
    
    setStatus("processing")
    try {
      const parsed = parseTranscript(transcriptText)
      
      if (!parsed.amount || parsed.amount <= 0) {
        setStatus("error")
        setMessage("No se detectó un monto válido. Intenta decir algo como 'Gasté 50.000 pesos en comida'")
        return
      }

      // Use local date to avoid timezone issues
      const now = new Date()
      const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`

      await addTransaction({
        type: parsed.type,
        amount: parsed.amount,
        description: parsed.description,
        category_id: parsed.category?.id || null,
        date: localDate,
      })

      // Format amount with Colombian thousands separator for display
      const formattedAmount = parsed.amount.toLocaleString("es-CO")

      setStatus("success")
      setMessage(`Se registró un ${parsed.type === "income" ? "ingreso" : "gasto"} de $${formattedAmount} COP${parsed.category ? ` en ${parsed.category.name}` : ""}`)
      
      setTimeout(() => {
        setStatus("idle")
        setTranscript("")
        setMessage("")
        finalTranscriptRef.current = ""
      }, 3000)
    } catch (error) {
      console.error("Error saving transaction:", error)
      setStatus("error")
      setMessage("Error al guardar la transacción")
    }
  }, [parseTranscript, addTransaction])

  const startListening = useCallback(() => {
    if (!isSupported) return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition

    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = "es-CO" // Colombian Spanish

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = ""
      let finalTranscript = ""
      
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscript += result[0].transcript
        } else {
          interimTranscript += result[0].transcript
        }
      }
      
      if (finalTranscript) {
        finalTranscriptRef.current = finalTranscript
      }
      
      setTranscript(finalTranscript || interimTranscript)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error)
      setStatus("error")
      setMessage("Error al reconocer la voz. Intenta de nuevo.")
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
      const finalText = finalTranscriptRef.current
      if (finalText) {
        processTranscript(finalText)
      }
    }

    recognition.start()
    setIsListening(true)
    setStatus("listening")
    setTranscript("")
    setMessage("")
    finalTranscriptRef.current = ""
  }, [isSupported, processTranscript])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
  }, [])

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
          Registra gastos e ingresos usando tu voz. Di algo como &quot;Gasté 50.000 pesos en comida&quot; o &quot;Recibí 3.000.000 de salario&quot;
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
            <p className="text-sm text-muted-foreground mb-1">Transcripción:</p>
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
          <p className="font-medium">Ejemplos de comandos (Pesos Colombianos):</p>
          <ul className="list-disc list-inside space-y-1">
            <li>&quot;Gasté 50.000 pesos en el mercado&quot;</li>
            <li>&quot;Pagué 120.000 pesos de servicios&quot;</li>
            <li>&quot;Recibí 3.000.000 de salario&quot;</li>
            <li>&quot;Me pagaron 500.000 pesos de freelance&quot;</li>
            <li>&quot;Gasté cincuenta mil en almuerzo&quot;</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
