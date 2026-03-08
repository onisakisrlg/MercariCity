import React from 'react';
import { ContributionData, ContributionDay } from '../../services/dataService';

interface UIOverlayProps {
  hoveredDay: ContributionDay | null;
  totalContributions: number;
  username?: string;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({ hoveredDay, totalContributions, username = "Guest" }) => {
  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none p-6 flex flex-col justify-between z-10">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl md:text-6xl font-bold drop-shadow-lg tracking-tighter">
            <span className="text-[#3355FF]">Mer</span>
            <span className="text-[#EA352D]">cari</span>
            <span className="text-[#FFFFFF]">City</span>
          </h1>
        </div>
      </div>

      {/* Footer / Hover Info - Removed as requested */}
      <div className="flex justify-center pb-8">
        {/* Placeholder to keep layout if needed, or just empty */}
      </div>
      
      {/* Controls Hint */}
      <div className="absolute bottom-4 right-4 text-xs text-gray-600">
        左键：旋转 • 右键：平移 • 滚轮：缩放
      </div>
    </div>
  );
};
