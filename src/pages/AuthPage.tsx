import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Droplets, Shield, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, signup, user, selectRole } = useAuth();
  const navigate = useNavigate();

  // If user is already logged in, redirect to role selection or dashboard
  React.useEffect(() => {
    if (user) {
      if (user.role) {
        navigate(`/${user.role}`);
      } else {
        navigate('/role-selection');
      }
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await login(email, password);
      toast.success('Welcome back!');
    } catch (err) {
      setError('Invalid credentials. Please try again or sign up.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await signup(email, password);
      toast.success('Account created successfully!');
      navigate('/role-selection');
    } catch (err) {
      setError('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSignup = async (e: React.MouseEvent, role: UserRole) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signup(email, password);
      // Immediately set role for the new user and go to the correct dashboard
      selectRole(role);
      toast.success(
        role === 'volunteer'
          ? 'Account created as Volunteer!'
          : 'Account created as Shelter Coordinator!'
      );
      navigate(`/${role}`);
    } catch (err) {
      setError('Failed to create account. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        
        <div className="relative z-10 flex flex-col justify-center px-12 text-primary-foreground">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-primary-foreground/20 rounded-xl backdrop-blur-sm">
              <Droplets className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">FloodRelief</h1>
              <p className="text-primary-foreground/80 text-sm">Management System</p>
            </div>
          </div>
          
          <h2 className="text-4xl font-bold mb-6 leading-tight">
            Coordinating Relief,<br />
            Saving Lives
          </h2>
          
          <p className="text-lg text-primary-foreground/90 mb-8 max-w-md">
            AI-powered disaster relief coordination connecting victims, volunteers, 
            and shelter coordinators for efficient emergency response.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-foreground/20 rounded-lg">
                <Shield className="w-5 h-5" />
              </div>
              <span>Automated shelter allocation for victims</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-foreground/20 rounded-lg">
                <Shield className="w-5 h-5" />
              </div>
              <span>AI-driven volunteer task assignment</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-foreground/20 rounded-lg">
                <Shield className="w-5 h-5" />
              </div>
              <span>Real-time resource & donation tracking</span>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-primary/50 to-transparent" />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary-foreground/10 rounded-full blur-3xl" />
        <div className="absolute top-20 -right-10 w-40 h-40 bg-primary-foreground/10 rounded-full blur-2xl" />
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="p-3 hero-gradient rounded-xl">
              <Droplets className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">FloodRelief</h1>
              <p className="text-muted-foreground text-sm">Management System</p>
            </div>
          </div>

          <Card variant="elevated" className="animate-fade-in">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Welcome</CardTitle>
              <CardDescription>
                Sign in to your account or create a new one
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 text-destructive text-sm p-3 bg-destructive/10 rounded-lg">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                      </div>
                    )}
                    
                    <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                      {isLoading ? 'Signing in...' : 'Sign In'}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="Create a password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10"
                          minLength={6}
                          required
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Password must be at least 6 characters
                      </p>
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 text-destructive text-sm p-3 bg-destructive/10 rounded-lg">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                      </div>
                    )}

                    <div className="space-y-3">
                      <Button
                        type="submit"
                        variant="hero"
                        className="w-full"
                        size="lg"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Creating Account...' : 'Create Account & Choose Role'}
                        <ArrowRight className="w-4 h-4" />
                      </Button>

                      <div className="text-xs text-muted-foreground text-center mt-1">
                        Or get started directly as:
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isLoading}
                          onClick={(e) => handleRoleSignup(e, 'volunteer')}
                        >
                          Signup as Volunteer
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isLoading}
                          onClick={(e) => handleRoleSignup(e, 'coordinator')}
                        >
                          Signup as Shelter Manager
                        </Button>
                      </div>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            By continuing, you agree to help save lives during emergencies.
          </p>
        </div>
      </div>
    </div>
  );
}
