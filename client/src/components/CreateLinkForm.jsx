import React, { useState } from 'react';
import api from '../services/api';

const CreateLinkForm = ({ onLinkCreated }) => {
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
            if (onLinkCreated) onLinkCreated();
        } catch (error) {
            console.error('Error creating link', error);
        }
    };

    const trackingUrl = createdLink ? `${window.location.origin}/track/${createdLink.id}` : '';

    return (
        <div className="max-w-[800px] w-full flex flex-col gap-8 mx-auto">
            {/* Page Heading */}
            <header className="flex flex-wrap justify-between gap-3">
                <div className="flex flex-col gap-2">
                    <h1 className="text-gray-900 dark:text-white text-3xl font-black leading-tight tracking-tight">Crear Enlace</h1>
                    <p className="text-gray-500 dark:text-slate-400 text-sm">Configura el rastreo y la apariencia del enlace.</p>
                </div>
            </header>

            {/* Form Section */}
            {!createdLink ? (
                <section className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm">
                    {/* Destination Section */}
                    <div className="p-6 border-b border-gray-100 dark:border-slate-800">
                        <h2 className="text-gray-900 dark:text-white text-lg font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">alt_route</span>
                            Destino
                        </h2>
                        <div className="mt-4 flex flex-col gap-4">
                            <label className="flex flex-col gap-2">
                                <span className="text-gray-700 dark:text-slate-300 text-xs font-bold uppercase">URL de Destino</span>
                                <input
                                    name="destinationUrl"
                                    value={formData.destinationUrl}
                                    onChange={handleChange}
                                    className="w-full h-11 px-4 rounded-lg bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
                                    placeholder="https://ejemplo.com/pagina-objetivo"
                                    type="url"
                                    required
                                />
                            </label>
                        </div>
                    </div>

                    {/* Meta Data Section */}
                    <div className="p-6 bg-gray-50/50 dark:bg-slate-900/50">
                        <h2 className="text-gray-900 dark:text-white text-lg font-bold flex items-center gap-2 mb-6">
                            <span className="material-symbols-outlined text-primary">public</span>
                            Apariencia (Metadata)
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="flex flex-col gap-4">
                                <label className="flex flex-col gap-2">
                                    <span className="text-gray-700 dark:text-slate-300 text-xs font-bold uppercase">Título</span>
                                    <input
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        className="w-full h-11 px-4 rounded-lg bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
                                        placeholder="Ej: Te envío las fotos"
                                        type="text"
                                    />
                                </label>
                                <label className="flex flex-col gap-2">
                                    <span className="text-gray-700 dark:text-slate-300 text-xs font-bold uppercase">Descripción</span>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        className="w-full rounded-lg bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white resize-none"
                                        placeholder="Una breve descripción..."
                                        rows="3"
                                    ></textarea>
                                </label>
                                <label className="flex flex-col gap-2">
                                    <span className="text-gray-700 dark:text-slate-300 text-xs font-bold uppercase">Imagen (URL)</span>
                                    <input
                                        name="imageUrl"
                                        value={formData.imageUrl}
                                        onChange={handleChange}
                                        className="w-full h-11 px-4 rounded-lg bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
                                        placeholder="https://..."
                                        type="text"
                                    />
                                </label>
                                <label className="flex flex-col gap-2">
                                    <span className="text-gray-700 dark:text-slate-300 text-xs font-bold uppercase">Texto del Botón (CTA)</span>
                                    <select
                                        name="buttonText"
                                        value={formData.buttonText}
                                        onChange={handleChange}
                                        className="w-full h-11 px-4 rounded-lg bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
                                    >
                                        <option value="Más información">Más información</option>
                                        <option value="Leer más">Leer más</option>
                                        <option value="Ver ahora">Ver ahora</option>
                                        <option value="Descargar">Descargar</option>
                                        <option value="Regístrate">Regístrate</option>
                                        <option value="Comprar ahora">Comprar ahora</option>
                                    </select>
                                </label>
                            </div>

                            {/* Preview */}
                            <div>
                                <span className="text-gray-500 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 block">Vista Previa</span>
                                <div className="border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950 max-w-sm">
                                    <div className="h-32 bg-slate-100 dark:bg-slate-900 flex items-center justify-center relative overflow-hidden">
                                        {formData.imageUrl ? (
                                            <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-700">image</span>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <div className="font-bold text-slate-900 dark:text-white truncate">{formData.title || "Título del enlace"}</div>
                                        <div className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">{formData.description || "Descripción del enlace..."}</div>
                                        <div className="mt-4 flex justify-between items-center">
                                            <div className="text-[10px] text-slate-400 uppercase font-bold">GEMINI.DEV</div>
                                            <div className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded text-xs font-bold">{formData.buttonText}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-4 bg-gray-50 dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 flex justify-end">
                        <button
                            onClick={handleSubmit}
                            className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg shadow-primary/20 flex items-center gap-2 transition-all active:scale-95"
                        >
                            <span className="material-symbols-outlined text-sm">bolt</span>
                            Generar Enlace
                        </button>
                    </div>
                </section>
            ) : (
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl p-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-primary font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined">check_circle</span>
                                Enlace Listo
                            </h3>
                            <button
                                onClick={() => setCreatedLink(null)}
                                className="text-sm text-slate-500 hover:text-primary transition-colors font-medium"
                            >
                                Crear otro
                            </button>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 bg-white dark:bg-slate-950 border border-primary/20 rounded-lg flex items-center px-4 py-3 gap-3">
                                <span className="material-symbols-outlined text-primary/60">link</span>
                                <code className="text-slate-900 dark:text-white text-sm font-mono flex-1 truncate">{trackingUrl}</code>
                                <button
                                    onClick={() => navigator.clipboard.writeText(trackingUrl)}
                                    className="bg-primary text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-primary/90 transition-all"
                                >
                                    Copiar
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};

export default CreateLinkForm;
