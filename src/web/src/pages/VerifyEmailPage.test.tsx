import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import { VerifyEmailPage } from './VerifyEmailPage';
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

describe('VerifyEmailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationState = null;
    vi.mocked(authModule.confirmSignUp).mockResolvedValue({
      isSignUpComplete: true,
      nextStep: { signUpStep: 'DONE' },
    } as never);
    vi.mocked(authModule.resendSignUpCode).mockResolvedValue({
      destination: 'test@example.com',
      deliveryMedium: 'EMAIL',
    } as never);
  });

  describe('rendering', () => {
    it('renders verification form', () => {
      renderWithProviders(<VerifyEmailPage />);

      expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /verify email/i })).toBeInTheDocument();
    });

    it('shows email input when no email in location state', () => {
      renderWithProviders(<VerifyEmailPage />);
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it('hides email input when email is in location state', () => {
      mockLocationState = { email: 'test@example.com' };
      renderWithProviders(<VerifyEmailPage />);

      // Email input should not be visible (only code input)
      const inputs = screen.getAllByRole('textbox');
      expect(inputs).toHaveLength(1); // Only code input
    });

    it('shows email in subtitle when provided in state', () => {
      mockLocationState = { email: 'test@example.com' };
      renderWithProviders(<VerifyEmailPage />);
      expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
    });

    it('renders back to login link', () => {
      renderWithProviders(<VerifyEmailPage />);
      expect(screen.getByText(/back to login/i)).toBeInTheDocument();
    });

    it('renders resend code button', () => {
      renderWithProviders(<VerifyEmailPage />);
      expect(screen.getByText(/resend code/i)).toBeInTheDocument();
    });
  });

  describe('code input', () => {
    it('only allows numeric input', () => {
      renderWithProviders(<VerifyEmailPage />);
      const codeInput = screen.getByLabelText(/verification code/i);

      fireEvent.change(codeInput, { target: { value: 'abc123def' } });
      expect(codeInput).toHaveValue('123');
    });

    it('limits input to 6 digits', () => {
      renderWithProviders(<VerifyEmailPage />);
      const codeInput = screen.getByLabelText(/verification code/i);

      fireEvent.change(codeInput, { target: { value: '1234567890' } });
      expect(codeInput).toHaveValue('123456');
    });
  });

  describe('form validation', () => {
    it('shows error when email is empty', async () => {
      renderWithProviders(<VerifyEmailPage />);

      fireEvent.change(screen.getByLabelText(/verification code/i), {
        target: { value: '123456' },
      });

      fireEvent.submit(screen.getByRole('button', { name: /verify email/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('shows error for invalid code length', async () => {
      mockLocationState = { email: 'test@example.com' };
      renderWithProviders(<VerifyEmailPage />);

      fireEvent.change(screen.getByLabelText(/verification code/i), {
        target: { value: '123' },
      });

      fireEvent.submit(screen.getByRole('button', { name: /verify email/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('disables submit button when code is not 6 digits', () => {
      mockLocationState = { email: 'test@example.com' };
      renderWithProviders(<VerifyEmailPage />);

      const submitButton = screen.getByRole('button', { name: /verify email/i });
      expect(submitButton).toBeDisabled();

      fireEvent.change(screen.getByLabelText(/verification code/i), {
        target: { value: '123456' },
      });

      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('form submission', () => {
    it('calls confirmRegistration with email and code', async () => {
      mockLocationState = { email: 'test@example.com' };
      renderWithProviders(<VerifyEmailPage />);

      fireEvent.change(screen.getByLabelText(/verification code/i), {
        target: { value: '123456' },
      });

      fireEvent.submit(screen.getByRole('button', { name: /verify email/i }));

      await waitFor(() => {
        expect(authModule.confirmSignUp).toHaveBeenCalledWith({
          username: 'test@example.com',
          confirmationCode: '123456',
        });
      });
    });

    it('shows success message on success', async () => {
      mockLocationState = { email: 'test@example.com' };
      renderWithProviders(<VerifyEmailPage />);

      fireEvent.change(screen.getByLabelText(/verification code/i), {
        target: { value: '123456' },
      });

      fireEvent.submit(screen.getByRole('button', { name: /verify email/i }));

      await waitFor(() => {
        expect(screen.getByText(/verified successfully/i)).toBeInTheDocument();
      });
    });

    it('displays error message on failure', async () => {
      vi.mocked(authModule.confirmSignUp).mockRejectedValue(
        new Error('Invalid code')
      );

      mockLocationState = { email: 'test@example.com' };
      renderWithProviders(<VerifyEmailPage />);

      fireEvent.change(screen.getByLabelText(/verification code/i), {
        target: { value: '000000' },
      });

      fireEvent.submit(screen.getByRole('button', { name: /verify email/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  describe('resend code', () => {
    it('calls resendVerificationCode when resend button clicked', async () => {
      mockLocationState = { email: 'test@example.com' };
      renderWithProviders(<VerifyEmailPage />);

      fireEvent.click(screen.getByRole('button', { name: /resend code/i }));

      await waitFor(() => {
        expect(authModule.resendSignUpCode).toHaveBeenCalledWith({
          username: 'test@example.com',
        });
      });
    });

    it('shows success message after resending', async () => {
      mockLocationState = { email: 'test@example.com' };
      renderWithProviders(<VerifyEmailPage />);

      fireEvent.click(screen.getByRole('button', { name: /resend code/i }));

      await waitFor(() => {
        expect(screen.getByText(/code sent/i)).toBeInTheDocument();
      });
    });
  });
});
