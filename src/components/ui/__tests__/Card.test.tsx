import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Card } from '../Card';

describe('Card Component', () => {
  const mockChildren = <div>Card Content</div>;

  it('renders with default props', () => {
    render(<Card>{mockChildren}</Card>);

    const card = screen.getByText('Card Content').parentElement;
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('card');
  });

  it('renders with different variants', () => {
    const { rerender } = render(
      <Card variant="elevated">{mockChildren}</Card>
    );

    let card = screen.getByText('Card Content').parentElement;
    expect(card).toHaveClass('card-elevated');

    rerender(<Card variant="outlined">{mockChildren}</Card>);
    card = screen.getByText('Card Content').parentElement;
    expect(card).toHaveClass('card-outlined');

    rerender(<Card variant="filled">{mockChildren}</Card>);
    card = screen.getByText('Card Content').parentElement;
    expect(card).toHaveClass('card-filled');
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<Card size="sm">{mockChildren}</Card>);

    let card = screen.getByText('Card Content').parentElement;
    expect(card).toHaveClass('card-sm');

    rerender(<Card size="lg">{mockChildren}</Card>);
    card = screen.getByText('Card Content').parentElement;
    expect(card).toHaveClass('card-lg');
  });

  it('renders with title and subtitle', () => {
    render(
      <Card title="Card Title" subtitle="Card Subtitle">
        {mockChildren}
      </Card>
    );

    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Subtitle')).toBeInTheDocument();
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('renders with header actions', () => {
    const Actions = () => <button data-testid="header-action">Action</button>;

    render(
      <Card title="Card Title" headerActions={<Actions />}>
        {mockChildren}
      </Card>
    );

    expect(screen.getByTestId('header-action')).toBeInTheDocument();
  });

  it('renders with footer', () => {
    const Footer = () => <div data-testid="card-footer">Footer Content</div>;

    render(
      <Card footer={<Footer />}>
        {mockChildren}
      </Card>
    );

    expect(screen.getByTestId('card-footer')).toBeInTheDocument();
  });

  it('renders with image', () => {
    render(
      <Card
        image="https://example.com/image.jpg"
        imageAlt="Card image"
        title="Card Title"
      >
        {mockChildren}
      </Card>
    );

    const image = screen.getByAltText('Card image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Card onClick={handleClick}>{mockChildren}</Card>);

    const card = screen.getByText('Card Content').parentElement;
    fireEvent.click(card!);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', () => {
    const handleClick = vi.fn();
    render(
      <Card disabled onClick={handleClick}>
        {mockChildren}
      </Card>
    );

    const card = screen.getByText('Card Content').parentElement;
    expect(card).toHaveClass('card-disabled');

    fireEvent.click(card!);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders with hover effect', () => {
    render(
      <Card hoverable title="Hoverable Card">
        {mockChildren}
      </Card>
    );

    const card = screen.getByText('Hoverable Card').parentElement;
    expect(card).toHaveClass('card-hoverable');
  });

  it('accepts custom className', () => {
    render(
      <Card className="custom-card-class">{mockChildren}</Card>
    );

    const card = screen.getByText('Card Content').parentElement;
    expect(card).toHaveClass('custom-card-class');
    expect(card).toHaveClass('card'); // Should also have default classes
  });

  it('renders with loading state', () => {
    render(
      <Card loading title="Loading Card">
        {mockChildren}
      </Card>
    );

    expect(screen.getByText('Loading Card')).toBeInTheDocument();
    // Check for loading spinner or skeleton
    expect(document.querySelector('.card-loading')).toBeInTheDocument();
  });

  it('handles keyboard navigation when clickable', () => {
    const handleClick = vi.fn();
    render(<Card onClick={handleClick}>{mockChildren}</Card>);

    const card = screen.getByText('Card Content').parentElement;

    // Enter key
    fireEvent.keyDown(card!, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalledTimes(1);

    // Space key
    fireEvent.keyDown(card!, { key: ' ' });
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it('has proper accessibility attributes', () => {
    render(
      <Card
        role="article"
        aria-labelledby="card-title"
        title="Accessible Card"
      >
        {mockChildren}
      </Card>
    );

    const card = screen.getByText('Accessible Card').closest('[role="article"]');
    expect(card).toBeInTheDocument();
    expect(card).toHaveAttribute('aria-labelledby', 'card-title');
  });

  it('supports long content with scroll', () => {
    const longContent = (
      <div style={{ height: '1000px' }}>
        {Array.from({ length: 100 }, (_, i) => (
          <p key={i}>Content line {i}</p>
        ))}
      </div>
    );

    render(
      <Card scrollable title="Scrollable Card">
        {longContent}
      </Card>
    );

    const card = screen.getByText('Scrollable Card').parentElement;
    expect(card).toHaveClass('card-scrollable');
  });

  it('renders with custom padding', () => {
    const { rerender } = render(
      <Card padding="none">{mockChildren}</Card>
    );

    let card = screen.getByText('Card Content').parentElement;
    expect(card).toHaveClass('card-padding-none');

    rerender(<Card padding="sm">{mockChildren}</Card>);
    card = screen.getByText('Card Content').parentElement;
    expect(card).toHaveClass('card-padding-sm');

    rerender(<Card padding="lg">{mockChildren}</Card>);
    card = screen.getByText('Card Content').parentElement;
    expect(card).toHaveClass('card-padding-lg');
  });

  it('handles mouse enter and leave events', () => {
    const handleMouseEnter = vi.fn();
    const handleMouseLeave = vi.fn();

    render(
      <Card
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        hoverable
      >
        {mockChildren}
      </Card>
    );

    const card = screen.getByText('Card Content').parentElement;

    fireEvent.mouseEnter(card!);
    expect(handleMouseEnter).toHaveBeenCalledTimes(1);

    fireEvent.mouseLeave(card!);
    expect(handleMouseLeave).toHaveBeenCalledTimes(1);
  });

  it('renders with badge in header', () => {
    render(
      <Card
        title="Card with Badge"
        badge={{ text: 'New', variant: 'primary' }}
      >
        {mockChildren}
      </Card>
    );

    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('renders with divider', () => {
    render(
      <Card title="Card with Divider" divider>
        {mockChildren}
      </Card>
    );

    const divider = document.querySelector('.card-divider');
    expect(divider).toBeInTheDocument();
  });
});