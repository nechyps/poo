import { createClient } from '@supabase/supabase-js'

// Создаем заглушку для случая, когда Supabase не настроен
function createMockSupabase() {
  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ 
        data: { 
          subscription: { 
            unsubscribe: () => {} 
          } 
        } 
      }),
      signInWithOAuth: () => Promise.resolve({ 
        data: null, 
        error: { message: 'Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY' } 
      }),
      signOut: () => Promise.resolve({ error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ 
            data: null, 
            error: { code: 'PGRST116', message: 'Supabase not configured' } 
          }),
        }),
      }),
      upsert: () => ({
        select: () => ({
          single: () => Promise.resolve({ 
            data: null, 
            error: { message: 'Supabase not configured' } 
          }),
        }),
      }),
      delete: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
  }
}

// Получаем переменные окружения
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Инициализируем supabase клиент
const supabase = (() => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase URL and Anon Key not defined. Auth features will be disabled.')
    console.warn('⚠️ Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file')
    return createMockSupabase()
  }
  
  try {
    return createClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.error('❌ Error creating Supabase client:', error)
    return createMockSupabase()
  }
})()

export { supabase }
