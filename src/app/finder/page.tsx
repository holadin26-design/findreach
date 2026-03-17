'use client';
import { useState, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { Search, Loader2, Check, X, AlertTriangle, Copy, UserPlus, Mail } from 'lucide-react';
import { EmailPatternService } from '@/services/emailPatternService';

type StatusType = 'valid' | 'invalid' | 'risky' | 'unknown';
type EmailResult = { email: string; status: StatusType };

export default function FinderPage() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [domain, setDomain] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<EmailResult[]>([]);
    const [savedEmails, setSavedEmails] = useState<Set<string>>(new Set());
    const [filter, setFilter] = useState<'all' | 'valid'>('all');
    const abortControllerRef = useRef<AbortController | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firstName || !lastName || !domain) return;

        // Cancel any previous in-flight requests
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;

        setIsSearching(true);
        setResults([]);
        setFilter('all');

        const patterns = EmailPatternService.generatePatterns(firstName, lastName, domain);
        setResults(patterns.map(p => ({ email: p, status: 'unknown' as StatusType })));

        let foundValid = false;
        for (const pattern of patterns) {
            if (controller.signal.aborted) break;
            try {
                const response = await fetch('/api/verify', {
                    method: 'POST',
                    body: JSON.stringify({ email: pattern }),
                    headers: { 'Content-Type': 'application/json' },
                    signal: controller.signal,
                });
                const data = await response.json();
                if (!controller.signal.aborted) {
                    if (data.status === 'valid') foundValid = true;
                    setResults(prev => prev.map(r =>
                        r.email === pattern ? { ...r, status: (data.status as StatusType) || 'unknown' } : r
                    ));
                }
            } catch (err: any) {
                if (err.name === 'AbortError') break;
                console.error('Verification failed for:', pattern, err);
            }
        }

        // Fallback to info@domain if none found valid
        if (!foundValid && !controller.signal.aborted) {
            const fallbackEmail = `info@${domain}`;
            setResults(prev => [...prev, { email: fallbackEmail, status: 'unknown' }]);

            try {
                const response = await fetch('/api/verify', {
                    method: 'POST',
                    body: JSON.stringify({ email: fallbackEmail }),
                    headers: { 'Content-Type': 'application/json' },
                    signal: controller.signal,
                });
                const data = await response.json();
                if (!controller.signal.aborted) {
                    setResults(prev => prev.map(r =>
                        r.email === fallbackEmail ? { ...r, status: (data.status as StatusType) || 'unknown' } : r
                    ));
                }
            } catch (err: any) {
                console.error('Fallback verification failed for:', fallbackEmail, err);
            }
        }

        if (!controller.signal.aborted) {
            setIsSearching(false);
        }
    };

    const saveLead = async (lead: EmailResult) => {
        try {
            const savedLeads = JSON.parse(localStorage.getItem('findreach_leads') || '[]');
            
            // Avoid duplicates
            if (!savedLeads.some((l: any) => l.email === lead.email)) {
                const newLead = {
                    firstName,
                    lastName,
                    domain,
                    email: lead.email,
                    status: lead.status,
                    savedAt: new Date().toISOString()
                };
                
                const updatedLeads = [newLead, ...savedLeads];
                localStorage.setItem('findreach_leads', JSON.stringify(updatedLeads));
            }
            
            setSavedEmails(prev => new Set(prev).add(lead.email));
        } catch (e) {
            console.error("Failed to save lead", e);
            alert('Failed to save lead locally.');
        }
    };

    const validEmails = results.filter(r => r.status === 'valid');
    const displayedResults = filter === 'valid' ? validEmails : results;
    const checkingCount = results.filter(r => r.status === 'unknown').length;

    const cardClass = (status: StatusType) => {
        if (status === 'valid') return 'border-green-200 bg-green-50/40 hover:border-green-300';
        if (status === 'risky') return 'border-yellow-200 bg-yellow-50/30 hover:border-yellow-300';
        if (status === 'invalid') return 'border-gray-100 opacity-50 hover:opacity-100';
        return 'border-gray-100 hover:border-brand-200';
    };

    const iconClass = (status: StatusType) => {
        if (status === 'valid') return 'bg-green-100 text-green-600';
        if (status === 'risky') return 'bg-yellow-100 text-yellow-600';
        if (status === 'invalid') return 'bg-gray-100 text-gray-300';
        return 'bg-blue-50 text-brand-400';
    };

    const StatusIcon = ({ status }: { status: StatusType }) => {
        if (status === 'valid') return <Check className="w-5 h-5" />;
        if (status === 'risky') return <AlertTriangle className="w-4 h-4" />;
        if (status === 'invalid') return <X className="w-5 h-5" />;
        return <Loader2 className="w-5 h-5 animate-spin" />;
    };

    const statusBadge = (status: StatusType) => {
        if (status === 'valid') return <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-bold">✓ Valid</span>;
        if (status === 'risky') return <span className="ml-2 text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-bold">⚠ Risky</span>;
        return null;
    };

    const statusLabel = (status: StatusType) => {
        if (status === 'valid') return 'Verified via SMTP';
        if (status === 'risky') return 'Domain OK · SMTP unverified';
        if (status === 'invalid') return 'Undeliverable';
        return 'Checking…';
    };

    return (
        <main className="min-h-screen bg-gray-50/30">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Email Finder</h1>
                    <p className="text-gray-600 mb-8">Enter a name and company domain to discover professional emails.</p>

                    <form onSubmit={handleSearch} className="glass-card p-8 rounded-3xl mb-10 border border-gray-200 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                                    placeholder="John" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                                    placeholder="Doe" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Company Domain</label>
                                <input type="text" value={domain} onChange={e => setDomain(e.target.value)}
                                    placeholder="google.com" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all" />
                            </div>
                        </div>
                        <button disabled={isSearching}
                            className="w-full py-4 brand-gradient text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                            {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                            {isSearching ? `Verifying… ${checkingCount > 0 ? `(${checkingCount} left)` : ''}` : 'Find Email Address'}
                        </button>
                    </form>

                    {results.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <h2 className="text-xl font-bold text-gray-900">
                                    Results
                                    {validEmails.length > 0 && (
                                        <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                                            {validEmails.length} valid
                                        </span>
                                    )}
                                </h2>
                                <div className="flex items-center gap-2 text-sm font-semibold">
                                    <button onClick={() => setFilter('all')}
                                        className={`px-3 py-1 rounded-full transition-all ${filter === 'all' ? 'brand-gradient text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
                                        All ({results.length})
                                    </button>
                                    <button onClick={() => setFilter('valid')}
                                        className={`px-3 py-1 rounded-full transition-all ${filter === 'valid' ? 'bg-green-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
                                        Valid ({validEmails.length})
                                    </button>
                                </div>
                            </div>

                            <div className="grid gap-3">
                                {displayedResults.map((res, i) => (
                                    <div key={`${res.email}-${i}`}
                                        className={`glass-card p-4 rounded-2xl flex items-center justify-between border transition-all hover:shadow-md group ${cardClass(res.status)}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconClass(res.status)}`}>
                                                <StatusIcon status={res.status} />
                                            </div>
                                            <div>
                                                <p className={`font-semibold ${res.status === 'valid' ? 'text-green-900' : res.status === 'risky' ? 'text-yellow-800' : 'text-gray-900'}`}>
                                                    {res.email}
                                                    {statusBadge(res.status)}
                                                </p>
                                                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mt-0.5">
                                                    {statusLabel(res.status)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                            <button onClick={() => navigator.clipboard.writeText(res.email)}
                                                className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-brand-500 border border-transparent hover:border-gray-100 transition-all" title="Copy email">
                                                <Copy className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => saveLead(res)} disabled={savedEmails.has(res.email)}
                                                className={`p-2 rounded-lg border transition-all ${savedEmails.has(res.email) ? 'text-green-500 bg-green-50 border-green-100 cursor-default' : 'text-gray-400 hover:text-green-500 border-transparent hover:border-gray-100 hover:bg-white'}`}
                                                title={savedEmails.has(res.email) ? 'Saved!' : 'Save to leads'}>
                                                <UserPlus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {filter === 'valid' && validEmails.length === 0 && (
                                <div className="text-center py-12 text-gray-400">
                                    <Mail className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                    <p className="font-semibold">No verified emails yet</p>
                                    <p className="text-sm mt-1">
                                        Still checking… switch to{' '}
                                        <button onClick={() => setFilter('all')} className="text-brand-500 underline">All</button> to see progress.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
