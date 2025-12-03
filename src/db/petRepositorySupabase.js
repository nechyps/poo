/**
 * Репозиторий для работы с данными питомцев в Supabase
 * Полностью заменяет локальную SQLite БД
 */

import { supabase } from './supabaseClient'

/**
 * Структура данных питомца
 * @typedef {Object} PetData
 * @property {string} name - Имя питомца
 * @property {number} hunger - Уровень сытости (0-100)
 * @property {number} happiness - Уровень счастья (0-100)
 * @property {number} energy - Уровень энергии (0-100)
 * @property {number} cleanliness - Уровень чистоты (0-100)
 * @property {number} health - Уровень здоровья (0-100)
 * @property {number} coins - Количество монет
 * @property {number} catchFoodBestScore - Лучший счет в игре Catch Food
 * @property {number} clickFoodBestScore - Лучший счет в игре Click Food
 */

/**
 * Получение сохранения питомца для пользователя
 * Питомец привязан к user_id из Google OAuth (auth.users.id), а не к session_id
 * @param {string} userId - ID пользователя из Google OAuth (user.id из AuthContext)
 * @returns {Promise<PetData|null>} Данные питомца или null
 */
export async function getPetSave(userId) {
  try {
    if (!userId) {
      throw new Error('User ID is required')
    }

    // Получаем питомца по user_id из Google OAuth
    const { data, error } = await supabase
      .from('pet_saves')
      .select('pet_data, updated_at, created_at')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Запись не найдена - это нормально для нового пользователя
        return null
      }
      throw error
    }

    return data?.pet_data || null
  } catch (error) {
    console.error('Ошибка получения сохранения питомца:', error)
    throw new Error(`Не удалось загрузить сохранение: ${error.message}`)
  }
}

/**
 * Сохранение или обновление данных питомца
 * Питомец привязан к user_id из Google OAuth, а не к session_id
 * @param {string} userId - ID пользователя из Google OAuth (user.id из AuthContext)
 * @param {PetData} petData - Данные питомца
 * @returns {Promise<PetData>} Сохраненные данные
 */
export async function savePetSave(userId, petData) {
  try {
    if (!userId) {
      throw new Error('User ID is required')
    }

    if (!petData || typeof petData !== 'object') {
      throw new Error('Pet data is required')
    }

    // Проверяем, существует ли запись и получаем текущие данные
    const { data: existingData, error: checkError } = await supabase
      .from('pet_saves')
      .select('pet_data, user_id')
      .eq('user_id', userId)
      .maybeSingle()
    
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }
    
    // Если запись существует, мержим с существующими данными для сохранения рекордов
    const existingPetData = existingData?.pet_data || {}
    
    // Валидация данных с сохранением существующих рекордов
    const validatedData = {
      name: petData.name || existingPetData.name || 'Tamagotchi',
      hunger: petData.hunger !== undefined ? Math.max(0, Math.min(100, petData.hunger)) : (existingPetData.hunger ?? 80),
      happiness: petData.happiness !== undefined ? Math.max(0, Math.min(100, petData.happiness)) : (existingPetData.happiness ?? 80),
      energy: petData.energy !== undefined ? Math.max(0, Math.min(100, petData.energy)) : (existingPetData.energy ?? 80),
      cleanliness: petData.cleanliness !== undefined ? Math.max(0, Math.min(100, petData.cleanliness)) : (existingPetData.cleanliness ?? 80),
      health: petData.health !== undefined ? Math.max(0, Math.min(100, petData.health)) : (existingPetData.health ?? 100),
      coins: petData.coins !== undefined ? Math.max(0, petData.coins) : (existingPetData.coins ?? 0),
      // Рекорды: сохраняем максимальное значение между новым и существующим
      catchFoodBestScore: Math.max(
        petData.catchFoodBestScore !== undefined ? Math.max(0, petData.catchFoodBestScore) : 0,
        existingPetData.catchFoodBestScore || 0
      ),
      clickFoodBestScore: Math.max(
        petData.clickFoodBestScore !== undefined ? Math.max(0, petData.clickFoodBestScore) : 0,
        existingPetData.clickFoodBestScore || 0
      ),
      last_updated: petData.last_updated || Date.now(),
    }

    // Используем upsert для создания или обновления
    const upsertData = {
      user_id: userId,
      pet_data: validatedData,
      updated_at: new Date().toISOString(),
    }
    
    let result
    if (existingData) {
      // Обновляем существующую запись
      result = await supabase
        .from('pet_saves')
        .update({
          pet_data: validatedData,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select('pet_data, updated_at, user_id')
        .single()
    } else {
      // Создаем новую запись
      result = await supabase
        .from('pet_saves')
        .insert(upsertData)
        .select('pet_data, updated_at, user_id')
        .single()
    }
    
    const { data, error } = result

    if (error) {
      console.error('❌ Ошибка Supabase при сохранении:')
      console.error('  - Код:', error.code)
      console.error('  - Сообщение:', error.message)
      console.error('  - Детали:', error.details)
      console.error('  - Подсказка:', error.hint)
      throw error
    }
    
    if (!data || !data.pet_data) {
      throw new Error('Сервер вернул пустые данные')
    }

    return data.pet_data
  } catch (error) {
    console.error('Ошибка сохранения питомца:', error)
    throw new Error(`Не удалось сохранить данные: ${error.message}`)
  }
}

/**
 * Обновление статистики питомца (частичное обновление)
 * @param {string} userId - ID пользователя
 * @param {Partial<PetData>} stats - Частичные данные для обновления
 * @returns {Promise<PetData>} Обновленные данные
 */
export async function updatePetStats(userId, stats) {
  try {
    if (!userId) {
      throw new Error('User ID is required')
    }

    // Сначала получаем текущие данные
    const currentData = await getPetSave(userId)
    
    // Объединяем с новыми данными
    const updatedData = {
      ...(currentData || {
        name: 'Tamagotchi',
        hunger: 80,
        happiness: 80,
        energy: 80,
        cleanliness: 80,
        health: 100,
        coins: 0,
        catchFoodBestScore: 0,
        clickFoodBestScore: 0,
      }),
      ...stats,
    }

    // Сохраняем обновленные данные
    return await savePetSave(userId, updatedData)
  } catch (error) {
    console.error('Ошибка обновления статистики:', error)
    throw error
  }
}

/**
 * Создание нового питомца с дефолтными значениями
 * @param {string} userId - ID пользователя
 * @param {Partial<PetData>} [initialData] - Начальные данные (опционально)
 * @returns {Promise<PetData>} Созданные данные
 */
export async function createPet(userId, initialData = {}) {
  try {
    const defaultData = {
      name: 'Tamagotchi',
      hunger: 80,
      happiness: 80,
      energy: 80,
      cleanliness: 80,
      health: 100,
      coins: 0,
      catchFoodBestScore: 0,
      clickFoodBestScore: 0,
      ...initialData,
    }

    return await savePetSave(userId, defaultData)
  } catch (error) {
    console.error('Ошибка создания питомца:', error)
    throw error
  }
}

/**
 * Удаление сохранения питомца
 * @param {string} userId - ID пользователя
 * @returns {Promise<boolean>} true если удаление успешно
 */
export async function deletePetSave(userId) {
  try {
    if (!userId) {
      throw new Error('User ID is required')
    }

    const { error } = await supabase
      .from('pet_saves')
      .delete()
      .eq('user_id', userId)

    if (error) {
      throw error
    }

    return true
  } catch (error) {
    console.error('Ошибка удаления сохранения:', error)
    throw new Error(`Не удалось удалить сохранение: ${error.message}`)
  }
}

