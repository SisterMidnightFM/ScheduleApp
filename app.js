// Configuration loaded from config.js
const CALENDAR_ID = CONFIG.CALENDAR_ID;
const API_KEY = CONFIG.API_KEY;

// Global state
let canvas = document.getElementById('previewCanvas');
let ctx = canvas.getContext('2d');
let backgroundImage = null;
let customFont = null;
let currentMode = 'manual';
let calendarEvents = [];

const DATE_FONT_SIZE = 32;
let showFontSize = 35;

window.onload = function () {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date-picker').value = today;
    loadCustomFont();
    loadBackgroundImage();
    addInputRow();
    addInputRow();
};

function loadCustomFont() {
    const font = new FontFace('ReworkText', 'url("ReworkText-Semibold.otf")');
    font.load().then(function (loadedFont) {
        document.fonts.add(loadedFont);
        customFont = loadedFont;
        updateCanvas();
    }).catch(function (error) {
        console.error('Error loading custom font:', error);
    });
}

function loadBackgroundImage() {
    backgroundImage = new Image();
    backgroundImage.onload = function () {
        updateCanvas();
    };
    backgroundImage.onerror = function () {
        console.error('Error loading background image');
    };
    backgroundImage.src = 'schedule-template.png';
}

function setMode(mode) {
    currentMode = mode;
    document.getElementById('manual-btn').classList.toggle('active', mode === 'manual');
    document.getElementById('calendar-btn').classList.toggle('active', mode === 'calendar');
    document.getElementById('manual-section').classList.toggle('active', mode === 'manual');
    document.getElementById('calendar-section').classList.toggle('active', mode === 'calendar');
    updateCanvas();
}

function addInputRow() {
    const inputsContainer = document.getElementById('schedule-inputs');
    const newRow = document.createElement('div');
    newRow.className = 'input-row';

    const showNameInput = document.createElement('input');
    showNameInput.className = 'input-field';
    showNameInput.placeholder = 'Show Name';
    showNameInput.addEventListener('input', updateCanvas);

    const showTimeInput = document.createElement('input');
    showTimeInput.className = 'input-field';
    showTimeInput.placeholder = 'Time (e.g., 2-4PM)';
    showTimeInput.style.maxWidth = '120px';
    showTimeInput.addEventListener('input', updateCanvas);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-row-btn';
    removeBtn.innerHTML = '&times;';
    removeBtn.onclick = function () {
        newRow.remove();
        updateCanvas();
    };

    newRow.appendChild(showNameInput);
    newRow.appendChild(showTimeInput);
    newRow.appendChild(removeBtn);
    inputsContainer.appendChild(newRow);
}

async function fetchCalendarEvents() {
    const datePicker = document.getElementById('date-picker');
    const selectedDate = datePicker.value;
    const statusEl = document.getElementById('calendar-status');
    const fetchBtn = document.getElementById('fetch-btn');

    if (!selectedDate) {
        statusEl.textContent = 'Please select a date first';
        statusEl.className = 'calendar-status error';
        return;
    }

    if (API_KEY === 'YOUR_API_KEY_HERE' || !API_KEY) {
        statusEl.textContent = 'API key not configured. Add your Google API key to config.js.';
        statusEl.className = 'calendar-status error';
        return;
    }

    fetchBtn.disabled = true;
    statusEl.textContent = 'Fetching events...';
    statusEl.className = 'calendar-status';

    try {
        const startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);

        let apiUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?`;
        apiUrl += `timeMin=${encodeURIComponent(startDate.toISOString())}&`;
        apiUrl += `timeMax=${encodeURIComponent(endDate.toISOString())}&`;
        apiUrl += `singleEvents=true&orderBy=startTime&key=${API_KEY}`;

        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();

        if (data.items && data.items.length > 0) {
            calendarEvents = data.items.map(event => ({
                name: event.summary || 'Untitled',
                startTime: event.start.dateTime || event.start.date,
                endTime: event.end.dateTime || event.end.date
            }));
            statusEl.textContent = `Found ${calendarEvents.length} show(s)`;
            statusEl.className = 'calendar-status success';
        } else {
            calendarEvents = [];
            statusEl.textContent = 'No shows found for this date';
            statusEl.className = 'calendar-status';
        }

        updateCanvas();
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        statusEl.textContent = 'Error fetching events. Check console for details.';
        statusEl.className = 'calendar-status error';
    } finally {
        fetchBtn.disabled = false;
    }
}

function formatTime(isoString) {
    const date = new Date(isoString);
    let hours = date.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}${ampm}`;
}

function formatTimeRange(startTime, endTime) {
    return `${formatTime(startTime)}-${formatTime(endTime)}`;
}

function getScheduleData() {
    if (currentMode === 'manual') {
        const data = [];
        document.querySelectorAll('.input-row').forEach(row => {
            const name = row.children[0].value.trim();
            const time = row.children[1].value.trim();
            if (name || time) data.push({ name, time });
        });
        return data;
    }
    return calendarEvents.map(event => ({
        name: event.name,
        time: formatTimeRange(event.startTime, event.endTime)
    }));
}

function increaseFontSize() {
    showFontSize = Math.min(showFontSize + 2, 80);
    document.getElementById('font-size-value').textContent = showFontSize + 'px';
    updateCanvas();
}

function decreaseFontSize() {
    showFontSize = Math.max(showFontSize - 2, 20);
    document.getElementById('font-size-value').textContent = showFontSize + 'px';
    updateCanvas();
}

function getOrdinalSuffix(n) {
    const j = n % 10, k = n % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
}

function wrapText(text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0] || '';
    for (let i = 1; i < words.length; i++) {
        const testLine = currentLine + ' ' + words[i];
        if (ctx.measureText(testLine).width < maxWidth) {
            currentLine = testLine;
        } else {
            lines.push(currentLine);
            currentLine = words[i];
        }
    }
    lines.push(currentLine);
    return lines;
}

function updateCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (backgroundImage && backgroundImage.complete) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#C4B8AD';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.fillStyle = '#352B27';

    const selectedDate = document.getElementById('date-picker').value;
    let dateTextWidth = 0;

    if (selectedDate) {
        ctx.font = `${DATE_FONT_SIZE}px ReworkText, Arial`;
        const dateObj = new Date(selectedDate + 'T12:00:00');
        const day = dateObj.toLocaleString('en-US', { weekday: 'long' });
        const dayNumber = dateObj.getDate();
        const month = dateObj.toLocaleString('en-US', { month: 'long' });
        const year = dateObj.getFullYear();
        const formattedDate = `${day.toUpperCase()} ${dayNumber}${getOrdinalSuffix(dayNumber).toUpperCase()} ${month.toUpperCase()} ${year}`;

        dateTextWidth = ctx.measureText(formattedDate).width;
        ctx.textAlign = 'center';
        ctx.fillText(formattedDate, canvas.width / 2, 380);
    }

    ctx.font = `${showFontSize}px ReworkText, Arial`;
    const scheduleData = getScheduleData();
    const leftMargin = dateTextWidth > 0 ? (canvas.width - dateTextWidth) / 2 : 100;
    const rightMargin = dateTextWidth > 0 ? (canvas.width + dateTextWidth) / 2 : canvas.width - 100;
    const topMargin = 500;
    const bottomMargin = canvas.height - 200;
    const lineHeight = showFontSize * 1.4;
    const maxNameWidth = (rightMargin - leftMargin) * 0.60;

    let currentY = topMargin;

    scheduleData.forEach(item => {
        if (currentY > bottomMargin) return;

        const displayName = item.name.toUpperCase();
        const displayTime = item.time.toUpperCase();
        const wrappedLines = wrapText(displayName, maxNameWidth);
        const startY = currentY;

        ctx.textAlign = 'left';
        wrappedLines.forEach((line, index) => {
            if (currentY > bottomMargin) return;
            ctx.fillText(line, leftMargin, currentY);
            if (index < wrappedLines.length - 1) currentY += lineHeight;
        });

        ctx.textAlign = 'right';
        const timeCenterY = startY + ((wrappedLines.length - 1) * lineHeight) / 2;
        ctx.fillText(displayTime, rightMargin, timeCenterY);

        currentY += lineHeight + 40;
    });
}

function downloadImage() {
    const selectedDate = document.getElementById('date-picker').value || new Date().toISOString().split('T')[0];
    try {
        const dataURL = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `smfm-schedule-${selectedDate}.png`;
        link.href = dataURL;
        link.click();
    } catch (error) {
        console.error('Error downloading image:', error);
        alert('Error downloading image. This may be due to CORS restrictions with the background image.');
    }
}
