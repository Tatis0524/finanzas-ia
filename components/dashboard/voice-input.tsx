"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTransactions, useCategories } from "@/hooks/use-transactions"
import { Mic, MicOff, Loader2, CheckCircle, XCircle, Pencil, RotateCcw } from "lucide-react"

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
  const [status, setStatus] = useState <
    "idle" | "listening" | "processing" | "confirming" | "success" | "error"
  >("idle")
  const [message, setMessage] = useState("")
  const [isSupported, setIsSupported] = useState(true)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const finalTranscriptRef = useRef("")

  // Borrador editable que el usuario confirma antes de guardar
  const [draft, setDraft] = useState<{
    type: "income" | "expense"
    amount: string
    description: string
    categoryId: string
  } | null>(null)

  const { addTransaction, transactions } = useTransactions()
  const { expenseCategories, incomeCategories } = useCategories()

  // Saldo actual = ingresos - egresos (misma logica que en transaction-form.tsx)
  const currentBalance = (transactions ?? []).reduce(
    (acc, t) => (t.type === "income" ? acc + t.amount : acc - t.amount),
    0
  )

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
    // Convierte un token (digito "30" o palabra "treinta") a numero
    const tokenToNumber = (token: string): number | null => {
      if (/^\d+$/.test(token)) return parseInt(token, 10)
      return wordToNum[token] ?? null
    }

    // Check for "X millones [Y mil]" pattern (e.g., "3 millones", "tres millones quinientos mil")
    const millonMatch = normalizedText.match(
      /(\w+)\s*(?:millones|millón|millon)(?:\s+(?:de\s+)?(?:pesos\s+)?(\w+)\s*mil)?/
    )
    if (millonMatch) {
      const millones = tokenToNumber(millonMatch[1])
      if (millones !== null) {
        let total = millones * 1_000_000
        if (millonMatch[2]) {
          const miles = tokenToNumber(millonMatch[2])
          if (miles !== null) total += miles * 1000
        }
        return total
      }
    }

    // Check for "X mil [Y]" pattern (e.g., "cincuenta mil" = 50000, "30 mil" = 30000, "ocho mil" = 8000)
    const milMatch = normalizedText.match(/(\w+)\s*mil(?:\s+(\w+))?/)
    if (milMatch) {
      const miles = tokenToNumber(milMatch[1])
      if (miles !== null) {
        let total = miles * 1000
        if (milMatch[2]) {
          const extra = tokenToNumber(milMatch[2])
          if (extra !== null && extra < 1000) total += extra
        }
        return total
      }
    }

    // Chrome a veces transcribe numeros grandes con ESPACIOS en vez de puntos
    // (ej: "noventa mil" -> "90 000", "tres millones" -> "3 000 000")
    // Tambien cubre el formato normal con puntos: "50.000", "1.500.000"
    const groupedMatch = normalizedText.match(/\d{1,3}(?:[.\s]\d{3})+/)
    if (groupedMatch) {
      const numStr = groupedMatch[0].replace(/[.\s]/g, "")
      const num = parseInt(numStr, 10)
      if (!isNaN(num) && num > 0) return num
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
    // Remove common command words (incluye palabras numericas: "un millon", "treinta mil", etc.)
    const removeWords = [
      "gaste", "gasté", "gane", "gané", "recibi", "recibí", "pague", "pagué",
      "cobre", "cobré", "ingreso", "ingrese", "peso", "pesos", "en", "de", "del",
      "por", "para", "que", "mi", "con",
      "mil", "millon", "millón", "millones",
      "un", "una", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete",
      "ocho", "nueve", "diez", "once", "doce", "trece", "catorce", "quince",
      "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta",
      "ochenta", "noventa", "cien", "ciento", "doscientos", "trescientos",
      "cuatrocientos", "quinientos", "seiscientos", "setecientos",
      "ochocientos", "novecientos",
    ]
    for (const word of removeWords) {
      // \b falla con palabras que empiezan/terminan en vocal acentuada (gasté, recibí, pagué),
      // porque \b se basa en \w y las tildes no cuentan como caracter de palabra.
      // Usamos lookaround con \p{L} (unicode) en vez de \b para que sí las reconozca.
      const regex = new RegExp(`(?<![\\p{L}\\p{N}])${word}(?![\\p{L}\\p{N}])`, "giu")
      description = description.replace(regex, "")
    }
    // Remove currency symbols
    description = description.replace(/[$]/g, "")
    // Remove numbers (incluye numeros agrupados con espacio: "50 000")
    description = description.replace(/\d{1,3}(?:[.,\s]\d{3})+|\d+/g, "")
    // Clean up extra spaces
    description = description.replace(/\s+/g, " ").trim()

    return { type, amount, category: matchedCategory, description: description || null }
  }, [expenseCategories, incomeCategories, parseColombianAmount])

  // Arma el borrador editable a partir del texto reconocido, pero NO guarda todavia
  const prepareDraft = useCallback((transcriptText: string) => {
    if (!transcriptText.trim()) {
      setStatus("error")
      setMessage("No se detectó ningún texto. Intenta de nuevo o escribe manualmente.")
      return
    }

    const parsed = parseTranscript(transcriptText)

    setDraft({
      type: parsed.type,
      amount: parsed.amount ? String(parsed.amount) : "",
      description: parsed.description || "",
      categoryId: parsed.category?.id || "",
    })
    setStatus("confirming")
    setMessage(
      parsed.amount
        ? "Revisa los datos antes de guardar."
        : "No se detectó un monto claro, verifícalo antes de guardar."
    )
  }, [parseTranscript])

  // Se ejecuta solo cuando el usuario confirma el formulario
  const confirmAndSave = useCallback(async () => {
    if (!draft) return
    const amountNum = parseFloat(draft.amount)

    if (!amountNum || amountNum <= 0) {
      setMessage("Ingresa un monto válido antes de guardar.")
      return
    }

    if (draft.type === "expense" && amountNum > currentBalance) {
      setMessage(
        `No se puede registrar este egreso porque supera el saldo disponible. Monto máximo permitido: $${currentBalance.toLocaleString("es-CO")}`
      )
      return
    }

    setStatus("processing")
    try {
      const now = new Date()
      const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`

      await addTransaction({
        type: draft.type,
        amount: amountNum,
        description: draft.description || null,
        category_id: draft.categoryId || null,
        date: localDate,
      })

      const formattedAmount = amountNum.toLocaleString("es-CO")
      setStatus("success")
      setMessage(
        `Se registró un ${draft.type === "income" ? "ingreso" : "gasto"} de $${formattedAmount} COP${
          draft.description ? ` - ${draft.description}` : ""
        }`
      )

      setTimeout(() => {
        setStatus("idle")
        setTranscript("")
        setMessage("")
        setDraft(null)
        finalTranscriptRef.current = ""
      }, 3000)
    } catch (error) {
      console.error("Error saving transaction:", error)
      setStatus("error")
      setMessage("Error al guardar la transacción. Puedes reintentar.")
    }
  }, [draft, addTransaction, currentBalance])

  const cancelDraft = useCallback(() => {
    setDraft(null)
    setStatus("idle")
    setTranscript("")
    setMessage("")
    finalTranscriptRef.current = ""
  }, [])

  const startManualEntry = useCallback(() => {
    setDraft({ type: "expense", amount: "", description: "", categoryId: "" })
    setTranscript("")
    setStatus("confirming")
    setMessage("Completa los datos manualmente.")
  }, [])

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
        prepareDraft(finalText)
      } else {
        setStatus("error")
        setMessage("No se detectó ningún texto. Intenta de nuevo o escribe manualmente.")
      }
    }

    recognition.start()
    setIsListening(true)
    setStatus("listening")
    setTranscript("")
    setMessage("")
    finalTranscriptRef.current = ""
  }, [isSupported, prepareDraft])

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
            disabled={status === "confirming" || status === "processing"}
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

        {transcript && status !== "confirming" && (
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

        {status === "error" && (
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 gap-2" onClick={startListening}>
              <RotateCcw className="h-4 w-4" />
              Reintentar
            </Button>
            <Button variant="outline" className="flex-1 gap-2" onClick={startManualEntry}>
              <Pencil className="h-4 w-4" />
              Escribir manualmente
            </Button>
          </div>
        )}

        {status === "confirming" && draft && (
          <FormularioConfirmacionVoz
            draft={draft}
            setDraft={setDraft}
            transcript={transcript}
            onConfirm={confirmAndSave}
            onCancel={cancelDraft}
            expenseCategories={expenseCategories}
            incomeCategories={incomeCategories}
            currentBalance={currentBalance}
          />
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

interface DraftTransaction {
  type: "income" | "expense"
  amount: string
  description: string
  categoryId: string
}

interface FormularioConfirmacionVozProps {
  draft: DraftTransaction
  setDraft: (draft: DraftTransaction) => void
  transcript: string
  onConfirm: () => void
  onCancel: () => void
  expenseCategories: { id: string; name: string }[]
  incomeCategories: { id: string; name: string }[]
  currentBalance: number
}

function FormularioConfirmacionVoz({
  draft,
  setDraft,
  transcript,
  onConfirm,
  onCancel,
  expenseCategories,
  incomeCategories,
  currentBalance,
}: FormularioConfirmacionVozProps) {
  const categories = draft.type === "income" ? incomeCategories : expenseCategories
  const parsedAmount = parseFloat(draft.amount) || 0
  const exceedsBalance = draft.type === "expense" && parsedAmount > currentBalance

  return (
    <div className="p-4 rounded-lg border border-border space-y-4">
      {transcript && (
        <p className="text-xs text-muted-foreground">
          Escuchado: &quot;{transcript}&quot;
        </p>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant={draft.type === "expense" ? "default" : "outline"}
          className="flex-1"
          onClick={() => setDraft({ ...draft, type: "expense", categoryId: "" })}
        >
          Gasto
        </Button>
        <Button
          type="button"
          variant={draft.type === "income" ? "default" : "outline"}
          className="flex-1"
          onClick={() => setDraft({ ...draft, type: "income", categoryId: "" })}
        >
          Ingreso
        </Button>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Monto</label>
        <Input
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={draft.amount}
          onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
          aria-invalid={exceedsBalance}
        />
        {exceedsBalance && (
          <p className="text-sm text-destructive">
            No se puede registrar este egreso porque supera el saldo disponible.
            Monto máximo permitido: ${currentBalance.toLocaleString("es-CO")}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Descripción</label>
        <Input
          placeholder="Ej: transporte"
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Categoría</label>
        <Select
          value={draft.categoryId}
          onValueChange={(value) => setDraft({ ...draft, categoryId: value })}
        >
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
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="button" onClick={onConfirm} disabled={exceedsBalance}>
          Guardar
        </Button>
      </div>
    </div>
  )
}
