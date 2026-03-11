import Navbar from "@/components/Navbar";
import { Search, ShieldCheck, Zap, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function Home() {
    return (
        <main className="min-h-screen">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-20 pb-32 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-brand-50/50 to-transparent -z-10" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-600 text-sm font-semibold mb-8 border border-brand-200">
                        <Zap className="w-4 h-4 fill-brand-600" />
                        <span>New: Advanced Pattern Matching Engine</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-6">
                        Find and verify emails <br />
                        <span className="brand-gradient-text">with 99.9% accuracy</span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-xl text-gray-600 mb-10">
                        Reach decision-makers in seconds. Our OSINT-powered engine generates and validates professional emails in real-time.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/finder" className="w-full sm:w-auto px-8 py-4 brand-gradient text-white rounded-2xl text-lg font-bold hover:shadow-2xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2">
                            Start Finding Emails <ArrowRight className="w-5 h-5" />
                        </Link>
                        <button className="w-full sm:w-auto px-8 py-4 bg-white text-gray-900 border border-gray-200 rounded-2xl text-lg font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2 shadow-sm">
                            Bulk Verification
                        </button>
                    </div>

                    <div className="mt-16 flex items-center justify-center gap-8 text-gray-400">
                        <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-brand-500" /> Real-time SMTP</div>
                        <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-brand-500" /> Pattern Generation</div>
                        <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-brand-500" /> 50 Free Credits</div>
                    </div>
                </div>
            </section>

            {/* Feature Grid */}
            <section className="py-24 bg-gray-50/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="glass-card p-8 rounded-3xl">
                            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                                <Search className="text-blue-600 w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-4">Smart Finder</h3>
                            <p className="text-gray-600">Enter a name and domain, and our engine will find the correct email using 50+ patterns.</p>
                        </div>

                        <div className="glass-card p-8 rounded-3xl">
                            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                                <ShieldCheck className="text-green-600 w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-4">Live Verifier</h3>
                            <p className="text-gray-600">Never bounce again. We perform direct SMTP handshakes to confirm mailbox availability.</p>
                        </div>

                        <div className="glass-card p-8 rounded-3xl">
                            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                                <Zap className="text-purple-600 w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-4">Lead Management</h3>
                            <p className="text-gray-600">Organize and export your leads to CSV or your favorite CRM with one click.</p>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
