// src/components/DashboardLayout.tsx
import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Menu,
  X,
  Home,
  Box,
  ClipboardList,
  ShoppingCart,
  Repeat,
} from 'lucide-react';

interface Section {
  name: string;
  path: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const sections: Section[] = [
  { name: 'Dashboard', path: '/dashboard', Icon: Home },
  { name: 'Assets', path: '/dashboard/assets', Icon: Box },
  { name: 'Assignments', path: '/dashboard/assignments', Icon: ClipboardList },
  { name: 'Purchases', path: '/dashboard/purchases', Icon: ShoppingCart },
  { name: 'Transfers', path: '/dashboard/transfers', Icon: Repeat },
];

export default function DashboardLayout() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
        className="fixed top-4 left-4 z-30 p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition"
      >
        {isOpen ? <X className="h-6 w-6 text-indigo-600" /> : <Menu className="h-6 w-6 text-indigo-600" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`bg-white shadow-xl border-r border-gray-200 flex flex-col transition-width duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b border-gray-100">
          <span className="text-indigo-600 ml-8 mt-2 text-2xl font-bold">{isOpen ? 'Logistics Hub' : ''}</span>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {sections.map(({ name, path, Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/dashboard'}
              className={({ isActive }) =>
                `group flex items-center h-12 px-3 rounded-md transition-colors hover:bg-indigo-50 ${
                  isActive ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600'
                }`
              }
              title={name}
            >
              <Icon className="h-6 w-6" />
              {isOpen && <span className="ml-3 text-base font-medium">{name}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer (optional) */}
        <div className="p-4 border-t border-gray-100">
          {isOpen ? (
            <p className="text-xs text-gray-400">© 2025 Logistics Co.</p>
          ) : (
            <p className="sr-only">© 2025 Logistics Co.</p>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 bg-gray-50 p-6 transition-margin duration-300 ease-in-out ${
          isOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
}
