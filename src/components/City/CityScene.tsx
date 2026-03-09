import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { CameraControls, Stars, Edges, Grid, shaderMaterial, Text } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';
import { ContributionDay } from '../../services/dataService';

// Define Colors
const CEMENT_GREY = new THREE.Color('#8E9299');
const METAL_SILVER = new THREE.Color('#C0C0C0');
const WINDOW_GOLD = new THREE.Color('#FFD700');
const BLACK_COLOR = new THREE.Color('#111111');
const CONCRETE_COLOR = new THREE.Color('#FF3333'); // Red for Unfinished
const SLEEK_BLACK = new THREE.Color('#1A1A1A');
const FLOOR_COLOR = new THREE.Color('#1A2233');

const PARTNER_COMPANIES = [
  "Buyee", "bibian", "FROM JAPAN", "Neokyo", "doorzo", "ZenMarket", "JPGOODBUY", "楽一番", "日淘市集", "Sendico", "TOKUKAI", "RITAO CHAN", "越洋购", "docobuy", "Rakutao", "8mart", "Anybuy", "Mydoso", "DEJAPAN／BIDBUY", "Japan Rabbit", "Letao／funbid", "JChere", "GOODY-JAPAN", "janbox", "Remambo", "元気GO", "japantimemall", "Gobuy", "JADEX", "Myday", "worldbridge", "CDJapan", "Kaerumall", "heyco", "InJapan", "精灵集市／エルフ・モール", "madme", "Rkongjian", "J&Y SYSTEM", "徳源株式会社", "小卷毛日本转运", "テールタウン", "BEX", "盒馬", "CBS日本", "EIGI TRADING CO.株式会社", "DORA日本購", "LCT", "普渡", "DK", "JANTO", "SUMO", "北極星日淘", "太古株式会社", "Buy&Ship", "EIKOLINE", "J-Subculture", "Otsukai", "DANKA", "SAZO", "laojin", "一番市集", "株式会社COOLTRACK JAPAN"
];

// Instanced Billboard is harder, so we keep them as individual components but only for commercial buildings
const OrbitingBillboard: React.FC<{ name: string; height: number; position: [number, number, number] }> = ({ name, height, position }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.8;
    }
  });

  const segments = 8;
  return (
    <group position={[position[0], position[1] + height - 0.3, position[2]]} ref={groupRef}>
      {Array.from({ length: segments }).map((_, i) => {
        const angle = (i / segments) * Math.PI * 2;
        return (
          <Text
            key={i}
            position={[Math.cos(angle) * 0.42, 0, Math.sin(angle) * 0.42]}
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
      <mesh>
        <cylinderGeometry args={[0.41, 0.41, 0.15, 32, 1, true]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

// Optimized Shader for InstancedMesh
const BuildingMaterial = shaderMaterial(
  {
    uColorWindow1: new THREE.Color('#3355ff'), // Blue
    uColorWindow2: new THREE.Color('#ffffff'), // White
  },
  `
    varying vec2 vUv;
    varying vec3 vPos;
    varying float vHeight;
    varying float vSeed;
    varying float vType;
    varying float vWindowColor;
    varying vec3 vBaseColor;
    varying vec3 vRoofColor;

    attribute float aHeight;
    attribute float aSeed;
    attribute float aType;
    attribute float aWindowColor;
    attribute vec3 aBaseColor;
    attribute vec3 aRoofColor;

    void main() {
      vUv = uv;
      vPos = position;
      vHeight = aHeight;
      vSeed = aSeed;
      vType = aType;
      vWindowColor = aWindowColor;
      vBaseColor = aBaseColor;
      vRoofColor = aRoofColor;

      // Scale the geometry based on height attribute
      vec3 scaledPos = position;
      scaledPos.y *= aHeight;
      
      gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(scaledPos, 1.0);
    }
  `,
  `
    uniform vec3 uColorWindow1;
    uniform vec3 uColorWindow2;
    varying vec2 vUv;
    varying vec3 vPos;
    varying float vHeight;
    varying float vSeed;
    varying float vType;
    varying float vWindowColor;
    varying vec3 vBaseColor;
    varying vec3 vRoofColor;

    float hash(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * 0.1031);
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
    }

    void main() {
      vec3 color = vBaseColor;
      float halfHeight = 0.5;
      
      if (vPos.y > halfHeight - 0.02) {
        gl_FragColor = vec4(vRoofColor, 1.0);
        return;
      }

      float cols = (vType == 1.0) ? 12.0 : 4.0;
      float faceWidth = (vType == 1.0) ? 1.0 : 0.8;
      float colWidth = faceWidth / cols;
      float targetRowHeight = colWidth * ((vType == 1.0) ? 1.5 : 1.0); 
      float rows = vHeight / targetRowHeight;
      
      vec2 gridUv = vec2(floor(vUv.x * cols), floor(vUv.y * rows));
      vec2 subUv = fract(vec2(vUv.x * cols, vUv.y * rows));
      
      // Use a more stable hash with smaller seed
      float noise = hash(gridUv + fract(vSeed * 0.001)); 
      
      float padX = (vType == 1.0) ? 0.15 : 0.25;
      float padY = (vType == 1.0) ? 0.2 : 0.25;
      
      bool isTop = vPos.y > 0.4; 
      
      if (!isTop && subUv.x > padX && subUv.x < 1.0 - padX && subUv.y > padY && subUv.y < 1.0 - padY) {
         if (vType == 0.0) {
            if (noise > 0.4) {
               color = (vWindowColor > 0.5) ? uColorWindow2 : uColorWindow1;
            }
         } else if (vType == 1.0) {
            if (noise > 0.2) color = vec3(1.0, 1.0, 1.0);
         } else if (vType == 2.0) {
            if (noise > 0.95) color = vec3(0.2, 0.2, 0.2);
         }
      }

      gl_FragColor = vec4(color, 1.0);
    }
  `
);

extend({ BuildingMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      buildingMaterial: any;
    }
  }
}

interface CitySceneProps {
  data: ContributionDay[];
  onHover: (day: ContributionDay | null) => void;
  selectedId: string | null;
  onSelectId: (id: string | null) => void;
}

export const CityScene: React.FC<CitySceneProps> = ({ data, onHover, selectedId, onSelectId }) => {
  const controlsRef = useRef<any>(null);
  const isInteractingRef = useRef(false);
  const boxMeshRef = useRef<THREE.InstancedMesh>(null);
  const cylMeshRef = useRef<THREE.InstancedMesh>(null);

  const { buildingData } = useMemo(() => {
    const buildingsPerBlockRow = 4;
    const buildingsPerBlockCol = 4;
    const buildingsPerBlock = buildingsPerBlockRow * buildingsPerBlockCol;
    const streetWidth = 0.4;
    const buildingSpacing = 1.0;
    const blocksPerRow = 13;

    const calculatedData = data.map((day, index) => {
      const blockIndex = Math.floor(index / buildingsPerBlock);
      const indexInBlock = index % buildingsPerBlock;
      const rowInBlock = Math.floor(indexInBlock / buildingsPerBlockRow);
      const colInBlock = indexInBlock % buildingsPerBlockRow;
      const blockRow = Math.floor(blockIndex / blocksPerRow);
      const blockCol = blockIndex % blocksPerRow;
      
      const x = (blockCol * (buildingsPerBlockRow * buildingSpacing + streetWidth)) + (colInBlock * buildingSpacing) - 30;
      const z = (blockRow * (buildingsPerBlockCol * buildingSpacing + streetWidth)) + (rowInBlock * buildingSpacing) - 30;
      
      // Type determination
      // 0: Apartment, 1: Commercial, 2: Unfinished
      let type = 0;
      if (day.isOfficial) {
        type = 1;
      } else if (day.badReviews > 50) {
        type = 2;
      }

      // Height calculation based on good reviews
      // Scale: 1000 good reviews = ~2 units height
      const baseHeight = day.goodReviews === 0 ? 0.1 : Math.max(0.3, day.goodReviews * 0.002);
      const height = type === 1 ? baseHeight + 2.0 : baseHeight;
      
      const baseColor = type === 1 ? new THREE.Color('#FFD700') : (type === 2 ? CONCRETE_COLOR : BLACK_COLOR);
      const roofColor = type === 1 ? SLEEK_BLACK : CEMENT_GREY;
      const windowColorValue = day.windowColor === 'white' ? 1.0 : 0.0;

      return { x, z, height, type, baseColor, roofColor, seed: day.goodReviews + x + z, id: day.id, name: day.name, windowColorValue };
    });

    return { buildingData: calculatedData };
  }, [data]);

  useEffect(() => {
    const boxIndices = buildingData.filter(b => b.type !== 1);
    const cylIndices = buildingData.filter(b => b.type === 1);

    const updateMesh = (mesh: THREE.InstancedMesh, items: typeof buildingData) => {
      const matrix = new THREE.Matrix4();
      const heights = new Float32Array(items.length);
      const seeds = new Float32Array(items.length);
      const types = new Float32Array(items.length);
      const windowColors = new Float32Array(items.length);
      const baseColors = new Float32Array(items.length * 3);
      const roofColors = new Float32Array(items.length * 3);

      items.forEach((b, i) => {
        matrix.setPosition(b.x, b.height / 2, b.z);
        mesh.setMatrixAt(i, matrix);
        heights[i] = b.height;
        seeds[i] = b.seed;
        types[i] = b.type;
        windowColors[i] = b.windowColorValue;
        baseColors[i * 3] = b.baseColor.r;
        baseColors[i * 3 + 1] = b.baseColor.g;
        baseColors[i * 3 + 2] = b.baseColor.b;
        roofColors[i * 3] = b.roofColor.r;
        roofColors[i * 3 + 1] = b.roofColor.g;
        roofColors[i * 3 + 2] = b.roofColor.b;
      });

      mesh.instanceMatrix.needsUpdate = true;
      mesh.geometry.setAttribute('aHeight', new THREE.InstancedBufferAttribute(heights, 1));
      mesh.geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1));
      mesh.geometry.setAttribute('aType', new THREE.InstancedBufferAttribute(types, 1));
      mesh.geometry.setAttribute('aWindowColor', new THREE.InstancedBufferAttribute(windowColors, 1));
      mesh.geometry.setAttribute('aBaseColor', new THREE.InstancedBufferAttribute(baseColors, 3));
      mesh.geometry.setAttribute('aRoofColor', new THREE.InstancedBufferAttribute(roofColors, 3));
    };

    if (boxMeshRef.current) updateMesh(boxMeshRef.current, boxIndices);
    if (cylMeshRef.current) updateMesh(cylMeshRef.current, cylIndices);
  }, [buildingData]);

  const selectedBuildingPos = useMemo(() => {
    const b = buildingData.find(d => d.id === selectedId);
    return b ? new THREE.Vector3(b.x, b.height, b.z) : new THREE.Vector3(0, 0, 0);
  }, [selectedId, buildingData]);

  useEffect(() => {
    if (controlsRef.current && selectedId) {
      const direction = new THREE.Vector3(1, 1, 1).normalize();
      const idealCameraPos = selectedBuildingPos.clone().add(direction.multiplyScalar(12));
      controlsRef.current.setLookAt(idealCameraPos.x, idealCameraPos.y, idealCameraPos.z, selectedBuildingPos.x, selectedBuildingPos.y, selectedBuildingPos.z, true);
    }
  }, [selectedId, selectedBuildingPos]);

  useFrame((_state, delta) => {
    if (controlsRef.current && !selectedId && !isInteractingRef.current) {
      controlsRef.current.azimuthAngle += 0.05 * delta;
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 20, 10]} intensity={1.5} />
      <spotLight position={[-10, 20, -10]} angle={0.3} penumbra={1} intensity={1} castShadow />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      <instancedMesh 
        ref={boxMeshRef} 
        args={[null as any, null as any, buildingData.filter(b => b.type !== 1).length]}
        onPointerDown={(e) => {
          e.stopPropagation();
          if (e.instanceId !== undefined) {
            const boxIndices = buildingData.filter(b => b.type !== 1);
            const item = boxIndices[e.instanceId];
            if (item) onSelectId(item.id);
          }
        }}
        onPointerOver={(e) => {
          if (e.instanceId !== undefined) {
            const boxIndices = buildingData.filter(b => b.type !== 1);
            const item = boxIndices[e.instanceId];
            if (item) onHover(data.find(d => d.id === item.id) || null);
          }
        }}
        onPointerOut={() => onHover(null)}
      >
        <boxGeometry args={[0.8, 1, 0.8]} />
        {/* @ts-ignore */}
        <buildingMaterial />
      </instancedMesh>

      <instancedMesh 
        ref={cylMeshRef} 
        args={[null as any, null as any, buildingData.filter(b => b.type === 1).length]}
        onPointerDown={(e) => {
          e.stopPropagation();
          if (e.instanceId !== undefined) {
            const cylIndices = buildingData.filter(b => b.type === 1);
            const item = cylIndices[e.instanceId];
            if (item) onSelectId(item.id);
          }
        }}
        onPointerOver={(e) => {
          if (e.instanceId !== undefined) {
            const cylIndices = buildingData.filter(b => b.type === 1);
            const item = cylIndices[e.instanceId];
            if (item) onHover(data.find(d => d.id === item.id) || null);
          }
        }}
        onPointerOut={() => onHover(null)}
      >
        <cylinderGeometry args={[0.4, 0.4, 1, 32]} />
        {/* @ts-ignore */}
        <buildingMaterial />
      </instancedMesh>

      {buildingData.filter(b => b.type === 1).map((b) => (
        <OrbitingBillboard 
          key={b.id} 
          name={b.name || "Official"} 
          height={b.height} 
          position={[b.x, 0, b.z]} 
        />
      ))}

      {selectedId && (
        <mesh position={[selectedBuildingPos.x, selectedBuildingPos.y / 2, selectedBuildingPos.z]}>
          {buildingData.find(b => b.id === selectedId)?.type === 1 ? 
            <cylinderGeometry args={[0.42, 0.42, selectedBuildingPos.y, 32]} /> : 
            <boxGeometry args={[0.82, selectedBuildingPos.y, 0.82]} />
          }
          <meshBasicMaterial color="white" wireframe />
        </mesh>
      )}

      <group position={[0, -0.05, 0]} onPointerDown={() => onSelectId(null)}>
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
        onStart={() => { isInteractingRef.current = true; }} 
        onEnd={() => { isInteractingRef.current = false; }} 
      />
    </>
  );
};
