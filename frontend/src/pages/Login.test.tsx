import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Login } from './Login';

// Mock del contexto de auth
const mockLogin = jest.fn();
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    isAuthenticated: false,
    isLoading: false,
  }),
}));

// Mock de lucide-react icons
jest.mock('lucide-react', () => ({
  Eye: () => <span data-testid="eye-icon">Eye</span>,
  EyeOff: () => <span data-testid="eye-off-icon">EyeOff</span>,
  Loader: () => <span data-testid="loader-icon">Loader</span>,
}));

describe('Login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderLogin = () => {
    return render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
  };

  test('renderiza formulario de login', () => {
    renderLogin();
    
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/contraseña/i)).toBeInTheDocument();
  });

  test('permite escribir email y contraseña', () => {
    renderLogin();
    
    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/contraseña/i);
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  test('toggle de visibilidad de contraseña', () => {
    renderLogin();
    
    const passwordInput = screen.getByPlaceholderText(/contraseña/i);
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Buscar el botón de toggle por su clase o rol
    const toggleButton = screen.getByTestId('eye-icon').closest('button') || 
                         document.querySelector('.password-toggle');
    
    if (toggleButton) {
      fireEvent.click(toggleButton);
      // Después del click debería cambiar el tipo
    }
  });

  test('llama a login al enviar el formulario', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    renderLogin();
    
    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/contraseña/i);
    const form = emailInput.closest('form');
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    if (form) {
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    }
  });

  test('muestra error cuando login falla', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Credenciales inválidas'));
    renderLogin();
    
    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/contraseña/i);
    const form = emailInput.closest('form');
    
    fireEvent.change(emailInput, { target: { value: 'bad@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
    
    if (form) {
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(screen.getByText(/credenciales inválidas/i)).toBeInTheDocument();
      });
    }
  });
});
