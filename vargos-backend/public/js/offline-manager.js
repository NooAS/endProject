// Service Worker Registration and Management

let swRegistration = null;
let isOnline = navigator.onLine;

// Регистрация Service Worker
export async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        console.warn('Service Worker не поддерживается в этом браузере');
        return null;
    }

    try {
        swRegistration = await navigator.serviceWorker.register('/service-worker.js', {
            scope: '/'
        });
        
        console.log('Service Worker зарегистрирован:', swRegistration.scope);
        
        // Обработка обновлений Service Worker
        swRegistration.addEventListener('updatefound', () => {
            const newWorker = swRegistration.installing;
            console.log('Найдено обновление Service Worker');
            
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // Новый Service Worker установлен, показываем уведомление
                    showUpdateNotification();
                }
            });
        });

        return swRegistration;
    } catch (error) {
        console.error('Ошибка регистрации Service Worker:', error);
        return null;
    }
}

// Показать уведомление об обновлении
function showUpdateNotification() {
    const notification = document.createElement('div');
    notification.id = 'sw-update-notification';
    notification.style.cssText = `
        position: fixed;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        background: #3b82f6;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10001;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 12px;
    `;
    
    notification.innerHTML = `
        <span>Доступна новая версия приложения</span>
        <button id="sw-update-btn" style="
            background: white;
            color: #3b82f6;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 600;
        ">Обновить</button>
    `;
    
    document.body.appendChild(notification);
    
    document.getElementById('sw-update-btn').addEventListener('click', () => {
        if (swRegistration && swRegistration.waiting) {
            swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
        }
    });
}

// Отслеживание статуса подключения
export function initConnectionMonitoring() {
    const updateOnlineStatus = () => {
        const wasOnline = isOnline;
        isOnline = navigator.onLine;
        
        if (wasOnline !== isOnline) {
            showConnectionStatus(isOnline);
            
            if (isOnline) {
                // Когда соединение восстановлено, пытаемся синхронизировать данные
                syncOfflineData();
            }
        }
    };
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Показываем начальный статус
    if (!isOnline) {
        showConnectionStatus(false);
    }
}

// Показать статус подключения
function showConnectionStatus(online) {
    let statusBar = document.getElementById('connection-status');
    
    if (!statusBar) {
        statusBar = document.createElement('div');
        statusBar.id = 'connection-status';
        statusBar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            padding: 8px;
            text-align: center;
            font-size: 13px;
            font-weight: 600;
            z-index: 10002;
            transition: transform 0.3s;
        `;
        document.body.appendChild(statusBar);
    }
    
    if (online) {
        statusBar.style.backgroundColor = '#10b981';
        statusBar.style.color = 'white';
        statusBar.textContent = '✓ Соединение восстановлено';
        statusBar.style.transform = 'translateY(0)';
        
        setTimeout(() => {
            statusBar.style.transform = 'translateY(-100%)';
        }, 3000);
    } else {
        statusBar.style.backgroundColor = '#ef4444';
        statusBar.style.color = 'white';
        statusBar.textContent = '⚠ Нет подключения к интернету. Работа в оффлайн-режиме.';
        statusBar.style.transform = 'translateY(0)';
    }
}

// Синхронизация данных после восстановления соединения
async function syncOfflineData() {
    console.log('Синхронизация оффлайн данных...');
    
    // Проверяем наличие несохраненных данных
    const draftData = localStorage.getItem('project_draft');
    const token = localStorage.getItem('token');
    
    if (draftData && token) {
        try {
            // Отправляем данные на сервер
            if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'SYNC_DATA',
                    data: draftData
                });
            }
            
            console.log('Оффлайн данные синхронизированы');
        } catch (error) {
            console.error('Ошибка синхронизации:', error);
        }
    }
}

// Проверка возможности работы оффлайн
export function isOfflineCapable() {
    return ('serviceWorker' in navigator) && 
           ('caches' in window) && 
           ('indexedDB' in window);
}

// Получить статус Service Worker
export async function getServiceWorkerStatus() {
    if (!('serviceWorker' in navigator)) {
        return { supported: false };
    }
    
    const registration = await navigator.serviceWorker.getRegistration();
    
    return {
        supported: true,
        registered: !!registration,
        active: registration && !!registration.active,
        waiting: registration && !!registration.waiting,
        installing: registration && !!registration.installing
    };
}
