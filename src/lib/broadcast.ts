// src/lib/broadcast.ts

type BroadcastMessage = 
  | { type: 'CART_ITEM_DELETED'; productId: string; }
  | { type: 'CART_ITEM_UPDATED'; productId: string; }
  | { type: 'CART_ITEM_ADDED'; productId: string; }
  | { type: 'AUTH_LOGOUT'; }

class BroadcastManager {
  private channel: BroadcastChannel | null = null
  private listeners: Map<string, Set<(data: any) => void>> = new Map()
  private usingLocalStorage = false

  constructor() {
    if (typeof window === 'undefined') return
    
    try {
      this.channel = new BroadcastChannel('hennabyfalina_core_sync')
      this.channel.onmessage = (event) => {
        this.notifyListeners(event.data.type, event.data)
      }
    } catch (e) {
      this.usingLocalStorage = true
      window.addEventListener('storage', (event) => {
        if (event.key === 'hennabyfalina_core_broadcast' && event.newValue !== null) {
          try {
            const data = JSON.parse(event.newValue)
            this.notifyListeners(data.type, data)
          } catch (err) {}
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
      const payload = JSON.stringify({ ...message, _ts: Date.now() })
      localStorage.setItem('hennabyfalina_core_broadcast', payload)
      localStorage.removeItem('hennabyfalina_core_broadcast')
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