"use client"

import { useState } from "react"
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
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { useProfile } from "@/hooks/use-profile"
import { useAuth } from "@/hooks/use-auth"
import { Settings, User, Loader2, CheckCircle } from "lucide-react"

const currencies = [
  { value: "MXN", label: "Peso Mexicano (MXN)" },
  { value: "USD", label: "Dolar Estadounidense (USD)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "COP", label: "Peso Colombiano (COP)" },
  { value: "ARS", label: "Peso Argentino (ARS)" },
  { value: "CLP", label: "Peso Chileno (CLP)" },
  { value: "PEN", label: "Sol Peruano (PEN)" },
]

export default function SettingsPage() {
  const { profile, updateProfile, isLoading } = useProfile()
  const { user, signOut } = useAuth()
  
  const [fullName, setFullName] = useState(profile?.full_name || "")
  const [currency, setCurrency] = useState(profile?.currency || "MXN")
  const [monthlyBudget, setMonthlyBudget] = useState(profile?.monthly_budget?.toString() || "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateProfile({
        full_name: fullName,
        currency,
        monthly_budget: monthlyBudget ? parseFloat(monthlyBudget) : 0,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error("Error saving profile:", error)
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Configuracion</h1>
        <p className="text-muted-foreground mt-1">
          Personaliza tu experiencia en la aplicacion
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Settings */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Perfil
            </CardTitle>
            <CardDescription>
              Actualiza tu informacion personal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Correo electronico</FieldLabel>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="fullName">Nombre completo</FieldLabel>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu nombre"
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        {/* App Settings */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Preferencias
            </CardTitle>
            <CardDescription>
              Configura la aplicacion a tu gusto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="currency">Moneda</FieldLabel>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="budget">Presupuesto mensual</FieldLabel>
                <Input
                  id="budget"
                  type="number"
                  step="0.01"
                  min="0"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value)}
                  placeholder="0.00"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Establece un limite de gastos mensuales para recibir alertas
                </p>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : saved ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Guardado
            </>
          ) : (
            "Guardar cambios"
          )}
        </Button>
      </div>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Zona de peligro</CardTitle>
          <CardDescription>
            Acciones que no se pueden deshacer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={signOut}>
            Cerrar sesion
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
