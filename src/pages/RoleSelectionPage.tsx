import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, HandHeart, Building2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { UserRole } from '@/types';

export default function RoleSelectionPage() {
  const { user, selectRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // ✅ Only redirect if role already exists
  useEffect(() => {
    if (user?.role) {
      navigate(`/${user.role.toLowerCase()}`, { replace: true });
    }
  }, [user, navigate]);

  const handleSelect = async (role: UserRole) => {
    if (!user) return;

    setLoading(true);
    try {
      await selectRole(role);

      if (role === 'Victim') {
        await supabase.from('flood_management.victims').insert({ id: user.id });
      }
      if (role === 'Volunteer') {
        await supabase.from('flood_management.volunteers').insert({
          id: user.id,
          name: '',
          contact: '',
          skills: [],
        });
      }
      if (role === 'Manager') {
        await supabase.from('flood_management.managers').insert({
          id: user.id,
          manager_name: '',
          contact: '',
        });
      }

      toast.success(`Registered as ${role}`);
      navigate(`/${role.toLowerCase()}`, { replace: true });
    } catch (e) {
      console.error(e);
      toast.error('Role selection failed');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Preparing your account…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center gap-6">
      {[
        { role: 'Victim', icon: <Users />, title: 'Victim' },
        { role: 'Volunteer', icon: <HandHeart />, title: 'Volunteer' },
        { role: 'Manager', icon: <Building2 />, title: 'Coordinator' },
      ].map(({ role, icon, title }) => (
        <Card key={role} onClick={() => handleSelect(role as UserRole)}>
          <CardHeader>
            {icon}
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button disabled={loading}>Select</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
