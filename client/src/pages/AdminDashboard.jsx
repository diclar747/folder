import React, { useEffect, useState, useRef } from 'react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import { io } from 'socket.io-client';
import api from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
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

const libraries = ['places', 'geometry'];

const AdminDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useAuth();
    const [stats, setStats] = useState({ totalLinks: 0, totalLocations: 0 });
    const [links, setLinks] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [selectedSession, setSelectedSession] = useState(null);
    const [editingLink, setEditingLink] = useState(null);
    const [toast, setToast] = useState(null);
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyA4qMbpLlGXpc3EOTqelCXEdmCQBYnJh9g',
        libraries,
    });

    const socketRef = useRef();

    useEffect(() => {
        if (location.state?.tab) {
            setActiveTab(location.state.tab);
            // Clear state to avoid persistent redirect effect
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    useEffect(() => {
        fetchAdminData();
        const socket = io('/', { path: '/socket.io' });
        socketRef.current = socket;
        socket.on('connect', () => socket.emit('join-admin'));
        socket.on('location-updated', (session) => {
            setSessions(prev => [session, ...prev]);
            setToast(session);
            setTimeout(() => setToast(null), 10000); // 10s duration
        });
        return () => socket.disconnect();
    }, []);

    const fetchAdminData = async () => {
        try {
            const [linksRes, sessionsRes] = await Promise.all([
                api.get('/admin/links'),
                api.get('/user/sessions')
            ]);
            setLinks(linksRes.data);
            setSessions(sessionsRes.data);
        } catch (e) { console.error("Error fetching admin data", e); }
    };

    // ... existing handlers ...
    const handleLocate = (session) => {
        setSelectedSession(session);
        setActiveTab('dashboard');
    };

    const handleDeleteLink = async (id) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este enlace? Esta acción es irreversible.')) return;
        try {
            await api.delete(`/links/${id}`);
            fetchAdminData();
        } catch (e) {
            alert('Error eliminando enlace: ' + (e.response?.data?.message || e.message));
        }
    };

    const handleUpdateLink = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/links/${editingLink.id}`, editingLink);
            setEditingLink(null);
            fetchAdminData();
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

    if (loadError) return <div>Error loading maps</div>;
    if (!isLoaded) return <div>Loading Maps...</div>;

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 antialiased overflow-hidden min-h-screen flex w-full">
            {/* Sidebar Navigation */}
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
                {toast && (
                    <div className="fixed top-8 right-8 z-[101] animate-in slide-in-from-right-8 duration-300">
                        <div className="bg-slate-900 border border-white/20 rounded-2xl shadow-2xl p-4 flex items-center gap-4 text-white max-w-sm">
                            <div className="size-12 rounded-xl bg-primary/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary animate-pulse">radar</span>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-white">Hit Global Detectado</p>
                                <p className="text-[10px] text-slate-400 italic truncate">Nueva actividad en el sistema</p>
                            </div>
                            <button
                                onClick={() => { handleLocate(toast); setToast(null); }}
                                className="px-4 py-2 rounded-lg bg-primary text-white font-bold text-xs hover:bg-primary/90 transition-colors"
                            >
                                ABRIR MAPA
                            </button>
                            <button onClick={() => setToast(null)} className="p-1 hover:bg-white/10 rounded-full transition-colors text-slate-500">
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'create' && (
                    <div className="flex-1 overflow-auto p-8">
                        <div className="animate-in fade-in zoom-in-95 duration-300">
                            <CreateLinkForm onLinkCreated={() => { fetchAdminData(); setActiveTab('links'); }} />
                        </div>
                    </div>
                )}

                {activeTab === 'dashboard' && (
                    <>
                        {/* Map Background Layer - Now Real Map */}
                        <div className="absolute inset-0 z-0 bg-background-dark">
                            {isLoaded && (
                                <GoogleMap
                                    mapContainerStyle={mapContainerStyle}
                                    zoom={selectedSession ? 15 : 2}
                                    center={selectedSession ? { lat: selectedSession.lat, lng: selectedSession.lng } : center}
                                    options={mapOptions}
                                >
                                    {sessions.map(s => (
                                        <Marker
                                            key={s.id || s.socketId}
                                            position={{ lat: s.lat, lng: s.lng }}
                                            title={`${s.ip} - ${s.userAgent}`}
                                            animation={selectedSession?.id === s.id && isLoaded && window.google?.maps ? window.google.maps.Animation.BOUNCE : null}
                                        />
                                    ))}
                                </GoogleMap>
                            )}
                            {!isLoaded && <div className="flex items-center justify-center h-full text-white/50">Cargando Mapa...</div>}

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
                                            <th className="px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Dispositivo / Sistema</th>
                                            <th className="px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">IP / Red</th>
                                            <th className="px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Enlace</th>
                                            <th className="px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider text-right">Mapa</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {sessions.map(s => {
                                            const { os, browser } = parseUA(s.userAgent);
                                            return (
                                                <tr key={s.id || s.socketId} className="hover:bg-white/5 transition-colors group">
                                                    <td className="px-6 py-4 text-primary text-sm font-medium">{new Date(s.timestamp).toLocaleTimeString()}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-white text-sm font-bold">{os}</span>
                                                            <span className="text-slate-500 text-[10px] font-mono">{browser}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-slate-300 text-sm font-mono">{s.ip || '0.0.0.0'}</span>
                                                            <span className="text-slate-500 text-[10px] italic">{s.lat.toFixed(4)}, {s.lng.toFixed(4)}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-3 py-1 rounded-lg bg-primary/20 text-primary text-xs font-bold border border-primary/20">{s.linkId}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => handleLocate(s)}
                                                            className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">map_go</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {sessions.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-4 text-center text-slate-500">Esperando conexiones...</td>
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
                                                <div className="flex justify-end gap-1">
                                                    <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/track/${link.id}`)} className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"><span className="material-symbols-outlined text-[20px]">content_copy</span></button>
                                                    <button onClick={() => setEditingLink({ ...link })} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"><span className="material-symbols-outlined text-[20px]">edit</span></button>
                                                    <button onClick={() => handleDeleteLink(link.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                                                </div>
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

            {editingLink && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden scale-in-center">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="text-lg font-bold dark:text-white">Editar Enlace (Admin)</h3>
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
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase">URL Imagen</label>
                                <input type="text" value={editingLink.imageUrl || ''} onChange={(e) => setEditingLink({ ...editingLink, imageUrl: e.target.value })} className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-800 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
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

export default AdminDashboard;
