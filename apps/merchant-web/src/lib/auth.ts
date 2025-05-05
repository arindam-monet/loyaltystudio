import { useAuthStore } from './stores/auth-store';

export async function getSession() {
  const token = useAuthStore.getState().token;
  const user = useAuthStore.getState().user;
  
  if (!token || !user) {
    return null;
  }
  
  return {
    access_token: token,
    user
  };
}
