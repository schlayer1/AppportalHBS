import React from 'react';

export const AuroraBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-gradient-to-b from-[#EBF3F8] via-[#F4F8FA] to-[#E9F1F6] text-[#091D2E]">
      
      {/* High-Impact Luminous Background Orbs with rich vibrant color */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Top-Right Glowing Cerulean Sun */}
        <div className="absolute -top-[15%] -right-[5%] w-[500px] sm:w-[750px] h-[500px] sm:h-[750px] rounded-full bg-gradient-to-br from-[#0B7BA7]/35 via-[#00A896]/20 to-transparent blur-[90px] sm:blur-[130px]" />
        
        {/* Mid-Left Warm Marigold Accent */}
        <div className="absolute top-[28%] -left-[15%] w-[450px] sm:w-[650px] h-[450px] sm:h-[650px] rounded-full bg-gradient-to-tr from-[#F39200]/25 via-[#FFA929]/15 to-transparent blur-[100px] sm:blur-[140px]" />

        {/* Bottom Soft Emerald Aura */}
        <div className="absolute -bottom-[10%] right-[15%] w-[500px] sm:w-[700px] h-[500px] sm:h-[700px] rounded-full bg-gradient-to-tl from-[#006B5F]/20 via-[#00A896]/15 to-transparent blur-[100px] sm:blur-[150px]" />
      </div>

      {/* Content wrapper */}
      <div className="relative z-10 w-full min-h-dvh flex flex-col">
        {children}
      </div>
    </div>
  );
};
