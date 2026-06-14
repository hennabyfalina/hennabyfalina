// src/app/(shop)/order/[id]/loading.tsx

import Container from '@/components/ui/Container'

export default function OrderDetailsLoading() {
  return (
    <div className="min-h-screen bg-white py-8 md:py-16 animate-pulse select-none text-left">
      <Container className="max-w-[1000px] px-4 sm:px-8">
        
        {/* Left-Aligned Back button skeleton line */}
        <div className="mb-6">
          <div className="h-4 w-32 bg-stone-100 rounded-md" />
        </div>

        {/* Left-Aligned Main header typographic skeleton strip */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-stone-100 pb-6 mb-10 w-full">
          <div className="space-y-2.5">
            <div className="h-9 w-52 bg-stone-100 rounded-lg" />
            <div className="flex items-center gap-3">
              <div className="h-4 w-28 bg-stone-100 rounded-md" />
              <div className="w-1 h-1 rounded-full bg-stone-200" />
              <div className="h-4 w-36 bg-stone-100 rounded-md" />
            </div>
          </div>
          <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
            <div className="h-9 w-28 bg-stone-50 rounded-xl" />
            <div className="h-9 w-28 bg-stone-50 rounded-xl" />
          </div>
        </div>

        {/* Borderless Tracking timeline workflow skeleton */}
        <div className="mb-14 border-b border-stone-100 pb-12 w-full">
          <div className="h-5 w-44 bg-stone-100 rounded-md mb-8" />
          <div className="space-y-6">
            {[1, 2, 3].map((timeline) => (
              <div key={timeline} className="flex items-start gap-4">
                <div className="w-6 h-6 bg-stone-50 rounded-full shrink-0" />
                <div className="flex-1 space-y-2 pt-0.5">
                  <div className="h-4 w-32 bg-stone-100 rounded-md" />
                  <div className="h-3.5 w-48 bg-stone-100 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Product listing stream rows ledger skeleton */}
        <div className="mb-14 border-b border-stone-100 pb-10 w-full">
          <div className="h-5 w-36 bg-stone-100 rounded-md mb-6" />
          <div className="flex flex-col w-full space-y-6">
            {[1, 2].map((item) => (
              <div key={item} className="flex flex-col sm:flex-row gap-6 items-start justify-between w-full border-b border-stone-50 pb-6 last:border-0 last:pb-0">
                <div className="flex gap-5 flex-1 w-full">
                  {/* Thumb Box Shape Placeholder */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-stone-50 border border-stone-100 rounded-2xl shrink-0" />
                  
                  {/* Description Info Lines Placeholders */}
                  <div className="flex-1 space-y-2.5 pt-0.5">
                    <div className="h-4.5 w-full max-w-md bg-stone-100 rounded-md" />
                    <div className="h-4 w-28 bg-stone-100 rounded-md" />
                    <div className="h-4 w-40 bg-stone-100 rounded-md pt-1" />
                  </div>
                </div>
                
                {/* Button actions structure side track placeholder */}
                <div className="flex flex-row sm:flex-col items-start sm:items-end gap-3 shrink-0 w-full sm:w-44 pt-0.5 justify-between sm:justify-start">
                  <div className="h-4 w-16 bg-stone-100 rounded-md" />
                  <div className="h-9 bg-stone-50 rounded-xl w-28 sm:w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 🚀 THE APPLE-STYLE 3-COLUMN PARAMETER MATRIX SKELETON ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12 w-full pt-2">
          {[1, 2, 3].map((col) => (
            <div key={col} className="space-y-4 w-full">
              <div className="h-4 w-40 bg-stone-100 rounded-md pb-2 border-b border-stone-50 w-full" />
              <div className="space-y-2.5">
                <div className="h-4 w-11/12 bg-stone-100 rounded-md" />
                <div className="h-4 w-4/5 bg-stone-100 rounded-md" />
                <div className="h-4 w-3/4 bg-stone-100 rounded-md" />
              </div>
            </div>
          ))}
        </div>

      </Container>
    </div>
  )
}