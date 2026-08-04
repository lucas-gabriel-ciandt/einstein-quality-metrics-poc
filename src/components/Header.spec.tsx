import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Header from '@/components/Header';

describe('Header', () => {
  it('renders the Einstein logo', () => {
    render(<Header />);
    expect(screen.getByAltText(/einstein/i)).toBeInTheDocument();
  });

  it('renders the CI&T logo', () => {
    render(<Header />);
    expect(screen.getByAltText(/ci&?t/i)).toBeInTheDocument();
  });
});
