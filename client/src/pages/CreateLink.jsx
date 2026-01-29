import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const CreateLink = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        destinationUrl: '',
        title: '',
        description: '',
        imageUrl: '',
        buttonText: 'Más información'
    });
    const [createdLink, setCreatedLink] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/links', formData);
            setCreatedLink(response.data);
        } catch (error) {
            console.error('Error creating link', error);
        }
    };

    const trackingUrl = createdLink ? `${window.location.origin}/track/${createdLink.id}` : '';

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-white transition-colors duration-200 min-h-screen flex">

            {/* Sidebar Navigation */}
            <aside className="w-72 bg-background-light dark:bg-background-dark border-r border-gray-200 dark:border-border-dark flex flex-col fixed h-full z-10">
                <div className="p-6 flex flex-col gap-4">
                    <div className="flex flex-col mb-4">
                        <h1 className="text-gray-900 dark:text-white text-lg font-bold leading-normal flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">location_on</span>
                            GeoRastreador Admin
                        </h1>
                        <p className="text-gray-500 dark:text-text-muted text-xs font-normal">Suite de Pruebas de Seguridad</p>
                    </div>
                    <nav className="flex flex-col gap-2">
                        <button onClick={() => navigate('/admin')} className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 dark:text-text-muted hover:bg-gray-100 dark:hover:bg-surface-dark transition-all w-full text-left">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
                            <p className="text-sm font-medium">Panel</p>
                        </button>
                        <button className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20 w-full text-left">
                            <span className="material-symbols-outlined">add_link</span>
                            <p className="text-sm font-bold">Crear Enlace</p>
                        </button>
                        <button onClick={() => navigate('/admin')} className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 dark:text-text-muted hover:bg-gray-100 dark:hover:bg-surface-dark transition-all w-full text-left">
                            <span className="material-symbols-outlined">link</span>
                            <p className="text-sm font-medium">Mis Enlaces</p>
                        </button>
                        <button onClick={() => navigate('/admin')} className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 dark:text-text-muted hover:bg-gray-100 dark:hover:bg-surface-dark transition-all w-full text-left">
                            <span className="material-symbols-outlined">analytics</span>
                            <p className="text-sm font-medium">Analíticas</p>
                        </button>
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-border-dark">
                            <button onClick={() => navigate('/admin')} className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 dark:text-text-muted hover:bg-gray-100 dark:hover:bg-surface-dark transition-all w-full text-left">
                                <span className="material-symbols-outlined">settings</span>
                                <p className="text-sm font-medium">Configuración</p>
                            </button>
                        </div>
                    </nav>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 ml-72 flex justify-center py-10 px-8">
                <div className="max-w-[800px] w-full flex flex-col gap-8">

                    {/* Page Heading */}
                    <header className="flex flex-wrap justify-between gap-3">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-gray-900 dark:text-white text-4xl font-black leading-tight tracking-tight">Crear Enlace de Rastreo</h1>
                            <p className="text-gray-500 dark:text-text-muted text-base">Configura tus parámetros de rastreo y metadatos de ingeniería social.</p>
                        </div>
                    </header>

                    {/* Form Section */}
                    {!createdLink ? (
                        <section className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-border-dark overflow-hidden shadow-sm">
                            {/* Destination Section */}
                            <div className="p-6 border-b border-gray-100 dark:border-border-dark">
                                <h2 className="text-gray-900 dark:text-white text-xl font-bold flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">alt_route</span>
                                    Configuración de Destino
                                </h2>
                                <div className="mt-6 flex flex-col gap-4">
                                    <label className="flex flex-col gap-2">
                                        <span className="text-gray-700 dark:text-white text-sm font-semibold">URL de Destino</span>
                                        <input
                                            name="destinationUrl"
                                            value={formData.destinationUrl}
                                            onChange={handleChange}
                                            className="form-input flex w-full rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-gray-300 dark:border-border-dark bg-gray-50 dark:bg-background-dark h-14 placeholder:text-gray-400 dark:placeholder:text-text-muted p-4 text-base transition-all"
                                            placeholder="https://ejemplo.com/pagina-objetivo"
                                            type="url"
                                        />
                                        <span className="text-xs text-gray-500 dark:text-text-muted italic">Los usuarios serán redirigidos aquí después de capturar su geolocalización.</span>
                                    </label>
                                </div>
                            </div>

                            {/* Social Engineering Section */}
                            <div className="p-6 bg-gray-50/50 dark:bg-surface-dark">
                                <h2 className="text-gray-900 dark:text-white text-xl font-bold flex items-center gap-2 mb-6">
                                    <span className="material-symbols-outlined text-primary">public</span>
                                    Detalles de Ingeniería Social
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-5">
                                        <label className="flex flex-col gap-2">
                                            <span className="text-gray-700 dark:text-white text-sm font-semibold">Título de Previsualización</span>
                                            <input
                                                name="title"
                                                value={formData.title}
                                                onChange={handleChange}
                                                className="form-input w-full rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-border-dark bg-gray-50 dark:bg-background-dark h-12 p-3 text-sm focus:ring-2 focus:ring-primary/50"
                                                placeholder="ej., Has recibido un archivo"
                                                type="text"
                                            />
                                        </label>
                                        <label className="flex flex-col gap-2">
                                            <span className="text-gray-700 dark:text-white text-sm font-semibold">Descripción</span>
                                            <textarea
                                                name="description"
                                                value={formData.description}
                                                onChange={handleChange}
                                                className="form-input w-full rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-border-dark bg-gray-50 dark:bg-background-dark p-3 text-sm focus:ring-2 focus:ring-primary/50 resize-none"
                                                placeholder="Una breve descripción para la vista previa..."
                                                rows="3"
                                            ></textarea>
                                        </label>
                                        <label className="flex flex-col gap-2">
                                            <span className="text-gray-700 dark:text-white text-sm font-semibold">URL de Imagen Miniatura</span>
                                            <div className="relative">
                                                <input
                                                    name="imageUrl"
                                                    value={formData.imageUrl}
                                                    onChange={handleChange}
                                                    className="form-input w-full rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-border-dark bg-gray-50 dark:bg-background-dark h-12 pl-10 pr-3 text-sm focus:ring-2 focus:ring-primary/50"
                                                    placeholder="https://servidor-imagen.com/foto.jpg"
                                                    type="text"
                                                />
                                                <span className="material-symbols-outlined absolute left-3 top-3 text-gray-400 text-lg">image</span>
                                            </div>
                                        </label>
                                        <label className="flex flex-col gap-2">
                                            <span className="text-gray-700 dark:text-white text-sm font-semibold">Texto del Botón (CTA)</span>
                                            <select
                                                name="buttonText"
                                                value={formData.buttonText}
                                                onChange={handleChange}
                                                className="form-input w-full rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-border-dark bg-gray-50 dark:bg-background-dark h-12 p-3 text-sm focus:ring-2 focus:ring-primary/50 cursor-pointer"
                                            >
                                                <option value="Más información">Más información</option>
                                                <option value="Comprar ahora">Comprar ahora</option>
                                                <option value="Descargar archivo">Descargar archivo</option>
                                                <option value="Visitar sitio">Visitar sitio</option>
                                                <option value="Ver video">Ver video</option>
                                                <option value="Obtener oferta">Obtener oferta</option>
                                                <option value="Acceder ahora">Acceder ahora</option>
                                            </select>
                                        </label>
                                    </div>

                                    {/* Preview Helper */}
                                    <div className="flex flex-col gap-2">
                                        <span className="text-gray-500 dark:text-text-muted text-xs font-bold uppercase tracking-wider">Vista Previa de Metadatos</span>
                                        <div className="border border-gray-200 dark:border-border-dark rounded-xl overflow-hidden bg-white dark:bg-background-dark">
                                            <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative overflow-hidden">
                                                {formData.imageUrl ? (
                                                    <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover opacity-50" />
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-4xl text-primary/40">visibility</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-4 flex flex-col gap-1">
                                                <div className="font-bold text-gray-900 dark:text-white truncate">{formData.title || "Cargando..."}</div>
                                                <div className="text-sm text-gray-500 dark:text-text-muted line-clamp-2 mb-2">{formData.description || "Descripción del enlace..."}</div>
                                                <div className="flex items-center justify-between mt-auto">
                                                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">EJEMPLO.COM</div>
                                                    <div className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded border border-primary/20">
                                                        {formData.buttonText}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-gray-400 dark:text-text-muted mt-2">
                                            <span className="material-symbols-outlined text-[14px] align-middle mr-1">info</span>
                                            Así es como aparecerá tu enlace cuando se comparta en Slack, Discord o LinkedIn.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Footer */}
                            <div className="px-6 py-6 bg-gray-100 dark:bg-background-dark/50 flex justify-end items-center gap-4">
                                <button
                                    onClick={() => setFormData({ destinationUrl: '', title: '', description: '', imageUrl: '' })}
                                    className="px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-text-muted hover:text-gray-900 dark:hover:text-white transition-colors">
                                    Limpiar
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-primary/20 flex items-center gap-2 transition-all active:scale-[0.98]">
                                    <span className="material-symbols-outlined">bolt</span>
                                    Generar Enlace
                                </button>
                            </div>
                        </section>
                    ) : (
                        /* Generated Link Section */
                        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-primary/5 dark:bg-primary/10 border-2 border-dashed border-primary/30 rounded-xl p-6 flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-primary font-bold flex items-center gap-2">
                                        <span className="material-symbols-outlined">check_circle</span>
                                        Enlace Generado Exitosamente
                                    </h3>
                                    <span className="text-xs font-medium text-primary bg-primary/20 px-2 py-1 rounded">Activo</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 bg-white dark:bg-background-dark border border-primary/30 rounded-lg flex items-center px-4 py-3 gap-3">
                                        <span className="material-symbols-outlined text-primary/60">link</span>
                                        <code className="text-gray-900 dark:text-white text-sm font-mono flex-1">{trackingUrl}</code>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(trackingUrl)}
                                            className="flex items-center gap-1.5 bg-primary text-white px-4 py-1.5 rounded-md text-xs font-bold hover:bg-primary/90 transition-all">
                                            <span className="material-symbols-outlined text-sm">content_copy</span>
                                            Copiar
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => setCreatedLink(null)}
                                        className="p-3 rounded-lg bg-white dark:bg-background-dark border border-gray-200 dark:border-border-dark text-gray-600 dark:text-text-muted hover:text-primary transition-colors">
                                        <span className="material-symbols-outlined">restart_alt</span>
                                    </button>
                                </div>
                                <div className="flex items-center gap-6 mt-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-gray-400 dark:text-text-muted uppercase font-bold">Clicks Totales</span>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">0</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-gray-400 dark:text-text-muted uppercase font-bold">Nivel de Seguridad</span>
                                        <span className="text-sm font-bold text-green-500">Alto</span>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            </main >
        </div >
    );
};

export default CreateLink;
