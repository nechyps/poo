import { useState, useEffect, useCallback, useRef } from 'react'
import { usePet } from './usePetSupabase'

const AUTO_SAVE_INTERVAL = 30000 // 30 seconds

// Default stats (0-100)
const DEFAULT_STATS = {
  hunger: 80,
  energy: 80,
  happiness: 80,
  cleanliness: 80,
  health: 100
}

// Decay rates per minute
const DECAY_RATES = {
  hunger: 2,      // Decreases by 2 per minute
  energy: 1.5,    // Decreases by 1.5 per minute
  happiness: 1,   // Decreases by 1 per minute
  cleanliness: 1.5 // Decreases by 1.5 per minute
}

// Action effects
const ACTION_EFFECTS = {
  feed: { hunger: +30, happiness: +5 },
  sleep: { energy: +50, health: +5 },
  play: { happiness: +25, energy: -10 },
  clean: { cleanliness: +40, happiness: +10 },
  medicine: { health: +30 }
}

export function useStats() {
  const { pet, isLoading: petLoading, savePetStats, error: petError } = usePet()
  const [stats, setStats] = useState(DEFAULT_STATS)
  const [lastUpdate, setLastUpdate] = useState(() => Date.now())
  const intervalRef = useRef(null)
  const lastUpdateRef = useRef(Date.now())
  const saveTimeoutRef = useRef(null)

  const initializedRef = useRef(false)
  const loadedPetRef = useRef(null)

  // Load stats from database when pet is loaded
  useEffect(() => {
    if (petLoading || !pet) return
    
    // Only initialize once to avoid race conditions with auto-saves
    if (initializedRef.current) return

    try {
      const savedStats = {
        hunger: pet.hunger ?? DEFAULT_STATS.hunger,
        energy: pet.energy ?? DEFAULT_STATS.energy,
        happiness: pet.happiness ?? DEFAULT_STATS.happiness,
        cleanliness: pet.cleanliness ?? DEFAULT_STATS.cleanliness,
        health: pet.health ?? DEFAULT_STATS.health
      }
      
      // Handle timestamp
      let savedLastUpdate = pet.last_updated ? new Date(pet.last_updated).getTime() : Date.now()
      
      // Calculate offline decay
      const now = Date.now()
      const minutesPassed = (now - savedLastUpdate) / 60000
      
      if (minutesPassed > 1) {
         console.log(`🕒 Прошло ${minutesPassed.toFixed(1)} минут пока вас не было. Применяем эффекты...`)
         
         const newStats = { ...savedStats }
         
         // Apply decay
         Object.keys(DECAY_RATES).forEach(stat => {
           if (stat !== 'health') {
             const decay = DECAY_RATES[stat] * minutesPassed
             newStats[stat] = Math.max(0, Math.min(100, newStats[stat] - decay))
           }
         })

         // Health calculation
         const avgStat = (newStats.hunger + newStats.energy + newStats.happiness + newStats.cleanliness) / 4
         if (avgStat < 30) {
           newStats.health = Math.max(0, newStats.health - (30 - avgStat) * 0.1 * minutesPassed)
         } else if (avgStat > 70 && newStats.health < 100) {
           newStats.health = Math.min(100, newStats.health + 0.5 * minutesPassed)
         }
         
         setStats(newStats)
         setLastUpdate(now)
         lastUpdateRef.current = now
      } else {
         setStats(savedStats)
         setLastUpdate(savedLastUpdate)
         lastUpdateRef.current = savedLastUpdate
      }
      
      initializedRef.current = true
      loadedPetRef.current = pet
    } catch (error) {
      console.error('Failed to load stats from pet:', error)
      lastUpdateRef.current = Date.now()
    }
  }, [pet, petLoading])

  // Auto-save to database when stats change
  useEffect(() => {
    if (petLoading || !pet) return

    // Очищаем предыдущий таймаут
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Сохраняем с задержкой, чтобы не сохранять при каждом изменении
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const statsToSave = { ...stats, last_updated: Date.now() }
        console.log('💾 Автосохранение статистики:', statsToSave)
        await savePetStats(statsToSave)
        console.log('✅ Статистика автосохранена')
      } catch (error) {
        console.error('❌ Ошибка автосохранения статистики:', error)
      }
    }, 1000) // Сохраняем через 1 секунду после последнего изменения

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [stats, pet, petLoading, savePetStats])

  // Decay stats over time
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setStats(prevStats => {
        const now = Date.now()
        const minutesPassed = (now - lastUpdateRef.current) / 60000
        
        if (minutesPassed < 0.1) return prevStats // Don't decay if less than 6 seconds passed

        const newStats = { ...prevStats }

        // Apply decay
        Object.keys(DECAY_RATES).forEach(stat => {
          if (stat !== 'health') {
            const decay = DECAY_RATES[stat] * minutesPassed
            newStats[stat] = Math.max(0, Math.min(100, newStats[stat] - decay))
          }
        })

        // Health decreases if other stats are too low
        const avgStat = (newStats.hunger + newStats.energy + newStats.happiness + newStats.cleanliness) / 4
        if (avgStat < 30) {
          newStats.health = Math.max(0, newStats.health - (30 - avgStat) * 0.1 * minutesPassed)
        } else if (avgStat > 70 && newStats.health < 100) {
          newStats.health = Math.min(100, newStats.health + 0.5 * minutesPassed)
        }

        lastUpdateRef.current = now
        setLastUpdate(now)
        return newStats
      })
    }, 6000) // Check every 6 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Perform action
  const performAction = useCallback(async (actionType) => {
    setStats(prevStats => {
      const effects = ACTION_EFFECTS[actionType] || {}
      const newStats = { ...prevStats }

      Object.keys(effects).forEach(stat => {
        newStats[stat] = Math.max(0, Math.min(100, newStats[stat] + effects[stat]))
      })

      const now = Date.now()
      lastUpdateRef.current = now
      setLastUpdate(now)

      // Немедленно сохраняем в БД при действии
      if (pet) {
        const statsToSave = { ...newStats, last_updated: now }
        console.log('💾 Сохранение после действия:', statsToSave)
        savePetStats(statsToSave).catch(err => {
          console.error('❌ Ошибка сохранения после действия:', err)
        })
      }

      return newStats
    })
  }, [pet, savePetStats])

  // Calculate mood based on stats
  const getMood = useCallback(() => {
    const { hunger, energy, happiness, cleanliness, health } = stats
    
    // Sick if health is very low
    if (health < 30) return 'sick'
    
    // Sleeping if energy is very low
    if (energy < 20) return 'sleeping'
    
    // Angry if any stat is very low
    if (hunger < 20 || happiness < 20 || cleanliness < 20) return 'angry'
    
    // Tired if energy is low
    if (energy < 40) return 'tired'
    
    // Happy if all stats are good
    const avgStat = (hunger + energy + happiness + cleanliness) / 4
    if (avgStat > 70 && health > 80) return 'happy'
    
    // Normal otherwise
    return 'normal'
  }, [stats])

  // Get health level (for hearts display)
  const getHealthLevel = useCallback(() => {
    const { health, hunger, energy, happiness, cleanliness } = stats
    const avgStat = (hunger + energy + happiness + cleanliness) / 4
    const overallHealth = (health + avgStat) / 2
    
    if (overallHealth >= 80) return 3
    if (overallHealth >= 50) return 2
    if (overallHealth >= 25) return 1
    return 0
  }, [stats])

  // Reset stats (for new game)
  const resetStats = useCallback(async () => {
    setStats(DEFAULT_STATS)
    setLastUpdate(Date.now())
    lastUpdateRef.current = Date.now()
    
    // Сохраняем сброшенные статистики в БД
    if (pet) {
      try {
        const statsToSave = { ...DEFAULT_STATS, last_updated: Date.now() }
        console.log('💾 Сброс статистики:', statsToSave)
        await savePetStats(statsToSave)
      } catch (error) {
        console.error('❌ Ошибка сброса статистики:', error)
      }
    }
  }, [pet, savePetStats])

  return {
    stats,
    performAction,
    getMood,
    getHealthLevel,
    resetStats,
    isLoading: petLoading,
    error: petError
  }
}

