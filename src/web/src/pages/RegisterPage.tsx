import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Input, Button, Alert } from '@/components/ui';
import { authMessages, validationMessages } from '@/config/branding';

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

export function RegisterPage() {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = validationMessages.email.required;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = validationMessages.email.invalid;
    }

    if (!formData.password) {
      newErrors.password = validationMessages.password.required;
    } else {
      const passwordError = validatePassword(formData.password);
      if (passwordError) {
        newErrors.password = passwordError;
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = validationMessages.confirmPassword.required;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = validationMessages.confirmPassword.mismatch;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGeneralError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await register(formData.email, formData.password, formData.displayName || undefined);
      // Navigate to verification page with email
      navigate('/verify', { state: { email: formData.email } });
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout
      title={authMessages.register.title}
      subtitle={authMessages.register.subtitle}
      footer={
        <p>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {generalError && (
          <Alert variant="destructive">{generalError}</Alert>
        )}

        <Input
          label="Display name (optional)"
          type="text"
          name="displayName"
          value={formData.displayName}
          onChange={handleChange}
          placeholder="John Doe"
          autoComplete="name"
          disabled={isLoading}
        />

        <Input
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          placeholder="you@example.com"
          autoComplete="email"
          disabled={isLoading}
          error={errors.email}
        />

        <div className="space-y-1">
          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
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
          label="Confirm password"
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
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
          loadingText="Creating account..."
        >
          Create account
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          By creating an account, you agree to our{' '}
          <Link to="/terms" className="underline hover:text-foreground">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
