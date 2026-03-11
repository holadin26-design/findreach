'use client';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { Chrome, Loader2, Mail, ShieldCheck, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
    const { user, signInWithGoogle, loading } = useAuth();
    const router = useRouter();

    // If already logged in, redirect to finder
    useEffect(() => {
        if (user && !loading) {
            router.push('/finder');
        }
    }, [user, loading, router]);

    return (
        <main className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    {/* Card */}
                    <div className="glass-card rounded-3xl p-10 border border-gray-200 shadow-xl text-center">

                        {/* Logo */}
                        <div className="w-16 h-16 brand-gradient rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                            <Mail className="text-white w-8 h-8" />
                        </div>

                        <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
                            Welcome to FindReach
                        </h1>
                        <p className="text-gray-500 mb-10">
                            Sign in to start finding and verifying professional emails.
                        </p>

                        {/* Google Sign In Button */}
                        <button
                            id="google-signin-btn"
                            onClick={signInWithGoogle}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-white border-2 border-gray-200 rounded-2xl font-bold text-gray-800 hover:border-brand-400 hover:shadow-md transition-all disabled:opacity-50 group"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
                            ) : (
                                <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                            )}
                            <span className="group-hover:text-brand-600 transition-colors">
                                {loading ? 'Signing in...' : 'Continue with Google'}
                            </span>
                        </button>

                        {/* Trust signals */}
                        <div className="mt-10 pt-8 border-t border-gray-100 grid grid-cols-3 gap-4 text-center">
                            <div>
                                <ShieldCheck className="w-5 h-5 text-green-500 mx-auto mb-1" />
                                <p className="text-xs text-gray-500 font-medium">Secure Auth</p>
                            </div>
                            <div>
                                <Zap className="w-5 h-5 text-brand-500 mx-auto mb-1" />
                                <p className="text-xs text-gray-500 font-medium">Instant Access</p>
                            </div>
                            <div>
                                <Mail className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                                <p className="text-xs text-gray-500 font-medium">50 Free Credits</p>
                            </div>
                        </div>
                    </div>

                    <p className="text-center text-xs text-gray-400 mt-6">
                        By signing in, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </div>
            </div>
        </main>
    );
}
