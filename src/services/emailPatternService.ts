export class EmailPatternService {
    public static generatePatterns(firstName: string, lastName: string, domain: string): string[] {
        const fn = firstName.toLowerCase().trim();
        const ln = lastName.toLowerCase().trim();
        const fi = fn.charAt(0);
        const li = ln.charAt(0);

        const patterns = [
            `${fn}@${domain}`,
            `${fn}_${ln}@${domain}`,
            `${fn}.${ln}@${domain}`,
        ];

        // Remove duplicates
        return Array.from(new Set(patterns));
    }
}
