import { useState, useEffect, useCallback } from 'react'
import heartCharacter from '../assets/character/heart.PNG'
import eatCharacter from '../assets/character/eat.PNG'
import jumpCharacter from '../assets/character/jump.PNG'
import sleepCharacter from '../assets/character/sleep.PNG'
import angryCharacter from '../assets/character/angry.PNG'
import tiredCharacter from '../assets/character/tired.PNG'

const CHARACTER_MAP = {
  normal: heartCharacter,
  happy: heartCharacter, // Using heart for happy (normal happy state)
  eating: eatCharacter,
  jumping: jumpCharacter,
  sleeping: sleepCharacter,
  angry: angryCharacter,
  tired: tiredCharacter,
  sick: tiredCharacter // Using tired for sick state
}

export function useCharacter() {
  const [currentState, setCurrentState] = useState('normal')
  const [currentImage, setCurrentImage] = useState(CHARACTER_MAP.normal)
  const [isAnimating, setIsAnimating] = useState(false)

  // Update character image based on state
  useEffect(() => {
    setCurrentImage(CHARACTER_MAP[currentState] || CHARACTER_MAP.normal)
  }, [currentState])

  // Set character state (mood)
  const setMood = useCallback((mood) => {
    if (!isAnimating) {
      setCurrentState(mood)
    }
  }, [isAnimating])

  // Perform action animation
  const performAction = useCallback((actionType, onComplete) => {
    if (isAnimating) return

    setIsAnimating(true)

    switch (actionType) {
      case 'feed':
        setCurrentState('eating')
        setTimeout(() => {
          setCurrentState('jumping')
          setTimeout(() => {
            setIsAnimating(false)
            if (onComplete) onComplete()
          }, 1000)
        }, 800)
        break

      case 'sleep':
        setCurrentState('sleeping')
        setTimeout(() => {
          setIsAnimating(false)
          if (onComplete) onComplete()
        }, 2000)
        break

      case 'play':
        setCurrentState('jumping')
        setTimeout(() => {
          setIsAnimating(false)
          if (onComplete) onComplete()
        }, 1500)
        break

      case 'clean':
        setCurrentState('jumping')
        setTimeout(() => {
          setIsAnimating(false)
          if (onComplete) onComplete()
        }, 1000)
        break

      default:
        setIsAnimating(false)
        if (onComplete) onComplete()
    }
  }, [isAnimating])

  // Reset to normal state
  const resetToNormal = useCallback(() => {
    setCurrentState('normal')
    setIsAnimating(false)
  }, [])

  return {
    currentImage,
    currentState,
    isAnimating,
    setMood,
    performAction,
    resetToNormal
  }
}

