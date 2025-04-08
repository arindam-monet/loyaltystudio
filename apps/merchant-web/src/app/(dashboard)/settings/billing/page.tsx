'use client';

// Note: This is a placeholder implementation with mock data.
// In a real application, this would be connected to the API.

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Button,
  Alert,
  AlertDescription,
  AlertTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
} from '@loyaltystudio/ui';
import { AlertCircle, CreditCard, Download, CheckCircle, Clock } from 'lucide-react';

// Mock data for billing history
const mockBillingHistory = [
  { id: '1', date: '2023-04-01', amount: '$49.00', status: 'paid', invoice: 'INV-001' },
  { id: '2', date: '2023-03-01', amount: '$49.00', status: 'paid', invoice: 'INV-002' },
  { id: '3', date: '2023-02-01', amount: '$49.00', status: 'paid', invoice: 'INV-003' },
];

// Mock data for subscription plan
const mockSubscription = {
  plan: 'Pro',
  status: 'active',
  nextBillingDate: '2023-05-01',
  amount: '$49.00',
  interval: 'monthly',
  features: [
    'Unlimited loyalty programs',
    'Up to 10,000 members',
    'Advanced analytics',
    'Custom branding',
    'API access',
    'Email support',
  ],
};

export default function BillingSettingsPage() {
  const [subscription, setSubscription] = useState(mockSubscription);
  const [billingHistory, setBillingHistory] = useState(mockBillingHistory);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Subscription Plan</CardTitle>
          <CardDescription>
            Manage your subscription and billing preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="rounded-lg border p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{subscription.plan} Plan</h3>
                    <p className="text-sm text-muted-foreground">
                      {subscription.amount} / {subscription.interval}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Active
                  </Badge>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Next billing date: <span className="font-medium text-foreground">{subscription.nextBillingDate}</span>
                  </p>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Visa ending in 4242
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  <h4 className="font-medium">Features included:</h4>
                  <ul className="space-y-2">
                    {subscription.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex-1">
              <div className="rounded-lg border p-6 space-y-4">
                <h3 className="text-lg font-semibold">Payment Methods</h3>
                <div className="flex items-center justify-between p-4 border rounded-md">
                  <div className="flex items-center">
                    <CreditCard className="mr-3 h-5 w-5" />
                    <div>
                      <p className="font-medium">Visa ending in 4242</p>
                      <p className="text-sm text-muted-foreground">Expires 12/2025</p>
                    </div>
                  </div>
                  <Badge>Default</Badge>
                </div>

                <div className="pt-2">
                  <Button variant="outline" className="w-full">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Update Payment Method
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Need to change your plan?</AlertTitle>
            <AlertDescription>
              Contact our support team to upgrade or downgrade your subscription.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          <Button variant="outline" className="text-destructive hover:bg-destructive/10">
            Cancel Subscription
          </Button>
          <Button>
            Manage Billing
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>
            View and download your past invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {billingHistory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>{item.amount}</TableCell>
                  <TableCell>
                    <Badge variant={
                      item.status === 'paid'
                        ? 'success'
                        : item.status === 'pending'
                          ? 'warning'
                          : 'destructive'
                    }>
                      {item.status === 'paid' ? (
                        <CheckCircle className="mr-1 h-3 w-3" />
                      ) : item.status === 'pending' ? (
                        <Clock className="mr-1 h-3 w-3" />
                      ) : (
                        <AlertCircle className="mr-1 h-3 w-3" />
                      )}
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.invoice}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
