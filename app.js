// Configuration loaded from config.js
const CALENDAR_ID = typeof CONFIG !== 'undefined' ? CONFIG.CALENDAR_ID : null;
const API_KEY     = typeof CONFIG !== 'undefined' ? CONFIG.API_KEY     : null;

function getCSSVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// Global state
let canvas = document.getElementById('previewCanvas');
let ctx = canvas.getContext('2d');
let upperImage = null;
let paperTexture = null;
let customFont = null;
let currentMode = 'manual';
let calendarEvents = [];

const DATE_FONT_SIZE = 32;
let showFontSize = LAYOUT_CONFIG.columns.defaultFontSize;
let rowGap = LAYOUT_CONFIG.columns.defaultRowGap;
let selectedBgColor = LAYOUT_CONFIG.colours[0].bg;
let selectedTextColor = LAYOUT_CONFIG.colours[0].text;

window.onload = function () {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date-picker').value = today;
    document.getElementById('font-size-value').textContent = showFontSize + 'px';
    document.getElementById('row-gap-value').textContent = rowGap + 'px';
    buildColourCombos();
    loadCustomFont();
    loadUpperImage();
    loadPaperTexture();
    addInputRow();
    addInputRow();
};

function loadCustomFont() {
    const font = new FontFace('SisterMidnight', 'url("assets/fonts/SisterMidnight-Regular.ttf")');
    font.load().then(function (loadedFont) {
        document.fonts.add(loadedFont);
        customFont = loadedFont;
        updateCanvas();
    }).catch(function (error) {
        console.error('Error loading custom font:', error);
    });
}

function loadUpperImage() {
    upperImage = new Image();
    upperImage.onload = function () { updateCanvas(); };
    upperImage.onerror = function () { console.error('Error loading upper image'); };
    upperImage.src = 'assets/UpperImage.svg';
}

function loadPaperTexture() {
    paperTexture = new Image();
    paperTexture.onload = function () { updateCanvas(); };
    paperTexture.onerror = function () { console.error('Error loading paper texture'); };
    paperTexture.src = 'assets/PAPER EFFECT.png';
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
        statusEl.textContent = 'API key not configured. Add your Google API key to .env.';
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

function buildColourCombos() {
    const grid = document.getElementById('colourComboGrid');
    LAYOUT_CONFIG.colours.forEach((combo, i) => {
        const btn = document.createElement('button');
        btn.className = 'combo-swatch' + (i === 0 ? ' active' : '');
        btn.dataset.text = combo.text;
        btn.dataset.bg = combo.bg;
        btn.onclick = function () { selectColorCombo(this); };
        btn.innerHTML = `
            <span class="combo-preview">
                <span class="combo-top" style="background:${combo.text}"></span>
                <span class="combo-bottom" style="background:${combo.bg}"></span>
            </span>
            <span class="combo-label">${combo.label}</span>
        `;
        grid.appendChild(btn);
    });
}

function selectColorCombo(btn) {
    document.querySelectorAll('.combo-swatch').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    selectedBgColor = btn.dataset.bg;
    selectedTextColor = btn.dataset.text;
    updateCanvas();
}

function drawTintedImage(img, x, y, drawWidth, drawHeight) {
    const offscreen = document.createElement('canvas');
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const offCtx = offscreen.getContext('2d');
    offCtx.drawImage(img, x, y, drawWidth, drawHeight);
    offCtx.globalCompositeOperation = 'source-in';
    offCtx.fillStyle = selectedTextColor;
    offCtx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(offscreen, 0, 0);
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

function increaseRowGap() {
    rowGap = Math.min(rowGap + 5, 200);
    document.getElementById('row-gap-value').textContent = rowGap + 'px';
    updateCanvas();
}

function decreaseRowGap() {
    rowGap = Math.max(rowGap - 5, 0);
    document.getElementById('row-gap-value').textContent = rowGap + 'px';
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

    ctx.fillStyle = selectedBgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (upperImage && upperImage.complete) {
        const drawWidth = upperImage.naturalWidth * LAYOUT_CONFIG.upperImage.scale;
        const drawHeight = upperImage.naturalHeight * LAYOUT_CONFIG.upperImage.scale;
        const x = LAYOUT_CONFIG.upperImage.x !== null
            ? LAYOUT_CONFIG.upperImage.x
            : (canvas.width - drawWidth) / 2;
        drawTintedImage(upperImage, x, LAYOUT_CONFIG.upperImage.y, drawWidth, drawHeight);
    }

    ctx.fillStyle = selectedTextColor;

    const selectedDate = document.getElementById('date-picker').value;

    if (selectedDate) {
        const dateObj = new Date(selectedDate + 'T12:00:00');
        const day = dateObj.toLocaleString('en-US', { weekday: 'long' });
        const dayNumber = dateObj.getDate();
        const month = dateObj.toLocaleString('en-US', { month: 'long' });
        const year = dateObj.getFullYear();

        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';

        // Fit day-of-week text to canvas width minus widthInset
        const dd = LAYOUT_CONFIG.dateDisplay;
        const dayText = day.toUpperCase();
        const targetWidth = canvas.width - dd.widthInset;
        let dayFontSize = 300;
        for (let i = 0; i < 6; i++) {
            ctx.font = `${dayFontSize}px SisterMidnight, Arial`;
            ctx.letterSpacing = `${(-0.04 * dayFontSize).toFixed(2)}px`;
            const w = ctx.measureText(dayText).width;
            dayFontSize = Math.round(dayFontSize * (targetWidth / w));
        }
        ctx.font = `${dayFontSize}px SisterMidnight, Arial`;
        ctx.letterSpacing = `${(-0.04 * dayFontSize).toFixed(2)}px`;
        const dayMetrics = ctx.measureText(dayText);
        const dayY = canvas.height - dd.bottomPadding - dayMetrics.actualBoundingBoxDescent;
        ctx.fillText(dayText, dd.leftMargin, dayY);

        // Draw smaller date string above the day name, centred
        const dateStr = `${dayNumber}${getOrdinalSuffix(dayNumber)} ${month.toUpperCase()} ${year}`;
        ctx.font = `${dd.smallFontSize}px SisterMidnight, Arial`;
        ctx.letterSpacing = `${(-0.04 * dd.smallFontSize).toFixed(2)}px`;
        const smallDateY = dayY - dayMetrics.actualBoundingBoxAscent - dd.gapAboveDay;
        ctx.textAlign = 'center';
        ctx.fillText(dateStr, canvas.width / 2, smallDateY);
        ctx.textAlign = 'left';
    }

    ctx.font = `${showFontSize}px FOSSModern, Arial`;
    ctx.letterSpacing = `${(-0.06 * showFontSize).toFixed(2)}px`;
    ctx.textBaseline = 'middle';
    const scheduleData = getScheduleData();
    const leftMargin = LAYOUT_CONFIG.columns.leftMargin;
    const rightMargin = canvas.width - LAYOUT_CONFIG.columns.rightEdgeInset;
    const topMargin = 500;
    const bottomMargin = canvas.height - 200;
    const lineHeight = showFontSize * 0.90;
    const maxNameWidth = (rightMargin - leftMargin) * LAYOUT_CONFIG.columns.nameWidthRatio;

    let currentY = topMargin;

    scheduleData.forEach(item => {
        if (currentY > bottomMargin) return;

        const displayName = item.name.toUpperCase();
        const displayTime = item.time.toUpperCase();
        const wrappedLines = wrapText(displayName, maxNameWidth);

        ctx.textAlign = 'left';
        wrappedLines.forEach((line, index) => {
            const lineY = currentY + index * lineHeight;
            if (lineY > bottomMargin) return;
            ctx.fillText(line, leftMargin, lineY);
        });

        ctx.textAlign = 'right';
        const timeCenterY = currentY + ((wrappedLines.length - 1) * lineHeight) / 2;
        ctx.fillText(displayTime, rightMargin, timeCenterY);

        currentY += wrappedLines.length * lineHeight + rowGap;
    });

    ctx.textBaseline = 'alphabetic';

    if (paperTexture && paperTexture.complete) {
        ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(paperTexture, 0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';
    }
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
