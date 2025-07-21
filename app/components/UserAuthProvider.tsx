import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role: 'user' | 'admin' | 'premium';
  createdAt: string;
  preferences: {
    theme: 'light' | 'dark';
    autoSave: boolean;
    shareByDefault: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Demo user for development
  const demoUser: User = {
    id: 'demo-user-123',
    username: 'demo_creator',
    email: 'demo@geometryscript.com',
    role: 'premium',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
    createdAt: new Date().toISOString(),
    preferences: {
      theme: 'light',
      autoSave: true,
      shareByDefault: false
    }
  };

  useEffect(() => {
    // Simulate loading user session
    const loadSession = async () => {
      setIsLoading(true);
      
      // Check localStorage for existing session
      const savedUser = localStorage.getItem('geometry-script-user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (error) {
          console.error('Failed to parse saved user:', error);
          localStorage.removeItem('geometry-script-user');
        }
      } else {
        // Auto-login demo user for development
        setUser(demoUser);
        localStorage.setItem('geometry-script-user', JSON.stringify(demoUser));
      }
      
      setIsLoading(false);
    };

    loadSession();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo, accept any username/password
      const loggedInUser: User = {
        ...demoUser,
        id: `user-${Date.now()}`,
        username,
        email: `${username}@example.com`
      };
      
      setUser(loggedInUser);
      localStorage.setItem('geometry-script-user', JSON.stringify(loggedInUser));
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newUser: User = {
        id: `user-${Date.now()}`,
        username,
        email,
        role: 'user',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        createdAt: new Date().toISOString(),
        preferences: {
          theme: 'light',
          autoSave: true,
          shareByDefault: false
        }
      };
      
      setUser(newUser);
      localStorage.setItem('geometry-script-user', JSON.stringify(newUser));
      
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('geometry-script-user');
  };

  const updateProfile = async (updates: Partial<User>): Promise<void> => {
    if (!user) return;
    
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('geometry-script-user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider 
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        register,
        updateProfile,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 