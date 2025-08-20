
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

    // Set up auth state listener - CRITICAL: Keep this synchronous to prevent deadlocks
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('useAuth: Auth state changed:', event, session?.user?.id || 'No session');
        
        if (!mounted) return;

        // Only do synchronous state updates here
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Defer any Supabase calls to prevent deadlocks
        if (session?.user) {
          console.log('useAuth: User found, scheduling profile fetch');
          setTimeout(() => {
            if (mounted) {
              fetchProfile(session.user.id);
            }
          }, 0);
        } else {
          console.log('useAuth: No user, clearing profile');
          setProfile(null);
        }
      }
    );

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('useAuth: Getting initial session');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('useAuth: Error getting session:', error);
          setLoading(false);
          return;
        }

        console.log('useAuth: Initial session result:', session?.user?.id || 'No session');
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Don't block on profile fetch
          setLoading(false);
          fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
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
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error('useAuth: Error fetching profile:', error);
        return;
      }
      
      if (!profileData) {
        console.log('useAuth: No profile found, creating basic one');
        // Create a basic profile if none exists
        const newProfile = {
          id: userId,
          email: user?.email || '',
          full_name: user?.email?.split('@')[0] || 'User',
          is_admin: false
        };
        
        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .maybeSingle();
        
        if (createError) {
          console.error('useAuth: Error creating profile:', createError);
        } else if (createdProfile) {
          console.log('useAuth: Profile created successfully');
          setProfile(createdProfile as Profile);
        }
      } else {
        console.log('useAuth: Profile fetched successfully:', profileData?.email);
        setProfile(profileData as Profile);
      }
    } catch (error) {
      console.error('useAuth: Error in fetchProfile:', error);
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
