'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'
import { Input } from '@/components/ui/input'

export function MathQuizGame() {
  const [score, setScore] = useState(0)
  const [question, setQuestion] = useState({ num1: 0, num2: 0, operator: '+', answer: 0 })
  const [userAnswer, setUserAnswer] = useState('')
  const [timeLeft, setTimeLeft] = useState(30)
  const [gameActive, setGameActive] = useState(false)
  const [correct, setCorrect] = useState<boolean | null>(null)
  const [totalQuestions, setTotalQuestions] = useState(0)

  const generateQuestion = () => {
    const operators = ['+', '-', '*']
    const operator = operators[Math.floor(Math.random() * operators.length)]
    let num1: number, num2: number, answer: number

    if (operator === '+') {
      num1 = Math.floor(Math.random() * 50) + 1
      num2 = Math.floor(Math.random() * 50) + 1
      answer = num1 + num2
    } else if (operator === '-') {
      num1 = Math.floor(Math.random() * 50) + 1
      num2 = Math.floor(Math.random() * num1) + 1
      answer = num1 - num2
    } else {
      num1 = Math.floor(Math.random() * 12) + 1
      num2 = Math.floor(Math.random() * 12) + 1
      answer = num1 * num2
    }

    setQuestion({ num1, num2, operator, answer })
    setUserAnswer('')
    setCorrect(null)
  }

  const startGame = () => {
    setGameActive(true)
    setScore(0)
    setTimeLeft(30)
    setTotalQuestions(0)
    generateQuestion()
  }

  useEffect(() => {
    if (gameActive && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (gameActive && timeLeft === 0) {
      setGameActive(false)
    }
  }, [gameActive, timeLeft])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!gameActive) return

    const answer = parseInt(userAnswer)
    setTotalQuestions(prev => prev + 1)

    if (answer === question.answer) {
      setScore(prev => prev + 10)
      setCorrect(true)
      setTimeout(() => {
        generateQuestion()
      }, 500)
    } else {
      setCorrect(false)
      setTimeout(() => {
        setUserAnswer('')
        setCorrect(null)
      }, 1000)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Math Quiz</h2>
        <div className="flex justify-center gap-6 text-lg">
          <div>Score: <span className="font-bold">{score}</span></div>
          <div>Time: <span className="font-bold">{timeLeft}s</span></div>
          <div>Questions: <span className="font-bold">{totalQuestions}</span></div>
        </div>
        {!gameActive && timeLeft === 0 && (
          <p className="text-red-600 font-bold text-xl mt-2">
            Time's Up! Final Score: {score} ({totalQuestions > 0 ? Math.round((score / totalQuestions) * 10) : 0}% accuracy)
          </p>
        )}
      </div>

      {!gameActive ? (
        <div className="text-center">
          <Button onClick={startGame} size="lg" className="gap-2">
            Start Game
          </Button>
          <p className="text-sm text-gray-600 mt-4">
            Solve as many math problems as you can in 30 seconds!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-6xl font-bold mb-4">
              {question.num1} {question.operator === '*' ? '×' : question.operator} {question.num2} = ?
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
              <Input
                type="number"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Your answer"
                className="text-2xl text-center w-48 h-16"
                autoFocus
              />
              <Button type="submit" size="lg" disabled={!userAnswer}>
                Submit
              </Button>
            </form>
            {correct === true && (
              <p className="text-green-600 font-bold text-xl mt-2">✓ Correct! +10 points</p>
            )}
            {correct === false && (
              <p className="text-red-600 font-bold text-xl mt-2">✗ Wrong! Answer: {question.answer}</p>
            )}
          </div>
        </div>
      )}

      {gameActive && (
        <div className="flex justify-center">
          <Button onClick={() => setGameActive(false)} variant="outline" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            End Game
          </Button>
        </div>
      )}
    </div>
  )
}

