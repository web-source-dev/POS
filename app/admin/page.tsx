"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAuthMenu } from "@/components/auth/user-auth-menu";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AdminPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  // Redirect if not admin
  useEffect(() => {
    if (!loading && (!user || !isAdmin())) {
      router.push("/auth/login");
    }
  }, [user, loading, router, isAdmin]);

  // Don't render anything while checking authentication
  if (loading || !user) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  // Don't render content for non-admins
  if (!isAdmin()) {
    return null;
  }

  return (
    <div className="container mx-auto p-4">
      <header className="flex justify-between items-center mb-8 py-4 border-b">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <UserAuthMenu />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage users and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">You have administrator access to manage all users in the system.</p>
            <Button>Manage Users</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
            <CardDescription>Configure system settings</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Access to global configuration settings for the entire application.</p>
            <Button variant="outline">Settings</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
            <CardDescription>System statistics and reporting</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">View detailed analytics and generate system reports.</p>
            <Button variant="outline">View Reports</Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Link href="/">
          <Button variant="ghost">Back to Home</Button>
        </Link>
      </div>
    </div>
  );
} 