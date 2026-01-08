# Admin Login Fix Guide

## 🔍 Issues Identified

Your admin login is blocked due to one or more of these issues:

1. **Race Condition in Auth Check** ✅ **FIXED**
2. **Missing Admin Role Assignment** ⚠️ **NEEDS DATABASE FIX**
3. **Circular RLS Policy Dependencies** ⚠️ **OPTIONAL FIX**

---

## ✅ Code Fixes Applied (Already Done)

### Fix #2: ProtectedRoute Race Condition
**File:** `src/components/ProtectedRoute.tsx`
**Status:** ✅ Fixed
**Backup:** `src/components/ProtectedRoute.tsx.backup`

**Changes made:**
- Fixed race condition where multiple auth checks could run simultaneously
- Changed `authCheckInProgress` from variable to `useRef` for proper state persistence
- Added enhanced error logging with emojis for easier debugging
- Added timing metrics to identify slow queries

**What this fixes:**
- Auth flow hanging on loading screen
- False "Access Denied" errors
- Concurrent auth state checks interfering with each other

---

## 🗄️ Database Fixes (You Need To Do These)

### Step 1: Check Your Current Status

**Option A: Using Browser Console (Easiest)**

1. Open your app in browser
2. Log in with your account (if not already logged in)
3. Open browser console (F12)
4. Run: `window.checkAdminStatus()`

This will show you:
- ✅ If you're logged in
- ✅ What roles you have (if any)
- ✅ If bootstrap is available
- ✅ SQL command to fix if needed

**Option B: Direct Database Query (Supabase Dashboard)**

1. Go to Supabase Dashboard → SQL Editor
2. Run this to see all users and their roles:

```sql
-- Check all users and their roles
SELECT
  u.id,
  u.email,
  u.created_at,
  COALESCE(
    (SELECT STRING_AGG(ur.role::text, ', ')
     FROM public.user_roles ur
     WHERE ur.user_id = u.id),
    'NO ROLES'
  ) as roles
FROM auth.users u
ORDER BY u.created_at DESC;
```

---

### Step 2: Fix Missing Admin Role

**🎯 Choose the appropriate solution based on your situation:**

#### Solution A: You are the FIRST user (Bootstrap Available)

If `window.checkAdminStatus()` shows "Admin role granted via bootstrap":

1. ✅ You're done! Just refresh the page
2. Try accessing `/admin` again

#### Solution B: You need to be MANUALLY granted admin role

If bootstrap says "denied - admin already exists", run this SQL in Supabase Dashboard:

```sql
-- Replace YOUR_EMAIL with your actual email address
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Get your user ID
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'YOUR_EMAIL@example.com';

  -- Grant admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RAISE NOTICE 'Admin role granted to user: %', target_user_id;
END $$;
```

**Or if you know your user ID:**

```sql
-- Replace YOUR_USER_ID with your actual UUID
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR_USER_ID', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

#### Solution C: Create admin via email lookup (Single command)

```sql
-- This does it all in one command - just replace the email
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email = 'YOUR_EMAIL@example.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

---

### Step 3: Verify It Worked

Run this to confirm:

```sql
-- Check your admin role was added
SELECT
  u.email,
  ur.role,
  ur.created_at
FROM auth.users u
JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email = 'YOUR_EMAIL@example.com';
```

You should see a row with `role = 'admin'`.

---

## 🧪 Testing After Fixes

### 1. Test Login Flow

1. Clear browser cache (Ctrl+Shift+Delete)
2. Go to `/auth`
3. Sign in with your credentials
4. Watch browser console for debug output
5. Should redirect to `/admin` successfully

### 2. What to Look For in Console

**✅ Good Output:**
```
✅ User has roles: [admin], Required: admin, Access: GRANTED
🔒 Final auth result: isAuthenticated=true, hasRole=true, requiredRole=admin
⏱️ Total auth check duration: 234ms
```

**❌ Bad Output (Not Fixed Yet):**
```
⚠️ No roles found for user - attempting bootstrap for admin...
⚠️ Bootstrap denied - an admin already exists in the system
❌ SOLUTION: You need an existing admin to grant you the admin role, or run this SQL:
   INSERT INTO public.user_roles (user_id, role) VALUES ('xxx', 'admin');
```

If you see the bad output, go back to Step 2 and run the SQL to grant yourself admin role.

### 3. Test Admin Dashboard Features

Once you can access `/admin`, verify:

- [ ] Dashboard loads and shows metrics
- [ ] Can view `/admin/orders` page
- [ ] Can update order statuses
- [ ] Can view `/admin/analytics`
- [ ] Can manage roles at `/admin/roles`
- [ ] Can access kitchen display at `/kitchen`

---

## 🔧 Optional: Fix RLS Policy Circular Dependency

**⚠️ Only do this if auth is still slow (>2 seconds) after the above fixes**

This optimizes the database policies to avoid circular dependencies:

```sql
-- Add performance index
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role
ON public.user_roles(user_id, role);

-- Drop old policies
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- Create simpler policy without recursion
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (
  -- Direct check without calling has_role function
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
);

-- Ensure grants are correct
GRANT SELECT ON public.user_roles TO authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role TO authenticated;
```

---

## 🚨 If Something Breaks - Rollback

### Rollback Code Changes

```bash
# Restore original ProtectedRoute
cp src/components/ProtectedRoute.tsx.backup src/components/ProtectedRoute.tsx

# Remove diagnostic utility import
# Edit src/App.tsx and remove the line:
# import "@/utils/adminDiagnostics";
```

### Rollback Database Changes

```sql
-- Remove admin role you just added
DELETE FROM public.user_roles
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL@example.com')
AND role = 'admin';
```

---

## 📋 Quick Reference Commands

### Check who is admin
```sql
SELECT u.email, ur.created_at
FROM auth.users u
JOIN public.user_roles ur ON ur.user_id = u.id
WHERE ur.role = 'admin';
```

### Add admin role
```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email = 'YOUR_EMAIL@example.com';
```

### Remove admin role
```sql
DELETE FROM public.user_roles
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL@example.com')
AND role = 'admin';
```

### Check all roles for a user
```sql
SELECT * FROM public.user_roles
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL@example.com');
```

---

## 🎯 Summary - What To Do Now

1. **Test the app first** - The code fixes might be enough!
   - Log in and try to access `/admin`
   - Open browser console (F12) and run: `window.checkAdminStatus()`

2. **If bootstrap grants you admin** ✅ Done! Refresh and enjoy.

3. **If bootstrap is denied:**
   - Go to Supabase Dashboard → SQL Editor
   - Run the SQL command from "Solution C" above with your email
   - Refresh the page and try `/admin` again

4. **Check console logs** - The enhanced logging will tell you exactly what's wrong

5. **Report back** - Let me know if you're still having issues!

---

## 📞 Need Help?

If you're still stuck:

1. Run `window.checkAdminStatus()` in browser console
2. Copy the entire console output
3. Show me what it says and I can help diagnose further

Good luck! 🚀
