'use client';
import { useState, useRef } from 'react';
import { Search, ShieldCheck, Zap, Loader2, Check, X, AlertTriangle, Copy, Upload, Download, ArrowRight } from 'lucide-react';
import { EmailPatternService } from '@/services/emailPatternService';

type StatusType = 'valid' | 'invalid' | 'risky' | 'unknown' | 'pending' | 'skipped';
type BulkResult = {
    id: string;
    input: string;
    email: string;
    status: StatusType;
};

export default function BulkTools() {
    const [activeTab, setActiveTab] = useState<'finder' | 'validator'>('finder');

    // Bulk Finder State
    const [finderInput, setFinderInput] = useState('');
    const [finderResults, setFinderResults] = useState<BulkResult[]>([]);
    const [isFinding, setIsFinding] = useState(false);

    // Bulk Validator State
    const [validatorInput, setValidatorInput] = useState('');
    const [validatorResults, setValidatorResults] = useState<BulkResult[]>([]);
    const [isValidating, setIsValidating] = useState(false);

    const skipCurrentRef = useRef<boolean>(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    // --- Bulk Finder Logic ---
    const handleBulkFind = async () => {
        if (!finderInput.trim()) return;

        // Parse input: format should be "FirstName LastName, company.com" per line
        const lines = finderInput.split('\n').filter(l => l.trim().length > 0);
        const parsedTargets = lines.map(line => {
            // Basic splitting by comma or space
            const parts = line.split(/[,|\t]+/);
            if (parts.length >= 2) {
                const nameParts = parts[0].trim().split(' ');
                return {
                    original: line,
                    firstName: nameParts[0] || '',
                    lastName: nameParts.slice(1).join(' ') || '',
                    domain: parts[1].trim()
                };
            }
            return null;
        }).filter(Boolean);

        if (parsedTargets.length === 0) {
            alert('Please use format: First Last, domain.com');
            return;
        }

        if (abortControllerRef.current) abortControllerRef.current.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        setIsFinding(true);
        setFinderResults(parsedTargets.map((t, i) => ({
            id: `f-${i}`,
            input: t!.original,
            email: 'Generating patterns...',
            status: 'pending'
        })));

        for (let i = 0; i < parsedTargets.length; i++) {
            if (controller.signal.aborted) break;

            // Reset skip flag for the new target
            skipCurrentRef.current = false;

            const target = parsedTargets[i]!;

            // Generate patterns
            const patterns = EmailPatternService.generatePatterns(target.firstName, target.lastName, target.domain);
            let foundValid = false;

            // Test patterns one by one for this target
            for (const pattern of patterns) {
                if (controller.signal.aborted) break;
                if (skipCurrentRef.current) {
                    setFinderResults(prev => prev.map(r => r.id === `f-${i}` ? { ...r, email: 'Skipped by user', status: 'skipped' } : r));
                    break; // break pattern loop, move to next target
                }

                // Update UI to show what we're currently checking
                setFinderResults(prev => prev.map(r => r.id === `f-${i}` ? { ...r, email: `Checking ${pattern}...`, status: 'unknown' } : r));

                try {
                    const response = await fetch('/api/verify', {
                        method: 'POST',
                        body: JSON.stringify({ email: pattern }),
                        headers: { 'Content-Type': 'application/json' },
                        signal: controller.signal,
                    });
                    const data = await response.json();

                    if (data.status === 'valid') {
                        // Boom, found it.
                        setFinderResults(prev => prev.map(r => r.id === `f-${i}` ? { ...r, email: pattern, status: 'valid' } : r));
                        foundValid = true;
                        break;
                    } else if (data.status === 'risky') {
                        // Save risky and keep checking, but if nothing better is found this is our fallback. We'll simplify to just keeping the first risky if no valid.
                        setFinderResults(prev => {
                            const existing = prev.find(x => x.id === `f-${i}`);
                            if (existing?.status !== 'risky') {
                                return prev.map(r => r.id === `f-${i}` ? { ...r, email: pattern, status: 'risky' } : r);
                            }
                            return prev;
                        });
                    }
                } catch (err: any) {
                    if (err.name === 'AbortError') break;
                }
            }

            // Once patterns are exhausted, if we never found valid and the status isn't already risky from a previous hit
            if (!foundValid && !skipCurrentRef.current) {
                const fallbackEmail = `info@${target.domain}`;
                setFinderResults(prev => prev.map(r => r.id === `f-${i}` ? { ...r, email: `Checking fallback ${fallbackEmail}...`, status: 'unknown' } : r));

                try {
                    const response = await fetch('/api/verify', {
                        method: 'POST',
                        body: JSON.stringify({ email: fallbackEmail }),
                        headers: { 'Content-Type': 'application/json' },
                        signal: controller.signal,
                    });
                    const data = await response.json();

                    if (data.status === 'valid') {
                        setFinderResults(prev => prev.map(r => r.id === `f-${i}` ? { ...r, email: fallbackEmail, status: 'valid' } : r));
                    } else {
                        // If fallback also fails, mark as invalid (unless already risky)
                        setFinderResults(prev => {
                            const existing = prev.find(x => x.id === `f-${i}`);
                            if (existing && existing.status === 'unknown') {
                                return prev.map(r => r.id === `f-${i}` ? { ...r, email: 'No valid email found', status: 'invalid' } : r);
                            }
                            return prev;
                        });
                    }
                } catch (err: any) {
                    console.error('Bulk fallback verification failed for:', fallbackEmail, err);
                    setFinderResults(prev => {
                        const existing = prev.find(x => x.id === `f-${i}`);
                        if (existing && existing.status === 'unknown') {
                            return prev.map(r => r.id === `f-${i}` ? { ...r, email: 'No valid email found', status: 'invalid' } : r);
                        }
                        return prev;
                    });
                }
            } else if (skipCurrentRef.current) {
                // skip logic already handled inside pattern loop, but ensuring state is correct if somehow missed
            }
        }

        if (!controller.signal.aborted) setIsFinding(false);
    };

    const handleSkipCurrent = () => {
        skipCurrentRef.current = true;
    };

    // --- Bulk Validator Logic ---
    const handleBulkValidate = async () => {
        if (!validatorInput.trim()) return;

        // Parse input: extract emails using regex
        const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
        const emails = validatorInput.match(emailRegex) || [];

        // Remove duplicates
        const uniqueEmails = Array.from(new Set(emails));

        if (uniqueEmails.length === 0) {
            alert('No valid emails found in your input.');
            return;
        }

        if (abortControllerRef.current) abortControllerRef.current.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        setIsValidating(true);
        setValidatorResults(uniqueEmails.map((email, i) => ({
            id: `v-${i}`,
            input: email,
            email: email,
            status: 'pending'
        })));

        for (let i = 0; i < uniqueEmails.length; i++) {
            if (controller.signal.aborted) break;
            const email = uniqueEmails[i];

            setValidatorResults(prev => prev.map(r => r.id === `v-${i}` ? { ...r, status: 'unknown' } : r));

            try {
                const response = await fetch('/api/verify', {
                    method: 'POST',
                    body: JSON.stringify({ email: email }),
                    headers: { 'Content-Type': 'application/json' },
                    signal: controller.signal,
                });
                const data = await response.json();

                setValidatorResults(prev => prev.map(r => r.id === `v-${i}` ? { ...r, status: data.status } : r));
            } catch (err: any) {
                if (err.name === 'AbortError') break;
                setValidatorResults(prev => prev.map(r => r.id === `v-${i}` ? { ...r, status: 'invalid' } : r));
            }
        }

        if (!controller.signal.aborted) setIsValidating(false);
    };


    const exportCSV = (results: BulkResult[], filename: string) => {
        const csvContent = "data:text/csv;charset=utf-8,"
            + "Input,Email,Status\n"
            + results.map(r => `"${r.input}","${r.email}","${r.status}"`).join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getStatusBadge = (status: StatusType) => {
        if (status === 'valid') return <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1"><Check className="w-3 h-3" /> Valid</span>;
        if (status === 'risky') return <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Risky</span>;
        if (status === 'invalid') return <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">Invalid</span>;
        if (status === 'unknown') return <span className="text-xs bg-blue-50 text-brand-500 px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Checking</span>;
        if (status === 'skipped') return <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1"><ArrowRight className="w-3 h-3" /> Skipped</span>;
        return <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">Pending</span>;
    };

    return (
        <div className="w-full max-w-4xl mx-auto mt-12 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-100/50">
                <button
                    onClick={() => setActiveTab('finder')}
                    className={`flex-1 py-4 px-6 text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'finder' ? 'text-brand-600 bg-brand-50/50 border-b-2 border-brand-500' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'}`}
                >
                    <Search className="w-4 h-4" /> Bulk Email Finder
                </button>
                <button
                    onClick={() => setActiveTab('validator')}
                    className={`flex-1 py-4 px-6 text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'validator' ? 'text-brand-600 bg-brand-50/50 border-b-2 border-brand-500' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'}`}
                >
                    <ShieldCheck className="w-4 h-4" /> Bulk Validator
                </button>
            </div>

            <div className="p-8">

                {/* FINDER TAB */}
                {activeTab === 'finder' && (
                    <div className="space-y-6">
                        <div className="bg-blue-50/50 rounded-xl p-4 text-sm text-blue-800 flex gap-3">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-blue-500" />
                            <p>Paste your leads format as: <strong>First Last, Company.com</strong> on each line. We will generate patterns and aggressively test them until we find a match.</p>
                        </div>

                        <textarea
                            value={finderInput}
                            onChange={(e) => setFinderInput(e.target.value)}
                            placeholder={"John Doe, google.com\nJane Smith, microsoft.com\n..."}
                            className="w-full h-48 p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none font-mono text-sm resize-none"
                        />

                        <div className="flex justify-end gap-3">
                            {isFinding && (
                                <button
                                    onClick={handleSkipCurrent}
                                    className="px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 transition-all"
                                >
                                    Skip Current Lead
                                </button>
                            )}
                            <button
                                onClick={handleBulkFind}
                                disabled={isFinding || !finderInput.trim()}
                                className="px-6 py-3 brand-gradient text-white rounded-xl font-bold flex items-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
                            >
                                {isFinding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                {isFinding ? 'Finding Matches...' : 'Start Bulk Find'}
                            </button>
                        </div>

                        {/* Finder Results Table */}
                        {finderResults.length > 0 && (
                            <div className="mt-8 border border-gray-100 rounded-2xl overflow-hidden bg-white">
                                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                                    <h3 className="font-bold text-gray-900">Results ({finderResults.filter(r => r.status === 'valid').length} Found)</h3>
                                    <button onClick={() => exportCSV(finderResults, 'bulk_finder_results.csv')} className="text-sm font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1">
                                        <Download className="w-4 h-4" /> Export CSV
                                    </button>
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50/80 sticky top-0 text-gray-500">
                                            <tr>
                                                <th className="p-3 font-semibold">Original Target</th>
                                                <th className="p-3 font-semibold">Verification Process</th>
                                                <th className="p-3 font-semibold">Result</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {finderResults.map(res => (
                                                <tr key={res.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="p-3 font-medium text-gray-700">{res.input}</td>
                                                    <td className="p-3 text-gray-500 font-mono text-xs truncate max-w-[200px]" title={res.email}>{res.email}</td>
                                                    <td className="p-3">{getStatusBadge(res.status)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* VALIDATOR TAB */}
                {activeTab === 'validator' && (
                    <div className="space-y-6">
                        <div className="bg-purple-50/50 rounded-xl p-4 text-sm text-purple-800 flex gap-3">
                            <Zap className="w-5 h-5 flex-shrink-0 text-purple-500" />
                            <p>Paste any text containing email addresses. We will extract all unique emails and verify their SMTP deliverability in bulk.</p>
                        </div>

                        <textarea
                            value={validatorInput}
                            onChange={(e) => setValidatorInput(e.target.value)}
                            placeholder={"Contact 1: test@google.com\nAnother email: fake@invalid-domain-123.com\n..."}
                            className="w-full h-48 p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none font-mono text-sm resize-none"
                        />

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={handleBulkValidate}
                                disabled={isValidating || !validatorInput.trim()}
                                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
                            >
                                {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                {isValidating ? 'Verifying...' : 'Extract & Verify'}
                            </button>
                        </div>

                        {/* Validator Results Table */}
                        {validatorResults.length > 0 && (
                            <div className="mt-8 border border-gray-100 rounded-2xl overflow-hidden bg-white">
                                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                                    <h3 className="font-bold text-gray-900">Results ({validatorResults.filter(r => r.status === 'valid').length} Valid)</h3>
                                    <button onClick={() => exportCSV(validatorResults, 'bulk_validator_results.csv')} className="text-sm font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1">
                                        <Download className="w-4 h-4" /> Export CSV
                                    </button>
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50/80 sticky top-0 text-gray-500">
                                            <tr>
                                                <th className="p-3 font-semibold w-2/3">Email Address</th>
                                                <th className="p-3 font-semibold">Result</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {validatorResults.map(res => (
                                                <tr key={res.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="p-3 font-medium text-gray-700">{res.email}</td>
                                                    <td className="p-3">{getStatusBadge(res.status)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}
