/**
 * UI Component Library
 * Export all reusable UI components from here
 */

// Core UI components
export { default as Button } from './Button';
export type { ButtonProps } from './Button';

export { default as Input } from './Input';
export type { InputProps } from './Input';

export { Card, CardHeader, CardBody, CardFooter } from './Card';
export type { CardProps, CardHeaderProps, CardBodyProps, CardFooterProps } from './Card';

export { default as Modal, ConfirmModal } from './Modal';
export type { ModalProps, ConfirmModalProps } from './Modal';

// Layout components
export { default as Footer } from './Footer';
export { default as Header } from './Header';
export { default as Layout } from './Layout';
export { default as SEOHead } from './SEOHead';

// Error handling components
export { default as ErrorBoundary } from './ErrorBoundary';
export { default as RouterErrorBoundary } from './RouterErrorBoundary';

// Utility components
export { default as LanguageSelector } from './LanguageSelector';
export { default as RoleSwitcher } from './RoleSwitcher';
export { default as LazyImage } from './LazyImage';
