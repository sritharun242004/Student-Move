import { Injectable } from '@nestjs/common';

export type NotificationType = 'reels' | 'marketplace' | 'offers';
export type NotificationPriority = 'low' | 'medium' | 'high';

export interface SendNotificationPayload {
  recipient_id: string;
  notification_type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  metadata?: Record<string, unknown>;
  action_url?: string;
}

@Injectable()
export class NotificationService {
  async sendNotification(payload: SendNotificationPayload): Promise<void> {
    const host = process.env.MAIN_SERVICE_BASE_URL;
    if (!host) {
      console.warn('NotificationService: MAIN_SERVICE_BASE_URL is not configured, skipping notification');
      return;
    }

    const url = `${host}/api/notifications/create-public/`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error(
          `NotificationService: failed to send notification [${response.status}] to recipient ${payload.recipient_id}: ${await response.text()}`,
        );
      }
    } catch (error) {
      console.error(
        `NotificationService: error sending notification to recipient ${payload.recipient_id}:`,
        error,
      );
    }
  }
}
