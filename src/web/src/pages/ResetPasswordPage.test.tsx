import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import { ResetPasswordPage } from './ResetPasswordPage';
import * as authModule from 'aws-amplify/auth';

// Mock useNavigate and useLocation
const mockNavigate = vi.fn();
let mockLocationState: { email?: string } | null = null;

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: mockLocationState }),
  };
});

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationState = null;
    vi.mocked(authModule.confirmResetPassword).mockResolvedValue(undefined as never);
  });

  describe('rendering', () => {
    it('renders reset password form', () => {
      renderWithProviders(<ResetPasswordPage />);

      expect(screen.getByLabelText(/reset code/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm.*password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
    });

    it('shows email input when no email in location state', () => {
      renderWithProviders(<ResetPasswordPage />);
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it('hides email input when email is in location state', () => {
      mockLocationState = { email: 'test@example.com' };
      renderWithProviders(<ResetPasswordPage />);

      // Email input should not be visible
      expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
    });

    it('renders password requirements', () => {
      renderWithProviders(<ResetPasswordPage />);
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    });

    it('renders back to login link', () => {
      renderWithProviders(<ResetPasswordPage />);
      expect(screen.getByText(/back to login/i)).toBeInTheDocument();
    });
  });

  describe('code input', () => {
    it('only allows numeric input', () => {
      renderWithProviders(<ResetPasswordPage />);
      const codeInput = screen.getByLabelText(/reset code/i);

      fireEvent.change(codeInput, { target: { value: 'abc123def' } });
      expect(codeInput).toHaveValue('123');
    });

    it('limits input to 6 digits', () => {
      renderWithProviders(<ResetPasswordPage />);
      const codeInput = screen.getByLabelText(/reset code/i);

      fireEvent.change(codeInput, { target: { value: '1234567890' } });
      expect(codeInput).toHaveValue('123456');
    });
  });

  describe('form validation', () => {
    it('shows error when required fields are empty', async () => {
      mockLocationState = { email: 'test@example.com' };
      renderWithProviders(<ResetPasswordPage />);

      fireEvent.submit(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        // Should show validation errors
        expect(screen.getByText(/6-digit/i)).toBeInTheDocument();
      });
    });

    it('shows error for invalid code length', async () => {
      mockLocationState = { email: 'test@example.com' };
      renderWithProviders(<ResetPasswordPage />);

      fireEvent.change(screen.getByLabelText(/reset code/i), {
        target: { value: '123' },
      });
      fireEvent.change(screen.getByLabelText(/^new password$/i), {
        target: { value: 'Password123!' },
      });
      fireEvent.change(screen.getByLabelText(/confirm.*password/i), {
        target: { value: 'Password123!' },
      });

      fireEvent.submit(screen.getByRole('button', { name: /reset password/i }));

      // Should show code error
      await waitFor(() => {
        expect(screen.getByText(/6-digit/i)).toBeInTheDocument();
      });
    });

    it('shows error for weak password', async () => {
      mockLocationState = { email: 'test@example.com' };
      renderWithProviders(<ResetPasswordPage />);

      fireEvent.change(screen.getByLabelText(/reset code/i), {
        target: { value: '123456' },
      });
      fireEvent.change(screen.getByLabelText(/^new password$/i), {
        target: { value: 'weak' },
      });
      fireEvent.change(screen.getByLabelText(/confirm.*password/i), {
        target: { value: 'weak' },
      });

      fireEvent.submit(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('shows error when passwords do not match', async () => {
      mockLocationState = { email: 'test@example.com' };
      renderWithProviders(<ResetPasswordPage />);

      fireEvent.change(screen.getByLabelText(/reset code/i), {
        target: { value: '123456' },
      });
      fireEvent.change(screen.getByLabelText(/^new password$/i), {
        target: { value: 'Password123!' },
      });
      fireEvent.change(screen.getByLabelText(/confirm.*password/i), {
        target: { value: 'DifferentPassword123!' },
      });

      fireEvent.submit(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });
  });

  describe('form submission', () => {
    it('calls resetPasswordConfirm with email, code, and password', async () => {
      mockLocationState = { email: 'test@example.com' };
      renderWithProviders(<ResetPasswordPage />);

      fireEvent.change(screen.getByLabelText(/reset code/i), {
        target: { value: '123456' },
      });
      fireEvent.change(screen.getByLabelText(/^new password$/i), {
        target: { value: 'NewPassword123!' },
      });
      fireEvent.change(screen.getByLabelText(/confirm.*password/i), {
        target: { value: 'NewPassword123!' },
      });

      fireEvent.submit(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(authModule.confirmResetPassword).toHaveBeenCalledWith({
          username: 'test@example.com',
          confirmationCode: '123456',
          newPassword: 'NewPassword123!',
        });
      });
    });

    it('shows success message on successful reset', async () => {
      mockLocationState = { email: 'test@example.com' };
      renderWithProviders(<ResetPasswordPage />);

      fireEvent.change(screen.getByLabelText(/reset code/i), {
        target: { value: '123456' },
      });
      fireEvent.change(screen.getByLabelText(/^new password$/i), {
        target: { value: 'NewPassword123!' },
      });
      fireEvent.change(screen.getByLabelText(/confirm.*password/i), {
        target: { value: 'NewPassword123!' },
      });

      fireEvent.submit(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByText(/successfully/i)).toBeInTheDocument();
      });
    });

    it('displays error message on failure', async () => {
      vi.mocked(authModule.confirmResetPassword).mockRejectedValue(
        new Error('Invalid code')
      );

      mockLocationState = { email: 'test@example.com' };
      renderWithProviders(<ResetPasswordPage />);

      fireEvent.change(screen.getByLabelText(/reset code/i), {
        target: { value: '000000' },
      });
      fireEvent.change(screen.getByLabelText(/^new password$/i), {
        target: { value: 'NewPassword123!' },
      });
      fireEvent.change(screen.getByLabelText(/confirm.*password/i), {
        target: { value: 'NewPassword123!' },
      });

      fireEvent.submit(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });
});
