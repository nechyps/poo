/**
 * Репозиторий для работы с данными питомцев
 * Содержит функции для создания, чтения и обновления питомцев
 */

import { getDatabase, saveDatabase } from './database'

/**
 * Создание нового питомца
 * @param {Object} petData - Данные питомца
 * @param {string} petData.name - Имя питомца
 * @param {number} petData.hunger - Уровень сытости (0-100)
 * @param {number} petData.happiness - Уровень счастья (0-100)
 * @param {number} petData.energy - Уровень энергии (0-100)
 * @param {number} petData.cleanliness - Уровень чистоты (0-100)
 * @param {number} petData.health - Уровень здоровья (0-100)
 * @param {number} petData.coins - Количество монет
 * @param {string} petData.sessionId - ID сессии
 * @returns {Promise<Object>} Созданный питомец с ID
 */
export async function createPet(petData) {
  try {
    const db = getDatabase()
    const now = Date.now()

    const {
      name = 'Tamagotchi',
      hunger = 80,
      happiness = 80,
      energy = 80,
      cleanliness = 80,
      health = 100,
      coins = 0,
      sessionId = null
    } = petData

    const insertQuery = `
      INSERT INTO pets (name, hunger, happiness, energy, cleanliness, health, coins, last_updated, created_at, session_id)
      VALUES ($name, $hunger, $happiness, $energy, $cleanliness, $health, $coins, $lastUpdated, $createdAt, $sessionId)
    `

    db.run(insertQuery, {
      $name: name,
      $hunger: hunger,
      $happiness: happiness,
      $energy: energy,
      $cleanliness: cleanliness,
      $health: health,
      $coins: coins,
      $lastUpdated: now,
      $createdAt: now,
      $sessionId: sessionId
    })

    const result = db.exec('SELECT last_insert_rowid() as id')
    if (!result || !result[0] || !result[0].values || result[0].values.length === 0) {
      throw new Error('Не удалось получить ID созданного питомца')
    }
    
    const petId = result[0].values[0][0]

    await saveDatabase()

    const pet = await getPetById(petId)
    if (!pet) {
      throw new Error('Питомец создан, но не удалось его загрузить')
    }
    
    console.log('Питомец создан:', pet)
    return pet
  } catch (error) {
    console.error('Ошибка создания питомца:', error)
    throw new Error(`Ошибка создания питомца: ${error.message}`)
  }
}

/**
 * Получение питомца по ID
 * @param {number} petId - ID питомца
 * @returns {Promise<Object|null>} Данные питомца или null
 */
export async function getPetById(petId) {
  try {
    const db = getDatabase()

    const selectQuery = `
      SELECT 
        id,
        name,
        hunger,
        happiness,
        energy,
        cleanliness,
        health,
        coins,
        last_updated,
        created_at,
        session_id
      FROM pets
      WHERE id = $petId
    `

    const stmt = db.prepare(selectQuery)
    stmt.bind({ $petId: petId })
    
    const result = []
    while (stmt.step()) {
      const row = stmt.getAsObject()
      result.push(row)
    }
    stmt.free()

    if (result.length === 0) {
      return null
    }

    return result[0]
  } catch (error) {
    console.error('Ошибка получения питомца:', error)
    throw error
  }
}

/**
 * Получение питомца по session_id
 * @param {string} sessionId - ID сессии
 * @returns {Promise<Object|null>} Данные питомца или null
 */
export async function getPetBySessionId(sessionId) {
  try {
    const db = getDatabase()

    const selectQuery = `
      SELECT 
        id,
        name,
        hunger,
        happiness,
        energy,
        cleanliness,
        health,
        coins,
        last_updated,
        created_at,
        session_id
      FROM pets
      WHERE session_id = $sessionId
    `

    const stmt = db.prepare(selectQuery)
    stmt.bind({ $sessionId: sessionId })
    
    const result = []
    while (stmt.step()) {
      const row = stmt.getAsObject()
      result.push(row)
    }
    stmt.free()

    if (result.length === 0) {
      return null
    }

    return result[0]
  } catch (error) {
    console.error('Ошибка получения питомца по session_id:', error)
    throw error
  }
}

/**
 * Обновление статистики питомца
 * @param {number} petId - ID питомца
 * @param {Object} stats - Новые значения статистики
 * @param {number} [stats.hunger] - Уровень сытости
 * @param {number} [stats.happiness] - Уровень счастья
 * @param {number} [stats.energy] - Уровень энергии
 * @param {number} [stats.cleanliness] - Уровень чистоты
 * @param {number} [stats.health] - Уровень здоровья
 * @param {number} [stats.coins] - Количество монет
 * @returns {Promise<Object>} Обновленные данные питомца
 */
export async function updatePetStats(petId, stats) {
  try {
    const db = getDatabase()
    const now = Date.now()

    // Формируем список полей для обновления
    const updates = []
    const bindings = { $petId: petId }

    if (stats.hunger !== undefined) {
      updates.push('hunger = $hunger')
      bindings.$hunger = Math.max(0, Math.min(100, stats.hunger))
    }
    if (stats.happiness !== undefined) {
      updates.push('happiness = $happiness')
      bindings.$happiness = Math.max(0, Math.min(100, stats.happiness))
    }
    if (stats.energy !== undefined) {
      updates.push('energy = $energy')
      bindings.$energy = Math.max(0, Math.min(100, stats.energy))
    }
    if (stats.cleanliness !== undefined) {
      updates.push('cleanliness = $cleanliness')
      bindings.$cleanliness = Math.max(0, Math.min(100, stats.cleanliness))
    }
    if (stats.health !== undefined) {
      updates.push('health = $health')
      bindings.$health = Math.max(0, Math.min(100, stats.health))
    }
    if (stats.coins !== undefined) {
      updates.push('coins = $coins')
      bindings.$coins = Math.max(0, stats.coins)
    }

    // Всегда обновляем время последнего обновления
    updates.push('last_updated = $lastUpdated')
    bindings.$lastUpdated = now

    if (updates.length === 1) {
      // Только обновление времени, ничего не делаем
      const updatedPet = await getPetById(petId)
      return updatedPet
    }

    const updateQuery = `
      UPDATE pets
      SET ${updates.join(', ')}
      WHERE id = $petId
    `

    db.run(updateQuery, bindings)
    await saveDatabase()

    const updatedPet = await getPetById(petId)
    console.log('Статистика питомца обновлена:', updatedPet)
    return updatedPet
  } catch (error) {
    console.error('Ошибка обновления статистики питомца:', error)
    throw error
  }
}

/**
 * Получение всех питомцев (для отладки или будущего функционала)
 * @returns {Promise<Array>} Массив всех питомцев
 */
export async function getAllPets() {
  try {
    const db = getDatabase()

    const selectQuery = `
      SELECT 
        id,
        name,
        hunger,
        happiness,
        energy,
        cleanliness,
        health,
        coins,
        last_updated,
        created_at,
        session_id
      FROM pets
      ORDER BY created_at DESC
    `

    const stmt = db.prepare(selectQuery)
    const pets = []
    
    while (stmt.step()) {
      const pet = stmt.getAsObject()
      pets.push(pet)
    }
    stmt.free()

    return pets
  } catch (error) {
    console.error('Ошибка получения всех питомцев:', error)
    throw error
  }
}

/**
 * Удаление питомца (для отладки или сброса игры)
 * @param {number} petId - ID питомца
 * @returns {Promise<boolean>} true если удаление успешно
 */
export async function deletePet(petId) {
  try {
    const db = getDatabase()

    const deleteQuery = 'DELETE FROM pets WHERE id = $petId'
    db.run(deleteQuery, { $petId: petId })
    await saveDatabase()

    console.log('Питомец удален:', petId)
    return true
  } catch (error) {
    console.error('Ошибка удаления питомца:', error)
    throw error
  }
}

