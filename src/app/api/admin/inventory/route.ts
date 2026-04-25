import { NextResponse } from 'next/server'
import { updateStock } from '@/services/inventory.service'

export async function POST(req: Request) {
  try {
    const { productId, newStock, reason, notes } = await req.json()

    if (!productId || typeof newStock !== 'number' || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await updateStock(productId, newStock, reason, notes)
    return NextResponse.json({ success: true })
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update stock' }, { status: 500 })
  }
}
