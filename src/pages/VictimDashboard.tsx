import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Droplets, 
  MapPin, 
  User, 
  Calendar, 
  Heart,
  Building2,
  Phone,
  Navigation,
  CheckCircle,
  LogOut,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Shelter } from '@/types';

export default function VictimDashboard() {
  const { user, logout } = useAuth();
  const { registerVictim, getShelterById } = useData();
  const navigate = useNavigate();
  
  const [isRegistered, setIsRegistered] = useState(false);
  const [assignedShelter, setAssignedShelter] = useState<{ shelter: Shelter; distance: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '' as 'male' | 'female' | 'other' | '',
    medicalCondition: '',
    latitude: '',
    longitude: '',
  });

  React.useEffect(() => {
    if (!user || user.role !== 'victim') {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          }));
          toast.success('Location detected successfully!');
        },
        () => {
          toast.error('Unable to get your location. Please enter manually.');
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.gender) {
      toast.error('Please select your gender');
      setIsLoading(false);
      return;
    }

    try {
      const result = registerVictim({
        visitorId: user?.id || '',
        name: formData.name,
        age: parseInt(formData.age),
        gender: formData.gender,
        medicalCondition: formData.medicalCondition || undefined,
        location: {
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
        },
      });

      if (result.shelter) {
        setAssignedShelter({
          shelter: result.shelter,
          distance: Math.round(
            calculateDistance(
              { latitude: parseFloat(formData.latitude), longitude: parseFloat(formData.longitude) },
              result.shelter.location
            ) * 10
          ) / 10,
        });
        setIsRegistered(true);
        toast.success('You have been assigned to a shelter!');
      } else {
        toast.error('No available shelters found. Please try again later.');
      }
    } catch (error) {
      toast.error('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDistance = (loc1: { latitude: number; longitude: number }, loc2: { latitude: number; longitude: number }) => {
    const R = 6371;
    const dLat = (loc2.latitude - loc1.latitude) * Math.PI / 180;
    const dLon = (loc2.longitude - loc1.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(loc1.latitude * Math.PI / 180) * Math.cos(loc2.latitude * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (isRegistered && assignedShelter) {
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
                <p className="text-xs text-muted-foreground">Victim Portal</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-2xl">
          {/* Success Message */}
          <Card className="border-success/30 bg-success/5 mb-8 animate-scale-in">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-success/20 rounded-full">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-success">Registration Successful!</h2>
                  <p className="text-muted-foreground">You have been assigned to a shelter.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shelter Details */}
          <Card variant="elevated" className="animate-slide-up">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-primary" />
                <CardTitle>Your Assigned Shelter</CardTitle>
              </div>
              <CardDescription>
                Please proceed to this shelter as soon as possible
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-secondary/50 rounded-xl">
                <h3 className="text-xl font-semibold mb-2">{assignedShelter.shelter.name}</h3>
                <p className="text-muted-foreground mb-4">{assignedShelter.shelter.address}</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-sm">
                      <strong>{assignedShelter.distance}</strong> km away
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" />
                    <span className="text-sm">{assignedShelter.shelter.contactNumber}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-xl text-center">
                  <div className="text-2xl font-bold text-primary">
                    {assignedShelter.shelter.currentOccupancy}
                  </div>
                  <div className="text-sm text-muted-foreground">Current Occupancy</div>
                </div>
                <div className="p-4 bg-muted/50 rounded-xl text-center">
                  <div className="text-2xl font-bold text-primary">
                    {assignedShelter.shelter.totalCapacity}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Capacity</div>
                </div>
              </div>

              {/* Map Preview Placeholder */}
              <div className="aspect-video bg-secondary/50 rounded-xl flex items-center justify-center border-2 border-dashed border-border">
                <div className="text-center text-muted-foreground">
                  <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Map Preview</p>
                  <p className="text-xs">
                    {assignedShelter.shelter.city}, {assignedShelter.shelter.state}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-info/10 border border-info/30 rounded-xl">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-info mb-1">Important Information</p>
                    <p className="text-muted-foreground">
                      Please bring valid identification if possible. The shelter will provide 
                      food, water, and basic medical assistance. Contact the shelter if you 
                      need transportation assistance.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

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
              <p className="text-xs text-muted-foreground">Victim Portal</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">Victim Registration</h1>
          <p className="text-muted-foreground">
            Register your details to be assigned to the nearest available shelter
          </p>
        </div>

        <Card variant="elevated" className="animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Please provide accurate information for relief coordination
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age *</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="Enter your age"
                    min="0"
                    max="120"
                    value={formData.age}
                    onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select 
                  value={formData.gender} 
                  onValueChange={(value: 'male' | 'female' | 'other') => 
                    setFormData(prev => ({ ...prev, gender: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="medical">Medical Condition (Optional)</Label>
                <Textarea
                  id="medical"
                  placeholder="Enter any medical conditions or special needs..."
                  value={formData.medicalCondition}
                  onChange={(e) => setFormData(prev => ({ ...prev, medicalCondition: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Location *</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={handleUseMyLocation}
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Use My Location
                  </Button>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      placeholder="e.g., 19.0760"
                      value={formData.latitude}
                      onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      placeholder="e.g., 72.8777"
                      value={formData.longitude}
                      onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" variant="hero" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? 'Finding Shelter...' : 'Register & Find Shelter'}
                <MapPin className="w-4 h-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
