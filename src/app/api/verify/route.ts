import { NextResponse } from 'next/server';
import { DNSValidator } from '@/services/dnsService';
import { SMTPValidator } from '@/services/smtpService';

// Simple regex format check
function isValidFormat(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ status: 'invalid', message: 'Email is required' });
        }

        // Step 1: Format check
        if (!isValidFormat(email)) {
            return NextResponse.json({ status: 'invalid', message: 'Invalid email format' });
        }

        const domain = email.split('@')[1];

        // Step 2: DNS / MX check via Cloudflare DoH
        const { valid: dnsValid, mxRecords } = await DNSValidator.validateDomain(domain);

        if (!dnsValid || mxRecords.length === 0) {
            return NextResponse.json({
                status: 'invalid',
                message: 'Domain has no mail servers (MX records not found)',
                checks: { format: true, dns: false, smtp: false }
            });
        }

        // Step 3: SMTP check — mark as 'risky' if SMTP is blocked/unreachable, not 'invalid'
        try {
            const result = await SMTPValidator.verifySMTP(email, mxRecords[0]);

            return NextResponse.json({
                status: result.deliverable ? 'valid' : 'invalid',
                message: result.message,
                checks: { format: true, dns: true, smtp: result.deliverable }
            });
        } catch (smtpErr: any) {
            // SMTP blocked (common on residential ISPs / cloud sandboxes) — fallback to DNS-only = risky
            console.warn(`SMTP check skipped for ${email}:`, smtpErr.message);
            return NextResponse.json({
                status: 'risky',
                message: 'Domain verified, SMTP check unavailable',
                checks: { format: true, dns: true, smtp: null }
            });
        }

    } catch (error: any) {
        console.error('Verification API Error:', error);
        return NextResponse.json({ status: 'invalid', message: 'Verification failed', error: error.message });
    }
}
