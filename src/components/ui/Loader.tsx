// src/components/ui/Loader.tsx

export default function Loading() {
  const bars = Array.from({ length: 12 });

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/60 backdrop-blur-md transition-all duration-300 select-none pointer-events-none" suppressHydrationWarning>
      {/* Authentic iOS Smooth Sequential Fade Spinner */}
      <div className="relative w-8 h-8 flex items-center justify-center">
        {bars.map((_, i) => {
          const rotationAngle = i * 30; // 30 deg steps
          // Stagger delays backwards to make the animation cycle clockwise smoothly
          const animationDelay = -1 + (i * 0.083); 

          return (
            <div
              key={i}
              className="absolute w-[2.5px] h-[7.5px] bg-gray-900 rounded-full animate-ios-fade"
              style={{
                transform: `rotate(${rotationAngle}deg) translateY(-10px)`,
                animationDelay: `${animationDelay}s`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}