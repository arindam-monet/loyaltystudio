export interface AuthUser {
  id: string;
  email: string;
  role: {
    id: string;
    name: string;
    description?: string;
  };
  merchantId: string;
  tenantId: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}
