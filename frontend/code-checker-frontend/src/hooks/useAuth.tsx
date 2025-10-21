import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/api';

interface User {
  id: string;
  email: string;
  role: string;
  companyId?: string;
  name?: string;
  createdAt?: string; 
}

interface AuthContextType {
  user: User | null;
  token: string | null; 
  isAuthenticated: boolean;
  isVerifying: boolean;
  isLoading: boolean; 
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  const verifySession = useCallback(async (storedToken: string) => {
    setIsVerifying(true);
    try {
      const res = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      if (res.data?.success && res.data.user) {
        console.log('[Auth] /auth/me verified user:', res.data);
        setUser(res.data.user);
        setIsAuthenticated(true);
        setToken(storedToken);
        localStorage.setItem('authToken', storedToken);
      } else {
        logout();
      }
    } catch (err) {
      logout();
    } finally {
      setIsVerifying(false);
    }
  }, []);

  const login = useCallback(
    async (token: string) => {
      localStorage.setItem('authToken', token);
      setToken(token);
      await verifySession(token);
    },
    [verifySession]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      verifySession(storedToken);
    } else {
      setIsVerifying(false);
    }
  }, [verifySession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        token,
        isVerifying,
        isLoading: isVerifying,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
