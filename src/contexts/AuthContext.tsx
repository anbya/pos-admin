import React, { useEffect, useState, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_APIKEY;
export const supabase = createClient(supabaseUrl, supabaseKey);


interface Employee {
  id: number;
  user_name: string;
  email: string;
  // ...other fields...
}
interface AuthContextType {
  user: any;
  employee: Employee | null;
  setEmployee: (emp: Employee | null) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({
  children
}) => {
  const [user, setUser] = useState<any>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  // Check if user is already logged in on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedEmployee = localStorage.getItem('employee');
    if (storedUser) setUser(JSON.parse(storedUser));
    if (storedEmployee) setEmployee(JSON.parse(storedEmployee));
    setIsLoading(false);
  }, []);
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) throw error || new Error('Login failed');
      setUser(data.user);
      // Fetch employee data after login
      const { data: empData, error: empError } = await supabase
        .from('employee')
        .select('*')
        .eq('email', email)
        .single();
      if (empError || !empData) throw empError || new Error('Employee not found');
      setEmployee(empData);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('employee', JSON.stringify(empData));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  const logout = () => {
    supabase.auth.signOut();
    localStorage.removeItem('user');
    localStorage.removeItem('employee');
    setUser(null);
    setEmployee(null);
    navigate('/login');
  };
  return <AuthContext.Provider value={{
    user,
    employee,
    setEmployee,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout
  }}>
      {children}
    </AuthContext.Provider>;
};