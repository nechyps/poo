/**
 * Обертка для sql.js, которая правильно обрабатывает CommonJS экспорт
 */

// Прямой импорт файла sql-wasm.js
// Vite должен обработать это как CommonJS модуль
let sqlJsModule = null

/**
 * Загрузка sql.js модуля
 */
export async function loadSqlJsModule() {
  if (sqlJsModule) {
    return sqlJsModule
  }

  try {
    // Импортируем напрямую файл
    const module = await import('sql.js/dist/sql-wasm.js')
    
    // Обрабатываем CommonJS экспорт
    // В CommonJS это будет module.exports
    // В ES модулях это может быть default или весь модуль
    if (module.default && typeof module.default === 'function') {
      sqlJsModule = module.default
    } else if (typeof module === 'function') {
      sqlJsModule = module
    } else if (module.initSqlJs && typeof module.initSqlJs === 'function') {
      sqlJsModule = module.initSqlJs
    } else {
      // Пробуем получить из module.exports
      const mod = module.default || module
      if (typeof mod === 'function') {
        sqlJsModule = mod
      } else {
        throw new Error('Не удалось найти функцию initSqlJs')
      }
    }
    
    return sqlJsModule
  } catch (error) {
    console.error('Ошибка загрузки sql.js модуля:', error)
    throw error
  }
}

