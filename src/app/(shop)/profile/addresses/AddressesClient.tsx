// src/app/(shop)/profile/addresses/AddressesClient.tsx

'use client'

import { useState } from 'react'
import Link from 'next/link'
import Container from '@/components/ui/Container'
import Modal from '@/components/ui/Modal'
import PhoneInput from '@/components/ui/PhoneInput'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/Toast'
import { INDIAN_STATES } from '@/lib/states' // 🚨 Clean Reusable Import

interface Address {
  id: string
  user_id: string
  name: string
  phone: string
  address_line1: string
  address_line2: string | null
  landmark: string | null
  city: string
  state: string
  pincode: string
  country: string
  delivery_instructions: string | null
  address_type: string | null
  is_default: boolean
}

interface AddressesClientProps {
  initialAddresses: Address[]
  userId: string
}

const emptyForm = {
  name: '',
  phone: '',
  address_line1: '',
  address_line2: '',
  landmark: '',
  city: '',
  state: '',
  pincode: '',
  country: 'India',
  delivery_instructions: '',
  address_type: 'Home',
  is_default: false
}

export default function AddressesClient({ initialAddresses, userId }: AddressesClientProps) {
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [isPhoneValid, setIsPhoneValid] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const supabase = createClient()

  const validateName = (name: string): string => {
    if (!name.trim()) return 'Full name is required'
    if (name.trim().length < 2) return 'Name must be at least 2 characters'
    if (name.trim().length > 100) return 'Name is too long'
    return ''
  }

  const validatePincode = (pincode: string): string => {
    const cleanPincode = pincode.replace(/\D/g, '')
    if (!cleanPincode) return 'Pincode is required'
    if (!/^\d{6}$/.test(cleanPincode)) return 'Enter a valid 6-digit pincode'
    return ''
  }

  const validateAddressLine1 = (address: string): string => {
    if (!address.trim()) return 'Address is required'
    if (address.trim().length < 5) return 'Address must be at least 5 characters'
    return ''
  }

  const validateCity = (city: string): string => {
    if (!city.trim()) return 'City is required'
    if (city.trim().length < 2) return 'City must be at least 2 characters'
    return ''
  }

  // 🚨 Updated validation specifically for dropdowns
  const validateState = (state: string): string => {
    if (!state || state.trim() === '') return 'Please select a state'
    return ''
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    newErrors.name = validateName(formData.name)
    newErrors.address_line1 = validateAddressLine1(formData.address_line1)
    newErrors.city = validateCity(formData.city)
    newErrors.state = validateState(formData.state)
    newErrors.pincode = validatePincode(formData.pincode)
    
    if (!isPhoneValid && formData.phone) {
      newErrors.phone = 'Enter a valid phone number'
    } else if (!formData.phone) {
      newErrors.phone = 'Phone number is required'
    }
    
    setErrors(newErrors)
    return Object.values(newErrors).every(error => error === '')
  }

  const openAddModal = () => {
    if (addresses.length >= 2) {
      showToast('You can only have up to 2 saved addresses.')
      return
    }
    setFormData({ ...emptyForm, is_default: addresses.length === 0 }) 
    setEditingId(null)
    setErrors({})
    setIsModalOpen(true)
  }

  const openEditModal = (addr: Address) => {
    setFormData({
      name: addr.name,
      phone: addr.phone,
      address_line1: addr.address_line1,
      address_line2: addr.address_line2 || '',
      landmark: addr.landmark || '',
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      country: addr.country || 'India',
      delivery_instructions: addr.delivery_instructions || '',
      address_type: addr.address_type || 'Home',
      is_default: addr.is_default
    })
    setEditingId(addr.id)
    setErrors({})
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      showToast('Please fix the errors in the form.')
      return
    }

    setIsSaving(true)

    try {
      let result: any; 

      if (editingId) {
        const { data, error } = await supabase
          .from('addresses')
          .update({
            name: formData.name,
            phone: formData.phone,
            address_line1: formData.address_line1,
            address_line2: formData.address_line2 || null,
            landmark: formData.landmark || null,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
            country: formData.country,
            delivery_instructions: formData.delivery_instructions || null,
            address_type: formData.address_type,
          })
          .eq('id', editingId)
          .select()
          .single()
        
        if (error) throw error
        result = data
        
        setAddresses(addresses.map(a => a.id === editingId ? result : a))
        showToast('Address updated successfully')

      } else {
        if (addresses.length >= 2) {
          showToast('You can only have up to two addresses.')
          setIsModalOpen(false)
          return
        }

        const { data, error } = await supabase
          .from('addresses')
          .insert({ 
            name: formData.name,
            phone: formData.phone,
            address_line1: formData.address_line1,
            address_line2: formData.address_line2 || null,
            landmark: formData.landmark || null,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
            country: formData.country,
            delivery_instructions: formData.delivery_instructions || null,
            address_type: formData.address_type,
            user_id: userId 
          })
          .select()
          .single()

        if (error) throw error
        result = data

        setAddresses([...addresses, result])
        showToast('Address added successfully')
      }

      setIsModalOpen(false)
    } catch (error: any) {
      console.error(error)
      showToast(error.message || 'An error occurred while saving.')
    } finally {
      setIsSaving(false)
    }
  }

  const confirmRemove = (id: string) => {
    setDeleteConfirmId(id)
  }

  const executeRemove = async () => {
    if (!deleteConfirmId) return
    setIsDeleting(true)

    try {
      const { error } = await supabase.from('addresses').delete().eq('id', deleteConfirmId)
      if (error) throw error
      setAddresses(addresses.filter(a => a.id !== deleteConfirmId))
      showToast('Address removed')
    } catch (error: any) {
      showToast('Failed to remove address')
    } finally {
      setIsDeleting(false)
      setDeleteConfirmId(null)
    }
  }

  const handlePhoneValidation = (isValid: boolean) => {
    setIsPhoneValid(isValid)
    if (!isValid && formData.phone) {
      setErrors(prev => ({ ...prev, phone: 'Enter a valid phone number' }))
    } else {
      setErrors(prev => ({ ...prev, phone: '' }))
    }
  }

  const inputErrorClass = "w-full px-3 py-2 bg-white border border-red-500 rounded-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 shadow-sm text-sm"
  const inputClass = "w-full px-3 py-2 bg-white border border-gray-400 rounded-sm focus:outline-none focus:border-[#e77600] focus:ring-1 focus:ring-[#e77600] shadow-sm text-sm"
  const labelClass = "block text-sm font-bold text-gray-900 mb-1"
  const errorClass = "text-xs text-red-600 mt-1 font-medium"

  return (
    <div className="min-h-screen bg-white py-6 md:py-10 relative">
      <Container className="max-w-[1000px]">
        {/* Breadcrumb */}
        <div className="text-sm text-[#007185] hover:text-[#C7511F] hover:underline mb-4">
          <Link href="/profile">Your Account</Link> <span className="text-gray-500 mx-1">›</span> <span className="text-[#C7511F]">Your Addresses</span>
        </div>
        
        <h1 className="text-2xl md:text-3xl font-normal text-gray-900 mb-6 tracking-tight">Your Addresses</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {addresses.length < 2 && (
            <button 
              onClick={openAddModal}
              className="h-[280px] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors group cursor-pointer shadow-sm"
            >
              <Plus className="w-12 h-12 text-gray-400 group-hover:text-gray-600 transition-colors mb-2" strokeWidth={1.5} />
              <span className="text-lg font-bold text-gray-600 group-hover:text-gray-900">Add Address</span>
            </button>
          )}

          {addresses.map((addr, index) => (
            <div key={addr.id} className="h-[280px] border border-gray-300 rounded-lg p-5 flex flex-col shadow-sm relative bg-white">
              <div className="text-xs font-bold text-gray-500 mb-2 border-b border-gray-200 pb-2">
                {index === 0 ? 'Primary Address' : 'Secondary Address'}
              </div>
              <div className="flex-1 text-sm text-gray-900 leading-relaxed overflow-hidden">
                <p className="font-bold">{addr.name}</p>
                <p className="mt-1">{addr.address_line1}</p>
                {addr.address_line2 && <p>{addr.address_line2}</p>}
                <p>{addr.city}, {addr.state} {addr.pincode}</p>
                <p>{addr.country}</p>
                <p className="mt-2">Phone number: {addr.phone}</p>
              </div>
              
              <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-200 text-sm">
                <button 
                  onClick={() => openEditModal(addr)} 
                  className="text-[#007185] hover:text-[#C7511F] hover:underline"
                >
                  Edit
                </button>
                <button 
                  onClick={() => confirmRemove(addr.id)} 
                  className="text-[#007185] hover:text-[#C7511F] hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

        </div>
      </Container>

      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-md shadow-xl max-w-sm w-full p-6 text-center border border-gray-200 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-normal text-gray-900 mb-2">Remove Address</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to remove this address? You can add it back later if needed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={isDeleting}
                className="flex-1 py-2 text-sm font-normal text-gray-900 bg-white border border-gray-300 rounded-sm hover:bg-gray-50 shadow-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeRemove}
                disabled={isDeleting}
                className="flex-1 py-2 text-sm font-normal text-gray-900 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-sm shadow-sm transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Removing...' : 'Yes, remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Update your address" : "Add a new address"}>
        <form onSubmit={handleSave} className="space-y-4">
          
          <div>
            <label className={labelClass}>Country/Region</label>
            <select
              aria-label="Country or Region"
              title="Select Country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-sm text-sm font-medium text-gray-900 focus:outline-none"
            >
              <option value="India">India</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Full name (First and Last name) <span className="text-red-600">*</span></label>
            <input
              type="text"
              required
              placeholder="Full name"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value })
                setErrors(prev => ({ ...prev, name: validateName(e.target.value) }))
              }}
              className={errors.name ? inputErrorClass : inputClass}
            />
            {errors.name && <p className={errorClass}>{errors.name}</p>}
          </div>

          <div>
            <label className={labelClass}>Mobile number <span className="text-red-600">*</span></label>
            <PhoneInput
              value={formData.phone}
              onChange={(val) => setFormData({ ...formData, phone: val })}
              onValidationChange={handlePhoneValidation}
            />
            {errors.phone && <p className={errorClass}>{errors.phone}</p>}
          </div>

          <div>
            <label className={labelClass}>Pincode <span className="text-red-600">*</span></label>
            <input
              type="text"
              required
              maxLength={6}
              placeholder="6 digits [0-9] PIN code"
              value={formData.pincode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '')
                setFormData({ ...formData, pincode: val })
                setErrors(prev => ({ ...prev, pincode: validatePincode(val) }))
              }}
              className={errors.pincode ? inputErrorClass : inputClass}
            />
            {errors.pincode && <p className={errorClass}>{errors.pincode}</p>}
          </div>

          <div>
            <label className={labelClass}>Flat, House no., Building, Company, Apartment <span className="text-red-600">*</span></label>
            <input
              type="text"
              required
              placeholder="Flat, House no., Building, Company, Apartment"
              value={formData.address_line1}
              onChange={(e) => {
                setFormData({ ...formData, address_line1: e.target.value })
                setErrors(prev => ({ ...prev, address_line1: validateAddressLine1(e.target.value) }))
              }}
              className={errors.address_line1 ? inputErrorClass : inputClass}
            />
            {errors.address_line1 && <p className={errorClass}>{errors.address_line1}</p>}
          </div>

          <div>
            <label className={labelClass}>Area, Street, Sector, Village</label>
            <input
              type="text"
              placeholder="Area, Street, Sector, Village"
              value={formData.address_line2}
              onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Landmark</label>
            <input
              type="text"
              placeholder="E.g. near apollo hospital"
              value={formData.landmark}
              onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Town/City <span className="text-red-600">*</span></label>
              <input
                type="text"
                required
                placeholder="Town/City"
                value={formData.city}
                onChange={(e) => {
                  setFormData({ ...formData, city: e.target.value })
                  setErrors(prev => ({ ...prev, city: validateCity(e.target.value) }))
                }}
                className={errors.city ? inputErrorClass : inputClass}
              />
              {errors.city && <p className={errorClass}>{errors.city}</p>}
            </div>
            
            {/* 🚨 REUSABLE DROPDOWN IMPORTED FROM states.ts */}
            <div>
              <label className={labelClass}>State <span className="text-red-600">*</span></label>
              <select
                aria-label="State"
                title="Select State"
                required
                value={formData.state || ""}
                onChange={(e) => {
                  setFormData({ ...formData, state: e.target.value })
                  setErrors(prev => ({ ...prev, state: validateState(e.target.value) }))
                }}
                disabled={isSaving}
                className={errors.state ? inputErrorClass : inputClass}
              >
                <option value="" disabled>Select State</option>
                {INDIAN_STATES.map((stateName) => (
                  <option key={stateName} value={stateName}>
                    {stateName}
                  </option>
                ))}
              </select>
              {errors.state && <p className={errorClass}>{errors.state}</p>}
            </div>
          </div>

          <div>
            <label className={labelClass}>Address Type</label>
            <select
              aria-label="Address Type"
              title="Select Address Type"
              value={formData.address_type || 'Home'}
              onChange={(e) => setFormData({ ...formData, address_type: e.target.value })}
              className={inputClass}
            >
              <option value="Home">Home (7 am - 9 pm delivery)</option>
              <option value="Office">Office/Commercial (10 am - 6 pm delivery)</option>
            </select>
          </div>

          <div className="pt-4 border-t border-gray-200 mt-6">
            <button
              type="submit"
              disabled={isSaving}
              className="py-2.5 px-6 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-sm text-sm font-medium text-gray-900 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : editingId ? 'Save changes' : 'Add address'}
            </button>
          </div>

        </form>
      </Modal>
    </div>
  )
}