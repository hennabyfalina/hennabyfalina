// src/components/ui/Loader.tsx

export default function Loader() {
  return (
    <div className="flex justify-center items-center p-4">
      <div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-[#e77600] rounded-full" />
    </div>
  )
}