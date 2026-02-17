import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = ({ activeTab, onTabChange, onCollapseChange }) => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Notify parent when collapse state changes
    React.useEffect(() => {
        if (onCollapseChange) {
            onCollapseChange(isCollapsed);
        }
    }, [isCollapsed, onCollapseChange]);

    const handleNavigation = (tabId) => {
        if (onTabChange) {
            onTabChange(tabId);
        } else {
            if (user && user.role === 'admin') {
                navigate('/admin', { state: { tab: tabId } });
            } else {
                navigate('/dashboard', { state: { tab: tabId } });
            }
        }
    };

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    const SidebarItem = ({ id, icon, label }) => (
        <button
            onClick={() => handleNavigation(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left group relative ${
                activeTab === id 
                    ? 'bg-primary/10 text-primary font-bold' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            } ${isCollapsed ? 'justify-center px-2' : ''}`}
            title={isCollapsed ? label : ''}
        >
            <span className="material-symbols-outlined text-[22px] flex-shrink-0" style={activeTab === id ? { fontVariationSettings: "'FILL' 1" } : {}}>
                {icon}
            </span>
            {!isCollapsed && <span className="text-sm whitespace-nowrap">{label}</span>}
            
            {/* Tooltip for collapsed mode */}
            {isCollapsed && (
                <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                    {label}
                </span>
            )}
        </button>
    );

    return (
        <aside className={`bg-white dark:bg-background-dark border-r border-slate-200 dark:border-slate-800 flex flex-col fixed h-full z-20 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
            {/* Toggle Button */}
            <button
                onClick={toggleSidebar}
                className="absolute -right-3 top-20 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-all z-30"
                title={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
            >
                <span className="material-symbols-outlined text-sm">
                    {isCollapsed ? 'chevron_right' : 'chevron_left'}
                </span>
            </button>

            <div className={`p-6 flex flex-col h-full ${isCollapsed ? 'px-2' : ''}`}>
                {/* Logo */}
                <div className={`flex items-center gap-2 mb-8 ${isCollapsed ? 'justify-center' : ''}`}>
                    <div className="bg-primary rounded-lg p-1.5 text-white flex-shrink-0">
                        <span className="material-symbols-outlined text-xl">radar</span>
                    </div>
                    {!isCollapsed && (
                        <div className="overflow-hidden">
                            <h1 className="text-slate-900 dark:text-white font-bold text-lg leading-none whitespace-nowrap">GeoRastreador</h1>
                            <p className="text-slate-500 dark:text-slate-500 text-[10px] font-medium leading-none mt-1 whitespace-nowrap">
                                {user?.role === 'admin' ? 'Panel Administrativo' : 'Panel de Usuario'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex flex-col gap-1 flex-1 overflow-y-auto custom-scrollbar">
                    {user?.role === 'admin' ? (
                        <>
                            <SidebarItem id="dashboard" icon="dashboard" label="Panel" />
                            <hr className={`my-2 border-transparent ${isCollapsed ? 'mx-2' : ''}`} />
                            
                            {/* Create Link Button */}
                            <button
                                onClick={() => handleNavigation('create')}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left group relative ${activeTab === 'create' ? 'bg-primary/10 text-primary font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'} ${isCollapsed ? 'justify-center px-2' : ''}`}
                                title={isCollapsed ? 'Crear Enlace' : ''}
                            >
                                <span className="material-symbols-outlined text-[22px] flex-shrink-0" style={activeTab === 'create' ? { fontVariationSettings: "'FILL' 1" } : {}}>add_link</span>
                                {!isCollapsed && <span className="text-sm whitespace-nowrap">Crear Enlace</span>}
                                {isCollapsed && (
                                    <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                                        Crear Enlace
                                    </span>
                                )}
                            </button>
                            
                            <hr className={`my-2 border-transparent ${isCollapsed ? 'mx-2' : ''}`} />
                            <SidebarItem id="links" icon="link" label="Mis Enlaces" />
                            <SidebarItem id="analytics" icon="analytics" label="Analíticas" />
                            <SidebarItem id="users" icon="group" label="Usuarios" />
                            
                            <div className={`mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 ${isCollapsed ? 'mx-0' : ''}`}>
                                <SidebarItem id="settings" icon="settings" label="Configuración" />
                            </div>
                        </>
                    ) : (
                        <>
                            <SidebarItem id="overview" icon="dashboard" label="Resumen" />
                            <SidebarItem id="map" icon="location_on" label="Mapa en Vivo" />
                            <SidebarItem id="links" icon="link" label="Mis Enlaces" />
                            <hr className={`my-2 border-slate-100 dark:border-slate-800 ${isCollapsed ? 'mx-2' : ''}`} />
                        </>
                    )}

                    {/* Logout Button - Always at bottom */}
                    <button
                        onClick={() => { logout(); navigate('/login'); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all font-medium mt-auto group relative ${isCollapsed ? 'justify-center px-2' : ''}`}
                        title={isCollapsed ? 'Cerrar Sesión' : ''}
                    >
                        <span className="material-symbols-outlined text-[22px] flex-shrink-0">logout</span>
                        {!isCollapsed && <span className="text-sm whitespace-nowrap">Cerrar Sesión</span>}
                        {isCollapsed && (
                            <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                                Cerrar Sesión
                            </span>
                        )}
                    </button>
                </nav>

                {/* Bottom Action for Regular Users */}
                {user?.role !== 'admin' && !isCollapsed && (
                    <div className="mt-4 p-4 border-t border-slate-100 dark:border-slate-800">
                        <button
                            onClick={() => handleNavigation('create')}
                            className={`flex w-full items-center justify-center gap-2 rounded-lg h-10 text-sm font-bold shadow-lg transition-all ${activeTab === 'create' ? 'bg-primary/90 text-white shadow-primary/20' : 'bg-primary text-white shadow-primary/20 hover:bg-primary/90'}`}
                        >
                            <span className="material-symbols-outlined text-lg">add</span>
                            Nuevo Enlace
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;
