/**
 * Branding Configuration
 *
 * Centralized configuration for app branding. Update this file to customize
 * the look and feel of your application.
 */

export const branding = {
  /** Application name displayed throughout the app */
  appName: 'Budget App',

  /** Tagline shown on auth pages */
  tagline: 'Take control of your finances',

  /** Short description for auth pages */
  description: 'Track expenses, set budgets, and achieve your financial goals.',

  /** Logo configuration */
  logo: {
    /** Path to logo image (relative to public folder) or null for text-only */
    src: null as string | null,
    /** Alt text for logo image */
    alt: 'Budget App Logo',
    /** Width of logo in pixels */
    width: 48,
    /** Height of logo in pixels */
    height: 48,
  },

  /** Company/developer info shown in footer */
  company: {
    name: 'Budget App',
    url: 'https://budgetapp.example.com',
  },

  /** Support links */
  support: {
    email: 'support@budgetapp.example.com',
    helpUrl: '/help',
  },

  /** Social links (null to hide) */
  social: {
    twitter: null as string | null,
    github: null as string | null,
  },
} as const;

/** Auth page specific messages */
export const authMessages = {
  login: {
    title: 'Welcome back',
    subtitle: 'Sign in to your account to continue',
  },
  register: {
    title: 'Create an account',
    subtitle: 'Start your journey to financial freedom',
  },
  verify: {
    title: 'Verify your email',
    subtitle: 'We sent a verification code to your email',
  },
  forgotPassword: {
    title: 'Forgot password?',
    subtitle: "No worries, we'll send you reset instructions",
  },
  resetPassword: {
    title: 'Set new password',
    subtitle: 'Your new password must be different from previous passwords',
  },
} as const;

/** Validation messages */
export const validationMessages = {
  email: {
    required: 'Email is required',
    invalid: 'Please enter a valid email address',
  },
  password: {
    required: 'Password is required',
    minLength: 'Password must be at least 8 characters',
    requirements: 'Password must contain uppercase, lowercase, number, and special character',
  },
  confirmPassword: {
    required: 'Please confirm your password',
    mismatch: 'Passwords do not match',
  },
  code: {
    required: 'Verification code is required',
    invalid: 'Please enter a valid 6-digit code',
  },
} as const;
