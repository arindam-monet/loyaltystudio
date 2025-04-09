'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,

  Alert,
  AlertDescription,
  AlertTitle,
} from '@loyaltystudio/ui';
import { Copy, AlertCircle, CheckCircle, Code, Webhook, Key } from 'lucide-react';

export default function ApiDocsPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API Documentation</CardTitle>
          <CardDescription>
            Comprehensive documentation for the Loyalty Studio API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex space-x-2 border-b pb-2">
              <Button
                variant={activeSection === 'overview' ? 'default' : 'ghost'}
                onClick={() => setActiveSection('overview')}
              >
                Overview
              </Button>
              <Button
                variant={activeSection === 'authentication' ? 'default' : 'ghost'}
                onClick={() => setActiveSection('authentication')}
              >
                Authentication
              </Button>
              <Button
                variant={activeSection === 'endpoints' ? 'default' : 'ghost'}
                onClick={() => setActiveSection('endpoints')}
              >
                Endpoints
              </Button>
              <Button
                variant={activeSection === 'webhooks' ? 'default' : 'ghost'}
                onClick={() => setActiveSection('webhooks')}
              >
                Webhooks
              </Button>
            </div>

            {activeSection === 'overview' && (
              <div className="prose max-w-none">
                <h2 className="text-xl font-bold">Getting Started with the Loyalty Studio API</h2>
                <p>
                  The Loyalty Studio API allows you to integrate loyalty functionality directly into your applications.
                  You can manage program members, track transactions, issue points, and more.
                </p>

                <h3 className="text-lg font-semibold mt-6">Base URL</h3>
                <div className="bg-muted rounded-md p-3 font-mono text-sm relative">
                  <pre>https://api.loyaltystudio.ai/v1</pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => handleCopyCode('https://api.loyaltystudio.ai/v1', 'base-url')}
                  >
                    {copiedCode === 'base-url' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <h3 className="text-lg font-semibold mt-6">API Environments</h3>
                <p>
                  We provide two environments for API access:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Test Environment:</strong> Use test API keys for development and testing.
                    No real data is affected, and no charges are incurred.
                  </li>
                  <li>
                    <strong>Production Environment:</strong> Use production API keys for live applications.
                    Actions performed with production keys affect real data and may incur charges.
                  </li>
                </ul>

                <Alert className="mt-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Important</AlertTitle>
                  <AlertDescription>
                    Never use production API keys in development or testing environments.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {activeSection === 'authentication' && (
              <div className="prose max-w-none">
                <h2 className="text-xl font-bold">Authentication</h2>
                <p>
                  All API requests must include your API key in the request headers.
                  You can create and manage API keys in the <a href="/developer/api" className="text-primary hover:underline">API Keys</a> section.
                </p>

                <h3 className="text-lg font-semibold mt-6">API Key Authentication</h3>
                <p>
                  Include your API key in the <code>X-API-Key</code> header with every request:
                </p>
                <div className="bg-muted rounded-md p-3 font-mono text-sm relative">
                  <pre>{`
curl https://api.loyaltystudio.ai/v1/members \\
  -H "X-API-Key: YOUR_API_KEY"
                  `.trim()}</pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => handleCopyCode(`curl https://api.loyaltystudio.ai/v1/members \\
  -H "X-API-Key: YOUR_API_KEY"`, 'auth-curl')}
                  >
                    {copiedCode === 'auth-curl' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <h3 className="text-lg font-semibold mt-6">Code Examples</h3>

                <h4 className="font-semibold mt-4">JavaScript</h4>
                <div className="bg-muted rounded-md p-3 font-mono text-sm relative">
                  <pre>{`
const fetchMembers = async () => {
  const response = await fetch('https://api.loyaltystudio.ai/v1/members', {
    headers: {
      'X-API-Key': 'YOUR_API_KEY',
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  return data;
};
                  `.trim()}</pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => handleCopyCode(`const fetchMembers = async () => {
  const response = await fetch('https://api.loyaltystudio.ai/v1/members', {
    headers: {
      'X-API-Key': 'YOUR_API_KEY',
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  return data;
};`, 'auth-js')}
                  >
                    {copiedCode === 'auth-js' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <h4 className="font-semibold mt-4">Python</h4>
                <div className="bg-muted rounded-md p-3 font-mono text-sm relative">
                  <pre>{`
import requests

def fetch_members():
    headers = {
        'X-API-Key': 'YOUR_API_KEY',
        'Content-Type': 'application/json'
    }

    response = requests.get('https://api.loyaltystudio.ai/v1/members', headers=headers)
    return response.json()
                  `.trim()}</pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => handleCopyCode(`import requests

def fetch_members():
    headers = {
        'X-API-Key': 'YOUR_API_KEY',
        'Content-Type': 'application/json'
    }

    response = requests.get('https://api.loyaltystudio.ai/v1/members', headers=headers)
    return response.json()`, 'auth-python')}
                  >
                    {copiedCode === 'auth-python' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {activeSection === 'endpoints' && (
              <div className="prose max-w-none">
                <h2 className="text-xl font-bold">API Endpoints</h2>
                <p>
                  The Loyalty Studio API provides the following main endpoints:
                </p>

                <div className="mt-6 space-y-6">
                  <div className="border rounded-md p-4">
                    <h3 className="text-lg font-semibold">Members</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage program members and their profiles
                    </p>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium mr-2">GET</span>
                          <code className="text-sm">/members</code>
                        </div>
                        <span className="text-xs text-muted-foreground">List all members</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium mr-2">GET</span>
                          <code className="text-sm">/members/{'{id}'}</code>
                        </div>
                        <span className="text-xs text-muted-foreground">Get a specific member</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium mr-2">POST</span>
                          <code className="text-sm">/members</code>
                        </div>
                        <span className="text-xs text-muted-foreground">Create a new member</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium mr-2">PUT</span>
                          <code className="text-sm">/members/{'{id}'}</code>
                        </div>
                        <span className="text-xs text-muted-foreground">Update a member</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium mr-2">DELETE</span>
                          <code className="text-sm">/members/{'{id}'}</code>
                        </div>
                        <span className="text-xs text-muted-foreground">Delete a member</span>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-md p-4">
                    <h3 className="text-lg font-semibold">Transactions</h3>
                    <p className="text-sm text-muted-foreground">
                      Record and manage transactions
                    </p>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium mr-2">GET</span>
                          <code className="text-sm">/transactions</code>
                        </div>
                        <span className="text-xs text-muted-foreground">List all transactions</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium mr-2">GET</span>
                          <code className="text-sm">/transactions/{'{id}'}</code>
                        </div>
                        <span className="text-xs text-muted-foreground">Get a specific transaction</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium mr-2">POST</span>
                          <code className="text-sm">/transactions</code>
                        </div>
                        <span className="text-xs text-muted-foreground">Create a new transaction</span>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-md p-4">
                    <h3 className="text-lg font-semibold">Points</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage points balances and transactions
                    </p>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium mr-2">GET</span>
                          <code className="text-sm">/members/{'{id}'}/points</code>
                        </div>
                        <span className="text-xs text-muted-foreground">Get member's points balance</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium mr-2">POST</span>
                          <code className="text-sm">/members/{'{id}'}/points/add</code>
                        </div>
                        <span className="text-xs text-muted-foreground">Add points to a member</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium mr-2">POST</span>
                          <code className="text-sm">/members/{'{id}'}/points/deduct</code>
                        </div>
                        <span className="text-xs text-muted-foreground">Deduct points from a member</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <Button variant="outline" asChild>
                    <a href="https://api.loyaltystudio.ai/docs" target="_blank" rel="noopener noreferrer">
                      <Code className="mr-2 h-4 w-4" />
                      View Full API Reference
                    </a>
                  </Button>
                </div>
              </div>
            )}

            {activeSection === 'webhooks' && (
              <div className="prose max-w-none">
                <h2 className="text-xl font-bold">Webhooks</h2>
                <p>
                  Webhooks allow you to receive real-time notifications when events occur in your loyalty program.
                  You can configure webhooks in the <a href="/developer/webhooks" className="text-primary hover:underline">Webhooks</a> section.
                </p>

                <h3 className="text-lg font-semibold mt-6" id="webhook-events">Webhook Event Types</h3>
                <p>
                  Loyalty Studio supports the following webhook event types:
                </p>

                <div className="mt-4 border rounded-md divide-y">
                  <div className="p-3">
                    <h4 className="font-semibold">transaction_created</h4>
                    <p className="text-sm text-muted-foreground">
                      Triggered when a new transaction is recorded
                    </p>
                  </div>
                  <div className="p-3">
                    <h4 className="font-semibold">points_earned</h4>
                    <p className="text-sm text-muted-foreground">
                      Triggered when a member earns points
                    </p>
                  </div>
                  <div className="p-3">
                    <h4 className="font-semibold">points_redeemed</h4>
                    <p className="text-sm text-muted-foreground">
                      Triggered when a member redeems points
                    </p>
                  </div>
                  <div className="p-3">
                    <h4 className="font-semibold">points_adjusted</h4>
                    <p className="text-sm text-muted-foreground">
                      Triggered when a member's points are manually adjusted
                    </p>
                  </div>
                  <div className="p-3">
                    <h4 className="font-semibold">member_created</h4>
                    <p className="text-sm text-muted-foreground">
                      Triggered when a new member is created
                    </p>
                  </div>
                  <div className="p-3">
                    <h4 className="font-semibold">member_updated</h4>
                    <p className="text-sm text-muted-foreground">
                      Triggered when a member's information is updated
                    </p>
                  </div>
                  <div className="p-3">
                    <h4 className="font-semibold">member_deleted</h4>
                    <p className="text-sm text-muted-foreground">
                      Triggered when a member is deleted
                    </p>
                  </div>
                  <div className="p-3">
                    <h4 className="font-semibold">tier_changed</h4>
                    <p className="text-sm text-muted-foreground">
                      Triggered when a member's tier changes
                    </p>
                  </div>
                </div>

                <h3 className="text-lg font-semibold mt-6">Webhook Payload Format</h3>
                <p>
                  All webhook events follow a consistent payload format:
                </p>
                <div className="bg-muted rounded-md p-3 font-mono text-sm relative">
                  <pre>{`
{
  "event": "points_earned",
  "timestamp": "2023-04-01T12:30:45Z",
  "data": {
    // Event-specific data
  }
}
                  `.trim()}</pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => handleCopyCode(`{
  "event": "points_earned",
  "timestamp": "2023-04-01T12:30:45Z",
  "data": {
    // Event-specific data
  }
}`, 'webhook-payload')}
                  >
                    {copiedCode === 'webhook-payload' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <h3 className="text-lg font-semibold mt-6">Verifying Webhook Signatures</h3>
                <p>
                  To ensure webhook requests are coming from Loyalty Studio, you should verify the signature:
                </p>
                <div className="bg-muted rounded-md p-3 font-mono text-sm relative">
                  <pre>{`
// Node.js example
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(JSON.stringify(payload)).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(digest),
    Buffer.from(signature)
  );
}
                  `.trim()}</pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => handleCopyCode(`// Node.js example
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(JSON.stringify(payload)).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(digest),
    Buffer.from(signature)
  );
}`, 'webhook-verify')}
                  >
                    {copiedCode === 'webhook-verify' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="mt-6">
                  <Button variant="outline" asChild>
                    <a href="/developer/webhooks">
                      <Webhook className="mr-2 h-4 w-4" />
                      Manage Webhooks
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SDKs & Libraries</CardTitle>
          <CardDescription>
            Official client libraries for popular programming languages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4" id="sdks">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-md p-4 space-y-2">
              <h3 className="font-semibold">JavaScript</h3>
              <p className="text-sm text-muted-foreground">
                Official JavaScript SDK for browser and Node.js
              </p>
              <div className="flex space-x-2 mt-4">
                <Button variant="outline" size="sm" asChild>
                  <a href="https://github.com/loyaltystudio/loyalty-js" target="_blank" rel="noopener noreferrer">
                    GitHub
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://www.npmjs.com/package/@loyaltystudio/js" target="_blank" rel="noopener noreferrer">
                    npm
                  </a>
                </Button>
              </div>
            </div>

            <div className="border rounded-md p-4 space-y-2">
              <h3 className="font-semibold">Python</h3>
              <p className="text-sm text-muted-foreground">
                Official Python SDK for server-side integration
              </p>
              <div className="flex space-x-2 mt-4">
                <Button variant="outline" size="sm" asChild>
                  <a href="https://github.com/loyaltystudio/loyalty-python" target="_blank" rel="noopener noreferrer">
                    GitHub
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://pypi.org/project/loyaltystudio/" target="_blank" rel="noopener noreferrer">
                    PyPI
                  </a>
                </Button>
              </div>
            </div>

            <div className="border rounded-md p-4 space-y-2">
              <h3 className="font-semibold">PHP</h3>
              <p className="text-sm text-muted-foreground">
                Official PHP SDK for server-side integration
              </p>
              <div className="flex space-x-2 mt-4">
                <Button variant="outline" size="sm" asChild>
                  <a href="https://github.com/loyaltystudio/loyalty-php" target="_blank" rel="noopener noreferrer">
                    GitHub
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://packagist.org/packages/loyaltystudio/loyalty-php" target="_blank" rel="noopener noreferrer">
                    Packagist
                  </a>
                </Button>
              </div>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Looking for another language?</AlertTitle>
            <AlertDescription>
              We're constantly adding new SDKs. If you need support for a language not listed here,
              please contact our support team.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
