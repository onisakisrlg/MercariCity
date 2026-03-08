/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { CityScene } from './components/City/CityScene';
import { UIOverlay } from './components/UI/UIOverlay';
import { generateMockData, ContributionDay } from './services/dataService';

export default function App() {
  const [hoveredDay, setHoveredDay] = useState<ContributionDay | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Generate data once on mount
  const data = useMemo(() => generateMockData(), []);

  const selectedDay = useMemo(() => 
    data.days.find(d => d.id === selectedId) || null
  , [selectedId, data.days]);

  return (
    <div className="w-full h-screen bg-[#0d1117] relative">
      <UIOverlay 
        hoveredDay={hoveredDay} 
        selectedDay={selectedDay}
        onCloseDetails={() => setSelectedId(null)}
      />
      
      <Canvas
        camera={{ position: [40, 40, 40], fov: 45 }}
        shadows
        dpr={[1, 2]}
      >
        <color attach="background" args={['#0d1117']} />
        <Suspense fallback={null}>
          <CityScene 
            data={data.days} 
            onHover={setHoveredDay} 
            selectedId={selectedId}
            onSelectId={setSelectedId}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
