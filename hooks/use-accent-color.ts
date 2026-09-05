"use client"

import { useState, useEffect, useCallback } from "react"

const ACCENT_STORAGE_KEY = "accent-color"

export type AccentColor = "blue" | "green" | "purple"

export function useAccentColor() {
  const [accent, setAccentState] = useState<AccentColor>("blue")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(ACCENT_STORAGE_KEY) as AccentColor | null
    const initial = stored ?? "blue"
    setAccentState(initial)
    document.documentElement.setAttribute("data-accent", initial)
    setMounted(true)
  }, [])

  const setAccent = useCallback((color: AccentColor) => {
    setAccentState(color)
    document.documentElement.setAttribute("data-accent", color)
    localStorage.setItem(ACCENT_STORAGE_KEY, color)
  }, [])

  return { accent, setAccent, mounted }
}