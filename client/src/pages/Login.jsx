import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await login(email, password);
        if (success) {
            if (email === 'admin@admin') navigate('/admin');
            else navigate('/create');
        } else {
            alert('Login failed');
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col font-display">
            {/* Top Navigation */}
            <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-[#e5e7eb] dark:border-[#233648] px-10 py-3 bg-white dark:bg-background-dark">
                <div className="flex items-center gap-4 text-slate-900 dark:text-white">
                    <div className="size-6 text-primary">
                        <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                            <path d="M24 4C25.7818 14.2173 33.7827 22.2182 44 24C33.7827 25.7818 25.7818 33.7827 24 44C22.2182 33.7827 14.2173 25.7818 4 24C14.2173 22.2182 22.2182 14.2173 24 4Z" fill="currentColor"></path>
                        </svg>
                    </div>
                    <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">Ubicar</h2>
                </div>
                <button className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors">
                    <span className="truncate">Request Access</span>
                </button>
            </header>

            {/* Main Content Area with Grid Background */}
            <main className="flex-1 flex items-center justify-center p-6 bg-grid-pattern relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background-light/50 dark:to-background-dark/50 pointer-events-none"></div>

                {/* Login Card */}
                <div className="w-full max-w-[480px] bg-white dark:bg-[#192633] rounded-xl shadow-2xl border border-[#e5e7eb] dark:border-[#233648] p-8 z-10">

                    {/* Branding/Headline */}
                    <div className="text-center mb-8">
                        <h1 className="text-slate-900 dark:text-white tracking-tight text-[32px] font-bold leading-tight pb-2">Sign in to Ubicar</h1>
                        <p className="text-slate-500 dark:text-[#92adc9] text-sm font-normal leading-normal">Geolocation Tracking Dashboard</p>
                    </div>

                    {/* Role Selector (Segmented Buttons) - Visual Only for now as functionality is auto-determined */}
                    <div className="mb-6">
                        <p className="text-slate-900 dark:text-white text-sm font-medium leading-normal mb-2 text-center">Select Environment</p>
                        <div className="flex h-11 items-center justify-center rounded-lg bg-slate-100 dark:bg-[#233648] p-1">
                            <label className="flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 has-[:checked]:bg-white dark:has-[:checked]:bg-[#111a22] has-[:checked]:shadow-sm has-[:checked]:text-primary text-slate-500 dark:text-[#92adc9] text-sm font-medium leading-normal transition-all">
                                <span className="truncate">Admin Portal</span>
                                <input className="hidden" name="role-toggle" type="radio" value="Admin" defaultChecked={email === 'admin@admin'} />
                            </label>
                            <label className="flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 has-[:checked]:bg-white dark:has-[:checked]:bg-[#111a22] has-[:checked]:shadow-sm has-[:checked]:text-primary text-slate-500 dark:text-[#92adc9] text-sm font-medium leading-normal transition-all">
                                <span className="truncate">User Dashboard</span>
                                <input className="hidden" name="role-toggle" type="radio" value="User" defaultChecked={email !== 'admin@admin'} />
                            </label>
                        </div>
                    </div>

                    {/* Form */}
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        {/* Email Field */}
                        <div className="flex flex-col gap-2">
                            <label className="text-slate-900 dark:text-white text-sm font-medium leading-normal">Email Address</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#92adc9] text-[20px]">mail</span>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#d1d5db] dark:border-[#324d67] bg-white dark:bg-[#111a22] h-12 placeholder:text-slate-400 dark:placeholder:text-[#92adc9] pl-12 pr-4 text-sm font-normal transition-all"
                                    placeholder="name@company.com"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <label className="text-slate-900 dark:text-white text-sm font-medium leading-normal">Password</label>
                                <a href="#" className="text-primary text-xs font-semibold hover:underline">Forgot password?</a>
                            </div>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#92adc9] text-[20px]">lock</span>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#d1d5db] dark:border-[#324d67] bg-white dark:bg-[#111a22] h-12 placeholder:text-slate-400 dark:placeholder:text-[#92adc9] pl-12 pr-12 text-sm font-normal transition-all"
                                    placeholder="••••••••"
                                />
                                <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#92adc9] hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                                </button>
                            </div>
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center gap-2 py-2">
                            <input id="remember" type="checkbox" className="size-4 rounded border-slate-300 dark:border-[#324d67] text-primary focus:ring-primary bg-white dark:bg-[#111a22]" />
                            <label htmlFor="remember" className="text-slate-600 dark:text-[#92adc9] text-xs">Keep me signed in for 30 days</label>
                        </div>

                        {/* Sign In Button */}
                        <button type="submit" className="w-full flex h-12 items-center justify-center rounded-lg bg-primary text-white text-base font-bold tracking-wide hover:bg-primary/90 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all">
                            Sign In to Dashboard
                        </button>
                    </form>

                    {/* Footer Note */}
                    <div className="mt-8 pt-6 border-t border-[#e5e7eb] dark:border-[#233648] text-center">
                        <p className="text-slate-400 dark:text-[#92adc9]/60 text-[10px] uppercase tracking-widest font-bold">
                            Authorized Use Only • All actions are logged
                        </p>
                        <div className="mt-4 flex justify-center gap-4">
                            <span className="material-symbols-outlined text-slate-300 dark:text-[#233648] text-[24px]">verified_user</span>
                            <span className="material-symbols-outlined text-slate-300 dark:text-[#233648] text-[24px]">security</span>
                            <span className="material-symbols-outlined text-slate-300 dark:text-[#233648] text-[24px]">public</span>
                        </div>
                    </div>

                </div>
            </main>

            {/* Page Footer */}
            <footer className="p-6 text-center text-slate-500 dark:text-[#92adc9] text-xs">
                <p>© 2024 Ubicar Geolocation Systems. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Login;
