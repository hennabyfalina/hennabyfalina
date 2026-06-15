// src/components/checkout/CheckoutProgressBar.tsx

'use client';

import { Check, Timer } from 'lucide-react';
import { Fragment } from 'react';

interface CheckoutProgressBarProps {
  currentStep: number;
  formattedTime?: string;
  isExpired?: boolean;
}

export default function CheckoutProgressBar({ currentStep, formattedTime, isExpired }: CheckoutProgressBarProps) {
  const steps = [
    { id: 1, label: 'Delivery Details', shortLabel: 'Delivery' },
    { id: 2, label: 'Review & Pay', shortLabel: 'Pay' },
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
        <div className="flex items-center justify-center gap-4 sm:gap-8 max-w-md mx-auto relative">
          {steps.map((step, idx) => (
            <Fragment key={step.id}>
              {/* Circle + label column */}
              <div className="flex items-center gap-2.5 flex-shrink-0 relative z-10">
                {/* Circle background: active=black, completed=black, inactive=gray */}
                <div
                  className={`
                    w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300
                    text-white text-[12px] font-semibold shadow-sm
                    ${currentStep > step.id ? 'bg-blue-600' : currentStep === step.id ? 'bg-black' : 'bg-gray-200'}
                  `}
                >
                  {currentStep > step.id ? <Check className="w-3.5 h-3.5" strokeWidth={3.5} /> : step.id}
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
                <div className="w-8 sm:w-16 h-[2px] bg-gray-200/80 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out bg-blue-600 ${isLineCompleted(idx) ? 'w-full' : 'w-0'}`}
                    style={{ width: isLineCompleted(idx) ? '100%' : '0%' }}
                  />
                </div>
              )}
            </Fragment>
          ))}
        </div>

          {/* Desktop Timer: Positioned in the far right corner of the banner */}
          {formattedTime && !isExpired && (
            <div className={`hidden md:flex absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 px-3 py-1 items-center gap-2 text-[14px] font-medium transition-all ${
              parseInt(formattedTime.split(':')[0]) < 3 ? 'text-red-600 border-red-200 bg-red-50/30' : 'text-gray-500 border-gray-200 bg-transparent'
            }`}>
              <Timer className={`w-3.5 h-3.5 shrink-0 ${parseInt(formattedTime.split(':')[0]) < 3 ? 'animate-pulse' : ''}`} strokeWidth={2.5} />
              <p className="tracking-tight">
                Reserved for <span className="font-bold tabular-nums ml-0.5">{formattedTime}</span>
              </p>
            </div>
          )}

          {/* Mobile Timer: Positioned in the far right corner, icon + time only */}
          {formattedTime && !isExpired && (
            <div className={`md:hidden absolute right-4 top-1/2 -translate-y-1/2 h-7 px-2 flex items-center gap-1.5 text-[12px] font-bold transition-all ${
              parseInt(formattedTime.split(':')[0]) < 3 ? 'text-red-600 border-red-200 bg-red-50/30' : 'text-gray-500 border-gray-200 bg-transparent'
            }`}>
              <Timer className={`w-3.5 h-3.5 shrink-0 ${parseInt(formattedTime.split(':')[0]) < 3 ? 'animate-pulse' : ''}`} strokeWidth={2.5} />
              <span className="tabular-nums tracking-tight">
                {formattedTime.split(':')[0]}:{formattedTime.split(':')[1]}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}