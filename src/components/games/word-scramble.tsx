'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RotateCcw, Shuffle } from 'lucide-react'
import { Input } from '@/components/ui/input'

const WORDS = [
  'EDUCATION', 'STUDENT', 'TEACHER', 'KNOWLEDGE', 'LEARNING',
  'SCHOOL', 'COLLEGE', 'UNIVERSITY', 'BOOK', 'STUDY',
  'EXAM', 'GRADE', 'CLASS', 'LESSON', 'HOMEWORK',
  'SCIENCE', 'MATH', 'HISTORY', 'LANGUAGE', 'ART',
  'MUSIC', 'SPORTS', 'READING', 'WRITING', 'RESEARCH'
]

function shuffleWord(word: string): string {
  const arr = word.split('')
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.join('')
}

export function WordScrambleGame() {
  const [currentWord, setCurrentWord] = useState('')
  const [scrambledWord, setScrambledWord] = useState('')
  const [userGuess, setUserGuess] = useState('')
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [hint, setHint] = useState('')
  const [message, setMessage] = useState('')

  const getRandomWord = () => {
    const word = WORDS[Math.floor(Math.random() * WORDS.length)]
    setCurrentWord(word)
    setScrambledWord(shuffleWord(word))
    setUserGuess('')
    setMessage('')
    setHint(`Hint: ${word.length} letters`)
  }

  useEffect(() => {
    getRandomWord()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const guess = userGuess.toUpperCase().trim()

    if (guess === currentWord) {
      setScore(prev => prev + 10)
      setLevel(prev => prev + 1)
      setMessage('✓ Correct! Great job!')
      setTimeout(() => {
        getRandomWord()
      }, 1500)
    } else {
      setMessage('✗ Wrong! Try again.')
      setTimeout(() => {
        setMessage('')
      }, 2000)
    }
  }

  const reshuffle = () => {
    setScrambledWord(shuffleWord(currentWord))
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Word Scramble</h2>
        <div className="flex justify-center gap-6 text-lg">
          <div>Score: <span className="font-bold">{score}</span></div>
          <div>Level: <span className="font-bold">{level}</span></div>
        </div>
      </div>

      <div className="text-center space-y-6">
        <div>
          <p className="text-sm text-gray-600 mb-2">{hint}</p>
          <div className="text-4xl font-bold tracking-widest mb-4 p-4 bg-gray-100 rounded-lg inline-block">
            {scrambledWord}
          </div>
          <Button
            onClick={reshuffle}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Shuffle className="h-4 w-4" />
            Reshuffle
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
          <Input
            type="text"
            value={userGuess}
            onChange={(e) => setUserGuess(e.target.value.toUpperCase())}
            placeholder="Unscramble the word"
            className="text-xl text-center w-64 h-12 uppercase"
            autoFocus
          />
          <Button type="submit" size="lg" disabled={!userGuess}>
            Submit
          </Button>
        </form>

        {message && (
          <p className={`font-bold text-xl ${
            message.startsWith('✓') ? 'text-green-600' : 'text-red-600'
          }`}>
            {message}
          </p>
        )}
      </div>

      <div className="text-center text-sm text-gray-600">
        <p>Unscramble the letters to form the correct word!</p>
      </div>
    </div>
  )
}

