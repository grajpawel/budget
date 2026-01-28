import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Alert } from './Alert';

describe('Alert', () => {
  describe('rendering', () => {
    it('renders children', () => {
      render(<Alert>This is an alert message</Alert>);
      expect(screen.getByText('This is an alert message')).toBeInTheDocument();
    });

    it('renders with role="alert"', () => {
      render(<Alert>Alert content</Alert>);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('renders title when provided', () => {
      render(<Alert title="Alert Title">Alert content</Alert>);
      expect(screen.getByText('Alert Title')).toBeInTheDocument();
    });

    it('renders both title and children', () => {
      render(<Alert title="Title">Content</Alert>);
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('variants', () => {
    it('applies default variant', () => {
      render(<Alert>Default alert</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-background');
    });

    it('applies info variant', () => {
      render(<Alert variant="info">Info alert</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-blue-50');
    });

    it('applies success variant', () => {
      render(<Alert variant="success">Success alert</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-green-50');
    });

    it('applies warning variant', () => {
      render(<Alert variant="warning">Warning alert</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-yellow-50');
    });

    it('applies destructive variant', () => {
      render(<Alert variant="destructive">Error alert</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-destructive/10');
    });
  });

  describe('icons', () => {
    it('renders an icon', () => {
      render(<Alert>Alert with icon</Alert>);
      // Icons are rendered as SVGs
      const alert = screen.getByRole('alert');
      expect(alert.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('custom props', () => {
    it('accepts additional className', () => {
      render(<Alert className="custom-class">Custom alert</Alert>);
      expect(screen.getByRole('alert')).toHaveClass('custom-class');
    });

    it('passes through additional props', () => {
      render(<Alert data-testid="custom-alert">Alert</Alert>);
      expect(screen.getByTestId('custom-alert')).toBeInTheDocument();
    });
  });
});
