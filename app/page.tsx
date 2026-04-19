import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Wallet,
  TrendingUp,
  BarChart3,
  Mic,
  Sparkles,
  FileSpreadsheet,
  ImageIcon,
  Shield,
  Smartphone,
  ArrowRight,
  CheckCircle,
} from "lucide-react"

const features = [
  {
    icon: TrendingUp,
    title: "Registro de Ingresos y Gastos",
    description: "Registra todas tus transacciones de forma rapida y organizada con categorias personalizadas.",
  },
  {
    icon: BarChart3,
    title: "Graficos y Analisis",
    description: "Visualiza tus finanzas con graficos interactivos que te muestran tendencias y patrones.",
  },
  {
    icon: Sparkles,
    title: "Asesor Financiero IA",
    description: "Recibe recomendaciones personalizadas basadas en tus habitos de gasto y ahorro.",
  },
  {
    icon: Mic,
    title: "Entrada por Voz",
    description: "Registra gastos hablando. Solo di 'Gaste 150 pesos en comida' y listo.",
  },
  {
    icon: FileSpreadsheet,
    title: "Importar y Exportar",
    description: "Importa datos desde Excel o CSV, y exporta tus reportes en cualquier momento.",
  },
  {
    icon: ImageIcon,
    title: "Estilo de Vida IA",
    description: "Genera imagenes y videos motivacionales basados en tu perfil financiero.",
  },
]

const benefits = [
  "100% gratuito, sin costos ocultos",
  "Funciona sin conexion como PWA",
  "Tus datos son privados y seguros",
  "Disponible en web y movil",
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Wallet className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">FinanzasIA</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Iniciar Sesion</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Registrarse</Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            Potenciado con Inteligencia Artificial
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold leading-tight text-balance">
            Tu Asistente Inteligente de{" "}
            <span className="text-primary">Finanzas Personales</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Toma el control de tu dinero con analisis inteligentes, recomendaciones personalizadas 
            y herramientas que te ayudan a alcanzar tus metas financieras.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" asChild className="text-lg px-8">
              <Link href="/auth/sign-up">
                Comenzar Gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8">
              <Link href="/auth/login">Ya tengo cuenta</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Todo lo que necesitas para tus finanzas
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Herramientas poderosas y faciles de usar para gestionar tu dinero de forma inteligente.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="border-border/50 hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-card border border-border/50 rounded-2xl p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Por que elegir FinanzasIA?
              </h2>
              <p className="text-muted-foreground text-lg mb-6">
                Diseñado para ser simple, potente y accesible para todos.
              </p>
              <ul className="space-y-3">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-xl bg-primary/10 text-center">
                <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="font-semibold">Seguro</p>
                <p className="text-sm text-muted-foreground">Datos encriptados</p>
              </div>
              <div className="p-6 rounded-xl bg-green-500/10 text-center">
                <Wallet className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="font-semibold">Gratis</p>
                <p className="text-sm text-muted-foreground">Sin costo alguno</p>
              </div>
              <div className="p-6 rounded-xl bg-blue-500/10 text-center">
                <Smartphone className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="font-semibold">Movil</p>
                <p className="text-sm text-muted-foreground">Instala como app</p>
              </div>
              <div className="p-6 rounded-xl bg-amber-500/10 text-center">
                <Sparkles className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                <p className="font-semibold">IA</p>
                <p className="text-sm text-muted-foreground">Analisis inteligente</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            Comienza a mejorar tus finanzas hoy
          </h2>
          <p className="text-muted-foreground text-lg">
            Unete a miles de personas que ya estan tomando control de su dinero.
          </p>
          <Button size="lg" asChild className="text-lg px-8">
            <Link href="/auth/sign-up">
              Crear cuenta gratuita
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-border">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <span className="font-semibold">FinanzasIA</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Proyecto academico - Asistente Inteligente de Finanzas Personales
          </p>
        </div>
      </footer>
    </div>
  )
}
