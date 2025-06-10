import { useRef, useMemo } from 'react'
import { Vector3, Color, InstancedMesh, Object3D, InstancedBufferAttribute, Raycaster, Vector2 } from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { BLOCK_TYPES, CHUNK_SIZE, type BlockType } from '../types/game'
import type { LandChunk } from '../types/land'

function generateTerrain() {
  const blocks: Array<{
    position: [number, number, number]
    color: string
  }> = []

  const loadDistance = 2 // Reduced from 3 to 2 for better performance
  
  for (let chunkX = -loadDistance; chunkX <= loadDistance; chunkX++) {
    for (let chunkZ = -loadDistance; chunkZ <= loadDistance; chunkZ++) {
      for (let x = 0; x < CHUNK_SIZE; x += 1) { // Keep every block
        for (let z = 0; z < CHUNK_SIZE; z += 1) {
          const worldX = chunkX * CHUNK_SIZE + x
          const worldZ = chunkZ * CHUNK_SIZE + z
          
          const height = Math.min(getHeight(worldX, worldZ), 20) // Limit height
          
          for (let y = 0; y <= height; y++) {
            let blockType
            if (y === height) {
              blockType = BLOCK_TYPES[0] // Grass
            } else if (y >= height - 2) { // Reduced dirt layer
              blockType = BLOCK_TYPES[1] // Dirt
            } else {
              blockType = BLOCK_TYPES[2] // Stone
            }
            
            blocks.push({
              position: [worldX, y, worldZ],
              color: blockType.color
            })
          }
        }
      }
    }
  }
  
  return blocks
}

function getHeight(x: number, z: number): number {
  const amplitude = 10
  const frequency = 0.1
  const baseHeight = 15
  
  const noise = Math.sin(x * frequency) * Math.cos(z * frequency) * amplitude
  return Math.floor(baseHeight + noise)
}

interface VoxelWorldProps {
  onBlockMined?: (blockType: BlockType) => void
  onLandSelect?: (chunk: LandChunk) => void
}

export function VoxelWorld({ onBlockMined, onLandSelect }: VoxelWorldProps) {
  const meshRef = useRef<InstancedMesh>(null)
  const initializedRef = useRef(false)
  const { scene, camera, gl } = useThree()
  
  const blocks = useMemo(() => generateTerrain(), [])
  
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
    event.stopPropagation()
    
    if (!meshRef.current) return
    
    const raycaster = new Raycaster()
    const mouse = new Vector2()
    
    // Convert click to normalized device coordinates
    mouse.x = (event.clientX / gl.domElement.clientWidth) * 2 - 1
    mouse.y = -(event.clientY / gl.domElement.clientHeight) * 2 + 1
    
    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObject(meshRef.current)
    
    if (intersects.length > 0) {
      const intersection = intersects[0]
      const instanceId = intersection.instanceId
      
      if (instanceId !== undefined && instanceId < blocks.length) {
        const clickedBlock = blocks[instanceId]
        const [x, y, z] = clickedBlock.position
        
        // Determine block type based on position and height
        const height = getHeight(x, z)
        let blockType: BlockType
        
        if (y === height) {
          blockType = BLOCK_TYPES[0] // Grass
        } else if (y >= height - 2) {
          blockType = BLOCK_TYPES[1] // Dirt  
        } else {
          blockType = BLOCK_TYPES[2] // Stone
        }
        
        // Check if this is a right-click (context menu) for land selection
        if (event.button === 2 && onLandSelect) {
          // Convert world coordinates to chunk coordinates
          const chunkX = Math.floor(x / CHUNK_SIZE)
          const chunkZ = Math.floor(z / CHUNK_SIZE)
          const chunkId = chunkX * 1000 + chunkZ // Simple ID scheme
          
          const landChunk: LandChunk = {
            id: chunkId,
            x: chunkX,
            z: chunkZ,
            isForSale: true,
            salePrice: 0.001, // 0.001 ETH
            resources: ['wood', 'stone', 'iron'],
            owner: undefined,
            renter: undefined,
            rentPrice: 0.0001,
            rentDuration: 7,
            rentExpires: undefined
          }
          
          onLandSelect(landChunk)
        } else if (event.button === 0 && onBlockMined) {
          // Left click for mining
          onBlockMined(blockType)
        }
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
  )
}