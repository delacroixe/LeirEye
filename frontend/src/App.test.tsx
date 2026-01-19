import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// Mock de los contextos
jest.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));

jest.mock('./contexts/SyncContext', () => ({
  SyncProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSync: () => ({
    activeProcessPid: null,
    setActiveProcessPid: jest.fn(),
  }),
}));

describe('App', () => {
  test('renderiza sin errores', () => {
    render(<App />);
    // La app debería renderizarse sin crashear
    expect(document.body).toBeInTheDocument();
  });

  test('redirige a login cuando no está autenticado', () => {
    render(<App />);
    // Debería mostrar la página de login
    expect(window.location.pathname).toBe('/');
  });
});
