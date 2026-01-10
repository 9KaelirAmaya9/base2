import { useEffect, useState, useRef } from "react";
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
  const authCheckInProgress = useRef(false);

  useEffect(() => {
    let mounted = true;

    const checkAuthAndRole = async () => {
      // Prevent concurrent checks
      if (authCheckInProgress.current) {
        console.log("⚠️ Auth check already in progress, skipping");
        return;
      }

      authCheckInProgress.current = true;
      const startTime = Date.now();
      console.log("🔍 Starting auth check...");

      // Failsafe: reset flag after 10 seconds no matter what
      const failsafeTimeout = setTimeout(() => {
        if (authCheckInProgress.current) {
          console.error("⚠️ Auth check timeout failsafe triggered - forcing flag reset");
          authCheckInProgress.current = false;
        }
      }, 10000);

      try {
        const { data: { session }, error } = await supabase.auth.getSession();


        if (!mounted) {
          console.log("⚠️ Component unmounted, stopping auth check");
          authCheckInProgress.current = false;
          return;
        }

        console.log(`✅ Session check took ${Date.now() - startTime}ms`);

        if (error) {
          console.error("❌ Auth check error:", error);
          setIsAuthenticated(false);
          setHasRole(false);
          setIsLoading(false);
          authCheckInProgress.current = false;
          return;
        }

        if (!session) {
          console.log("❌ No session found");
          setIsAuthenticated(false);
          setHasRole(false);
          setIsLoading(false);
          authCheckInProgress.current = false;
          return;
        }

        console.log("Session found for user:", session.user.id);
        setIsAuthenticated(true);

        // If no role required, we're done
        if (!requiredRole) {
          setHasRole(true);
          setIsLoading(false);
          authCheckInProgress.current = false;
          return;
        }

        // Check role with optimized query
        const roleCheckStart = Date.now();
        let userHasRole = false;
        
        try {
          // Single optimized query with timeout
          const rolePromise = supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .limit(5);

          const roleTimeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Role check timeout")), 3000)
          );

          const { data: roles, error: roleError } = await Promise.race([
            rolePromise,
            roleTimeoutPromise
          ]) as any;

          if (!mounted) {
            console.log("⚠️ Component unmounted during role check");
            authCheckInProgress.current = false;
            return;
          }

          console.log(`Role check took ${Date.now() - roleCheckStart}ms`);

          if (roleError) {
            console.error("Role query error:", roleError);
            userHasRole = false;
          } else if (roles && roles.length > 0) {
            // Check if user has the required role (or admin can access kitchen)
            userHasRole = roles.some(
              (r) => r.role === requiredRole || (requiredRole === 'kitchen' && r.role === 'admin')
            );
            console.log(`✅ User has roles: [${roles.map(r => r.role).join(', ')}], Required: ${requiredRole}, Access: ${userHasRole ? 'GRANTED' : 'DENIED'}`);

            if (!userHasRole) {
              console.error(`❌ ACCESS DENIED: User has roles [${roles.map(r => r.role).join(', ')}] but needs '${requiredRole}' role`);
            }
          } else {
            console.warn("⚠️ No roles found for user - attempting bootstrap for admin...");
            // Try bootstrap for admin only if no roles exist
            if (requiredRole === 'admin') {
              try {
                console.log("🔄 Attempting admin bootstrap...");
                const bootstrapStart = Date.now();
                const { data: granted, error: bootstrapError } = await supabase.rpc('bootstrap_admin');
                const bootstrapDuration = Date.now() - bootstrapStart;

                if (bootstrapError) {
                  console.error("❌ Bootstrap error:", bootstrapError);
                  console.error("💡 This user cannot be made admin. An admin must grant the role via SQL or Admin UI.");
                } else if (granted === true) {
                  console.log(`✅ 🎉 Admin role bootstrapped successfully! (took ${bootstrapDuration}ms)`);
                  console.log("💡 You are now an admin! Refresh the page to access admin features.");
                  userHasRole = true;
                } else {
                  console.warn(`⚠️ Bootstrap denied - an admin already exists in the system (took ${bootstrapDuration}ms)`);
                  console.error("❌ SOLUTION: You need an existing admin to grant you the admin role, or run this SQL:");
                  console.error(`   INSERT INTO public.user_roles (user_id, role) VALUES ('${session.user.id}', 'admin');`);
                }
              } catch (e) {
                console.error('❌ Bootstrap admin exception:', e);
              }
            } else {
              console.error(`❌ No roles found and required role is '${requiredRole}' (not admin, so no bootstrap available)`);
              console.error("💡 SOLUTION: An admin must grant you the '${requiredRole}' role");
            }
          }
        } catch (e: any) {
          console.error("❌ Role check exception:", e.message || e);
          userHasRole = false;
        }

        if (mounted) {
          console.log(`🔒 Final auth result: isAuthenticated=${true}, hasRole=${userHasRole}, requiredRole=${requiredRole}`);
          setHasRole(userHasRole);
          setIsLoading(false);
        }
      } catch (e: any) {
        console.error("❌ Auth/Role check error:", e.message || e);
        if (mounted) {
          setIsAuthenticated(false);
          setHasRole(false);
          setIsLoading(false);
        }
      } finally {
        clearTimeout(failsafeTimeout);
        const totalDuration = Date.now() - startTime;
        console.log(`⏱️ Total auth check duration: ${totalDuration}ms`);
        console.log(`✅ Resetting authCheckInProgress flag`);
        authCheckInProgress.current = false;
      }
    };

    // Initial check
    checkAuthAndRole();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      console.log("Auth state changed:", event);
      
      // Debounce rapid auth changes
      setTimeout(() => {
        if (mounted) {
          checkAuthAndRole();
        }
      }, 100);
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
