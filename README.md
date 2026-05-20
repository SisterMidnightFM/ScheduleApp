# SMFM Schedule Generator

A browser-based tool for generating SMFM radio schedule images. Enter show names and times (manually or via Google Calendar), pick a colour combo, then download a 1080×1350px PNG ready for social media.

## Usage

Open `index.html` in a browser (or visit the deployed GitHub Pages URL).

1. **Date** — pick the broadcast date
2. **Input mode** — enter shows manually, or fetch them from Google Calendar
3. **Font size** — adjust with +/- to fit all shows on the image
4. **Colours** — pick a preset colour combo (top swatch = text & image colour, bottom = background)
5. **Download** — saves a full-resolution 1080×1350px PNG

## Deployment

No build step — it's a static site. Push to GitHub and enable GitHub Pages.

```bash
git remote add origin https://github.com/SisterMidnightFM/ScheduleApp.git
git push -u origin main
```

## Configuration

### Google Calendar (`config.js`)

`config.js` is gitignored — create it locally:

```js
const CONFIG = {
    CALENDAR_ID: 'your-calendar-id@group.calendar.google.com',
    API_KEY: 'YOUR_GOOGLE_API_KEY',
};
```

To get credentials: create a Google Cloud project, enable the Calendar API, generate an API key, and share the SMFM calendar publicly (read-only).

### Layout & colours (`layout.js`)

`layout.js` is the single place to tweak visual layout without touching app code:

```js
const LAYOUT_CONFIG = {
    upperImage: {
        scale: 3.2,   // resize multiplier on the SVG's natural size
        y: 30,        // Y position from the top of the canvas (px)
        x: null,      // X position (px); null = auto-centre
    },
    columns: {
        leftMargin: 80,       // px from left canvas edge where show names start
        rightEdgeInset: 80,   // px from right canvas edge where times end
        nameWidthRatio: 0.68, // fraction of total span used by the show name (0–1)
        defaultFontSize: 30,  // starting font size in px
    },
    colours: [
        { label: 'Vermillion / Warm Sand', text: '#d14936', bg: '#e7dfd9' },
        // add more combos here — the picker rebuilds automatically
    ],
};
```

## Project structure

```
.
├── index.html               — App shell and layout
├── styles.css               — All styling
├── app.js                   — All JavaScript logic
├── layout.js                — Layout and colour config (edit this to customise)
├── config.js                — Google Calendar credentials (gitignored)
└── assets/
    ├── UpperImage.svg       — Graphic drawn at the top of the canvas
    ├── PAPER EFFECT.png     — Texture asset
    ├── favicon.png
    ├── fonts/
    │   ├── SisterMidnight-Regular.ttf   — Date line font
    │   └── FOSS-Modern-Bold.otf         — Show name/time font
    └── drawings/            — SVG illustration library
```
