'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'

const COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange']

export function ColorMemoryGame() {
  const [sequence, setSequence] = useState<string[]>([])
  const [userSequence, setUserSequence] = useState<string[]>([])
  const [level, setLevel] = useState(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isShowing, setIsShowing] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)

  const addToSequence = () => {
    const newColor = COLORS[Math.floor(Math.random() * COLORS.length)]
    setSequence(prev => [...prev, newColor])
  }

  const startGame = () => {
    setSequence([])
    setUserSequence([])
    setLevel(1)
    setScore(0)
    setGameOver(false)
    setIsPlaying(true)
    addToSequence()
  }

  const showSequence = async () => {
    setIsShowing(true)
    for (let i = 0; i < sequence.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 600))
      const colorElement = document.getElementById(`color-${i}`)
      if (colorElement) {
        colorElement.classList.add('opacity-100', 'scale-110')
        setTimeout(() => {
          colorElement.classList.remove('opacity-100', 'scale-110')
        }, 400)
      }
    }
    setIsShowing(false)
  }

  useEffect(() => {
    if (sequence.length > 0 && isPlaying && !isShowing) {
      showSequence()
    }
  }, [sequence.length, isPlaying])

  const handleColorClick = (color: string) => {
    if (isShowing || gameOver) return

    const newUserSequence = [...userSequence, color]
    setUserSequence(newUserSequence)

    const currentIndex = newUserSequence.length - 1
    if (newUserSequence[currentIndex] !== sequence[currentIndex]) {
      setGameOver(true)
      setIsPlaying(false)
      return
    }

    if (newUserSequence.length === sequence.length) {
      // Level complete!
      setScore(prev => prev + level * 10)
      setLevel(prev => prev + 1)
      setUserSequence([])
      setTimeout(() => {
        addToSequence()
      }, 1000)
    }
  }

  const getColorClass = (color: string) => {
    const baseClasses = 'w-24 h-24 rounded-lg transition-all duration-300 cursor-pointer opacity-50'
    const colorClasses = {
      red: 'bg-red-500 hover:bg-red-600',
      blue: 'bg-blue-500 hover:bg-blue-600',
      green: 'bg-green-500 hover:bg-green-600',
      yellow: 'bg-yellow-400 hover:bg-yellow-500',
      purple: 'bg-purple-500 hover:bg-purple-600',
      orange: 'bg-orange-500 hover:bg-orange-600',
    }
    return `${baseClasses} ${colorClasses[color as keyof typeof colorClasses]}`
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Color Memory</h2>
        <div className="flex justify-center gap-6 text-lg">
          <div>Level: <span className="font-bold">{level}</span></div>
          <div>Score: <span className="font-bold">{score}</span></div>
        </div>
        {gameOver && (
          <p className="text-red-600 font-bold text-xl mt-2">
            Game Over! You reached level {level - 1} with {score} points!
          </p>
        )}
        {isShowing && (
          <p className="text-blue-600 font-bold text-xl mt-2">Watch the sequence...</p>
        )}
      </div>

      {!isPlaying ? (
        <div className="text-center">
          <Button onClick={startGame} size="lg">
            Start Game
          </Button>
          <p className="text-sm text-gray-600 mt-4">
            Watch the color sequence and repeat it in order!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="grid grid-cols-3 gap-4">
              {COLORS.map((color, index) => (
                <div
                  key={color}
                  id={`color-${index}`}
                  className={getColorClass(color)}
                  onClick={() => handleColorClick(color)}
                />
              ))}
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              Your sequence: {userSequence.length} / {sequence.length}
            </p>
            <div className="flex justify-center gap-2 flex-wrap">
              {userSequence.map((color, index) => (
                <div
                  key={index}
                  className={`w-8 h-8 rounded ${getColorClass(color)} opacity-100`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {gameOver && (
        <div className="flex justify-center">
          <Button onClick={startGame} variant="outline" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Play Again
          </Button>
        </div>
      )}
    </div>
  )
}

