// src/store/quickview.store.ts

import { create } from 'zustand'

interface QuickViewState {
  isOpen: boolean
  product: any | null
  productList: any[] | null
  currentIndex: number
  openQuickView: (product: any, productList?: any[]) => void
  closeQuickView: () => void
  nextProduct: () => void
  prevProduct: () => void
}

export const useQuickViewStore = create<QuickViewState>((set, get) => ({
  isOpen: false,
  product: null,
  productList: null,
  currentIndex: -1,
  openQuickView: (product, productList = []) => {
    let currentIndex = -1
    if (productList && productList.length > 0) {
      currentIndex = productList.findIndex((p: any) => p.id === product.id)
    }
    set({ isOpen: true, product, productList: productList?.length ? productList : null, currentIndex })
  },
  closeQuickView: () => set({ isOpen: false, product: null, productList: null, currentIndex: -1 }),
  nextProduct: () => {
    const { productList, currentIndex } = get()
    if (productList && productList.length > 0 && currentIndex !== -1) {
      const nextIndex = (currentIndex + 1) % productList.length
      set({ product: productList[nextIndex], currentIndex: nextIndex })
    }
  },
  prevProduct: () => {
    const { productList, currentIndex } = get()
    if (productList && productList.length > 0 && currentIndex !== -1) {
      const prevIndex = (currentIndex - 1 + productList.length) % productList.length
      set({ product: productList[prevIndex], currentIndex: prevIndex })
    }
  }
}))