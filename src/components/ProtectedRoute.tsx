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

    // Listen for auth state changes first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      const authed = !!session;
      setIsAuthenticated(authed);

      if (!authed) {
        setHasRole(false);
        setIsLoading(false);
        return;
      }

      if (!requiredRole) {
        setHasRole(true);
        setIsLoading(false);
        return;
      }

      // Defer DB calls from within the callback to avoid deadlocks
      setTimeout(async () => {
        try {
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session!.user.id);

          if (!mounted) return;
          const userHasRole = roles?.some(r => r.role === requiredRole) ?? false;
          setHasRole(userHasRole);
        } catch (e) {
          console.error("Role check error:", e);
          if (mounted) setHasRole(false);
        } finally {
          if (mounted) setIsLoading(false);
        }
      }, 0);
    });

    // Then check the current session immediately
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return;
        const authed = !!session;
        setIsAuthenticated(authed);

        if (!authed) {
          setHasRole(false);
          setIsLoading(false);
          return;
        }

        if (!requiredRole) {
          setHasRole(true);
          setIsLoading(false);
          return;
        }

        (async () => {
          try {
            const { data: roles } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", session.user.id);

            if (!mounted) return;
            const userHasRole = roles?.some(r => r.role === requiredRole) ?? false;
            setHasRole(userHasRole);
          } catch (e) {
            console.error("Role check error:", e);
            if (mounted) setHasRole(false);
          } finally {
            if (mounted) setIsLoading(false);
          }
        })();
      })
      .catch((e) => {
        console.error("Get session error:", e);
        if (mounted) {
          setIsAuthenticated(false);
          setHasRole(false);
          setIsLoading(false);
        }
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
