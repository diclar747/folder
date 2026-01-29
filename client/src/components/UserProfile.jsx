import React, { useState, useEffect } from 'react';
import api from '../services/api';

const UserProfile = ({ onProfileUpdate }) => {
    const [profile, setProfile] = useState({
        email: '',
        password: '',
        avatarUrl: '',
        address: '',
        city: '',
        phone: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const res = await api.get('/user/profile');
            // Ensure fields exist
            setProfile({
                email: res.data.email || '',
                password: '', // Don't show hash
                avatarUrl: res.data.avatarUrl || '',
                address: res.data.address || '',
                city: res.data.city || '',
                phone: res.data.phone || ''
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            await api.put('/user/profile', profile);
            setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
            setProfile(prev => ({ ...prev, password: '' })); // Clear password field
            if (onProfileUpdate) onProfileUpdate();
        } catch (e) {
            setMessage({ type: 'error', text: 'Error al actualizar: ' + (e.response?.data?.message || e.message) });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Cargando perfil...</div>;

    return (
        <div className="max-w-2xl mx-auto bg-white dark:bg-surface-dark rounded-xl border border-slate-100 dark:border-border-dark shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Editar Perfil</h3>
                <p className="text-sm text-slate-500">Actualiza tu información personal y contraseña</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {message && (
                    <div className={`p-4 rounded-xl text-sm font-bold ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {message.text}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Email (No editable)</label>
                        <input type="email" value={profile.email} disabled className="w-full h-11 px-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 border dark:border-slate-800 text-slate-500 text-sm outline-none cursor-not-allowed" />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Contraseña Nueva</label>
                        <input
                            type="password"
                            placeholder="Dejar vacía para mantener actual"
                            value={profile.password}
                            onChange={e => setProfile({ ...profile, password: e.target.value })}
                            className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Avatar URL</label>
                        <input
                            type="url"
                            placeholder="https://ejemplo.com/foto.jpg"
                            value={profile.avatarUrl}
                            onChange={e => setProfile({ ...profile, avatarUrl: e.target.value })}
                            className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Teléfono</label>
                        <input
                            type="tel"
                            placeholder="+55 ..."
                            value={profile.phone}
                            onChange={e => setProfile({ ...profile, phone: e.target.value })}
                            className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Dirección</label>
                        <input
                            type="text"
                            placeholder="Calle 123..."
                            value={profile.address}
                            onChange={e => setProfile({ ...profile, address: e.target.value })}
                            className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Ciudad</label>
                        <input
                            type="text"
                            placeholder="Asunción..."
                            value={profile.city}
                            onChange={e => setProfile({ ...profile, city: e.target.value })}
                            className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-8 h-12 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UserProfile;
