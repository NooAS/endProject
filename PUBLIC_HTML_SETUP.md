# Инструкция по переносу проекта в public_html

## Подготовка файлов для хостинга

### Шаг 1: Копирование файлов

Скопируйте все файлы из папки `vargos-backend` в папку `public_html` на вашем хостинге:

```
public_html/
├── .env                    (создать из .env.example)
├── .htaccess               (уже включен)
├── .gitignore
├── package.json
├── package-lock.json
├── nodemon.json
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── public/                 (статические файлы)
│   ├── css/
│   ├── js/
│   └── index.html
└── src/                    (серверный код)
    ├── controllers/
    ├── middlewares/
    ├── routes/
    ├── db/
    └── index.js
```

### Шаг 2: Изменения в коде НЕ ТРЕБУЮТСЯ

Все пути в коде остаются относительными, поэтому переименование папки из `vargos-backend` в `public_html` не требует изменений в коде.

### Шаг 3: Настройка базы данных

1. Создайте MySQL базу данных через панель управления хостингом
2. Скопируйте `.env.example` в `.env`
3. Обновите `DATABASE_URL` в `.env` с учетом ваших данных от хостинга:

```env
DATABASE_URL="mysql://your_db_user:your_db_password@localhost:3306/your_db_name"
```

### Шаг 4: Установка зависимостей

Через SSH выполните:

```bash
cd public_html
npm install
npx prisma generate
npx prisma migrate deploy
```

### Шаг 5: Запуск приложения

```bash
npm start
```

Или для постоянной работы:

```bash
npm install -g pm2
pm2 start src/index.js --name vargos
pm2 save
```

## Важные примечания

### База данных изменена с PostgreSQL на MySQL

- Prisma schema теперь использует MySQL провайдер
- Все миграции совместимы с MySQL
- Убедитесь, что на хостинге установлен MySQL (не PostgreSQL)

### Статические файлы

Все HTML, CSS, и JavaScript файлы находятся в папке `public/` и доступны напрямую:
- `http://ваш-домен.com/index.html`
- `http://ваш-домен.com/css/style.css`
- `http://ваш-домен.com/js/script.js`

### API Endpoints

API доступно по следующим путям:
- `/health` - проверка работоспособности
- `/auth/*` - авторизация
- `/categories/*` - категории
- `/jobs/*` - работы
- `/quotes/*` - котировки

### Безопасность

- Файл `.env` защищен через `.htaccess`
- Папки `src/`, `node_modules/`, `prisma/migrations/` недоступны извне
- Настроены заголовки безопасности

## Дополнительная информация

Подробное руководство по развертыванию смотрите в файле [DEPLOYMENT.md](../DEPLOYMENT.md)
