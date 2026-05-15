import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { CustomLogger } from '../../logger/logger.service';

@Injectable()
export class EmailService {
    private readonly logger: CustomLogger;
    private resend: Resend;

    constructor() {
        this.logger = new CustomLogger();
        this.logger.setContext(EmailService.name);

        this.resend = new Resend(process.env.RESEND_API_KEY);
    }

    async sendPasswordResetEmail(
        toEmail: string,
        firstName: string,
        temporaryPassword: string,
    ): Promise<void> {
        const fromName = process.env.RESEND_FROM_NAME || 'Rooeel';
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

        try {
            await this.resend.emails.send({
                from: `${fromName} <${fromEmail}>`,
                to: toEmail,
                subject: 'Your Temporary Password',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Hello ${firstName},</h2>
                        <p style="color: #555; font-size: 16px;">
                            We received a request to reset your password. Here is your temporary password:
                        </p>
                        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <p style="font-size: 24px; font-weight: bold; color: #333; margin: 0; text-align: center; letter-spacing: 2px;">
                                ${temporaryPassword}
                            </p>
                        </div>
                        <p style="color: #555; font-size: 14px;">
                            Please use this temporary password to log in. You will be prompted to change it to a new password of your choice.
                        </p>
                        <p style="color: #888; font-size: 12px; margin-top: 30px;">
                            If you did not request this, please ignore this email. Your password has not been changed.
                        </p>
                    </div>
                `,
            });
            this.logger.log(`Password reset email sent to ${toEmail}`);
        } catch (error) {
            this.logger.error(`Failed to send email to ${toEmail}`, error);
            throw error;
        }
    }
}