import React, { useEffect, useState } from 'react';
import { TileLayer, LayersControl, LayerGroup } from 'react-leaflet';
import GoogleMutantLayer from './GoogleMutantLayer';

const { BaseLayer } = LayersControl;

/**
 * Professional map tile layers component.
 * Supports Google Maps (when API key is configured) and high-quality free alternatives.
 */
const MapLayers = ({ googleApiKey }) => {
    const [googleLoaded, setGoogleLoaded] = useState(false);

    useEffect(() => {
        if (!googleApiKey) return;
        if (window.google && window.google.maps) {
            setGoogleLoaded(true);
            return;
        }
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&loading=async`;
        script.async = true;
        script.defer = true;
        script.onload = () => setGoogleLoaded(true);
        script.onerror = () => console.error('Failed to load Google Maps API');
        document.head.appendChild(script);

        return () => {
            // Cleanup script if component unmounts before load
            if (script.parentNode) {
                document.head.removeChild(script);
            }
        };
    }, [googleApiKey]);

    const hasGoogle = googleApiKey && googleLoaded;

    return (
        <LayersControl position="topright">
            {/* Google Maps layers (premium - when API key is configured) */}
            {hasGoogle && (
                <>
                    <BaseLayer checked name="Google Satélite">
                        <GoogleMutantLayer type="satellite" />
                    </BaseLayer>
                    <BaseLayer name="Google Híbrido">
                        <GoogleMutantLayer type="hybrid" />
                    </BaseLayer>
                    <BaseLayer name="Google Mapa">
                        <GoogleMutantLayer type="roadmap" />
                    </BaseLayer>
                    <BaseLayer name="Google Terreno">
                        <GoogleMutantLayer type="terrain" />
                    </BaseLayer>
                </>
            )}

            {/* Professional free alternative: CartoDB Voyager (default when no Google) */}
            <BaseLayer checked={!hasGoogle} name="CartoDB Voyager">
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    subdomains="abcd"
                    maxZoom={20}
                />
            </BaseLayer>

            {/* Satellite via Esri */}
            <BaseLayer name="Satélite (Esri)">
                <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                    maxZoom={18}
                />
            </BaseLayer>

            {/* Hybrid: Esri Satellite + Labels */}
            <BaseLayer name="Híbrido (Esri + Labels)">
                <LayerGroup>
                    <TileLayer
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        attribution='Tiles &copy; Esri'
                        maxZoom={18}
                    />
                    <TileLayer
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                        attribution='Tiles &copy; Esri'
                        maxZoom={18}
                    />
                </LayerGroup>
            </BaseLayer>

            {/* Standard OpenStreetMap */}
            <BaseLayer name="Mapa (OpenStreetMap)">
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    maxZoom={19}
                />
            </BaseLayer>

            {/* Dark mode */}
            <BaseLayer name="Oscuro (CartoDB)">
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    subdomains="abcd"
                    maxZoom={20}
                />
            </BaseLayer>
        </LayersControl>
    );
};

export default MapLayers;
