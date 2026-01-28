import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import { LoginPage } from './LoginPage';
import * as authModule from 'aws-amplify/auth';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null }),
  };
});

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful auth
    vi.mocked(authModule.signIn).mockResolvedValue({
      isSignedIn: true,
      nextStep: { signInStep: 'DONE' },
    } as never);
    vi.mocked(authModule.getCurrentUser).mockResolvedValue({
      userId: '123',
      username: 'test@example.com',
    } as never);
    vi.mocked(authModule.fetchAuthSession).mockResolvedValue({
      tokens: { accessToken: 'mock-token' },
    } as never);
  });

  describe('rendering', () => {
    it('renders login form', () => {
      renderWithProviders(<LoginPage />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('renders remember me checkbox', () => {
      renderWithProviders(<LoginPage />);
      expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
    });

    it('renders forgot password link', () => {
      renderWithProviders(<LoginPage />);
      expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
    });

    it('renders sign up link', () => {
      renderWithProviders(<LoginPage />);
      expect(screen.getByText(/sign up/i)).toBeInTheDocument();
    });
  });

  describe('form interaction', () => {
    it('updates email field on input', () => {
      renderWithProviders(<LoginPage />);
      const emailInput = screen.getByLabelText(/email/i);

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      expect(emailInput).toHaveValue('test@example.com');
    });

    it('updates password field on input', () => {
      renderWithProviders(<LoginPage />);
      const passwordInput = screen.getByLabelText(/password/i);

      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      expect(passwordInput).toHaveValue('password123');
    });

    it('toggles remember me checkbox', () => {
      renderWithProviders(<LoginPage />);
      const checkbox = screen.getByLabelText(/remember me/i);

      expect(checkbox).not.toBeChecked();
      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();
    });
  });

  describe('form submission', () => {
    it('calls login with email and password on submit', async () => {
      renderWithProviders(<LoginPage />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'Password123!' },
      });

      fireEvent.submit(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(authModule.signIn).toHaveBeenCalledWith({
          username: 'test@example.com',
          password: 'Password123!',
        });
      });
    });

    it('navigates on successful login', async () => {
      renderWithProviders(<LoginPage />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'Password123!' },
      });

      fireEvent.submit(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
      });
    });

    it('shows loading state during submission', async () => {
      // Make signIn take longer
      vi.mocked(authModule.signIn).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      renderWithProviders(<LoginPage />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'Password123!' },
      });

      fireEvent.submit(screen.getByRole('button', { name: /sign in/i }));

      // Button should show loading state
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('displays error message on login failure', async () => {
      vi.mocked(authModule.signIn).mockRejectedValue(
        new Error('Invalid credentials')
      );

      renderWithProviders(<LoginPage />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'wrongpassword' },
      });

      fireEvent.submit(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  describe('form validation', () => {
    it('requires email field', () => {
      renderWithProviders(<LoginPage />);
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toBeRequired();
    });

    it('requires password field', () => {
      renderWithProviders(<LoginPage />);
      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toBeRequired();
    });
  });
});
