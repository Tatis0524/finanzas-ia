"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { usePWAInstall } from "@/components/use-pwa-install"
import {
  Wallet,
  LayoutDashboard,
  ArrowUpDown,
  BarChart3,
  Sparkles,
  Mic,
  FileSpreadsheet,
  ImageIcon,
  Settings,
  LogOut,
  Menu,
  X,
  Download
} from "lucide-react"
import { useState } from "react"

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/dashboard/transactions", label: "Transacciones", icon: ArrowUpDown },
  { href: "/dashboard/analytics", label: "Analisis", icon: BarChart3 },
  { href: "/dashboard/ai-advisor", label: "Asesor IA", icon: Sparkles },
  { href: "/dashboard/voice", label: "Voz", icon: Mic },
  { href: "/dashboard/import-export", label: "Importar/Exportar", icon: FileSpreadsheet },
  { href: "/dashboard/lifestyle", label: "Estilo de Vida", icon: ImageIcon },
  { href: "/dashboard/settings", label: "Configuracion", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  // 👇 HOOK DE INSTALACIÓN
  const { install, canInstall } = usePWAInstall()

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card transition-transform md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-2 border-b border-border px-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Wallet className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">FinanzasIA</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}

            {/* 👇 BOTÓN INSTALAR APP */}
            {canInstall && (
              <button
                onClick={install}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground w-full text-left"
              >
                <Download className="h-5 w-5" />
                Instalar App
              </button>
            )}
          </nav>

          {/* Sign out */}
          <div className="border-t border-border p-4">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
              onClick={signOut}
            >
              <LogOut className="h-5 w-5" />
              Cerrar sesion
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}