// src/lib/broadcast.ts

type BroadcastMessage = 
  | { type: 'CART_ITEM_DELETED'; productId: string; artworkUrls: string[] }
  | { type: 'ARTWORK_DELETED'; paths: string[] }
  | { type: 'DRAFT_CLEARED'; productId: string }
  | { type: 'CART_ITEM_UPDATED'; productId: string; printingType: string }
  | { type: 'CART_ITEM_ADDED'; productId: string }

class BroadcastManager {
  private channel: BroadcastChannel | null = null
  private listeners: Map<string, Set<(data: any) => void>> = new Map()
  private usingLocalStorage = false

  constructor() {
    if (typeof window === 'undefined') return
    
    try {
      this.channel = new BroadcastChannel('razack_cart_sync')
      this.channel.onmessage = (event) => {
        this.notifyListeners(event.data.type, event.data)
      }
    } catch (e) {
      // Fallback to localStorage event for older browsers
      this.usingLocalStorage = true
      window.addEventListener('storage', (event) => {
        // Check for newValue to handle the set event, and ignore the removal (null)
        if (event.key === 'razack_cart_broadcast' && event.newValue !== null) {
          try {
            const data = JSON.parse(event.newValue)
            this.notifyListeners(data.type, data)
          } catch (e) {}
        }
      })
    }
  }

  private notifyListeners(type: string, data: any) {
    const callbacks = this.listeners.get(type)
    if (callbacks) {
      callbacks.forEach(cb => cb(data))
    }
  }

  send(message: BroadcastMessage) {
    if (typeof window === 'undefined') return
    
    if (this.usingLocalStorage) {
      // Use a timestamp to ensure the storage event fires even if the message is identical
      const payload = JSON.stringify({ ...message, _ts: Date.now() })
      localStorage.setItem('razack_cart_broadcast', payload)
      // Immediately remove to keep storage clean; the event still fires in other tabs
      localStorage.removeItem('razack_cart_broadcast')
    } else if (this.channel) {
      this.channel.postMessage(message)
    }
  }

  on(type: BroadcastMessage['type'], callback: (data: any) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }
    this.listeners.get(type)!.add(callback)
    
    return () => {
      this.listeners.get(type)?.delete(callback)
    }
  }
}

export const broadcast = new BroadcastManager()