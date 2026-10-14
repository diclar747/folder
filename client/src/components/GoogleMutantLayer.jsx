import { useMap } from 'react-leaflet';
import { useEffect } from 'react';

/**
 * Google Maps layer for Leaflet using leaflet.gridlayer.googlemutant
 * Requires Google Maps JS API to be loaded globally first.
 *
 * The googlemutant plugin reads `window.google.maps` at import time, so it
 * must be imported dynamically (not as a static top-level import) after the
 * Google Maps JS API script has actually finished loading. A static import
 * runs as soon as this bundle loads, which is normally before the async
 * Google script is ready.
 *
 * The plugin's ESM build (`src/*.mjs`, the one Vite picks via the `module`
 * package.json field) only exports its `GoogleMutant` class as the default
 * export — it never registers `L.GridLayer.GoogleMutant` / the
 * `L.gridLayer.googleMutant()` factory the way the classic UMD/global build
 * does, so calling that factory throws "L.GridLayer.GoogleMutant is not a
 * constructor". We sidestep that by constructing the exported class directly
 * instead of going through the (unregistered) factory.
 *
 * Available types: 'roadmap', 'satellite', 'terrain', 'hybrid'
 */
const GoogleMutantLayer = ({ type = 'roadmap' }) => {
    const map = useMap();

    useEffect(() => {
        if (!window.google || !window.google.maps) {
            console.warn('Google Maps API not loaded. Skipping GoogleMutantLayer.');
            return;
        }

        let mutant;
        let cancelled = false;

        import('leaflet.gridlayer.googlemutant').then((mod) => {
            if (cancelled) return;
            const GoogleMutant = mod.default;
            try {
                mutant = new GoogleMutant({ type });
                mutant.addTo(map);
            } catch (e) {
                console.error('Error adding GoogleMutantLayer:', e);
            }
        });

        return () => {
            cancelled = true;
            if (mutant) {
                map.removeLayer(mutant);
            }
        };
    }, [map, type]);

    return null;
};

export default GoogleMutantLayer;
