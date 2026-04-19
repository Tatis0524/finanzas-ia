"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, X, Smartphone } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (typeof window !== "undefined") {
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isIOSStandalone = (window.navigator as any).standalone === true
      
      if (isStandalone || isIOSStandalone) {
        setIsInstalled(true)
        return
      }
    }

    // Listen for the beforeinstallprompt event (Chrome, Edge, etc.)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Check if user has dismissed before
      const dismissed = localStorage.getItem("pwa-install-dismissed")
      if (!dismissed) {
        // Delay showing the prompt
        setTimeout(() => setShowPrompt(true), 3000)
      }
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // Check for iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
    
    if (isIOS && isSafari) {
      const dismissed = localStorage.getItem("pwa-install-dismissed-ios")
      if (!dismissed) {
        setTimeout(() => setShowIOSInstructions(true), 3000)
      }
    }

    // Listen for successful installation
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
    })

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      setIsInstalled(true)
    }

    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem("pwa-install-dismissed", "true")
  }

  const handleDismissIOS = () => {
    setShowIOSInstructions(false)
    localStorage.setItem("pwa-install-dismissed-ios", "true")
  }

  if (isInstalled) return null

  // iOS Instructions
  if (showIOSInstructions) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4">
        <Card className="border-primary/20 bg-background/95 backdrop-blur-sm shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 p-2 rounded-full bg-primary/10">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm">Instalar FinanzasIA</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Para instalar en tu iPhone/iPad:
                </p>
                <ol className="text-xs text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
                  <li>Toca el botón <span className="font-medium">Compartir</span> (icono cuadrado con flecha)</li>
                  <li>Desplázate y selecciona <span className="font-medium">&quot;Agregar a pantalla de inicio&quot;</span></li>
                  <li>Toca <span className="font-medium">&quot;Agregar&quot;</span></li>
                </ol>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0 h-8 w-8"
                onClick={handleDismissIOS}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Chrome/Edge install prompt
  if (!showPrompt || !deferredPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4">
      <Card className="border-primary/20 bg-background/95 backdrop-blur-sm shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 p-2 rounded-full bg-primary/10">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm">Instalar FinanzasIA</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Instala la app para acceso rápido y uso sin conexión
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
              >
                Ahora no
              </Button>
              <Button
                size="sm"
                onClick={handleInstall}
              >
                Instalar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}