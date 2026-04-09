import { EventEmitter } from "events";

export class RealtimeManager extends EventEmitter {
  private static instance: RealtimeManager;

  private constructor() {
    super();
  }

  static getInstance() {
    if (!RealtimeManager.instance) {
      RealtimeManager.instance = new RealtimeManager();
    }

    return RealtimeManager.instance;
  }

  addConnection(userId: string, response: Response) {
    void userId;
    void response;
  }

  removeConnection(userId: string, response: Response) {
    void userId;
    void response;
  }

  sendToUser<T extends RealtimeEventName>(
    event: T,
    data: RealtimeEventPayloadMap[T],
  ) {
    this.emit(event, data);
  }

  sendToRole<T extends RealtimeEventName>(
    event: T,
    data: RealtimeEventPayloadMap[T],
  ) {
    this.emit(event, data);
  }

  broadcast<T extends RealtimeEventName>(
    event: T,
    data: RealtimeEventPayloadMap[T],
  ) {
    this.emit(event, data);
  }

  emitCollectionUpdate(data: CollectionUpdateEvent) {
    this.emit("collection_update", data);
  }

  emitTransactionUpdate(data: TransactionUpdateEvent) {
    this.emit("transaction_update", data);
  }

  emitSystemNotification(data: SystemNotificationEvent) {
    this.emit("system_notification", data);
  }

  emitPriceUpdate(data: PriceUpdateEvent) {
    this.emit("price_update", data);
  }
}

export const realtimeManager = RealtimeManager.getInstance();

// Types for real-time events
export interface CollectionUpdateEvent {
  collectionId: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  agentId?: string
  householdId?: string
  timestamp: string
}

export interface TransactionUpdateEvent {
  transactionId: string
  type: 'sale' | 'purchase' | 'payment'
  amount: number
  status: 'pending' | 'completed' | 'failed'
  userId: string
  timestamp: string
}

export interface SystemNotificationEvent {
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  targetRole?: string
  targetUserId?: string
  timestamp: string
}

export interface PriceUpdateEvent {
  materialId: string
  materialName: string
  oldPrice: number
  newPrice: number
  change: number
  timestamp: string
}

export type RealtimeEventName =
  | "collection_update"
  | "transaction_update"
  | "system_notification"
  | "price_update";

export interface RealtimeEventPayloadMap {
  collection_update: CollectionUpdateEvent;
  transaction_update: TransactionUpdateEvent;
  system_notification: SystemNotificationEvent;
  price_update: PriceUpdateEvent;
}
