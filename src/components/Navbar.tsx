'use client';
import Link from 'next/link';
import { Mail } from 'lucide-react';

export default function Navbar() {
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

                    {/* Placeholder for symmetry or future CTA */}
                    <div className="hidden md:block w-24"></div>
                </div>
            </div>
        </nav>
    );
}
