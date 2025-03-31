import { Input } from '@loyaltystudio/ui'
import { Label } from '@loyaltystudio/ui'
import { Button } from '@loyaltystudio/ui'
import { Textarea } from '@loyaltystudio/ui'
import { Upload, X } from 'lucide-react'
import { useState } from 'react'

interface BrandingSetupFormProps {
  data: {
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
  onChange: (data: any) => void
}

export function BrandingSetupForm({ data, onChange }: BrandingSetupFormProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const handleChange = (field: string, value: any) => {
    onChange({ ...data, [field]: value })
  }

  const handleEmailTemplateChange = (field: string, value: string) => {
    onChange({
      ...data,
      emailTemplate: {
        ...data.emailTemplate,
        [field]: value,
      },
    })
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleChange('logo', file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeLogo = () => {
    handleChange('logo', undefined)
    setLogoPreview(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Branding Setup</h2>
        <p className="text-muted-foreground">
          Customize the appearance of your loyalty program.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Program Logo</Label>
          <div className="mt-2 flex items-center gap-4">
            {logoPreview ? (
              <div className="relative">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="h-20 w-20 rounded-lg object-contain"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                  onClick={removeLogo}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div>
              <Input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
                id="logo-upload"
              />
              <Label
                htmlFor="logo-upload"
                className="cursor-pointer rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
              >
                Upload Logo
              </Label>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Primary Color</Label>
            <div className="flex gap-2">
              <Input
                id="primaryColor"
                type="color"
                value={data.primaryColor || '#000000'}
                onChange={(e) => handleChange('primaryColor', e.target.value)}
                className="h-10 w-20 p-1"
              />
              <Input
                type="text"
                value={data.primaryColor || ''}
                onChange={(e) => handleChange('primaryColor', e.target.value)}
                placeholder="#000000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondaryColor">Secondary Color</Label>
            <div className="flex gap-2">
              <Input
                id="secondaryColor"
                type="color"
                value={data.secondaryColor || '#ffffff'}
                onChange={(e) => handleChange('secondaryColor', e.target.value)}
                className="h-10 w-20 p-1"
              />
              <Input
                type="text"
                value={data.secondaryColor || ''}
                onChange={(e) => handleChange('secondaryColor', e.target.value)}
                placeholder="#ffffff"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accentColor">Accent Color</Label>
            <div className="flex gap-2">
              <Input
                id="accentColor"
                type="color"
                value={data.accentColor || '#ff0000'}
                onChange={(e) => handleChange('accentColor', e.target.value)}
                className="h-10 w-20 p-1"
              />
              <Input
                type="text"
                value={data.accentColor || ''}
                onChange={(e) => handleChange('accentColor', e.target.value)}
                placeholder="#ff0000"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Email Template</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="emailHeader">Header</Label>
            <Textarea
              id="emailHeader"
              value={data.emailTemplate?.header || ''}
              onChange={(e) => handleEmailTemplateChange('header', e.target.value)}
              placeholder="Enter email header"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailFooter">Footer</Label>
            <Textarea
              id="emailFooter"
              value={data.emailTemplate?.footer || ''}
              onChange={(e) => handleEmailTemplateChange('footer', e.target.value)}
              placeholder="Enter email footer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailBackgroundColor">Background Color</Label>
            <div className="flex gap-2">
              <Input
                id="emailBackgroundColor"
                type="color"
                value={data.emailTemplate?.backgroundColor || '#ffffff'}
                onChange={(e) =>
                  handleEmailTemplateChange('backgroundColor', e.target.value)
                }
                className="h-10 w-20 p-1"
              />
              <Input
                type="text"
                value={data.emailTemplate?.backgroundColor || ''}
                onChange={(e) =>
                  handleEmailTemplateChange('backgroundColor', e.target.value)
                }
                placeholder="#ffffff"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailTextColor">Text Color</Label>
            <div className="flex gap-2">
              <Input
                id="emailTextColor"
                type="color"
                value={data.emailTemplate?.textColor || '#000000'}
                onChange={(e) =>
                  handleEmailTemplateChange('textColor', e.target.value)
                }
                className="h-10 w-20 p-1"
              />
              <Input
                type="text"
                value={data.emailTemplate?.textColor || ''}
                onChange={(e) =>
                  handleEmailTemplateChange('textColor', e.target.value)
                }
                placeholder="#000000"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="customCSS">Custom CSS</Label>
        <Textarea
          id="customCSS"
          value={data.customCSS || ''}
          onChange={(e) => handleChange('customCSS', e.target.value)}
          placeholder="Enter custom CSS"
          className="font-mono"
        />
      </div>

      <div className="rounded-lg border p-4">
        <h3 className="mb-4 text-lg font-semibold">Preview</h3>
        <div
          className="rounded-lg p-8"
          style={{
            backgroundColor: data.emailTemplate?.backgroundColor || '#ffffff',
            color: data.emailTemplate?.textColor || '#000000',
          }}
        >
          <div className="mb-8">
            {data.emailTemplate?.header || 'Email Header'}
          </div>
          <div className="mb-8">
            <p>Sample content goes here...</p>
          </div>
          <div>{data.emailTemplate?.footer || 'Email Footer'}</div>
        </div>
      </div>
    </div>
  )
} 