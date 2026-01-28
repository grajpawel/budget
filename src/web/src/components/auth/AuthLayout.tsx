import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { branding } from '@/config/branding';
import { Wallet } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
}

/**
 * AuthLayout - Shared layout for all authentication pages
 *
 * Provides consistent branding and layout for login, register,
 * forgot password, and other auth-related pages.
 */
export function AuthLayout({ children, title, subtitle, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Main content */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and branding */}
          <div className="flex flex-col items-center text-center">
            <Link to="/" className="flex items-center gap-2 mb-4">
              {branding.logo.src ? (
                <img
                  src={branding.logo.src}
                  alt={branding.logo.alt}
                  width={branding.logo.width}
                  height={branding.logo.height}
                  className="h-12 w-auto"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Wallet className="h-6 w-6" />
                </div>
              )}
              <span className="text-2xl font-bold text-foreground">
                {branding.appName}
              </span>
            </Link>

            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-sm text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>

          {/* Form content */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">
            {children}
          </div>

          {/* Footer links */}
          {footer && (
            <div className="text-center text-sm text-muted-foreground">
              {footer}
            </div>
          )}
        </div>
      </div>

      {/* Bottom footer */}
      <footer className="py-4 text-center text-sm text-muted-foreground">
        <p>
          &copy; {new Date().getFullYear()} {branding.company.name}. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
