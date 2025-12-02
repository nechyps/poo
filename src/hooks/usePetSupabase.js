/**
 * Хук для работы с питомцем через Supabase
 * Полностью заменяет локальную БД на облачное хранилище
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getPetSave, savePetSave, updatePetStats, createPet } from '../db/petRepositorySupabase'

const DEFAULT_PET_DATA = {
  name: 'Tamagotchi',
  hunger: 80,
  happiness: 80,
  energy: 80,
  cleanliness: 80,
  health: 100,
  coins: 0,
}

/**
 * Хук для работы с питомцем
 * @returns {Object} Объект с данными питомца и функциями для работы с ним
 */
export function usePet() {
  const { user, userId, isAuthenticated } = useAuth()
  const [pet, setPet] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastSaveTime, setLastSaveTime] = useState(null)
  const autoSaveTimeoutRef = useRef(null)

  /**
   * Загрузка питомца из Supabase
   */
  const loadPet = useCallback(async () => {
    if (!isAuthenticated || !userId) {
      // Если пользователь не авторизован, используем временное состояние
      setPet(DEFAULT_PET_DATA)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      let petData = await getPetSave(userId)

      if (!petData) {
        // Создаем нового питомца если сохранения нет
        petData = await createPet(userId, DEFAULT_PET_DATA)
        console.log('Создан новый питомец для пользователя:', userId)
      } else {
        console.log('Загружен существующий питомец')
      }

      setPet(petData)
      setLastSaveTime(Date.now())
    } catch (err) {
      console.error('Ошибка загрузки питомца:', err)
      setError(err.message)
      // Используем дефолтные значения при ошибке
      setPet(DEFAULT_PET_DATA)
    } finally {
      setIsLoading(false)
    }
  }, [userId, isAuthenticated])

  // Загружаем питомца при изменении пользователя
  useEffect(() => {
    loadPet()
  }, [loadPet])

  /**
   * Сохранение статистики питомца в Supabase
   */
  const savePetStats = useCallback(async (newStats) => {
    if (!isAuthenticated || !userId) {
      // Если не авторизован, только обновляем локальное состояние
      setPet(prev => ({
        ...prev,
        ...newStats,
      }))
      return false
    }

    // Используем функциональное обновление, чтобы получить актуальный стейт
    let updatedPet = null
    setPet(prev => {
      if (!prev) return prev
      updatedPet = { ...prev, ...newStats }
      return updatedPet
    })

    // Если пет не был загружен, мы не можем сохранить
    if (!updatedPet) {
       // Попробуем взять newStats как основу, если это инициализация? 
       // Нет, лучше подождать загрузки.
       console.warn('Питомец не загружен, пропускаем сохранение')
       return false
    }

    try {
      // Отправляем полный объект, чтобы избежать гонки чтения в БД
      // Мы считаем, что локальный стейт - самый актуальный
      const savedData = await savePetSave(userId, updatedPet)
      
      // Обновляем стейт подтвержденными данными из БД
      setPet(savedData)
      setLastSaveTime(Date.now())
      console.log('✅ Статистика питомца успешно сохранена в облако')
      return true
    } catch (err) {
      console.error('❌ Ошибка сохранения статистики питомца:', err)
      // Локальный стейт мы уже обновили оптимистично, так что пользователь не заметит лага.
      // Но надо показать ошибку.
      setError(err.message)
      return false
    }
  }, [userId, isAuthenticated])

  /**
   * Ручное сохранение
   */
  const manualSave = useCallback(async () => {
    if (!isAuthenticated || !userId) {
      return { 
        success: false, 
        message: 'Войдите в систему для сохранения игры' 
      }
    }

    if (!pet) {
      return { success: false, message: 'Питомец не загружен' }
    }

    try {
      const stats = {
        hunger: pet.hunger,
        happiness: pet.happiness,
        energy: pet.energy,
        cleanliness: pet.cleanliness,
        health: pet.health,
        coins: pet.coins,
      }

      const success = await savePetStats(stats)
      
      if (success) {
        return { 
          success: true, 
          message: 'Игра сохранена!',
          lastSaveTime: lastSaveTime
        }
      } else {
        return { 
          success: false, 
          message: 'Не удалось сохранить игру. Попробуйте еще раз.' 
        }
      }
    } catch (err) {
      console.error('Ошибка ручного сохранения:', err)
      return { 
        success: false, 
        message: err.message || 'Не удалось сохранить игру' 
      }
    }
  }, [pet, userId, isAuthenticated, savePetStats, lastSaveTime])

  /**
   * Ручная загрузка
   */
  const manualLoad = useCallback(async () => {
    if (!isAuthenticated || !userId) {
      return { 
        success: false, 
        message: 'Войдите в систему для загрузки игры' 
      }
    }

    try {
      setIsLoading(true)
      await loadPet()
      return { 
        success: true, 
        message: 'Игра загружена!',
        pet: pet
      }
    } catch (err) {
      console.error('Ошибка ручной загрузки:', err)
      setIsLoading(false)
      return { 
        success: false, 
        message: `Не удалось загрузить игру: ${err.message}` 
      }
    }
  }, [userId, isAuthenticated, loadPet, pet])

  /**
   * Форматирование времени последнего сохранения
   */
  const formatLastSaveTime = useCallback(() => {
    if (!lastSaveTime) return 'Никогда'
    
    const date = new Date(lastSaveTime)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Только что'
    if (diffMins < 60) return `${diffMins} мин. назад`
    if (diffHours < 24) return `${diffHours} ч. назад`
    if (diffDays < 7) return `${diffDays} дн. назад`
    
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }, [lastSaveTime])

  // Удалено дублирующее автосохранение, так как useStats и useCoins сами инициируют сохранение
  // при изменении данных. usePetSupabase отвечает только за транспорт и хранение.
  /*
  useEffect(() => {
    if (!isAuthenticated || !userId || !pet || isLoading) return
    // ... (код автосохранения)
  }, [pet, userId, isAuthenticated, isLoading, savePetStats])
  */

  return {
    pet,
    isLoading,
    error,
    lastSaveTime,
    savePetStats,
    manualSave,
    manualLoad,
    formatLastSaveTime,
    isAuthenticated,
    reloadPet: loadPet,
  }
}

