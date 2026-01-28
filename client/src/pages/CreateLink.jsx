import React, { useState } from 'react';
import api from '../services/api';

const CreateLink = () => {
    const [formData, setFormData] = useState({
        destinationUrl: '',
        title: '',
        description: '',
        imageUrl: ''
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
                            GeoTracker Admin
                        </h1>
                        <p className="text-gray-500 dark:text-text-muted text-xs font-normal">Security Testing Suite</p>
                    </div>
                    <nav className="flex flex-col gap-2">
                        <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 dark:text-text-muted hover:bg-gray-100 dark:hover:bg-surface-dark transition-all">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
                            <p className="text-sm font-medium">Dashboard</p>
                        </a>
                        <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
                            <span className="material-symbols-outlined">add_link</span>
                            <p className="text-sm font-bold">Create Link</p>
                        </a>
                        <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 dark:text-text-muted hover:bg-gray-100 dark:hover:bg-surface-dark transition-all">
                            <span className="material-symbols-outlined">link</span>
                            <p className="text-sm font-medium">My Links</p>
                        </a>
                        <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 dark:text-text-muted hover:bg-gray-100 dark:hover:bg-surface-dark transition-all">
                            <span className="material-symbols-outlined">analytics</span>
                            <p className="text-sm font-medium">Analytics</p>
                        </a>
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-border-dark">
                            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 dark:text-text-muted hover:bg-gray-100 dark:hover:bg-surface-dark transition-all">
                                <span className="material-symbols-outlined">settings</span>
                                <p className="text-sm font-medium">Settings</p>
                            </a>
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
                            <h1 className="text-gray-900 dark:text-white text-4xl font-black leading-tight tracking-tight">Create Tracking Link</h1>
                            <p className="text-gray-500 dark:text-text-muted text-base">Configure your tracking parameters and social engineering metadata.</p>
                        </div>
                    </header>

                    {/* Form Section */}
                    {!createdLink ? (
                        <section className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-border-dark overflow-hidden shadow-sm">
                            {/* Destination Section */}
                            <div className="p-6 border-b border-gray-100 dark:border-border-dark">
                                <h2 className="text-gray-900 dark:text-white text-xl font-bold flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">alt_route</span>
                                    Destination Settings
                                </h2>
                                <div className="mt-6 flex flex-col gap-4">
                                    <label className="flex flex-col gap-2">
                                        <span className="text-gray-700 dark:text-white text-sm font-semibold">Destination URL</span>
                                        <input
                                            name="destinationUrl"
                                            value={formData.destinationUrl}
                                            onChange={handleChange}
                                            className="form-input flex w-full rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-gray-300 dark:border-border-dark bg-gray-50 dark:bg-background-dark h-14 placeholder:text-gray-400 dark:placeholder:text-text-muted p-4 text-base transition-all"
                                            placeholder="https://example.com/target-page"
                                            type="url"
                                        />
                                        <span className="text-xs text-gray-500 dark:text-text-muted italic">Users will be redirected here after their geolocation is captured.</span>
                                    </label>
                                </div>
                            </div>

                            {/* Social Engineering Section */}
                            <div className="p-6 bg-gray-50/50 dark:bg-surface-dark">
                                <h2 className="text-gray-900 dark:text-white text-xl font-bold flex items-center gap-2 mb-6">
                                    <span className="material-symbols-outlined text-primary">public</span>
                                    Social Engineering Details
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-5">
                                        <label className="flex flex-col gap-2">
                                            <span className="text-gray-700 dark:text-white text-sm font-semibold">Preview Title</span>
                                            <input
                                                name="title"
                                                value={formData.title}
                                                onChange={handleChange}
                                                className="form-input w-full rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-border-dark bg-gray-50 dark:bg-background-dark h-12 p-3 text-sm focus:ring-2 focus:ring-primary/50"
                                                placeholder="e.g., You've received a file"
                                                type="text"
                                            />
                                        </label>
                                        <label className="flex flex-col gap-2">
                                            <span className="text-gray-700 dark:text-white text-sm font-semibold">Description</span>
                                            <textarea
                                                name="description"
                                                value={formData.description}
                                                onChange={handleChange}
                                                className="form-input w-full rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-border-dark bg-gray-50 dark:bg-background-dark p-3 text-sm focus:ring-2 focus:ring-primary/50 resize-none"
                                                placeholder="A brief description for the link preview..."
                                                rows="3"
                                            ></textarea>
                                        </label>
                                        <label className="flex flex-col gap-2">
                                            <span className="text-gray-700 dark:text-white text-sm font-semibold">Thumbnail Image URL</span>
                                            <div className="relative">
                                                <input
                                                    name="imageUrl"
                                                    value={formData.imageUrl}
                                                    onChange={handleChange}
                                                    className="form-input w-full rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-border-dark bg-gray-50 dark:bg-background-dark h-12 pl-10 pr-3 text-sm focus:ring-2 focus:ring-primary/50"
                                                    placeholder="https://image-server.com/photo.jpg"
                                                    type="text"
                                                />
                                                <span className="material-symbols-outlined absolute left-3 top-3 text-gray-400 text-lg">image</span>
                                            </div>
                                        </label>
                                    </div>

                                    {/* Preview Helper */}
                                    <div className="flex flex-col gap-2">
                                        <span className="text-gray-500 dark:text-text-muted text-xs font-bold uppercase tracking-wider">Live Meta Preview</span>
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
                                                <div className="font-bold text-gray-900 dark:text-white truncate">{formData.title || "Loading..."}</div>
                                                <div className="text-sm text-gray-500 dark:text-text-muted line-clamp-2">{formData.description || "Link description..."}</div>
                                                <div className="mt-2 text-[10px] text-gray-400 uppercase font-bold tracking-widest">EXAMPLE.COM</div>
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-gray-400 dark:text-text-muted mt-2">
                                            <span className="material-symbols-outlined text-[14px] align-middle mr-1">info</span>
                                            This is how your link will appear when shared on Slack, Discord, or LinkedIn.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Footer */}
                            <div className="px-6 py-6 bg-gray-100 dark:bg-background-dark/50 flex justify-end items-center gap-4">
                                <button
                                    onClick={() => setFormData({ destinationUrl: '', title: '', description: '', imageUrl: '' })}
                                    className="px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-text-muted hover:text-gray-900 dark:hover:text-white transition-colors">
                                    Clear Form
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-primary/20 flex items-center gap-2 transition-all active:scale-[0.98]">
                                    <span className="material-symbols-outlined">bolt</span>
                                    Generate Tracking Link
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
                                        Tracking Link Generated Successfully
                                    </h3>
                                    <span className="text-xs font-medium text-primary bg-primary/20 px-2 py-1 rounded">Active</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 bg-white dark:bg-background-dark border border-primary/30 rounded-lg flex items-center px-4 py-3 gap-3">
                                        <span className="material-symbols-outlined text-primary/60">link</span>
                                        <code className="text-gray-900 dark:text-white text-sm font-mono flex-1">{trackingUrl}</code>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(trackingUrl)}
                                            className="flex items-center gap-1.5 bg-primary text-white px-4 py-1.5 rounded-md text-xs font-bold hover:bg-primary/90 transition-all">
                                            <span className="material-symbols-outlined text-sm">content_copy</span>
                                            Copy
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
                                        <span className="text-[10px] text-gray-400 dark:text-text-muted uppercase font-bold">Total Clicks</span>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">0</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-gray-400 dark:text-text-muted uppercase font-bold">Security Level</span>
                                        <span className="text-sm font-bold text-green-500">High</span>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            </main>
        </div>
    );
};

export default CreateLink;
