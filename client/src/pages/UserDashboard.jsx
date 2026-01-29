import React, { useEffect, useState, useRef } from 'react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import { io } from 'socket.io-client';
import api from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
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
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
        { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
    ]
};

const UserDashboard = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: 'AIzaSyA4qMbpLlGXpc3EOTqelCXEdmCQBYnJh9g',
    });

    const [stats, setStats] = useState({ totalLinks: 0, totalLocations: 0 });
    const [links, setLinks] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [activeTab, setActiveTab] = useState('overview'); // overview, map, links
    const socketRef = useRef();

    useEffect(() => {
        fetchData();

        socketRef.current = io('/', { path: '/socket.io' }); // Use proxy path if needed or direct
        // Note: In dev with proxy, io() usually works if proxy handles ws, but here we might need specific setup
        // For now trusting default connection or explicit URL if proxy fails.
        // Reverting to direct URL for socket to match previous working state if needed,
        // but trying relative first for proxy compatibility.
        // Actually, previous AdminDashboard used 'http://localhost:3001'. Let's stick to consistent relative api if proxy handles it,
        // but socket.io client often needs explicit URL if not served origin.

        const socket = io('http://localhost:3001');
        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('join-admin'); // User also joins admin room? Or should we make a 'user-room'? 
            // For MVP, user listens to same updates and we filter client-side or backend should filter rooms.
            // Backend currently broadcasts to 'admin-room'. Let's join that for now, 
            // assuming 'admin-room' is just a "receiver" room.
            //Ideally backend should have room per user, but for now we filter sessions client side.
        });

        socket.on('location-updated', (session) => {
            // We need to know if this session belongs to one of OUR links.
            // We can check if session.linkId is in our links list.
            // However, active links state might be stale in callback.
            // Better to refresh sessions from API or let API filter.
            fetchSessions();
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, linksRes, sessionsRes] = await Promise.all([
                api.get('/user/stats'),
                api.get('/user/links'),
                api.get('/user/sessions')
            ]);
            setStats(statsRes.data);
            setLinks(linksRes.data);
            setSessions(sessionsRes.data);
        } catch (error) {
            console.error("Error fetching dashboard data", error);
        }
    };

    const fetchSessions = async () => {
        try {
            const res = await api.get('/user/sessions');
            setSessions(res.data);
            // Also update stats
            const statsRes = await api.get('/user/stats');
            setStats(statsRes.data);
        } catch (e) { console.error(e); }
    }

    // Sidebar Component
    const SidebarItem = ({ id, icon, label }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activeTab === id ? 'bg-primary/10 text-primary font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
            <span className="material-symbols-outlined text-[22px]">{icon}</span>
            <span className="text-sm">{label}</span>
        </button>
    );

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex font-display">

            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-background-dark border-r border-slate-200 dark:border-slate-800 flex flex-col fixed h-full z-20">
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-8">
                        <div className="bg-primary rounded-lg p-1.5 text-white">
                            <span className="material-symbols-outlined text-xl">radar</span>
                        </div>
                        <h1 className="text-slate-900 dark:text-white font-bold text-lg">GeoRastreador</h1>
                    </div>

                    <nav className="flex flex-col gap-1">
                        <SidebarItem id="overview" icon="dashboard" label="Resumen" />
                        <SidebarItem id="map" icon="location_on" label="Mapa en Vivo" />
                        <SidebarItem id="links" icon="link" label="Mis Enlaces" />

                        <hr className="my-2 border-slate-100 dark:border-slate-800" />

                        <button
                            onClick={() => {
                                logout();
                                navigate('/login');
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all font-medium"
                        >
                            <span className="material-symbols-outlined text-[22px]">logout</span>
                            <span className="text-sm">Cerrar Sesión</span>
                        </button>
                    </nav>
                </div>

                <div className="mt-auto p-6 border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={() => navigate('/create')}
                        className="flex w-full items-center justify-center gap-2 rounded-lg h-10 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                    >
                        <span className="material-symbols-outlined text-lg">add</span>
                        Nuevo Enlace
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8 overflow-y-auto">

                {/* Header */}
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                            {activeTab === 'overview' && 'Resumen del Panel'}
                            {activeTab === 'map' && 'Monitoreo en Tiempo Real'}
                            {activeTab === 'links' && 'Gestión de Enlaces'}
                        </h2>
                        <p className="text-slate-500 dark:text-text-muted text-sm">Bienvenido, Usuario</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold">
                            U
                        </div>
                    </div>
                </header>

                {/* Content switching */}

                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Stats Cards */}
                        <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-100 dark:border-border-dark shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                                    <span className="material-symbols-outlined">link</span>
                                </div>
                                <span className="text-xs font-semibold text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">+ Activo</span>
                            </div>
                            <h3 className="text-slate-500 dark:text-text-muted text-sm font-medium">Total Enlaces</h3>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalLinks}</p>
                        </div>

                        <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-100 dark:border-border-dark shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
                                    <span className="material-symbols-outlined">my_location</span>
                                </div>
                                <span className="text-xs font-semibold text-purple-500 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-full">Global</span>
                            </div>
                            <h3 className="text-slate-500 dark:text-text-muted text-sm font-medium">Ubicaciones Capturadas</h3>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalLocations}</p>
                        </div>

                        {/* Recent Activity Mini List */}
                        <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-100 dark:border-border-dark shadow-sm md:col-span-2 lg:col-span-1">
                            <h3 className="text-slate-900 dark:text-white font-bold mb-4">Actividad Reciente</h3>
                            <div className="flex flex-col gap-3">
                                {(sessions || []).slice(0, 3).map((session, i) => (
                                    <div key={i} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        <div className="flex-1">
                                            <p className="text-xs font-mono text-slate-600 dark:text-slate-300 truncate w-32">{session.userAgent}</p>
                                            <p className="text-[10px] text-slate-400">{new Date(session.timestamp).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                ))}
                                {sessions.length === 0 && <p className="text-sm text-slate-400">Sin actividad aún.</p>}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'map' && (
                    <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-100 dark:border-border-dark shadow-sm overflow-hidden h-[600px] relative">
                        {isLoaded ? (
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
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-500">Cargando Mapa...</div>
                        )}
                        <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 text-white">
                            <p className="text-xs font-bold uppercase tracking-wider mb-1">En Vivo</p>
                            <p className="text-2xl font-bold">{sessions.length} <span className="text-sm font-normal text-slate-300">Objetivos</span></p>
                        </div>
                    </div>
                )}

                {activeTab === 'links' && (
                    <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-100 dark:border-border-dark shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-black/20 border-b border-slate-100 dark:border-border-dark">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-text-muted uppercase tracking-wider">Título</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-text-muted uppercase tracking-wider">Destino</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-text-muted uppercase tracking-wider">Creado</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-text-muted uppercase tracking-wider text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-border-dark">
                                {links.map(link => (
                                    <tr key={link.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 bg-cover bg-center" style={{ backgroundImage: `url(${link.imageUrl})` }}></div>
                                                <span className="text-sm font-medium text-slate-900 dark:text-white">{link.title}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <a href={link.destinationUrl} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline truncate max-w-[200px] block">
                                                {link.destinationUrl}
                                            </a>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                                            {new Date(link.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/track/${link.id}`)}
                                                className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors">
                                                Copiar Enlace
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {links.length === 0 && (
                            <div className="p-8 text-center text-slate-500 dark:text-text-muted">
                                Aún no hay enlaces. <Link to="/create" className="text-primary hover:underline">Crear uno ahora</Link>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default UserDashboard;
