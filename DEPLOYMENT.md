# Руководство по развертыванию на хостинге

## Подготовка к развертыванию

### 1. Требования к хостингу
- Node.js (версия 18 или выше)
- MySQL база данных
- Доступ к SSH (для установки зависимостей)
- Права на запись в директории public_html

### 2. Структура файлов на хостинге

Файлы проекта должны быть размещены в директории `public_html`:
```
public_html/
├── node_modules/        (создастся после npm install)
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── public/              (статические файлы - HTML, CSS, JS)
│   ├── css/
│   ├── js/
│   └── index.html
├── src/                 (серверный код)
│   ├── controllers/
│   ├── middlewares/
│   ├── routes/
│   ├── db/
│   └── index.js
├── .env                 (создать на основе .env.example)
├── .htaccess
├── package.json
└── package-lock.json
```

### 3. Настройка базы данных MySQL

1. Создайте базу данных MySQL через панель управления хостинга (например, cPanel)
2. Запишите параметры подключения:
   - Имя базы данных
   - Имя пользователя
   - Пароль
   - Хост (обычно localhost)

3. Создайте файл `.env` в корне public_html:
```env
DATABASE_URL="mysql://username:password@localhost:3306/database_name"
PORT=4000
JWT_SECRET=ваш_секретный_ключ_для_jwt
NODE_ENV=production
```

**Важно:** Замените `username`, `password` и `database_name` на реальные данные от вашего хостинга.

### 4. Установка и запуск

Подключитесь к серверу через SSH и выполните:

```bash
cd public_html

# Установка зависимостей
npm install

# Генерация Prisma Client для MySQL
npx prisma generate

# Применение миграций базы данных
npx prisma migrate deploy

# Или создание новой миграции (если нужно)
npx prisma migrate dev --name init_mysql

# Запуск приложения
npm start
```

### 5. Настройка для постоянной работы

Для того чтобы приложение работало постоянно, используйте один из вариантов:

#### Вариант A: PM2 (рекомендуется)
```bash
npm install -g pm2
pm2 start src/index.js --name vargos-backend
pm2 save
pm2 startup
```

#### Вариант B: Forever
```bash
npm install -g forever
forever start src/index.js
```

#### Вариант C: systemd service (если есть root доступ)
Создайте файл `/etc/systemd/system/vargos.service`:
```ini
[Unit]
Description=Vargos Backend Service
After=network.target

[Service]
Type=simple
User=your_username
WorkingDirectory=/path/to/public_html
Environment=NODE_ENV=production
ExecStart=/usr/bin/node src/index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Затем:
```bash
sudo systemctl enable vargos
sudo systemctl start vargos
```

### 6. Настройка .htaccess для Apache

Файл `.htaccess` уже создан в проекте. Он настроит перенаправление запросов к API.

### 7. Важные замечания

- **Безопасность:** Убедитесь, что файл `.env` не доступен публично
- **Порты:** На shared хостинге порт может быть назначен автоматически. Проверьте документацию хостинга
- **CORS:** Настройте CORS в зависимости от вашего домена
- **Логи:** Проверяйте логи приложения для отладки: `pm2 logs` или `forever logs`

### 8. Миграция данных из PostgreSQL в MySQL (если нужно)

Если у вас уже есть данные в PostgreSQL:

1. Экспортируйте данные из PostgreSQL
2. Адаптируйте SQL для MySQL (синтаксис может отличаться)
3. Импортируйте в MySQL базу данных

Или используйте инструменты миграции, такие как:
- pgloader
- Prisma Introspection

### 9. Тестирование

После развертывания проверьте:
```bash
# Проверка работоспособности API
curl http://ваш-домен.com/health

# Должен вернуть: {"status":"ok"}
```

### 10. Обновление приложения

При обновлении кода:
```bash
cd public_html
git pull  # если используете git
npm install  # если были изменения в зависимостях
npx prisma migrate deploy  # если были изменения в схеме БД
pm2 restart vargos-backend  # перезапуск приложения
```

## Часто встречающиеся проблемы

### Проблема: "Cannot find module"
**Решение:** Убедитесь что выполнили `npm install` и `npx prisma generate`

### Проблема: Ошибка подключения к базе данных
**Решение:** Проверьте правильность DATABASE_URL в .env файле

### Проблема: Приложение останавливается
**Решение:** Используйте PM2 или Forever для автоматического перезапуска

### Проблема: Порт занят
**Решение:** Измените PORT в .env файле или убейте процесс на этом порту

## Контакты поддержки

Для вопросов и проблем создавайте issue в репозитории проекта.
