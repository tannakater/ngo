import { auth, googleProvider, db } from './firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { useOrgStore } from '../store/useOrgStore';
import { supabase } from './supabase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User 
} from 'firebase/auth';

export interface AdminUser {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'admin' | 'moderator';
}

export interface PrivilegesResult {
  authorized: boolean;
  role: 'admin' | 'moderator';
  displayName?: string;
}

let isSigningIn = false;
let cachedAccessToken: string | null = null;
let currentAdminUser: AdminUser | null = null;

const authSuccessListeners = new Set<(user: AdminUser, token: string) => void>();
const authFailureListeners = new Set<() => void>();

function notifySuccess(user: AdminUser, token: string) {
  currentAdminUser = user;
  authSuccessListeners.forEach(listener => listener(user, token));
}

function notifyFailure() {
  currentAdminUser = null;
  cachedAccessToken = null;
  authFailureListeners.forEach(listener => listener());
}

// Check session storage for an active session (session-only by default)
function getStoredSession(): { user: AdminUser; token: string } | null {
  try {
    const raw = sessionStorage.getItem('admin_session_auth') || localStorage.getItem('admin_session_auth');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Multi-layer, zero-failure admin privilege resolver:
 * Checks Master Accounts, In-Memory Store, LocalStorage, Firestore web_users, Firestore users, Supabase, and Member roles
 */
export async function resolveAdminPrivileges(emailInput: string): Promise<PrivilegesResult> {
  const normEmail = (emailInput || '').trim().toLowerCase();
  if (!normEmail) {
    return { authorized: false, role: 'moderator' };
  }

  // 1. Check Master / System Super Admin Emails
  const orgEmail = (useOrgStore.getState().organization?.email || '').trim().toLowerCase();
  if (
    normEmail === 'prankp343@gmail.com' ||
    normEmail === 'admin@ngo.org' ||
    normEmail === 'admin@domain.org' ||
    (orgEmail && normEmail === orgEmail)
  ) {
    return { authorized: true, role: 'admin', displayName: 'Super Administrator' };
  }

  // 2. Check in-memory Zustand store for webUsers
  const currentWebUsers = useOrgStore.getState().webUsers || [];
  const localMatch = currentWebUsers.find((u: any) => u.email?.trim().toLowerCase() === normEmail);
  if (localMatch) {
    return { 
      authorized: true, 
      role: (localMatch.role === 'moderator' ? 'moderator' : 'admin'), 
      displayName: localMatch.name || normEmail.split('@')[0] 
    };
  }

  // 3. Check LocalStorage across all cache keys
  try {
    const rawKeys = ['ngo_org_store_data', 'ngo_org_data', 'idforge_org_storage_v1', 'ngo_org_profile'];
    for (const key of rawKeys) {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        const list = parsed?.webUsers || parsed?.state?.webUsers;
        if (Array.isArray(list)) {
          const match = list.find((u: any) => u.email?.trim().toLowerCase() === normEmail);
          if (match) {
            return { 
              authorized: true, 
              role: (match.role === 'moderator' ? 'moderator' : 'admin'), 
              displayName: match.name || normEmail.split('@')[0] 
            };
          }
        }
      }
    }
  } catch (e) {}

  // 4. Query Firestore dedicated top-level 'web_users' collection by ID
  try {
    const directDoc = await getDoc(doc(db, 'web_users', normEmail));
    if (directDoc.exists()) {
      const data = directDoc.data();
      return { 
        authorized: true, 
        role: (data.role === 'moderator' ? 'moderator' : 'admin'), 
        displayName: data.name || normEmail.split('@')[0] 
      };
    }
  } catch (e) {}

  // 5. Query Firestore 'web_users' collection list
  try {
    const webUsersSnap = await getDocs(collection(db, 'web_users'));
    let foundDoc: any = null;
    webUsersSnap.forEach(snap => {
      const data = snap.data();
      if (
        (data.email && data.email.trim().toLowerCase() === normEmail) || 
        snap.id.trim().toLowerCase() === normEmail
      ) {
        foundDoc = data;
      }
    });
    if (foundDoc) {
      return { 
        authorized: true, 
        role: (foundDoc.role === 'moderator' ? 'moderator' : 'admin'), 
        displayName: foundDoc.name || normEmail.split('@')[0] 
      };
    }
  } catch (e) {}

  // 6. Query Firestore 'users' workspaces for any user doc containing this web user
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    let foundInUsersDoc: any = null;
    usersSnap.forEach(userDoc => {
      const data = userDoc.data();
      if (data.webUsers && Array.isArray(data.webUsers)) {
        const match = data.webUsers.find((u: any) => u.email?.trim().toLowerCase() === normEmail);
        if (match) {
          foundInUsersDoc = match;
        }
      }
    });
    if (foundInUsersDoc) {
      return { 
        authorized: true, 
        role: (foundInUsersDoc.role === 'moderator' ? 'moderator' : 'admin'), 
        displayName: foundInUsersDoc.name || normEmail.split('@')[0] 
      };
    }
  } catch (e) {}

  // 7. Check Supabase 'web_users' table if configured
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('web_users')
        .select('*')
        .ilike('email', normEmail);
      if (!error && Array.isArray(data) && data.length > 0) {
        const match = data[0];
        return { 
          authorized: true, 
          role: (match.role === 'moderator' ? 'moderator' : 'admin'), 
          displayName: match.name || normEmail.split('@')[0] 
        };
      }
    } catch (e) {}
  }

  // 8. Check if member record has executive/administrative privileges
  try {
    const members = useOrgStore.getState().members || [];
    const memberMatch = members.find((m: any) => m.email?.trim().toLowerCase() === normEmail);
    if (memberMatch) {
      const r = (memberMatch.role || '').toLowerCase();
      const d = (memberMatch.designation || '').toLowerCase();
      if (r === 'admin' || r === 'executive' || r === 'moderator' || d.includes('admin') || d.includes('director') || d.includes('manager')) {
        return { 
          authorized: true, 
          role: (r === 'moderator' ? 'moderator' : 'admin'), 
          displayName: `${memberMatch.firstName || ''} ${memberMatch.lastName || ''}`.trim() || normEmail.split('@')[0] 
        };
      }
    }
  } catch (e) {}

  return { authorized: false, role: 'moderator' };
}

export const initAuth = (
  onAuthSuccess?: (user: any, token: string) => void,
  onAuthFailure?: () => void
) => {
  if (onAuthSuccess) authSuccessListeners.add(onAuthSuccess);
  if (onAuthFailure) authFailureListeners.add(onAuthFailure);

  // Check if there is an active session
  const stored = getStoredSession();
  if (stored) {
    currentAdminUser = stored.user;
    cachedAccessToken = stored.token;
    if (onAuthSuccess) onAuthSuccess(stored.user, stored.token);
  } else {
    // Session auto-login is disabled: require user to explicitly sign in
    if (onAuthFailure) onAuthFailure();
  }

  // Firebase auth state change listener (keeps token in sync if already logged in)
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
    if (firebaseUser) {
      const activeSession = getStoredSession();
      if (activeSession) {
        const adminUser: AdminUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || activeSession.user.email,
          displayName: firebaseUser.displayName || activeSession.user.displayName || 'Administrator',
          photoURL: firebaseUser.photoURL || undefined,
          role: activeSession.user.role || 'admin',
        };
        currentAdminUser = adminUser;
        const token = cachedAccessToken || await firebaseUser.getIdToken().catch(() => 'admin-token');
        cachedAccessToken = token;
        notifySuccess(adminUser, token);
      } else if (!isSigningIn) {
        // Lingering Firebase background session without active admin session: do not auto-login!
        notifyFailure();
      }
    } else {
      const activeSession = getStoredSession();
      if (!activeSession) {
        notifyFailure();
      }
    }
  });

  return () => {
    if (onAuthSuccess) authSuccessListeners.delete(onAuthSuccess);
    if (onAuthFailure) authFailureListeners.delete(onAuthFailure);
    unsubscribe();
  };
};

/**
 * Sign in with Email and Password
 */
export const signInWithEmail = async (
  emailInput: string, 
  passwordInput: string, 
  rememberMe: boolean = false
): Promise<AdminUser> => {
  const email = emailInput.trim().toLowerCase();
  const password = passwordInput.trim();

  if (!email) {
    throw new Error('Please enter your administrator email.');
  }
  if (!password) {
    throw new Error('Please enter your password.');
  }

  isSigningIn = true;
  let adminUser: AdminUser | null = null;
  let token = 'admin-token-' + Date.now();

  try {
    // 1. Resolve administrative access first
    const privs = await resolveAdminPrivileges(email);

    // 2. Attempt Firebase Authentication
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      token = await cred.user.getIdToken();
      cachedAccessToken = token;
      adminUser = {
        uid: cred.user.uid,
        email: cred.user.email || email,
        displayName: cred.user.displayName || privs.displayName || email.split('@')[0],
        photoURL: cred.user.photoURL || undefined,
        role: privs.role,
      };
    } catch (fbErr: any) {
      // If sign in fails, handle first-time system admin registration or wrong password
      if (fbErr.code === 'auth/wrong-password' || fbErr.code === 'auth/invalid-credential') {
        throw new Error('Incorrect password. Please try again.');
      }
      
      // Auto-provision first-time login for authorized system users
      try {
        const newCred = await createUserWithEmailAndPassword(auth, email, password);
        token = await newCred.user.getIdToken();
        cachedAccessToken = token;
        adminUser = {
          uid: newCred.user.uid,
          email: newCred.user.email || email,
          displayName: privs.displayName || email.split('@')[0],
          role: privs.role,
        };
      } catch (createErr: any) {
        if (createErr.code === 'auth/email-already-in-use') {
          throw new Error('Incorrect password. Please try again.');
        }
        if (createErr.code === 'auth/weak-password') {
          throw new Error('Password must be at least 6 characters.');
        }
        throw new Error(createErr.message || 'Authentication failed. Please verify your credentials.');
      }
    }

    if (!adminUser) {
      throw new Error('Invalid email or password. Please try again.');
    }

    // 3. Verify that the account is authorized
    if (!privs.authorized) {
      await signOut(auth);
      throw new Error(`Access denied. The email "${email}" is not registered in System Users. Please ask a Super Admin to add this email under Admin > System Users.`);
    }

    adminUser.role = privs.role;
    if (privs.displayName) {
      adminUser.displayName = privs.displayName;
    }

    // Save session
    const sessionPayload = JSON.stringify({ user: adminUser, token });
    if (rememberMe) {
      localStorage.setItem('admin_session_auth', sessionPayload);
    } else {
      sessionStorage.setItem('admin_session_auth', sessionPayload);
    }

    notifySuccess(adminUser, token);
    return adminUser;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Sign in with Google (Alternative optional provider)
 */
export const googleSignIn = async (): Promise<{ user: any; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken || await result.user.getIdToken();

    const email = (result.user.email || '').trim().toLowerCase();
    
    // Resolve privileges for this Google account
    const privs = await resolveAdminPrivileges(email);

    if (!privs.authorized) {
      await signOut(auth); // Sign out of Firebase immediately
      throw new Error(`Access denied. This Google account (${email}) is not registered in System Users. Please ask a Super Admin to add your email under Admin > System Users.`);
    }

    cachedAccessToken = token;
    const adminUser: AdminUser = {
      uid: result.user.uid,
      email: email,
      displayName: privs.displayName || result.user.displayName || email.split('@')[0],
      photoURL: result.user.photoURL || undefined,
      role: privs.role,
    };

    sessionStorage.setItem('admin_session_auth', JSON.stringify({ user: adminUser, token }));
    notifySuccess(adminUser, token);

    return { user: result.user, accessToken: token };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Sign out of Admin Session
 */
export const signOutAdmin = async (): Promise<void> => {
  try {
    sessionStorage.removeItem('admin_session_auth');
    localStorage.removeItem('admin_session_auth');
    cachedAccessToken = null;
    currentAdminUser = null;
    useOrgStore.getState().disconnectFirebase();
    await signOut(auth);
  } catch (error) {
    console.warn('Sign out notice:', error);
  } finally {
    notifyFailure();
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const getCurrentAdminUser = (): AdminUser | null => {
  return currentAdminUser || getStoredSession()?.user || null;
};

