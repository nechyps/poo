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

    // Валидация данных
    const validatedData = {
      name: petData.name || 'Tamagotchi',
      hunger: Math.max(0, Math.min(100, petData.hunger ?? 80)),
      happiness: Math.max(0, Math.min(100, petData.happiness ?? 80)),
      energy: Math.max(0, Math.min(100, petData.energy ?? 80)),
      cleanliness: Math.max(0, Math.min(100, petData.cleanliness ?? 80)),
      health: Math.max(0, Math.min(100, petData.health ?? 100)),
      coins: Math.max(0, petData.coins ?? 0),
      catchFoodBestScore: Math.max(0, petData.catchFoodBestScore ?? 0),
      clickFoodBestScore: Math.max(0, petData.clickFoodBestScore ?? 0),
      last_updated: petData.last_updated || Date.now(),
    }

    // Используем upsert для создания или обновления
    const upsertData = {
      user_id: userId,
      pet_data: validatedData,
      updated_at: new Date().toISOString(),
    }
    
    console.error('💾 Отправка данных в Supabase:', {
      userId,
      petData: validatedData,
      upsertData
    })
    
    // Проверяем, существует ли запись
    const { data: existingData, error: checkError } = await supabase
      .from('pet_saves')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Ошибка при проверке существования записи:', checkError)
      throw checkError
    }
    
    let result
    if (existingData) {
      // Обновляем существующую запись
      console.error('💾 Обновление существующей записи для user_id:', userId)
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
      console.error('💾 Создание новой записи для user_id:', userId)
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
      console.error('  - Полный ответ:', { data, error })
      throw error
    }
    
    console.error('✅ Данные успешно сохранены в Supabase:', data)
    
    if (!data || !data.pet_data) {
      console.error('❌ Сервер вернул пустые данные:', data)
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

