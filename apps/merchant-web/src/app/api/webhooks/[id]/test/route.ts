import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const testWebhookSchema = z.object({
  eventType: z.string(),
  payload: z.record(z.any()).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { eventType, payload } = testWebhookSchema.parse(body);

    const merchantId = request.headers.get('X-Merchant-ID');
    if (!merchantId) {
      return NextResponse.json(
        { error: 'Merchant ID is required' },
        { status: 400 }
      );
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';
    const response = await fetch(`${apiUrl}/webhooks/${id}/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'X-Merchant-ID': merchantId,
      },
      body: JSON.stringify({
        eventType,
        payload: payload || { test: true },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to test webhook', message: data.message },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error testing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to test webhook', message: error.message },
      { status: 500 }
    );
  }
}
