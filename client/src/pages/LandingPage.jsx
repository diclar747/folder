import React from 'react';
import { Link } from 'react-router-dom';
import viralBg from '../assets/viral_hero_bg.png';
import viralLogo from '../assets/viral_logo.png';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-background-dark text-white font-display overflow-x-hidden">
            {/* Navbar */}
            <nav className="fixed w-full z-50 bg-background-dark/80 backdrop-blur-md border-b border-border-dark">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-3">
                            <img src={viralLogo} alt="Viral Logo" className="h-10 w-10 object-contain" />
                            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                                Viral
                            </span>
                        </div>
                        <div>
                            <Link
                                to="/login"
                                className="px-6 py-2 bg-primary hover:bg-blue-600 text-white rounded-full font-medium transition-all transform hover:scale-105 shadow-lg shadow-blue-500/30"
                            >
                                Ingresar
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative h-screen flex items-center justify-center overflow-hidden">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                    <img
                        src={viralBg}
                        alt="Background Map"
                        className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/50 to-transparent"></div>
                </div>

                {/* Content */}
                <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-16">
                    <div className="inline-block px-4 py-1.5 mb-6 rounded-full border border-cyan-500/30 bg-cyan-900/20 text-cyan-300 text-sm font-semibold tracking-wider uppercase backdrop-blur-sm">
                        Sistema de Geolocalización Avanzado
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-200 to-cyan-200 mb-6 drop-shadow-sm">
                        El poder de la ubicación en tus manos
                    </h1>
                    <p className="text-xl md:text-2xl text-text-muted mb-10 max-w-2xl mx-auto leading-relaxed">
                        Rastreo preciso, historial detallado y seguridad de nivel empresarial. La plataforma definitiva para monitoreo en tiempo real.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to="/login"
                            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-bold text-lg shadow-xl shadow-cyan-500/20 transition-all transform hover:-translate-y-1"
                        >
                            Comenzar Ahora
                        </Link>
                        <a
                            href="#features"
                            className="w-full sm:w-auto px-8 py-4 bg-surface-dark border border-border-dark hover:border-cyan-500/50 text-white rounded-xl font-medium transition-all"
                        >
                            Ver Características
                        </a>
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <div id="features" className="py-24 bg-background-dark relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                title: "Tiempo Real", desc: "Monitoreo GPS con latencia cero y actualizaciones instantáneas.", icon: (
                                    <svg className="w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                )
                            },
                            {
                                title: "Seguridad Total", desc: "Encriptación de grado militar para todos los datos de ubicación.", icon: (
                                    <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                )
                            },
                            {
                                title: "Historial Completo", desc: "Registro detallado de rutas, paradas y tiempos de permanencia.", icon: (
                                    <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-1.447-.894L15 7m0 13V7" /></svg>
                                )
                            }
                        ].map((feature, i) => (
                            <div key={i} className="p-8 bg-surface-dark border border-border-dark rounded-2xl hover:border-cyan-500/30 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-900/20">
                                <div className="w-14 h-14 bg-background-dark rounded-xl flex items-center justify-center mb-6 border border-border-dark">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                                <p className="text-text-muted leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer Request */}
            <footer className="bg-[#0b1118] py-12 border-t border-border-dark">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="mb-6 flex justify-center items-center space-x-2 opacity-50">
                        <img src={viralLogo} alt="Viral" className="h-6 w-6 grayscale" />
                        <span className="font-bold text-lg">Viral</span>
                    </div>
                    <p className="text-gray-500 text-sm mb-2">
                        © 2024 Ubicar Geolocation Systems. All rights reserved.
                    </p>
                    <p className="text-gray-600 text-xs">
                        Desarrollado por CNID: Todos los Derechos Reservados por CNID Centro-Nacional-Información-Digital NRO REG:17789
                    </p>
                </div>
            </footer>

            {/* Floating WhatsApp Button */}
            <a
                href="https://wa.me/595994854167"
                target="_blank"
                rel="noopener noreferrer"
                className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20bd5a] text-white p-4 rounded-full shadow-lg shadow-green-900/30 transition-all transform hover:scale-110 hover:rotate-3 group"
                aria-label="Contactar por WhatsApp"
            >
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
            </a>
        </div>
    );
};

export default LandingPage;
