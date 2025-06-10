import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Mesh } from 'three'
import { type PlayerOutfit } from '../types/game'

interface PlayerAvatar3DProps {
  outfit: PlayerOutfit
  isSelected?: boolean
  size?: 'small' | 'medium' | 'large'
}

function AvatarModel({ outfit, isSelected }: { outfit: PlayerOutfit; isSelected?: boolean }) {
  const meshRef = useRef<Mesh>(null)
  const headRef = useRef<Mesh>(null)
  const bodyRef = useRef<Mesh>(null)
  const armLeftRef = useRef<Mesh>(null)
  const armRightRef = useRef<Mesh>(null)
  const legLeftRef = useRef<Mesh>(null)
  const legRightRef = useRef<Mesh>(null)

  const colors = useMemo(() => outfit.colors, [outfit.colors])

  useFrame((state) => {
    if (isSelected && meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5
    }
    
    // Subtle breathing animation
    if (bodyRef.current) {
      bodyRef.current.scale.y = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.02
    }
    
    // Arm swing animation when selected
    if (isSelected) {
      if (armLeftRef.current) {
        armLeftRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 3) * 0.2
      }
      if (armRightRef.current) {
        armRightRef.current.rotation.x = -Math.sin(state.clock.elapsedTime * 3) * 0.2
      }
    }
  })

  return (
    <group ref={meshRef} position={[0, -1, 0]}>
      {/* Head */}
      <mesh ref={headRef} position={[0, 1.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshLambertMaterial color={colors.primary} />
      </mesh>
      
      {/* Body */}
      <mesh ref={bodyRef} position={[0, 0.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 1.6, 0.8]} />
        <meshLambertMaterial color={colors.secondary} />
      </mesh>
      
      {/* Arms */}
      <mesh ref={armLeftRef} position={[-0.8, 1.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 1.2, 0.4]} />
        <meshLambertMaterial color={colors.accent} />
      </mesh>
      <mesh ref={armRightRef} position={[0.8, 1.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 1.2, 0.4]} />
        <meshLambertMaterial color={colors.accent} />
      </mesh>
      
      {/* Legs */}
      <mesh ref={legLeftRef} position={[-0.3, -0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 1.2, 0.4]} />
        <meshLambertMaterial color={colors.primary} />
      </mesh>
      <mesh ref={legRightRef} position={[0.3, -0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 1.2, 0.4]} />
        <meshLambertMaterial color={colors.primary} />
      </mesh>
      
      {/* Special effects for rare outfits */}
      {outfit.rarity === 'legendary' && (
        <group>
          {/* Crown for legendary */}
          <mesh position={[0, 2.5, 0]} castShadow>
            <cylinderGeometry args={[0.5, 0.4, 0.2, 8]} />
            <meshLambertMaterial color="#FFD700" />
          </mesh>
          {/* Crown gems */}
          <mesh position={[0, 2.7, 0]} castShadow>
            <sphereGeometry args={[0.1]} />
            <meshLambertMaterial color="#FF1493" />
          </mesh>
        </group>
      )}
      
      {outfit.rarity === 'epic' && (
        <group>
          {/* Cape for epic */}
          <mesh position={[0, 1.2, -0.5]} castShadow>
            <planeGeometry args={[1.4, 1.8]} />
            <meshLambertMaterial color={colors.accent} transparent opacity={0.8} />
          </mesh>
        </group>
      )}
      
      {outfit.rarity === 'rare' && (
        <group>
          {/* Glowing effect particles */}
          {[...Array(6)].map((_, i) => (
            <mesh key={i} position={[
              Math.sin(i * Math.PI / 3) * 1.5,
              1 + Math.sin(i * 0.5) * 0.5,
              Math.cos(i * Math.PI / 3) * 1.5
            ]}>
              <sphereGeometry args={[0.05]} />
              <meshLambertMaterial color={colors.accent} emissive={colors.accent} emissiveIntensity={0.3} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  )
}

export function PlayerAvatar3D({ outfit, isSelected = false, size = 'medium' }: PlayerAvatar3DProps) {
  const canvasSize = {
    small: { width: 120, height: 120 },
    medium: { width: 160, height: 160 },
    large: { width: 200, height: 200 }
  }[size]

  return (
    <div style={{ width: canvasSize.width, height: canvasSize.height }} className="rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
      <Canvas
        camera={{ 
          position: [3, 2, 3], 
          fov: 50,
          near: 0.1,
          far: 100
        }}
        shadows
        gl={{ 
          antialias: true,
          alpha: true
        }}
        style={{ background: `linear-gradient(135deg, ${outfit.colors.primary}20, ${outfit.colors.secondary}20)` }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={0.8}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[-5, 5, 5]} intensity={0.3} color={outfit.colors.accent} />
        
        <AvatarModel outfit={outfit} isSelected={isSelected} />
        
        {/* Ground plane */}
        <mesh position={[0, -2, 0]} receiveShadow>
          <planeGeometry args={[10, 10]} />
          <meshLambertMaterial color="#666666" transparent opacity={0.3} />
        </mesh>
      </Canvas>
    </div>
  )
}