import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { CameraControls, Stars, Edges, Grid, shaderMaterial, Text } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';
import { ContributionDay } from '../../services/dataService';

// Define Colors
const CEMENT_GREY = new THREE.Color('#8E9299'); // Cement Grey for Roofs
const METAL_SILVER = new THREE.Color('#C0C0C0'); // Metal Silver for Commercial
const WINDOW_GOLD = new THREE.Color('#FFD700'); // Gold for Commercial Windows
const BLACK_COLOR = new THREE.Color('#111111'); // Black for Apartment
const CONCRETE_COLOR = new THREE.Color('#555555'); // Concrete for Unfinished
const SLEEK_BLACK = new THREE.Color('#1A1A1A'); // Sleek Black for Commercial Roofs
const FLOOR_COLOR = new THREE.Color('#1A2233'); // Darker navy for floor

const PARTNER_COMPANIES = [
  "Buyee", "bibian", "FROM JAPAN", "Neokyo", "doorzo", "ZenMarket", "JPGOODBUY", "楽一番", "日淘市集", "Sendico", "TOKUKAI", "RITAO CHAN", "越洋购", "docobuy", "Rakutao", "8mart", "Anybuy", "Mydoso", "DEJAPAN／BIDBUY", "Japan Rabbit", "Letao／funbid", "JChere", "GOODY-JAPAN", "janbox", "Remambo", "元気GO", "japantimemall", "Gobuy", "JADEX", "Myday", "worldbridge", "CDJapan", "Kaerumall", "heyco", "InJapan", "精灵集市／エルフ・モール", "madme", "Rkongjian", "J&Y SYSTEM", "徳源株式会社", "小卷毛日本转运", "テールタウン", "BEX", "盒馬", "CBS日本", "EIGI TRADING CO.株式会社", "DORA日本購", "LCT", "普渡", "DK", "JANTO", "SUMO", "北極星日淘", "太古株式会社", "Buy&Ship", "EIKOLINE", "J-Subculture", "Otsukai", "DANKA", "SAZO", "laojin", "一番市集", "株式会社COOLTRACK JAPAN"
];

// Orbiting Billboard Component (Ticker tape around the top)
const OrbitingBillboard: React.FC<{ name: string; height: number }> = ({ name, height }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.8;
    }
  });

  const segments = 8;
  return (
    <group position={[0, height / 2 - 0.3, 0]} ref={groupRef}>
      {/* 8 texts for smoother circular appearance */}
      {Array.from({ length: segments }).map((_, i) => {
        const angle = (i / segments) * Math.PI * 2;
        return (
          <Text
            key={i}
            position={[
              Math.cos(angle) * 0.42,
              0,
              Math.sin(angle) * 0.42
            ]}
            rotation={[0, -angle + Math.PI / 2, 0]}
            fontSize={0.07}
            color="#00FFCC"
            anchorX="center"
            anchorY="middle"
            maxWidth={0.3}
          >
            {name}
          </Text>
        );
      })}
      {/* Background ring */}
      <mesh>
        <cylinderGeometry args={[0.41, 0.41, 0.15, 32, 1, true]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

// Custom Shader Material for Building
const BuildingMaterial = shaderMaterial(
  {
    uColorBase: BLACK_COLOR,
    uColorWindow1: new THREE.Color('#88AAFF'), // Light Blue 1
    uColorWindow2: new THREE.Color('#AADDFF'), // Light Blue 2
    uColorRoof: CEMENT_GREY,
    uHeight: 1.0,
    uSeed: 0.0,
    uType: 0, // 0: Apartment, 1: Commercial, 2: Unfinished
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    varying vec3 vPos;
    void main() {
      vUv = uv;
      vPos = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform vec3 uColorBase;
    uniform vec3 uColorWindow1;
    uniform vec3 uColorWindow2;
    uniform vec3 uColorRoof;
    uniform float uHeight;
    uniform float uSeed;
    uniform int uType;
    varying vec2 vUv;
    varying vec3 vPos;

    // Pseudo-random function
    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    void main() {
      vec3 color = uColorBase;
      
      // Calculate geometric boundaries
      float halfHeight = uHeight / 2.0;
      
      // 1. ROOF (Top cap)
      if (vPos.y > halfHeight - 0.02) {
        gl_FragColor = vec4(uColorRoof, 1.0);
        return;
      }

      // 2. WINDOWS
      float cols = (uType == 1) ? 12.0 : 4.0; // More columns for cylinder
      float faceWidth = (uType == 1) ? 1.0 : 0.8; // Full circumference for cylinder
      float colWidth = faceWidth / cols;
      float targetRowHeight = colWidth * ((uType == 1) ? 1.5 : 1.0); 
      float rows = uHeight / targetRowHeight;
      
      vec2 gridUv = vec2(floor(vUv.x * cols), floor(vUv.y * rows));
      vec2 subUv = fract(vec2(vUv.x * cols, vUv.y * rows));
      
      float noise = random(gridUv + uSeed); 
      
      float padX = (uType == 1) ? 0.15 : 0.25;
      float padY = (uType == 1) ? 0.2 : 0.25;
      
      bool isTop = vPos.y > (uHeight/2.0) - 0.2; 
      
      if (!isTop && subUv.x > padX && subUv.x < 1.0 - padX && subUv.y > padY && subUv.y < 1.0 - padY) {
         // Window logic based on type
         if (uType == 0) { // Apartment
            if (noise > 0.4) {
               if (noise < 0.7) color = uColorWindow1; 
               else color = uColorWindow2; 
            }
         } else if (uType == 1) { // Commercial
            if (noise > 0.2) { 
               color = vec3(1.0, 1.0, 1.0); // White Windows
            }
         } else if (uType == 2) { // Unfinished
            // Very few windows or none
            if (noise > 0.95) {
               color = vec3(0.2, 0.2, 0.2); // Dark/Broken windows
            }
         }
      }

      gl_FragColor = vec4(color, 1.0);
    }
  `
);

extend({ BuildingMaterial });

// Add type definition for the custom material
declare global {
  namespace JSX {
    interface IntrinsicElements {
      buildingMaterial: any;
    }
  }
}

interface BuildingProps {
  day: ContributionDay;
  position: [number, number, number];
  type: number; // 0: Apartment, 1: Commercial, 2: Unfinished
  companyName?: string;
  isSelected: boolean;
  onHover: (day: ContributionDay | null) => void;
  onSelect: (day: ContributionDay) => void;
}

const Building: React.FC<BuildingProps> = ({ day, position, type, companyName, isSelected, onHover, onSelect }) => {
  const mesh = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);

  // Height based on count
  // 0 contributions = flat tile (0.1)
  // Commercial buildings (type 1) are taller
  const baseHeight = day.count === 0 ? 0.1 : Math.max(0.3, day.count * 0.2);
  const height = type === 1 ? baseHeight * 2.5 + 2.0 : baseHeight;
  
  // Position y needs to be half of height to sit on the plane
  const y = position[1] + height / 2;

  // Base color based on type
  const baseColor = type === 1 ? new THREE.Color('#FFD700') : (type === 2 ? CONCRETE_COLOR : BLACK_COLOR);
  const roofColor = type === 1 ? SLEEK_BLACK : CEMENT_GREY;

  return (
    <group position={[position[0], y, position[2]]}>
      <mesh
        ref={mesh}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(day);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
          onHover(day);
        }}
        onPointerOut={(e) => {
          setHover(false);
          onHover(null);
        }}
      >
        {type === 1 ? (
          <cylinderGeometry args={[0.4, 0.4, height, 32]} />
        ) : (
          <boxGeometry args={[0.8, height, 0.8]} />
        )}
        {/* @ts-ignore */}
        <buildingMaterial 
          uHeight={height} 
          uSeed={day.count + position[0] + position[2]} 
          uType={type}
          uColorBase={baseColor}
          uColorRoof={roofColor}
        />
        {/* Orbiting Billboard for Commercial buildings */}
        {type === 1 && companyName && (
          <OrbitingBillboard name={companyName} height={height} />
        )}
        
        {/* Selection Highlight */}
        {isSelected && (
          <Edges 
            scale={1.05}
            threshold={15} 
            color="#FFFFFF" 
            renderOrder={1000}
          />
        )}
      </mesh>
    </group>
  );
};

interface CitySceneProps {
  data: ContributionDay[];
  onHover: (day: ContributionDay | null) => void;
}

export const CityScene: React.FC<CitySceneProps> = ({ data, onHover }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const controlsRef = useRef<any>(null);

  // Handle ESC key to deselect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Assign types to buildings
  const { buildingTypes, companyAssignments } = useMemo(() => {
    const types = new Array(data.length).fill(0); // Default to Apartment
    const assignments: Record<number, string> = {};
    
    // Randomly assign 63 Commercial
    let commercialCount = 0;
    const shuffledIndices = Array.from({ length: data.length }, (_, i) => i).sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < shuffledIndices.length && commercialCount < 63; i++) {
      const idx = shuffledIndices[i];
      types[idx] = 1;
      assignments[idx] = PARTNER_COMPANIES[commercialCount];
      commercialCount++;
    }
    
    // Randomly assign 5 Unfinished
    let unfinishedCount = 0;
    for (let i = 0; i < shuffledIndices.length && unfinishedCount < 5; i++) {
      const idx = shuffledIndices[i];
      if (types[idx] === 0) {
        types[idx] = 2;
        unfinishedCount++;
      }
    }
    
    return { buildingTypes: types, companyAssignments: assignments };
  }, [data.length]);

  // Calculate target position for camera
  const selectedBuildingPos = useMemo(() => {
    if (!selectedId) return new THREE.Vector3(0, 0, 0);
    const index = data.findIndex(d => d.id === selectedId);
    if (index === -1) return new THREE.Vector3(0, 0, 0);

    const buildingsPerBlockRow = 4;
    const buildingsPerBlock = 16;
    const streetWidth = 0.4;
    const buildingSpacing = 1.0;
    const blocksPerRow = 5;

    const blockIndex = Math.floor(index / buildingsPerBlock);
    const indexInBlock = index % buildingsPerBlock;
    const rowInBlock = Math.floor(indexInBlock / buildingsPerBlockRow);
    const colInBlock = indexInBlock % buildingsPerBlockRow;
    const blockRow = Math.floor(blockIndex / blocksPerRow);
    const blockCol = blockIndex % blocksPerRow;

    const x = (blockCol * (4 * buildingSpacing + streetWidth)) + (colInBlock * buildingSpacing) - 20;
    const z = (blockRow * (4 * buildingSpacing + streetWidth)) + (rowInBlock * buildingSpacing) - 10;
    
    const day = data[index];
    const type = buildingTypes[index];
    const baseHeight = day.count === 0 ? 0.1 : Math.max(0.3, day.count * 0.2);
    const height = type === 1 ? baseHeight * 2.5 + 2.0 : baseHeight;
    
    // Focus on the roof (top of the building)
    return new THREE.Vector3(x, height, z);
  }, [selectedId, data, buildingTypes]);

  useEffect(() => {
    if (controlsRef.current) {
      if (selectedId) {
        const direction = new THREE.Vector3(1, 1, 1).normalize();
        const idealCameraPos = selectedBuildingPos.clone().add(direction.multiplyScalar(12));
        
        // Use CameraControls' built-in smooth transition (no jitter)
        controlsRef.current.setLookAt(
          idealCameraPos.x, idealCameraPos.y, idealCameraPos.z,
          selectedBuildingPos.x, selectedBuildingPos.y, selectedBuildingPos.z,
          true // transition
        );
      } else {
        // When deselected, we could return to home or just stop
        // For now, let's just let it be
      }
    }
  }, [selectedId, selectedBuildingPos]);

  // Grid layout
  // 4x4 blocks with streets
  // Each block contains 4x4 buildings? Or the whole city is divided into 4x4 blocks?
  // "The city layout should be a block with 4x4 buildings inside. Streets separate blocks."
  
  // Let's assume we group the linear list of days into blocks of 16 (4x4).
  // Block size: 4 buildings * 1 unit + padding = ~4 units
  // Street width: 1.5 units
  
  const buildingsPerBlockRow = 4;
  const buildingsPerBlockCol = 4;
  const buildingsPerBlock = buildingsPerBlockRow * buildingsPerBlockCol;
  
  // Street width reduced to match window spacing (approx 0.3 - 0.4)
  const streetWidth = 0.4;
  const buildingSpacing = 1.0;

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 20, 10]} intensity={1.5} />
      <spotLight position={[-10, 20, -10]} angle={0.3} penumbra={1} intensity={1} castShadow />
      
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      <group position={[-20, 0, -10]}> {/* Offset to center roughly */}
        {data.map((day, index) => {
          // Calculate block position
          const blockIndex = Math.floor(index / buildingsPerBlock);
          const indexInBlock = index % buildingsPerBlock;
          
          // Row/Col inside the block (0-3)
          const rowInBlock = Math.floor(indexInBlock / buildingsPerBlockRow);
          const colInBlock = indexInBlock % buildingsPerBlockRow;
          
          // How many blocks per row in the city grid?
          // Let's say we want a roughly square city.
          // Total days ~371. Total blocks ~23.
          // Sqrt(23) ~ 4.8. So 5 blocks wide.
          const blocksPerRow = 5;
          
          const blockRow = Math.floor(blockIndex / blocksPerRow);
          const blockCol = blockIndex % blocksPerRow;
          
          // Calculate final X, Z position
          // Block offset + Internal offset
          const x = (blockCol * (buildingsPerBlockRow * buildingSpacing + streetWidth)) + (colInBlock * buildingSpacing);
          const z = (blockRow * (buildingsPerBlockCol * buildingSpacing + streetWidth)) + (rowInBlock * buildingSpacing);
          
          return (
            <Building
              key={day.id}
              day={day}
              type={buildingTypes[index]}
              companyName={companyAssignments[index]}
              isSelected={selectedId === day.id}
              position={[x, 0, z]}
              onHover={onHover}
              onSelect={(d) => setSelectedId(d.id)}
            />
          );
        })}
      </group>

      {/* Ground Plane with Grid */}
      <group position={[0, -0.05, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color="#1A2233" roughness={0.9} metalness={0.1} />
        </mesh>
        <Grid 
          position={[0, 0.01, 0]} 
          args={[200, 200]} 
          cellSize={1} 
          cellThickness={0.5} 
          cellColor="#252F45" 
          sectionSize={5} 
          sectionThickness={1} 
          sectionColor="#2D3954" 
          fadeDistance={80} 
          fadeStrength={1} 
          infiniteGrid 
        />
      </group>
      
      <CameraControls
        ref={controlsRef}
        makeDefault
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2 - 0.1}
      />
    </>
  );
};
