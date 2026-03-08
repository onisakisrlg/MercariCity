/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { CityScene } from './components/City/CityScene';
import { UIOverlay } from './components/UI/UIOverlay';
import { generateMockData, ContributionDay } from './services/dataService';

export default function App() {
  const [hoveredDay, setHoveredDay] = useState<ContributionDay | null>(null);
  
  // Generate data once on mount
  const data = useMemo(() => generateMockData(), []);

  return (
    <div className="w-full h-screen bg-[#0d1117] relative">
      <UIOverlay 
        hoveredDay={hoveredDay} 
        totalContributions={data.total} 
        username="abhijit-jha" // Hardcoded for now as per request context, or "Guest"
      />
      
      <Canvas
        camera={{ position: [20, 20, 20], fov: 45 }}
        shadows
        dpr={[1, 2]} // Handle high DPI screens
      >
        <CityScene 
          data={data.days} 
          onHover={setHoveredDay} 
        />
      </Canvas>
    </div>
  );
}
