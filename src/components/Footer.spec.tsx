import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Footer from '@/components/Footer';

describe('Footer', () => {
  it('renders the CI&T logo', () => {
    render(<Footer />);
    expect(screen.getByAltText(/ci&?t/i)).toBeInTheDocument();
  });
});
