import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Fil d'Ariane"
      className={`flex items-center space-x-2 text-sm mb-6 ${className}`}
    >
      <Link
        to="/"
        className="flex items-center text-gray-600 hover:text-terracotta-600 transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta-500 focus:ring-offset-2 rounded px-2 py-1"
        aria-label="Retour à l'accueil"
      >
        <Home className="h-4 w-4" />
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={index} className="flex items-center space-x-2">
            <ChevronRight className="h-4 w-4 text-gray-400" aria-hidden="true" />
            {item.href && !isLast ? (
              <Link
                to={item.href}
                className="text-gray-600 hover:text-terracotta-600 transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta-500 focus:ring-offset-2 rounded px-2 py-1"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={`${
                  isLast
                    ? 'text-gray-900 font-semibold'
                    : 'text-gray-600'
                } px-2 py-1`}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
