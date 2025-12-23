-- Insert Sections
INSERT INTO sections (number, name, slug) VALUES 
(1, 'Основы Flask', 'basics'),
(2, 'Работа с Базой Данных', 'database')
ON CONFLICT (number) DO NOTHING;

-- Insert Lessons for Section 1
INSERT INTO lessons (section_id, number, name, slug, content, is_published) VALUES 
(
    (SELECT id FROM sections WHERE number = 1), 
    1, 
    'Введение во Flask', 
    'intro', 
    '{"theory_html": "<p>Flask — это микрофреймворк для Python...</p>", "tests": [{"id": 1, "question": "Что такое Flask?", "options": ["Микрофреймворк", "База данных", "ОС", "Язык"], "correct_index": 0}, {"id": 2, "question": "Какой язык используется?", "options": ["Java", "Python", "C++", "Go"], "correct_index": 1}, {"id": 3, "question": "Кто создал Flask?", "options": ["Armin Ronacher", "Guido van Rossum", "Linus Torvalds", "Bill Gates"], "correct_index": 0}, {"id": 4, "question": "В каком году вышел Flask?", "options": ["2010", "2004", "1999", "2020"], "correct_index": 0}], "task_html": "<p>Установите Flask и создайте приложение Hello World.</p>"}',
    true
),
(
    (SELECT id FROM sections WHERE number = 1), 
    2, 
    'Маршрутизация', 
    'routing', 
    '{"theory_html": "<p>Маршрутизация связывает URL с функциями...</p>", "tests": [{"id": 1, "question": "Декоратор для маршрута?", "options": ["@app.route", "@app.path", "@app.url", "@route"], "correct_index": 0}, {"id": 2, "question": "Тип данных по умолчанию в URL?", "options": ["int", "string", "float", "uuid"], "correct_index": 1}, {"id": 3, "question": "Как передать int?", "options": ["<int:name>", "<name:int>", "(int)name", "int <name>"], "correct_index": 0}, {"id": 4, "question": "Можно ли несколько декораторов?", "options": ["Да", "Нет", "Только 2", "Зависит от фазы луны"], "correct_index": 0}], "task_html": "<p>Создайте маршрут /user/name который приветствует пользователя.</p>"}',
    true
)
ON CONFLICT (section_id, number) DO NOTHING;

-- Insert Lessons for Section 2
INSERT INTO lessons (section_id, number, name, slug, content, is_published) VALUES 
(
    (SELECT id FROM sections WHERE number = 2), 
    1, 
    'Подключение Supabase', 
    'supabase-connect', 
    '{"theory_html": "<p>Для подключения используем библиотеку supabase-py...</p>", "tests": [{"id": 1, "question": "Библиотека для Supabase?", "options": ["supabase", "postgres", "flask-db", "sql"], "correct_index": 0}, {"id": 2, "question": "Какой ключ нужен для клиента?", "options": ["Public Key", "Private Key", "SSH Key", "House Key"], "correct_index": 0}, {"id": 3, "question": "Где хранить ключи?", "options": [".env", "app.py", "github", "на стикере"], "correct_index": 0}, {"id": 4, "question": "Порт Postgres?", "options": ["5432", "8080", "3000", "21"], "correct_index": 0}], "task_html": "<p>Настройте подключение к вашей базе данных Supabase.</p>"}',
    true
),
(
    (SELECT id FROM sections WHERE number = 2), 
    2, 
    'Запросы Select', 
    'select-queries', 
    '{"theory_html": "<p>Чтение данных выполняется методом .select()...</p>", "tests": [{"id": 1, "question": "Метод для выборки?", "options": ["select()", "get()", "fetch()", "read()"], "correct_index": 0}, {"id": 2, "question": "Нужно ли вызывать execute()?", "options": ["Да", "Нет", "Иногда", "Всегда"], "correct_index": 0}, {"id": 3, "question": "В каком формате ответ?", "options": ["JSON", "XML", "CSV", "Binary"], "correct_index": 0}, {"id": 4, "question": "Как фильтровать?", "options": [".eq()", ".filter()", ".where()", ".like()"], "correct_index": 0}], "task_html": "<p>Выведите список всех пользователей из таблицы.</p>"}',
    true
)
ON CONFLICT (section_id, number) DO NOTHING;
