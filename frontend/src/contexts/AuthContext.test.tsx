import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

// Mock fetch
global.fetch = jest.fn();

// Componente de prueba para acceder al contexto
const TestComponent = () => {
  const { user, isAuthenticated, isLoading, login, logout, hasPermission } = useAuth();
  
  return (
    <div>
      <span data-testid="loading">{isLoading.toString()}</span>
      <span data-testid="authenticated">{isAuthenticated.toString()}</span>
      <span data-testid="user">{user?.username || 'none'}</span>
      <button onClick={() => login('test@test.com', 'password')}>Login</button>
      <button onClick={logout}>Logout</button>
      <span data-testid="permission">{hasPermission('capture:start').toString()}</span>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ detail: 'Not authenticated' }),
    });
  });

  test('proporciona estado inicial correcto', async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });
    
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('user')).toHaveTextContent('none');
  });

  test('isAuthenticated es false sin token', async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });
    
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
  });

  test('hasPermission devuelve false sin usuario', async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });
    
    expect(screen.getByTestId('permission')).toHaveTextContent('false');
  });

  test('logout limpia el estado', async () => {
    localStorage.setItem('access_token', 'fake-token');
    
    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });
    
    const logoutButton = screen.getByText('Logout');
    
    await act(async () => {
      logoutButton.click();
    });
    
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
  });
});
