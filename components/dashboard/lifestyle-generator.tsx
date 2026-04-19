"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTransactions } from "@/hooks/use-transactions"
import { useProfile } from "@/hooks/use-profile"
import { ImageIcon, Loader2, Download, Play, Pause, RefreshCw } from "lucide-react"

export function LifestyleGenerator() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [videoLoading, setVideoLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lifestyleType, setLifestyleType] = useState<string>("")
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const { transactions } = useTransactions()
  const { profile } = useProfile()

  const analyzeLifestyle = () => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const monthlyTransactions = transactions.filter((t) => {
      const date = new Date(t.date)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })

    const totalIncome = monthlyTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const totalExpenses = monthlyTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0

    // Categorize lifestyle based on financial habits
    if (savingsRate >= 30) {
      return {
        type: "Ahorrador Experto",
        description: "Persona muy disciplinada financieramente, con excelentes habitos de ahorro",
        prompt: "A successful person standing in a beautiful modern home office with a view of nature, surrounded by books about investing and a vision board showing financial goals achieved, warm golden hour lighting, peaceful and prosperous atmosphere, digital art style",
      }
    } else if (savingsRate >= 15) {
      return {
        type: "Equilibrado",
        description: "Buen balance entre disfrutar el presente y planificar el futuro",
        prompt: "A happy person enjoying a balanced lifestyle, working at a cozy cafe with a laptop, having a healthy breakfast, plants around, moderate luxury items, sustainable living aesthetic, warm and inviting atmosphere, digital illustration",
      }
    } else if (savingsRate >= 0) {
      return {
        type: "En Crecimiento",
        description: "Aprendiendo a manejar las finanzas, con oportunidades de mejora",
        prompt: "A motivated person climbing steps made of coins towards a bright future, sunrise in the background symbolizing new beginnings, carrying a small piggy bank, hopeful and inspiring atmosphere, motivational digital art",
      }
    } else {
      return {
        type: "Desafiante",
        description: "Momento de reflexion y cambio en los habitos financieros",
        prompt: "A person at a crossroads with two paths - one dark and one bright, choosing the bright path with determination, storm clouds clearing to reveal sunshine, transformation and hope theme, inspirational digital artwork",
      }
    }
  }

  const generateImage = async () => {
    setLoading(true)
    setError(null)
    setImageUrl(null)
    setVideoUrl(null)

    try {
      const lifestyle = analyzeLifestyle()
      setLifestyleType(lifestyle.type)

      // Using a free image generation API (Pollinations.ai - completely free, no API key needed)
      const encodedPrompt = encodeURIComponent(lifestyle.prompt)
      const imageApiUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`
      
      // Verify the image loads
      const img = new Image()
      img.crossOrigin = "anonymous"
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error("Failed to generate image"))
        img.src = imageApiUrl
      })

      setImageUrl(imageApiUrl)
    } catch (err) {
      console.error("Error generating image:", err)
      setError("Error al generar la imagen. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const createVideo = async () => {
    if (!imageUrl || !canvasRef.current) return

    setVideoLoading(true)
    setError(null)

    try {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Canvas context not available")

      // Load the image
      const img = new Image()
      img.crossOrigin = "anonymous"
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error("Failed to load image"))
        img.src = imageUrl
      })

      canvas.width = 1024
      canvas.height = 1024

      // Create video using MediaRecorder
      const stream = canvas.captureStream(30)
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9",
      })

      const chunks: Blob[] = []
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" })
        const url = URL.createObjectURL(blob)
        setVideoUrl(url)
        setVideoLoading(false)
      }

      mediaRecorder.start()

      // Animation: zoom in effect with motivational text
      const duration = 5000 // 5 seconds
      const fps = 30
      const totalFrames = (duration / 1000) * fps
      let frame = 0

      const motivationalTexts = [
        "Tu futuro financiero",
        "esta en tus manos",
        lifestyleType,
      ]

      const animate = () => {
        if (frame >= totalFrames) {
          mediaRecorder.stop()
          return
        }

        const progress = frame / totalFrames
        const scale = 1 + progress * 0.2 // Zoom from 1x to 1.2x

        ctx.clearRect(0, 0, canvas.width, canvas.height)
        
        // Draw scaled image
        const drawWidth = canvas.width * scale
        const drawHeight = canvas.height * scale
        const drawX = (canvas.width - drawWidth) / 2
        const drawY = (canvas.height - drawHeight) / 2
        
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)

        // Add dark overlay for text
        ctx.fillStyle = `rgba(0, 0, 0, ${0.3 + progress * 0.2})`
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Add motivational text
        ctx.fillStyle = "white"
        ctx.font = "bold 48px Arial"
        ctx.textAlign = "center"
        ctx.shadowColor = "black"
        ctx.shadowBlur = 10

        const textIndex = Math.min(Math.floor(progress * motivationalTexts.length), motivationalTexts.length - 1)
        const currentText = motivationalTexts[textIndex]
        
        // Fade in effect for text
        const textProgress = (progress * motivationalTexts.length) % 1
        ctx.globalAlpha = Math.min(textProgress * 3, 1)
        ctx.fillText(currentText, canvas.width / 2, canvas.height / 2)
        ctx.globalAlpha = 1

        frame++
        requestAnimationFrame(animate)
      }

      animate()
    } catch (err) {
      console.error("Error creating video:", err)
      setError("Error al crear el video. Tu navegador podria no soportar esta funcion.")
      setVideoLoading(false)
    }
  }

  const downloadImage = () => {
    if (!imageUrl) return
    const link = document.createElement("a")
    link.href = imageUrl
    link.download = `estilo_vida_financiero_${new Date().toISOString().split("T")[0]}.png`
    link.click()
  }

  const downloadVideo = () => {
    if (!videoUrl) return
    const link = document.createElement("a")
    link.href = videoUrl
    link.download = `video_motivacional_${new Date().toISOString().split("T")[0]}.webm`
    link.click()
  }

  const toggleVideoPlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  useEffect(() => {
    const video = videoRef.current
    if (video) {
      video.onended = () => setIsPlaying(false)
    }
  }, [videoUrl])

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-primary" />
          Estilo de Vida Financiero
        </CardTitle>
        <CardDescription>
          Genera una imagen con IA que representa tu estilo de vida financiero actual y conviertela en un video motivacional.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Generate Button */}
        <Button
          onClick={generateImage}
          disabled={loading || transactions.length === 0}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generando imagen...
            </>
          ) : (
            <>
              <ImageIcon className="mr-2 h-5 w-5" />
              {imageUrl ? "Generar Nueva Imagen" : "Generar Imagen de Mi Estilo"}
            </>
          )}
        </Button>

        {transactions.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            Agrega transacciones para generar tu imagen personalizada.
          </p>
        )}

        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 text-red-500 text-sm">
            {error}
          </div>
        )}

        {/* Lifestyle Type */}
        {lifestyleType && (
          <div className="p-4 rounded-lg bg-primary/10 text-center">
            <p className="text-sm text-muted-foreground mb-1">Tu estilo financiero:</p>
            <p className="text-xl font-bold text-primary">{lifestyleType}</p>
          </div>
        )}

        {/* Generated Image */}
        {imageUrl && (
          <div className="space-y-4">
            <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
              <img
                src={imageUrl}
                alt="Estilo de vida financiero"
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button onClick={downloadImage} variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Descargar Imagen
              </Button>
              
              <Button 
                onClick={createVideo} 
                disabled={videoLoading}
                variant="outline" 
                className="gap-2"
              >
                {videoLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creando video...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Crear Video Motivacional
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Video Player */}
        {videoUrl && (
          <div className="space-y-4">
            <h3 className="font-medium">Video Motivacional</h3>
            <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-cover"
                loop
                playsInline
              />
              <Button
                onClick={toggleVideoPlayback}
                variant="secondary"
                size="icon"
                className="absolute bottom-4 right-4 rounded-full"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
            </div>
            <Button onClick={downloadVideo} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Descargar Video
            </Button>
          </div>
        )}

        {/* Hidden Canvas for Video Generation */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Info */}
        <div className="text-sm text-muted-foreground space-y-2 pt-4 border-t border-border">
          <p className="font-medium">Como funciona:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Analizamos tus habitos financieros (tasa de ahorro, gastos, etc.)</li>
            <li>Determinamos tu &quot;perfil financiero&quot; actual</li>
            <li>Generamos una imagen con IA que representa tu estilo de vida</li>
            <li>Puedes convertirla en un video motivacional de 5 segundos</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
