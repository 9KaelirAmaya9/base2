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

        // Check role - use RPC function if available, otherwise direct query
        let userHasRole = false;
        
        try {
          // First try direct query (works if RLS allows)
          const { data: roles, error: roleError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id);

          if (!mounted) return;

          if (!roleError && roles) {
            userHasRole = roles.some(
              (r) => r.role === requiredRole || (requiredRole === 'kitchen' && r.role === 'admin')
            );
          } else if (roleError) {
            // If direct query fails, try RPC function as fallback
            console.warn("Direct role query failed, trying RPC:", roleError);
            try {
              const { data: hasAdminRole } = await supabase.rpc('has_role', {
                _user_id: session.user.id,
                _role: requiredRole === 'kitchen' ? 'kitchen' : 'admin'
              });
              userHasRole = hasAdminRole || false;
            } catch (rpcError) {
              console.error("RPC role check also failed:", rpcError);
              // Last resort: check if user is admin (admins can access kitchen)
              if (requiredRole === 'kitchen') {
                try {
                  const { data: adminCheck } = await supabase.rpc('has_role', {
                    _user_id: session.user.id,
                    _role: 'admin'
                  });
                  userHasRole = adminCheck || false;
                } catch (e) {
                  console.error("Admin check failed:", e);
                }
              }
            }
          }

          // Attempt first-admin bootstrap if needed (from remote version)
          if (!userHasRole && requiredRole === 'admin') {
            try {
              const { data: granted, error: bootstrapError } = await supabase.rpc('bootstrap_admin');
              if (bootstrapError) {
                console.error('Bootstrap admin error:', bootstrapError);
              } else if (granted === true) {
                const { data: rolesAfter } = await supabase
                  .from('user_roles')
                  .select('role')
                  .eq('user_id', session.user.id);
                userHasRole = rolesAfter?.some((r) => r.role === 'admin') ?? false;
              }
            } catch (e) {
              console.error('Bootstrap admin exception:', e);
            }
          }
        } catch (e) {
          console.error("Role check exception:", e);
        }
        
        setHasRole(userHasRole);
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
      // Use requestAnimationFrame for better timing, or directly call
      checkAuthAndRole();
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
