import { useEffect, useState, useRef } from 'react';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

export default function Toast({ id, type, title, message, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const toastRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number>(0);
  const currentX = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  useEffect(() => {
    // Trigger animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto close
    const closeTimer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(timer);
      clearTimeout(closeTimer);
    };
  }, [duration]);

  const handleClose = () => {
    setIsDismissing(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose(id);
    }, 300);
  };

  // Touch handlers for swipe-to-dismiss
  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    
    currentX.current = e.touches[0].clientX;
    const deltaX = currentX.current - startX.current;
    
    if (toastRef.current) {
      // Only allow rightward swipe (to dismiss)
      if (deltaX > 0) {
        toastRef.current.style.transform = `translateX(${Math.min(deltaX, 100)}px)`;
        toastRef.current.style.opacity = `${Math.max(1 - deltaX / 200, 0.3)}`;
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    
    const deltaX = currentX.current - startX.current;
    
    if (deltaX > 100) {
      // Swipe threshold reached, dismiss toast
      handleClose();
    } else if (toastRef.current) {
      // Reset position
      toastRef.current.style.transform = '';
      toastRef.current.style.opacity = '';
    }
    
    isDragging.current = false;
  };

  const getToastStyles = () => {
    const baseStyles = 'w-full max-w-xs sm:max-w-sm bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden transform transition-all duration-300 ease-in-out touch-pan-x';
    
    switch (type) {
      case 'success':
        return `${baseStyles} border-l-4 border-green-400`;
      case 'error':
        return `${baseStyles} border-l-4 border-red-400`;
      case 'warning':
        return `${baseStyles} border-l-4 border-yellow-400`;
      case 'info':
        return `${baseStyles} border-l-4 border-blue-400`;
      default:
        return baseStyles;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      case 'info':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div
      className={`fixed top-4 right-2 sm:right-4 left-2 sm:left-auto z-50 ${isVisible && !isDismissing ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
    >
      <div 
        ref={toastRef}
        className={getToastStyles()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="p-3 sm:p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className={`text-base sm:text-lg ${getIconColor()}`}>
                {getIcon()}
              </span>
            </div>
            <div className="ml-3 w-0 flex-1 pt-0.5">
              <p className="text-sm font-medium text-gray-900 leading-tight">{title}</p>
              {message && (
                <p className="mt-1 text-xs sm:text-sm text-gray-500 leading-relaxed">{message}</p>
              )}
            </div>
            <div className="ml-3 flex-shrink-0 flex">
              <button
                className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 p-1 touch-manipulation"
                onClick={handleClose}
                aria-label="Close notification"
              >
                <span className="sr-only">Close</span>
                <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Toast container component
interface ToastContainerProps {
  toasts: ToastProps[];
  onRemoveToast: (id: string) => void;
}

export function ToastContainer({ toasts, onRemoveToast }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-2 sm:right-4 left-2 sm:left-auto z-50 space-y-2 max-w-sm sm:max-w-md">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={onRemoveToast}
        />
      ))}
    </div>
  );
}
