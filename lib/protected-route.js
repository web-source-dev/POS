"use client";

import { useRouter } from 'next/navigation';
import { useAuth } from './auth';
import { useEffect } from 'react';

// ProtectedRoute HOC to guard admin routes
export function withAdminProtection(Component) {
  return function AdminProtectedRoute(props) {
    const { user, loading, isAdmin } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && (!user || !isAdmin())) {
        router.push('/auth/login');
      }
    }, [user, loading, router, isAdmin]);

    // Don't render anything while checking authentication
    if (loading || !user || !isAdmin()) {
      return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    return <Component {...props} />;
  };
}

// ProtectedRoute HOC to guard user routes
export function withAuthProtection(Component) {
  return function UserProtectedRoute(props) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        router.push('/auth/login');
      }
    }, [user, loading, router]);

    // Don't render anything while checking authentication
    if (loading || !user) {
      return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    return <Component {...props} />;
  };
} 