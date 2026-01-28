import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import { ForgotPasswordPage } from './ForgotPasswordPage';
import * as authModule from 'aws-amplify/auth';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authModule.resetPassword).mockResolvedValue({
      isPasswordReset: false,
      nextStep: {
        resetPasswordStep: 'CONFIRM_RESET_PASSWORD_WITH_CODE',
        codeDeliveryDetails: {
          deliveryMedium: 'EMAIL',
          destination: 't***@example.com',
        },
      },
    } as never);
  });

  describe('rendering', () => {
    it('renders forgot password form', () => {
      renderWithProviders(<ForgotPasswordPage />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send reset code/i })).toBeInTheDocument();
    });

    it('renders back to login link', () => {
      renderWithProviders(<ForgotPasswordPage />);
      expect(screen.getByText(/back to login/i)).toBeInTheDocument();
    });

    it('renders email hint', () => {
      renderWithProviders(<ForgotPasswordPage />);
      expect(screen.getByText(/enter the email address associated/i)).toBeInTheDocument();
    });
  });

  describe('form interaction', () => {
    it('updates email field on input', () => {
      renderWithProviders(<ForgotPasswordPage />);
      const emailInput = screen.getByLabelText(/email/i);

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      expect(emailInput).toHaveValue('test@example.com');
    });
  });

  describe('form validation', () => {
    it('shows error when email is empty', async () => {
      renderWithProviders(<ForgotPasswordPage />);

      fireEvent.submit(screen.getByRole('button', { name: /send reset code/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('shows error for invalid email format', async () => {
      renderWithProviders(<ForgotPasswordPage />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'invalid-email' },
      });

      fireEvent.submit(screen.getByRole('button', { name: /send reset code/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  describe('form submission', () => {
    it('calls forgotPassword with email on valid submit', async () => {
      renderWithProviders(<ForgotPasswordPage />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      });

      fireEvent.submit(screen.getByRole('button', { name: /send reset code/i }));

      await waitFor(() => {
        expect(authModule.resetPassword).toHaveBeenCalledWith({
          username: 'test@example.com',
        });
      });
    });

    it('navigates to reset password page on success', async () => {
      renderWithProviders(<ForgotPasswordPage />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      });

      fireEvent.submit(screen.getByRole('button', { name: /send reset code/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/reset-password', {
          state: { email: 'test@example.com' },
        });
      });
    });

    it('shows loading state during submission', async () => {
      vi.mocked(authModule.resetPassword).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      renderWithProviders(<ForgotPasswordPage />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      });

      fireEvent.submit(screen.getByRole('button', { name: /send reset code/i }));

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('displays error message on failure', async () => {
      vi.mocked(authModule.resetPassword).mockRejectedValue(
        new Error('User not found')
      );

      renderWithProviders(<ForgotPasswordPage />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'unknown@example.com' },
      });

      fireEvent.submit(screen.getByRole('button', { name: /send reset code/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });
});
