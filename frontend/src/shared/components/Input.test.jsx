/**
 * Input Component Tests
 * Tests for the reusable Input component
 */

import { render, screen } from '@testing-library/react';
import Input from './Input';

describe('Input Component', () => {
  it('renders label when provided', () => {
    render(<Input label="Email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('does not render label when not provided', () => {
    render(<Input />);
    expect(screen.queryByText('Email')).not.toBeInTheDocument();
  });

  it('renders input element', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('applies error styling when error is provided', () => {
    render(<Input error="Required field" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-red-500');
  });

  it('displays error message when error is provided', () => {
    render(<Input error="Required field" />);
    expect(screen.getByText('Required field')).toBeInTheDocument();
  });

  it('does not display error message when no error', () => {
    render(<Input />);
    expect(screen.queryByText('Required field')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Input className="custom-class" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-class');
  });

  it('passes through other props to input', () => {
    render(<Input placeholder="Enter email" type="email" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('placeholder', 'Enter email');
    expect(input).toHaveAttribute('type', 'email');
  });
});
