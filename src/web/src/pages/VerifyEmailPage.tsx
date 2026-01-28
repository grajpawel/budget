import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Input, Button, Alert } from '@/components/ui';
import { authMessages, validationMessages } from '@/config/branding';
import { Mail, ArrowLeft } from 'lucide-react';

export function VerifyEmailPage() {
  const location = useLocation();
  const emailFromState = (location.state as { email?: string })?.email || '';

  const [email, setEmail] = useState(emailFromState);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const { confirmRegistration, resendVerificationCode } = useAuth();
  const navigate = useNavigate();
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Focus code input on mount if email is provided
  useEffect(() => {
    if (emailFromState && codeInputRef.current) {
      codeInputRef.current.focus();
    }
  }, [emailFromState]);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError(validationMessages.email.required);
      return;
    }

    if (!code || code.length !== 6) {
      setError(validationMessages.code.invalid);
      return;
    }

    setIsLoading(true);

    try {
      await confirmRegistration(email, code);
      setSuccess('Email verified successfully! Redirecting to login...');
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login', {
          state: { message: 'Email verified! Please sign in.' },
          replace: true
        });
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify email');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendCode() {
    if (!email) {
      setError(validationMessages.email.required);
      return;
    }

    setIsResending(true);
    setError('');
    setSuccess('');

    try {
      await resendVerificationCode(email);
      setSuccess('Verification code sent! Check your email.');
      setResendCooldown(60); // 60 second cooldown
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  }

  // Format code input - only allow digits
  function handleCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
  }

  return (
    <AuthLayout
      title={authMessages.verify.title}
      subtitle={email ? `We sent a code to ${email}` : authMessages.verify.subtitle}
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
            <Mail className="h-8 w-8 text-primary" />
          </div>
        </div>

        {error && <Alert variant="destructive">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        {!emailFromState && (
          <Input
            label="Email"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            autoComplete="email"
            disabled={isLoading}
          />
        )}

        <Input
          ref={codeInputRef}
          label="Verification code"
          type="text"
          name="code"
          value={code}
          onChange={handleCodeChange}
          required
          placeholder="000000"
          autoComplete="one-time-code"
          disabled={isLoading}
          hint="Enter the 6-digit code from your email"
          className="text-center text-2xl tracking-widest"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
        />

        <Button
          type="submit"
          className="w-full"
          isLoading={isLoading}
          loadingText="Verifying..."
          disabled={code.length !== 6}
        >
          Verify email
        </Button>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Didn't receive the code?{' '}
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isResending || resendCooldown > 0 || !email}
              className="font-medium text-primary hover:underline disabled:opacity-50 disabled:no-underline"
            >
              {isResending
                ? 'Sending...'
                : resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : 'Resend code'}
            </button>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
