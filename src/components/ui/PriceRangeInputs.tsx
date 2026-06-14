// src/components/ui/PriceRangeInputs.tsx

'use client'

import { useState, useEffect, useRef } from 'react'

interface PriceRangeInputsProps {
  initialMin: string
  initialMax: string
  onChange: (min: string | null, max: string | null) => void
}

export default function PriceRangeInputs({ initialMin, initialMax, onChange }: PriceRangeInputsProps) {
  const minLimit = 0
  const maxLimit = 1650

  const [minVal, setMinVal] = useState(Number(initialMin) || minLimit)
  const [maxVal, setMaxVal] = useState(Number(initialMax) || maxLimit)
  
  const minPercent = Math.round(((minVal - minLimit) / (maxLimit - minLimit)) * 100)
  const maxPercent = Math.round(((maxVal - minLimit) / (maxLimit - minLimit)) * 100)

  // 🌟 ELITE DRY FIX: Capture callback in a mutable ref container to kill background render loop cycles
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  // Triggers filtering only after a 400ms user interaction pause
  useEffect(() => {
    const timer = setTimeout(() => {
      const apiMin = minVal > minLimit ? minVal.toString() : null
      const apiMax = maxVal < maxLimit ? maxVal.toString() : null
      
      const currentMinParam = initialMin || null
      const currentMaxParam = initialMax || null

      if (apiMin !== currentMinParam || apiMax !== currentMaxParam) {
        onChangeRef.current(apiMin, apiMax)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [minVal, maxVal, initialMin, initialMax])

  useEffect(() => {
    setMinVal(Number(initialMin) || minLimit)
    setMaxVal(Number(initialMax) || maxLimit)
  }, [initialMin, initialMax])

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Number(e.target.value), maxVal - 50)
    setMinVal(value)
  }

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(Number(e.target.value), minVal + 50)
    setMaxVal(value)
  }

  return (
    <div className="w-full pt-4 pb-1 px-1">
      <div className="relative w-full h-1.5 bg-gray-100 rounded-full">
        <div 
          className="absolute h-full bg-blue-600 rounded-full transition-all"
          style={{
            left: `${minPercent}%`,
            right: `${100 - maxPercent}%`
          }}
        />
        <input
          type="range"
          min={minLimit}
          max={maxLimit}
          value={minVal}
          onChange={handleMinChange}
          aria-label="Minimum price"
          className="absolute w-full h-1.5 top-0 left-0 appearance-none bg-transparent pointer-events-none cursor-pointer accent-transparent z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-gray-200 [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:appearance-none"
        />
        <input
          type="range"
          min={minLimit}
          max={maxLimit}
          value={maxVal}
          onChange={handleMaxChange}
          aria-label="Maximum price"
          className="absolute w-full h-1.5 top-0 left-0 appearance-none bg-transparent pointer-events-none cursor-pointer accent-transparent z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-gray-200 [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:appearance-none"
        />
      </div>

      <div className="flex items-center justify-between mt-6 gap-3">
        <div className="flex-1 flex flex-col gap-1.5">
          <span className="text-[12px] font-medium text-gray-400 ml-1">Min price</span>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[13px]">₹</span>
            <input 
              aria-label="Minimum price value"
              type="number"
              value={minVal}
              onChange={(e) => setMinVal(Math.max(minLimit, Math.min(Number(e.target.value), maxVal - 1)))}
              className="w-full h-10 pl-7 pr-3 bg-transparent border-b border-gray-100 rounded-none text-[14px] font-light text-gray-900 focus:border-gray-900 transition-all outline-none"
            />
          </div>
        </div>
        
        <div className="flex-1 flex flex-col gap-1.5">
          <span className="text-[12px] font-medium text-gray-400 ml-1">Max price</span>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[13px]">₹</span>
            <input
              aria-label="Maximum price value"
              type="number"
              value={maxVal}
              onChange={(e) => setMaxVal(Math.min(maxLimit, Math.max(Number(e.target.value), minVal + 1)))}
              className="w-full h-10 pl-7 pr-3 bg-transparent border-b border-gray-100 rounded-none text-[14px] font-light text-gray-900 focus:border-gray-900 transition-all outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  )
}