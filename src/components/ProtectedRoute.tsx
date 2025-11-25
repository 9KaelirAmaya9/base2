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
    let timeoutId: NodeJS.Timeout | null = null;

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

        // Check role with timeout protection
        let userHasRole = false;
        
        try {
          // Query user_roles directly
          const { data: roles, error: roleError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id);

          if (!mounted) return;

          if (roleError) {
            console.error("Role query error:", roleError);
            userHasRole = false;
          } else if (roles && roles.length > 0) {
            // Check if user has the required role (or admin can access kitchen)
            userHasRole = roles.some(
              (r) => r.role === requiredRole || (requiredRole === 'kitchen' && r.role === 'admin')
            );
            console.log("User roles:", roles, "Required:", requiredRole, "Has access:", userHasRole);
          } else {
            // No roles found - try bootstrap for admin
            if (requiredRole === 'admin') {
              try {
                const { data: granted } = await supabase.rpc('bootstrap_admin');
                if (granted === true) {
                  // Re-check roles after bootstrap
                  const { data: rolesAfter } = await supabase
                    .from('user_roles')
                    .select('role')
                    .eq('user_id', session.user.id);
                  userHasRole = rolesAfter?.some((r) => r.role === 'admin') ?? false;
                }
              } catch (e) {
                console.error('Bootstrap admin failed:', e);
              }
            }
          }
        } catch (e) {
          console.error("Role check exception:", e);
          userHasRole = false;
        }
        
        if (mounted) {
          setHasRole(userHasRole);
          setIsLoading(false);
        }
      } catch (e) {
        console.error("Auth/Role check error:", e);
        if (mounted) {
          setIsAuthenticated(false);
          setHasRole(false);
          setIsLoading(false);
        }
      }
    };

    // Clear any existing timeout
    if (timeoutId) clearTimeout(timeoutId);

    // Set a timeout failsafe (10 seconds max)
    timeoutId = setTimeout(() => {
      if (mounted && isLoading) {
        console.error("Auth check timeout - forcing completion");
        setIsLoading(false);
      }
    }, 10000);

    // Initial check
    checkAuthAndRole();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      checkAuthAndRole();
    });

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
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
    return <Navigate to={`/auth?redirect=${encodeURIComponent(window.location.pathname)}`} replace />;
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
