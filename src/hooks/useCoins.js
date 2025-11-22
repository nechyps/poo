import { useState, useEffect, useCallback, useRef } from 'react'
import { usePet } from './usePetSupabase'

export function useCoins() {
  const { pet, savePetStats } = usePet()
  const [coins, setCoins] = useState(0)
  const saveTimeoutRef = useRef(null)

  // Load coins from pet when pet is loaded
  useEffect(() => {
    if (pet && pet.coins !== undefined) {
      setCoins(pet.coins || 0)
    }
  }, [pet])

  // Save coins to database when they change
  useEffect(() => {
    if (!pet || !pet.id) return

    // Очищаем предыдущий таймаут
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Сохраняем с задержкой
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await savePetStats({ coins })
      } catch (error) {
        console.error('Failed to save coins:', error)
      }
    }, 500)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [coins, pet, savePetStats])

  const addCoins = useCallback((amount) => {
    setCoins(prev => {
      const newCoins = prev + amount
      // Немедленно сохраняем при изменении монет
      if (pet && pet.id) {
        savePetStats({ coins: newCoins }).catch(err => {
          console.error('Failed to save coins after add:', err)
        })
      }
      return newCoins
    })
  }, [pet, savePetStats])

  const spendCoins = useCallback((amount) => {
    setCoins(prev => {
      const newCoins = Math.max(0, prev - amount)
      // Немедленно сохраняем при изменении монет
      if (pet && pet.id) {
        savePetStats({ coins: newCoins }).catch(err => {
          console.error('Failed to save coins after spend:', err)
        })
      }
      return newCoins
    })
  }, [pet, savePetStats])

  const resetCoins = useCallback(() => {
    setCoins(0)
    if (pet && pet.id) {
      savePetStats({ coins: 0 }).catch(err => {
        console.error('Failed to reset coins in database:', err)
      })
    }
  }, [pet, savePetStats])

  return {
    coins,
    addCoins,
    spendCoins,
    resetCoins
  }
}

