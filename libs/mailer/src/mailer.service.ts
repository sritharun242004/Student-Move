import { Injectable, Logger } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { Resend } from 'resend';

export interface MailAttachment {
  filename: string;
  path: string;
}

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendMail(to: string, subject: string, text: string, attachments?: MailAttachment[]): Promise<void> {
    try {
      const resolvedAttachments = attachments
        ? await Promise.all(
            attachments.map(async (a) => {
              if (a.path.startsWith('http://') || a.path.startsWith('https://')) {
                return { filename: a.filename, path: a.path };
              }
              const content = await readFile(a.path);
              return { filename: a.filename, content };
            }),
          )
        : undefined;

      const { error } = await this.resend.emails.send({
        from: process.env.RESEND_FROM ?? 'noreply@studentmoves.com',
        to,
        subject,
        text,
        attachments: resolvedAttachments,
      });
      if (error) {
        throw new Error(error.message);
      }
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${(error as Error).message}`, (error as Error).stack);
    }
  }
}
