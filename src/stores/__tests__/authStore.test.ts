import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from 'react-dom/test-utils';
import { useAuthStore } from '../authStore';

// Mock Supabase auth
const mockSupabaseAuth = {
  signUp: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
  updateUser: vi.fn(),
  onAuthStateChange: vi.fn(),
  resetPasswordForEmail: vi.fn()
};

const mockSupabase = {
  auth: mockSupabaseAuth
};

vi.mock('../lib/supabase', () => ({
  supabase: mockSupabase
}));

describe('Auth Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useAuthStore.getState().reset();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('Login', () => {
    it('should handle successful login', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' }
      };
      const mockSession = { user: mockUser };

      mockSupabaseAuth.signIn.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      });

      await act(async () => {
        await useAuthStore.getState().login('test@example.com', 'password');
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.session).toEqual(mockSession);
      expect(state.error).toBeNull();
      expect(mockSupabaseAuth.signIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password'
      });
    });

    it('should handle login errors', async () => {
      const mockError = new Error('Invalid credentials');
      mockSupabaseAuth.signIn.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError
      });

      await act(async () => {
        await useAuthStore.getState().login('test@example.com', 'wrong-password');
      });

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
      expect(state.error).toBe('Invalid credentials');
    });

    it('should handle network errors during login', async () => {
      mockSupabaseAuth.signIn.mockRejectedValue(new Error('Network error'));

      await act(async () => {
        await useAuthStore.getState().login('test@example.com', 'password');
      });

      const state = useAuthStore.getState();
      expect(state.error).toBe('Network error');
    });
  });

  describe('Registration', () => {
    it('should handle successful registration', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'new@example.com',
        user_metadata: { full_name: 'New User', user_type: 'locataire' }
      };
      const mockSession = { user: mockUser };

      mockSupabaseAuth.signUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      });

      await act(async () => {
        await useAuthStore.getState().register('new@example.com', 'password', 'New User', 'locataire');
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.session).toEqual(mockSession);
      expect(state.error).toBeNull();
      expect(mockSupabaseAuth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password',
        options: {
          data: {
            full_name: 'New User',
            user_type: 'locataire'
          }
        }
      });
    });

    it('should handle registration errors', async () => {
      const mockError = new Error('Email already exists');
      mockSupabaseAuth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError
      });

      await act(async () => {
        await useAuthStore.getState().register('existing@example.com', 'password', 'User', 'locataire');
      });

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
      expect(state.error).toBe('Email already exists');
    });
  });

  describe('Logout', () => {
    it('should handle successful logout', async () => {
      // First login
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSupabaseAuth.signIn.mockResolvedValue({
        data: { user: mockUser, session: { user: mockUser } },
        error: null
      });

      await act(async () => {
        await useAuthStore.getState().login('test@example.com', 'password');
      });

      // Then logout
      mockSupabaseAuth.signOut.mockResolvedValue({ error: null });

      await act(async () => {
        useAuthStore.getState().logout();
      });

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
      expect(state.error).toBeNull();
      expect(mockSupabaseAuth.signOut).toHaveBeenCalled();
    });

    it('should handle logout errors', async () => {
      const mockError = new Error('Logout failed');
      mockSupabaseAuth.signOut.mockResolvedValue({ error: mockError });

      await act(async () => {
        useAuthStore.getState().logout();
      });

      const state = useAuthStore.getState();
      expect(state.error).toBe('Logout failed');
    });
  });

  describe('Profile Update', () => {
    it('should handle successful profile update', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Updated Name' }
      };

      mockSupabaseAuth.updateUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      await act(async () => {
        await useAuthStore.getState().updateProfile({
          full_name: 'Updated Name',
          phone: '+2250712345678'
        });
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(mockSupabaseAuth.updateUser).toHaveBeenCalledWith({
        data: {
          full_name: 'Updated Name',
          phone: '+2250712345678'
        }
      });
    });

    it('should handle profile update errors', async () => {
      const mockError = new Error('Update failed');
      mockSupabaseAuth.updateUser.mockResolvedValue({
        data: { user: null },
        error: mockError
      });

      await act(async () => {
        await useAuthStore.getState().updateProfile({
          full_name: 'Test Name'
        });
      });

      const state = useAuthStore.getState();
      expect(state.error).toBe('Update failed');
    });
  });

  describe('Password Reset', () => {
    it('should handle successful password reset request', async () => {
      mockSupabaseAuth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null
      });

      await act(async () => {
        await useAuthStore.getState().resetPassword('test@example.com');
      });

      const state = useAuthStore.getState();
      expect(state.error).toBeNull();
      expect(mockSupabaseAuth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should handle password reset errors', async () => {
      const mockError = new Error('Email not found');
      mockSupabaseAuth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: mockError
      });

      await act(async () => {
        await useAuthStore.getState().resetPassword('nonexistent@example.com');
      });

      const state = useAuthStore.getState();
      expect(state.error).toBe('Email not found');
    });
  });

  describe('Loading States', () => {
    it('should set loading state during async operations', async () => {
      let resolveLogin: (value: any) => void;
      mockSupabaseAuth.signIn.mockImplementation(() => {
        return new Promise(resolve => {
          resolveLogin = resolve;
        });
      });

      const loginPromise = act(async () => {
        await useAuthStore.getState().login('test@example.com', 'password');
      });

      // Should be loading
      expect(useAuthStore.getState().loading).toBe(true);

      // Resolve login
      resolveLogin!({
        data: { user: { id: 'user-123' }, session: { user: { id: 'user-123' } } },
        error: null
      });

      await loginPromise;

      // Should not be loading anymore
      expect(useAuthStore.getState().loading).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should clear errors on successful operations', async () => {
      // Set an error first
      mockSupabaseAuth.signIn.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: new Error('First error')
      });

      await act(async () => {
        await useAuthStore.getState().login('test@example.com', 'wrong-password');
      });

      expect(useAuthStore.getState().error).toBe('First error');

      // Successful login should clear error
      mockSupabaseAuth.signIn.mockResolvedValueOnce({
        data: { user: { id: 'user-123' }, session: { user: { id: 'user-123' } } },
        error: null
      });

      await act(async () => {
        await useAuthStore.getState().login('test@example.com', 'correct-password');
      });

      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe('Session Management', () => {
    it('should initialize session on mount', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockSession = { user: mockUser };

      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      await act(async () => {
        await useAuthStore.getState().initialize();
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.session).toEqual(mockSession);
      expect(mockSupabaseAuth.getSession).toHaveBeenCalled();
    });

    it('should handle missing session on mount', async () => {
      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      });

      await act(async () => {
        await useAuthStore.getState().initialize();
      });

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
    });
  });
});