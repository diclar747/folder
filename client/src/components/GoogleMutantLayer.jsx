import { useMap } from 'react-leaflet';
import { useEffect, useRef, useState } from 'react';

/**
 * Google Maps layer for Leaflet using leaflet.gridlayer.googlemutant.
 * Requires Google Maps JS API to be loaded globally first.
 *
 * react-leaflet's <LayersControl> mounts every <BaseLayer> child's React
 * component up front — it only adds/removes the underlying Leaflet layer
 * from the map for the one the user has selected, and it only knows how to
 * do that for its own built-in layer components (TileLayer, etc). Since
 * this is a plain custom component that called `mutant.addTo(map)` directly
 * in a mount effect, every Google variant (hybrid/satellite/roadmap/terrain)
 * ended up added to the map at once, regardless of which one was "checked"
 * — each with its own required Google attribution strip, which is why that
 * strip appeared stacked/duplicated at the bottom of the map.
 *
 * To behave like a real base layer, we track Leaflet's own
 * 'baselayerchange' event (fired by LayersControl when the user switches
 * layers) and only attach our mutant layer while `name` matches the
 * currently selected base layer. `defaultActive` seeds the initial state
 * for whichever layer starts out checked, since 'baselayerchange' only
 * fires on a later user-initiated switch, not for the initial layer.
 *
 * The plugin's ESM build (`src/*.mjs`, the one Vite picks via the `module`
 * package.json field) only exports its `GoogleMutant` class as the default
 * export — it never registers `L.GridLayer.GoogleMutant` / the
 * `L.gridLayer.googleMutant()` factory the way the classic UMD/global build
 * does, so calling that factory throws "L.GridLayer.GoogleMutant is not a
 * constructor". We sidestep that by constructing the exported class
 * directly instead of going through the (unregistered) factory.
 *
 * Available types: 'roadmap', 'satellite', 'terrain', 'hybrid'
 */
const GoogleMutantLayer = ({ type = 'roadmap', name, defaultActive = false }) => {
    const map = useMap();
    const [active, setActive] = useState(defaultActive);
    const mutantRef = useRef(null);

    useEffect(() => {
        const handleBaseLayerChange = (e) => setActive(e.name === name);
        map.on('baselayerchange', handleBaseLayerChange);
        return () => map.off('baselayerchange', handleBaseLayerChange);
    }, [map, name]);

    useEffect(() => {
        if (!active) return;
        if (!window.google || !window.google.maps) {
            console.warn('Google Maps API not loaded. Skipping GoogleMutantLayer.');
            return;
        }

        let cancelled = false;

        import('leaflet.gridlayer.googlemutant').then((mod) => {
            if (cancelled) return;
            const GoogleMutant = mod.default;
            try {
                const mutant = new GoogleMutant({ type });
                mutant.addTo(map);
                mutantRef.current = mutant;
            } catch (e) {
                console.error('Error adding GoogleMutantLayer:', e);
            }
        });

        return () => {
            cancelled = true;
            if (mutantRef.current) {
                map.removeLayer(mutantRef.current);
                mutantRef.current = null;
            }
        };
    }, [active, map, type]);

    return null;
};

export default GoogleMutantLayer;
