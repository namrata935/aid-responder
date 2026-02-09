import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Droplets, 
  ArrowLeft,
  Building2,
  MapPin,
  Package,
  Loader2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

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
    console.log('1️⃣ Calling signup...');
    const newUser = await signup(email, password);
    console.log('2️⃣ Signup completed');
    
    if (newUser) {
      toast.success('Account created!');
      navigate('/role-selection', { replace: true });
    }
  } catch (err: any) {
    console.error('❌ Signup failed:', err);
    setError(err.message || 'Signup failed');
    setLoading(false);
  }
};
  

  return (
    
    <div className="min-h-screen relative overflow-hidden">
  {/* Blurred background */}
  <div
    className="absolute inset-0 bg-cover bg-center scale-105 blur-sm" 
    style={{ backgroundImage: "url('/flood-bg.jpg')" }}
  />

  {/* Dark overlay for contrast */}
  <div className="absolute inset-0 bg-black/40" />

  {/* Foreground content */}
  <div className="relative z-10 min-h-screen flex flex-col">
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 hero-gradient rounded-lg">
              <Droplets className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">FloodRelief</h1>
              <p className="text-xs text-muted-foreground">Resource Status</p>
            </div>
          </div>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center p-8">
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
    
  </div>
</div>


      
  );
}
