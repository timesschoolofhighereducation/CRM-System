'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Gamepad2, Zap, Brain, Calculator, Scissors, Timer, Play, TreePine } from 'lucide-react'
import { SnakeGame } from '@/components/games/snake-game'
import { MemoryGame } from '@/components/games/memory-game'
import { MathQuizGame } from '@/components/games/math-quiz'
import { WordScrambleGame } from '@/components/games/word-scramble'
import { ReactionGame } from '@/components/games/reaction-game'
import { SuperMarioRun } from '@/components/games/super-mario-run'
import { DinosaurGame } from '@/components/games/dinosaur-game'
import { cn } from '@/lib/utils'

type GameType = 'snake' | 'memory' | 'math-quiz' | 'word-scramble' | 'reaction' | 'super-mario' | 'dinosaur'

const games = [
  {
    id: 'snake' as GameType,
    name: 'Snake Game',
    description: 'Control the snake, eat food, and grow longer!',
    icon: Zap,
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100',
  },
  {
    id: 'memory' as GameType,
    name: 'Memory Cards',
    description: 'Match pairs of cards to test your memory!',
    icon: Brain,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 hover:bg-purple-100',
  },
  {
    id: 'math-quiz' as GameType,
    name: 'Math Quiz',
    description: 'Solve math problems quickly to improve your brain!',
    icon: Calculator,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
  },
  {
    id: 'word-scramble' as GameType,
    name: 'Word Scramble',
    description: 'Unscramble words to test your vocabulary!',
    icon: Scissors,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 hover:bg-orange-100',
  },
  {
    id: 'reaction' as GameType,
    name: 'Reaction Time',
    description: 'Test your reaction speed and reflexes!',
    icon: Timer,
    color: 'text-red-600',
    bgColor: 'bg-red-50 hover:bg-red-100',
  },
  {
    id: 'super-mario' as GameType,
    name: 'Super Mario Run',
    description: 'Jump over obstacles like Mario!',
    icon: Play,
    color: 'text-red-600',
    bgColor: 'bg-red-50 hover:bg-red-100',
  },
  {
    id: 'dinosaur' as GameType,
    name: 'Dinosaur Game',
    description: 'Jump over cacti in this endless runner!',
    icon: TreePine,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 hover:bg-yellow-100',
  },
]

export default function GamesPage() {
  const [currentGame, setCurrentGame] = useState<GameType | null>(null)

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar Menu */}
        <div className="w-64 border-r bg-gray-50 p-4 flex-shrink-0 overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Gamepad2 className="h-6 w-6" />
              Mini Games
            </h1>
            <p className="text-sm text-gray-600">Brain training games</p>
          </div>

          <div className="space-y-2">
            {games.map((game) => {
              const Icon = game.icon
              const isActive = currentGame === game.id
              return (
                <button
                  key={game.id}
                  onClick={() => setCurrentGame(game.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg transition-all flex items-center gap-3",
                    isActive
                      ? `${game.bgColor} ${game.color} border-2 border-current font-semibold`
                      : "bg-white hover:bg-gray-100 text-gray-700 border-2 border-transparent"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{game.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Game Content Area */}
        <div className="flex-1 overflow-y-auto">
          {currentGame === null ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Gamepad2 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h2 className="text-2xl font-bold text-gray-600 mb-2">Select a Game</h2>
                <p className="text-gray-500">Choose a game from the sidebar to start playing!</p>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <Card>
                <CardContent className="p-6">
                {currentGame === 'snake' && <SnakeGame />}
                {currentGame === 'memory' && <MemoryGame />}
                {currentGame === 'math-quiz' && <MathQuizGame />}
                {currentGame === 'word-scramble' && <WordScrambleGame />}
                {currentGame === 'reaction' && <ReactionGame />}
                {currentGame === 'super-mario' && <SuperMarioRun />}
                {currentGame === 'dinosaur' && <DinosaurGame />}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

