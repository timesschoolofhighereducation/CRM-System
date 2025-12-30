'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Gamepad2, X, Circle, Zap, Brain } from 'lucide-react'
import { TicTacToeGame } from '@/components/games/tic-tac-toe'
import { SnakeGame } from '@/components/games/snake-game'
import { MemoryGame } from '@/components/games/memory-game'

type GameType = 'menu' | 'tic-tac-toe' | 'snake' | 'memory'

export default function GamesPage() {
  const [currentGame, setCurrentGame] = useState<GameType>('menu')

  const games = [
    {
      id: 'tic-tac-toe' as GameType,
      name: 'Tic-Tac-Toe',
      description: 'Classic X and O game. Play against a friend!',
      icon: X,
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      id: 'snake' as GameType,
      name: 'Snake Game',
      description: 'Control the snake, eat food, and grow longer!',
      icon: Zap,
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      id: 'memory' as GameType,
      name: 'Memory Cards',
      description: 'Match pairs of cards to test your memory!',
      icon: Brain,
      color: 'bg-purple-500 hover:bg-purple-600',
    },
  ]

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {currentGame === 'menu' ? (
        <>
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Gamepad2 className="h-8 w-8" />
              Mini Games
            </h1>
            <p className="text-gray-600">Take a break and enjoy some fun games!</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {games.map((game) => {
              const Icon = game.icon
              return (
                <Card
                  key={game.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setCurrentGame(game.id)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">{game.name}</CardTitle>
                      <div className={`p-3 rounded-lg ${game.color} text-white`}>
                        <Icon className="h-6 w-6" />
                      </div>
                    </div>
                    <CardDescription>{game.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" onClick={() => setCurrentGame(game.id)}>
                      Play Now
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Gamepad2 className="h-8 w-8" />
              {games.find(g => g.id === currentGame)?.name}
            </h1>
            <Button variant="outline" onClick={() => setCurrentGame('menu')}>
              Back to Games
            </Button>
          </div>

          <Card>
            <CardContent className="p-6">
              {currentGame === 'tic-tac-toe' && <TicTacToeGame />}
              {currentGame === 'snake' && <SnakeGame />}
              {currentGame === 'memory' && <MemoryGame />}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

