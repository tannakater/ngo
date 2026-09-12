import { auth, googleProvider, db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useOrgStore } from '../store/useOrgStore';
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
    // 1. First attempt Firebase Auth with Email & Password
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      token = await cred.user.getIdToken();
      cachedAccessToken = token;
      adminUser = {
        uid: cred.user.uid,
        email: cred.user.email || email,
        displayName: cred.user.displayName || email.split('@')[0],
        photoURL: cred.user.photoURL || undefined,
        role: 'admin',
      };
    } catch (fbErr: any) {
      // If sign in fails, try creating the account (handles first-time moderator logins)
      try {
        const newCred = await createUserWithEmailAndPassword(auth, email, password);
        token = await newCred.user.getIdToken();
        cachedAccessToken = token;
        adminUser = {
          uid: newCred.user.uid,
          email: newCred.user.email || email,
          displayName: email.split('@')[0],
          role: 'admin',
        };
      } catch (createErr: any) {
        // If creation fails because it already exists, it means wrong password was entered
        if (createErr.code === 'auth/email-already-in-use') {
          throw new Error('Invalid email or password. Please try again.');
        }
        throw new Error(fbErr.message || 'Authentication failed. Please try again.');
      }
    }

    if (!adminUser) {
      throw new Error('Invalid email or password. Please try again.');
    }
    
    const isMasterAdmin = 
      email.toLowerCase() === 'admin@ngo.org' || 
      email.toLowerCase() === useOrgStore.getState().organization.email.toLowerCase() ||
      email.toLowerCase() === 'prankp343@gmail.com';

    let foundModerator = false;
    let modRole = 'moderator';
    let modName = '';

    if (!isMasterAdmin) {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        usersSnap.forEach(userDoc => {
          const data = userDoc.data();
          if (data.webUsers && Array.isArray(data.webUsers)) {
            const match = data.webUsers.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
            if (match) {
              foundModerator = true;
              modRole = match.role || 'moderator';
              if (match.name) modName = match.name;
            }
          }
        });
      } catch (err) {
        console.warn("Could not fetch users to verify roles", err);
      }

      if (!foundModerator) {
        await signOut(auth);
        throw new Error('Access denied. No administrative privileges found for this account.');
      }
    }

    if (foundModerator) {
      adminUser.role = modRole as any;
      if (modName) adminUser.displayName = modName;
    } else {
      adminUser.role = 'admin';
    }

    // Save session: session-only by default, or localStorage if rememberMe is explicitly checked
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

    const email = result.user.email || '';
    const isMasterAdmin = 
      email.toLowerCase() === 'admin@ngo.org' || 
      email.toLowerCase() === useOrgStore.getState().organization.email.toLowerCase() ||
      email.toLowerCase() === 'prankp343@gmail.com';

    let foundModerator = false;
    let modRole = 'moderator';
    let modName = '';

    if (!isMasterAdmin) {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        usersSnap.forEach(userDoc => {
          const data = userDoc.data();
          if (data.webUsers && Array.isArray(data.webUsers)) {
            const match = data.webUsers.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
            if (match) {
              foundModerator = true;
              modRole = match.role || 'moderator';
              if (match.name) modName = match.name;
            }
          }
        });
      } catch (err) {
        console.warn("Could not fetch users to verify roles", err);
      }

      if (!foundModerator) {
        await signOut(auth); // Sign out of Firebase immediately
        throw new Error('Access denied. This Google account does not have administrative privileges.');
      }
    }

    cachedAccessToken = token;
    const adminUser: AdminUser = {
      uid: result.user.uid,
      email: email || 'admin@domain.org',
      displayName: result.user.displayName || 'Administrator',
      photoURL: result.user.photoURL || undefined,
      role: foundModerator ? (modRole as any) : 'admin',
    };
    if (foundModerator && modName) adminUser.displayName = modName;

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
