import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/auth-store';
import Navbar from '@loyaltystudio/ui/src/components/layout/Navbar';

export default function AdminNavbar() {
  return <Navbar variant="admin" />;
} 