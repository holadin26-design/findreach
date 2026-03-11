'use client';
import Link from 'next/link';
import { Mail, LogOut, User, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
    const { user, signOut, signInWithGoogle, loading } = useAuth();

    return (
        <nav className="sticky top-0 z-50 w-full glass-card border-b border-gray-200/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 brand-gradient rounded-lg flex items-center justify-center">
                            <Mail className="text-white w-5 h-5" />
                        </div>
                        <span className="text-xl font-bold brand-gradient-text tracking-tight">FindReach</span>
                    </Link>

                    {/* Nav Links */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link href="/finder" className="text-sm font-medium text-gray-600 hover:text-brand-500 transition-colors">Email Finder</Link>
                        <Link href="/verifier" className="text-sm font-medium text-gray-600 hover:text-brand-500 transition-colors">Verifier</Link>
                        <Link href="/leads" className="text-sm font-medium text-gray-600 hover:text-brand-500 transition-colors">My Leads</Link>
                    </div>

                    {/* Auth Section */}
                    <div className="flex items-center gap-3">
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                        ) : user ? (
                            /* Logged in: show avatar + sign out */
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200">
                                    <div className="w-6 h-6 brand-gradient rounded-full flex items-center justify-center">
                                        {user.user_metadata?.avatar_url ? (
                                            <img src={user.user_metadata.avatar_url} alt="avatar" className="w-6 h-6 rounded-full" />
                                        ) : (
                                            <User className="w-4 h-4 text-white" />
                                        )}
                                    </div>
                                    <span className="text-sm font-semibold text-gray-700 max-w-[100px] truncate">
                                        {user.user_metadata?.full_name || user.email}
                                    </span>
                                </div>
                                <button
                                    id="signout-btn"
                                    onClick={signOut}
                                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                    title="Sign out"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            /* Logged out: show login/signup */
                            <>
                                <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-brand-500 transition-colors">Login</Link>
                                <button
                                    id="google-signin-navbar-btn"
                                    onClick={signInWithGoogle}
                                    className="px-4 py-2 brand-gradient text-white rounded-full text-sm font-semibold hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                                >
                                    Get Started
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
