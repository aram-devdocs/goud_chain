/**
 * WebSocket client for real-time Goud Chain blockchain events.
 * 
 * Features:
 * - Auto-reconnect with exponential backoff
 * - Typed event handlers
 * - Subscription management
 * - Graceful error handling
 */

export type EventType =
  | 'blockchain_update'
  | 'collection_update'
  | 'peer_update'
  | 'audit_log_update'
  | 'metrics_update';

export interface WebSocketMessage {
  type: 'event' | 'pong' | 'subscribed' | 'unsubscribed' | 'error';
  event?: EventType;
  data?: any;
  message?: string;
}

export type EventHandler<T = any> = (event: T) => void;

interface SubscriptionHandlers {
  [eventType: string]: Set<EventHandler>;
}

/**
 * WebSocket client for Goud Chain real-time updates.
 */
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private wsUrl: string;
  private apiKey: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private subscriptions: SubscriptionHandlers = {};
  private pendingSubscriptions: Set<EventType> = new Set();
  private isManualDisconnect = false;

  constructor(wsUrl: string) {
    this.wsUrl = wsUrl;
  }

  /**
   * Sets the API key for WebSocket authentication.
   */
  setApiKey(apiKey: string | null): void {
    this.apiKey = apiKey;
  }

  /**
   * Connects to the WebSocket server.
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    if (!this.apiKey) {
      console.error('Cannot connect: API key not set');
      return;
    }

    this.isManualDisconnect = false;

    try {
      // Authenticate via query parameter
      const url = `${this.wsUrl}/ws?token=${encodeURIComponent(this.apiKey)}`;
      this.ws = new WebSocket(url);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnects from the WebSocket server.
   */
  disconnect(): void {
    this.isManualDisconnect = true;
    this.reconnectAttempts = 0;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Subscribes to a specific event type.
   */
  subscribe<T = any>(eventType: EventType, handler: EventHandler<T>): void {
    if (!this.subscriptions[eventType]) {
      this.subscriptions[eventType] = new Set();
    }

    this.subscriptions[eventType].add(handler);

    // If connected, send subscription message immediately
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendSubscribeMessage(eventType);
    } else {
      // Queue for when connection is established
      this.pendingSubscriptions.add(eventType);
    }
  }

  /**
   * Unsubscribes from a specific event type.
   */
  unsubscribe<T = any>(eventType: EventType, handler: EventHandler<T>): void {
    if (this.subscriptions[eventType]) {
      this.subscriptions[eventType].delete(handler);

      // If no more handlers for this event, unsubscribe on server
      if (
        this.subscriptions[eventType].size === 0 &&
        this.ws?.readyState === WebSocket.OPEN
      ) {
        this.sendUnsubscribeMessage(eventType);
        delete this.subscriptions[eventType];
      }
    }
  }

  /**
   * Handles WebSocket open event.
   */
  private handleOpen(): void {
    console.log('WebSocket connected');
    this.reconnectAttempts = 0;

    // Start ping interval (keep-alive)
    this.pingInterval = setInterval(() => {
      this.sendPing();
    }, 30000); // 30 seconds

    // Resubscribe to pending subscriptions
    for (const eventType of this.pendingSubscriptions) {
      this.sendSubscribeMessage(eventType);
    }
    this.pendingSubscriptions.clear();

    // Resubscribe to existing subscriptions
    for (const eventType of Object.keys(this.subscriptions)) {
      this.sendSubscribeMessage(eventType as EventType);
    }
  }

  /**
   * Handles WebSocket message event.
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);

      switch (message.type) {
        case 'event':
          this.handleEventMessage(message);
          break;
        case 'pong':
          // Pong received, connection is alive
          break;
        case 'subscribed':
          console.log(`Subscribed to ${message.event}`);
          break;
        case 'unsubscribed':
          console.log(`Unsubscribed from ${message.event}`);
          break;
        case 'error':
          console.error('WebSocket error:', message.message);
          break;
        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * Handles event messages from server.
   */
  private handleEventMessage(message: WebSocketMessage): void {
    if (!message.event) return;

    const handlers = this.subscriptions[message.event];
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(message.data);
        } catch (error) {
          console.error('Event handler error:', error);
        }
      }
    }
  }

  /**
   * Handles WebSocket error event.
   */
  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
  }

  /**
   * Handles WebSocket close event.
   */
  private handleClose(event: CloseEvent): void {
    console.log('WebSocket disconnected:', event.code, event.reason);

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    // Reconnect unless manually disconnected
    if (!this.isManualDisconnect) {
      this.scheduleReconnect();
    }
  }

  /**
   * Schedules a reconnection attempt with exponential backoff.
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Sends a subscribe message to the server.
   */
  private sendSubscribeMessage(eventType: EventType): void {
    this.sendMessage({
      type: 'subscribe',
      event: eventType,
    });
  }

  /**
   * Sends an unsubscribe message to the server.
   */
  private sendUnsubscribeMessage(eventType: EventType): void {
    this.sendMessage({
      type: 'unsubscribe',
      event: eventType,
    });
  }

  /**
   * Sends a ping message to keep connection alive.
   */
  private sendPing(): void {
    this.sendMessage({ type: 'ping' });
  }

  /**
   * Sends a message to the WebSocket server.
   */
  private sendMessage(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Checks if WebSocket is connected.
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Gets current subscription count.
   */
  getSubscriptionCount(): number {
    return Object.keys(this.subscriptions).length;
  }
}
