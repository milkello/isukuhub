import { NextRequest, NextResponse } from "next/server"
import {
  realtimeManager,
  type CollectionUpdateEvent,
  type PriceUpdateEvent,
  type RealtimeEventName,
  type SystemNotificationEvent,
  type TransactionUpdateEvent,
} from "@/lib/realtime"

const VALID_EVENTS: RealtimeEventName[] = [
  "collection_update",
  "transaction_update",
  "system_notification",
  "price_update",
]

function createSseMessage(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

function isRealtimeEventName(value: unknown): value is RealtimeEventName {
  return typeof value === "string" && VALID_EVENTS.includes(value as RealtimeEventName)
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  
  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 })
  }

  const encoder = new TextEncoder()
  const connection = new Response()
  let isClosed = false
  let cleanup = () => undefined

  const stream = new ReadableStream({
    start(controller) {
      const enqueue = (event: string, data: unknown) => {
        if (isClosed) {
          return
        }

        controller.enqueue(encoder.encode(createSseMessage(event, data)))
      }

      const safeEnqueue = (event: string, data: unknown) => {
        try {
          enqueue(event, data)
        } catch {
          cleanup()
        }
      }

      safeEnqueue("connected", {
        message: "Connected to real-time updates",
        timestamp: new Date().toISOString(),
      })

      realtimeManager.addConnection(userId, connection)

      const onCollectionUpdate = (data: CollectionUpdateEvent) => {
        safeEnqueue("collection_update", data)
      }

      const onTransactionUpdate = (data: TransactionUpdateEvent) => {
        safeEnqueue("transaction_update", data)
      }

      const onSystemNotification = (data: SystemNotificationEvent) => {
        safeEnqueue("system_notification", data)
      }

      const onPriceUpdate = (data: PriceUpdateEvent) => {
        safeEnqueue("price_update", data)
      }

      realtimeManager.on("collection_update", onCollectionUpdate)
      realtimeManager.on("transaction_update", onTransactionUpdate)
      realtimeManager.on("system_notification", onSystemNotification)
      realtimeManager.on("price_update", onPriceUpdate)

      const heartbeat = setInterval(() => {
        safeEnqueue("heartbeat", { timestamp: new Date().toISOString() })
      }, 30000)

      cleanup = () => {
        if (isClosed) {
          return
        }

        isClosed = true
        clearInterval(heartbeat)
        realtimeManager.off("collection_update", onCollectionUpdate)
        realtimeManager.off("transaction_update", onTransactionUpdate)
        realtimeManager.off("system_notification", onSystemNotification)
        realtimeManager.off("price_update", onPriceUpdate)
        realtimeManager.removeConnection(userId, connection)
        request.signal.removeEventListener("abort", cleanup)

        try {
          controller.close()
        } catch {
          // Stream already closed.
        }
      }

      request.signal.addEventListener("abort", cleanup, { once: true })
    },
    cancel() {
      cleanup()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as {
      event?: unknown
      data?: unknown
      targetUserId?: string
      targetRole?: string
    }

    const { event, data, targetUserId, targetRole } = payload

    if (!isRealtimeEventName(event)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 })
    }

    switch (event) {
      case 'collection_update':
        realtimeManager.emitCollectionUpdate(data as CollectionUpdateEvent)
        break
      case 'transaction_update':
        realtimeManager.emitTransactionUpdate(data as TransactionUpdateEvent)
        break
      case 'system_notification':
        realtimeManager.emitSystemNotification({
          ...(data as Omit<SystemNotificationEvent, "targetRole" | "targetUserId">),
          targetUserId,
          targetRole
        })
        break
      case 'price_update':
        realtimeManager.emitPriceUpdate(data as PriceUpdateEvent)
        break
    }

    return NextResponse.json({ success: true, message: 'Event emitted' })
  } catch (error) {
    console.error('SSE POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
