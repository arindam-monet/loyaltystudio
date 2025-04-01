'use client';

import { useState } from 'react';
import { Button, Card, Input, Alert } from '@loyaltystudio/ui';
import { Mail, Trash2, Loader2 } from 'lucide-react';
import { useTeam } from '@/hooks/use-team';

const roles = [
  {
    value: 'admin',
    label: 'Admin',
    description: 'Full access to all features and settings',
  },
  {
    value: 'manager',
    label: 'Manager',
    description: 'Can manage loyalty programs and view analytics',
  },
  {
    value: 'editor',
    label: 'Editor',
    description: 'Can edit content and manage rewards',
  },
  {
    value: 'viewer',
    label: 'Viewer',
    description: 'Can view data and reports only',
  },
];

export default function TeamPage() {
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState(roles[0].value);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const { data: teamMembers, isLoading, invite, remove } = useTeam();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await invite.mutateAsync({ email, role: selectedRole });
      setEmail('');
      setShowInviteForm(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (window.confirm('Are you sure you want to remove this team member?')) {
      await remove.mutateAsync(memberId);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Team Members</h1>
          <p className="mt-2 text-sm text-gray-500">
            Manage your team members and their access levels
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button
            onClick={() => setShowInviteForm(true)}
            className="flex items-center gap-2"
          >
            <Mail className="h-4 w-4" />
            Invite Team Member
          </Button>
        </div>
      </div>

      {showInviteForm && (
        <Card className="mb-8">
          <form onSubmit={handleInvite} className="p-6 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                >
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowInviteForm(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={invite.isPending}
                className="flex items-center gap-2"
              >
                {invite.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Send Invitation
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : teamMembers?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No team members found
                  </td>
                </tr>
              ) : (
                teamMembers?.map((member) => (
                  <tr key={member.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {member.name || 'Not set'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{member.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {roles.find((r) => r.value === member.role)?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          member.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {member.status === 'active' ? 'Active' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
} 