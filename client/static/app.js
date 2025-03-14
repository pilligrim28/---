let map;
let markers = {};

// Инициализация карты
function initMap() {
    map = L.map('map', {
        attributionControl: false,
        zoomControl: false
    }).setView([55.751244, 37.618423], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        className: 'neon-tiles',
        attribution: ''
    }).addTo(map);

    loadSubscribers();
}

// Загрузка абонентов
async function loadSubscribers() {
    try {
        const response = await fetch('/api/subscribers');
        const subscribers = await response.json();
        updateSubscriberList(subscribers);
        updateMap(subscribers);
    } catch (error) {
        console.error('Ошибка загрузки абонентов:', error);
    }
}
function showMainPanel() {
  
document.getElementById('bsuStatus').textContent = 'Подключено';
document.getElementById('bsuStatus').style.color = 'green'; // Скрываем панель входа
}

// Обновление списка абонентов
function updateSubscriberList(subscribers) {
    const list = document.getElementById('subscribers');
    list.innerHTML = '';

    subscribers.forEach(sub => {
        const item = document.createElement('div');
        item.className = 'subscriber-item';
        item.innerHTML = `
            <img src="/static/icons/${sub.icon}.png" alt="${sub.icon}">
            <span>${sub.name} (${sub.id})</span>
        `;
        list.appendChild(item);
    });
}

// Обновление карты с маркерами
function updateMap(subscribers) {
    Object.values(markers).forEach(marker => map.removeLayer(marker));
    markers = {};

    subscribers.forEach(sub => {
        const marker = L.marker([sub.lat, sub.lon], {
            icon: createNeonIcon(sub.icon)
        }).bindPopup(`Абонент: ${sub.name}<br>ID: ${sub.id}`)
          .addTo(map);
        markers[sub.id] = marker;
    });
}

// Создание иконки
function createNeonIcon(iconType) {
    return L.divIcon({
        className: 'neon-marker',
        html: `<img src="/icons/${iconType}.png" alt="${iconType}" class="marker-icon">`,
        iconSize: [30, 30]
    });
}
async function connectToBSU() {
    const ip = document.getElementById('bsuIp').value || '10.21.50.5';
    const port = document.getElementById('bsuPort').value || 2323;
    
    // Показываем модальное окно для ввода ID диспетчера
    const dispatcherId = prompt('Введите ID диспетчера:');
    if (!dispatcherId) {
        alert('ID диспетчера не указан');
        return;
    }

    try {
        const response = await fetch(`http://${ip}:${port}/api/connect`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ dispatcherId })
        });
        
        if (response.ok) {
            bsuConnected = true;
            currentDispatcherId = dispatcherId;
            document.getElementById('bsuStatus').textContent = 'Подключено';
            document.getElementById('bsuStatus').style.color = 'green';
            showMainPanel(); // Открываем основную панель
            loadGroups(); 
        } else {
            alert('Ошибка подключения к БСУ');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка сети');
    }
}

// Добавление абонента
async function addSubscriber() {
    const subId = document.getElementById('subId').value;
    const subName = document.getElementById('subName').value;
    const icon = document.querySelector('input[name="icon"]:checked').value;

    if (!subId || !subName) {
        alert('Заполните все поля');
        return;
    }

    const newSub = {
        id: subId,
        name: subName,
        icon: icon,
        lat: 55.751244 + (Math.random() - 0.5) * 0.1,
        lon: 37.618423 + (Math.random() - 0.5) * 0.1,
        status: 'active'
    };

    try {
        const response = await fetch('/api/subscribers', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(newSub)
        });
        
        if (response.ok) {
            alert('Абонент успешно добавлен!');
            loadSubscribers();
            closeModal();
        } else {
            alert('Ошибка при добавлении абонента');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка сети');
    }
}

// Подключение к БСУ


// app.js
let bsuConnected = false;
let currentDispatcherId = null;

// Показать модальное окно подключения
function showConnectModal() {
    document.getElementById('connectModal').style.display = 'block';
}

// Основная функция подключения
// Удалить дублирующуюся функцию connectToBSU()
// Оставить только эту реализацию:

async function connectToBSU() {
    const ip = document.getElementById('bsuIp').value;
    const port = document.getElementById('bsuPort').value;
    const dispatcherId = document.getElementById('dispatcherId').value;

    try {
        const response = await fetch('/api/connect-bsu', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ ip, port, dispatcherId })
        });
        
        if (response.ok) {
            const data = await response.json();
            currentDispatcherId = data.dispatcherId;
            updateConnectionStatus(true);
            loadGroups();
            showMainPanel();
        } else {
            alert('Ошибка подключения: ' + await response.text());
        }
    } catch (error) {
        console.error('Ошибка:', error);
        updateConnectionStatus(false);
    }
}

// Обновление статуса подключения
function updateConnectionStatus(isConnected) {
    const statusElement = document.getElementById('connectionStatus');
    statusElement.textContent = isConnected ? "Статус: Подключено" : "Статус: Не подключено";
    statusElement.style.color = isConnected ? "#00ff00" : "#ff0000";
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    document.getElementById('loginPanel').style.display = 'none';
    showConnectModal();
});

function showMainPanel() {
    document.getElementById('mainPanel').style.display = 'block';
    document.getElementById('loginPanel').style.display = 'none';
}

// Загрузка групп


// Загрузка групп при подключении к БСУ
async function loadGroups() {
    if (!bsuConnected) {
        alert('Сначала подключитесь к БСУ');
        return;
    }

    try {
        const response = await fetch(`/api/dispatchers/${currentDispatcherId}/groups`);
        const groups = await response.json();
        renderGroups(groups);
    } catch (error) {
        console.error('Ошибка загрузки групп:', error);
    }
}

// Отображение групп
function renderGroups(groups) {
    const container = document.getElementById('groupsContainer');
    container.innerHTML = '';

    groups.forEach(group => {
        const panel = document.createElement('div');
        panel.className = 'group-panel';
        panel.innerHTML = `
            <h4>${group.name}</h4>
            <button class="ptt-button" onclick="startCall('${group.id}')">PTT</button>
            <button class="message-button" onclick="sendMessage('${group.id}')">✉️</button>
            <button class="mute-button" onclick="toggleMute('${group.id}')">🔇</button>
        `;
        container.appendChild(panel);
    });
}

// Инициализация вызова
function startCall(groupId) {
    console.log(`Начало вызова группы ${groupId}`);
    // Логика для начала вызова по DMR
}

// Отправка сообщения
function sendMessage(groupId) {
    console.log(`Отправка сообщения группе ${groupId}`);
    // Логика для отправки сообщения
}

// Включение/выключение звука
function toggleMute(groupId) {
    console.log(`Переключение звука группы ${groupId}`);
    // Логика для управления звуком
}
// Отображение групп
function renderGroups(groups) {
    const container = document.getElementById('groupsContainer');
    container.innerHTML = '';

    groups.forEach(group => {
        const panel = document.createElement('div');
        panel.className = 'group-panel';
        panel.innerHTML = `
            <h4>${group.name}</h4>
            <button class="ptt-button">PTT</button>
            <button class="message-button">✉️</button>
            <button class="mute-button">🔇</button>
        `;
        container.appendChild(panel);
    });
}

// Закрытие модального окна
function closeModal() {
    document.getElementById('addSubscriberModal').style.display = 'none';
    document.getElementById('settingsModal').style.display = 'none';
}

// Показать форму добавления
function showAddForm() {
    document.getElementById('addSubscriberModal').style.display = 'flex';
}

// Показать настройки
function showSettings() {
    document.getElementById('settingsModal').style.display = 'flex';
}

// Сохранение настроек
function saveSettings() {
    const ip = document.getElementById('bsuIp').value;
    const port = document.getElementById('bsuPort').value;

    if (!ip || !port) {
        alert('Заполните все поля');
        return;
    }

    localStorage.setItem('bsuSettings', JSON.stringify({ ip, port }));
    alert('Настройки сохранены!');
    closeModal();
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    initMap();
});

// Функция подключения к БСУ


// Обновление статуса подключения
function updateConnectionStatus(isConnected) {
    const statusElement = document.getElementById('connectionStatus');
    statusElement.textContent = isConnected ? "Подключено" : "Не подключено";
    statusElement.style.color = isConnected ? "#00ff00" : "#ff0000";
}

// Загрузка списка диспетчеров
async function loadDispatcherList() {
    try {
        const response = await fetch('/api/dispatchers');
        const dispatchers = await response.json();
        renderDispatchers(dispatchers);
    } catch (error) {
        console.error('Ошибка загрузки диспетчеров:', error);
    }
}