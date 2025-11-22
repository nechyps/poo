/**
 * SQL миграция для создания таблицы pet_saves в Supabase
 * 
 * Выполните этот SQL в Supabase SQL Editor:
 * 
 * 1. Откройте Supabase Dashboard
 * 2. Перейдите в SQL Editor
 * 3. Вставьте этот код и выполните
 */

-- Создание таблицы для сохранений питомцев
CREATE TABLE IF NOT EXISTS pet_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pet_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Создание индекса для быстрого поиска по user_id
CREATE INDEX IF NOT EXISTS idx_pet_saves_user_id ON pet_saves(user_id);

-- Создание индекса для updated_at (для сортировки)
CREATE INDEX IF NOT EXISTS idx_pet_saves_updated_at ON pet_saves(updated_at DESC);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления updated_at
CREATE TRIGGER update_pet_saves_updated_at
  BEFORE UPDATE ON pet_saves
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) политики
ALTER TABLE pet_saves ENABLE ROW LEVEL SECURITY;

-- Политика: пользователи могут читать только свои сохранения
CREATE POLICY "Users can read own pet saves"
  ON pet_saves
  FOR SELECT
  USING (auth.uid() = user_id);

-- Политика: пользователи могут создавать только свои сохранения
CREATE POLICY "Users can insert own pet saves"
  ON pet_saves
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Политика: пользователи могут обновлять только свои сохранения
CREATE POLICY "Users can update own pet saves"
  ON pet_saves
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Политика: пользователи могут удалять только свои сохранения
CREATE POLICY "Users can delete own pet saves"
  ON pet_saves
  FOR DELETE
  USING (auth.uid() = user_id);

-- Комментарии для документации
COMMENT ON TABLE pet_saves IS 'Сохранения состояния питомцев пользователей';
COMMENT ON COLUMN pet_saves.user_id IS 'ID пользователя из auth.users';
COMMENT ON COLUMN pet_saves.pet_data IS 'JSON данные питомца (hunger, happiness, energy, cleanliness, health, coins, etc.)';

