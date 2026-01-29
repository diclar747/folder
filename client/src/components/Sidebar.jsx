import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = ({ activeTab, onTabChange }) => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleNavigation = (tabId) => {
        // If onTabChange is provided (we are in a Dashboard), use it to switch tabs
        if (onTabChange) {
            onTabChange(tabId);
        } else {
            // Otherwise, navigate to the appropriate dashboard with state
            if (user && user.role === 'admin') {
                navigate('/admin', { state: { tab: tabId } });
            } else {
                navigate('/dashboard', { state: { tab: tabId } });
            }
        }
    };

    const SidebarItem = ({ id, icon, label }) => (
        <button
            onClick={() => handleNavigation(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${activeTab === id ? 'bg-primary/10 text-primary font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
            <span className="material-symbols-outlined text-[22px]" style={activeTab === id ? { fontVariationSettings: "'FILL' 1" } : {}}>{icon}</span>
            <span className="text-sm">{label}</span>
        </button>
    );

    return (
        <aside className="w-64 bg-white dark:bg-background-dark border-r border-slate-200 dark:border-slate-800 flex flex-col fixed h-full z-20">
            <div className="p-6">
                <div className="flex items-center gap-2 mb-8">
                    <div className="bg-primary rounded-lg p-1.5 text-white">
                        <span className="material-symbols-outlined text-xl">radar</span>
                    </div>
                    <div>
                        <h1 className="text-slate-900 dark:text-white font-bold text-lg leading-none">GeoRastreador</h1>
                        <p className="text-slate-500 dark:text-slate-500 text-[10px] font-medium leading-none mt-1">
                            {user?.role === 'admin' ? 'Panel Administrativo' : 'Panel de Usuario'}
                        </p>
                    </div>
                </div>

                <nav className="flex flex-col gap-1">
                    {/* Common Menu Items */}
                    {user?.role === 'admin' ? (
                        <>
                            <SidebarItem id="dashboard" icon="dashboard" label="Panel" />
                            <hr className="my-2 border-transparent" />
                            {/* Create Link is special - it acts as a tab now */}
                            <button
                                onClick={() => handleNavigation('create')}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${activeTab === 'create' ? 'bg-primary/10 text-primary font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            >
                                <span className="material-symbols-outlined text-[22px]" style={activeTab === 'create' ? { fontVariationSettings: "'FILL' 1" } : {}}>add_link</span>
                                <span className="text-sm">Crear Enlace</span>
                            </button>
                            <hr className="my-2 border-transparent" />
                            <SidebarItem id="links" icon="link" label="Mis Enlaces" />
                            <SidebarItem id="analytics" icon="analytics" label="Analíticas" />
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <SidebarItem id="settings" icon="settings" label="Configuración" />
                            </div>
                        </>
                    ) : (
                        <>
                            <SidebarItem id="overview" icon="dashboard" label="Resumen" />
                            <SidebarItem id="map" icon="location_on" label="Mapa en Vivo" />
                            <SidebarItem id="links" icon="link" label="Mis Enlaces" />
                            <hr className="my-2 border-slate-100 dark:border-slate-800" />
                        </>
                    )}

                    {/* Logout Button (Always at bottom of nav list for Admin, or separate for User - unifying here) */}
                    <button
                        onClick={() => { logout(); navigate('/login'); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all font-medium mt-2"
                    >
                        <span className="material-symbols-outlined text-[22px]">logout</span>
                        <span className="text-sm">Cerrar Sesión</span>
                    </button>
                </nav>
            </div>

            {/* Bottom Action for Regular Users (replaces the top 'Create Link' button found in Admin) */}
            {user?.role !== 'admin' && (
                <div className="mt-auto p-6 border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={() => handleNavigation('create')}
                        className={`flex w-full items-center justify-center gap-2 rounded-lg h-10 text-sm font-bold shadow-lg transition-all ${activeTab === 'create' ? 'bg-primary/90 text-white shadow-primary/20' : 'bg-primary text-white shadow-primary/20 hover:bg-primary/90'}`}
                    >
                        <span className="material-symbols-outlined text-lg">add</span>
                        Nuevo Enlace
                    </button>
                </div>
            )}
        </aside>
    );
};

export default Sidebar;
