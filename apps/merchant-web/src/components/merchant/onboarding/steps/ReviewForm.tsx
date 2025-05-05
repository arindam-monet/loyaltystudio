import { Button } from '@loyaltystudio/ui'
import { Card } from '@loyaltystudio/ui'
import { CheckCircle2, XCircle } from 'lucide-react'

interface ReviewFormProps {
  data: {
    businessInfo?: {
      name?: string
      email?: string
      phone?: string
      industry?: string
      size?: string
      address?: string
      city?: string
      state?: string
      country?: string
      postalCode?: string
    }
    programSetup?: {
      name?: string
      type?: string
      pointsRate?: number
      minPoints?: number
      maxPoints?: number
      pointsExpiration?: number
      tieredProgram?: boolean
      tiers?: Array<{
        name: string
        pointsRequired: number
        benefits: string
      }>
      description?: string
    }
    teamSetup?: {
      teamMembers?: Array<{
        name: string
        email: string
        role: string
      }>
    }
    integration?: {
      platform?: string
      apiKey?: string
      webhookUrl?: string
      webhookSecret?: string
      testMode?: boolean
      autoSync?: boolean
    }
    branding?: {
      logo?: File
      primaryColor?: string
      secondaryColor?: string
      accentColor?: string
      emailTemplate?: {
        header?: string
        footer?: string
        backgroundColor?: string
        textColor?: string
      }
      customCSS?: string
    }
  }
  onEdit: (step: number) => void
}

export function ReviewForm({ data, onEdit }: ReviewFormProps) {
  const sections = [
    {
      title: 'Business Information',
      step: 0,
      fields: [
        { label: 'Business Name', value: data.businessInfo?.name },
        { label: 'Email', value: data.businessInfo?.email },
        { label: 'Phone', value: data.businessInfo?.phone },
        { label: 'Industry', value: data.businessInfo?.industry },
        { label: 'Business Size', value: data.businessInfo?.size },
        {
          label: 'Address',
          value: data.businessInfo?.address
            ? `${data.businessInfo.address}, ${data.businessInfo.city}, ${data.businessInfo.state} ${data.businessInfo.postalCode}, ${data.businessInfo.country}`
            : undefined,
        },
      ],
    },
    {
      title: 'Program Setup',
      step: 1,
      fields: [
        { label: 'Program Name', value: data.programSetup?.name },
        { label: 'Program Type', value: data.programSetup?.type },
        { label: 'Points Rate', value: data.programSetup?.pointsRate },
        { label: 'Min Points', value: data.programSetup?.minPoints },
        { label: 'Max Points', value: data.programSetup?.maxPoints },
        {
          label: 'Points Expiration',
          value: data.programSetup?.pointsExpiration
            ? `${data.programSetup.pointsExpiration} days`
            : undefined,
        },
        {
          label: 'Tiered Program',
          value: data.programSetup?.tieredProgram ? 'Yes' : 'No',
        },
        {
          label: 'Program Description',
          value: data.programSetup?.description,
        },
      ],
    },
    {
      title: 'Team Setup',
      step: 2,
      fields: data.teamSetup?.teamMembers?.map((member, index) => ({
        label: `Team Member ${index + 1}`,
        value: `${member.name} (${member.email}) - ${member.role}`,
      })),
    },
    {
      title: 'Integration',
      step: 3,
      fields: [
        { label: 'Platform', value: data.integration?.platform },
        { label: 'API Key', value: data.integration?.apiKey ? '********' : undefined },
        { label: 'Webhook URL', value: data.integration?.webhookUrl },
        { label: 'Webhook Secret', value: data.integration?.webhookSecret ? '********' : undefined },
        { label: 'Test Mode', value: data.integration?.testMode ? 'Enabled' : 'Disabled' },
        { label: 'Auto Sync', value: data.integration?.autoSync ? 'Enabled' : 'Disabled' },
      ],
    },
    {
      title: 'Branding',
      step: 4,
      fields: [
        { label: 'Logo', value: data.branding?.logo ? 'Uploaded' : undefined },
        { label: 'Primary Color', value: data.branding?.primaryColor },
        { label: 'Secondary Color', value: data.branding?.secondaryColor },
        { label: 'Accent Color', value: data.branding?.accentColor },
        { label: 'Email Header', value: data.branding?.emailTemplate?.header },
        { label: 'Email Footer', value: data.branding?.emailTemplate?.footer },
        { label: 'Email Background Color', value: data.branding?.emailTemplate?.backgroundColor },
        { label: 'Email Text Color', value: data.branding?.emailTemplate?.textColor },
        { label: 'Custom CSS', value: data.branding?.customCSS ? 'Added' : undefined },
      ],
    },
  ]

  const isSectionComplete = (fields: any[] | undefined) => {
    if (!fields || fields.length === 0) {
      return false;
    }
    return fields.every((field) => field.value !== undefined);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Review Setup</h2>
        <p className="text-muted-foreground">
          Review your loyalty program configuration before completing the setup.
        </p>
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <Card key={section.title} className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isSectionComplete(section.fields) ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <h3 className="text-lg font-semibold">{section.title}</h3>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => onEdit(section.step)}
              >
                Edit
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {section.fields?.map((field) => (
                <div key={field.label} className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {field.label}
                  </p>
                  <p className="text-sm">
                    {field.value || 'Not set'}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div className="rounded-lg border p-4">
        <h3 className="mb-4 text-lg font-semibold">Setup Status</h3>
        <div className="space-y-2">
          {sections.map((section) => (
            <div key={section.title} className="flex items-center gap-2">
              {isSectionComplete(section.fields) ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span>{section.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}