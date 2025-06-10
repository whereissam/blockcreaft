import { useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3, Raycaster, Vector2 } from 'three'
import { PlayerModel3D } from './PlayerModel3D'
import { type BlockType, type PlayerOutfit, PLAYER_OUTFITS } from '../types/game'

interface PlayerProps {
  selectedBlock: BlockType
  outfit?: PlayerOutfit
  cameraMode?: 'first-person' | 'third-person' | 'top-down'
}

export function Player({ selectedBlock, outfit = PLAYER_OUTFITS[0], cameraMode = 'third-person' }: PlayerProps) {
  const { camera, gl, scene } = useThree()
  const keys = useRef<{ [key: string]: boolean }>({})
  const raycaster = useRef(new Raycaster())
  const [isWalking, setIsWalking] = useState(false)
  const [isGrounded, setIsGrounded] = useState(true)
  const [playerPosition, setPlayerPosition] = useState<[number, number, number]>([0, 20, 0])
  const previousPosition = useRef(new Vector3())
  const velocity = useRef(new Vector3())
  const actualPlayerPosition = useRef(new Vector3(0, 20, 0)) // Track real player position separate from camera
  const previousCameraMode = useRef(cameraMode)
  
  const moveSpeed = 5
  const jumpForce = 10
  const gravity = -25
  
  // Initialize player position properly on mount
  useEffect(() => {
    // Safe spawn position - above the spawn platform
    const spawnGroundY = 10 // Base height from world generation
    const spawnY = spawnGroundY + 3 // 3 blocks above ground for safety
    
    actualPlayerPosition.current.set(0, spawnY, 0)
    
    // Set initial camera position based on mode
    if (cameraMode === 'first-person') {
      camera.position.set(0, spawnY, 0)
    } else if (cameraMode === 'third-person') {
      camera.position.set(0, spawnY + 3, 5)
      camera.lookAt(0, spawnY, 0)
    } else if (cameraMode === 'top-down') {
      camera.position.set(0, spawnY + 30, 0)
      camera.lookAt(0, spawnY, 0)
    }
    
    setPlayerPosition([0, spawnY - 1.8, 0])
  }, [cameraMode])
  
  // Simple terrain height calculation (matching MinecraftWorld generation)
  const getTerrainHeightAt = (x: number, z: number): number => {
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
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Allow controls in third-person and top-down modes without pointer lock
      const isPointerLocked = document.pointerLockElement === gl.domElement
      
      // Only require pointer lock for first-person mode
      if (cameraMode === 'first-person' && !isPointerLocked) {
        return
      }
      
      keys.current[event.code] = true
      
      // Handle number keys for block selection
      const num = parseInt(event.key)
      if (num >= 1 && num <= 9) {
        // Block selection handled by parent component
      }
    }
    
    const handleKeyUp = (event: KeyboardEvent) => {
      keys.current[event.code] = false
    }
    
    const handleMouseDown = (event: MouseEvent) => {
      const isPointerLocked = document.pointerLockElement === gl.domElement
      if (!isPointerLocked) return
      
      // Set raycaster from camera center
      raycaster.current.setFromCamera(new Vector2(0, 0), camera)
      
      // For now, we'll just log the interaction
      // In a full implementation, you'd check for intersections with blocks
      if (event.button === 0) {
        console.log('Remove block')
      } else if (event.button === 2) {
        console.log('Place block:', selectedBlock.name)
      }
    }
    
    const handleWheel = (event: WheelEvent) => {
      const isPointerLocked = document.pointerLockElement === gl.domElement
      if (!isPointerLocked) return
      event.preventDefault()
      // Block selection handled by parent component
    }
    
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('wheel', handleWheel, { passive: false })
    document.addEventListener('contextmenu', (e) => e.preventDefault())
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('wheel', handleWheel)
      document.removeEventListener('contextmenu', (e) => e.preventDefault())
    }
  }, [camera, gl, selectedBlock, cameraMode])
  
  // Simple ground detection based on world height
  const checkGroundCollision = (position: Vector3): number => {
    // Get terrain height at current position using noise function
    const terrainHeight = getTerrainHeightAt(position.x, position.z)
    return terrainHeight + 1.8 // Player height offset
  }

  useFrame((_, delta) => {
    // Allow movement in third-person and top-down modes without pointer lock
    const isPointerLocked = document.pointerLockElement === gl.domElement
    
    // Only require pointer lock for first-person mode
    if (cameraMode === 'first-person' && !isPointerLocked) {
      return
    }
    
    // Handle camera mode changes without losing player position
    if (previousCameraMode.current !== cameraMode) {
      // When switching camera modes, preserve the actual player position
      if (previousCameraMode.current === 'first-person') {
        // Coming from first person - camera position IS the player position
        actualPlayerPosition.current.copy(camera.position)
      }
      previousCameraMode.current = cameraMode
    }
    
    const actualMoveSpeed = moveSpeed
    
    // Calculate movement direction in world space (only horizontal)
    const forward = new Vector3()
    const right = new Vector3()
    
    camera.getWorldDirection(forward)
    forward.y = 0 // Keep movement horizontal
    forward.normalize()
    right.crossVectors(forward, camera.up).normalize()
    
    // Horizontal movement input
    const inputVector = new Vector3()
    
    if (keys.current['KeyW']) {
      inputVector.add(forward.clone().multiplyScalar(actualMoveSpeed))
    }
    if (keys.current['KeyS']) {
      inputVector.add(forward.clone().multiplyScalar(-actualMoveSpeed))
    }
    if (keys.current['KeyA']) {
      inputVector.add(right.clone().multiplyScalar(-actualMoveSpeed))
    }
    if (keys.current['KeyD']) {
      inputVector.add(right.clone().multiplyScalar(actualMoveSpeed))
    }
    
    
    // Apply horizontal velocity
    velocity.current.x = inputVector.x
    velocity.current.z = inputVector.z
    
    // Jumping
    if (keys.current['Space'] && isGrounded) {
      velocity.current.y = jumpForce
      setIsGrounded(false)
    }
    
    // Apply gravity
    if (!isGrounded) {
      velocity.current.y += gravity * delta
    }
    
    // Calculate new player position (not camera position)
    let newPlayerPosition: Vector3
    
    if (cameraMode === 'first-person') {
      // In first person, player position follows camera
      newPlayerPosition = camera.position.clone()
      newPlayerPosition.add(velocity.current.clone().multiplyScalar(delta))
    } else {
      // In third person modes, update actual player position
      newPlayerPosition = actualPlayerPosition.current.clone()
      newPlayerPosition.add(velocity.current.clone().multiplyScalar(delta))
    }
    
    // Ground collision detection
    const groundY = checkGroundCollision(newPlayerPosition)
    
    if (newPlayerPosition.y <= groundY) {
      newPlayerPosition.y = groundY
      velocity.current.y = 0
      setIsGrounded(true)
    }
    
    // Update actual player position
    actualPlayerPosition.current.copy(newPlayerPosition)
    
    // Update camera position based on mode
    switch (cameraMode) {
      case 'first-person':
        camera.position.copy(newPlayerPosition)
        setPlayerPosition([newPlayerPosition.x, newPlayerPosition.y - 1.8, newPlayerPosition.z]) // Hide model in first person
        break
        
      case 'third-person':
        // Player model at ground level
        setPlayerPosition([newPlayerPosition.x, newPlayerPosition.y - 1.8, newPlayerPosition.z])
        
        // Camera behind and above player with fixed offset
        const thirdPersonOffset = new Vector3(0, 3, 5)
        // Apply camera rotation to offset
        thirdPersonOffset.applyQuaternion(camera.quaternion)
        camera.position.copy(newPlayerPosition.clone().add(thirdPersonOffset))
        
        // Make camera look at player
        camera.lookAt(newPlayerPosition)
        break
        
      case 'top-down':
        // Player model at ground level
        setPlayerPosition([newPlayerPosition.x, newPlayerPosition.y - 1.8, newPlayerPosition.z])
        
        // Camera directly above player
        camera.position.set(newPlayerPosition.x, newPlayerPosition.y + 30, newPlayerPosition.z)
        camera.lookAt(newPlayerPosition)
        break
    }
    
    // Check if player is walking (based on actual player movement, not camera)
    const horizontalMovement = new Vector3(
      actualPlayerPosition.current.x - previousPosition.current.x,
      0,
      actualPlayerPosition.current.z - previousPosition.current.z
    )
    setIsWalking(horizontalMovement.length() > 0.01)
    previousPosition.current.copy(actualPlayerPosition.current)
  })
  
  return (
    <>
      {cameraMode !== 'first-person' && (
        <PlayerModel3D 
          outfit={outfit}
          position={playerPosition}
          rotation={[0, camera.rotation.y + Math.PI, 0]} // Face same direction as camera
          isWalking={isWalking}
          scale={0.8}
        />
      )}
    </>
  )
}