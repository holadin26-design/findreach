'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Bookmark, Download, Trash2 } from 'lucide-react';

export default function LeadsPage() {
    const [leads, setLeads] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Load leads from localStorage on mount
        const savedLeads = localStorage.getItem('findreach_leads');
        if (savedLeads) {
            try {
                setLeads(JSON.parse(savedLeads));
            } catch (e) {
                console.error("Failed to parse saved leads", e);
            }
        }
        setIsLoading(false);
    }, []);

    const deleteLead = (e: React.MouseEvent, email: string) => {
        e.stopPropagation();
        const updatedLeads = leads.filter(l => l.email !== email);
        setLeads(updatedLeads);
        localStorage.setItem('findreach_leads', JSON.stringify(updatedLeads));
    };

    const exportToCsv = () => {
        if (leads.length === 0) return;
        
        const headers = ["First Name", "Last Name", "Domain", "Email", "Status", "Saved At"];
        const csvContent = [
            headers.join(","),
            ...leads.map(lead => [
                `"${lead.firstName || ''}"`,
                `"${lead.lastName || ''}"`,
                `"${lead.domain || ''}"`,
                `"${lead.email || ''}"`,
                `"${lead.status || ''}"`,
                `"${lead.savedAt || new Date().toISOString()}"`
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `findreach_leads_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) {
        return (
            <main className="min-h-screen bg-gray-50/30">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 py-12 text-center opacity-50">Loading...</div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50/30">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">My Leads</h1>
                        <p className="text-gray-600">Manage and export your locally saved email addresses.</p>
                    </div>
                    <button 
                        onClick={exportToCsv}
                        disabled={leads.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                </div>

                <div className="glass-card rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Lead Info</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Email Address</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white/50">
                            {leads.length > 0 ? leads.map((lead, idx) => (
                                <tr key={lead.email + idx} className="hover:bg-brand-50/30 transition-colors group">
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 brand-gradient rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                {lead.firstName?.[0] || '?'}{lead.lastName?.[0] || '?'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{lead.firstName} {lead.lastName}</p>
                                                <p className="text-xs text-gray-500 font-medium">{lead.domain}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 font-medium text-gray-700">{lead.email}</td>
                                    <td className="px-6 py-6">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${strToStatusColor(lead.status)}`}>
                                            {lead.status === 'valid' ? 'Deliverable' : lead.status === 'risky' ? 'Risky' : 'Unknown'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={(e) => deleteLead(e, lead.email)}
                                                className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-red-500 shadow-sm border border-transparent hover:border-gray-100"
                                                title="Remove lead"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center">
                                        <div className="max-w-xs mx-auto text-gray-400">
                                            <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                            <p className="text-lg font-bold text-gray-900 mb-1">No leads yet</p>
                                            <p className="text-sm">Find and save your first professional email to see it here.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}

function strToStatusColor(statusRaw: string) {
    const status = statusRaw?.toLowerCase();
    if (status === 'valid') return 'bg-green-50 text-green-600 border-green-100';
    if (status === 'risky') return 'bg-amber-50 text-amber-600 border-amber-100';
    return 'bg-gray-50 text-gray-600 border-gray-100';
}
