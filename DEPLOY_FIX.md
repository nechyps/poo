# Инструкция по исправлению ошибки деплоя

## 🔍 Возможные причины ошибки

### 1. Неправильные пути импорта
✅ **Исправлено:** Путь в `AuthButton.jsx` исправлен с `../contexts` на `../../contexts`

### 2. Отсутствующие переменные окружения в Vercel

**Обязательно добавьте в Vercel Dashboard → Settings → Environment Variables:**

```
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**Важно:**
- Переменные должны быть добавлены для **Production**, **Preview** и **Development**
- После добавления переменных нужно **пересобрать** деплой

### 3. Отсутствующие файлы или папки

Убедитесь, что все файлы созданы:
- ✅ `src/contexts/AuthContext.jsx`
- ✅ `src/db/petRepositorySupabase.js`
- ✅ `src/hooks/usePetSupabase.js`
- ✅ `src/components/Auth/AuthButton.jsx`
- ✅ `src/components/Auth/AuthButton.css`
- ✅ `src/components/Auth/AuthScreen.jsx`
- ✅ `src/components/Auth/AuthScreen.css`
- ✅ `src/components/Auth/UserProfile.jsx`
- ✅ `src/components/Auth/UserProfile.css`

### 4. Проблемы с Supabase клиентом

Проверьте, что `src/db/supabaseClient.js` существует и правильно настроен:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be defined')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## 🛠️ Пошаговая инструкция по исправлению

### Шаг 1: Проверьте локальную сборку

```bash
npm run build
```

Если сборка проходит успешно локально, проблема скорее всего в переменных окружения.

### Шаг 2: Добавьте переменные окружения в Vercel

1. Откройте Vercel Dashboard
2. Выберите ваш проект
3. Перейдите в **Settings** → **Environment Variables**
4. Добавьте:
   - `VITE_SUPABASE_URL` = ваш Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = ваш Supabase Anon Key
5. Выберите все окружения (Production, Preview, Development)
6. Сохраните

### Шаг 3: Пересоберите деплой

В Vercel Dashboard:
1. Перейдите в **Deployments**
2. Найдите последний деплой
3. Нажмите **Redeploy** (три точки → Redeploy)

Или сделайте новый коммит и пуш:

```bash
git add .
git commit -m "Fix import paths and add env vars"
git push
```

### Шаг 4: Проверьте логи деплоя

В Vercel Dashboard → **Deployments** → выберите деплой → **Build Logs**

Ищите ошибки типа:
- `Cannot find module`
- `VITE_SUPABASE_URL is not defined`
- `Import error`

## 🔧 Дополнительные проверки

### Проверка структуры папок

Убедитесь, что структура правильная:

```
src/
├── contexts/
│   └── AuthContext.jsx
├── components/
│   └── Auth/
│       ├── AuthButton.jsx
│       ├── AuthButton.css
│       ├── AuthScreen.jsx
│       ├── AuthScreen.css
│       ├── UserProfile.jsx
│       └── UserProfile.css
```

### Проверка package.json

Убедитесь, что `@supabase/supabase-js` установлен:

```bash
npm install @supabase/supabase-js
```

## 📝 Чеклист перед деплоем

- [ ] Локальная сборка проходит успешно (`npm run build`)
- [ ] Все переменные окружения добавлены в Vercel
- [ ] Все импорты имеют правильные пути
- [ ] Все файлы существуют и на месте
- [ ] `package.json` содержит все зависимости
- [ ] Нет ошибок линтера (`npm run lint` если есть)

## 🐛 Если ошибка сохраняется

1. **Проверьте логи сборки в Vercel** - там будет точная ошибка
2. **Проверьте консоль браузера** на production сайте
3. **Убедитесь, что миграция БД выполнена** в Supabase Dashboard
4. **Проверьте, что Google OAuth настроен** в Supabase Dashboard

## 📞 Дополнительная помощь

Если ошибка все еще есть, пришлите:
1. Полный текст ошибки из Vercel Build Logs
2. Скриншот переменных окружения в Vercel
3. Результат `npm run build` локально

