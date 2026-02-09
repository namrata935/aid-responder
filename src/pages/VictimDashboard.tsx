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
import { MapPreview } from '@/components/MapPreview';

   
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
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { Shelter } from '@/types';
import { supabase } from '@/lib/supabase';

export default function VictimDashboard() {
  const { user, logout } = useAuth();
  const { getShelterById, findNearestAvailableShelter } = useData();
  const navigate = useNavigate();
  
  const [isRegistered, setIsRegistered] = useState(false);
  const [assignedShelter, setAssignedShelter] = useState<{ shelter: Shelter; distance: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '' as 'male' | 'female' | 'other' | '',
    medicalCondition: '',
    address: '',
    latitude: '',
    longitude: '',
  });

  const [geocoding, setGeocoding] = useState(false);

  React.useEffect(() => {
    if (!user || user.role !== 'Victim') {
      navigate('/auth');
    } else {
      // Check if victim is already registered
      checkExistingRegistration();
    }
  }, [user, navigate]);

  const checkExistingRegistration = async () => {
    if (!user) return;
    
    try {
      const { data: victimData, error } = await supabase
        .from('victims')
        .select('*, shelters(*)')
        .eq('id', user.id)
        .single();

      if (error) {
        // No registration found, that's okay
        if (error.code === 'PGRST116') return;
        console.error('Error checking registration:', error);
        return;
      }

      // If victim has valid data (not just placeholder), show their assigned shelter
      if (victimData && victimData.name && victimData.shelter_id && victimData.shelters) {
        const shelter: Shelter = {
          id: victimData.shelters.id,
          name: victimData.shelters.name,
          address: victimData.shelters.address,
          city: victimData.shelters.city,
          state: victimData.shelters.state,
          pincode: victimData.shelters.pincode,
          latitude: parseFloat(victimData.shelters.latitude),
          longitude: parseFloat(victimData.shelters.longitude),
          capacity: victimData.shelters.capacity ?? 0,
          current_occupancy: victimData.shelters.current_occupancy ?? 0,
          contact: victimData.shelters.contact,
          manager_id: victimData.shelters.manager_id,
        };

        // Calculate distance
        const victimLocation = {
          latitude: parseFloat(victimData.latitude),
          longitude: parseFloat(victimData.longitude),
        };
        
        const R = 6371;
        const dLat = (shelter.latitude - victimLocation.latitude) * Math.PI / 180;
        const dLon = (shelter.longitude - victimLocation.longitude) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(victimLocation.latitude * Math.PI / 180) * Math.cos(shelter.latitude * Math.PI / 180) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = Math.round((R * c) * 10) / 10;

        setAssignedShelter({ shelter, distance });
        setIsRegistered(true);
      }
    } catch (err) {
      console.error('Error checking existing registration:', err);
    }
  };

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

  const handleGeocodeAddress = async () => {
    if (!formData.address || !formData.address.trim()) {
      toast.error('Please enter an address first');
      return;
    }

    setGeocoding(true);
    try {
      // Use OpenStreetMap Nominatim API (free, no API key needed)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.address)}&limit=1`,
        {
          headers: {
            'User-Agent': 'FloodReliefApp/1.0' // Required by Nominatim
          }
        }
      );

      if (!response.ok) {
        throw new Error('Geocoding service unavailable');
      }

      const data = await response.json();

      if (!data || data.length === 0) {
        toast.error('Address not found. Please try a more specific address.');
        return;
      }

      const { lat, lon } = data[0];

      setFormData(prev => ({
        ...prev,
        latitude: parseFloat(lat).toFixed(6),
        longitude: parseFloat(lon).toFixed(6),
      }));

      toast.success('Coordinates found from address!');
    } catch (err: any) {
      console.error('Geocoding error:', err);
      toast.error(err.message || 'Failed to get coordinates from address');
    } finally {
      setGeocoding(false);
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

    if (!user) {
      toast.error('User not found');
      setIsLoading(false);
      return;
    }

    try {
      const victimLocation = {
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
      };

      console.log('🔍 Victim Location:', victimLocation);

      // Find nearest available shelter
      const result = await findNearestAvailableShelter(victimLocation);

      console.log('🏠 Nearest Shelter Result:', result);

      // Prepare victim data
      const victimDataToInsert = {
        id: user.id,
        name: formData.name,
        age: parseInt(formData.age),
        gender: formData.gender,
        latitude: formData.latitude,
        longitude: formData.longitude,
        medical_condition: formData.medicalCondition || null,
        shelter_id: result?.shelter.id || null, // Will be null if no shelter found
      };

      console.log('💾 Inserting victim data:', victimDataToInsert);

      // Insert or update victim into Supabase
      const { data: victimData, error: victimError } = await supabase
        .from('victims')
        .insert(victimDataToInsert)
        .select()
        .single();

      if (victimError) {
        // If victim already exists, update instead
        if (victimError.code === '23505') {
          const { error: updateError } = await supabase
            .from('victims')
            .update(victimDataToInsert)
            .eq('id', user.id);
          
          if (updateError) throw updateError;
        } else {
          throw victimError;
        }
      }

      // If a shelter was found, update its occupancy
      if (result) {
        const currentOccupancy = result.shelter.current_occupancy || 0;
        const newOccupancy = currentOccupancy + 1;
        const { error: shelterError } = await supabase
          .from('shelters')
          .update({ 
            current_occupancy: newOccupancy
          })
          .eq('id', result.shelter.id);

        if (shelterError) throw shelterError;

        // Set assigned shelter for display with updated occupancy
        setAssignedShelter({
          shelter: {
            ...result.shelter,
            current_occupancy: newOccupancy
          },
          distance: result.distance,
        });
        setIsRegistered(true);
        toast.success('You have been assigned to a shelter!');
      } else {
        // No shelter available, but victim is registered
        toast.warning('You have been registered, but no shelters are currently available. We will contact you when space becomes available.');
        setIsRegistered(false); // Keep them on the form page but show a message
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
                    <span className="text-sm">{assignedShelter.shelter.contact}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-xl text-center">
                  <div className="text-2xl font-bold text-primary">
                    {assignedShelter.shelter.current_occupancy ?? 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Current Occupancy</div>
                </div>
                <div className="p-4 bg-muted/50 rounded-xl text-center">
                  <div className="text-2xl font-bold text-primary">
                    {assignedShelter.shelter.capacity ?? 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Capacity</div>
                </div>
              </div>

              {/* Interactive Map Preview */}
              <MapPreview
                latitude={assignedShelter.shelter.latitude}
                longitude={assignedShelter.shelter.longitude}
                name={assignedShelter.shelter.name}
                city={assignedShelter.shelter.city}
                state={assignedShelter.shelter.state}
              />

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
                <div className="space-y-2">
                  <Label htmlFor="address">Address (Optional - for geocoding)</Label>
                  <Input
                    id="address"
                    placeholder="e.g., 123 Main Street, City, State, Pincode"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Location *</Label>
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={handleGeocodeAddress}
                        disabled={geocoding}
                      >
                        {geocoding ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Finding...
                          </>
                        ) : (
                          <>
                            <MapPin className="w-4 h-4 mr-2" />
                            Get from Address
                          </>
                        )}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={handleUseMyLocation}
                        disabled={geocoding}
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        Use My Location
                      </Button>
                    </div>
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