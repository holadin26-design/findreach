export class EmailPatternService {
    public static generatePatterns(firstName: string, lastName: string, domain: string): string[] {
        const fn = firstName.toLowerCase().trim();
        const ln = lastName.toLowerCase().trim();
        const fi = fn.charAt(0);
        const li = ln.charAt(0);

        const patterns = [
            `${fn}@${domain}`,
            `${ln}@${domain}`,
            `${fn}${ln}@${domain}`,
            `${fn}.${ln}@${domain}`,
            `${fn}_${ln}@${domain}`,
            `${fn}${li}@${domain}`,
            `${fn}.${li}@${domain}`,
            `${fn}_${li}@${domain}`,
            `${fi}${ln}@${domain}`,
            `${fi}.${ln}@${domain}`,
            `${fi}_${ln}@${domain}`,
            `${fi}${li}@${domain}`,
            `${fi}.${li}@${domain}`,
            `${fi}_${li}@${domain}`,
            `${ln}${fn}@${domain}`,
            `${ln}.${fn}@${domain}`,
            `${ln}_${fn}@${domain}`,
            `${ln}${fi}@${domain}`,
            `${ln}.${fi}@${domain}`,
            `${ln}_${fi}@${domain}`,
            `${li}${fn}@${domain}`,
            `${li}.${fn}@${domain}`,
            `${li}_${fn}@${domain}`,
            `${li}${ln}@${domain}`,
            `${li}.${ln}@${domain}`,
            `${li}_${ln}@${domain}`,
        ];

        // Remove duplicates
        return [...new Set(patterns)];
    }
}
