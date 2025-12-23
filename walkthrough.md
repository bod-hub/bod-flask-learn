# FlaskLearn Project Walkthrough

Приложение успешно создано! Ниже приведена инструкция по запуску и использованию.

## Структура проекта
Все файлы приложения находятся в корневой папке.
*   `app.py`: Точка входа.
*   `crud.py`: Работа с Supabase (БД и Supabase Storage).
*   `routes_public.py` / `routes_admin.py`: Маршруты.
*   `config.py`: Настройки.
*   `templates/`: HTML шаблоны (Admin и Public).
*   `static/`: CSS и JS.

## Запуск локально
У вас уже создано виртуальное окружение и установлены зависимости.

1.  **Запуск сервера**:
    ```bash
    # В PowerShell
    .\venv\Scripts\python app.py
    ```
2.  **Доступ**:
    *   Сайт: [http://127.0.0.1:5000](http://127.0.0.1:5000)
    *   Админка: [http://127.0.0.1:5000/bod](http://127.0.0.1:5000/bod)

## Администрирование
**Вход в админку**: `/bod`
*   **Логин**: `bodryakov.mobile`
*   **Пароль**: `Anna-140275`

**Возможности админки**:
*   Создание/Редактирование/Удаление Разделов.
*   Создание/Редактирование/Удаление Уроков.
*   **Редактор**: Полноценный CKEditor 5 для Теории и Задач.
*   **Изображения**: При вставке изображения в редактор, оно автоматически загружается в Supabase Storage (бакет `lesson-images`) и вставляется в текст.
*   **Тесты**: Конструктор тестов позволяет добавлять вопросы и варианты ответов.

## Публичная часть
*   Главная страница: Список разделов и уроков (карточки).
*   Просмотр урока: Теория, Интерактивные тесты (проверка на JS без перезагрузки), Задача.
*   Тёмная тема: Переключатель в хедере.

## Деплой на Render.com
Проект полностью готов к деплою.

1.  Создайте "Web Service" на Render.
2.  Подключите репозиторий.
3.  **Build Command**: `pip install -r requirements.txt`
4.  **Start Command**: `gunicorn app:create_app()`
5.  **Environment Variables**:
    Скопируйте переменные из файла `.env` в настройки Environment Variables на Render.
    *   `SUPABASE_URL`
    *   `SUPABASE_KEY` (Используйте тот, что в .env - это Service Role для админки)
    *   `ADMIN_LOGIN`
    *   `ADMIN_PASSWORD`
    *   `SECRET_KEY`

## База данных & Хранилище
*   Таблицы `sections` и `lessons` используются из `init_db.sql`.
*   При первой загрузке изображения приложение попытается создать бакет `lesson-images` в Supabase Storage, если его нет. Убедитесь, что в Supabase Project Settings -> Storage включен доступ (Policies), хотя Service Role Key обходит RLS.

## Разработка
*   CSS: `static/css/style.css` (Material Design, Grid, CSS Variables).
*   JS: `static/js/main.js` (Theme), `static/js/admin.js` (Editor & Tests).
