'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Circle, RotateCcw } from 'lucide-react'

type Player = 'X' | 'O' | null
type Board = Player[]

export function TicTacToeGame() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null))
  const [isXNext, setIsXNext] = useState(true)
  const [scores, setScores] = useState({ X: 0, O: 0 })

  const calculateWinner = (squares: Board): Player => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6], // diagonals
    ]

    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a]
      }
    }
    return null
  }

  const handleClick = (index: number) => {
    if (board[index] || calculateWinner(board)) return

    const newBoard = [...board]
    newBoard[index] = isXNext ? 'X' : 'O'
    setBoard(newBoard)
    setIsXNext(!isXNext)
  }

  const resetGame = () => {
    setBoard(Array(9).fill(null))
    setIsXNext(true)
  }

  const winner = calculateWinner(board)
  const isDraw = !winner && board.every(square => square !== null)
  const status = winner 
    ? `Winner: ${winner}` 
    : isDraw 
    ? "It's a Draw!" 
    : `Next player: ${isXNext ? 'X' : 'O'}`

  const handleWin = (player: 'X' | 'O') => {
    setScores(prev => ({ ...prev, [player]: prev[player] + 1 }))
    setTimeout(() => {
      resetGame()
    }, 2000)
  }

  if (winner && !isDraw) {
    handleWin(winner)
  }

  const Square = ({ value, onClick }: { value: Player; onClick: () => void }) => (
    <button
      onClick={onClick}
      className="w-20 h-20 sm:w-24 sm:h-24 border-2 border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center text-4xl font-bold transition-colors disabled:cursor-not-allowed"
      disabled={!!value || !!winner || isDraw}
    >
      {value === 'X' && <X className="h-12 w-12 text-blue-600" />}
      {value === 'O' && <Circle className="h-12 w-12 text-red-600" />}
    </button>
  )

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">{status}</h2>
        <div className="flex justify-center gap-6 text-lg">
          <div className="flex items-center gap-2">
            <X className="h-5 w-5 text-blue-600" />
            <span>Player X: {scores.X}</span>
          </div>
          <div className="flex items-center gap-2">
            <Circle className="h-5 w-5 text-red-600" />
            <span>Player O: {scores.O}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="grid grid-cols-3 gap-0 bg-gray-200 p-2 rounded-lg">
          {board.map((square, index) => (
            <Square key={index} value={square} onClick={() => handleClick(index)} />
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <Button onClick={resetGame} variant="outline" className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Reset Game
        </Button>
      </div>

      <div className="text-center text-sm text-gray-600">
        <p>Take turns clicking on the squares. First to get 3 in a row wins!</p>
      </div>
    </div>
  )
}

