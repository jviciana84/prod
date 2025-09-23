"use client"

import { useEffect, useRef } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"

type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE"

interface UseSupabaseRealtimeOptions<RowType> {
  schema?: string
  table: string
  filter?: { column: string; operator?: "eq" | "neq" | "in" | "ilike"; value: any }
  events?: RealtimeEvent[]
  onInsert?: (payload: RowType) => void
  onUpdate?: (payload: RowType) => void
  onDelete?: (payload: RowType) => void
}

export function useSupabaseRealtime<RowType = any>({
  schema = "public",
  table,
  filter,
  events = ["INSERT", "UPDATE", "DELETE"],
  onInsert,
  onUpdate,
  onDelete,
}: UseSupabaseRealtimeOptions<RowType>) {
  const supabase = createClientComponentClient()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    const channel = supabase.channel(`realtime:${schema}:${table}`)
    channelRef.current = channel

    const commonFilter = filter
      ? { filter: `${filter.column}=${filter.operator ?? "eq"}.${filter.value}` }
      : {}

    if (events.includes("INSERT") && onInsert) {
      channel.on(
        "postgres_changes",
        { event: "INSERT", schema, table, ...(commonFilter as any) },
        (payload: { new: RowType }) => onInsert(payload.new as RowType),
      )
    }

    if (events.includes("UPDATE") && onUpdate) {
      channel.on(
        "postgres_changes",
        { event: "UPDATE", schema, table, ...(commonFilter as any) },
        (payload: { new: RowType }) => onUpdate(payload.new as RowType),
      )
    }

    if (events.includes("DELETE") && onDelete) {
      channel.on(
        "postgres_changes",
        { event: "DELETE", schema, table, ...(commonFilter as any) },
        (payload: { old: RowType }) => onDelete(payload.old as RowType),
      )
    }

    channel.subscribe()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [schema, table, filter?.column, filter?.operator, filter?.value])
}

