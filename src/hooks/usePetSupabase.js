/**
 * Хук для работы с питомцем через Supabase
 * Полностью заменяет локальную БД на облачное хранилище
 * 
 * ВАЖНО: Питомец привязан к user_id из Google OAuth, а не к session_id
 * Это означает, что один пользователь всегда будет иметь одного и того же питомца,
 * независимо от сессии или устройства
 */

import { useState, useEffect, useCallback } from 'react'
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
  catchFoodBestScore: 0,
  clickFoodBestScore: 0,
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

  /**
   * Загрузка питомца из Supabase
   * Питомец загружается по user_id из Google OAuth
   */
  const loadPet = useCallback(async () => {
    if (!isAuthenticated || !userId) {
      // Если пользователь не авторизован, используем временное состояние
      // Питомец не будет сохранен без user_id
      setPet(DEFAULT_PET_DATA)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Загружаем питомца по user_id из Google OAuth
      let petData = await getPetSave(userId)

      if (!petData) {
        // Создаем нового питомца если сохранения нет
        petData = await createPet(userId, DEFAULT_PET_DATA)
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
      console.warn('⚠️ Пользователь не авторизован, сохранение только в памяти')
      // Если не авторизован, только обновляем локальное состояние
      setPet(prev => ({
        ...(prev || DEFAULT_PET_DATA),
        ...newStats,
      }))
      return false
    }

    try {
      // Если pet еще не загружен, используем updatePetStats который сам получит данные из БД
      if (!pet) {
        const updatedData = await updatePetStats(userId, newStats)
        setPet(updatedData)
        setLastSaveTime(Date.now())
        return true
      }

      // Pet загружен - используем локальное состояние и мержим с новыми данными
      const updatedPet = { ...pet, ...newStats }
      
      console.error('💾 savePetStats - обновление питомца:', {
        userId,
        currentPet: pet,
        newStats,
        updatedPet
      })
      
      // Обновляем локальное состояние оптимистично
      setPet(updatedPet)
      
      // Отправляем полный объект в БД
      const savedData = await savePetSave(userId, updatedPet)
      
      console.error('✅ savePetStats - данные сохранены:', savedData)
      
      // Обновляем стейт подтвержденными данными из БД
      setPet(savedData)
      setLastSaveTime(Date.now())
      return true
    } catch (err) {
      console.error('❌ Ошибка сохранения статистики питомца:', err)
      console.error('❌ Детали ошибки:', {
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint,
        stack: err.stack
      })
      // При ошибке обновляем локальное состояние хотя бы
      setPet(prev => ({
        ...(prev || DEFAULT_PET_DATA),
        ...newStats,
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
      console.warn('⚠️ Пользователь не авторизован, сохранение невозможно')
      return { 
        success: false, 
        message: 'Войдите в систему для сохранения игры' 
      }
    }

    if (!pet) {
      console.warn('⚠️ Pet не загружен, пытаемся загрузить...')
      // Попробуем загрузить pet перед сохранением
      try {
        await loadPet()
        // Подождем немного для загрузки
        await new Promise(resolve => setTimeout(resolve, 500))
        if (!pet) {
          return { success: false, message: 'Питомец не загружен. Попробуйте перезагрузить страницу.' }
        }
      } catch (err) {
        console.error('❌ Ошибка загрузки pet:', err)
        return { success: false, message: 'Не удалось загрузить данные питомца' }
      }
    }

    try {
      // Сохраняем ВСЕ данные питомца, включая best scores
      const fullPetData = {
        name: pet.name || 'Tamagotchi',
        hunger: pet.hunger ?? 80,
        happiness: pet.happiness ?? 80,
        energy: pet.energy ?? 80,
        cleanliness: pet.cleanliness ?? 80,
        health: pet.health ?? 100,
        coins: pet.coins ?? 0,
        catchFoodBestScore: pet.catchFoodBestScore ?? 0,
        clickFoodBestScore: pet.clickFoodBestScore ?? 0,
        last_updated: Date.now(),
      }

      const success = await savePetStats(fullPetData)
      
      if (success) {
        return { 
          success: true, 
          message: 'Игра сохранена!',
          lastSaveTime: Date.now()
        }
      } else {
        console.error('❌ savePetStats вернул false')
        return { 
          success: false, 
          message: 'Не удалось сохранить игру. Проверьте консоль на ошибки.' 
        }
      }
    } catch (err) {
      console.error('❌ Ошибка ручного сохранения:', err)
      console.error('❌ Детали ошибки:', {
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint
      })
      return { 
        success: false, 
        message: `Ошибка сохранения: ${err.message || 'Неизвестная ошибка'}` 
      }
    }
  }, [pet, userId, isAuthenticated, savePetStats, loadPet])

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

