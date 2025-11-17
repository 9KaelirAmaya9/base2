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
    let initialCheckDone = false;
    let authEventReceived = false;

    const checkRole = async (uid: string) => {
      try {
        const { data: roles, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", uid);

        if (!mounted) return;

        if (roleError) {
          console.error("Role check error:", roleError);
          setHasRole(false);
          return;
        }
        const userHasRole = roles?.some((r) => r.role === requiredRole || (requiredRole === 'kitchen' && r.role === 'admin')) ?? false;
        setHasRole(userHasRole);
      } catch (e) {
        console.error("Role check error:", e);
        if (mounted) setHasRole(false);
      }
    };

    // 1) Listen for auth changes FIRST and drive UI from it
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      authEventReceived = true;

      setIsAuthenticated(!!session);

      if (session && requiredRole) {
        // defer DB call to avoid deadlocks inside the callback
        setIsLoading(true);
        setTimeout(() => {
          checkRole(session.user.id).finally(() => {
            if (mounted) setIsLoading(false);
          });
        }, 0);
      } else {
        // No role required or no session
        setIsLoading(false);
      }
    });

    // 2) Also check current session, but do NOT conclude "unauthenticated" immediately
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      initialCheckDone = true;

      if (error) {
        console.error("Auth check error:", error);
      }

      if (session) {
        setIsAuthenticated(true);
        if (requiredRole) {
          setIsLoading(true);
          checkRole(session.user.id).finally(() => {
            if (mounted) setIsLoading(false);
          });
        } else {
          setIsLoading(false);
        }
      } else {
        // wait briefly for the auth listener to hydrate before deciding
        setTimeout(() => {
          if (mounted && !authEventReceived) {
            setIsAuthenticated(false);
            setHasRole(false);
            setIsLoading(false);
          }
        }, 800);
      }
    });

    // 3) Safety timeout to avoid perpetual loading
    const safety = setTimeout(() => {
      if (mounted && (initialCheckDone || authEventReceived)) {
        setIsLoading(false);
      }
    }, 4000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(safety);
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
