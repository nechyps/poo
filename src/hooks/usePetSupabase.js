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
  const { user, userId, isAuthenticated, loading: authLoading } = useAuth()
  const [pet, setPet] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastSaveTime, setLastSaveTime] = useState(null)
  const autoSaveTimeoutRef = useRef(null)
  
  // Логирование для отладки и перезагрузка при изменении авторизации
  useEffect(() => {
    const currentUserId = user?.id || userId
    const currentIsAuthenticated = !!user || isAuthenticated
    
    console.log('usePet: Auth state changed', { 
      isAuthenticated: currentIsAuthenticated, 
      userId: currentUserId, 
      user: user?.email,
      authLoading,
      hasPet: !!pet
    })
    
    // Если авторизация завершилась и пользователь авторизован, перезагружаем питомца
    if (!authLoading && currentIsAuthenticated && currentUserId) {
      // Если питомца еще нет или он был создан для другого пользователя, загружаем заново
      if (!pet || (pet && !pet.userId)) {
        console.log('usePet: User authenticated, loading pet for userId:', currentUserId)
        loadPet()
      }
    }
  }, [isAuthenticated, userId, user, authLoading, pet, loadPet])

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

  // Загружаем питомца при изменении пользователя или завершении загрузки авторизации
  useEffect(() => {
    // Ждем завершения проверки авторизации перед загрузкой
    if (authLoading) {
      return
    }
    loadPet()
  }, [loadPet, authLoading])

  /**
   * Сохранение статистики питомца в Supabase
   */
  const savePetStats = useCallback(async (stats) => {
    // Получаем актуальный userId
    const currentUserId = user?.id || userId
    const currentIsAuthenticated = !!user || isAuthenticated
    
    if (!currentIsAuthenticated || !currentUserId) {
      console.warn('savePetStats: User not authenticated', { 
        isAuthenticated: currentIsAuthenticated, 
        userId: currentUserId,
        user 
      })
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
      console.log('savePetStats: Saving with userId', currentUserId)
      const updatedData = await updatePetStats(currentUserId, stats)
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
  }, [pet, userId, user, isAuthenticated])

  /**
   * Ручное сохранение
   */
  const manualSave = useCallback(async () => {
    // Получаем свежие данные авторизации
    const currentUserId = user?.id || userId
    const currentIsAuthenticated = !!user || isAuthenticated
    
    // Проверяем авторизацию с логированием
    console.log('manualSave: Checking auth', { 
      isAuthenticated: currentIsAuthenticated, 
      userId: currentUserId, 
      user: user?.email,
      authLoading,
      hasUser: !!user,
      hasUserId: !!userId
    })
    
    if (authLoading) {
      return { 
        success: false, 
        message: 'Проверка авторизации... Подождите.' 
      }
    }
    
    if (!currentIsAuthenticated || !currentUserId) {
      console.warn('manualSave: User not authenticated', { 
        isAuthenticated: currentIsAuthenticated, 
        userId: currentUserId,
        user 
      })
      return { 
        success: false, 
        message: 'Войдите в систему для сохранения игры. Перезагрузите страницу после входа.' 
      }
    }

    if (!pet) {
      return { success: false, message: 'Питомец не загружен' }
    }

    try {
      // Используем актуальный userId
      const currentUserId = user?.id || userId
      
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
  }, [pet, userId, isAuthenticated, authLoading, user, savePetStats, lastSaveTime])

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
    if (!isAuthenticated || !userId || !pet || isLoading) return

    // Очищаем предыдущий таймаут
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    // Сохраняем через 2 секунды после последнего изменения
    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        await savePetStats(pet)
      } catch (err) {
        console.error('Ошибка автосохранения:', err)
      }
    }, 2000)

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [pet, userId, isAuthenticated, isLoading, savePetStats])

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

