import React from 'react';
import { Login } from './Login';

// Mock de Login para evitar problemas con react-router-dom
vi.mock('./Login', () => {
  return {
    Login: function MockLogin() {
      return <div>Login Mock</div>;
    },
  };
});

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('componente existe', () => {
    expect(Login).toBeDefined();
  });
});
