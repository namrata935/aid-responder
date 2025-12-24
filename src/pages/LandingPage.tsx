import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Droplets, 
  Users, 
  HandHeart, 
  Building2, 
  ArrowRight, 
  Heart,
  MapPin,
  Shield,
  Zap,
  ChevronRight
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';

export default function LandingPage() {
  const { shelters, resources } = useData();

  const totalCapacity = shelters.reduce((sum, s) => sum + s.totalCapacity, 0);
  const totalOccupancy = shelters.reduce((sum, s) => sum + s.currentOccupancy, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 hero-gradient rounded-lg">
              <Droplets className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">FloodRelief</h1>
              <p className="text-xs text-muted-foreground">Management System</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link to="/donate">
              <Button variant="outline" size="sm">
                <Heart className="w-4 h-4 mr-2" />
                Donate
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 hero-gradient opacity-5" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAwMDAiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-full text-secondary-foreground text-sm mb-6 animate-fade-in">
              <Zap className="w-4 h-4" />
              AI-Powered Disaster Relief Coordination
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-slide-up">
              Coordinating Relief,
              <span className="text-gradient block mt-2">Saving Lives</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
              Our intelligent platform connects victims with shelters, assigns volunteers 
              to critical tasks using AI, and coordinates resources in real-time during 
              flood emergencies.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '200ms' }}>
              <Link to="/auth">
                <Button variant="hero" size="xl">
                  Join Relief Effort
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/donate">
                <Button variant="outline" size="xl">
                  <Heart className="w-5 h-5" />
                  Donate Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary">{shelters.length}</div>
              <div className="text-muted-foreground">Active Shelters</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary">{totalOccupancy}</div>
              <div className="text-muted-foreground">People Sheltered</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary">{totalCapacity - totalOccupancy}</div>
              <div className="text-muted-foreground">Spots Available</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary">24/7</div>
              <div className="text-muted-foreground">Support Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How You Can Help</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Choose your role in the relief effort. Everyone has a part to play.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card variant="interactive" className="border-l-4 border-l-info">
              <CardHeader>
                <div className="p-3 w-fit rounded-xl bg-info/10 text-info mb-4">
                  <Users className="w-8 h-8" />
                </div>
                <CardTitle>For Victims</CardTitle>
                <CardDescription>
                  Register quickly and get assigned to the nearest shelter with available capacity.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-info" />
                    Quick registration process
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-info" />
                    Automatic shelter allocation
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-info" />
                    Distance-optimized assignment
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card variant="interactive" className="border-l-4 border-l-success">
              <CardHeader>
                <div className="p-3 w-fit rounded-xl bg-success/10 text-success mb-4">
                  <HandHeart className="w-8 h-8" />
                </div>
                <CardTitle>For Volunteers</CardTitle>
                <CardDescription>
                  Share your skills and get AI-matched to tasks where you can make the biggest impact.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-success" />
                    Skill-based task matching
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-success" />
                    AI-powered assignment
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-success" />
                    Real-time task updates
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card variant="interactive" className="border-l-4 border-l-primary">
              <CardHeader>
                <div className="p-3 w-fit rounded-xl bg-primary/10 text-primary mb-4">
                  <Building2 className="w-8 h-8" />
                </div>
                <CardTitle>For Coordinators</CardTitle>
                <CardDescription>
                  Manage your shelter, track resources, create tasks, and coordinate relief efforts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-primary" />
                    Shelter management
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-primary" />
                    Resource tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-primary" />
                    AI task assignment
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Powered by AI</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Our intelligent system automates critical decisions to save time during emergencies.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="flex gap-4 p-6 bg-card rounded-xl shadow-card">
              <div className="p-3 h-fit rounded-lg bg-primary/10">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Smart Shelter Allocation</h3>
                <p className="text-sm text-muted-foreground">
                  Automatically finds the nearest shelter with available capacity for victims.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-6 bg-card rounded-xl shadow-card">
              <div className="p-3 h-fit rounded-lg bg-success/10">
                <Zap className="w-6 h-6 text-success" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">AI Task Assignment</h3>
                <p className="text-sm text-muted-foreground">
                  Matches tasks to volunteers based on skills, availability, and location.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-6 bg-card rounded-xl shadow-card">
              <div className="p-3 h-fit rounded-lg bg-info/10">
                <Shield className="w-6 h-6 text-info" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Real-time Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  Live updates on shelter capacity, resources, and task status.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="hero-gradient text-primary-foreground overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
            <CardContent className="relative py-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Make a Difference?
              </h2>
              <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
                Join our relief coordination platform and help save lives during flood emergencies.
              </p>
              <Link to="/auth">
                <Button size="xl" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                  Get Started Now
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-card">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 hero-gradient rounded-lg">
                <Droplets className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold">FloodRelief Management System</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 FloodRelief. Built with compassion for disaster relief.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
