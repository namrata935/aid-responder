import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
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
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { Shelter, Resource, Task, VolunteerSkill, TaskPriority } from '@/types';

const RESOURCE_TYPES = ['food', 'water', 'medicine', 'clothes', 'blankets', 'other'] as const;
const SKILLS: { value: VolunteerSkill; label: string }[] = [
  { value: 'first_aid', label: 'First Aid' },
  { value: 'driving', label: 'Driving' },
  { value: 'cooking', label: 'Cooking' },
  { value: 'rescue', label: 'Rescue' },
  { value: 'logistics', label: 'Logistics' },
  { value: 'medical', label: 'Medical' },
  { value: 'counseling', label: 'Counseling' },
  { value: 'communication', label: 'Communication' },
  { value: 'construction', label: 'Construction' },
];

export default function CoordinatorDashboard() {
  const { user, logout, signup, selectRole } = useAuth();
  const { 
    shelters, 
    addShelter, 
    updateShelter,
    getResourcesByShelter,
    addResource,
    updateResource,
    getTasksByShelter,
    addTask,
    runAIAssignment,
    volunteers
  } = useData();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Find coordinator's shelter
  const myShelter = shelters.find(s => s.coordinatorId === user?.id);
  const [isSetupMode, setIsSetupMode] = useState(!myShelter);
  const [activeTab, setActiveTab] = useState('overview');

  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupError, setSignupError] = useState('');
  const [isSignupSubmitting, setIsSignupSubmitting] = useState(false);

  const isSignupMode = searchParams.get('signup') === 'true';

  React.useEffect(() => {
    if (!user && !isSignupMode) {
      navigate('/auth');
      return;
    }

    if (user && user.role && user.role !== 'coordinator') {
      navigate(`/${user.role}`);
    }
  }, [user, navigate, isSignupMode]);

  const handleCoordinatorSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');

    if (!signupEmail || !signupPassword) {
      setSignupError('Please enter email and password.');
      return;
    }

    setIsSignupSubmitting(true);
    try {
      await signup(signupEmail, signupPassword);
      selectRole('coordinator');
      // After signup+role, component re-renders and shows normal coordinator dashboard
    } catch (err) {
      setSignupError('Failed to create account. Please try again.');
    } finally {
      setIsSignupSubmitting(false);
    }
  };

  const myResources = myShelter ? getResourcesByShelter(myShelter.id) : [];
  const myTasks = myShelter ? getTasksByShelter(myShelter.id) : [];
  const activeVolunteers = volunteers.filter(v => 
    v.availability === 'available' && v.profileCompleted
  ).length;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // If user is not yet a coordinator (first time from signup flow), show account creation inside dashboard
  if (!user || user.role !== 'coordinator') {
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
                <p className="text-xs text-muted-foreground">Coordinator Portal</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
              Back to Auth
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-3xl font-bold mb-2">Create Coordinator Account</h1>
            <p className="text-muted-foreground">
              Enter your email and password to create your coordinator account, then you can register your shelter.
            </p>
          </div>

          <Card variant="elevated" className="animate-slide-up">
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
              <CardDescription>This account will be used to access the coordinator dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCoordinatorSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="coordinator-email">Email *</Label>
                  <Input
                    id="coordinator-email"
                    type="email"
                    placeholder="Enter your email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coordinator-password">Password *</Label>
                  <Input
                    id="coordinator-password"
                    type="password"
                    placeholder="Create a password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>

                {signupError && (
                  <p className="text-sm text-destructive">{signupError}</p>
                )}

                <Button
                  type="submit"
                  variant="hero"
                  className="w-full"
                  size="lg"
                  disabled={isSignupSubmitting}
                >
                  {isSignupSubmitting ? 'Creating account...' : 'Create Account & Continue'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (isSetupMode) {
    return (
      <ShelterSetup 
        userId={user?.id || ''} 
        onComplete={() => setIsSetupMode(false)} 
        addShelter={addShelter}
        onLogout={handleLogout}
      />
    );
  }

  if (!myShelter) {
    return null;
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
              <p className="text-xs text-muted-foreground">Coordinator Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="default">{myShelter.name}</Badge>
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
                value={`${myShelter.currentOccupancy}/${myShelter.totalCapacity}`}
                subtitle="people"
                icon={<Users className="w-5 h-5" />}
                color="primary"
              />
              <StatCard 
                title="Resources"
                value={myResources.length.toString()}
                subtitle="types tracked"
                icon={<Package className="w-5 h-5" />}
                color="info"
              />
              <StatCard 
                title="Active Tasks"
                value={myTasks.filter(t => t.status !== 'completed').length.toString()}
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
                      <p className="font-medium">{myShelter.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Contact</p>
                      <p className="font-medium">{myShelter.contactNumber}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">{myShelter.address}, {myShelter.city}, {myShelter.state} - {myShelter.pincode}</p>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Capacity Utilization</span>
                      <span>{Math.round((myShelter.currentOccupancy / myShelter.totalCapacity) * 100)}%</span>
                    </div>
                    <Progress 
                      value={(myShelter.currentOccupancy / myShelter.totalCapacity) * 100} 
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
                      <p className="font-medium">{myShelter.managerName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Manager Contact</p>
                      <p className="font-medium">{myShelter.managerContact}</p>
                    </div>
                  </div>
                  {myShelter.managerAddress && (
                    <div>
                      <p className="text-sm text-muted-foreground">Manager Address</p>
                      <p className="font-medium">{myShelter.managerAddress}</p>
                    </div>
                  )}
                  {(myShelter.managerState || myShelter.managerPincode) && (
                    <div className="grid grid-cols-2 gap-4">
                      {myShelter.managerState && (
                        <div>
                          <p className="text-sm text-muted-foreground">Manager State</p>
                          <p className="font-medium">{myShelter.managerState}</p>
                        </div>
                      )}
                      {myShelter.managerPincode && (
                        <div>
                          <p className="text-sm text-muted-foreground">Manager Pincode</p>
                          <p className="font-medium">{myShelter.managerPincode}</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="p-4 bg-secondary/50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-primary" />
                      <span className="font-medium">Available Volunteers</span>
                    </div>
                    <p className="text-2xl font-bold text-primary">{activeVolunteers}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="animate-fade-in">
            <ResourcesSection 
              resources={myResources} 
              shelterId={myShelter.id}
              addResource={addResource}
              updateResource={updateResource}
            />
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="animate-fade-in">
            <TasksSection 
              tasks={myTasks}
              shelterId={myShelter.id}
              shelterName={myShelter.name}
              addTask={addTask}
              runAIAssignment={runAIAssignment}
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
  onComplete, 
  addShelter,
  onLogout
}: { 
  userId: string; 
  onComplete: () => void;
  addShelter: (shelter: any) => any;
  onLogout: () => void;
}) {
  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    latitude: '',
    longitude: '',
    totalCapacity: '',
    contactNumber: '',
    managerName: '',
    managerContact: '',
    managerAddress: '',
    managerState: '',
    managerPincode: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    addShelter({
      name: form.name,
      address: form.address,
      city: form.city,
      state: form.state,
      pincode: form.pincode,
      location: {
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
      },
      totalCapacity: parseInt(form.totalCapacity),
      currentOccupancy: 0,
      contactNumber: form.contactNumber,
      managerName: form.managerName,
      managerContact: form.managerContact,
      managerAddress: form.managerAddress || undefined,
      managerState: form.managerState || undefined,
      managerPincode: form.managerPincode || undefined,
      coordinatorId: userId,
    });

    toast.success('Shelter registered successfully!');
    onComplete();
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
              <p className="text-xs text-muted-foreground">Shelter Setup</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Register Your Shelter</h1>
          <p className="text-muted-foreground">
            Set up your shelter to start managing relief operations
          </p>
        </div>

        <Card variant="elevated">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Shelter Name *</Label>
                <Input
                  placeholder="e.g., Central Relief Camp"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Address *</Label>
                <Input
                  placeholder="Street address"
                  value={form.address}
                  onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>City *</Label>
                  <Input
                    placeholder="City"
                    value={form.city}
                    onChange={(e) => setForm(prev => ({ ...prev, city: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>State *</Label>
                  <Input
                    placeholder="State"
                    value={form.state}
                    onChange={(e) => setForm(prev => ({ ...prev, state: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pincode *</Label>
                  <Input
                    placeholder="Pincode"
                    value={form.pincode}
                    onChange={(e) => setForm(prev => ({ ...prev, pincode: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Latitude *</Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="e.g., 19.0760"
                    value={form.latitude}
                    onChange={(e) => setForm(prev => ({ ...prev, latitude: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Longitude *</Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="e.g., 72.8777"
                    value={form.longitude}
                    onChange={(e) => setForm(prev => ({ ...prev, longitude: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Total Capacity *</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 500"
                    value={form.totalCapacity}
                    onChange={(e) => setForm(prev => ({ ...prev, totalCapacity: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Number *</Label>
                  <Input
                    placeholder="+91 9876543210"
                    value={form.contactNumber}
                    onChange={(e) => setForm(prev => ({ ...prev, contactNumber: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Shelter Manager Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Manager Name *</Label>
                    <Input
                      placeholder="Full name"
                      value={form.managerName}
                      onChange={(e) => setForm(prev => ({ ...prev, managerName: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Manager Contact *</Label>
                    <Input
                      placeholder="+91 9876543210"
                      value={form.managerContact}
                      onChange={(e) => setForm(prev => ({ ...prev, managerContact: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <Label>Manager Address Line 1</Label>
                  <Input
                    placeholder="Street address"
                    value={form.managerAddress || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, managerAddress: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>Manager State</Label>
                    <Input
                      placeholder="State"
                      value={form.managerState || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, managerState: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Manager Pincode</Label>
                    <Input
                      placeholder="Pincode"
                      value={form.managerPincode || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, managerPincode: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" variant="hero" className="w-full" size="lg">
                <Building2 className="w-4 h-4 mr-2" />
                Register Shelter
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function ResourcesSection({ 
  resources, 
  shelterId,
  addResource,
  updateResource
}: { 
  resources: Resource[];
  shelterId: string;
  addResource: (r: any) => any;
  updateResource: (id: string, data: any) => void;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newResource, setNewResource] = useState({
    type: '' as Resource['type'] | '',
    quantityAvailable: '',
    quantityNeeded: '',
    unit: '',
  });

  const handleAddResource = () => {
    if (!newResource.type) return;
    
    addResource({
      shelterId,
      type: newResource.type,
      quantityAvailable: parseInt(newResource.quantityAvailable) || 0,
      quantityNeeded: parseInt(newResource.quantityNeeded) || 0,
      unit: newResource.unit,
    });
    
    setNewResource({ type: '', quantityAvailable: '', quantityNeeded: '', unit: '' });
    setShowAddForm(false);
    toast.success('Resource added!');
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
            <div className="grid md:grid-cols-5 gap-4">
              <div>
                <Label>Type</Label>
                <Select 
                  value={newResource.type}
                  onValueChange={(v: Resource['type']) => setNewResource(prev => ({ ...prev, type: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {RESOURCE_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Available</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newResource.quantityAvailable}
                  onChange={(e) => setNewResource(prev => ({ ...prev, quantityAvailable: e.target.value }))}
                />
              </div>
              <div>
                <Label>Needed</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newResource.quantityNeeded}
                  onChange={(e) => setNewResource(prev => ({ ...prev, quantityNeeded: e.target.value }))}
                />
              </div>
              <div>
                <Label>Unit</Label>
                <Input
                  placeholder="kg, liters..."
                  value={newResource.unit}
                  onChange={(e) => setNewResource(prev => ({ ...prev, unit: e.target.value }))}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddResource} className="w-full">Add</Button>
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
            <Card key={resource.id} variant="elevated">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="secondary" className="capitalize">{resource.type}</Badge>
                  <span className="text-xs text-muted-foreground">{resource.unit}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Available</span>
                    <span className="font-semibold">{resource.quantityAvailable}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Needed</span>
                    <span className="font-semibold">{resource.quantityNeeded}</span>
                  </div>
                  <Progress 
                    value={resource.quantityNeeded > 0 
                      ? (resource.quantityAvailable / resource.quantityNeeded) * 100 
                      : 100
                    } 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function TasksSection({ 
  tasks, 
  shelterId,
  shelterName,
  addTask,
  runAIAssignment
}: { 
  tasks: Task[];
  shelterId: string;
  shelterName: string;
  addTask: (t: any) => Task;
  runAIAssignment: (id: string) => void;
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    requiredSkills: [] as VolunteerSkill[],
  });

  const toggleSkill = (skill: VolunteerSkill) => {
    setNewTask(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.includes(skill)
        ? prev.requiredSkills.filter(s => s !== skill)
        : [...prev.requiredSkills, skill],
    }));
  };

  const handleCreateTask = () => {
    if (!newTask.title || !newTask.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    const task = addTask({
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority,
      status: 'created',
      shelterId,
      shelterName,
      requiredSkills: newTask.requiredSkills,
    });

    // Run AI assignment
    runAIAssignment(task.id);
    
    setNewTask({ title: '', description: '', priority: 'medium', requiredSkills: [] });
    setShowCreateForm(false);
    toast.success('Task created and AI assignment triggered!');
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="w-3 h-3" />;
      case 'medium': return <Minus className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Task Management</h2>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Task
        </Button>
      </div>

      {showCreateForm && (
        <Card variant="elevated" className="animate-scale-in">
          <CardHeader>
            <CardTitle>Create New Task</CardTitle>
            <CardDescription>Tasks will be automatically assigned to volunteers by AI</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Task Title *</Label>
              <Input
                placeholder="e.g., Medical Supply Distribution"
                value={newTask.title}
                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Task Description * (Detailed instructions)</Label>
              <Textarea
                placeholder="Provide detailed instructions, safety notes, timing, location details..."
                rows={6}
                value={newTask.description}
                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select 
                value={newTask.priority}
                onValueChange={(v: TaskPriority) => setNewTask(prev => ({ ...prev, priority: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Required Skills</Label>
              <div className="flex flex-wrap gap-2">
                {SKILLS.map(skill => (
                  <Badge
                    key={skill.value}
                    variant={newTask.requiredSkills.includes(skill.value) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleSkill(skill.value)}
                  >
                    {skill.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateTask} variant="hero">
                <Bot className="w-4 h-4 mr-2" />
                Create & Auto-Assign
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tasks.length === 0 ? (
        <Card className="p-12 text-center">
          <ClipboardList className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Tasks Created</h3>
          <p className="text-muted-foreground">Create tasks to be assigned to volunteers.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {tasks.map(task => (
            <Card key={task.id} variant="elevated">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant={task.priority === 'high' ? 'priority_high' : task.priority === 'medium' ? 'priority_medium' : 'priority_low'}>
                        {getPriorityIcon(task.priority)}
                        <span className="ml-1 capitalize">{task.priority}</span>
                      </Badge>
                      <Badge variant={task.status === 'completed' ? 'status_completed' : task.status === 'assigned' || task.status === 'accepted' ? 'status_assigned' : 'status_pending'}>
                        {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                      </Badge>
                      {task.aiAssigned && (
                        <Badge variant="ai">
                          <Bot className="w-3 h-3 mr-1" />
                          AI Assigned
                        </Badge>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-semibold">{task.title}</h3>
                    
                    {task.assignedVolunteerName && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Assigned to: <span className="font-medium">{task.assignedVolunteerName}</span>
                      </p>
                    )}

                    <ScrollArea className="h-20 mt-3 rounded-lg bg-muted/50 p-3">
                      <p className="text-sm">{task.description}</p>
                    </ScrollArea>
                  </div>

                  {task.status === 'created' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        runAIAssignment(task.id);
                        toast.info('Re-running AI assignment...');
                      }}
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Re-assign
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
