import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Input, Button, Alert } from '@/components/ui';
import { authMessages, validationMessages } from '@/config/branding';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

/** Password requirements for display */
const PASSWORD_REQUIREMENTS = [
  'At least 8 characters',
  'One uppercase letter',
  'One lowercase letter',
  'One number',
  'One special character (!@#$%^&*)',
];

/** Validate password meets requirements */
function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return validationMessages.password.minLength;
  }
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
    return validationMessages.password.requirements;
  }
  return null;
}

export function ResetPasswordPage() {
  const location = useLocation();
  const emailFromState = (location.state as { email?: string })?.email || '';

  const [email, setEmail] = useState(emailFromState);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { resetPasswordConfirm, forgotPassword } = useAuth();
  const navigate = useNavigate();
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Focus code input on mount if email is provided
  useEffect(() => {
    if (emailFromState && codeInputRef.current) {
      codeInputRef.current.focus();
    }
  }, [emailFromState]);

  function handleChange(field: string, value: string) {
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    switch (field) {
      case 'email':
        setEmail(value);
        break;
      case 'code':
        setCode(value.replace(/\D/g, '').slice(0, 6));
        break;
      case 'password':
        setPassword(value);
        break;
      case 'confirmPassword':
        setConfirmPassword(value);
        break;
    }
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = validationMessages.email.required;
    }

    if (!code || code.length !== 6) {
      newErrors.code = validationMessages.code.invalid;
    }

    if (!password) {
      newErrors.password = validationMessages.password.required;
    } else {
      const passwordError = validatePassword(password);
      if (passwordError) {
        newErrors.password = passwordError;
      }
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = validationMessages.confirmPassword.required;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = validationMessages.confirmPassword.mismatch;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGeneralError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await resetPasswordConfirm(email, code, password);
      setSuccess('Password reset successfully! Redirecting to login...');
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login', {
          state: { message: 'Password reset! Please sign in with your new password.' },
          replace: true
        });
      }, 1500);
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendCode() {
    if (!email) {
      setErrors({ email: validationMessages.email.required });
      return;
    }

    setIsLoading(true);
    setGeneralError('');
    setSuccess('');

    try {
      await forgotPassword(email);
      setSuccess('A new reset code has been sent to your email.');
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : 'Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout
      title={authMessages.resetPassword.title}
      subtitle={authMessages.resetPassword.subtitle}
      footer={
        <Link
          to="/login"
          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Icon */}
        <div className="flex justify-center mb-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
        </div>

        {generalError && <Alert variant="destructive">{generalError}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        {!emailFromState && (
          <Input
            label="Email"
            type="email"
            name="email"
            value={email}
            onChange={(e) => handleChange('email', e.target.value)}
            required
            placeholder="you@example.com"
            autoComplete="email"
            disabled={isLoading}
            error={errors.email}
          />
        )}

        <Input
          ref={codeInputRef}
          label="Reset code"
          type="text"
          name="code"
          value={code}
          onChange={(e) => handleChange('code', e.target.value)}
          required
          placeholder="000000"
          autoComplete="one-time-code"
          disabled={isLoading}
          error={errors.code}
          hint="Enter the 6-digit code from your email"
          className="text-center text-2xl tracking-widest"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
        />

        <div className="space-y-1">
          <Input
            label="New password"
            type="password"
            name="password"
            value={password}
            onChange={(e) => handleChange('password', e.target.value)}
            required
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={isLoading}
            error={errors.password}
          />
          {!errors.password && (
            <ul className="text-xs text-muted-foreground space-y-0.5 mt-2">
              {PASSWORD_REQUIREMENTS.map((req, index) => (
                <li key={index} className="flex items-center gap-1">
                  <span className="text-muted-foreground">•</span>
                  {req}
                </li>
              ))}
            </ul>
          )}
        </div>

        <Input
          label="Confirm new password"
          type="password"
          name="confirmPassword"
          value={confirmPassword}
          onChange={(e) => handleChange('confirmPassword', e.target.value)}
          required
          placeholder="••••••••"
          autoComplete="new-password"
          disabled={isLoading}
          error={errors.confirmPassword}
        />

        <Button
          type="submit"
          className="w-full"
          isLoading={isLoading}
          loadingText="Resetting password..."
        >
          Reset password
        </Button>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Didn't receive the code?{' '}
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isLoading || !email}
              className="font-medium text-primary hover:underline disabled:opacity-50 disabled:no-underline"
            >
              Resend code
            </button>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
