import { PrismaClient } from '@prisma/client';
import { logger } from '../middleware/logger.js';
import crypto from 'crypto';
import got from 'got';
import { WebhookEventType } from '@prisma/client';

const prisma = new PrismaClient();

export class WebhookService {
  /**
   * Send webhook to all subscribed endpoints for a merchant
   * @param merchantId The ID of the merchant
   * @param eventType The type of event (must be one of WebhookEventType)
   * @param payload The payload to send with the webhook
   * @returns Object with success status and count of webhooks delivered
   */
  async sendWebhook(merchantId: string, eventType: WebhookEventType, payload: any) {
    try {
      logger.info({ merchantId, eventType }, 'Sending webhook');

      // Find all active webhooks for this merchant that are subscribed to this event
      // Type assertion for Prisma client
      const prismaAny = prisma as any;
      const webhooks = await prismaAny.webhook.findMany({
        where: {
          merchantId,
          isActive: true,
          events: {
            has: eventType
          }
        }
      });

      logger.debug({ count: webhooks.length }, 'Found webhooks to deliver');

      // Deliver webhook to each endpoint
      const deliveryPromises = webhooks.map((webhook: any) =>
        this.deliverWebhook(webhook.id, eventType, payload)
      );

      // Wait for all deliveries to complete
      await Promise.allSettled(deliveryPromises);

      return { success: true, count: webhooks.length };
    } catch (error) {
      logger.error({ error, merchantId, eventType }, 'Error sending webhooks');
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Deliver webhook to a specific endpoint
   * @param webhookId The ID of the webhook to deliver to
   * @param eventType The type of event (must be one of WebhookEventType)
   * @param payload The payload to send with the webhook
   * @returns Object with success status and status code
   */
  async deliverWebhook(webhookId: string, eventType: WebhookEventType, payload: any) {
    try {
      // Get webhook details
      // Type assertion for Prisma client
      const prismaAny = prisma as any;
      const webhook = await prismaAny.webhook.findUnique({
        where: { id: webhookId }
      });

      if (!webhook) {
        throw new Error(`Webhook with ID ${webhookId} not found`);
      }

      // Generate signature
      const signature = this.generateSignature(webhook.secret, payload);

      // Prepare webhook payload
      const webhookPayload = {
        event: eventType,
        timestamp: new Date().toISOString(),
        data: payload
      };

      // Send HTTP request with built-in retry
      const startTime = Date.now();
      const response = await got.post(webhook.url, {
        json: webhookPayload,
        headers: {
          'X-Webhook-Signature': signature,
          'X-Event-Type': eventType,
          'User-Agent': 'LoyaltyStudio-Webhook/1.0'
        },
        timeout: {
          request: 10000 // 10 second timeout
        },
        retry: {
          limit: 3,
          methods: ['POST'],
          statusCodes: [408, 413, 429, 500, 502, 503, 504],
          errorCodes: ['ETIMEDOUT', 'ECONNRESET', 'EADDRINUSE', 'ECONNREFUSED', 'EPIPE', 'ENOTFOUND', 'ENETUNREACH', 'EAI_AGAIN']
        }
      });

      const responseTime = Date.now() - startTime;

      // Log delivery
      await this.logDelivery(
        webhookId,
        eventType,
        webhookPayload,
        response.statusCode,
        response.body,
        null,
        response.statusCode >= 200 && response.statusCode < 300,
        responseTime
      );

      logger.info({
        webhookId,
        statusCode: response.statusCode,
        responseTime
      }, 'Webhook delivered successfully');

      return {
        success: response.statusCode >= 200 && response.statusCode < 300,
        statusCode: response.statusCode
      };
    } catch (error) {
      // Got provides rich error information
      const gotError = error as any; // Type assertion for Got error
      const statusCode = gotError.response?.statusCode;
      const errorBody = gotError.response?.body || null;
      const errorMessage = gotError.message || 'Unknown error';
      const responseTime = gotError.timings?.phases?.total || 0;

      // Log error
      logger.error({
        error,
        webhookId,
        statusCode,
        errorMessage,
        responseTime
      }, 'Error delivering webhook');

      await this.logDelivery(
        webhookId,
        eventType,
        payload,
        statusCode || null,
        errorBody,
        errorMessage,
        false,
        responseTime
      );

      // No need to manually queue for retry as Got handles retries automatically
      // Only queue for custom retry logic if Got's built-in retry failed
      if (!gotError.request?.options?.retry?.retryCount) {
        await this.queueRetry(webhookId, eventType, payload);
      }

      return {
        success: false,
        statusCode: statusCode || 500,
        error: errorMessage
      };
    }
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  generateSignature(secret: string, payload: any): string {
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  /**
   * Log webhook delivery attempt
   * @param webhookId The ID of the webhook
   * @param eventType The type of event
   * @param payload The payload sent with the webhook
   * @param statusCode The HTTP status code returned
   * @param response The response body
   * @param error Any error message
   * @param successful Whether the delivery was successful
   * @param responseTime The time taken to deliver the webhook in ms
   */
  async logDelivery(
    webhookId: string,
    eventType: WebhookEventType,
    payload: any,
    statusCode: number | null,
    response: string | null,
    error: string | null,
    successful: boolean,
    responseTime: number
  ) {
    try {
      // Type assertion for Prisma client
      const prismaAny = prisma as any;
      await prismaAny.webhookDeliveryLog.create({
        data: {
          webhookId,
          eventType,
          payload,
          statusCode,
          response,
          error,
          successful,
          attempts: 1,
          responseTime: responseTime
        }
      });
    } catch (logError) {
      logger.error({ logError }, 'Failed to log webhook delivery');
    }
  }

  /**
   * Queue webhook for retry with exponential backoff
   * This is used as a fallback when Got's built-in retry mechanism fails
   * @param webhookId The ID of the webhook to retry
   * @param eventType The type of event
   * @param payload The payload to send with the webhook
   */
  async queueRetry(webhookId: string, eventType: WebhookEventType, payload: any) {
    try {
      // Get delivery logs to determine retry count
      // Type assertion for Prisma client
      const prismaAny = prisma as any;
      const logs = await prismaAny.webhookDeliveryLog.findMany({
        where: {
          webhookId,
          eventType,
          successful: false
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 1
      });

      const attempts = logs.length > 0 ? logs[0].attempts + 1 : 1;

      // Maximum 5 retry attempts (in addition to Got's built-in retries)
      if (attempts > 5) {
        logger.warn({ webhookId, eventType, attempts }, 'Maximum retry attempts reached');
        return;
      }

      // Calculate delay with exponential backoff: 2^n * 1000ms
      const delayMs = Math.pow(2, attempts) * 1000;

      // In a production environment, you would use a job queue system like Bull
      // For simplicity, we'll use setTimeout
      setTimeout(() => {
        this.deliverWebhook(webhookId, eventType, payload)
          .catch(error => logger.error({ error, webhookId }, 'Retry delivery failed'));
      }, delayMs);

      logger.info({ webhookId, eventType, attempts, delayMs }, 'Queued webhook for manual retry');
    } catch (error) {
      logger.error({ error, webhookId }, 'Failed to queue webhook retry');
    }
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: any, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(secret, payload);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
}

// Export singleton instance
export const webhookService = new WebhookService();
