import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "kitchen";
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasRole, setHasRole] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkAuthAndRole = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (error) {
          console.error("Auth check error:", error);
          setIsAuthenticated(false);
          setHasRole(false);
          setIsLoading(false);
          return;
        }

        if (!session) {
          setIsAuthenticated(false);
          setHasRole(false);
          setIsLoading(false);
          return;
        }

        setIsAuthenticated(true);

        // If no role required, we're done
        if (!requiredRole) {
          setHasRole(true);
          setIsLoading(false);
          return;
        }

        // Check role
        const { data: roles, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id);

        if (!mounted) return;

        if (roleError) {
          console.error("Role check error:", roleError);
          setHasRole(false);
        } else {
          const userHasRole = roles?.some(
            (r) => r.role === requiredRole || (requiredRole === 'kitchen' && r.role === 'admin')
          ) ?? false;
          setHasRole(userHasRole);
        }
      } catch (e) {
        console.error("Auth/Role check error:", e);
        if (mounted) {
          setIsAuthenticated(false);
          setHasRole(false);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    // Initial check
    checkAuthAndRole();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      
      // Reset state and re-check
      setIsLoading(true);
      setTimeout(() => {
        checkAuthAndRole();
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [requiredRole]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (requiredRole && !hasRole) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
