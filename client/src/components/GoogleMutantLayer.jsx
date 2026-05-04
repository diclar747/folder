import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.gridlayer.googlemutant';
import { useEffect } from 'react';

/**
 * Google Maps layer for Leaflet using leaflet.gridlayer.googlemutant
 * Requires Google Maps JS API to be loaded globally first.
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
        try {
            const mutant = L.gridLayer.googleMutant({ type });
            mutant.addTo(map);
            return () => {
                map.removeLayer(mutant);
            };
        } catch (e) {
            console.error('Error adding GoogleMutantLayer:', e);
        }
    }, [map, type]);

    return null;
};

export default GoogleMutantLayer;
