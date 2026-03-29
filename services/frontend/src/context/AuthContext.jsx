import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = not logged in

  const login = async (email, password, role = 'customer') => {
    // TODO: replace with real API call
    // const res = await fetch('/api/auth/login', { method:'POST', body: JSON.stringify({email,password}) });
    const mockUser = {
      id: '1',
      name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
      email,
      role, // 'customer' | 'owner'
      credits: 240,
      avatar: email[0].toUpperCase(),
    };
    setUser(mockUser);
    localStorage.setItem('dine_user', JSON.stringify(mockUser));
    return mockUser;
  };

  const signup = async (name, email, password, role = 'customer') => {
    const mockUser = { id: Date.now().toString(), name, email, role, credits: 100, avatar: name[0].toUpperCase() };
    setUser(mockUser);
    localStorage.setItem('dine_user', JSON.stringify(mockUser));
    return mockUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('dine_user');
  };

  // Auto-restore from localStorage
  useState(() => {
    const stored = localStorage.getItem('dine_user');
    if (stored) setUser(JSON.parse(stored));
  });

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
