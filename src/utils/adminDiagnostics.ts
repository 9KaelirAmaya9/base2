/**
 * Admin Login Diagnostic Utility
 *
 * This utility helps diagnose admin login issues by checking:
 * 1. Current user authentication status
 * 2. User roles in database
 * 3. Admin bootstrap status
 * 4. RLS policy functionality
 *
 * Usage: Open browser console and run: window.checkAdminStatus()
 */

import { supabase } from "@/integrations/supabase/client";

interface DiagnosticResult {
  timestamp: string;
  checks: {
    name: string;
    status: 'success' | 'error' | 'warning';
    message: string;
    data?: any;
  }[];
}

export async function runAdminDiagnostics(): Promise<DiagnosticResult> {
  const result: DiagnosticResult = {
    timestamp: new Date().toISOString(),
    checks: []
  };

  console.log('🔍 Starting Admin Login Diagnostics...\n');

  // Check 1: Session Status
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      result.checks.push({
        name: 'Session Check',
        status: 'error',
        message: `Session check failed: ${error.message}`,
        data: { error }
      });
      console.error('❌ Session Check FAILED:', error);
    } else if (!session) {
      result.checks.push({
        name: 'Session Check',
        status: 'warning',
        message: 'No active session - user is not logged in',
      });
      console.warn('⚠️ No active session found');
    } else {
      result.checks.push({
        name: 'Session Check',
        status: 'success',
        message: `User is authenticated: ${session.user.email}`,
        data: {
          userId: session.user.id,
          email: session.user.email,
          sessionExpiry: new Date(session.expires_at! * 1000).toISOString()
        }
      });
      console.log('✅ Session found:', {
        email: session.user.email,
        userId: session.user.id
      });
    }
  } catch (e: any) {
    result.checks.push({
      name: 'Session Check',
      status: 'error',
      message: `Unexpected error: ${e.message}`,
    });
    console.error('❌ Session check exception:', e);
  }

  // Check 2: User Roles Query
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      const startTime = Date.now();
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);
      const duration = Date.now() - startTime;

      if (error) {
        result.checks.push({
          name: 'User Roles Query',
          status: 'error',
          message: `Failed to fetch roles: ${error.message}`,
          data: { error, queryDuration: `${duration}ms` }
        });
        console.error('❌ User roles query FAILED:', error);
      } else if (!roles || roles.length === 0) {
        result.checks.push({
          name: 'User Roles Query',
          status: 'warning',
          message: 'No roles found for user - this is the problem!',
          data: { queryDuration: `${duration}ms` }
        });
        console.warn('⚠️ No roles found for user (query took', duration, 'ms)');
      } else {
        result.checks.push({
          name: 'User Roles Query',
          status: 'success',
          message: `User has ${roles.length} role(s): ${roles.map(r => r.role).join(', ')}`,
          data: { roles, queryDuration: `${duration}ms` }
        });
        console.log('✅ User roles:', roles.map(r => r.role), `(query took ${duration}ms)`);
      }
    } else {
      result.checks.push({
        name: 'User Roles Query',
        status: 'warning',
        message: 'Skipped - no session',
      });
    }
  } catch (e: any) {
    result.checks.push({
      name: 'User Roles Query',
      status: 'error',
      message: `Unexpected error: ${e.message}`,
    });
    console.error('❌ User roles query exception:', e);
  }

  // Check 3: Bootstrap Admin Test
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      console.log('🔄 Testing bootstrap_admin function...');
      const { data: granted, error } = await supabase.rpc('bootstrap_admin');

      if (error) {
        result.checks.push({
          name: 'Bootstrap Admin Test',
          status: 'error',
          message: `Bootstrap function failed: ${error.message}`,
          data: { error }
        });
        console.error('❌ bootstrap_admin FAILED:', error);
      } else {
        result.checks.push({
          name: 'Bootstrap Admin Test',
          status: granted ? 'success' : 'warning',
          message: granted
            ? 'Admin role granted via bootstrap! You are now an admin.'
            : 'Bootstrap denied - an admin already exists',
          data: { granted }
        });

        if (granted) {
          console.log('✅ 🎉 Admin role GRANTED via bootstrap! You are now an admin!');
        } else {
          console.warn('⚠️ Bootstrap denied - an admin already exists in the system');
        }
      }
    } else {
      result.checks.push({
        name: 'Bootstrap Admin Test',
        status: 'warning',
        message: 'Skipped - no session',
      });
    }
  } catch (e: any) {
    result.checks.push({
      name: 'Bootstrap Admin Test',
      status: 'error',
      message: `Unexpected error: ${e.message}`,
    });
    console.error('❌ Bootstrap admin exception:', e);
  }

  // Check 4: All Admins in System (if user is admin)
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      const { data: allAdmins, error } = await supabase
        .from("user_roles")
        .select("user_id, role, created_at")
        .eq("role", "admin");

      if (error) {
        result.checks.push({
          name: 'List All Admins',
          status: 'warning',
          message: `Cannot query all admins: ${error.message} (This is expected if you're not admin)`,
        });
        console.warn('⚠️ Cannot list all admins (expected if you\'re not admin):', error.message);
      } else {
        result.checks.push({
          name: 'List All Admins',
          status: 'success',
          message: `Found ${allAdmins?.length || 0} admin(s) in system`,
          data: { adminCount: allAdmins?.length || 0, admins: allAdmins }
        });
        console.log('✅ Admins in system:', allAdmins?.length || 0);
        if (allAdmins && allAdmins.length > 0) {
          console.table(allAdmins);
        }
      }
    }
  } catch (e: any) {
    result.checks.push({
      name: 'List All Admins',
      status: 'warning',
      message: `Could not list admins: ${e.message}`,
    });
  }

  // Summary
  console.log('\n📊 DIAGNOSTIC SUMMARY:\n');
  result.checks.forEach(check => {
    const icon = check.status === 'success' ? '✅' : check.status === 'error' ? '❌' : '⚠️';
    console.log(`${icon} ${check.name}: ${check.message}`);
  });

  console.log('\n🔍 Full diagnostic result:', result);
  console.log('\n💡 NEXT STEPS:');

  const hasSession = result.checks[0]?.status === 'success';
  const hasRoles = result.checks[1]?.status === 'success';
  const bootstrapGranted = result.checks[2]?.data?.granted === true;

  if (!hasSession) {
    console.log('1. Log in via /auth page');
  } else if (bootstrapGranted) {
    console.log('1. ✅ You have been granted admin role!');
    console.log('2. Refresh the page and try accessing /admin');
  } else if (!hasRoles) {
    console.log('1. ❌ You have NO roles assigned');
    console.log('2. You need an existing admin to grant you the admin role');
    console.log('3. OR run this SQL in Supabase dashboard:');
    console.log(`   INSERT INTO public.user_roles (user_id, role) VALUES ('${result.checks[0]?.data?.userId}', 'admin');`);
  } else {
    console.log('1. ✅ You have roles assigned');
    console.log('2. Check if "admin" is in your roles');
    console.log('3. If you have admin role but still can\'t access /admin, there may be a code issue');
  }

  return result;
}

// Make it available globally for easy browser console access
if (typeof window !== 'undefined') {
  (window as any).checkAdminStatus = runAdminDiagnostics;
  console.log('💡 Admin diagnostics loaded! Run window.checkAdminStatus() in console to check your admin status');
}
