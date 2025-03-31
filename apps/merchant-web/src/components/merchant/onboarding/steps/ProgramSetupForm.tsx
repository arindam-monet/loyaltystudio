import { Input } from '@loyaltystudio/ui'
import { Label } from '@loyaltystudio/ui'
import { Textarea } from '@loyaltystudio/ui'
import { Switch } from '@loyaltystudio/ui'
import { Button } from '@loyaltystudio/ui'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@loyaltystudio/ui'
import { Plus, Trash2 } from 'lucide-react'

interface ProgramSetupFormProps {
  data: {
    name?: string
    type?: string
    pointsRate?: string
    minimumPoints?: string
    maximumPoints?: string
    pointsExpiration?: string
    tieredProgram?: boolean
    tiers?: Array<{
      name: string
      pointsRequired: string
      benefits: string
    }>
    description?: string
  }
  onChange: (data: any) => void
}

export function ProgramSetupForm({ data, onChange }: ProgramSetupFormProps) {
  const handleChange = (field: string, value: any) => {
    onChange({ ...data, [field]: value })
  }

  const handleTierChange = (index: number, field: string, value: string) => {
    const updatedTiers = [...(data.tiers || [])]
    updatedTiers[index] = {
      ...updatedTiers[index],
      [field]: value,
    }
    handleChange('tiers', updatedTiers)
  }

  const addTier = () => {
    const newTier = {
      name: '',
      pointsRequired: '',
      benefits: '',
    }
    handleChange('tiers', [...(data.tiers || []), newTier])
  }

  const removeTier = (index: number) => {
    const updatedTiers = [...(data.tiers || [])]
    updatedTiers.splice(index, 1)
    handleChange('tiers', updatedTiers)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Program Setup</h2>
        <p className="text-muted-foreground">
          Configure your loyalty program settings and rewards structure.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Program Name</Label>
          <Input
            id="name"
            value={data.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Enter program name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Program Type</Label>
          <Select
            value={data.type}
            onValueChange={(value) => handleChange('type', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select program type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="points">Points-based</SelectItem>
              <SelectItem value="tiers">Tier-based</SelectItem>
              <SelectItem value="hybrid">Hybrid (Points + Tiers)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pointsRate">Points Rate</Label>
          <Input
            id="pointsRate"
            type="number"
            value={data.pointsRate || ''}
            onChange={(e) => handleChange('pointsRate', e.target.value)}
            placeholder="e.g., 1 point per $1"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="minimumPoints">Minimum Points</Label>
          <Input
            id="minimumPoints"
            type="number"
            value={data.minimumPoints || ''}
            onChange={(e) => handleChange('minimumPoints', e.target.value)}
            placeholder="Enter minimum points"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maximumPoints">Maximum Points</Label>
          <Input
            id="maximumPoints"
            type="number"
            value={data.maximumPoints || ''}
            onChange={(e) => handleChange('maximumPoints', e.target.value)}
            placeholder="Enter maximum points"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pointsExpiration">Points Expiration (days)</Label>
          <Input
            id="pointsExpiration"
            type="number"
            value={data.pointsExpiration || ''}
            onChange={(e) => handleChange('pointsExpiration', e.target.value)}
            placeholder="Enter expiration period"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Enable Tiered Program</Label>
            <p className="text-sm text-muted-foreground">
              Create different tiers with unique benefits
            </p>
          </div>
          <Switch
            checked={data.tieredProgram}
            onCheckedChange={(checked) => handleChange('tieredProgram', checked)}
          />
        </div>

        {data.tieredProgram && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Program Tiers</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTier}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Tier
              </Button>
            </div>

            {data.tiers?.map((tier, index) => (
              <div
                key={index}
                className="rounded-lg border p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Tier {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTier(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tier Name</Label>
                    <Input
                      value={tier.name}
                      onChange={(e) =>
                        handleTierChange(index, 'name', e.target.value)
                      }
                      placeholder="e.g., Silver, Gold, Platinum"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Points Required</Label>
                    <Input
                      type="number"
                      value={tier.pointsRequired}
                      onChange={(e) =>
                        handleTierChange(index, 'pointsRequired', e.target.value)
                      }
                      placeholder="Enter points required"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Benefits</Label>
                    <Textarea
                      value={tier.benefits}
                      onChange={(e) =>
                        handleTierChange(index, 'benefits', e.target.value)
                      }
                      placeholder="Describe tier benefits"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Program Description</Label>
        <Textarea
          id="description"
          value={data.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Describe your loyalty program"
        />
      </div>
    </div>
  )
} 