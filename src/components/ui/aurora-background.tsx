import React from 'react';

export const AuroraBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-[#F8FBFC] selection:bg-hbs-blue-light selection:text-hbs-blue-deep">
      {/* Living Mesh Aurora in Google Stitch School Colors */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-60">
        {/* Cerulean Blue orb */}
        <div className="absolute -top-[15%] left-[10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#0B7BA7]/25 to-transparent blur-[120px] animate-pulse duration-[10000ms]" />
        
        {/* Soft Teal orb */}
        <div className="absolute top-[35%] -right-[10%] w-[650px] h-[650px] rounded-full bg-gradient-to-bl from-[#00A896]/20 to-transparent blur-[140px] animate-pulse duration-[12000ms] delay-1000" />
        
        {/* Warm Golden Marigold orb */}
        <div className="absolute -bottom-[10%] left-[20%] w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-[#F39200]/15 to-transparent blur-[130px] animate-pulse duration-[9000ms] delay-2000" />
      </div>

      {/* Content wrapper */}
      <div className="relative z-10 w-full min-h-dvh flex flex-col">
        {children}
      </div>
    </div>
  );
};
