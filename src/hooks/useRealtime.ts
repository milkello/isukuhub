"use client"

import { useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import type {
  CollectionUpdateEvent,
  PriceUpdateEvent,
  RealtimeEventName,
  RealtimeEventPayloadMap,
  SystemNotificationEvent,
  TransactionUpdateEvent,
} from "@/lib/realtime"

const MAX_EVENTS = 100

export type RealtimeEvent = {
  [K in RealtimeEventName]: {
    type: K
    data: RealtimeEventPayloadMap[K]
    timestamp: string
  }
}[RealtimeEventName]

function appendRealtimeEvent<T extends RealtimeEventName>(
  setEvents: React.Dispatch<React.SetStateAction<RealtimeEvent[]>>,
  type: T,
  data: RealtimeEventPayloadMap[T],
) {
  setEvents((previousEvents) => [
    ...previousEvents.slice(-(MAX_EVENTS - 1)),
    { type, data, timestamp: new Date().toISOString() },
  ])
}

function getRealtimePayloads<T extends RealtimeEventName>(
  events: RealtimeEvent[],
  type: T,
): Array<RealtimeEventPayloadMap[T]> {
  return events
    .filter(
      (event): event is Extract<RealtimeEvent, { type: T }> => event.type === type,
    )
    .map((event) => event.data)
}

export function useRealtime(userId?: string) {
  const { data: session } = useSession()
  const [isConnected, setIsConnected] = useState(false)
  const [events, setEvents] = useState<RealtimeEvent[]>([])
  const eventSourceRef = useRef<EventSource | null>(null)
  timestamp: string
}

  useEffect(() => {
    const currentUserId = userId || session?.user?.id
    if (!currentUserId) return

    const eventSource = new EventSource(`/api/events?userId=${currentUserId}`)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      setIsConnected(true)
      console.log('Connected to real-time updates')
    }

    eventSource.onerror = (error) => {
      setIsConnected(false)
      console.error('SSE connection error:', error)
    }

    eventSource.addEventListener('connected', (event) => {
      console.log('SSE connected:', JSON.parse(event.data))
    })

    eventSource.addEventListener('collection_update', (event) => {
      appendRealtimeEvent(
        setEvents,
        'collection_update',
        JSON.parse(event.data) as CollectionUpdateEvent,
      )
    })

    eventSource.addEventListener('transaction_update', (event) => {
      appendRealtimeEvent(
        setEvents,
        'transaction_update',
        JSON.parse(event.data) as TransactionUpdateEvent,
      )
    })

    eventSource.addEventListener('system_notification', (event) => {
      appendRealtimeEvent(
        setEvents,
        'system_notification',
        JSON.parse(event.data) as SystemNotificationEvent,
      )
    })

    eventSource.addEventListener('price_update', (event) => {
      appendRealtimeEvent(
        setEvents,
        'price_update',
        JSON.parse(event.data) as PriceUpdateEvent,
      )
    })

    eventSource.addEventListener('heartbeat', () => {
      console.log('SSE heartbeat received')
    })

    return () => {
      eventSource.close()
      eventSourceRef.current = null
      setIsConnected(false)
    }
  }, [userId, session?.user?.id])

  const clearEvents = () => {
    setEvents([])
  }

  return {
    isConnected,
    events,
    clearEvents
  }
}

export function useCollectionUpdates(userId?: string) {
  const { events } = useRealtime(userId)
  return getRealtimePayloads(events, 'collection_update')
}

export function useTransactionUpdates(userId?: string) {
  const { events } = useRealtime(userId)
  return getRealtimePayloads(events, 'transaction_update')
}

export function useSystemNotifications(userId?: string) {
  const { events } = useRealtime(userId)
  return getRealtimePayloads(events, 'system_notification')
}

export function usePriceUpdates(userId?: string) {
  const { events } = useRealtime(userId)
  return getRealtimePayloads(events, 'price_update')
}
