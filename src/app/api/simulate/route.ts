import { NextResponse } from "next/server"
import { realtimeManager, type SystemNotificationEvent } from "@/lib/realtime"

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      eventType?: string
      count?: number
    }
    const eventType = payload.eventType
    const count =
      typeof payload.count === "number" && Number.isFinite(payload.count)
        ? Math.max(1, Math.min(Math.floor(payload.count), 25))
        : 1

    if (!eventType) {
      return NextResponse.json({ error: 'Event type is required' }, { status: 400 })
    }

    const results: Array<Record<string, string | number>> = []

    for (let i = 0; i < count; i++) {
      switch (eventType) {
        case 'collection_update':
          const statuses: Array<'scheduled' | 'in_progress' | 'completed' | 'cancelled'> = ['scheduled', 'in_progress', 'completed', 'cancelled']
          const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]
          
          realtimeManager.emitCollectionUpdate({
            collectionId: `COL-${Date.now()}-${i}`,
            status: randomStatus,
            agentId: `agent-${Math.floor(Math.random() * 100)}`,
            householdId: `household-${Math.floor(Math.random() * 100)}`,
            timestamp: new Date().toISOString()
          })
          results.push({ type: 'collection_update', status: randomStatus })
          break

        case 'transaction_update':
          const transactionTypes: Array<'sale' | 'purchase' | 'payment'> = ['sale', 'purchase', 'payment']
          const transactionStatuses: Array<'pending' | 'completed' | 'failed'> = ['pending', 'completed', 'failed']
          const randomType = transactionTypes[Math.floor(Math.random() * transactionTypes.length)]
          const randomTransactionStatus = transactionStatuses[Math.floor(Math.random() * transactionStatuses.length)]
          const amount = Math.floor(Math.random() * 10000) + 100
          
          realtimeManager.emitTransactionUpdate({
            transactionId: `TXN-${Date.now()}-${i}`,
            type: randomType,
            amount,
            status: randomTransactionStatus,
            userId: `user-${Math.floor(Math.random() * 100)}`,
            timestamp: new Date().toISOString()
          })
          results.push({ type: 'transaction_update', amount, status: randomTransactionStatus })
          break

        case 'system_notification':
          const messages: Array<
            Pick<SystemNotificationEvent, "title" | "message" | "type">
          > = [
            { title: 'System Update', message: 'New features have been added to the platform', type: 'info' },
            { title: 'Collection Alert', message: 'Some collections are running late today', type: 'warning' },
            { title: 'Payment Processed', message: 'Your payment has been successfully processed', type: 'success' },
            { title: 'Maintenance Notice', message: 'Scheduled maintenance will occur tonight', type: 'info' },
            { title: 'Route Optimization', message: 'Collection routes have been optimized for efficiency', type: 'success' }
          ]
          const randomMessage = messages[Math.floor(Math.random() * messages.length)]
          
          realtimeManager.emitSystemNotification({
            title: randomMessage.title,
            message: randomMessage.message,
            type: randomMessage.type,
            targetRole: 'ADMIN',
            timestamp: new Date().toISOString()
          })
          results.push({ type: 'system_notification', title: randomMessage.title })
          break

        case 'price_update':
          const materials = [
            { id: 'plastic', name: 'Plastic', basePrice: 0.50 },
            { id: 'paper', name: 'Paper', basePrice: 0.30 },
            { id: 'glass', name: 'Glass', basePrice: 0.20 },
            { id: 'metal', name: 'Metal', basePrice: 1.20 },
            { id: 'organic', name: 'Organic Waste', basePrice: 0.10 }
          ]
          const randomMaterial = materials[Math.floor(Math.random() * materials.length)]
          const changePercent = (Math.random() - 0.5) * 20 // -10% to +10%
          const newPrice = randomMaterial.basePrice * (1 + changePercent / 100)
          
          realtimeManager.emitPriceUpdate({
            materialId: randomMaterial.id,
            materialName: randomMaterial.name,
            oldPrice: randomMaterial.basePrice,
            newPrice: Math.round(newPrice * 100) / 100,
            change: Math.round(changePercent * 100) / 100,
            timestamp: new Date().toISOString()
          })
          results.push({ type: 'price_update', material: randomMaterial.name, change: changePercent.toFixed(2) + '%' })
          break

        default:
          return NextResponse.json({ error: 'Invalid event type' }, { status: 400 })
      }

      // Add small delay between events
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${count} ${eventType} events`,
      results
    })

  } catch (error) {
    console.error('Simulation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Event simulation API',
    availableEvents: [
      {
        type: 'collection_update',
        description: 'Simulate waste collection status updates'
      },
      {
        type: 'transaction_update', 
        description: 'Simulate payment and transaction updates'
      },
      {
        type: 'system_notification',
        description: 'Simulate system notifications and alerts'
      },
      {
        type: 'price_update',
        description: 'Simulate material price changes'
      }
    ],
    usage: {
      method: 'POST',
      body: {
        eventType: 'string (required)',
        count: 'number (optional, default: 1)'
      },
      example: {
        eventType: 'collection_update',
        count: 5
      }
    }
  })
}
