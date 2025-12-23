# Инструкция по деплою на Render.com

Этот проект подготовлен для автоматического деплоя на Render.

### Шаги для деплоя:

1. **Создайте новый Web Service** на [dashboard.render.com](https://dashboard.render.com/).
2. **Подключите ваш GitHub репозиторий** с этим проектом.
3. **Настройки Render** (должны подтянуться из `render.yaml` автоматически, но на всякий случай):
   - **Environment:** `Python`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app`
4. **Environment Variables (Переменные окружения):**
   Вам нужно добавить следующие переменные в панели управления Render (Environment -> Add Environment Variable):
   - `SUPABASE_URL`: URL вашего проекта Supabase.
   - `SUPABASE_KEY`: API ключ (anon public или service_role) от Supabase.
   - `ADMIN_LOGIN`: Логин для входа в админку.
   - `ADMIN_PASSWORD`: Пароль для входа в админку.
   - `SECRET_KEY`: Любая длинная случайная строка (Render может сгенерировать её автоматически, если использовать `render.yaml`).

### Важно:
- Убедитесь, что в Supabase созданы таблицы согласно файлу `init_db.sql`.
- В Supabase Storage должен быть создан публичный бакет с именем `lesson-images` (или приложение попытается создать его само при первой загрузке, но лучше создать заранее).
