'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'

type Position = { x: number; y: number }
type Cactus = { x: number; y: number; width: number; height: number }

const GRAVITY = 0.9
const JUMP_STRENGTH = -18
const GAME_SPEED = 6
const GROUND_Y = 250
const DINO_SIZE = 50
const CACTUS_WIDTH = 25
const CACTUS_HEIGHT = 60

export function DinosaurGame() {
  const [dinoPos, setDinoPos] = useState<Position>({ x: 50, y: GROUND_Y })
  const [cacti, setCacti] = useState<Cactus[]>([])
  const [velocity, setVelocity] = useState(0)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [isJumping, setIsJumping] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameSpeed, setGameSpeed] = useState(GAME_SPEED)
  const gameLoopRef = useRef<number | null>(null)
  const cactusTimerRef = useRef<NodeJS.Timeout | null>(null)

  const checkCollision = (dino: Position, cactus: Cactus): boolean => {
    return (
      dino.x < cactus.x + cactus.width &&
      dino.x + DINO_SIZE > cactus.x &&
      dino.y < cactus.y + cactus.height &&
      dino.y + DINO_SIZE > cactus.y
    )
  }

  const jump = useCallback(() => {
    if (!isJumping && !gameOver && gameStarted) {
      setIsJumping(true)
      setVelocity(JUMP_STRENGTH)
    }
  }, [isJumping, gameOver, gameStarted])

  const startGame = () => {
    setDinoPos({ x: 50, y: GROUND_Y })
    setCacti([])
    setVelocity(0)
    setScore(0)
    setGameOver(false)
    setIsJumping(false)
    setGameStarted(true)
    setGameSpeed(GAME_SPEED)
  }

  useEffect(() => {
    if (!gameStarted || gameOver) return

    // Create cacti periodically (frequency increases with score)
    const interval = Math.max(1000, 2500 - Math.floor(score / 100) * 100)
    
    cactusTimerRef.current = setInterval(() => {
      setCacti(prev => [...prev, {
        x: 400,
        y: GROUND_Y,
        width: CACTUS_WIDTH,
        height: CACTUS_HEIGHT
      }])
    }, interval)

    return () => {
      if (cactusTimerRef.current) {
        clearInterval(cactusTimerRef.current)
      }
    }
  }, [gameStarted, gameOver, score])

  useEffect(() => {
    if (!gameStarted || gameOver) return

    // Increase game speed with score
    const newSpeed = GAME_SPEED + Math.floor(score / 200)
    setGameSpeed(newSpeed)

    const gameLoop = () => {
      setDinoPos(prev => {
        let newY = prev.y + velocity
        let newVelocity = velocity + GRAVITY

        // Ground collision
        if (newY >= GROUND_Y) {
          newY = GROUND_Y
          newVelocity = 0
          setIsJumping(false)
        }

        setVelocity(newVelocity)

        return { x: prev.x, y: newY }
      })

      // Move cacti
      setCacti(prev => {
        const updated = prev.map(cactus => ({
          ...cactus,
          x: cactus.x - gameSpeed
        })).filter(cactus => cactus.x > -CACTUS_WIDTH)

        // Check collisions
        const dino = { x: dinoPos.x, y: dinoPos.y }
        for (const cactus of updated) {
          if (checkCollision(dino, cactus)) {
            setGameOver(true)
            return updated
          }
        }

        // Increase score when cactus passes
        const passedCacti = prev.filter(cactus => 
          cactus.x < dinoPos.x && cactus.x + CACTUS_WIDTH >= dinoPos.x - gameSpeed
        )
        if (passedCacti.length > 0) {
          setScore(prev => prev + 10)
        }

        return updated
      })

      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }
  }, [gameStarted, gameOver, velocity, dinoPos, gameSpeed])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault()
        jump()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [jump])

  const resetGame = () => {
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current)
    }
    if (cactusTimerRef.current) {
      clearInterval(cactusTimerRef.current)
    }
    startGame()
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Dinosaur Game</h2>
        <div className="flex justify-center gap-6 text-lg">
          <div>Score: <span className="font-bold">{score}</span></div>
          <div>Speed: <span className="font-bold">{gameSpeed}</span></div>
          {gameOver && (
            <div className="text-red-600 font-bold">Game Over!</div>
          )}
        </div>
      </div>

      {!gameStarted ? (
        <div className="text-center">
          <Button onClick={startGame} size="lg">
            Start Game
          </Button>
          <p className="text-sm text-gray-600 mt-4">
            Press Space or Arrow Up to jump over cacti!
          </p>
        </div>
      ) : (
        <div className="flex justify-center">
          <div
            className="relative border-4 border-gray-800 bg-gradient-to-b from-yellow-100 to-yellow-300 rounded-lg overflow-hidden"
            style={{ width: 400, height: 300 }}
          >
            {/* Ground */}
            <div
              className="absolute bottom-0 w-full bg-yellow-600"
              style={{ height: 50 }}
            />

            {/* Dinosaur */}
            <div
              className="absolute bg-green-600 rounded-lg"
              style={{
                left: dinoPos.x,
                bottom: 300 - dinoPos.y - DINO_SIZE,
                width: DINO_SIZE,
                height: DINO_SIZE,
                transition: 'bottom 0.1s linear',
              }}
            >
              <div className="w-full h-full flex items-center justify-center text-white font-bold text-xs">
                🦕
              </div>
            </div>

            {/* Cacti */}
            {cacti.map((cactus, index) => (
              <div
                key={index}
                className="absolute bg-green-800"
                style={{
                  left: cactus.x,
                  bottom: 300 - cactus.y - cactus.height,
                  width: cactus.width,
                  height: cactus.height,
                  clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
                }}
              />
            ))}

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
      )}

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

