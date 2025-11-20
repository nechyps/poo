/**
 * Модуль для работы с базой данных SQLite
 * Использует sql.js для работы в браузере
 */

import { get, set } from 'idb-keyval'
import { loadSqlJs } from './sqlJsLoader.js'

const DB_STORAGE_KEY = 'tamagotchi_db'
const DB_VERSION_KEY = 'tamagotchi_db_version'
const CURRENT_DB_VERSION = 1

let dbInstance = null
let SQL = null
let initPromise = null

/**
 * Инициализация базы данных
 * @returns {Promise<Object>} Экземпляр базы данных
 */
export async function initDatabase() {
  // Если уже инициализируется, возвращаем существующий промис
  if (initPromise) {
    return initPromise
  }

  initPromise = (async () => {
    try {
      if (!SQL) {
        // Загружаем sql.js через загрузчик
        const { initSqlJs, locateFile } = await loadSqlJs()
        
        // Инициализируем SQL.js
        SQL = await initSqlJs({ locateFile })
        console.log('SQL.js успешно инициализирован')
      }

      // Пытаемся загрузить существующую БД из IndexedDB
      const savedDb = await get(DB_STORAGE_KEY)
      
      if (savedDb) {
        // Преобразуем данные в Uint8Array если нужно
        const dbData = savedDb instanceof Uint8Array 
          ? savedDb 
          : new Uint8Array(savedDb)
        dbInstance = new SQL.Database(dbData)
        console.log('База данных загружена из IndexedDB')
        
        // Проверяем версию БД и выполняем миграции при необходимости
        await checkAndMigrate()
      } else {
        // Создаем новую БД
        dbInstance = new SQL.Database()
        await createTables()
        await set(DB_VERSION_KEY, CURRENT_DB_VERSION)
        await saveDatabase()
        console.log('Создана новая база данных')
      }

      return dbInstance
    } catch (error) {
      console.error('Ошибка инициализации базы данных:', error)
      initPromise = null
      throw error
    }
  })()

  return initPromise
}

/**
 * Создание таблиц в базе данных
 */
async function createTables() {
  if (!dbInstance) {
    throw new Error('База данных не инициализирована')
  }

  const createPetsTable = `
    CREATE TABLE IF NOT EXISTS pets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL DEFAULT 'Tamagotchi',
      hunger REAL NOT NULL DEFAULT 80,
      happiness REAL NOT NULL DEFAULT 80,
      energy REAL NOT NULL DEFAULT 80,
      cleanliness REAL NOT NULL DEFAULT 80,
      health REAL NOT NULL DEFAULT 100,
      coins INTEGER NOT NULL DEFAULT 0,
      last_updated INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      session_id TEXT UNIQUE
    )
  `

  dbInstance.run(createPetsTable)
  console.log('Таблица pets создана')
}

/**
 * Проверка версии БД и выполнение миграций
 */
async function checkAndMigrate() {
  const currentVersion = await get(DB_VERSION_KEY) || 0
  
  if (currentVersion < CURRENT_DB_VERSION) {
    console.log(`Выполнение миграции с версии ${currentVersion} на ${CURRENT_DB_VERSION}`)
    
    // Пересоздаем таблицы если нужно
    if (currentVersion === 0) {
      await createTables()
    }
    
    // Здесь можно добавить миграции при обновлении схемы
    // Например:
    // if (currentVersion < 2) {
    //   await migrateToVersion2()
    // }
    
    await set(DB_VERSION_KEY, CURRENT_DB_VERSION)
    await saveDatabase()
  }
}

/**
 * Сохранение базы данных в IndexedDB
 */
export async function saveDatabase() {
  try {
    if (!dbInstance) {
      throw new Error('База данных не инициализирована')
    }

    const data = dbInstance.export()
    // В браузере используем Uint8Array напрямую
    await set(DB_STORAGE_KEY, data)
    console.log('База данных сохранена')
  } catch (error) {
    console.error('Ошибка сохранения базы данных:', error)
    throw error
  }
}

/**
 * Получение экземпляра базы данных
 * @returns {Object} Экземпляр базы данных
 */
export function getDatabase() {
  if (!dbInstance) {
    throw new Error('База данных не инициализирована. Вызовите initDatabase() сначала.')
  }
  return dbInstance
}

/**
 * Закрытие соединения с базой данных
 */
export function closeDatabase() {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}

