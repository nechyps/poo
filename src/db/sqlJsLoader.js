import sqlJsScriptUrl from 'sql.js/dist/sql-wasm.js?url'
import sqlWasmBinaryUrl from 'sql.js/dist/sql-wasm.wasm?url'

let localScriptPromise = null
let cdnScriptPromise = null

function injectScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.crossOrigin = 'anonymous'
    script.onload = () => resolve()
    script.onerror = (error) => reject(new Error(`Не удалось загрузить скрипт ${src}: ${error.message}`))
    document.head.appendChild(script)
  })
}

async function loadFromLocal() {
  if (window.initSqlJs) {
    return window.initSqlJs
  }

  if (!localScriptPromise) {
    localScriptPromise = injectScript(sqlJsScriptUrl)
  }

  await localScriptPromise

  if (!window.initSqlJs) {
    throw new Error('initSqlJs не найден после загрузки локального файла')
  }

  return window.initSqlJs
}

async function loadFromCDN() {
  if (window.initSqlJs) {
    return window.initSqlJs
  }

  if (!cdnScriptPromise) {
    cdnScriptPromise = injectScript('https://sql.js.org/dist/sql-wasm.js')
  }

  await cdnScriptPromise

  if (!window.initSqlJs) {
    throw new Error('initSqlJs не найден после загрузки с CDN')
  }

  return window.initSqlJs
}

export async function loadSqlJs() {
  try {
    const initSqlJs = await loadFromLocal()
    return {
      initSqlJs,
      locateFile: (file) => file.endsWith('.wasm') ? sqlWasmBinaryUrl : sqlJsScriptUrl
    }
  } catch (localError) {
    console.warn('Не удалось загрузить sql.js локально, пробуем CDN:', localError)
  }

  const initSqlJs = await loadFromCDN()
  return {
    initSqlJs,
    locateFile: (file) => `https://sql.js.org/dist/${file}`
  }
}

