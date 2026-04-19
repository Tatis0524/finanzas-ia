"use client"

import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/lib/types"

const supabase = createClient()

async function fetchProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (error) return null
  return data
}

export function useProfile() {
  const { data, error, isLoading, mutate } = useSWR<Profile | null>(
    "profile",
    fetchProfile
  )

  const updateProfile = async (updates: Partial<Profile>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("No user")

    const { error } = await supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", user.id)

    if (error) throw error
    mutate()
  }

  return {
    profile: data,
    isLoading,
    error,
    updateProfile,
    refresh: mutate,
  }
}
