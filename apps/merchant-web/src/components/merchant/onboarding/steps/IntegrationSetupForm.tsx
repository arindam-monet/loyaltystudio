import { Input } from '@loyaltystudio/ui'
import { Label } from '@loyaltystudio/ui'
import { Button } from '@loyaltystudio/ui'
import { Switch } from '@loyaltystudio/ui'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@loyaltystudio/ui'
import { Copy, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'

interface IntegrationSetupFormProps {
  data: {
    platform?: string
    apiKey?: string
    webhookUrl?: string
    webhookSecret?: string
    testMode?: boolean
    autoSync?: boolean
  }
  onChange: (data: any) => void
}

export function IntegrationSetupForm({ data, onChange }: IntegrationSetupFormProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleChange = (field: string, value: any) => {
    onChange({ ...data, [field]: value })
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Integration Setup</h2>
        <p className="text-muted-foreground">
          Configure your e-commerce platform integration.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="platform">E-commerce Platform</Label>
          <Select
            value={data.platform}
            onValueChange={(value) => handleChange('platform', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="shopify">Shopify</SelectItem>
              <SelectItem value="woocommerce">WooCommerce</SelectItem>
              <SelectItem value="magento">Magento</SelectItem>
              <SelectItem value="custom">Custom Integration</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="apiKey">API Key</Label>
          <div className="flex gap-2">
            <Input
              id="apiKey"
              type="password"
              value={data.apiKey || ''}
              onChange={(e) => handleChange('apiKey', e.target.value)}
              placeholder="Enter your API key"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(data.apiKey || '', 'apiKey')}
            >
              {copiedField === 'apiKey' ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="webhookUrl">Webhook URL</Label>
          <div className="flex gap-2">
            <Input
              id="webhookUrl"
              value={data.webhookUrl || ''}
              onChange={(e) => handleChange('webhookUrl', e.target.value)}
              placeholder="Enter webhook URL"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(data.webhookUrl || '', 'webhookUrl')}
            >
              {copiedField === 'webhookUrl' ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="webhookSecret">Webhook Secret</Label>
          <div className="flex gap-2">
            <Input
              id="webhookSecret"
              type="password"
              value={data.webhookSecret || ''}
              onChange={(e) => handleChange('webhookSecret', e.target.value)}
              placeholder="Enter webhook secret"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(data.webhookSecret || '', 'webhookSecret')}
            >
              {copiedField === 'webhookSecret' ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Test Mode</Label>
            <p className="text-sm text-muted-foreground">
              Enable test mode to verify integration without affecting production data
            </p>
          </div>
          <Switch
            checked={data.testMode}
            onCheckedChange={(checked) => handleChange('testMode', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Auto Sync</Label>
            <p className="text-sm text-muted-foreground">
              Automatically sync orders and customer data
            </p>
          </div>
          <Switch
            checked={data.autoSync}
            onCheckedChange={(checked) => handleChange('autoSync', checked)}
          />
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h3 className="mb-4 text-lg font-semibold">Integration Instructions</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium">1. Install Plugin</h4>
            <p className="text-sm text-muted-foreground">
              Install the Loyalty Studio plugin on your e-commerce platform
            </p>
          </div>
          <div>
            <h4 className="font-medium">2. Configure API</h4>
            <p className="text-sm text-muted-foreground">
              Enter your API key and webhook details in the plugin settings
            </p>
          </div>
          <div>
            <h4 className="font-medium">3. Test Connection</h4>
            <p className="text-sm text-muted-foreground">
              Use the test mode to verify the integration is working correctly
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            // TODO: Implement connection test
            console.log('Testing connection...')
          }}
        >
          Test Connection
        </Button>
      </div>
    </div>
  )
} 