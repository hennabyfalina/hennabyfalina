// src/components/pdf/InvoiceDocument.tsx

import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { siteConfig } from '@/config/site'

// Define the styles for the PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: '#4b5563',
    paddingBottom: 15,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  text: {
    fontSize: 10,
    color: '#333',
    lineHeight: 1.5,
  },
  invoiceTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    marginBottom: 8,
    textAlign: 'right',
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 3,
    justifyContent: 'flex-end',
  },
  headerLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    width: 70,
  },
  headerValue: {
    fontSize: 10,
    width: 125,
    textAlign: 'right',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
  },
  addressRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  addressLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    width: 100,
  },
  addressValue: {
    fontSize: 10,
    flex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  col1: { width: '8%', textAlign: 'center' },
  col2: { width: '42%' },
  col3: { width: '10%', textAlign: 'center' },
  col4: { width: '20%', textAlign: 'right' },
  col5: { width: '20%', textAlign: 'right' },
  tableHeaderLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 30,
  },
  totalsBox: {
    width: 220,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#d1d5db',
    marginTop: 2,
  },
  grandTotalText: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#d1d5db',
    paddingTop: 15,
    alignItems: 'center',
  },
  footerTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  tableRowAlt: {
    backgroundColor: '#f9fafb',
  },
  watermarkContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1,
  },
  watermarkText: {
    fontSize: 90,
    fontFamily: 'Helvetica-Bold',
    transform: 'rotate(-45deg)',
    opacity: 0.15,
  }
})

const formatCurrency = (amount: number) => `Rs. ${amount.toFixed(2)}`

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  })
}

export default function InvoiceDocument({ order }: { order: any }) {
  const shippingCost = order.shipping_cost ?? (order.total_amount > 1000 ? 0 : 50)
  const subtotal = order.total_amount - shippingCost

  const isStorePickup = order.delivery_method === 'pickup' || 
                        order.addresses?.delivery_method === 'pickup' ||
                        order.addresses?.address_line1?.toLowerCase().includes('pickup') || 
                        order.addresses?.address?.toLowerCase().includes('pickup')
  const deliveryMethodLabel = isStorePickup ? 'Store Pickup' : 'Standard Delivery'

  const capitalize = (str: string) => str ? str.charAt(0).toUpperCase() + str.slice(1) : ''

  let watermarkText = 'PENDING'
  let watermarkColor = '#f59e0b' // Amber
  
  if (order.status?.toLowerCase().includes('cancel')) {
    watermarkText = 'CANCELLED'
    watermarkColor = '#ef4444' // Red
  } else if (order.payment_status?.toLowerCase() === 'paid' || order.payment_status?.toLowerCase() === 'captured' || order.payment_status?.toLowerCase() === 'success') {
    watermarkText = 'PAID'
    watermarkColor = '#22c55e' // Green
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Watermark Stamp */}
        <View style={styles.watermarkContainer}>
          <Text style={[styles.watermarkText, { color: watermarkColor }]}>{watermarkText}</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{siteConfig.name}</Text>
            <Text style={styles.text}>{siteConfig.address.line1}</Text>
            <Text style={styles.text}>{siteConfig.address.city} - {siteConfig.address.pincode}, {siteConfig.address.state}, {siteConfig.address.country}</Text>
            <Text style={styles.text}>Phone: {siteConfig.contact.phone.primary} | {siteConfig.contact.phone.secondary}</Text>
            <Text style={styles.text}>Email: {siteConfig.contact.email.orders}</Text>
            <Text style={styles.text}>GSTIN: {siteConfig.business.gstin}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>Tax Invoice</Text>
            
            <View style={styles.headerRow}>
              <Text style={styles.headerLabel}>Order #:</Text>
              <Text style={styles.headerValue}>{order.order_number}</Text>
            </View>
            
            <View style={styles.headerRow}>
              <Text style={styles.headerLabel}>Order Date:</Text>
              <Text style={styles.headerValue}>{formatDate(order.created_at)}</Text>
            </View>
            
            <View style={styles.headerRow}>
              <Text style={styles.headerLabel}>Invoice Date:</Text>
              <Text style={styles.headerValue}>{formatDate(new Date().toISOString())}</Text>
            </View>
            
            <View style={[styles.headerRow, { marginTop: 2 }]}>
              <Text style={styles.headerLabel}>Payment:</Text>
              <Text style={styles.headerValue}>
                Razorpay {capitalize(order.payment_method_detail || order.payment_method || 'Standard')} ({order.payment_status})
              </Text>
            </View>
          </View>
        </View>

        {/* Billing Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Billing & Shipping Address</Text>
          
          <View style={styles.addressRow}>
            <Text style={styles.addressLabel}>Delivery method:</Text>
            <Text style={styles.addressValue}>{deliveryMethodLabel}</Text>
          </View>
          
          <View style={styles.addressRow}>
            <Text style={styles.addressLabel}>Name:</Text>
            <Text style={styles.addressValue}>{order.addresses?.name}</Text>
          </View>
          
          {!isStorePickup ? (
            <View style={styles.addressRow}>
              <Text style={styles.addressLabel}>Address & Pincode:</Text>
              <Text style={styles.addressValue}>
                {order.addresses?.address || order.addresses?.address_line1}, {order.addresses?.city} {order.addresses?.pincode}
              </Text>
            </View>
          ) : (
            <View style={styles.addressRow}>
              <Text style={styles.addressLabel}>Pincode:</Text>
              <Text style={styles.addressValue}>{order.addresses?.pincode}</Text>
            </View>
          )}
          
          <View style={styles.addressRow}>
            <Text style={styles.addressLabel}>Country:</Text>
            <Text style={styles.addressValue}>{order.addresses?.country || 'India'}</Text>
          </View>
          
          <View style={styles.addressRow}>
            <Text style={styles.addressLabel}>Mobile number:</Text>
            <Text style={[styles.addressValue, { fontFamily: 'Helvetica-Bold' }]}>{order.addresses?.phone}</Text>
          </View>
          
          {order.addresses?.landmark && (
            <View style={[styles.addressRow, { marginTop: 4 }]}>
              <Text style={styles.addressLabel}>Landmark:</Text>
              <Text style={styles.addressValue}>{order.addresses.landmark}</Text>
            </View>
          )}
          
          {order.addresses?.delivery_instructions && (
            <View style={[styles.addressRow, { marginTop: 4 }]}>
              <Text style={styles.addressLabel}>Instructions:</Text>
              <Text style={styles.addressValue}>{order.addresses.delivery_instructions}</Text>
            </View>
          )}
        </View>

        {/* Order Items Table */}
        <View style={styles.section}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderLabel, styles.col1]}>#</Text>
            <Text style={[styles.tableHeaderLabel, styles.col2]}>Product Description</Text>
            <Text style={[styles.tableHeaderLabel, styles.col3]}>Qty</Text>
            <Text style={[styles.tableHeaderLabel, styles.col4]}>Unit Price</Text>
            <Text style={[styles.tableHeaderLabel, styles.col5]}>Total</Text>
          </View>
          
          {order.order_items?.map((item: any, index: number) => (
            <View key={item.id} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.text, styles.col1]}>{index + 1}</Text>
              <View style={styles.col2}>
                <Text style={[styles.text, { fontFamily: 'Helvetica-Bold' }]}>{item.products?.name}</Text>
                {item.is_bulk_pricing && (
                  <Text style={{ fontSize: 8, color: '#15803d', marginTop: 2 }}>[Bulk Price Applied]</Text>
                )}
              </View>
              <Text style={[styles.text, styles.col3]}>{item.quantity}</Text>
              <View style={styles.col4}>
                <Text style={styles.text}>{formatCurrency(item.price)}</Text>
                {item.original_price && item.original_price > item.price && (
                  <Text style={{ fontSize: 8, color: '#6b7280', textDecoration: 'line-through', marginTop: 1 }}>{formatCurrency(item.original_price)}</Text>
                )}
              </View>
              <Text style={[styles.text, styles.col5, { fontFamily: 'Helvetica-Bold' }]}>
                {formatCurrency(item.price * item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={[styles.text, { fontFamily: 'Helvetica-Bold' }]}>Subtotal:</Text>
              <Text style={styles.text}>{formatCurrency(subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={[styles.text, { fontFamily: 'Helvetica-Bold' }]}>Shipping & Handling:</Text>
              <Text style={styles.text}>{shippingCost === 0 ? 'Free' : formatCurrency(shippingCost)}</Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalText}>Grand Total:</Text>
              <Text style={styles.grandTotalText}>{formatCurrency(order.total_amount)}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>Thank you for shopping with {siteConfig.name}!</Text>
          <Text style={styles.text}>Returns & Replacements are eligible within 7 days of delivery.</Text>
          <Text style={styles.text}>If you have any questions about this invoice, please contact us at {siteConfig.contact.email.orders}</Text>
        </View>
      </Page>
    </Document>
  )
}
