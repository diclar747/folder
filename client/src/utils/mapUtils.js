import L from 'leaflet';

/**
 * Calculate bearing (direction) between two coordinates in degrees (0-360)
 */
export const getBearing = (lat1, lng1, lat2, lng2) => {
    const dLon = (lng2 - lng1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    const brng = Math.atan2(y, x) * 180 / Math.PI;
    return (brng + 360) % 360;
};

/**
 * Create a directional arrow icon for polylines (100% inline, no external CSS needed)
 */
export const createArrowIcon = (bearing, color = '#ef4444') => L.divIcon({
    className: '',
    html: `<div style="transform: rotate(${bearing}deg); width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-bottom: 10px solid ${color}; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5]
});

/**
 * Create a highly visible pulsing target marker with inline directional arrow.
 * Uses only inline styles for the arrow; pulse animation relies on global CSS keyframes.
 */
export const createPulseIcon = (bearing = 0, isMoving = false) => L.divIcon({
    className: '',
    html: `
        <div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
            ${isMoving ? `
            <div class="map-pulse-ring"></div>
            ` : ''}
            <div style="width:18px;height:18px;background:#ef4444;border-radius:50%;border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);position:relative;z-index:2;">
                <div style="position:absolute;top:50%;left:50%;width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-bottom:12px solid #ef4444;transform:translate(-50%,-120%) rotate(${bearing}deg);transform-origin:50% 100%;"></div>
            </div>
        </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
});

/**
 * Create a standard colored dot icon (100% inline)
 */
export const createDotIcon = (color = '#3b82f6') => L.divIcon({
    className: '',
    html: `<div style="background:${color};width:16px;height:16px;border-radius:50%;border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
});

/**
 * Create a large start/end marker for history view
 */
export const createHistoryIcon = (color = '#22c55e', label = '') => L.divIcon({
    className: '',
    html: `
        <div style="position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center;">
            <div style="width:18px;height:18px;background:${color};border-radius:50%;border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:bold;color:white;font-family:sans-serif;">${label}</div>
        </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
});
