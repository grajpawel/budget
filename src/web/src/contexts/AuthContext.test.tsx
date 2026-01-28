import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import * as authModule from 'aws-amplify/auth';
import type { ReactNode } from 'react';

// Wrapper for renderHook
function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: user not authenticated
    vi.mocked(authModule.getCurrentUser).mockRejectedValue(new Error('Not authenticated'));
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('useAuth hook', () => {
    it('throws error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });

    it('provides auth context when used inside AuthProvider', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current).toHaveProperty('login');
      expect(result.current).toHaveProperty('logout');
      expect(result.current).toHaveProperty('register');
      expect(result.current).toHaveProperty('isAuthenticated');
    });
  });

  describe('initial state', () => {
    it('starts with loading state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      expect(result.current.isLoading).toBe(true);
    });

    it('becomes not loading after auth check', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('sets isAuthenticated to false when no user', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBe(null);
      });
    });

    it('sets isAuthenticated to true when user exists', async () => {
      vi.mocked(authModule.getCurrentUser).mockResolvedValue({
        userId: '123',
        username: 'test@example.com',
      } as never);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user).not.toBe(null);
      });
    });
  });

  describe('login', () => {
    beforeEach(() => {
      vi.mocked(authModule.signIn).mockResolvedValue({
        isSignedIn: true,
        nextStep: { signInStep: 'DONE' },
      } as never);
      vi.mocked(authModule.getCurrentUser).mockResolvedValue({
        userId: '123',
        username: 'test@example.com',
      } as never);
    });

    it('calls signIn with credentials', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => !result.current.isLoading);

      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      expect(authModule.signIn).toHaveBeenCalledWith({
        username: 'test@example.com',
        password: 'password',
      });
    });

    it('sets isAuthenticated to true on successful login', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => !result.current.isLoading);

      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      expect(result.current.isAuthenticated).toBe(true);
    });

    it('stores remember me preference in localStorage', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => !result.current.isLoading);

      await act(async () => {
        await result.current.login('test@example.com', 'password', true);
      });

      expect(localStorage.getItem('budget_remember_me')).toBe('true');
    });

    it('stores session preference when not remembering', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => !result.current.isLoading);

      await act(async () => {
        await result.current.login('test@example.com', 'password', false);
      });

      expect(sessionStorage.getItem('budget_remember_me')).toBe('session');
    });

    it('throws friendly error message on failure', async () => {
      vi.mocked(authModule.signIn).mockRejectedValue(
        Object.assign(new Error('Invalid'), { name: 'NotAuthorizedException' })
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => !result.current.isLoading);

      await expect(
        act(async () => {
          await result.current.login('test@example.com', 'wrong');
        })
      ).rejects.toThrow('Incorrect email or password');
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      vi.mocked(authModule.signIn).mockResolvedValue({
        isSignedIn: true,
        nextStep: { signInStep: 'DONE' },
      } as never);
      vi.mocked(authModule.getCurrentUser).mockResolvedValue({
        userId: '123',
        username: 'test@example.com',
      } as never);
      vi.mocked(authModule.signOut).mockResolvedValue(undefined as never);
    });

    it('calls signOut', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => result.current.isAuthenticated);

      await act(async () => {
        await result.current.logout();
      });

      expect(authModule.signOut).toHaveBeenCalled();
    });

    it('sets isAuthenticated to false after logout', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => result.current.isAuthenticated);

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
    });

    it('clears storage on logout', async () => {
      localStorage.setItem('budget_remember_me', 'true');
      sessionStorage.setItem('budget_remember_me', 'session');

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => result.current.isAuthenticated);

      await act(async () => {
        await result.current.logout();
      });

      expect(localStorage.getItem('budget_remember_me')).toBe(null);
      expect(sessionStorage.getItem('budget_remember_me')).toBe(null);
    });
  });

  describe('register', () => {
    beforeEach(() => {
      vi.mocked(authModule.signUp).mockResolvedValue({
        isSignUpComplete: false,
        nextStep: { signUpStep: 'CONFIRM_SIGN_UP' },
      } as never);
    });

    it('calls signUp with email and password', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => !result.current.isLoading);

      await act(async () => {
        await result.current.register('test@example.com', 'Password123!');
      });

      expect(authModule.signUp).toHaveBeenCalledWith({
        username: 'test@example.com',
        password: 'Password123!',
        options: {
          userAttributes: {
            email: 'test@example.com',
          },
        },
      });
    });

    it('includes display name when provided', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => !result.current.isLoading);

      await act(async () => {
        await result.current.register('test@example.com', 'Password123!', 'John Doe');
      });

      expect(authModule.signUp).toHaveBeenCalledWith({
        username: 'test@example.com',
        password: 'Password123!',
        options: {
          userAttributes: {
            email: 'test@example.com',
            name: 'John Doe',
          },
        },
      });
    });

    it('throws friendly error on duplicate user', async () => {
      vi.mocked(authModule.signUp).mockRejectedValue(
        Object.assign(new Error('User exists'), { name: 'UsernameExistsException' })
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => !result.current.isLoading);

      await expect(
        act(async () => {
          await result.current.register('existing@example.com', 'Password123!');
        })
      ).rejects.toThrow('An account with this email already exists');
    });
  });

  describe('confirmRegistration', () => {
    beforeEach(() => {
      vi.mocked(authModule.confirmSignUp).mockResolvedValue({
        isSignUpComplete: true,
        nextStep: { signUpStep: 'DONE' },
      } as never);
    });

    it('calls confirmSignUp with email and code', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => !result.current.isLoading);

      await act(async () => {
        await result.current.confirmRegistration('test@example.com', '123456');
      });

      expect(authModule.confirmSignUp).toHaveBeenCalledWith({
        username: 'test@example.com',
        confirmationCode: '123456',
      });
    });

    it('throws friendly error on invalid code', async () => {
      vi.mocked(authModule.confirmSignUp).mockRejectedValue(
        Object.assign(new Error('Invalid'), { name: 'CodeMismatchException' })
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => !result.current.isLoading);

      await expect(
        act(async () => {
          await result.current.confirmRegistration('test@example.com', '000000');
        })
      ).rejects.toThrow('Invalid verification code');
    });
  });

  describe('resendVerificationCode', () => {
    beforeEach(() => {
      vi.mocked(authModule.resendSignUpCode).mockResolvedValue({
        destination: 'test@example.com',
        deliveryMedium: 'EMAIL',
      } as never);
    });

    it('calls resendSignUpCode with email', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => !result.current.isLoading);

      await act(async () => {
        await result.current.resendVerificationCode('test@example.com');
      });

      expect(authModule.resendSignUpCode).toHaveBeenCalledWith({
        username: 'test@example.com',
      });
    });
  });

  describe('forgotPassword', () => {
    beforeEach(() => {
      vi.mocked(authModule.resetPassword).mockResolvedValue({
        isPasswordReset: false,
        nextStep: { resetPasswordStep: 'CONFIRM_RESET_PASSWORD_WITH_CODE' },
      } as never);
    });

    it('calls resetPassword with email', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => !result.current.isLoading);

      await act(async () => {
        await result.current.forgotPassword('test@example.com');
      });

      expect(authModule.resetPassword).toHaveBeenCalledWith({
        username: 'test@example.com',
      });
    });
  });

  describe('resetPasswordConfirm', () => {
    beforeEach(() => {
      vi.mocked(authModule.confirmResetPassword).mockResolvedValue(undefined as never);
    });

    it('calls confirmResetPassword with email, code, and password', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => !result.current.isLoading);

      await act(async () => {
        await result.current.resetPasswordConfirm('test@example.com', '123456', 'NewPassword123!');
      });

      expect(authModule.confirmResetPassword).toHaveBeenCalledWith({
        username: 'test@example.com',
        confirmationCode: '123456',
        newPassword: 'NewPassword123!',
      });
    });
  });

  describe('getAccessToken', () => {
    it('returns access token from session', async () => {
      vi.mocked(authModule.fetchAuthSession).mockResolvedValue({
        tokens: {
          accessToken: {
            toString: () => 'mock-access-token',
          },
        },
      } as never);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => !result.current.isLoading);

      let token: string | null = null;
      await act(async () => {
        token = await result.current.getAccessToken();
      });

      expect(token).toBe('mock-access-token');
    });

    it('returns null when no session', async () => {
      vi.mocked(authModule.fetchAuthSession).mockRejectedValue(new Error('No session'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => !result.current.isLoading);

      let token: string | null = 'initial';
      await act(async () => {
        token = await result.current.getAccessToken();
      });

      expect(token).toBe(null);
    });
  });

  describe('refreshSession', () => {
    it('calls fetchAuthSession with forceRefresh', async () => {
      vi.mocked(authModule.fetchAuthSession).mockResolvedValue({
        tokens: { accessToken: 'refreshed-token' },
      } as never);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => !result.current.isLoading);

      await act(async () => {
        await result.current.refreshSession();
      });

      expect(authModule.fetchAuthSession).toHaveBeenCalledWith({ forceRefresh: true });
    });
  });
});
