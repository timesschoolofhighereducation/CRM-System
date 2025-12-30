'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'

type Position = { x: number; y: number }
type Obstacle = { x: number; y: number; width: number; height: number }

const GRAVITY = 0.8
const JUMP_STRENGTH = -15
const GAME_SPEED = 5
const GROUND_Y = 300
const MARIO_SIZE = 40
const OBSTACLE_WIDTH = 30
const OBSTACLE_HEIGHT = 50

export function SuperMarioRun() {
  const [marioPos, setMarioPos] = useState<Position>({ x: 50, y: GROUND_Y })
  const [obstacles, setObstacles] = useState<Obstacle[]>([])
  const [velocity, setVelocity] = useState(0)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [isJumping, setIsJumping] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const gameLoopRef = useRef<number | null>(null)
  const obstacleTimerRef = useRef<NodeJS.Timeout | null>(null)

  const checkCollision = (mario: Position, obstacle: Obstacle): boolean => {
    return (
      mario.x < obstacle.x + obstacle.width &&
      mario.x + MARIO_SIZE > obstacle.x &&
      mario.y < obstacle.y + obstacle.height &&
      mario.y + MARIO_SIZE > obstacle.y
    )
  }

  const jump = useCallback(() => {
    if (!isJumping && !gameOver && gameStarted) {
      setIsJumping(true)
      setVelocity(JUMP_STRENGTH)
    }
  }, [isJumping, gameOver, gameStarted])

  const startGame = () => {
    setMarioPos({ x: 50, y: GROUND_Y })
    setObstacles([])
    setVelocity(0)
    setScore(0)
    setGameOver(false)
    setIsJumping(false)
    setGameStarted(true)
  }

  useEffect(() => {
    if (!gameStarted || gameOver) return

    // Create obstacles periodically
    obstacleTimerRef.current = setInterval(() => {
      setObstacles(prev => [...prev, {
        x: 400,
        y: GROUND_Y,
        width: OBSTACLE_WIDTH,
        height: OBSTACLE_HEIGHT
      }])
    }, 2000)

    return () => {
      if (obstacleTimerRef.current) {
        clearInterval(obstacleTimerRef.current)
      }
    }
  }, [gameStarted, gameOver])

  useEffect(() => {
    if (!gameStarted || gameOver) return

    const gameLoop = () => {
      setMarioPos(prev => {
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

      // Move obstacles
      setObstacles(prev => {
        const updated = prev.map(obs => ({
          ...obs,
          x: obs.x - GAME_SPEED
        })).filter(obs => obs.x > -OBSTACLE_WIDTH)

        // Check collisions
        const mario = { x: marioPos.x, y: marioPos.y }
        for (const obs of updated) {
          if (checkCollision(mario, obs)) {
            setGameOver(true)
            return updated
          }
        }

        // Increase score when obstacle passes
        const passedObstacles = prev.filter(obs => obs.x < marioPos.x && obs.x + OBSTACLE_WIDTH >= marioPos.x - GAME_SPEED)
        if (passedObstacles.length > 0) {
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
  }, [gameStarted, gameOver, velocity, marioPos])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
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
    if (obstacleTimerRef.current) {
      clearInterval(obstacleTimerRef.current)
    }
    startGame()
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Super Mario Run</h2>
        <div className="flex justify-center gap-6 text-lg">
          <div>Score: <span className="font-bold">{score}</span></div>
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
            Press Space or click to jump over obstacles!
          </p>
        </div>
      ) : (
        <div className="flex justify-center">
          <div
            className="relative border-4 border-gray-800 bg-gradient-to-b from-blue-400 to-blue-600 rounded-lg overflow-hidden"
            style={{ width: 400, height: 350 }}
          >
            {/* Ground */}
            <div
              className="absolute bottom-0 w-full bg-green-600"
              style={{ height: 50 }}
            />

            {/* Mario */}
            <div
              className="absolute bg-red-600 rounded-lg"
              style={{
                left: marioPos.x,
                bottom: 350 - marioPos.y - MARIO_SIZE,
                width: MARIO_SIZE,
                height: MARIO_SIZE,
                transition: 'bottom 0.1s linear',
              }}
            >
              <div className="w-full h-full flex items-center justify-center text-white font-bold text-xs">
                M
              </div>
            </div>

            {/* Obstacles */}
            {obstacles.map((obs, index) => (
              <div
                key={index}
                className="absolute bg-gray-800 rounded-t-lg"
                style={{
                  left: obs.x,
                  bottom: 350 - obs.y - obs.height,
                  width: obs.width,
                  height: obs.height,
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
            Jump (Space)
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
        <p>Press Space or click Jump to avoid obstacles!</p>
      </div>
    </div>
  )
}

