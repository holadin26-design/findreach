// Uses Cloudflare DNS-over-HTTPS — works in all environments including Vercel/Next.js
export class DNSValidator {
    public static async validateDomain(domain: string): Promise<{ valid: boolean; mxRecords: string[] }> {
        try {
            const res = await fetch(
                `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=MX`,
                { headers: { Accept: 'application/dns-json' } }
            );

            if (!res.ok) return { valid: false, mxRecords: [] };

            const data = await res.json();

            // Status 0 = NOERROR, Status 3 = NXDOMAIN
            if (data.Status !== 0 || !data.Answer || data.Answer.length === 0) {
                return { valid: false, mxRecords: [] };
            }

            // Parse MX records: each Answer.data looks like "10 aspmx.l.google.com."
            const mxRecords = data.Answer
                .filter((a: any) => a.type === 15) // type 15 = MX
                .map((a: any) => {
                    const parts = a.data.trim().split(' ');
                    return { priority: parseInt(parts[0]), host: parts[1].replace(/\.$/, '') };
                })
                .sort((a: any, b: any) => a.priority - b.priority)
                .map((r: any) => r.host);

            return { valid: mxRecords.length > 0, mxRecords };
        } catch (error) {
            console.error(`DNS-over-HTTPS failed for ${domain}:`, error);
            return { valid: false, mxRecords: [] };
        }
    }
}
