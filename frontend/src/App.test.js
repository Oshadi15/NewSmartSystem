import { render, screen } from '@testing-library/react';
import App from './App';

test('renders open tickets page link', () => {
  render(<App />);
  const linkElement = screen.getByText(/open tickets page/i);
  expect(linkElement).toBeInTheDocument();
});
