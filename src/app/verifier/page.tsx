'use client';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { ShieldCheck, Loader2, CheckCircle2, XCircle, AlertCircle, Mail } from 'lucide-react';

export default function VerifierPage() {
    const [email, setEmail] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [result, setResult] = useState<{ status: 'valid' | 'invalid' | 'risky' | null }>({ status: null });

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setIsVerifying(true);
        setResult({ status: null });

        try {
            const response = await fetch('/api/verify', {
                method: 'POST',
                body: JSON.stringify({ email }),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            setResult({ status: data.status });
        } catch (err) {
            console.error('Verification error:', err);
            alert('Failed to verify email. Please try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50/30">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
                <div className="max-w-2xl mx-auto">
                    <div className="w-20 h-20 bg-brand-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
                        <ShieldCheck className="w-10 h-10 text-brand-600" />
                    </div>

                    <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Email Verifier</h1>
                    <p className="text-xl text-gray-600 mb-12">Stop bounces before they happen. Our verifier performs a multi-layer check on any mailbox.</p>

                    <form onSubmit={handleVerify} className="flex gap-4 mb-16 max-w-xl mx-auto">
                        <div className="relative flex-grow">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter email to verify"
                                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all shadow-sm"
                            />
                        </div>
                        <button
                            disabled={isVerifying}
                            className="px-8 py-4 brand-gradient text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
                        >
                            {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify'}
                        </button>
                    </form>

                    {result.status && (
                        <div className={`glass-card p-10 rounded-3xl border-2 transition-all shadow-xl animate-in fade-in zoom-in duration-300 ${result.status === 'valid' ? 'border-green-500/20' :
                            result.status === 'invalid' ? 'border-red-500/20' : 'border-amber-500/20'
                            }`}>
                            <div className="flex flex-col items-center gap-6">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${result.status === 'valid' ? 'bg-green-100' :
                                    result.status === 'invalid' ? 'bg-red-100' : 'bg-amber-100'
                                    }`}>
                                    {result.status === 'valid' && <CheckCircle2 className="w-8 h-8 text-green-600" />}
                                    {result.status === 'invalid' && <XCircle className="w-8 h-8 text-red-600" />}
                                    {result.status === 'risky' && <AlertCircle className="w-8 h-8 text-amber-600" />}
                                </div>

                                <div className="text-center">
                                    <p className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-1">Status Result</p>
                                    <h3 className={`text-4xl font-black ${result.status === 'valid' ? 'text-green-600' :
                                        result.status === 'invalid' ? 'text-red-600' : 'text-amber-600'
                                        }`}>
                                        {result.status === 'valid' ? 'Deliverable' :
                                            result.status === 'invalid' ? 'Undeliverable' : 'Risky / Catch-all'}
                                    </h3>
                                    <p className="text-gray-500 mt-4 max-w-sm mx-auto">
                                        {result.status === 'valid' ? 'The mailbox is active and ready to receive emails.' :
                                            result.status === 'invalid' ? 'This email address does not exist or has been disabled.' :
                                                'The server accepts all emails (Catch-all) or is currently graylisting.'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 w-full pt-8 border-t border-gray-100 mt-4">
                                    <div className="text-left">
                                        <p className="text-xs font-bold text-gray-400 uppercase">Format</p>
                                        <p className="text-sm font-semibold text-gray-800 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> Valid Syntax</p>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs font-bold text-gray-400 uppercase">Mail Server</p>
                                        <p className="text-sm font-semibold text-gray-800 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> MX Found</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
