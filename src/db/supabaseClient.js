import { createClient } from '@supabase/supabase-js'

// Получаем переменные окружения
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Создаем заглушку для случая, когда Supabase не настроен
const createMockSupabase = () => ({
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
})

// Проверяем, что переменные заданы
let supabase

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase URL and Anon Key not defined. Auth features will be disabled.')
  console.warn('⚠️ Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file')
  supabase = createMockSupabase()
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.error('❌ Error creating Supabase client:', error)
    supabase = createMockSupabase()
  }
}

export { supabase }
