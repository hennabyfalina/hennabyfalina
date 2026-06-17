// src/components/checkout/CheckoutProgressBar.tsx

'use client';

import { Check } from 'lucide-react';
import { Fragment } from 'react';

interface CheckoutProgressBarProps {
  currentStep: number;
  checkoutStatus?: 'idle' | 'success' | 'failed';
}

export default function CheckoutProgressBar({ currentStep, checkoutStatus }: CheckoutProgressBarProps) {
  const steps = [
    { id: 1, label: 'Delivery Details', shortLabel: 'Delivery' },
    { id: 2, label: 'Review & Pay', shortLabel: 'Pay' },
    { id: 3, label: 'Confirmation', shortLabel: 'Done' },
  ];

  // Determine if line between step i and i+1 is completed
  const isLineCompleted = (lineIndex: number) => {
    return currentStep > lineIndex + 1;
  };

  return (
    <div className="fixed top-[60px] left-0 right-0 w-full z-[90] flex flex-col drop-shadow-sm">
      <div className="w-full bg-[#F0F7FF] border-b border-blue-100/50 py-4 sm:py-5 select-none font-sans antialiased relative">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 relative">
          {/* Flex container – keeps everything in a single horizontal row */}
          <div className="flex items-center justify-between w-full max-w-2xl mx-auto relative px-2 sm:px-0">
            {steps.map((step, idx) => (
              <Fragment key={step.id}>
                {/* Circle + label column */}
                <div className="flex items-center gap-2 flex-shrink-0 relative z-10">
                  {/* Circle background: active=black, completed=blue, inactive=gray */}
                  <div
                    className={`
                      w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300
                      text-[12px] font-semibold shadow-sm
                      ${currentStep > step.id || (currentStep === 3 && step.id === 3 && checkoutStatus === 'success') ? 'bg-blue-600 text-white' : currentStep === step.id ? 'bg-black text-white' : 'bg-blue-100 text-blue-400'}
                    `}
                  >
                    {currentStep > step.id || (currentStep === 3 && step.id === 3 && checkoutStatus === 'success') ? <Check className="w-3.5 h-3.5" strokeWidth={3.5} /> : step.id}
                  </div>

                  {/* Label below */}
                  <span
                    className={`
                      text-[13px] sm:text-[14px] font-medium text-left whitespace-nowrap
                      transition-colors duration-200
                      ${currentStep >= step.id ? 'text-gray-900 font-bold' : 'text-gray-400'}
                    `}
                  >
                    <span className="hidden sm:inline">{step.label}</span>
                    <span className="inline sm:hidden">{step.shortLabel}</span>
                  </span>
                </div>

                {/* Connecting line (only between steps, not after last) */}
                {idx < steps.length - 1 && (
                  <div className="flex-1 h-[2px] bg-blue-100 rounded-full overflow-hidden mx-2 sm:mx-4">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out bg-blue-600`}
                      style={{ width: isLineCompleted(idx) ? '100%' : '0%' }}
                    />
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}