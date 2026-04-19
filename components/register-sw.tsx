"use client"

import { useEffect } from "react"

export default function RegisterSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("Service Worker registrado"))
        .catch((err) => console.log("Error registrando SW:", err))
    }
  }, [])

  return null
}