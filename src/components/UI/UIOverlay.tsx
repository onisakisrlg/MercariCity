import React from 'react';
import { ContributionDay } from '../../services/dataService';
import { X, ExternalLink, ThumbsUp, ThumbsDown, Building2, User } from 'lucide-react';

interface UIOverlayProps {
  hoveredDay: ContributionDay | null;
  selectedDay: ContributionDay | null;
  onCloseDetails: () => void;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({ hoveredDay, selectedDay, onCloseDetails }) => {
  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
      {/* Header */}
      <div className="p-8 flex justify-between items-start pointer-events-auto">
        <div>
          <h1 className="text-4xl md:text-5xl font-serif tracking-tight drop-shadow-2xl">
            <span className="text-white opacity-90">Mercari</span>
            <span className="text-[#EA352D] font-semibold italic ml-1">City</span>
          </h1>
          <p className="text-xs text-gray-500 font-sans tracking-[0.2em] uppercase mt-2 ml-1">
            Digital Marketplace Visualization
          </p>
        </div>
      </div>

      {/* Right Side Drawer */}
      {selectedDay && (
        <div className="absolute top-0 right-0 h-full w-full md:w-96 bg-[#0d1117]/90 backdrop-blur-xl border-l border-white/10 pointer-events-auto shadow-2xl transition-all duration-500 ease-out flex flex-col">
          <div className="p-6 flex justify-between items-center border-bottom border-white/5">
            <h2 className="text-xl font-serif font-semibold truncate pr-4">
              {selectedDay.name}
            </h2>
            <button 
              onClick={onCloseDetails}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Profile Header */}
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${selectedDay.isOfficial ? 'bg-[#FFD700]/20 text-[#FFD700]' : 'bg-white/10 text-white'}`}>
                {selectedDay.isOfficial ? <Building2 size={32} /> : <User size={32} />}
              </div>
              <div>
                <div className="text-sm text-gray-400 uppercase tracking-widest font-semibold">
                  {selectedDay.isOfficial ? 'Official Account' : 'Individual Seller'}
                </div>
                <div className="text-lg font-medium">
                  {selectedDay.isOfficial ? '认证合作伙伴' : '个人卖家'}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <div className="flex items-center text-emerald-400 mb-1">
                  <ThumbsUp size={14} className="mr-2" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Good</span>
                </div>
                <div className="text-2xl font-serif">{selectedDay.goodReviews.toLocaleString()}</div>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <div className="flex items-center text-rose-400 mb-1">
                  <ThumbsDown size={14} className="mr-2" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Bad</span>
                </div>
                <div className="text-2xl font-serif">{selectedDay.badReviews.toLocaleString()}</div>
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">About</h3>
              <p className="text-sm leading-relaxed text-gray-300">
                {selectedDay.bio}
              </p>
            </div>

            {/* Company Info */}
            {selectedDay.isOfficial && selectedDay.companyInfo && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Company Info</h3>
                <p className="text-sm leading-relaxed text-gray-300">
                  {selectedDay.companyInfo}
                </p>
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="p-6 border-t border-white/5 bg-white/2">
            <a 
              href={selectedDay.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 bg-[#EA352D] hover:bg-[#FF4D45] text-white rounded-2xl font-semibold flex items-center justify-center transition-all shadow-lg shadow-[#EA352D]/20 group"
            >
              <span>Jump to Mercari</span>
              <ExternalLink size={18} className="ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </a>
          </div>
        </div>
      )}

      {/* Hover Tooltip (Bottom) */}
      {hoveredDay && !selectedDay && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md border border-white/10 px-6 py-3 rounded-full flex items-center space-x-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <span className="font-medium">{hoveredDay.name}</span>
          <div className="h-4 w-px bg-white/20" />
          <div className="flex items-center text-emerald-400 text-sm">
            <ThumbsUp size={12} className="mr-1" />
            {hoveredDay.goodReviews}
          </div>
          {hoveredDay.badReviews > 0 && (
            <div className="flex items-center text-rose-400 text-sm">
              <ThumbsDown size={12} className="mr-1" />
              {hoveredDay.badReviews}
            </div>
          )}
        </div>
      )}
      
      {/* Controls Hint */}
      <div className="absolute bottom-4 right-4 text-[10px] text-gray-600 uppercase tracking-[0.2em]">
        Rotate: Left Click • Pan: Right Click • Zoom: Scroll
      </div>
    </div>
  );
};
