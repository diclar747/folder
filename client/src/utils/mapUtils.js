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
 * Create a directional arrow icon for map markers
 */
export const createArrowIcon = (bearing, color = '#ef4444') => L.divIcon({
    className: 'arrow-icon',
    html: `<div style="transform: rotate(${bearing}deg); width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-bottom: 10px solid ${color};"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5]
});

/**
 * Create a pulsing target marker with directional arrow
 */
export const createPulseIcon = (bearing = 0, isMoving = false) => L.divIcon({
    className: 'pulse-marker-container',
    html: `<div class="pulse-marker ${isMoving ? 'moving' : ''}" style="--rotation: ${bearing}deg;"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
});

/**
 * Create a standard colored dot icon
 */
export const createDotIcon = (color = '#3b82f6') => L.divIcon({
    className: 'custom-marker',
    html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
});
