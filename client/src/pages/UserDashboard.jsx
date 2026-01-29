import React, { useEffect, useState, useRef } from 'react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import { io } from 'socket.io-client';
import api from '../services/api';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import CreateLinkForm from '../components/CreateLinkForm';

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
    mapTypeId: "hybrid", // "hybrid" shows satellite + street names (better than simple satellite)
    styles: [
        { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
        { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
    ]
};

const libraries = ['places', 'geometry'];

const UserDashboard = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyC2p7BO6eOuToNeQSQ7L6V6cqtFpNhvapQ',
        libraries,
    });

    const [stats, setStats] = useState({ totalLinks: 0, totalLocations: 0 });
    const [myLocation, setMyLocation] = useState(null);
    const [links, setLinks] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [activeTab, setActiveTab] = useState('overview'); // overview, map, links
    const [selectedSession, setSelectedSession] = useState(null);
    const [editingLink, setEditingLink] = useState(null);
    const [toast, setToast] = useState(null);
    const socketRef = useRef();

    useEffect(() => {
        fetchData();

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setMyLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    console.error("Error obtaining location", error);
                }
            );
        }

        // POLLING FALLBACK: Vercel Serverless does not support persistent WebSockets well.
        // We use polling every 4 seconds to ensure data appears "live".
        const intervalId = setInterval(() => {
            fetchSessions();
        }, 4000);

        // Socket logic kept for local dev, but polling ensures production works
        const socket = io('/', { path: '/socket.io' });
        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('join-admin');
        });

        socket.on('location-updated', (session) => {
            fetchSessions();
            setToast(session);
            setTimeout(() => setToast(null), 10000);
        });

        return () => {
            socket.disconnect();
            clearInterval(intervalId); // Clear polling on unmount
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
            const statsRes = await api.get('/user/stats');
            setStats(statsRes.data);
        } catch (e) { console.error(e); }
    };

    const handleLocate = (session) => {
        setSelectedSession(session);
        setActiveTab('map');
    };

    const handleDeleteLink = async (id) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este enlace? Esta acción es irreversible.')) return;
        try {
            await api.delete(`/links/${id}`);
            fetchData();
        } catch (e) {
            alert('Error eliminando enlace: ' + (e.response?.data?.message || e.message));
        }
    };

    const handleUpdateLink = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/links/${editingLink.id}`, editingLink);
            setEditingLink(null);
            fetchData();
        } catch (e) {
            alert('Error actualizando enlace: ' + (e.response?.data?.message || e.message));
        }
    };

    const parseUA = (ua) => {
        if (!ua) return { os: '?', browser: '?' };
        let os = 'Unknown';
        if (ua.includes('Windows')) os = 'Windows';
        else if (ua.includes('Android')) os = 'Android';
        else if (ua.includes('iPhone')) os = 'iOS';
        else if (ua.includes('Macintosh')) os = 'Mac';
        else if (ua.includes('Linux')) os = 'Linux';

        let browser = 'Browser';
        if (ua.includes('Chrome')) browser = 'Chrome';
        else if (ua.includes('Firefox')) browser = 'Firefox';
        else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
        else if (ua.includes('Edge')) browser = 'Edge';

        return { os, browser };
    };

    const SidebarItem = ({ id, icon, label }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activeTab === id ? 'bg-primary/10 text-primary font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
            <span className="material-symbols-outlined text-[22px]">{icon}</span>
            <span className="text-sm">{label}</span>
        </button>
    );

    if (loadError) return <div className="flex items-center justify-center h-screen text-red-500">Error loading maps</div>;
    if (!isLoaded) return <div className="flex items-center justify-center h-screen text-slate-500">Loading Maps...</div>;

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex font-display">
            <aside className="w-64 bg-white dark:bg-background-dark border-r border-slate-200 dark:border-slate-800 flex flex-col fixed h-full z-20">
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-8">
                        <div className="bg-primary rounded-lg p-1.5 text-white">
                            <span className="material-symbols-outlined text-xl">radar</span>
                        </div>
                        <h1 className="text-slate-900 dark:text-white font-bold text-lg">GeoRastreador <span className="text-[10px] text-primary">v1.2 Sat</span></h1>
                    </div>
                    <nav className="flex flex-col gap-1">
                        <SidebarItem id="overview" icon="dashboard" label="Resumen" />
                        <SidebarItem id="map" icon="location_on" label="Mapa en Vivo" />
                        <SidebarItem id="links" icon="link" label="Mis Enlaces" />
                        <hr className="my-2 border-slate-100 dark:border-slate-800" />
                        <button
                            onClick={() => { logout(); navigate('/login'); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all font-medium"
                        >
                            <span className="material-symbols-outlined text-[22px]">logout</span>
                            <span className="text-sm">Cerrar Sesión</span>
                        </button>
                    </nav>
                </div>
                <div className="mt-auto p-6 border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={() => setActiveTab('create')}
                        className="flex w-full items-center justify-center gap-2 rounded-lg h-10 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                    >
                        <span className="material-symbols-outlined text-lg">add</span>
                        Nuevo Enlace
                    </button>
                </div>
            </aside>

            <main className="flex-1 ml-64 p-8 overflow-y-auto">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                            {activeTab === 'overview' && 'Resumen del Panel'}
                            {activeTab === 'map' && 'Monitoreo en Tiempo Real'}
                            {activeTab === 'links' && 'Gestión de Enlaces'}
                            {activeTab === 'create' && 'Nuevo Enlace de Rastreo'}
                        </h2>
                        <p className="text-slate-500 dark:text-text-muted text-sm">Bienvenido, Usuario</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold">U</div>
                </header>

                {toast && (
                    <div className="fixed top-8 right-8 z-[101] animate-in slide-in-from-right-8 duration-300">
                        <div className="bg-slate-900 dark:bg-primary border border-white/20 rounded-2xl shadow-2xl p-4 flex items-center gap-4 text-white max-w-sm">
                            <div className="size-12 rounded-xl bg-white/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary dark:text-white animate-pulse">radar</span>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold">¡Objetivo Detectado!</p>
                                <p className="text-[10px] text-white/70 italic truncate">Nueva ubicación recibida</p>
                            </div>
                            <button
                                onClick={() => { handleLocate(toast); setToast(null); }}
                                className="px-4 py-2 rounded-lg bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition-colors"
                            >
                                ABRIR MAPA
                            </button>
                            <button onClick={() => setToast(null)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'create' && (
                    <div className="animate-in fade-in zoom-in-95 duration-300">
                        <div className="mb-6 bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex gap-3 items-center text-blue-400">
                            <span className="material-symbols-outlined text-2xl">info</span>
                            <p className="text-sm">Crea un enlace para compartir. Cuando los usuarios acepten compartir su ubicación, aparecerán en tu mapa en tiempo real.</p>
                        </div>
                        <CreateLinkForm onLinkCreated={() => { fetchData(); setActiveTab('links'); }} />
                    </div>
                )}

                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 flex flex-col gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-100 dark:border-border-dark shadow-sm">
                                    <h3 className="text-slate-500 dark:text-text-muted text-sm font-medium">Total Enlaces</h3>
                                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalLinks}</p>
                                </div>
                                <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-100 dark:border-border-dark shadow-sm">
                                    <h3 className="text-slate-500 dark:text-text-muted text-sm font-medium">Ubicaciones</h3>
                                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalLocations}</p>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-100 dark:border-border-dark shadow-sm p-6 h-[400px] relative overflow-hidden">
                                {isLoaded && (
                                    <GoogleMap mapContainerStyle={mapContainerStyle} zoom={2} center={center} options={mapOptions}>
                                        {sessions.map(s => <Marker key={s.id || s.socketId} position={{ lat: s.lat, lng: s.lng }} />)}
                                    </GoogleMap>
                                )}
                                {!isLoaded && <div className="flex items-center justify-center h-full text-slate-500">Cargando Mapa...</div>}
                            </div>
                        </div>
                        <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-100 dark:border-border-dark shadow-sm overflow-hidden flex flex-col h-[520px]">
                            <h3 className="text-slate-900 dark:text-white font-bold mb-4">Actividad Reciente</h3>
                            <div className="flex-1 overflow-auto flex flex-col gap-3 pr-2 custom-scrollbar">
                                {sessions.map((s, i) => {
                                    const { os, browser } = parseUA(s.userAgent);
                                    return (
                                        <div key={i} onClick={() => handleLocate(s)} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 group hover:border-primary/40 transition-all cursor-pointer">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-primary text-lg">person_pin_circle</span>
                                                    <span className="text-xs font-bold dark:text-white">Hit Detectado</span>
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-mono">{new Date(s.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                                                <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[14px]">devices</span> {os}
                                                </div>
                                                <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[14px]">language</span> {browser}
                                                </div>
                                            </div>
                                            <p className="mt-2 text-[10px] text-slate-400 font-mono truncate">IP: {s.ip}</p>
                                        </div>
                                    );
                                })}
                                {sessions.length === 0 && <p className="text-center text-slate-500 text-sm py-8 italic">Esperando actividad...</p>}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'map' && (
                    <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-100 dark:border-border-dark shadow-sm overflow-hidden h-[600px] relative">
                        {isLoaded && (
                            <GoogleMap
                                mapContainerStyle={mapContainerStyle}
                                zoom={selectedSession ? 15 : (myLocation ? 12 : 2)}
                                center={selectedSession ? { lat: selectedSession.lat, lng: selectedSession.lng } : (myLocation || center)}
                                options={mapOptions}
                            >
                                {/* Admin/User Device Location */}
                                {myLocation && (
                                    <Marker
                                        position={myLocation}
                                        icon={{
                                            path: window.google?.maps?.SymbolPath?.CIRCLE,
                                            scale: 10,
                                            fillColor: '#3B82F6', // Blue-500
                                            fillOpacity: 1,
                                            strokeColor: '#ffffff',
                                            strokeWeight: 2,
                                        }}
                                        title="Tu Ubicación"
                                    />
                                )}

                                {/* Target Sessions */}
                                {sessions.map(s => (
                                    <Marker
                                        key={s.id || s.socketId}
                                        position={{ lat: s.lat, lng: s.lng }}
                                        animation={selectedSession?.id === s.id && window.google?.maps ? window.google.maps.Animation.BOUNCE : null}
                                        icon={{
                                            url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                                        }}
                                        title={`IP: ${s.ip} - ${s.userAgent}`}
                                    />
                                ))}
                            </GoogleMap>
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
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-text-muted uppercase">Título / Enlace</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-text-muted uppercase">Creado</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-text-muted uppercase text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-border-dark">
                                {links.map(link => (
                                    <tr key={link.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded bg-slate-100 dark:bg-slate-800 bg-cover bg-center border border-white/10" style={{ backgroundImage: `url(${link.imageUrl})` }}></div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold dark:text-white">{link.title}</span>
                                                    <span className="text-[10px] font-mono text-primary truncate max-w-[200px]">{link.destinationUrl}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">{new Date(link.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1">
                                                <button onClick={() => setActiveTab('map')} className="p-2 text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-colors" title="Ver en Mapa">
                                                    <span className="material-symbols-outlined text-[20px]">map</span>
                                                </button>
                                                <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/track/${link.id}`)} className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"><span className="material-symbols-outlined text-[20px]">content_copy</span></button>
                                                <button onClick={() => setEditingLink({ ...link })} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"><span className="material-symbols-outlined text-[20px]">edit</span></button>
                                                <button onClick={() => handleDeleteLink(link.id)} className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {links.length === 0 && <div className="p-12 text-center text-slate-500 italic">No tienes enlaces activos.</div>}
                    </div>
                )}
            </main>

            {editingLink && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden scale-in-center">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="text-lg font-bold dark:text-white">Editar Enlace</h3>
                            <button onClick={() => setEditingLink(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><span className="material-symbols-outlined">close</span></button>
                        </div>
                        <form onSubmit={handleUpdateLink} className="p-6 flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase">Título</label>
                                <input type="text" value={editingLink.title} onChange={(e) => setEditingLink({ ...editingLink, title: e.target.value })} className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-800 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase">URL de Destino</label>
                                <input type="url" value={editingLink.destinationUrl} onChange={(e) => setEditingLink({ ...editingLink, destinationUrl: e.target.value })} className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-800 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                            </div>
                            <div className="flex gap-3 mt-2">
                                <button type="button" onClick={() => setEditingLink(null)} className="flex-1 h-12 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-600 dark:text-slate-300">Cancelar</button>
                                <button type="submit" className="flex-1 h-12 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/25">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDashboard;
