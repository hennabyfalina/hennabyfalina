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
    <div className="bg-white w-full flex flex-col gap-4 animate-fade-in font-sans antialiased text-left select-none -mt-4">
      
      <div className="flex items-start justify-between pb-1">
        <h4 className="font-normal text-[27px] text-gray-900 tracking-tight capitalize">
          {isDelivery ? 'Delivery Address' : 'Pickup Details'}
        </h4>
      </div>

      {/* Embedded Form Field Slate */}
      <AddressForm 
        formData={formData} 
        onChange={updateFormField} 
        shippingMethod={shippingMethod} 
        hideTitle={true}
      />

    </div>
  )
}