'use client';

import { useAuthStore } from '@/lib/stores/auth-store';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Badge,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@loyaltystudio/ui';
import { ChevronUp, LogOut, Settings, User, Shield } from 'lucide-react';
import { useLogout } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

export interface UserInfoProps {
  compact?: boolean;
}

export function UserInfo({ compact = false }: UserInfoProps) {
  const { user } = useAuthStore();
  const router = useRouter();
  const logout = useLogout();

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!user) return null;

  return (
    <TooltipProvider delayDuration={300}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={compact ? "w-full flex justify-center py-4" : "w-full justify-start px-2 py-6"}
            title={compact ? `${user.name} (${user.email})` : undefined}
          >
            {compact ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="h-8 w-8 border-2 border-primary/10 transition-all hover:border-primary/30">
                    <AvatarImage src={user.avatar || undefined} />
                    <AvatarFallback className="bg-primary/5 text-primary">{user.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {user.name} ({user.email})
                </TooltipContent>
              </Tooltip>
            ) : (
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar || undefined} />
                  <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{user.name}</span>
                    <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                      <Shield className="h-2 w-2" />
                      {user.role.name}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </div>
                <ChevronUp className="ml-auto h-4 w-4" />
              </div>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push('/account')}>
            <User className="mr-2 h-4 w-4" />
            Account
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}