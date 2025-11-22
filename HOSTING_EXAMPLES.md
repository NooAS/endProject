# Примеры конфигурации для различных хостингов

## Shared Hosting (cPanel)

### Шаг 1: Node.js Setup через cPanel
1. В cPanel найдите "Setup Node.js App"
2. Создайте приложение:
   - Node.js version: 18.x или выше
   - Application mode: Production
   - Application root: public_html
   - Application URL: ваш-домен.com
   - Application startup file: src/index.js

### Шаг 2: Переменные окружения
В разделе "Environment Variables" добавьте:
```
DATABASE_URL=mysql://db_user:db_pass@localhost:3306/db_name
JWT_SECRET=ваш_секретный_ключ
PORT=порт_назначенный_хостингом
NODE_ENV=production
```

### Шаг 3: Команды установки
```bash
npm install
npx prisma generate
npx prisma migrate deploy
```

## VPS / Cloud Server (Ubuntu/Debian)

### Установка зависимостей

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Установка MySQL
sudo apt install -y mysql-server
sudo mysql_secure_installation

# Установка PM2 глобально
sudo npm install -g pm2
```

### Настройка базы данных

```bash
sudo mysql
```

```sql
CREATE DATABASE vargos_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'vargos_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON vargos_db.* TO 'vargos_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Развертывание приложения

```bash
# Переход в директорию
cd /var/www/html  # или /home/user/public_html

# Клонирование репозитория (или загрузка файлов)
git clone https://github.com/NooAS/endProject.git
cd endProject/vargos-backend

# Установка
npm install

# Настройка .env
cp .env.example .env
nano .env  # Отредактируйте DATABASE_URL и другие параметры

# Миграции
npx prisma generate
npx prisma migrate deploy

# Запуск с PM2
pm2 start src/index.js --name vargos
pm2 save
pm2 startup
```

### Настройка Nginx как reverse proxy

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Статические файлы
    location / {
        root /var/www/html/endProject/vargos-backend/public;
        try_files $uri $uri/ /index.html;
    }

    # API прокси
    location /api/ {
        proxy_pass http://localhost:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location ~ ^/(categories|jobs|auth|quotes|health) {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Активируйте конфигурацию:
```bash
sudo ln -s /etc/nginx/sites-available/vargos /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL с Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Docker (опционально)

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

EXPOSE 4000

CMD ["npm", "start"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=mysql://root:password@db:3306/vargos_db
      - JWT_SECRET=your_secret_key
      - NODE_ENV=production
    depends_on:
      - db
    volumes:
      - ./prisma:/app/prisma

  db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=password
      - MYSQL_DATABASE=vargos_db
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"

volumes:
  mysql_data:
```

Запуск:
```bash
docker-compose up -d
docker-compose exec app npx prisma migrate deploy
```

## Vercel / Netlify (для фронтенда)

Эти платформы подходят только для статических файлов и serverless функций. Для полноценного Node.js приложения используйте:
- Railway
- Render
- Heroku
- Digital Ocean App Platform

### Railway

1. Подключите GitHub репозиторий
2. Добавьте MySQL плагин
3. Настройте переменные окружения:
   - `DATABASE_URL` (автоматически из MySQL плагина)
   - `JWT_SECRET`
   - `NODE_ENV=production`
4. Railway автоматически обнаружит `npm start` команду

### Render

1. Создайте Web Service из GitHub репозитория
2. Добавьте MySQL базу данных
3. Настройте:
   - Build Command: `npm install && npx prisma generate`
   - Start Command: `npm start`
   - Environment Variables: DATABASE_URL, JWT_SECRET

## Общие рекомендации

### Безопасность
- Всегда используйте сильные пароли для БД
- Держите `.env` в секрете
- Используйте HTTPS в продакшене
- Регулярно обновляйте зависимости: `npm audit fix`

### Мониторинг
```bash
# Логи PM2
pm2 logs vargos

# Статус приложения
pm2 status

# Мониторинг ресурсов
pm2 monit
```

### Backup базы данных
```bash
# Создание backup
mysqldump -u username -p database_name > backup_$(date +%Y%m%d).sql

# Восстановление
mysql -u username -p database_name < backup_20231122.sql
```

### Автоматические backup (cron)
```bash
crontab -e
```

Добавьте:
```
0 2 * * * mysqldump -u username -ppassword database_name > /path/to/backups/backup_$(date +\%Y\%m\%d).sql
```

## Решение проблем

### Приложение не запускается
```bash
# Проверьте логи
pm2 logs

# Проверьте порты
netstat -tulpn | grep :4000

# Проверьте переменные окружения
pm2 env 0
```

### Ошибки базы данных
```bash
# Проверьте подключение
mysql -u username -p -h localhost database_name

# Проверьте миграции
npx prisma migrate status
```

### Высокая нагрузка
```bash
# Мониторинг
pm2 monit

# Рестарт приложения
pm2 restart vargos

# Кластеризация (запуск нескольких инстансов)
pm2 start src/index.js -i max --name vargos
```
