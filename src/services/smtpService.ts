import net from 'net';

export interface SMTPValidationResult {
    valid: boolean;
    deliverable: boolean;
    message: string;
    smtpCode?: string;
    error?: string;
}

export class SMTPValidator {
    public static async verifySMTP(
        email: string,
        mxHost: string,
        timeout: number = 10000,
        fromEmail: string = 'verify@findreach.app',
        fromDomain: string = 'findreach.app'
    ): Promise<SMTPValidationResult> {
        return new Promise((resolve) => {
            const client = net.createConnection(25, mxHost);
            let step = 0;
            let resolved = false;

            client.setTimeout(timeout);

            const safeResolve = (result: SMTPValidationResult) => {
                if (!resolved) {
                    resolved = true;
                    client.end();
                    client.destroy();
                    resolve(result);
                }
            };

            client.on('connect', () => {
                // Step 0: Initial connection, wait for banner
            });

            client.on('data', (data) => {
                const response = data.toString();
                const code = response.substring(0, 3);

                switch (step) {
                    case 0: // Banner received
                        if (code === '220') {
                            client.write(`HELO ${fromDomain}\r\n`);
                            step++;
                        } else {
                            safeResolve({ valid: false, deliverable: false, message: "SMTP Banner Error", smtpCode: code });
                        }
                        break;
                    case 1: // HELO response
                        if (code === '250') {
                            client.write(`MAIL FROM:<${fromEmail}>\r\n`);
                            step++;
                        } else {
                            safeResolve({ valid: false, deliverable: false, message: "HELO rejected", smtpCode: code });
                        }
                        break;
                    case 2: // MAIL FROM response
                        if (code === '250') {
                            client.write(`RCPT TO:<${email}>\r\n`);
                            step++;
                        } else {
                            safeResolve({ valid: false, deliverable: false, message: "MAIL FROM rejected", smtpCode: code });
                        }
                        break;
                    case 3: // RCPT TO response
                        const isValid = code === '250';
                        client.write('QUIT\r\n');
                        safeResolve({
                            valid: isValid,
                            deliverable: isValid,
                            message: isValid ? "Mailbox exists" : "Mailbox does not exist",
                            smtpCode: code
                        });
                        break;
                    default:
                        client.end();
                }
            });

            client.on('error', (error) => {
                safeResolve({
                    valid: false,
                    deliverable: false,
                    message: "SMTP connection error",
                    error: error.message
                });
            });

            client.on('timeout', () => {
                safeResolve({
                    valid: false,
                    deliverable: false,
                    message: "SMTP timeout"
                });
            });

            client.on('close', () => {
                safeResolve({
                    valid: false,
                    deliverable: false,
                    message: "SMTP connection closed"
                });
            });
        });
    }
}
