// src/components/checkout/AddressFormContainer.tsx

'use client'

import AddressForm from './AddressForm'
import type { AddressFormData } from './AddressForm'

interface AddressFormContainerProps {
  formData: AddressFormData
  updateFormField: (field: keyof AddressFormData, value: string) => void
  shippingMethod: 'delivery' | 'pickup'
  addressMode: 'ADDING' | 'EDITING'
  isSavingAddress: boolean
  canSaveAddress: boolean
  savedAddressesLength: number
  onCancel: () => void
  onSave: () => void
}

export default function AddressFormContainer({
  formData,
  updateFormField,
  shippingMethod,
  addressMode,
  isSavingAddress,
  canSaveAddress,
  savedAddressesLength,
  onCancel,
  onSave,
}: AddressFormContainerProps) {
  const isDelivery = shippingMethod === 'delivery'
  const isEditing = addressMode === 'EDITING'

  return (
    <div className="bg-white rounded-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-[#0F1111] text-lg">
          {isEditing 
            ? (isDelivery ? 'Edit address' : 'Edit Pickup Contact')
            : (isDelivery ? 'Add a new address' : 'Add Pickup Details')
          }
        </h3>
      </div>

      <AddressForm 
        formData={formData} 
        onChange={updateFormField} 
        shippingMethod={shippingMethod} 
        hideTitle={true}
      />

      <div className={`mt-6 flex items-center gap-3 pt-4 border-t border-[#D5D9D9] ${savedAddressesLength === 0 ? 'justify-center' : 'justify-end'}`}>
        {isEditing && (
          <button 
            onClick={onCancel} 
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-sm transition-colors cursor-pointer border border-[#D5D9D9]"
          >
            Cancel
          </button>
        )}
        <button 
          onClick={onSave} 
          disabled={!canSaveAddress || isSavingAddress} 
          className="px-6 py-2 text-sm font-bold text-[#0F1111] bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-sm shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSavingAddress 
            ? 'Saving...' 
            : (isEditing ? (isDelivery ? 'Update Address' : 'Update Contact') : (isDelivery ? 'Save Address' : 'Save Contact Details'))
          }
        </button>
      </div>
    </div>
  )
}