import { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import RealtimeNotifications from './RealtimeNotifications';
import RealtimeActivityStream from './RealtimeActivityStream';
import ConnectionStatus from './ConnectionStatus';
import OnlineUsers from './OnlineUsers';
import MobileRealtimeStatus from './MobileRealtimeStatus';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: '📊' },
    { name: 'Leads', href: '/leads', icon: '👥' },
    { name: 'Activities', href: '/activities', icon: '📝' },
    { name: 'Users', href: '/users', icon: '👤', adminOnly: true },
  ];

  const isCurrentPath = (path: string) => {
    // Handle exact matches
    if (router.pathname === path) {
      return true;
    }
    
    // Handle dynamic routes - check if current path starts with the navigation path
    // This ensures /leads/[id] matches /leads
    if (path !== '/' && router.pathname.startsWith(path + '/')) {
      return true;
    }
    
    return false;
  };

  return (
    <>
      <Head>
        <title>Mohan Mutha Exports CRM</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Mohan Mutha Exports Pvt. Ltd. - Customer Relationship Management System" />
      </Head>
      
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="mobile-sidebar-overlay lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`mobile-sidebar bg-white shadow-xl lg:hidden ${
          sidebarOpen ? 'open' : ''
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center flex-1 min-w-0">
            <div className="flex-shrink-0 mr-3">
              <img src="/logo.png" alt="CRM Logo" className="w-8 h-8 object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-semibold text-gray-900 truncate">Mohan Mutha</h1>
              <p className="text-xs text-gray-500 truncate">Exports Pvt. Ltd.</p>
            </div>
          </div>
          <button
            onClick={closeSidebar}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-md hover:bg-gray-100 flex-shrink-0"
          >
            <span className="sr-only">Close sidebar</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <nav className="mt-6 px-3 space-y-1 flex-1">
          {navigation
            .filter(item => !item.adminOnly || user?.role === 'ADMIN')
            .map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  isCurrentPath(item.href)
                    ? 'bg-primary-100 text-primary-900 border-r-2 border-primary-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={closeSidebar}
              >
                <span className="mr-3 text-lg flex-shrink-0">{item.icon}</span>
                <span className="truncate">{item.name}</span>
              </Link>
            ))}
        </nav>
        
        {/* Connection Status and Online Users - Mobile */}
        <div className="px-3 pb-4 space-y-3">
          <ConnectionStatus />
          <OnlineUsers />
        </div>
      </div>

      {/* Main container */}
      <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-full bg-white shadow-sm border-r border-gray-200">
            <div className="flex items-center h-16 px-6 border-b border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="">
                    <img src="/logo.png" alt="CRM Logo" className="" style={{ maxWidth: '40%', height: 'auto' }}/>
                  </div>
                </div>
                {/* <div className="ml-3">
                  <h1 className="text-xl font-bold text-gray-900">CRM</h1>
                  <p className="text-xs text-gray-500">Customer Management</p>
                </div> */}
              </div>
            </div>
            <nav className="mt-6 flex-1 px-3 space-y-1">
              {navigation
                .filter(item => !item.adminOnly || user?.role === 'ADMIN')
                .map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      isCurrentPath(item.href)
                        ? 'bg-primary-100 text-primary-900 border-r-2 border-primary-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="mr-3 text-lg flex-shrink-0">{item.icon}</span>
                    <span className="truncate">{item.name}</span>
                  </Link>
                ))}
            </nav>
            
            {/* Connection Status and Online Users - Desktop */}
            <div className="px-3 pb-4 space-y-3">
              <ConnectionStatus />
              <OnlineUsers />
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top navigation */}
        <div className="flex-shrink-0 flex h-16 bg-white shadow-sm border-b border-gray-200">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 lg:hidden flex items-center justify-center min-w-[3rem]"
            onClick={toggleSidebar}
          >
            <span className="sr-only">Open sidebar</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="flex-1 flex items-center justify-end px-4 sm:px-6 lg:px-8">
            {/* User menu */}
            <div className="ml-4 flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-700">
                      {user?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-700">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.email || 'user@example.com'}
                  </p>
                </div>
              </div>
              
              <button
                onClick={logout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
              >
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>

        {/* Real-time Components */}
        <RealtimeNotifications />
        <RealtimeActivityStream />
        <MobileRealtimeStatus />
      </div>
    </>
  );
}
