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
<<<<<<< HEAD
  const lastUserIdRef = useRef(null)
  
=======

>>>>>>> parent of 7481958 (doodle jump)
  /**
   * Загрузка питомца из Supabase
   */
  const loadPet = useCallback(async () => {
    const currentUserId = user?.id || userId
    const currentIsAuthenticated = !!user || isAuthenticated
    
    if (!currentIsAuthenticated || !currentUserId) {
      // Если пользователь не авторизован, используем временное состояние
      setPet(DEFAULT_PET_DATA)
      setIsLoading(false)
      lastUserIdRef.current = null
      return
    }

    // Если пользователь не изменился и питомец уже загружен, не перезагружаем
    if (lastUserIdRef.current === currentUserId && pet) {
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      let petData = await getPetSave(currentUserId)

      if (!petData) {
        // Создаем нового питомца если сохранения нет
        petData = await createPet(currentUserId, DEFAULT_PET_DATA)
        console.log('Создан новый питомец для пользователя:', currentUserId)
      } else {
        console.log('Загружен существующий питомец')
      }

      setPet(petData)
      setLastSaveTime(Date.now())
      lastUserIdRef.current = currentUserId
    } catch (err) {
      console.error('Ошибка загрузки питомца:', err)
      setError(err.message)
      // Используем дефолтные значения при ошибке
      setPet(DEFAULT_PET_DATA)
      lastUserIdRef.current = null
    } finally {
      setIsLoading(false)
    }
  }, [userId, isAuthenticated, user, pet])

  // Загружаем питомца при изменении пользователя
  useEffect(() => {
<<<<<<< HEAD
    // Ждем завершения проверки авторизации перед загрузкой
    if (authLoading) {
      return
    }
    
    const currentUserId = user?.id || userId
    const currentIsAuthenticated = !!user || isAuthenticated
    
    // Загружаем только если пользователь авторизован и изменился
    if (currentIsAuthenticated && currentUserId && lastUserIdRef.current !== currentUserId) {
      loadPet()
    } else if (!currentIsAuthenticated && pet) {
      // Если пользователь вышел, сбрасываем питомца
      setPet(DEFAULT_PET_DATA)
      lastUserIdRef.current = null
    }
  }, [authLoading, userId, isAuthenticated, user, loadPet, pet])
=======
    loadPet()
  }, [loadPet])
>>>>>>> parent of 7481958 (doodle jump)

  /**
   * Сохранение статистики питомца в Supabase
   */
  const savePetStats = useCallback(async (stats) => {
    if (!isAuthenticated || !userId) {
      // Если не авторизован, только обновляем локальное состояние
      setPet(prev => ({
        ...prev,
        ...stats,
      }))
      return false
    }

    if (!pet) {
      console.warn('Питомец не загружен, невозможно сохранить')
      return false
    }

    try {
      const updatedData = await updatePetStats(userId, stats)
      setPet(updatedData)
      setLastSaveTime(Date.now())
      console.log('Статистика питомца сохранена')
      return true
    } catch (err) {
      console.error('Ошибка сохранения статистики питомца:', err)
      // Обновляем локальное состояние даже при ошибке
      setPet(prev => ({
        ...prev,
        ...stats,
      }))
      setError(err.message)
      return false
    }
  }, [pet, userId, isAuthenticated])

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

  // Автосохранение при изменении питомца (для авторизованных пользователей)
  useEffect(() => {
    const currentUserId = user?.id || userId
    const currentIsAuthenticated = !!user || isAuthenticated
    
    if (!currentIsAuthenticated || !currentUserId || !pet || isLoading) return

    // Очищаем предыдущий таймаут
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    // Сохраняем через 2 секунды после последнего изменения
    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        const stats = {
          hunger: pet.hunger,
          happiness: pet.happiness,
          energy: pet.energy,
          cleanliness: pet.cleanliness,
          health: pet.health,
          coins: pet.coins,
        }
        await savePetStats(stats)
      } catch (err) {
        console.error('Ошибка автосохранения:', err)
      }
    }, 2000)

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [pet?.hunger, pet?.happiness, pet?.energy, pet?.cleanliness, pet?.health, pet?.coins, userId, isAuthenticated, isLoading, savePetStats, user])

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

