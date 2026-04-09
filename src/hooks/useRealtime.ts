"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"

export interface RealtimeEvent {
  type: string
  data: any
  timestamp: string
}

export function useRealtime(userId?: string) {
  const { data: session } = useSession()
  const [isConnected, setIsConnected] = useState(false)
  const [events, setEvents] = useState<RealtimeEvent[]>([])
  const eventSourceRef = useRef<EventSource | null>(null)

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
      const data = JSON.parse(event.data)
      setEvents(prev => [...prev, { type: 'collection_update', data, timestamp: new Date().toISOString() }])
    })

    eventSource.addEventListener('transaction_update', (event) => {
      const data = JSON.parse(event.data)
      setEvents(prev => [...prev, { type: 'transaction_update', data, timestamp: new Date().toISOString() }])
    })

    eventSource.addEventListener('system_notification', (event) => {
      const data = JSON.parse(event.data)
      setEvents(prev => [...prev, { type: 'system_notification', data, timestamp: new Date().toISOString() }])
    })

    eventSource.addEventListener('price_update', (event) => {
      const data = JSON.parse(event.data)
      setEvents(prev => [...prev, { type: 'price_update', data, timestamp: new Date().toISOString() }])
    })

    eventSource.addEventListener('heartbeat', (event) => {
      console.log('SSE heartbeat received')
    })

    return () => {
      eventSource.close()
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

export function useCollectionUpdates() {
  const { events } = useRealtime()
  const [collectionUpdates, setCollectionUpdates] = useState<any[]>([])

  useEffect(() => {
    const updates = events
      .filter(event => event.type === 'collection_update')
      .map(event => event.data)
    setCollectionUpdates(updates)
  }, [events])

  return collectionUpdates
}

export function useTransactionUpdates() {
  const { events } = useRealtime()
  const [transactionUpdates, setTransactionUpdates] = useState<any[]>([])

  useEffect(() => {
    const updates = events
      .filter(event => event.type === 'transaction_update')
      .map(event => event.data)
    setTransactionUpdates(updates)
  }, [events])

  return transactionUpdates
}

export function useSystemNotifications() {
  const { events } = useRealtime()
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    const notifs = events
      .filter(event => event.type === 'system_notification')
      .map(event => event.data)
    setNotifications(notifs)
  }, [events])

  return notifications
}

export function usePriceUpdates() {
  const { events } = useRealtime()
  const [priceUpdates, setPriceUpdates] = useState<any[]>([])

  useEffect(() => {
    const updates = events
      .filter(event => event.type === 'price_update')
      .map(event => event.data)
    setPriceUpdates(updates)
  }, [events])

  return priceUpdates
}
