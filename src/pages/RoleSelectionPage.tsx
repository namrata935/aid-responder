import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types';
import { Users, HandHeart, Building2, ArrowRight, Droplets, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const roles: { role: UserRole; title: string; description: string; icon: React.ReactNode; color: string }[] = [
  {
    role: 'Victim',
    title: 'Victim',
    description: 'Register for relief assistance and get assigned to the nearest available shelter.',
    icon: <Users className="w-8 h-8" />,
    color: 'border-l-info',
  },
  {
    role: 'Volunteer',
    title: 'Volunteer',
    description: 'Offer your skills and time to help with relief operations. Get AI-assigned tasks.',
    icon: <HandHeart className="w-8 h-8" />,
    color: 'border-l-success',
  },
  {
    role: 'Manager',
    title: 'Shelter Coordinator',
    description: 'Manage your shelter, resources, and create tasks for volunteer assignment.',
    icon: <Building2 className="w-8 h-8" />,
    color: 'border-l-primary',
  },
];

export default function RoleSelectionPage() {
  const { user, selectRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  // Redirect if user already has a role
  React.useEffect(() => {
    if (user?.role) {
      navigate(`/${user.role.toLowerCase()}`, { replace: true });
    }
  }, [user, navigate]);

  const handleRoleSelect = async (role: UserRole) => {
    if (!user) {
      toast.error('Please log in first');
      navigate('/auth');
      return;
    }

    setLoading(true);
    setSelectedRole(role);

    try {
      // 1. Update role in user_roles table
      await selectRole(role);

      // 2. Create role-specific entry
      if (role === 'Victim') {
        const { error } = await supabase
          .from('victims')
          .insert({ 
            id: user.id,
            name: '',
            latitude:'',
            longitude: '',
            medical_condition: '',
          });
        
        if (error && error.code !== '23505') throw error; // Ignore duplicate key errors
      }

      if (role === 'Volunteer') {
        const { error } = await supabase
          .from('volunteers')
          .insert({
            id: user.id,
            name: '',
            contact: '',
            skills: [],
            availability: 'available'
          });
        
        if (error && error.code !== '23505') throw error;
      }

      if (role === 'Manager') {
        const { error } = await supabase
          .from('managers')
          .insert({
            id: user.id,
            manager_name: '',
            contact: ''
          });
        
        if (error && error.code !== '23505') throw error;
      }

      toast.success(`Welcome! You're registered as a ${role}`);
      
      // Navigate to the role's dashboard
      navigate(`/${role.toLowerCase()}`, { replace: true });

    } catch (err: any) {
      console.error('Role selection error:', err);
      toast.error(err.message || 'Failed to select role. Please try again.');
      setLoading(false);
      setSelectedRole(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <div className="p-2 hero-gradient rounded-lg">
            <Droplets className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-foreground">FloodRelief</h1>
            <p className="text-xs text-muted-foreground">Management System</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-12 flex flex-col items-center justify-center">
        <div className="w-full max-w-5xl">
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Choose how you want to <span className="text-gradient">participate</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Select your role to complete your registration and access your dashboard.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {roles.map((item, index) => (
              <Card
                key={item.role}
                variant="stat"
                className={`${item.color} cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-slide-up ${
                  loading && selectedRole === item.role ? 'opacity-50' : ''
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => !loading && handleRoleSelect(item.role)}
              >
                <CardHeader>
                  <div className="p-3 w-fit rounded-xl bg-secondary mb-4">
                    {item.icon}
                  </div>
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                  <CardDescription className="text-base">
                    {item.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between group"
                    disabled={loading}
                  >
                    {loading && selectedRole === item.role ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Setting up...
                      </>
                    ) : (
                      <>
                        Select {item.title}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}