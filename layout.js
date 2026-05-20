const cssVar = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

const LAYOUT_CONFIG = {

    upperImage: {
        scale: 3.2,   // resize multiplier applied to the SVG's natural dimensions
        y:     30,    // canvas Y position (px from top)
        x:     null,  // canvas X position (px from left); null = auto-centre
    },

    dateDisplay: {
        bottomPadding:   50,   // px gap between the bottom of the day name and the canvas edge
        leftMargin:      60,   // px from the left canvas edge for both date strings
        widthInset:      120,  // total px subtracted from canvas width to get the day name target width
        smallFontSize:   50,   // px size for the "26th May 2026" line
        gapAboveDay:     15,   // px gap between the small date and the top of the day name
    },

    columns: {
        leftMargin:     160,   // px from the left canvas edge where show names start
        rightEdgeInset: 140,   // px from the right canvas edge where times end
        nameWidthRatio: 0.6,   // fraction of the total span used by the show name column (0–1)
        defaultFontSize: 30,   // starting font size in px (user can adjust in the UI)
        defaultRowGap:   30,   // extra px gap between show rows (user can adjust in the UI)
    },

    colours: [
        { label: 'Deep Burgundy / Warm Sand', text: cssVar('--deep-burgundy'), bg: cssVar('--warm-sand') },
        { label: 'Vermillion / Warm Sand', text: cssVar('--vermillion'),  bg: cssVar('--warm-sand')  },
        { label: 'Muted Plum / Ochre',     text: cssVar('--muted-plum'),  bg: cssVar('--ochre')      },
        { label: 'Muted Plum / Tangerine', text: cssVar('--muted-plum'),  bg: cssVar('--tangerine')  },
        { label: 'Limestone / Dark Olive', text: cssVar('--limestone'),   bg: cssVar('--dark-olive') },
        { label: 'Warm Sand / Ochre',      text: cssVar('--warm-sand'),   bg: cssVar('--ochre')      },
        { label: 'Powder Blue / Brown',    text: cssVar('--powder-blue'), bg: cssVar('--brown')      },
    ],

};
