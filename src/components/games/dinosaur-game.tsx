'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'

type Cactus = { x: number; width: number; height: number }

const GRAVITY = 0.8
const JUMP_STRENGTH = -15
const INITIAL_SPEED = 5
const GROUND_Y = 200
const DINO_X = 50
const DINO_SIZE = 40
const CACTUS_WIDTH = 20
const CACTUS_HEIGHT = 50
const GAME_WIDTH = 600
const GAME_HEIGHT = 250

export function DinosaurGame() {
  const [dinoY, setDinoY] = useState(GROUND_Y)
  const [cacti, setCacti] = useState<Cactus[]>([])
  const [velocity, setVelocity] = useState(0)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [isJumping, setIsJumping] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameSpeed, setGameSpeed] = useState(INITIAL_SPEED)
  const [groundOffset, setGroundOffset] = useState(0)
  const gameLoopRef = useRef<number | null>(null)
  const cactusTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastCactusTimeRef = useRef<number>(0)

  const checkCollision = (dinoY: number, cactus: Cactus): boolean => {
    const dinoBottom = GAME_HEIGHT - dinoY
    const dinoTop = dinoBottom - DINO_SIZE
    const cactusBottom = GROUND_Y
    const cactusTop = cactusBottom - cactus.height

    return (
      DINO_X < cactus.x + cactus.width &&
      DINO_X + DINO_SIZE > cactus.x &&
      dinoTop < cactusBottom &&
      dinoBottom > cactusTop
    )
  }

  const jump = useCallback(() => {
    if (!isJumping && !gameOver && gameStarted && dinoY >= GROUND_Y) {
      setIsJumping(true)
      setVelocity(JUMP_STRENGTH)
    }
  }, [isJumping, gameOver, gameStarted, dinoY])

  const startGame = () => {
    setDinoY(GROUND_Y)
    setCacti([])
    setVelocity(0)
    setScore(0)
    setGameOver(false)
    setIsJumping(false)
    setGameStarted(true)
    setGameSpeed(INITIAL_SPEED)
    setGroundOffset(0)
    lastCactusTimeRef.current = Date.now()
  }

  useEffect(() => {
    if (!gameStarted || gameOver) return

    const createCactus = () => {
      const now = Date.now()
      // Random interval between 1.5-3 seconds, decreases with score
      const baseInterval = 2500 - Math.floor(score / 50) * 50
      const interval = Math.max(1500, baseInterval)
      
      if (now - lastCactusTimeRef.current >= interval) {
        lastCactusTimeRef.current = now
        setCacti(prev => [...prev, {
          x: GAME_WIDTH,
          width: CACTUS_WIDTH,
          height: CACTUS_HEIGHT
        }])
      }
    }

    const interval = setInterval(createCactus, 100)
    cactusTimerRef.current = interval as any

    return () => {
      clearInterval(interval)
    }
  }, [gameStarted, gameOver, score])

  useEffect(() => {
    if (!gameStarted || gameOver) return

    // Increase game speed gradually
    const newSpeed = INITIAL_SPEED + Math.floor(score / 100) * 0.5
    setGameSpeed(newSpeed)

    const gameLoop = () => {
      // Update dinosaur position
      setDinoY(prev => {
        let newY = prev + velocity
        let newVelocity = velocity + GRAVITY

        // Ground collision
        if (newY >= GROUND_Y) {
          newY = GROUND_Y
          newVelocity = 0
          setIsJumping(false)
        }

        setVelocity(newVelocity)
        return newY
      })

      // Move cacti and check collisions
      setCacti(prev => {
        const updated = prev.map(cactus => ({
          ...cactus,
          x: cactus.x - gameSpeed
        })).filter(cactus => cactus.x > -CACTUS_WIDTH)

        // Check collisions
        for (const cactus of updated) {
          if (checkCollision(dinoY, cactus)) {
            setGameOver(true)
            return updated
          }
        }

        // Increase score when cactus passes
        const passedCacti = prev.filter(cactus => 
          cactus.x < DINO_X && cactus.x + CACTUS_WIDTH >= DINO_X - gameSpeed
        )
        if (passedCacti.length > 0) {
          setScore(prev => prev + 1)
        }

        return updated
      })

      // Animate ground
      setGroundOffset(prev => (prev - gameSpeed) % 20)

      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }
  }, [gameStarted, gameOver, velocity, dinoY, gameSpeed])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.code === 'Space' || e.key === ' ' || e.key === 'ArrowUp') && !gameOver) {
        e.preventDefault()
        if (!gameStarted) {
          startGame()
        } else {
          jump()
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [jump, gameStarted, gameOver])

  const resetGame = () => {
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current)
    }
    if (cactusTimerRef.current) {
      clearInterval(cactusTimerRef.current)
    }
    startGame()
  }

  const dinoBottom = GAME_HEIGHT - dinoY
  const dinoTop = dinoBottom - DINO_SIZE

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Dinosaur Game</h2>
        <div className="flex justify-center gap-6 text-lg">
          <div>Score: <span className="font-bold">{score}</span></div>
          {gameOver && (
            <div className="text-red-600 font-bold">Game Over!</div>
          )}
        </div>
      </div>

      <div className="flex justify-center">
        <div
          className="relative border-2 border-gray-300 bg-white rounded-lg overflow-hidden"
          style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
        >
          {/* Sky/Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-100 to-white" />

          {/* Ground line (animated) */}
          <div
            className="absolute bottom-0 w-full border-t-2 border-gray-400"
            style={{
              bottom: GROUND_Y,
              backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 19px, #666 19px, #666 20px)',
              backgroundPositionX: `${groundOffset}px`,
              height: '2px',
            }}
          />

          {/* Dinosaur (stationary on left, only moves up/down) */}
          {gameStarted && (
            <div
              className="absolute bg-gray-800"
              style={{
                left: DINO_X,
                bottom: dinoTop,
                width: DINO_SIZE,
                height: DINO_SIZE,
              }}
            >
              {/* Simple dinosaur shape */}
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-2xl">🦖</div>
              </div>
            </div>
          )}

          {/* Cacti */}
          {cacti.map((cactus, index) => {
            const cactusBottom = GROUND_Y
            const cactusTop = cactusBottom - cactus.height
            return (
              <div
                key={index}
                className="absolute bg-green-700"
                style={{
                  left: cactus.x,
                  bottom: cactusTop,
                  width: cactus.width,
                  height: cactus.height,
                }}
              >
                {/* Simple cactus shape with branches */}
                <div className="w-full h-full relative">
                  <div className="absolute inset-0 bg-green-700" />
                  <div className="absolute -left-2 top-1/3 w-2 h-4 bg-green-700" />
                  <div className="absolute -right-2 top-1/2 w-2 h-4 bg-green-700" />
                </div>
              </div>
            )
          })}

          {/* Start message */}
          {!gameStarted && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90">
              <div className="text-center">
                <p className="text-lg font-semibold mb-2">Press Space to start</p>
                <p className="text-sm text-gray-600">Jump over the cacti!</p>
              </div>
            </div>
          )}

          {/* Game Over Overlay */}
          {gameOver && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white rounded-lg p-6 text-center">
                <h3 className="text-2xl font-bold mb-2">Game Over!</h3>
                <p className="text-lg mb-4">Final Score: {score}</p>
                <Button onClick={resetGame}>Play Again</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {gameStarted && !gameOver && (
        <div className="flex justify-center">
          <Button onClick={jump} size="lg" className="gap-2">
            Jump (Space/↑)
          </Button>
        </div>
      )}

      {gameOver && (
        <div className="flex justify-center">
          <Button onClick={resetGame} variant="outline" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Play Again
          </Button>
        </div>
      )}

      <div className="text-center text-sm text-gray-600">
        <p>Press Space or Arrow Up to jump! Game speed increases with score.</p>
      </div>
    </div>
  )
}


