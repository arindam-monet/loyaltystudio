import { Input } from '@loyaltystudio/ui'
import { Label } from '@loyaltystudio/ui'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@loyaltystudio/ui'

interface BusinessInfoFormProps {
  data: {
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
  onChange: (data: any) => void
}

export function BusinessInfoForm({ data, onChange }: BusinessInfoFormProps) {
  const handleChange = (field: string, value: string) => {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Business Information</h2>
        <p className="text-muted-foreground">
          Please provide your business details to get started.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Business Name</Label>
          <Input
            id="name"
            value={data.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Enter your business name"
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Business Email</Label>
          <Input
            id="email"
            type="email"
            value={data.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="Enter your business email"
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={data.phone || ''}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="Enter your phone number"
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <Select
            value={data.industry}
            onValueChange={(value) => handleChange('industry', value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select your industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="retail">Retail</SelectItem>
              <SelectItem value="restaurant">Restaurant</SelectItem>
              <SelectItem value="service">Service</SelectItem>
              <SelectItem value="technology">Technology</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="size">Business Size</Label>
          <Select
            value={data.size}
            onValueChange={(value) => handleChange('size', value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select your business size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1-10">1-10 employees</SelectItem>
              <SelectItem value="11-50">11-50 employees</SelectItem>
              <SelectItem value="51-200">51-200 employees</SelectItem>
              <SelectItem value="201-500">201-500 employees</SelectItem>
              <SelectItem value="500+">500+ employees</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Street Address</Label>
          <Input
            id="address"
            value={data.address || ''}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Enter your street address"
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={data.city || ''}
            onChange={(e) => handleChange('city', e.target.value)}
            placeholder="Enter your city"
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">State/Province</Label>
          <Input
            id="state"
            value={data.state || ''}
            onChange={(e) => handleChange('state', e.target.value)}
            placeholder="Enter your state/province"
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            value={data.country || ''}
            onChange={(e) => handleChange('country', e.target.value)}
            placeholder="Enter your country"
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="postalCode">Postal Code</Label>
          <Input
            id="postalCode"
            value={data.postalCode || ''}
            onChange={(e) => handleChange('postalCode', e.target.value)}
            placeholder="Enter your postal code"
            className="w-full"
          />
        </div>
      </div>
    </div>
  )
} 