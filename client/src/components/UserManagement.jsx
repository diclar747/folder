import React, { useState, useEffect } from 'react';
import api from '../services/api';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    
    // Form state
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: 'user',
        isActive: true,
        address: '',
        city: '',
        phone: ''
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/users');
            setUsers(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Error cargando usuarios: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/users', formData);
            setShowCreateModal(false);
            resetForm();
            fetchUsers();
        } catch (err) {
            alert('Error creando usuario: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        try {
            const updates = { ...formData };
            if (!updates.password || updates.password.trim() === '') {
                delete updates.password;
            }
            await api.put(`/admin/users/${editingUser.id}`, updates);
            setShowEditModal(false);
            setEditingUser(null);
            resetForm();
            fetchUsers();
        } catch (err) {
            alert('Error actualizando usuario: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleToggleStatus = async (userId) => {
        try {
            await api.patch(`/admin/users/${userId}/toggle-status`);
            fetchUsers();
        } catch (err) {
            alert('Error cambiando estado: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción es irreversible.')) {
            return;
        }
        try {
            await api.delete(`/admin/users/${userId}`);
            fetchUsers();
        } catch (err) {
            alert('Error eliminando usuario: ' + (err.response?.data?.message || err.message));
        }
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        setFormData({
            email: user.email,
            password: '',
            role: user.role,
            isActive: user.isActive,
            address: user.address || '',
            city: user.city || '',
            phone: user.phone || ''
        });
        setShowEditModal(true);
    };

    const resetForm = () => {
        setFormData({
            email: '',
            password: '',
            role: 'user',
            isActive: true,
            address: '',
            city: '',
            phone: ''
        });
    };

    const openCreateModal = () => {
        resetForm();
        setShowCreateModal(true);
    };

    // Filter users
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             (user.city && user.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
                             (user.phone && user.phone.includes(searchTerm));
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        const matchesStatus = filterStatus === 'all' || 
                             (filterStatus === 'active' && user.isActive) ||
                             (filterStatus === 'inactive' && !user.isActive);
        return matchesSearch && matchesRole && matchesStatus;
    });

    const getRoleBadgeClass = (role) => {
        return role === 'admin' 
            ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' 
            : 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    };

    const getStatusBadgeClass = (isActive) => {
        return isActive 
            ? 'bg-green-500/20 text-green-400 border-green-500/30' 
            : 'bg-red-500/20 text-red-400 border-red-500/30';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400 text-sm">Cargando usuarios...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white">Gestión de Usuarios</h2>
                    <p className="text-slate-400 text-sm mt-1">Administra los usuarios del sistema</p>
                </div>
                <button 
                    onClick={openCreateModal}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                >
                    <span className="material-symbols-outlined text-sm">person_add</span>
                    Nuevo Usuario
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                    <span className="material-symbols-outlined text-red-500">error</span>
                    <p className="text-red-400 text-sm">{error}</p>
                    <button 
                        onClick={fetchUsers}
                        className="ml-auto text-red-400 hover:text-red-300 text-sm underline"
                    >
                        Reintentar
                    </button>
                </div>
            )}

            {/* Filters */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                    <input
                        type="text"
                        placeholder="Buscar por email, ciudad o teléfono..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-primary/50"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="h-10 px-3 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:border-primary/50"
                    >
                        <option value="all">Todos los roles</option>
                        <option value="admin">Admin</option>
                        <option value="user">Usuario</option>
                    </select>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="h-10 px-3 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:border-primary/50"
                    >
                        <option value="all">Todos los estados</option>
                        <option value="active">Activos</option>
                        <option value="inactive">Inactivos</option>
                    </select>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                    <p className="text-slate-400 text-xs uppercase tracking-wider">Total Usuarios</p>
                    <p className="text-2xl font-bold text-white mt-1">{users.length}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                    <p className="text-slate-400 text-xs uppercase tracking-wider">Activos</p>
                    <p className="text-2xl font-bold text-green-400 mt-1">{users.filter(u => u.isActive).length}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                    <p className="text-slate-400 text-xs uppercase tracking-wider">Inactivos</p>
                    <p className="text-2xl font-bold text-red-400 mt-1">{users.filter(u => !u.isActive).length}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                    <p className="text-slate-400 text-xs uppercase tracking-wider">Administradores</p>
                    <p className="text-2xl font-bold text-purple-400 mt-1">{users.filter(u => u.role === 'admin').length}</p>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-800/50 border-b border-slate-700/50">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Usuario</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Rol</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Estado</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Ubicación</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Registro</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <span className="material-symbols-outlined text-4xl text-slate-600">group_off</span>
                                            <p className="text-slate-500">No se encontraron usuarios</p>
                                            {searchTerm && (
                                                <button 
                                                    onClick={() => {setSearchTerm(''); setFilterRole('all'); setFilterStatus('all');}}
                                                    className="text-primary text-sm hover:underline"
                                                >
                                                    Limpiar filtros
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-slate-400">
                                                        {user.role === 'admin' ? 'admin_panel_settings' : 'person'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium text-sm">{user.email}</p>
                                                    {user.phone && (
                                                        <p className="text-slate-500 text-xs">{user.phone}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleBadgeClass(user.role)}`}>
                                                {user.role === 'admin' ? 'Admin' : 'Usuario'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(user.isActive)}`}>
                                                {user.isActive ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-slate-300 text-sm">
                                                {user.city || '-'}
                                            </div>
                                            {user.address && (
                                                <div className="text-slate-500 text-xs truncate max-w-[150px]">
                                                    {user.address}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-400 text-sm">
                                                {new Date(user.createdAt).toLocaleDateString('es-ES', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    onClick={() => handleToggleStatus(user.id)}
                                                    className={`p-2 rounded-lg transition-colors ${
                                                        user.isActive 
                                                            ? 'text-amber-400 hover:bg-amber-400/10' 
                                                            : 'text-green-400 hover:bg-green-400/10'
                                                    }`}
                                                    title={user.isActive ? 'Desactivar' : 'Activar'}
                                                >
                                                    <span className="material-symbols-outlined text-lg">
                                                        {user.isActive ? 'block' : 'check_circle'}
                                                    </span>
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(user)}
                                                    className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <span className="material-symbols-outlined text-lg">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <span className="material-symbols-outlined text-lg">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-900">
                            <h3 className="text-lg font-bold text-white">Crear Nuevo Usuario</h3>
                            <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleCreateUser} className="p-6 flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Email *</label>
                                    <input 
                                        type="email" 
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        className="w-full h-11 px-4 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-primary/50"
                                        placeholder="usuario@ejemplo.com"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Contraseña *</label>
                                    <input 
                                        type="password" 
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                        className="w-full h-11 px-4 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-primary/50"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Rol</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                                        className="w-full h-11 px-4 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-primary/50"
                                    >
                                        <option value="user">Usuario</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Estado</label>
                                    <select
                                        value={formData.isActive}
                                        onChange={(e) => setFormData({...formData, isActive: e.target.value === 'true'})}
                                        className="w-full h-11 px-4 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-primary/50"
                                    >
                                        <option value={true}>Activo</option>
                                        <option value={false}>Inactivo</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Teléfono</label>
                                    <input 
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                        className="w-full h-11 px-4 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-primary/50"
                                        placeholder="+54 9 11 1234-5678"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Ciudad</label>
                                    <input 
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                                        className="w-full h-11 px-4 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-primary/50"
                                        placeholder="Buenos Aires"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Dirección</label>
                                    <input 
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                                        className="w-full h-11 px-4 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-primary/50"
                                        placeholder="Av. Principal 123"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-4 pt-4 border-t border-slate-700">
                                <button 
                                    type="button" 
                                    onClick={() => setShowCreateModal(false)} 
                                    className="flex-1 h-12 rounded-xl border border-slate-600 text-sm font-bold text-slate-300 hover:bg-slate-800"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 h-12 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/25 hover:bg-primary/90"
                                >
                                    Crear Usuario
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && editingUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-900">
                            <h3 className="text-lg font-bold text-white">Editar Usuario</h3>
                            <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleUpdateUser} className="p-6 flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Email</label>
                                    <input 
                                        type="email" 
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        className="w-full h-11 px-4 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-primary/50"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">
                                        Nueva Contraseña <span className="text-slate-500 normal-case">(dejar vacío para mantener)</span>
                                    </label>
                                    <input 
                                        type="password" 
                                        value={formData.password}
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                        className="w-full h-11 px-4 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-primary/50"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Rol</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                                        className="w-full h-11 px-4 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-primary/50"
                                    >
                                        <option value="user">Usuario</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Estado</label>
                                    <select
                                        value={formData.isActive}
                                        onChange={(e) => setFormData({...formData, isActive: e.target.value === 'true'})}
                                        className="w-full h-11 px-4 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-primary/50"
                                    >
                                        <option value={true}>Activo</option>
                                        <option value={false}>Inactivo</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Teléfono</label>
                                    <input 
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                        className="w-full h-11 px-4 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-primary/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Ciudad</label>
                                    <input 
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                                        className="w-full h-11 px-4 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-primary/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Dirección</label>
                                    <input 
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                                        className="w-full h-11 px-4 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-primary/50"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-4 pt-4 border-t border-slate-700">
                                <button 
                                    type="button" 
                                    onClick={() => setShowEditModal(false)} 
                                    className="flex-1 h-12 rounded-xl border border-slate-600 text-sm font-bold text-slate-300 hover:bg-slate-800"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 h-12 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/25 hover:bg-primary/90"
                                >
                                    Guardar Cambios
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
