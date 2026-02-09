import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TasksSection } from '@/components/coordinator/TasksSection';
import { 
  Droplets, 
  Building2,
  Package,
  ClipboardList,
  Users,
  LogOut,
  Plus,
  RefreshCw,
  MapPin,
  Phone,
  Bot,
  AlertTriangle,
  Minus,
  CheckCircle,
  Clock,
  Zap,
  Loader2,
  Navigation
} from 'lucide-react';
import { toast } from 'sonner';

const RESOURCE_TYPES = ['food', 'water', 'medicine', 'clothes', 'blankets', 'other'] as const;

type ResourceType = typeof RESOURCE_TYPES[number];
type TaskPriority = 'High' | 'Medium' | 'Low';
type TaskStatus = 'Created' | 'Assigned' | 'Completed';

interface Shelter {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  capacity: number;
  current_occupancy: number;
  contact: string;
  manager_id: string;
}

interface Resource {
  resource_id: number;
  shelter_id: number;
  type: string;
  quantity: number;
  needed: number;
  last_updated: string;
}

interface Task {
  task_id: number;
  shelter_id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  volunteers_required: number;
  created_at: string;
}

interface ManagerProfile {
  id: string;
  manager_name: string;
  contact: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
}

export default function CoordinatorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [profile, setProfile] = useState<ManagerProfile | null>(null);
  const [shelter, setShelter] = useState<Shelter | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Check authentication and load data
  useEffect(() => {
    if (!user || user.role !== 'Manager') {
      navigate('/auth');
      return;
    }

    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    if (!user) return;

    try {
      // Load manager profile
      const { data: managerData, error: managerError } = await supabase
        .from('managers')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      // If no manager row exists or profile is incomplete, show setup
      if (!managerData || !managerData.manager_name || !managerData.contact || !managerData.city) {
        setProfile(managerData);
        setIsSetupMode(true);
        setIsLoading(false);
        return;
      }

      setProfile(managerData);

      // Load shelter managed by this manager
      const { data: shelterData, error: shelterError } = await supabase
        .from('shelters')
        .select('*')
        .eq('manager_id', user.id)
        .maybeSingle();

      if (shelterError) {
        console.error('Shelter load error:', shelterError);
      }

      if (!shelterData) {
        setIsSetupMode(true);
        setIsLoading(false);
        return;
      }

      setShelter(shelterData);

      // Load resources for this shelter
      const { data: resourcesData, error: resourcesError } = await supabase
        .from('resources')
        .select('*')
        .eq('shelter_id', shelterData.id);

      if (resourcesError) throw resourcesError;
      setResources(resourcesData || []);

      // Load tasks for this shelter
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('shelter_id', shelterData.id)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);

    } catch (err: any) {
      console.error('Error loading data:', err);
      if (err.code === 'PGRST116') {
        setIsSetupMode(true);
      } else {
        toast.error('Failed to load dashboard data');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      logout();
      navigate('/auth', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
      toast.error('Logout failed');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (isSetupMode) {
    return (
      <ShelterSetup 
        userId={user?.id || ''} 
        profile={profile}
        onComplete={() => {
          setIsSetupMode(false);
          loadData();
        }}
        onLogout={handleLogout}
      />
    );
  }

  if (!shelter || !profile) {
    return null;
  }

  const activeTasksCount = tasks.filter(t => t.status !== 'Completed').length;

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
              <p className="text-xs text-muted-foreground">Coordinator Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="default">{shelter.name}</Badge>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Resources
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Tasks
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="animate-fade-in">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <StatCard 
                title="Shelter Capacity"
                value={`${shelter.current_occupancy}/${shelter.capacity}`}
                subtitle="people"
                icon={<Users className="w-5 h-5" />}
                color="primary"
              />
              <StatCard 
                title="Resources"
                value={resources.length.toString()}
                subtitle="types tracked"
                icon={<Package className="w-5 h-5" />}
                color="info"
              />
              <StatCard 
                title="Active Tasks"
                value={activeTasksCount.toString()}
                subtitle="pending"
                icon={<ClipboardList className="w-5 h-5" />}
                color="warning"
              />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Shelter Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{shelter.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Contact</p>
                      <p className="font-medium">{shelter.contact}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">
                        {shelter.address}, {shelter.city}, {shelter.state} - {shelter.pincode}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Capacity Utilization</span>
                      <span>{Math.round((shelter.current_occupancy / shelter.capacity) * 100)}%</span>
                    </div>
                    <Progress 
                      value={(shelter.current_occupancy / shelter.capacity) * 100} 
                      className="h-3"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Manager Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Manager Name</p>
                      <p className="font-medium">{profile.manager_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Manager Contact</p>
                      <p className="font-medium">{profile.contact}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">
                        {profile.city}, {profile.state} - {profile.pincode}
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-secondary/50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="font-medium">Coordinates</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {shelter.latitude.toFixed(4)}, {shelter.longitude.toFixed(4)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="animate-fade-in">
            <ResourcesSection 
              resources={resources} 
              shelterId={shelter.id}
              onResourcesChange={loadData}
            />
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="animate-fade-in">
            <TasksSection 
              tasks={tasks}
              shelterId={shelter.id}
              shelterName={shelter.name}
              onTasksChange={loadData}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, color }: { 
  title: string; 
  value: string; 
  subtitle: string;
  icon: React.ReactNode;
  color: 'primary' | 'info' | 'warning' | 'success';
}) {
  const colorClasses = {
    primary: 'border-l-primary bg-primary/5',
    info: 'border-l-info bg-info/5',
    warning: 'border-l-warning bg-warning/5',
    success: 'border-l-success bg-success/5',
  };

  return (
    <Card variant="stat" className={colorClasses[color]}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className={`p-3 rounded-xl bg-${color}/10 text-${color}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ShelterSetup({ 
  userId, 
  profile,
  onComplete,
  onLogout
}: { 
  userId: string;
  profile: ManagerProfile | null;
  onComplete: () => void;
  onLogout: () => void;
}) {
  const [step, setStep] = useState<'profile' | 'shelter'>(() => {
    // Only go to shelter step if profile exists AND is complete
    if (profile && profile.manager_name && profile.contact && profile.city) {
      return 'shelter';
    }
    return 'profile';
  });
  const [loading, setLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [geocoding, setGeocoding] = useState({ profile: false, shelter: false });
  
  const [profileForm, setProfileForm] = useState({
    manager_name: profile?.manager_name || '',
    contact: profile?.contact || '',
    city: profile?.city || '',
    state: profile?.state || '',
    pincode: profile?.pincode || '',
    address: '',
    latitude: profile?.latitude?.toString() || '',
    longitude: profile?.longitude?.toString() || '',
  });

  const [shelterForm, setShelterForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    latitude: '',
    longitude: '',
    capacity: '',
    contact: '',
  });

  const handleDetectLocation = (isProfile: boolean) => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (isProfile) {
          setProfileForm(prev => ({
            ...prev,
            latitude: latitude.toFixed(6),
            longitude: longitude.toFixed(6),
          }));
        } else {
          setShelterForm(prev => ({
            ...prev,
            latitude: latitude.toFixed(6),
            longitude: longitude.toFixed(6),
          }));
        }
        toast.success('Location detected successfully!');
        setDetectingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Failed to detect location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        toast.error(errorMessage);
        setDetectingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleGeocodeAddress = async (isProfile: boolean) => {
    const address = isProfile 
      ? `${profileForm.address}, ${profileForm.city}, ${profileForm.state} ${profileForm.pincode}`.trim()
      : `${shelterForm.address}, ${shelterForm.city}, ${shelterForm.state} ${shelterForm.pincode}`.trim();

    if (!address || address === ',') {
      toast.error('Please enter an address first');
      return;
    }

    if (isProfile) {
      setGeocoding(prev => ({ ...prev, profile: true }));
    } else {
      setGeocoding(prev => ({ ...prev, shelter: true }));
    }

    try {
      // Use OpenStreetMap Nominatim API (free, no API key needed)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
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

      if (isProfile) {
        setProfileForm(prev => ({
          ...prev,
          latitude: parseFloat(lat).toFixed(6),
          longitude: parseFloat(lon).toFixed(6),
        }));
      } else {
        setShelterForm(prev => ({
          ...prev,
          latitude: parseFloat(lat).toFixed(6),
          longitude: parseFloat(lon).toFixed(6),
        }));
      }

      toast.success('Coordinates found from address!');
    } catch (err: any) {
      console.error('Geocoding error:', err);
      toast.error(err.message || 'Failed to get coordinates from address');
    } finally {
      if (isProfile) {
        setGeocoding(prev => ({ ...prev, profile: false }));
      } else {
        setGeocoding(prev => ({ ...prev, shelter: false }));
      }
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use upsert to insert if doesn't exist, update if it does
      const { data, error } = await supabase
        .from('managers')
        .upsert({
          id: userId,
          manager_name: profileForm.manager_name,
          contact: profileForm.contact,
          city: profileForm.city,
          state: profileForm.state,
          pincode: profileForm.pincode,
          latitude: parseFloat(profileForm.latitude),
          longitude: parseFloat(profileForm.longitude),
        }, {
          onConflict: 'id',
          ignoreDuplicates: false
        })
        .select();

      if (error) {
        console.error('Profile save error:', error);
        throw error;
      }

      console.log('Profile saved successfully:', data);
      toast.success('Profile completed successfully!');
      setStep('shelter');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      toast.error(err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleShelterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('shelters')
        .insert({
          name: shelterForm.name,
          address: shelterForm.address,
          city: shelterForm.city,
          state: shelterForm.state,
          pincode: shelterForm.pincode,
          latitude: parseFloat(shelterForm.latitude),
          longitude: parseFloat(shelterForm.longitude),
          capacity: parseInt(shelterForm.capacity),
          current_occupancy: 0,
          contact: shelterForm.contact,
          manager_id: userId,
        });

      if (error) throw error;

      toast.success('Shelter registered successfully!');
      onComplete();
    } catch (err: any) {
      console.error('Error creating shelter:', err);
      toast.error(err.message || 'Failed to register shelter');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 hero-gradient rounded-lg">
              <Droplets className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">FloodRelief</h1>
              <p className="text-xs text-muted-foreground">
                {step === 'profile' ? 'Profile Setup' : 'Shelter Setup'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {step === 'profile' ? (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Complete Your Profile</h1>
              <p className="text-muted-foreground">
                Set up your coordinator profile to start managing relief operations
              </p>
            </div>

            <Card variant="elevated">
              <CardContent className="pt-6">
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label>Manager Name *</Label>
                    <Input
                      placeholder="Your full name"
                      value={profileForm.manager_name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, manager_name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Contact Number *</Label>
                    <Input
                      placeholder="+91 9876543210"
                      value={profileForm.contact}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, contact: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>City *</Label>
                      <Input
                        placeholder="City"
                        value={profileForm.city}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, city: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>State *</Label>
                      <Input
                        placeholder="State"
                        value={profileForm.state}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, state: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Pincode *</Label>
                      <Input
                        placeholder="Pincode"
                        value={profileForm.pincode}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, pincode: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Full Address (Optional - for geocoding)</Label>
                    <Input
                      placeholder="e.g., 123 Main Street, City, State"
                      value={profileForm.address}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Coordinates *</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleGeocodeAddress(true)}
                          disabled={geocoding.profile || detectingLocation}
                        >
                          {geocoding.profile ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                              Finding...
                            </>
                          ) : (
                            <>
                              <MapPin className="w-3 h-3 mr-2" />
                              Get from Address
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDetectLocation(true)}
                          disabled={detectingLocation || geocoding.profile}
                        >
                          {detectingLocation ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                              Detecting...
                            </>
                          ) : (
                            <>
                              <Navigation className="w-3 h-3 mr-2" />
                              Use My Location
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Latitude *</Label>
                        <Input
                          type="number"
                          step="any"
                          placeholder="e.g., 19.0760"
                          value={profileForm.latitude}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, latitude: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Longitude *</Label>
                        <Input
                          type="number"
                          step="any"
                          placeholder="e.g., 72.8777"
                          value={profileForm.longitude}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, longitude: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    variant="hero" 
                    className="w-full" 
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Continue to Shelter Setup'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Register Your Shelter</h1>
              <p className="text-muted-foreground">
                Set up your shelter to start managing relief operations
              </p>
            </div>

            <Card variant="elevated">
              <CardContent className="pt-6">
                <form onSubmit={handleShelterSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label>Shelter Name *</Label>
                    <Input
                      placeholder="e.g., Central Relief Camp"
                      value={shelterForm.name}
                      onChange={(e) => setShelterForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Address *</Label>
                    <Input
                      placeholder="Street address"
                      value={shelterForm.address}
                      onChange={(e) => setShelterForm(prev => ({ ...prev, address: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>City *</Label>
                      <Input
                        placeholder="City"
                        value={shelterForm.city}
                        onChange={(e) => setShelterForm(prev => ({ ...prev, city: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>State *</Label>
                      <Input
                        placeholder="State"
                        value={shelterForm.state}
                        onChange={(e) => setShelterForm(prev => ({ ...prev, state: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Pincode *</Label>
                      <Input
                        placeholder="Pincode"
                        value={shelterForm.pincode}
                        onChange={(e) => setShelterForm(prev => ({ ...prev, pincode: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Coordinates *</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleGeocodeAddress(false)}
                          disabled={geocoding.shelter || detectingLocation}
                        >
                          {geocoding.shelter ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                              Finding...
                            </>
                          ) : (
                            <>
                              <MapPin className="w-3 h-3 mr-2" />
                              Get from Address
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDetectLocation(false)}
                          disabled={detectingLocation || geocoding.shelter}
                        >
                          {detectingLocation ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                              Detecting...
                            </>
                          ) : (
                            <>
                              <Navigation className="w-3 h-3 mr-2" />
                              Use My Location
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Latitude *</Label>
                        <Input
                          type="number"
                          step="any"
                          placeholder="e.g., 19.0760"
                          value={shelterForm.latitude}
                          onChange={(e) => setShelterForm(prev => ({ ...prev, latitude: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Longitude *</Label>
                        <Input
                          type="number"
                          step="any"
                          placeholder="e.g., 72.8777"
                          value={shelterForm.longitude}
                          onChange={(e) => setShelterForm(prev => ({ ...prev, longitude: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Total Capacity *</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 500"
                        value={shelterForm.capacity}
                        onChange={(e) => setShelterForm(prev => ({ ...prev, capacity: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Contact Number *</Label>
                      <Input
                        placeholder="+91 9876543210"
                        value={shelterForm.contact}
                        onChange={(e) => setShelterForm(prev => ({ ...prev, contact: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    variant="hero" 
                    className="w-full" 
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      <>
                        <Building2 className="w-4 h-4 mr-2" />
                        Register Shelter
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}


function ResourcesSection({ 
  resources, 
  shelterId,
  onResourcesChange
}: { 
  resources: Resource[];
  shelterId: number;
  onResourcesChange: () => void;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(false);
  const [newResource, setNewResource] = useState({
    type: '' as ResourceType | '',
    quantity: '',
    needed: '',
  });

  const [editForm, setEditForm] = useState({
    quantity: '',
    needed: '',
  });

  const handleAddResource = async () => {
    if (!newResource.type) {
      toast.error('Please select a resource type');
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('resources')
        .insert({
          shelter_id: shelterId,
          type: newResource.type,
          quantity: parseInt(newResource.quantity) || 0,
          needed: parseInt(newResource.needed) || 0,
        });

      if (error) throw error;
      
      setNewResource({ type: '', quantity: '', needed: '' });
      setShowAddForm(false);
      toast.success('Resource added!');
      onResourcesChange();
    } catch (err: any) {
      console.error('Error adding resource:', err);
      toast.error(err.message || 'Failed to add resource');
    } finally {
      setLoading(false);
    }
  };

  const handleEditResource = async (resourceId: number) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('resources')
        .update({
          quantity: parseInt(editForm.quantity),
          needed: parseInt(editForm.needed),
        })
        .eq('resource_id', resourceId);

      if (error) throw error;
      
      setEditingResource(null);
      toast.success('Resource updated!');
      onResourcesChange();
    } catch (err: any) {
      console.error('Error updating resource:', err);
      toast.error(err.message || 'Failed to update resource');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResource = async (resourceId: number) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('resource_id', resourceId);

      if (error) throw error;
      
      toast.success('Resource deleted!');
      onResourcesChange();
    } catch (err: any) {
      console.error('Error deleting resource:', err);
      toast.error(err.message || 'Failed to delete resource');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (resource: Resource) => {
    setEditingResource(resource);
    setEditForm({
      quantity: resource.quantity.toString(),
      needed: resource.needed.toString(),
    });
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Resource Management</h2>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Resource
        </Button>
      </div>

      {showAddForm && (
        <Card className="animate-scale-in">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <Label>Type</Label>
                <Select 
                  value={newResource.type}
                  onValueChange={(v: ResourceType) => setNewResource(prev => ({ ...prev, type: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {RESOURCE_TYPES.map(t => (
                      <SelectItem key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Available Quantity</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newResource.quantity}
                  onChange={(e) => setNewResource(prev => ({ ...prev, quantity: e.target.value }))}
                />
              </div>
              <div>
                <Label>Needed Quantity</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newResource.needed}
                  onChange={(e) => setNewResource(prev => ({ ...prev, needed: e.target.value }))}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleAddResource} 
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {resources.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Resources Tracked</h3>
          <p className="text-muted-foreground">Add resources to start tracking inventory.</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map(resource => (
            <Card key={resource.resource_id} variant="elevated">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="secondary" className="capitalize">{resource.type}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(resource.last_updated).toLocaleDateString()}
                  </span>
                </div>

                {editingResource?.resource_id === resource.resource_id ? (
                  // EDIT MODE
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Available Quantity</Label>
                      <Input
                        type="number"
                        value={editForm.quantity}
                        onChange={(e) => setEditForm(prev => ({ ...prev, quantity: e.target.value }))}
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Needed Quantity</Label>
                      <Input
                        type="number"
                        value={editForm.needed}
                        onChange={(e) => setEditForm(prev => ({ ...prev, needed: e.target.value }))}
                        className="h-8"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleEditResource(resource.resource_id)}
                        disabled={loading}
                      >
                        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setEditingResource(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // VIEW MODE
                  <>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="text-sm">Available</span>
                        <span className="font-semibold">{resource.quantity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Needed</span>
                        <span className="font-semibold">{resource.needed}</span>
                      </div>
                      <Progress 
                        value={resource.needed > 0 
                          ? (resource.quantity / resource.needed) * 100 
                          : 100
                        } 
                        className="h-2"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1"
                        onClick={() => startEditing(resource)}
                      >
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDeleteResource(resource.resource_id)}
                        disabled={loading}
                      >
                        Delete
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

