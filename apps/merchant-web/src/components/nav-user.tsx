'use client';

import { UserInfo } from './user-info';
import { useSidebar } from '@loyaltystudio/ui';

export function NavUser() {
  const { open: sidebarOpen } = useSidebar();
  return <UserInfo compact={!sidebarOpen} />;
}