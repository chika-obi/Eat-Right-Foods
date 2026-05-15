import React from 'react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isConfirmedAdmin: boolean;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isConfirmedAdmin: false,
  logout: async () => {},
});

const ADMIN_EMAILS = ['kpanukuchikaobi@gmail.com'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isConfirmedAdmin, setIsConfirmedAdmin] = React.useState(false);

  const isAdmin = user ? ADMIN_EMAILS.includes(user.email || '') : false;

  const logout = async () => {
    try {
      await auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  React.useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;
    let unsubscribeAdmin: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      // Cleanup previous subscriptions
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }
      if (unsubscribeAdmin) {
        unsubscribeAdmin();
        unsubscribeAdmin = null;
      }

      if (user) {
        const profileRef = doc(db, 'profiles', user.uid);
        
        // Super-admin auto-seed
        if (ADMIN_EMAILS.includes(user.email || '')) {
          const adminRef = doc(db, 'admins', user.uid);
          getDoc(adminRef).then(snap => {
            if (!snap.exists()) {
              setDoc(adminRef, { role: 'superadmin', seeded: true }).catch(console.error);
            }
          });
        }

        // Listen to admin status
        const adminRef = doc(db, 'admins', user.uid);
        unsubscribeAdmin = onSnapshot(adminRef, (snap) => {
          setIsConfirmedAdmin(snap.exists());
        }, (err) => {
          console.error('Admin status sync error:', err);
          // If we can't read the admin doc, we assume they aren't an admin
          setIsConfirmedAdmin(false);
          if (auth.currentUser?.uid === user.uid) {
            handleFirestoreError(err, OperationType.GET, `admins/${user.uid}`);
          }
        });

        // Listen to profile changes
        unsubscribeProfile = onSnapshot(profileRef, (snapshot) => {
          if (snapshot.exists()) {
            setProfile({ id: user.uid, ...snapshot.data() } as UserProfile);
          } else {
            // Create default profile if it doesn't exist
            const newProfile: Omit<UserProfile, 'id'> = {
              displayName: user.displayName || 'Guest',
              email: user.email || '',
              addresses: [],
              paymentMethods: [],
            };
            setDoc(profileRef, newProfile).catch(err => {
              // Only handle error if we are still authenticated as this user
              if (auth.currentUser?.uid === user.uid) {
                handleFirestoreError(err, OperationType.WRITE, `profiles/${user.uid}`);
              }
            });
            setProfile({ id: user.uid, ...newProfile });
          }
          setLoading(false);
        }, (err) => {
          // Only handle error if we are still authenticated as this user
          if (auth.currentUser?.uid === user.uid) {
            handleFirestoreError(err, OperationType.GET, `profiles/${user.uid}`);
          }
          setLoading(false);
        });
      } else {
        setProfile(null);
        setIsConfirmedAdmin(false);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
      if (unsubscribeAdmin) unsubscribeAdmin();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, isConfirmedAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => React.useContext(AuthContext);
