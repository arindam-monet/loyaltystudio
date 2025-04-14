import { prisma } from "../db.server";

export async function createWebhookSubscription(
  merchantMappingId: string,
  topic: string,
  address: string
) {
  return prisma.webhookSubscription.upsert({
    where: {
      merchantMappingId_topic: {
        merchantMappingId,
        topic,
      },
    },
    update: {
      address,
    },
    create: {
      merchantMappingId,
      topic,
      address,
    },
  });
}

export async function getWebhookSubscriptions(merchantMappingId: string) {
  return prisma.webhookSubscription.findMany({
    where: {
      merchantMappingId,
    },
  });
}

export async function deleteWebhookSubscription(
  merchantMappingId: string,
  topic: string
) {
  return prisma.webhookSubscription.delete({
    where: {
      merchantMappingId_topic: {
        merchantMappingId,
        topic,
      },
    },
  });
}

export async function registerWebhooks(
  graphql: any,
  webhooks: Array<{ topic: string; address: string }>
) {
  const registrations = webhooks.map(({ topic, address }) => {
    const query = `
      mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
        webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
          userErrors {
            field
            message
          }
          webhookSubscription {
            id
          }
        }
      }
    `;

    return graphql({
      data: {
        query,
        variables: {
          topic,
          webhookSubscription: {
            callbackUrl: address,
            format: "JSON",
          },
        },
      },
    });
  });

  return Promise.all(registrations);
}
