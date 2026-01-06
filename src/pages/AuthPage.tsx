import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'login' | 'signup'>('login');

  const { user, isAuthenticated, isLoading, login, signup } = useAuth();

  // 🔁 AUTH-DRIVEN REDIRECT (ONLY SOURCE OF TRUTH)
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) return;

    if (user?.role) {
      navigate(`/${user.role.toLowerCase()}`, { replace: true });
    } else {
      navigate('/role-selection', { replace: true });
    }
  }, [user, isAuthenticated, isLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Welcome back!');
    } catch {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
  
    try {
      console.log('1️⃣ Account creation started');
  
      await signup(email, password);
  
      console.log('2️⃣ Account created, attempting navigation');
  
      // TEMP DEBUG NAVIGATION
      navigate('/role-selection');
  
      console.log('3️⃣ Navigation called');
    } catch (err) {
      console.error('❌ Signup failed:', err);
      setError('Signup failed');
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Welcome</CardTitle>
          <CardDescription>Login or create an account</CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <Label>Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} />

                <Label>Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

                {error && <p className="text-sm text-destructive flex gap-2">
                  <AlertCircle className="w-4 h-4" /> {error}
                </p>}

                <Button className="w-full" disabled={loading}>
                  Sign In <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <Label>Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} />

                <Label>Password</Label>
                <Input type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />

                {error && <p className="text-sm text-destructive flex gap-2">
                  <AlertCircle className="w-4 h-4" /> {error}
                </p>}

                <Button className="w-full" disabled={loading}>
                  Create Account <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
