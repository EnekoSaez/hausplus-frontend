import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // user shape: { name, email, role: 'client' | 'owner' | 'employee' }

  const login = async ({ email, password }) => {
    const { data } = await axios.post(
      'http://127.0.0.1:8000/api/auth/login/',
      { email, password }
    );
    localStorage.setItem('access',  data.access);
    localStorage.setItem('refresh', data.refresh);
    const payload = jwtDecode(data.access);
    const user = { name: payload.name, email: payload.email, role: payload.role };
    setUser(user);
    return user;
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
);
}

export const useAuth = () => useContext(AuthContext);
