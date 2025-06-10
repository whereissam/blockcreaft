import { useRef, useMemo, useState } from 'react'
import { Vector3, Color, InstancedMesh, Object3D, InstancedBufferAttribute, BoxGeometry, MeshLambertMaterial } from 'three'
import { useFrame } from '@react-three/fiber'
import { BLOCK_TYPES, CHUNK_SIZE, type BlockType } from '../types/game'
import type { LandChunk } from '../types/land'

interface MinecraftWorldProps {
  onBlockMined?: (blockType: BlockType) => void
  onLandSelect?: (chunk: LandChunk) => void
}

// Terrain generation with biomes
function generateMinecraftTerrain() {
  const blocks: Array<{
    position: [number, number, number]
    color: string
    blockType: BlockType
  }> = []

  const trees: Array<{ position: [number, number, number] }> = []
  const loadDistance = 3
  const SPAWN_SAFE_RADIUS = 3 // Safe area around spawn (0,0)

  for (let chunkX = -loadDistance; chunkX <= loadDistance; chunkX++) {
    for (let chunkZ = -loadDistance; chunkZ <= loadDistance; chunkZ++) {
      for (let x = 0; x < CHUNK_SIZE; x += 1) {
        for (let z = 0; z < CHUNK_SIZE; z += 1) {
          const worldX = chunkX * CHUNK_SIZE + x
          const worldZ = chunkZ * CHUNK_SIZE + z
          
          // Skip generating blocks in spawn safe area
          const distanceFromSpawn = Math.sqrt(worldX * worldX + worldZ * worldZ)
          if (distanceFromSpawn <= SPAWN_SAFE_RADIUS) {
            // Generate a stable spawn platform
            if (worldX >= -2 && worldX <= 2 && worldZ >= -2 && worldZ <= 2) {
              const baseHeight = 10
              
              // Create a multi-layer platform for stability
              for (let y = baseHeight - 2; y <= baseHeight; y++) {
                let blockType = BLOCK_TYPES[2] // Stone base
                if (y === baseHeight) {
                  blockType = BLOCK_TYPES[0] // Grass top
                }
                
                blocks.push({
                  position: [worldX, y, worldZ],
                  color: blockType.color,
                  blockType
                })
              }
            }
            continue
          }
          
          // Generate varied terrain with biomes for areas outside spawn
          const height = getTerrainHeight(worldX, worldZ)
          const biome = getBiome(worldX, worldZ)
          
          for (let y = 0; y <= height; y++) {
            let blockType: BlockType
            
            if (y === height) {
              // Surface blocks based on biome
              switch (biome) {
                case 'forest':
                  blockType = BLOCK_TYPES[0] // Grass
                  break
                case 'desert':
                  blockType = { id: 10, name: "Sand", color: "#F4A460", rarity: 'common', mintable: false, tradeable: false }
                  break
                case 'mountain':
                  blockType = BLOCK_TYPES[2] // Stone
                  break
                case 'water':
                  blockType = { id: 11, name: "Water", color: "#4169E1", rarity: 'common', mintable: false, tradeable: false }
                  break
                default:
                  blockType = BLOCK_TYPES[0] // Grass
              }
            } else if (y >= height - 3) {
              blockType = BLOCK_TYPES[1] // Dirt
            } else if (y <= 5) {
              // Underground ores
              const oreChance = Math.random()
              if (oreChance < 0.05 && y <= 3) {
                blockType = BLOCK_TYPES[4] // Diamond
              } else if (oreChance < 0.1) {
                blockType = BLOCK_TYPES[5] // Gold
              } else if (oreChance < 0.2) {
                blockType = BLOCK_TYPES[6] // Iron (Emerald block)
              } else {
                blockType = BLOCK_TYPES[2] // Stone
              }
            } else {
              blockType = BLOCK_TYPES[2] // Stone
            }
            
            blocks.push({
              position: [worldX, y, worldZ],
              color: blockType.color,
              blockType
            })
          }
          
          // Generate trees in forest biome (but not near spawn)
          if (biome === 'forest' && Math.random() < 0.1 && distanceFromSpawn > SPAWN_SAFE_RADIUS * 2) {
            trees.push({ position: [worldX, height + 1, worldZ] })
          }
        }
      }
    }
  }
  
  return { blocks, trees }
}

function getTerrainHeight(x: number, z: number): number {
  const baseFreq = 0.05
  const detailFreq = 0.2
  const baseAmplitude = 15
  const detailAmplitude = 3
  const baseHeight = 10
  
  // Multiple octaves of noise for realistic terrain
  const baseNoise = Math.sin(x * baseFreq) * Math.cos(z * baseFreq) * baseAmplitude
  const detailNoise = Math.sin(x * detailFreq) * Math.cos(z * detailFreq) * detailAmplitude
  const height = baseHeight + baseNoise + detailNoise
  
  return Math.max(1, Math.floor(height))
}

function getBiome(x: number, z: number): string {
  const biomeNoise = Math.sin(x * 0.01) + Math.cos(z * 0.01)
  
  if (biomeNoise < -0.5) return 'water'
  if (biomeNoise < 0) return 'desert'
  if (biomeNoise < 0.5) return 'forest'
  return 'mountain'
}

// Tree component
function Tree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Tree trunk */}
      <mesh position={[0, 2, 0]}>
        <boxGeometry args={[0.8, 4, 0.8]} />
        <meshLambertMaterial color="#8B4513" />
      </mesh>
      
      {/* Tree leaves */}
      <mesh position={[0, 5, 0]}>
        <boxGeometry args={[3, 3, 3]} />
        <meshLambertMaterial color="#228B22" />
      </mesh>
      <mesh position={[0, 7, 0]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshLambertMaterial color="#32CD32" />
      </mesh>
    </group>
  )
}

// Animal component with proper animations and models
function Animal({ position, type }: { position: [number, number, number], type: 'cow' | 'pig' | 'chicken' }) {
  const groupRef = useRef<Object3D>(null)
  const [basePosition] = useState(new Vector3(...position))
  const [wanderTarget, setWanderTarget] = useState(new Vector3(...position))
  
  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.elapsedTime
      
      // Update wander target occasionally
      if (Math.floor(time) % 5 === 0 && Math.floor(time * 10) % 10 === 0) {
        setWanderTarget(
          basePosition.clone().add(
            new Vector3(
              (Math.random() - 0.5) * 8,
              0,
              (Math.random() - 0.5) * 8
            )
          )
        )
      }
      
      // Move towards wander target
      const currentPos = groupRef.current.position
      const direction = wanderTarget.clone().sub(currentPos).normalize()
      const moveSpeed = 0.5
      
      if (wanderTarget.distanceTo(currentPos) > 0.5) {
        currentPos.add(direction.multiplyScalar(moveSpeed * 0.016))
        
        // Rotate to face movement direction
        if (direction.length() > 0.1) {
          groupRef.current.lookAt(currentPos.clone().add(direction))
        }
      }
      
      // Keep animals on ground
      currentPos.y = getTerrainHeightAtPosition(currentPos.x, currentPos.z) + 0.5
      
      // Simple bob animation
      groupRef.current.position.y += Math.sin(time * 4) * 0.05
    }
  })
  
  const getTerrainHeightAtPosition = (x: number, z: number): number => {
    const baseFreq = 0.05
    const detailFreq = 0.2
    const baseAmplitude = 15
    const detailAmplitude = 3
    const baseHeight = 10
    
    const baseNoise = Math.sin(x * baseFreq) * Math.cos(z * baseFreq) * baseAmplitude
    const detailNoise = Math.sin(x * detailFreq) * Math.cos(z * detailFreq) * detailAmplitude
    const height = baseHeight + baseNoise + detailNoise
    
    return Math.max(1, Math.floor(height))
  }
  
  const animalProps = {
    cow: { 
      body: { size: [1.4, 0.9, 0.7], color: "#FFFFFF" },
      head: { size: [0.8, 0.7, 0.6], color: "#FFFFFF", position: [0.9, 0.3, 0] },
      spots: true,
      ears: true
    },
    pig: { 
      body: { size: [1.2, 0.7, 0.8], color: "#FFB6C1" },
      head: { size: [0.7, 0.6, 0.7], color: "#FFB6C1", position: [0.8, 0.2, 0] },
      snout: true
    },
    chicken: { 
      body: { size: [0.8, 0.6, 0.5], color: "#FFFFFF" },
      head: { size: [0.4, 0.4, 0.4], color: "#FFFFFF", position: [0.5, 0.6, 0] },
      beak: true,
      tail: true
    }
  }
  
  const props = animalProps[type]
  
  return (
    <group ref={groupRef} position={position}>
      {/* Animal body */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={props.body.size as [number, number, number]} />
        <meshLambertMaterial color={props.body.color} />
      </mesh>
      
      {/* Animal head */}
      <mesh position={props.head.position}>
        <boxGeometry args={props.head.size as [number, number, number]} />
        <meshLambertMaterial color={props.head.color} />
      </mesh>
      
      {/* Type-specific features */}
      {type === 'cow' && (
        <>
          {/* Cow spots */}
          <mesh position={[0, 0.4, 0.2]}>
            <boxGeometry args={[0.3, 0.3, 0.1]} />
            <meshLambertMaterial color="#000000" />
          </mesh>
          {/* Cow ears */}
          <mesh position={[0.7, 0.5, -0.2]}>
            <boxGeometry args={[0.2, 0.1, 0.3]} />
            <meshLambertMaterial color="#FFFFFF" />
          </mesh>
          <mesh position={[0.7, 0.5, 0.2]}>
            <boxGeometry args={[0.2, 0.1, 0.3]} />
            <meshLambertMaterial color="#FFFFFF" />
          </mesh>
        </>
      )}
      
      {type === 'pig' && (
        <mesh position={[1.2, 0.2, 0]}>
          <boxGeometry args={[0.3, 0.2, 0.2]} />
          <meshLambertMaterial color="#FF69B4" />
        </mesh>
      )}
      
      {type === 'chicken' && (
        <>
          {/* Chicken beak */}
          <mesh position={[0.8, 0.6, 0]}>
            <boxGeometry args={[0.2, 0.1, 0.1]} />
            <meshLambertMaterial color="#FFA500" />
          </mesh>
          {/* Chicken tail */}
          <mesh position={[-0.3, 0.5, 0]}>
            <boxGeometry args={[0.2, 0.4, 0.3]} />
            <meshLambertMaterial color="#8B4513" />
          </mesh>
        </>
      )}
      
      {/* Legs */}
      {[-0.3, 0.3].map((x, i) => 
        [-0.15, 0.15].map((z, j) => (
          <mesh key={`leg-${i}-${j}`} position={[x, -0.1, z]}>
            <boxGeometry args={[0.15, 0.4, 0.15]} />
            <meshLambertMaterial color={type === 'chicken' ? "#FFA500" : props.body.color} />
          </mesh>
        ))
      )}
    </group>
  )
}

export function MinecraftWorld({ onBlockMined, onLandSelect }: MinecraftWorldProps) {
  const meshRef = useRef<InstancedMesh>(null)
  const initializedRef = useRef(false)
  
  const { blocks, trees } = useMemo(() => generateMinecraftTerrain(), [])
  
  // Generate some animals (away from spawn)
  const animals = useMemo(() => {
    const animalList: Array<{ position: [number, number, number], type: 'cow' | 'pig' | 'chicken' }> = []
    const SPAWN_SAFE_RADIUS = 3
    
    for (let i = 0; i < 10; i++) {
      let x, z
      do {
        x = (Math.random() - 0.5) * 100
        z = (Math.random() - 0.5) * 100
      } while (Math.sqrt(x * x + z * z) < SPAWN_SAFE_RADIUS * 3) // Keep animals away from spawn
      
      const y = getTerrainHeight(x, z) + 1
      const type = ['cow', 'pig', 'chicken'][Math.floor(Math.random() * 3)] as 'cow' | 'pig' | 'chicken'
      
      animalList.push({ position: [x, y, z], type })
    }
    
    return animalList
  }, [])

  const { positions, colors } = useMemo(() => {
    const positions: Vector3[] = []
    const colors: Color[] = []
    
    blocks.forEach(block => {
      positions.push(new Vector3(...block.position))
      colors.push(new Color(block.color))
    })
    
    return { positions, colors }
  }, [blocks])

  // Handle click interactions
  const handleClick = (event: any) => {
    // Only handle clicks when pointer is locked (in game mode)
    if (document.pointerLockElement === null) return
    
    event.stopPropagation()
    
    if (!meshRef.current) return
    
    // Get the intersection point
    const instanceId = event.instanceId
    if (instanceId !== undefined && instanceId < blocks.length) {
      const block = blocks[instanceId]
      
      if (event.button === 0) { // Left click - mine block
        console.log('Mining block:', block.blockType.name)
        if (onBlockMined) {
          onBlockMined(block.blockType)
        }
      } else if (event.button === 2) { // Right click - place block (future feature)
        console.log('Place block at:', block.position)
        // Could implement block placement here
      }
    }
  }

  // Initialize the mesh only once
  useFrame(() => {
    if (!meshRef.current || initializedRef.current) return
    
    const dummy = new Object3D()
    const colorArray = new Float32Array(positions.length * 3)
    
    positions.forEach((position, i) => {
      dummy.position.copy(position)
      dummy.updateMatrix()
      meshRef.current?.setMatrixAt(i, dummy.matrix)
      
      const color = colors[i]
      colorArray[i * 3] = color.r
      colorArray[i * 3 + 1] = color.g
      colorArray[i * 3 + 2] = color.b
    })
    
    if (meshRef.current) {
      meshRef.current.geometry.setAttribute(
        'color',
        new InstancedBufferAttribute(colorArray, 3)
      )
      meshRef.current.instanceMatrix.needsUpdate = true
      initializedRef.current = true
    }
  })

  return (
    <>
      {/* Terrain blocks */}
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, positions.length]}
        castShadow
        receiveShadow
        onClick={handleClick}
        onContextMenu={handleClick}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial vertexColors />
      </instancedMesh>
      
      {/* Trees */}
      {trees.map((tree, index) => (
        <Tree key={`tree-${index}`} position={tree.position} />
      ))}
      
      {/* Animals */}
      {animals.map((animal, index) => (
        <Animal key={`animal-${index}`} position={animal.position} type={animal.type} />
      ))}
      
      {/* Water bodies */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[200, 0.1, 200]} />
        <meshLambertMaterial color="#4169E1" transparent opacity={0.7} />
      </mesh>
    </>
  )
}