import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseRealtimeOptions {
  table: string
  filter?: string
  onInsert?: (data: any) => void
  onUpdate?: (data: any) => void
  onDelete?: (data: any) => void
}

export function useRealtime(options: UseRealtimeOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const setupChannel = async () => {
      try {
        const channelName = options.filter
          ? `${options.table}:${options.filter}`
          : options.table

        const newChannel = supabase
          .channel(channelName, {
            config: {
              broadcast: { self: true },
            },
          })
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: options.table,
              ...(options.filter && { filter: options.filter }),
            },
            (payload) => {
              console.log('[v0] Real-time INSERT:', payload)
              options.onInsert?.(payload.new)
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: options.table,
              ...(options.filter && { filter: options.filter }),
            },
            (payload) => {
              console.log('[v0] Real-time UPDATE:', payload)
              options.onUpdate?.(payload.new)
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'DELETE',
              schema: 'public',
              table: options.table,
              ...(options.filter && { filter: options.filter }),
            },
            (payload) => {
              console.log('[v0] Real-time DELETE:', payload)
              options.onDelete?.(payload.old)
            }
          )
          .subscribe((status) => {
            console.log(`[v0] Channel status: ${status}`)
            setIsConnected(status === 'SUBSCRIBED')
          })

        setChannel(newChannel)
      } catch (error) {
        console.error('[v0] Failed to setup realtime channel:', error)
        setIsConnected(false)
      }
    }

    setupChannel()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [options.table, options.filter, supabase, options])

  const unsubscribe = useCallback(() => {
    if (channel) {
      supabase.removeChannel(channel)
      setIsConnected(false)
    }
  }, [channel, supabase])

  return { isConnected, unsubscribe }
}

// Hook for real-time bookings
export function useRealtimeBookings(
  branchId: string,
  callbacks?: {
    onNew?: (booking: any) => void
    onUpdated?: (booking: any) => void
    onCancelled?: (booking: any) => void
  }
) {
  return useRealtime({
    table: 'bookings',
    filter: `branch_id=eq.${branchId}`,
    onInsert: callbacks?.onNew,
    onUpdate: callbacks?.onUpdated,
    onDelete: callbacks?.onCancelled,
  })
}

// Hook for real-time leads
export function useRealtimeLeads(
  branchId: string,
  callbacks?: {
    onNew?: (lead: any) => void
    onUpdated?: (lead: any) => void
    onClosed?: (lead: any) => void
  }
) {
  return useRealtime({
    table: 'leads',
    filter: `branch_id=eq.${branchId}`,
    onInsert: callbacks?.onNew,
    onUpdate: callbacks?.onUpdated,
    onDelete: callbacks?.onClosed,
  })
}

// Hook for real-time inventory
export function useRealtimeInventory(
  branchId: string,
  callbacks?: {
    onNew?: (item: any) => void
    onUpdated?: (item: any) => void
    onRemoved?: (item: any) => void
  }
) {
  return useRealtime({
    table: 'inventory',
    filter: `branch_id=eq.${branchId}`,
    onInsert: callbacks?.onNew,
    onUpdate: callbacks?.onUpdated,
    onDelete: callbacks?.onRemoved,
  })
}
