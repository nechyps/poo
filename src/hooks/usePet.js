/**
 * Хук для работы с питомцем в базе данных
 * Управляет созданием, загрузкой и сохранением питомца
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { initDatabase, getDatabase } from '../db/database'
import { createPet, getPetBySessionId, updatePetStats } from '../db/petRepository'

const SESSION_ID_KEY = 'tamagotchi_session_id'

/**
 * Генерация уникального ID сессии
 */
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Получение или создание ID сессии
 */
function getSessionId() {
  let sessionId = localStorage.getItem(SESSION_ID_KEY)
  if (!sessionId) {
    sessionId = generateSessionId()
    localStorage.setItem(SESSION_ID_KEY, sessionId)
  }
  return sessionId
}

/**
 * Хук для работы с питомцем
 * @returns {Object} Объект с данными питомца и функциями для работы с ним
 */
export function usePet() {
  const [pet, setPet] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastSaveTime, setLastSaveTime] = useState(null)
  const sessionIdRef = useRef(null)
  const dbInitializedRef = useRef(false)

  /**
   * Инициализация базы данных и загрузка питомца
   */
  useEffect(() => {
    let mounted = true

    async function initialize() {
      try {
        setIsLoading(true)
        setError(null)

        // Инициализируем БД
        if (!dbInitializedRef.current) {
          await initDatabase()
          dbInitializedRef.current = true
        }

        // Получаем или создаем session ID
        const sessionId = getSessionId()
        sessionIdRef.current = sessionId

        // Пытаемся загрузить существующего питомца
        let loadedPet = await getPetBySessionId(sessionId)

        if (!loadedPet) {
          // Создаем нового питомца
          loadedPet = await createPet({
            name: 'Tamagotchi',
            hunger: 80,
            happiness: 80,
            energy: 80,
            cleanliness: 80,
            health: 100,
            coins: 0,
            sessionId: sessionId
          })
          console.log('Создан новый питомец')
        } else {
          console.log('Загружен существующий питомец')
        }

        if (mounted) {
          setPet(loadedPet)
          setLastSaveTime(loadedPet.last_updated)
          setIsLoading(false)
        }
      } catch (err) {
        console.error('Ошибка инициализации питомца:', err)
        if (mounted) {
          // Создаем питомца с дефолтными значениями при ошибке БД
          const defaultPet = {
            id: null,
            name: 'Tamagotchi',
            hunger: 80,
            happiness: 80,
            energy: 80,
            cleanliness: 80,
            health: 100,
            coins: 0,
            last_updated: Date.now(),
            created_at: Date.now(),
            session_id: sessionIdRef.current
          }
          setPet(defaultPet)
          setLastSaveTime(defaultPet.last_updated)
          setError(`Предупреждение: БД недоступна. Игра работает без сохранения. ${err.message}`)
          setIsLoading(false)
        }
      }
    }

    initialize()

    return () => {
      mounted = false
    }
  }, [])

  /**
   * Сохранение статистики питомца в БД
   */
  const savePetStats = useCallback(async (stats) => {
    if (!pet) {
      console.warn('Питомец не загружен, невозможно сохранить')
      return false
    }

    // Если БД не инициализирована или питомец без ID, просто обновляем локальное состояние
    if (!pet.id || !dbInitializedRef.current) {
      console.warn('БД недоступна, обновляем только локальное состояние')
      setPet(prev => ({
        ...prev,
        ...stats,
        last_updated: Date.now()
      }))
      setLastSaveTime(Date.now())
      return false // Возвращаем false, так как не сохранили в БД
    }

    try {
      const updatedPet = await updatePetStats(pet.id, stats)
      setPet(updatedPet)
      setLastSaveTime(updatedPet.last_updated)
      console.log('Статистика питомца сохранена')
      return true
    } catch (err) {
      console.error('Ошибка сохранения статистики питомца:', err)
      // Обновляем локальное состояние даже при ошибке БД
      setPet(prev => ({
        ...prev,
        ...stats,
        last_updated: Date.now()
      }))
      setLastSaveTime(Date.now())
      return false
    }
  }, [pet])

  /**
   * Ручное сохранение (команда save)
   */
  const manualSave = useCallback(async () => {
    if (!pet) {
      return { success: false, message: 'Питомец не загружен' }
    }

    try {
      // Сохраняем текущее состояние
      const stats = {
        hunger: pet.hunger,
        happiness: pet.happiness,
        energy: pet.energy,
        cleanliness: pet.cleanliness,
        health: pet.health,
        coins: pet.coins
      }

      const success = await savePetStats(stats)
      
      if (success) {
        return { 
          success: true, 
          message: 'Игра сохранена!',
          lastSaveTime: pet.last_updated
        }
      } else {
        return { 
          success: false, 
          message: 'БД недоступна. Изменения сохранены локально.' 
        }
      }
    } catch (err) {
      console.error('Ошибка ручного сохранения:', err)
      return { 
        success: false, 
        message: err.message || 'Не удалось сохранить игру' 
      }
    }
  }, [pet, savePetStats])

  /**
   * Ручная загрузка (команда load)
   */
  const manualLoad = useCallback(async () => {
    if (!sessionIdRef.current) {
      return { success: false, message: 'Сессия не найдена' }
    }

    // Проверяем, инициализирована ли БД
    if (!dbInitializedRef.current) {
      return { 
        success: false, 
        message: 'База данных недоступна. Перезагрузите страницу для повторной попытки инициализации.' 
      }
    }

    try {
      setIsLoading(true)
      
      // Пытаемся переинициализировать БД если нужно
      if (!dbInitializedRef.current) {
        try {
          await initDatabase()
          dbInitializedRef.current = true
        } catch (initError) {
          setIsLoading(false)
          return { 
            success: false, 
            message: `База данных недоступна: ${initError.message}` 
          }
        }
      }
      
      const loadedPet = await getPetBySessionId(sessionIdRef.current)
      
      if (loadedPet) {
        setPet(loadedPet)
        setLastSaveTime(loadedPet.last_updated)
        setIsLoading(false)
        return { 
          success: true, 
          message: 'Игра загружена!',
          pet: loadedPet
        }
      } else {
        setIsLoading(false)
        return { 
          success: false, 
          message: 'Сохранение не найдено' 
        }
      }
    } catch (err) {
      console.error('Ошибка ручной загрузки:', err)
      setIsLoading(false)
      return { 
        success: false, 
        message: `Не удалось загрузить игру: ${err.message}` 
      }
    }
  }, [])

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

  return {
    pet,
    isLoading,
    error,
    lastSaveTime,
    savePetStats,
    manualSave,
    manualLoad,
    formatLastSaveTime,
    sessionId: sessionIdRef.current
  }
}

