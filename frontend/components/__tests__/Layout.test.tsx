import { render, screen } from '@testing-library/react';
import Layout from '../Layout';

// Mock the AuthContext
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
    loading: false,
  }),
}));

// Mock the SocketContext
jest.mock('../../contexts/SocketContext', () => ({
  useSocket: () => ({
    socket: null,
    connected: false,
    connect: jest.fn(),
    disconnect: jest.fn(),
  }),
}));

describe('Layout Component', () => {
  it('renders without crashing', () => {
    render(
      <Layout>
        <div>Test content</div>
      </Layout>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders navigation elements', () => {
    render(
      <Layout>
        <div>Test content</div>
      </Layout>
    );
    
    // Check if navigation elements are present
    expect(screen.getByText('CRM Dashboard')).toBeInTheDocument();
  });
});
