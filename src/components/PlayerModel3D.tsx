import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh, Group } from 'three'
import { type PlayerOutfit } from '../types/game'

interface PlayerModel3DProps {
  outfit: PlayerOutfit
  position: [number, number, number]
  rotation?: [number, number, number]
  isWalking?: boolean
  scale?: number
}

export function PlayerModel3D({ 
  outfit, 
  position, 
  rotation = [0, 0, 0], 
  isWalking = false,
  scale = 1 
}: PlayerModel3DProps) {
  const groupRef = useRef<Group>(null)
  const headRef = useRef<Mesh>(null)
  const bodyRef = useRef<Mesh>(null)
  const armLeftRef = useRef<Mesh>(null)
  const armRightRef = useRef<Mesh>(null)
  const legLeftRef = useRef<Mesh>(null)
  const legRightRef = useRef<Mesh>(null)
  const [outfitChanged, setOutfitChanged] = useState(false)

  const colors = useMemo(() => outfit.colors, [outfit.colors])

  // Detect outfit changes and trigger glow effect
  useEffect(() => {
    setOutfitChanged(true)
    const timer = setTimeout(() => setOutfitChanged(false), 2000)
    return () => clearTimeout(timer)
  }, [outfit.id])

  useFrame((state) => {
    if (!groupRef.current) return

    // Breathing animation
    if (bodyRef.current) {
      bodyRef.current.scale.y = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.02
    }

    // Head bob when walking
    if (headRef.current && isWalking) {
      headRef.current.position.y = 1.8 + Math.sin(state.clock.elapsedTime * 8) * 0.05
    }

    // Walking animation
    if (isWalking) {
      const walkCycle = state.clock.elapsedTime * 6
      
      if (armLeftRef.current && armRightRef.current) {
        armLeftRef.current.rotation.x = Math.sin(walkCycle) * 0.5
        armRightRef.current.rotation.x = -Math.sin(walkCycle) * 0.5
      }
      
      if (legLeftRef.current && legRightRef.current) {
        legLeftRef.current.rotation.x = -Math.sin(walkCycle) * 0.3
        legRightRef.current.rotation.x = Math.sin(walkCycle) * 0.3
      }
    } else {
      // Idle animation - slight arm sway
      if (armLeftRef.current && armRightRef.current) {
        armLeftRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 1.5) * 0.1
        armRightRef.current.rotation.x = -Math.sin(state.clock.elapsedTime * 1.5) * 0.1
      }
    }

    // Special animations for rare outfits
    if (outfit.rarity === 'legendary' && groupRef.current) {
      // Slow rotation for legendary
      groupRef.current.rotation.y += 0.005
    }
  })

  return (
    <group 
      ref={groupRef} 
      position={position} 
      rotation={rotation}
      scale={[scale, scale, scale]}
    >
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
      <group position={[-0.8, 1.2, 0]}>
        <mesh ref={armLeftRef} position={[0, -0.3, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.4, 1.2, 0.4]} />
          <meshLambertMaterial color={colors.accent} />
        </mesh>
      </group>
      
      <group position={[0.8, 1.2, 0]}>
        <mesh ref={armRightRef} position={[0, -0.3, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.4, 1.2, 0.4]} />
          <meshLambertMaterial color={colors.accent} />
        </mesh>
      </group>
      
      {/* Legs */}
      <group position={[-0.3, 0, 0]}>
        <mesh ref={legLeftRef} position={[0, -0.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.4, 1.2, 0.4]} />
          <meshLambertMaterial color={colors.primary} />
        </mesh>
      </group>
      
      <group position={[0.3, 0, 0]}>
        <mesh ref={legRightRef} position={[0, -0.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.4, 1.2, 0.4]} />
          <meshLambertMaterial color={colors.primary} />
        </mesh>
      </group>
      
      {/* Special effects for different rarities */}
      {outfit.rarity === 'legendary' && (
        <group>
          {/* Crown */}
          <mesh position={[0, 2.5, 0]} castShadow>
            <cylinderGeometry args={[0.5, 0.4, 0.2, 8]} />
            <meshLambertMaterial color="#FFD700" />
          </mesh>
          {/* Crown gems */}
          <mesh position={[0, 2.7, 0]} castShadow>
            <sphereGeometry args={[0.1]} />
            <meshLambertMaterial color="#FF1493" />
          </mesh>
          {/* Sparkle particles */}
          {[...Array(8)].map((_, i) => (
            <mesh key={i} position={[
              Math.sin(i * Math.PI / 4) * 1.2,
              1.5 + Math.sin(i * 0.3) * 0.3,
              Math.cos(i * Math.PI / 4) * 1.2
            ]}>
              <sphereGeometry args={[0.03]} />
              <meshLambertMaterial 
                color="#FFD700" 
                emissive="#FFD700" 
                emissiveIntensity={0.5} 
              />
            </mesh>
          ))}
        </group>
      )}
      
      {outfit.rarity === 'epic' && (
        <group>
          {/* Cape */}
          <mesh position={[0, 1.2, -0.5]} castShadow>
            <planeGeometry args={[1.4, 1.8]} />
            <meshLambertMaterial color={colors.accent} transparent opacity={0.8} />
          </mesh>
          {/* Energy aura */}
          {[...Array(6)].map((_, i) => (
            <mesh key={i} position={[
              Math.sin(i * Math.PI / 3) * 1.0,
              1 + Math.sin(i * 0.5) * 0.2,
              Math.cos(i * Math.PI / 3) * 1.0
            ]}>
              <sphereGeometry args={[0.04]} />
              <meshLambertMaterial 
                color={colors.accent} 
                emissive={colors.accent} 
                emissiveIntensity={0.3} 
              />
            </mesh>
          ))}
        </group>
      )}
      
      {outfit.rarity === 'rare' && (
        <group>
          {/* Glowing outline effect */}
          {[...Array(4)].map((_, i) => (
            <mesh key={i} position={[
              Math.sin(i * Math.PI / 2) * 0.8,
              1 + Math.sin(i * 0.8) * 0.2,
              Math.cos(i * Math.PI / 2) * 0.8
            ]}>
              <sphereGeometry args={[0.02]} />
              <meshLambertMaterial 
                color={colors.secondary} 
                emissive={colors.secondary} 
                emissiveIntensity={0.2} 
              />
            </mesh>
          ))}
        </group>
      )}

      {/* Outfit change glow effect */}
      {outfitChanged && (
        <group>
          {[...Array(12)].map((_, i) => (
            <mesh key={i} position={[
              Math.sin(i * Math.PI / 6) * 1.5,
              1 + Math.sin(i * 0.5) * 0.5,
              Math.cos(i * Math.PI / 6) * 1.5
            ]}>
              <sphereGeometry args={[0.05]} />
              <meshLambertMaterial 
                color="#FFD700" 
                emissive="#FFD700" 
                emissiveIntensity={0.8} 
                transparent
                opacity={0.8}
              />
            </mesh>
          ))}
        </group>
      )}
    </group>
  )
}