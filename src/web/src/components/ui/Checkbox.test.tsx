import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  describe('rendering', () => {
    it('renders checkbox input', () => {
      render(<Checkbox name="terms" />);
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('renders with label', () => {
      render(<Checkbox name="terms" label="Accept terms" />);
      expect(screen.getByLabelText('Accept terms')).toBeInTheDocument();
    });

    it('renders without label', () => {
      render(<Checkbox name="terms" />);
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
      expect(screen.queryByRole('label')).not.toBeInTheDocument();
    });
  });

  describe('id handling', () => {
    it('uses provided id', () => {
      render(<Checkbox id="custom-id" name="terms" label="Accept" />);
      expect(screen.getByRole('checkbox')).toHaveAttribute('id', 'custom-id');
    });

    it('uses name as id when id is not provided', () => {
      render(<Checkbox name="terms" label="Accept" />);
      expect(screen.getByRole('checkbox')).toHaveAttribute('id', 'terms');
    });
  });

  describe('checked state', () => {
    it('can be checked by default', () => {
      render(<Checkbox name="terms" defaultChecked />);
      expect(screen.getByRole('checkbox')).toBeChecked();
    });

    it('can be unchecked by default', () => {
      render(<Checkbox name="terms" />);
      expect(screen.getByRole('checkbox')).not.toBeChecked();
    });

    it('can be controlled', () => {
      render(<Checkbox name="terms" checked onChange={() => {}} />);
      expect(screen.getByRole('checkbox')).toBeChecked();
    });
  });

  describe('interactions', () => {
    it('calls onChange when clicked', () => {
      const handleChange = vi.fn();
      render(<Checkbox name="terms" onChange={handleChange} />);

      fireEvent.click(screen.getByRole('checkbox'));
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('toggles checked state on click', () => {
      render(<Checkbox name="terms" />);
      const checkbox = screen.getByRole('checkbox');

      expect(checkbox).not.toBeChecked();
      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();
      fireEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it('can be toggled by clicking label', () => {
      render(<Checkbox name="terms" label="Accept terms" />);
      const label = screen.getByText('Accept terms');
      const checkbox = screen.getByRole('checkbox');

      expect(checkbox).not.toBeChecked();
      fireEvent.click(label);
      expect(checkbox).toBeChecked();
    });
  });

  describe('disabled state', () => {
    it('can be disabled', () => {
      render(<Checkbox name="terms" disabled />);
      expect(screen.getByRole('checkbox')).toBeDisabled();
    });

    it('applies disabled styling', () => {
      render(<Checkbox name="terms" disabled />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass('disabled:cursor-not-allowed');
      expect(checkbox).toHaveClass('disabled:opacity-50');
    });
  });

  describe('custom props', () => {
    it('accepts additional className', () => {
      render(<Checkbox name="terms" className="custom-class" />);
      expect(screen.getByRole('checkbox')).toHaveClass('custom-class');
    });

    it('forwards ref', () => {
      const ref = vi.fn();
      render(<Checkbox name="terms" ref={ref} />);
      expect(ref).toHaveBeenCalled();
    });
  });
});
