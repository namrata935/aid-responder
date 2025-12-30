import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types';
import { Users, HandHeart, Building2, ArrowRight, Droplets } from 'lucide-react';

const roles: { role: UserRole; title: string; description: string; icon: React.ReactNode; color: string }[] = [
  {
    role: 'victim',
    title: 'Victim',
    description: 'Register for relief assistance and get assigned to the nearest available shelter.',
    icon: <Users className="w-8 h-8" />,
    color: 'border-l-info',
  },
  {
    role: 'volunteer',
    title: 'Volunteer',
    description: 'Offer your skills and time to help with relief operations. Get AI-assigned tasks.',
    icon: <HandHeart className="w-8 h-8" />,
    color: 'border-l-success',
  },
  {
    role: 'coordinator',
    title: 'Shelter Coordinator',
    description: 'Manage your shelter, resources, and create tasks for volunteer assignment.',
    icon: <Building2 className="w-8 h-8" />,
    color: 'border-l-primary',
  },
];

export default function RoleSelectionPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user?.role) {
      navigate(`/${user.role}`);
    }
  }, [user, navigate]);

  const handleRoleSelect = (role: UserRole) => {
    // Go straight to that role's dashboard in signup mode
    if (role === 'victim') {
      navigate('/victim?signup=true');
    } else if (role === 'volunteer') {
      navigate('/volunteer?signup=true');
    } else if (role === 'coordinator') {
      navigate('/coordinator?signup=true');
    }
  };

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
              Click a role below. You'll be taken to that dashboard, where you can enter your email
              and password to create your account for that role.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {roles.map((item, index) => (
              <Card
                key={item.role}
                variant="stat"
                className={`${item.color} cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-slide-up`}
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => handleRoleSelect(item.role)}
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
                  <Button variant="ghost" className="w-full justify-between group">
                    Go to {item.title} dashboard
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
