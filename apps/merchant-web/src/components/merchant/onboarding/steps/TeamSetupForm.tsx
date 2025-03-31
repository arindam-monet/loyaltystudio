import { Input } from '@loyaltystudio/ui'
import { Label } from '@loyaltystudio/ui'
import { Button } from '@loyaltystudio/ui'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@loyaltystudio/ui'
import { Plus, Trash2 } from 'lucide-react'

interface TeamMember {
  name: string
  email: string
  role: string
}

interface TeamSetupFormProps {
  data: {
    teamMembers?: TeamMember[]
  }
  onChange: (data: any) => void
}

export function TeamSetupForm({ data, onChange }: TeamSetupFormProps) {
  const handleChange = (field: string, value: any) => {
    onChange({ ...data, [field]: value })
  }

  const handleMemberChange = (index: number, field: keyof TeamMember, value: string) => {
    const updatedMembers = [...(data.teamMembers || [])]
    updatedMembers[index] = {
      ...updatedMembers[index],
      [field]: value,
    }
    handleChange('teamMembers', updatedMembers)
  }

  const addTeamMember = () => {
    const newMember = {
      name: '',
      email: '',
      role: '',
    }
    handleChange('teamMembers', [...(data.teamMembers || []), newMember])
  }

  const removeTeamMember = (index: number) => {
    const updatedMembers = [...(data.teamMembers || [])]
    updatedMembers.splice(index, 1)
    handleChange('teamMembers', updatedMembers)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Team Setup</h2>
        <p className="text-muted-foreground">
          Add team members who will manage your loyalty program.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Team Members</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addTeamMember}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Member
          </Button>
        </div>

        {data.teamMembers?.map((member, index) => (
          <div
            key={index}
            className="rounded-lg border p-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Member {index + 1}</h4>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeTeamMember(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={member.name}
                  onChange={(e) =>
                    handleMemberChange(index, 'name', e.target.value)
                  }
                  placeholder="Enter member name"
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={member.email}
                  onChange={(e) =>
                    handleMemberChange(index, 'email', e.target.value)
                  }
                  placeholder="Enter member email"
                />
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={member.role}
                  onValueChange={(value) =>
                    handleMemberChange(index, 'role', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="manager">Program Manager</SelectItem>
                    <SelectItem value="staff">Staff Member</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border p-4">
        <h3 className="mb-4 text-lg font-semibold">Role Descriptions</h3>
        <div className="space-y-2">
          <div>
            <h4 className="font-medium">Administrator</h4>
            <p className="text-sm text-muted-foreground">
              Full access to all program settings and team management
            </p>
          </div>
          <div>
            <h4 className="font-medium">Program Manager</h4>
            <p className="text-sm text-muted-foreground">
              Can manage program settings and view analytics
            </p>
          </div>
          <div>
            <h4 className="font-medium">Staff Member</h4>
            <p className="text-sm text-muted-foreground">
              Can manage customer points and rewards
            </p>
          </div>
          <div>
            <h4 className="font-medium">Viewer</h4>
            <p className="text-sm text-muted-foreground">
              Can only view program information and analytics
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 