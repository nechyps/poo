import { useState, useEffect, useCallback, useRef } from 'react'
import { usePet } from './usePetSupabase'

export function useCoins() {
  const { pet, savePetStats } = usePet()
  const [coins, setCoins] = useState(0)
  const saveTimeoutRef = useRef(null)

  const initializedRef = useRef(false)

  // Load coins from pet when pet is loaded
  useEffect(() => {
    if (pet && pet.coins !== undefined && !initializedRef.current) {
      setCoins(pet.coins || 0)
      initializedRef.current = true
    }
  }, [pet])

  // Save coins to database when they change
  useEffect(() => {
    if (!pet) return

    // Очищаем предыдущий таймаут
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Сохраняем с задержкой
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('💾 Сохранение монет:', coins)
        await savePetStats({ coins })
        console.log('✅ Монеты сохранены')
      } catch (error) {
        console.error('❌ Ошибка сохранения монет:', error)
      }
    }, 500)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [coins, pet, savePetStats])

  const addCoins = useCallback((amount) => {
    setCoins(prev => prev + amount)
  }, [])

  const spendCoins = useCallback((amount) => {
    setCoins(prev => Math.max(0, prev - amount))
  }, [])

  const resetCoins = useCallback(() => {
    setCoins(0)
  }, [])

  return {
    coins,
    addCoins,
    spendCoins,
    resetCoins
  }
}

