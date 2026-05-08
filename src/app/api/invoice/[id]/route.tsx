// src/app/api/invoice/[id]/route.tsx

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToStream } from '@react-pdf/renderer'
import InvoiceDocument from '@/components/pdf/InvoiceDocument'

// Node.js Runtime is REQUIRED for @react-pdf/renderer's stream rendering
export const runtime = 'nodejs'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const invoiceType = (searchParams.get('type') as 'customer' | 'merchant') || 'customer'
    const supabase = await createClient()

    // 1. GATEKEEPER: Verify the user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new NextResponse('Unauthorized: Please log in to download invoices.', { status: 401 })
    }

    // 1b. Check if the user is an Admin
    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
    const isAdmin = userData?.role === 'admin' || userData?.role === 'super_admin'

    // 2. FETCH SECURE DATA: Fetch the order with addresses and B2B order items
    let query = supabase.from('orders')
      .select(`
        *,
        addresses (*),
        order_items (
          *,
          products (*)
        )
      `)
      .eq('id', id)

    // CRITICAL SECURITY: Only the owner can download their invoice UNLESS they are an admin
    if (!isAdmin) {
      query = query.eq('user_id', user.id)
    }

    const { data: order, error: orderError } = await query.single()

    if (orderError || !order) {
      console.error('[Invoice API] Order not found or access denied:', id)
      return new NextResponse('Invoice not found or you do not have permission to view it.', { status: 404 })
    }

    // 3. PAYMENT VALIDATION: Only allow downloads for paid orders to ensure tax compliance
    if (order.payment_status !== 'paid') {
      return new NextResponse('Payment Pending: Invoices are only generated after successful payment confirmation.', { status: 403 })
    }

    // 4. STREAM GENERATION: Instantly render and stream the PDF to prevent memory leaks
    // Pass the rich B2B order object into our upgraded template
    const pdfStream = await renderToStream(<InvoiceDocument order={order} invoiceType={invoiceType} /> as any)
    
    // 🚨 THE FIX: Convert legacy NodeJS Stream to modern Web ReadableStream for Next.js App Router
    const readableWebStream = new ReadableStream({
      start(controller) {
        pdfStream.on('data', (chunk) => controller.enqueue(chunk))
        pdfStream.on('end', () => controller.close())
        pdfStream.on('error', (err) => controller.error(err))
      }
    })
    
    // 5. SECURE DELIVERY: Set headers to trigger a direct download in the browser
    return new Response(readableWebStream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoiceType === 'merchant' ? 'Merchant-' : ''}Invoice-${order.order_number}.pdf"`,
        'Cache-Control': 'no-store, max-age=0', // Security: Don't cache financial documents
      },
    })
  } catch (error: any) {
    console.error('[Invoice API Error]:', error.message)
    return new NextResponse('An internal error occurred while generating your invoice. Please contact support.', { status: 500 })
  }
}