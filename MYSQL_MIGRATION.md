# Миграция с PostgreSQL на MySQL - Пошаговая инструкция

## ⚠️ ВАЖНО: Резервное копирование

Перед началом миграции обязательно создайте резервную копию вашей PostgreSQL базы данных!

```bash
pg_dump -U username -h localhost database_name > backup.sql
```

## Вариант 1: Новая база данных (рекомендуется для хостинга)

Если вы разворачиваете проект на новом хостинге с пустой MySQL базой данных:

### 1. Обновите .env файл

```env
DATABASE_URL="mysql://user:password@localhost:3306/database_name"
```

### 2. Удалите старые миграции (опционально)

```bash
cd public_html/prisma
rm -rf migrations/
```

### 3. Создайте новые миграции для MySQL

```bash
npx prisma migrate dev --name init_mysql
```

Это создаст новые миграции совместимые с MySQL.

### 4. Примените миграции

```bash
npx prisma migrate deploy
```

### 5. (Опционально) Импортируйте данные

Если у вас есть данные из PostgreSQL, экспортируйте их в CSV или JSON и импортируйте в MySQL.

## Вариант 2: Миграция существующих данных

Если вам нужно перенести существующие данные из PostgreSQL в MySQL:

### Шаг 1: Экспорт данных из PostgreSQL

Используйте Prisma Studio или SQL запросы для экспорта данных:

```bash
# Используйте Prisma Studio
npx prisma studio

# Или экспортируйте через SQL
pg_dump -U username -h localhost --data-only --column-inserts database_name > data.sql
```

### Шаг 2: Конвертация данных

Адаптируйте SQL для MySQL (основные различия):
- `SERIAL` → `INT AUTO_INCREMENT`
- `TEXT` → `TEXT` или `VARCHAR(255)`
- `BOOLEAN` → `TINYINT(1)`
- `DECIMAL(65,30)` → `DECIMAL(10,2)` или подходящий размер
- Двойные кавычки (`"`) → обратные кавычки (`` ` ``) или одинарные (`'`)

### Шаг 3: Создайте MySQL базу

```bash
mysql -u username -p
CREATE DATABASE database_name CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Шаг 4: Обновите .env и примените миграции

```env
DATABASE_URL="mysql://user:password@localhost:3306/database_name"
```

```bash
# Сбросьте и пересоздайте миграции для MySQL
rm -rf prisma/migrations/
npx prisma migrate dev --name init_mysql
```

### Шаг 5: Импортируйте данные

```bash
mysql -u username -p database_name < adapted_data.sql
```

## Вариант 3: Использование инструментов миграции

### pgloader (рекомендуется)

pgloader - инструмент для миграции из PostgreSQL в MySQL:

```bash
# Установка pgloader (Ubuntu/Debian)
sudo apt-get install pgloader

# Создайте файл конфигурации migration.load
cat > migration.load << EOF
LOAD DATABASE
     FROM postgresql://pg_user:pg_password@localhost/pg_database
     INTO mysql://mysql_user:mysql_password@localhost/mysql_database

WITH include drop, create tables, create indexes, reset sequences

SET MySQL PARAMETERS
    net_read_timeout  = '120',
    net_write_timeout = '120'

CAST type datetime to datetime drop not null drop default using zero-dates-to-null;
EOF

# Запустите миграцию
pgloader migration.load
```

## Проверка после миграции

После успешной миграции проверьте:

### 1. Структура базы данных

```bash
npx prisma db pull
npx prisma generate
```

### 2. Запустите приложение

```bash
npm start
```

### 3. Проверьте API

```bash
curl http://localhost:4000/health
# Должен вернуть: {"status":"ok"}
```

### 4. Проверьте данные

Войдите в приложение и убедитесь, что все данные на месте.

## Различия PostgreSQL vs MySQL

### Типы данных

| PostgreSQL | MySQL |
|------------|-------|
| SERIAL | INT AUTO_INCREMENT |
| TEXT | TEXT или VARCHAR |
| BOOLEAN | TINYINT(1) |
| TIMESTAMP | DATETIME или TIMESTAMP |
| JSONB | JSON |
| UUID | CHAR(36) или BINARY(16) |

### Синтаксис

| PostgreSQL | MySQL |
|------------|-------|
| "table_name" | \`table_name\` |
| RETURNING * | Не поддерживается напрямую |
| ILIKE | LIKE (case-insensitive по умолчанию) |

### Prisma автоматически обрабатывает большинство различий

Prisma Client генерирует правильные запросы для MySQL, поэтому код приложения не требует изменений.

## Решение проблем

### Ошибка: "Unknown database"
```bash
mysql -u root -p -e "CREATE DATABASE database_name CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### Ошибка: "Access denied"
Проверьте правильность DATABASE_URL в .env файле

### Ошибка: "Table doesn't exist"
Убедитесь, что выполнили `npx prisma migrate deploy`

### Ошибка миграции
Попробуйте сбросить базу и применить миграции заново:
```bash
npx prisma migrate reset
npx prisma migrate deploy
```

## Дополнительная помощь

Если возникают проблемы с миграцией, обратитесь к документации:
- [Prisma MySQL Guide](https://www.prisma.io/docs/concepts/database-connectors/mysql)
- [pgloader Documentation](https://pgloader.readthedocs.io/)
