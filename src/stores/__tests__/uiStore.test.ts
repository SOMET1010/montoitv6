import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../uiStore';

describe('UI Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useUIStore.getState().reset();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useUIStore.getState();

      expect(state.sidebarOpen).toBe(false);
      expect(state.searchOpen).toBe(false);
      expect(state.notificationsOpen).toBe(false);
      expect(state.userMenuOpen).toBe(false);
      expect(state.theme).toBe('light');
      expect(state.language).toBe('fr');
      expect(state.modals).toEqual({});
      expect(state.toasts).toEqual([]);
      expect(state.loading).toEqual({});
      expect(state.errors).toEqual({});
    });
  });

  describe('Sidebar Management', () => {
    it('should toggle sidebar', () => {
      const { toggleSidebar } = useUIStore.getState();

      // Initially closed
      expect(useUIStore.getState().sidebarOpen).toBe(false);

      toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(true);

      toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(false);
    });

    it('should open sidebar explicitly', () => {
      const { openSidebar } = useUIStore.getState();

      openSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(true);
    });

    it('should close sidebar explicitly', () => {
      const { closeSidebar, openSidebar } = useUIStore.getState();

      openSidebar();
      closeSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(false);
    });
  });

  describe('Search Management', () => {
    it('should toggle search', () => {
      const { toggleSearch } = useUIStore.getState();

      expect(useUIStore.getState().searchOpen).toBe(false);

      toggleSearch();
      expect(useUIStore.getState().searchOpen).toBe(true);

      toggleSearch();
      expect(useUIStore.getState().searchOpen).toBe(false);
    });

    it('should open and close search explicitly', () => {
      const { openSearch, closeSearch } = useUIStore.getState();

      openSearch();
      expect(useUIStore.getState().searchOpen).toBe(true);

      closeSearch();
      expect(useUIStore.getState().searchOpen).toBe(false);
    });
  });

  describe('Notifications Management', () => {
    it('should toggle notifications', () => {
      const { toggleNotifications } = useUIStore.getState();

      expect(useUIStore.getState().notificationsOpen).toBe(false);

      toggleNotifications();
      expect(useUIStore.getState().notificationsOpen).toBe(true);

      toggleNotifications();
      expect(useUIStore.getState().notificationsOpen).toBe(false);
    });
  });

  describe('User Menu Management', () => {
    it('should toggle user menu', () => {
      const { toggleUserMenu } = useUIStore.getState();

      expect(useUIStore.getState().userMenuOpen).toBe(false);

      toggleUserMenu();
      expect(useUIStore.getState().userMenuOpen).toBe(true);

      toggleUserMenu();
      expect(useUIStore.getState().userMenuOpen).toBe(false);
    });
  });

  describe('Theme Management', () => {
    it('should toggle theme between light and dark', () => {
      const { toggleTheme } = useUIStore.getState();

      expect(useUIStore.getState().theme).toBe('light');

      toggleTheme();
      expect(useUIStore.getState().theme).toBe('dark');

      toggleTheme();
      expect(useUIStore.getState().theme).toBe('light');
    });

    it('should set theme explicitly', () => {
      const { setTheme } = useUIStore.getState();

      setTheme('dark');
      expect(useUIStore.getState().theme).toBe('dark');

      setTheme('light');
      expect(useUIStore.getState().theme).toBe('light');
    });
  });

  describe('Language Management', () => {
    it('should set language', () => {
      const { setLanguage } = useUIStore.getState();

      expect(useUIStore.getState().language).toBe('fr');

      setLanguage('en');
      expect(useUIStore.getState().language).toBe('en');

      setLanguage('fr');
      expect(useUIStore.getState().language).toBe('fr');
    });

    it('should handle unsupported languages gracefully', () => {
      const { setLanguage } = useUIStore.getState();

      // @ts-ignore - Testing invalid input
      setLanguage('invalid');
      // Should keep previous language or default to 'fr'
      expect(['fr', 'en']).toContain(useUIStore.getState().language);
    });
  });

  describe('Modal Management', () => {
    it('should open modal with data', () => {
      const { openModal } = useUIStore.getState();
      const modalData = { title: 'Test Modal', content: 'Test content' };

      openModal('testModal', modalData);

      const modals = useUIStore.getState().modals;
      expect(modals.testModal).toEqual({
        isOpen: true,
        id: 'testModal',
        data: modalData
      });
    });

    it('should open modal without data', () => {
      const { openModal } = useUIStore.getState();

      openModal('simpleModal');

      const modals = useUIStore.getState().modals;
      expect(modals.simpleModal).toEqual({
        isOpen: true,
        id: 'simpleModal',
        data: undefined
      });
    });

    it('should close modal', () => {
      const { openModal, closeModal } = useUIStore.getState();

      openModal('testModal', { test: 'data' });
      expect(useUIStore.getState().modals.testModal.isOpen).toBe(true);

      closeModal('testModal');
      expect(useUIStore.getState().modals.testModal.isOpen).toBe(false);
    });

    it('should close all modals', () => {
      const { openModal, closeAllModals } = useUIStore.getState();

      openModal('modal1');
      openModal('modal2');
      openModal('modal3');

      expect(Object.keys(useUIStore.getState().modals)).toHaveLength(3);

      closeAllModals();

      const modals = useUIStore.getState().modals;
      Object.values(modals).forEach(modal => {
        expect(modal.isOpen).toBe(false);
      });
    });

    it('should handle closing non-existent modal gracefully', () => {
      const { closeModal } = useUIStore.getState();

      expect(() => closeModal('nonexistent')).not.toThrow();
    });
  });

  describe('Toast Management', () => {
    it('should add success toast', () => {
      const { addToast } = useUIStore.getState();

      addToast('Success message', 'success');

      const toasts = useUIStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0]).toMatchObject({
        id: expect.any(String),
        message: 'Success message',
        type: 'success',
        duration: 5000
      });
      expect(toasts[0].timestamp).toBeInstanceOf(Date);
    });

    it('should add error toast', () => {
      const { addToast } = useUIStore.getState();

      addToast('Error message', 'error', 10000);

      const toasts = useUIStore.getState().toasts;
      expect(toasts[0]).toMatchObject({
        message: 'Error message',
        type: 'error',
        duration: 10000
      });
    });

    it('should add info toast with default duration', () => {
      const { addToast } = useUIStore.getState();

      addToast('Info message', 'info');

      const toasts = useUIStore.getState().toasts;
      expect(toasts[0]).toMatchObject({
        message: 'Info message',
        type: 'info',
        duration: 5000
      });
    });

    it('should remove toast by ID', () => {
      const { addToast, removeToast } = useUIStore.getState();

      addToast('Test message', 'info');
      const toastId = useUIStore.getState().toasts[0].id;

      removeToast(toastId);

      const toasts = useUIStore.getState().toasts;
      expect(toasts).toHaveLength(0);
    });

    it('should clear all toasts', () => {
      const { addToast, clearToasts } = useUIStore.getState();

      addToast('Message 1', 'info');
      addToast('Message 2', 'success');
      addToast('Message 3', 'error');

      expect(useUIStore.getState().toasts).toHaveLength(3);

      clearToasts();

      expect(useUIStore.getState().toasts).toHaveLength(0);
    });

    it('should handle removing non-existent toast gracefully', () => {
      const { removeToast } = useUIStore.getState();

      expect(() => removeToast('nonexistent-id')).not.toThrow();
    });
  });

  describe('Loading State Management', () => {
    it('should set loading state', () => {
      const { setLoading } = useUIStore.getState();

      setLoading('apiCall', true);

      expect(useUIStore.getState().loading.apiCall).toBe(true);
    });

    it('should unset loading state', () => {
      const { setLoading } = useUIStore.getState();

      setLoading('apiCall', true);
      setLoading('apiCall', false);

      expect(useUIStore.getState().loading.apiCall).toBe(false);
    });

    it('should handle multiple loading states', () => {
      const { setLoading } = useUIStore.getState();

      setLoading('upload', true);
      setLoading('apiCall', true);

      expect(useUIStore.getState().loading.upload).toBe(true);
      expect(useUIStore.getState().loading.apiCall).toBe(true);

      setLoading('upload', false);

      expect(useUIStore.getState().loading.upload).toBe(false);
      expect(useUIStore.getState().loading.apiCall).toBe(true);
    });
  });

  describe('Error State Management', () => {
    it('should set error state', () => {
      const { setError } = useUIStore.getState();
      const error = new Error('Test error');

      setError('apiCall', error);

      expect(useUIStore.getState().errors.apiCall).toBe(error);
    });

    it('should clear error state', () => {
      const { setError, clearError } = useUIStore.getState();
      const error = new Error('Test error');

      setError('apiCall', error);
      clearError('apiCall');

      expect(useUIStore.getState().errors.apiCall).toBeNull();
    });

    it('should clear all errors', () => {
      const { setError, clearAllErrors } = useUIStore.getState();

      setError('apiCall', new Error('API Error'));
      setError('upload', new Error('Upload Error'));
      setError('validation', new Error('Validation Error'));

      expect(Object.keys(useUIStore.getState().errors)).toHaveLength(3);

      clearAllErrors();

      expect(Object.keys(useUIStore.getState().errors)).toHaveLength(0);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset to initial state', () => {
      const {
        openSidebar,
        openModal,
        addToast,
        setLoading,
        setError,
        setTheme,
        reset
      } = useUIStore.getState();

      // Change state
      openSidebar();
      openModal('testModal', { test: 'data' });
      addToast('Test message', 'info');
      setLoading('test', true);
      setError('test', new Error('Test error'));
      setTheme('dark');

      // Verify state is changed
      expect(useUIStore.getState().sidebarOpen).toBe(true);
      expect(Object.keys(useUIStore.getState().modals)).toHaveLength(1);
      expect(useUIStore.getState().toasts).toHaveLength(1);
      expect(Object.keys(useUIStore.getState().loading)).toHaveLength(1);
      expect(Object.keys(useUIStore.getState().errors)).toHaveLength(1);
      expect(useUIStore.getState().theme).toBe('dark');

      // Reset
      reset();

      // Verify reset to initial state
      const state = useUIStore.getState();
      expect(state.sidebarOpen).toBe(false);
      expect(state.searchOpen).toBe(false);
      expect(state.notificationsOpen).toBe(false);
      expect(state.userMenuOpen).toBe(false);
      expect(state.theme).toBe('light');
      expect(state.language).toBe('fr');
      expect(state.modals).toEqual({});
      expect(state.toasts).toEqual([]);
      expect(state.loading).toEqual({});
      expect(state.errors).toEqual({});
    });
  });
});