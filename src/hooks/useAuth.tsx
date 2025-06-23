
import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/candidate';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('useAuth: Starting auth initialization');
    
    let mounted = true;
    let authTimeout: NodeJS.Timeout;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('useAuth: Auth state changed:', event, session?.user?.id || 'No session');
        
        if (!mounted) {
          console.log('useAuth: Component unmounted, ignoring auth state change');
          return;
        }

        // Clear any existing timeout
        if (authTimeout) {
          clearTimeout(authTimeout);
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('useAuth: User found, fetching profile');
          // Use setTimeout to prevent potential deadlocks
          setTimeout(() => {
            if (mounted) {
              fetchProfile(session.user.id);
            }
          }, 0);
        } else {
          console.log('useAuth: No user, clearing profile');
          setProfile(null);
        }
        
        // Set loading to false after processing
        setTimeout(() => {
          if (mounted) {
            console.log('useAuth: Setting loading to false');
            setLoading(false);
          }
        }, 100);
      }
    );

    // THEN get initial session with timeout
    const getInitialSession = async () => {
      try {
        console.log('useAuth: Getting initial session');
        
        // Set a timeout to prevent infinite loading
        authTimeout = setTimeout(() => {
          if (mounted) {
            console.log('useAuth: Session check timed out, setting loading to false');
            setLoading(false);
          }
        }, 5000);

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) {
          console.log('useAuth: Component unmounted during session check');
          return;
        }
        
        // Clear timeout since we got a response
        if (authTimeout) {
          clearTimeout(authTimeout);
        }

        if (error) {
          console.error('useAuth: Error getting session:', error);
          setLoading(false);
          return;
        }

        console.log('useAuth: Initial session result:', session?.user?.id || 'No session');
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('useAuth: Error in getInitialSession:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    return () => {
      console.log('useAuth: Cleaning up subscription');
      mounted = false;
      if (authTimeout) {
        clearTimeout(authTimeout);
      }
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('useAuth: Fetching profile for user:', userId);
      
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('useAuth: Error fetching profile:', error);
        if (error.code === 'PGRST116') {
          console.log('useAuth: Profile not found, user might be new');
          setProfile(null);
        }
        return;
      }
      
      console.log('useAuth: Profile fetched successfully:', profileData?.email);
      setProfile(profileData);
    } catch (error) {
      console.error('useAuth: Error in fetchProfile:', error);
      setProfile(null);
    }
  };

  const signOut = async () => {
    console.log('useAuth: Signing out');
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (error) {
      console.error('useAuth: Error signing out:', error);
    }
  };

  console.log('useAuth: Current state - loading:', loading, 'user:', user?.id || 'null', 'profile:', profile?.email || 'null');

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
