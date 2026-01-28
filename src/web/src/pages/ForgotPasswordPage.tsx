import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Input, Button, Alert } from '@/components/ui';
import { authMessages, validationMessages } from '@/config/branding';
import { KeyRound, ArrowLeft } from 'lucide-react';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email) {
      setError(validationMessages.email.required);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(validationMessages.email.invalid);
      return;
    }

    setIsLoading(true);

    try {
      await forgotPassword(email);
      // Navigate to reset password page with email
      navigate('/reset-password', { state: { email } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset code');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout
      title={authMessages.forgotPassword.title}
      subtitle={authMessages.forgotPassword.subtitle}
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
            <KeyRound className="h-8 w-8 text-primary" />
          </div>
        </div>

        {error && <Alert variant="destructive">{error}</Alert>}

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
          hint="Enter the email address associated with your account"
        />

        <Button
          type="submit"
          className="w-full"
          isLoading={isLoading}
          loadingText="Sending..."
        >
          Send reset code
        </Button>
      </form>
    </AuthLayout>
  );
}
