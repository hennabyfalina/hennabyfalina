// src/components/admin/CustomerModal.tsx

'use client'

import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import AdminConfirmModal from '@/components/admin/layout/AdminConfirmModal'
import { showToast } from '@/components/ui/Toast'
import { User, MapPin, Phone, Mail, Trash2, ShieldAlert } from 'lucide-react'

interface CustomerFormData {
  name: string
  email: string
  phone: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  pincode: string
  country: string
}

interface CustomerModalProps {
  isOpen: boolean
  onClose: () => void
  customer?: any // null if adding new
  onSuccess: () => void
}

export default function CustomerModal({ isOpen, onClose, customer, onSuccess }: CustomerModalProps) {
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '', email: '', phone: '', address_line1: '', address_line2: '', city: '', state: '', pincode: '', country: 'India'
  })
  const [activeTab, setActiveTab] = useState<'profile' | 'address'>('profile')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address_line1: customer.addresses?.[0]?.address_line1 || '',
        address_line2: customer.addresses?.[0]?.address_line2 || '',
        city: customer.addresses?.[0]?.city || '',
        state: customer.addresses?.[0]?.state || '',
        pincode: customer.addresses?.[0]?.pincode || '',
        country: customer.addresses?.[0]?.country || 'India',
      })
    } else {
      setFormData({ name: '', email: '', phone: '', address_line1: '', address_line2: '', city: '', state: '', pincode: '', country: 'India' })
    }
  }, [customer, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const endpoint = customer ? `/api/admin/customers/${customer.id}` : `/api/admin/customers`
      const method = customer ? 'PATCH' : 'POST'
      
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Failed to save customer data')
      
      showToast(`Customer ${customer ? 'updated' : 'added'} successfully`, 'success')
      onSuccess()
      onClose()
    } catch (error: any) {
      showToast(error.message || 'Error saving customer', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/customers/${customer.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete customer')
      
      showToast('Customer permanently deleted', 'success')
      setShowDeleteConfirm(false)
      onSuccess()
      onClose()
    } catch (error: any) {
      showToast(error.message || 'Error deleting customer', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClass = "w-full px-4 py-3 bg-[#131314] border border-[#333538] text-[#E3E3E3] placeholder:text-[#565959] rounded-2xl focus:outline-none focus:border-[#A8C7FA] focus:ring-1 focus:ring-[#A8C7FA] transition-all"
  const labelClass = "block text-[11px] font-bold text-[#8E9196] mb-1.5 ml-1 uppercase tracking-wider"

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={customer ? 'Edit Customer' : 'Add New Customer'}>
        <div className="border-b border-[#333538] mb-6">
          <nav className="flex gap-2 min-w-max pb-px">
            <button type="button" onClick={() => setActiveTab('profile')} className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${activeTab === 'profile' ? 'border-[#A8C7FA] text-[#A8C7FA]' : 'border-transparent text-[#8E9196] hover:text-[#E3E3E3]'}`}>Profile</button>
            <button type="button" onClick={() => setActiveTab('address')} className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${activeTab === 'address' ? 'border-[#A8C7FA] text-[#A8C7FA]' : 'border-transparent text-[#8E9196] hover:text-[#E3E3E3]'}`}>Shipping Info</button>
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {activeTab === 'profile' && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <label className={labelClass}><User className="w-3 h-3 inline mr-1" /> Full Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputClass} placeholder="e.g. John Doe" />
              </div>
              <div>
                <label className={labelClass}><Mail className="w-3 h-3 inline mr-1" /> Email Address *</label>
                <input type="email" name="email" title="Email Address" value={formData.email} onChange={handleChange} required disabled={!!customer} className={`${inputClass} ${customer ? 'opacity-50 cursor-not-allowed' : ''}`} placeholder="customer@example.com" />
                {customer && <p className="text-[10px] text-[#565959] mt-1 ml-1">Email cannot be changed after account creation.</p>}
              </div>
              <div>
                <label className={labelClass}><Phone className="w-3 h-3 inline mr-1" /> Phone Number</label>
                <input type="tel" name="phone" title="Phone Number" value={formData.phone} onChange={handleChange} className={inputClass} placeholder="+91 98765 43210" />
              </div>
            </div>
          )}

          {activeTab === 'address' && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <label className={labelClass}><MapPin className="w-3 h-3 inline mr-1" /> Address Line 1</label>
                <input type="text" name="address_line1" value={formData.address_line1} onChange={handleChange} className={inputClass} placeholder="Street address, building, company" />
              </div>
              <div>
                <label className={labelClass}>Address Line 2</label>
                <input type="text" name="address_line2" value={formData.address_line2} onChange={handleChange} className={inputClass} placeholder="Apartment, suite, unit, etc. (optional)" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>City</label>
                  <input type="text" name="city" title="City" placeholder="City" value={formData.city} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>State</label>
                  <input type="text" name="state" title="State" placeholder="State" value={formData.state} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Pincode</label>
                  <input type="text" name="pincode" title="Pincode" placeholder="Pincode" value={formData.pincode} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Country</label>
                  <input type="text" name="country" title="Country" placeholder="Country" value={formData.country} onChange={handleChange} className={inputClass} />
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-[#333538] flex flex-col gap-3">
            <button type="submit" disabled={isSubmitting} className="w-full py-3.5 bg-[#0B57D0] text-white font-bold rounded-full hover:bg-[#0842A0] transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-900/20">
              {isSubmitting ? 'Saving...' : customer ? 'Update Customer' : 'Create Customer'}
            </button>
            {customer && (
              <button type="button" onClick={() => setShowDeleteConfirm(true)} className="w-full py-3.5 bg-transparent border border-[#4D2628] text-[#F2B8B5] font-bold rounded-full hover:bg-[#4D2628] transition-all cursor-pointer">
                Delete Customer
              </button>
            )}
          </div>
        </form>
      </Modal>

      {/* 🚨 2-STEP DELETE VERIFICATION 🚨 */}
      <AdminConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Purge Customer Data?"
        description={`You are about to completely delete the account and data for "${customer?.name}".`}
        confirmText="Delete Customer"
        isDestructive={true}
        requireMatch="DELETE" 
        isLoading={isSubmitting}
      />
    </>
  )
}