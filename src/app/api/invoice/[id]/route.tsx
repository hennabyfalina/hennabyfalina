// src/app/api/invoice/[id]/route.tsx

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToStream } from '@react-pdf/renderer'
import InvoiceDocument from '@/components/pdf/InvoiceDocument'

// Ensure this API route is forced to run in Node.js where stream rendering is available
export const runtime = 'nodejs'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Authenticate user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // 2. Fetch order data
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      *,
      addresses (*),
      order_items (
        *,
        products (*)
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (orderError || !order) {
    return new NextResponse('Order not found', { status: 404 })
  }

  // Security check: only allow generating invoices for paid orders
  if (order.payment_status !== 'paid') {
    return new NextResponse('Unauthorized: Order is not paid', { status: 403 })
  }

  // 3. Generate and stream the PDF instantly to the browser
  const stream = await renderToStream(<InvoiceDocument order={order} /> as any)
  
  return new Response(stream as unknown as ReadableStream, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Invoice_${order.order_number}.pdf"`,
    },
  })
}
