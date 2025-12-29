import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Droplets, 
  User, 
  ClipboardList,
  History,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Phone,
  LogOut,
  Zap,
  Bot,
  AlertTriangle,
  Minus
} from 'lucide-react';
import { toast } from 'sonner';
import { Volunteer, VolunteerSkill, Task } from '@/types';

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

export default function VolunteerDashboard() {
  const { user, logout, signup, selectRole } = useAuth();
  const { getVolunteerByUserId, addVolunteer, updateVolunteer, getTasksByVolunteer, updateTask, volunteers } = useData();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const volunteer = user ? getVolunteerByUserId(user.id) : undefined;
  const [activeTab, setActiveTab] = useState(volunteer?.profileCompleted ? 'tasks' : 'profile');
  
  const [profileForm, setProfileForm] = useState({
    name: volunteer?.name || '',
    contactNumber: volunteer?.contactNumber || '',
    city: volunteer?.city || '',
    skills: volunteer?.skills || [] as VolunteerSkill[],
    availability: volunteer?.availability || 'available' as 'available' | 'busy',
    latitude: volunteer?.location?.latitude?.toString() || '',
    longitude: volunteer?.location?.longitude?.toString() || '',
  });

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

    if (user && user.role && user.role !== 'volunteer') {
      navigate(`/${user.role}`);
    }
  }, [user, navigate, isSignupMode]);

  const handleVolunteerSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');

    if (!signupEmail || !signupPassword) {
      setSignupError('Please enter email and password.');
      return;
    }

    setIsSignupSubmitting(true);
    try {
      await signup(signupEmail, signupPassword);
      selectRole('volunteer');
      // After signup+role, component re-renders and shows normal volunteer dashboard
    } catch (err) {
      setSignupError('Failed to create account. Please try again.');
    } finally {
      setIsSignupSubmitting(false);
    }
  };

  const myTasks = volunteer ? getTasksByVolunteer(volunteer.id) : [];
  const activeTasks = myTasks.filter(t => t.status !== 'completed' && t.status !== 'declined');
  const completedTasks = myTasks.filter(t => t.status === 'completed');

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (profileForm.skills.length === 0) {
      toast.error('Please select at least one skill');
      return;
    }

    const volunteerData = {
      userId: user?.id || '',
      name: profileForm.name,
      contactNumber: profileForm.contactNumber,
      city: profileForm.city,
      skills: profileForm.skills,
      availability: profileForm.availability,
      location: {
        latitude: parseFloat(profileForm.latitude),
        longitude: parseFloat(profileForm.longitude),
      },
      profileCompleted: true,
    };

    if (volunteer) {
      updateVolunteer(volunteer.id, volunteerData);
    } else {
      addVolunteer(volunteerData);
    }

    toast.success('Profile saved successfully!');
    setActiveTab('tasks');
  };

  const toggleSkill = (skill: VolunteerSkill) => {
    setProfileForm(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const handleTaskAction = (taskId: string, action: 'accept' | 'decline' | 'complete') => {
    const statusMap = {
      accept: 'accepted',
      decline: 'declined',
      complete: 'completed',
    } as const;

    updateTask(taskId, { status: statusMap[action] });
    
    const messages = {
      accept: 'Task accepted! Good luck!',
      decline: 'Task declined.',
      complete: 'Great job! Task marked as completed.',
    };
    
    toast.success(messages[action]);
  };

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setProfileForm(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          }));
          toast.success('Location detected!');
        },
        () => toast.error('Unable to get location')
      );
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'high': return 'priority_high';
      case 'medium': return 'priority_medium';
      case 'low': return 'priority_low';
      default: return 'secondary';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'status_completed';
      case 'assigned': return 'status_assigned';
      case 'accepted': return 'status_assigned';
      default: return 'status_pending';
    }
  };

  // If user is not yet a volunteer (first time from signup flow), show account creation inside dashboard
  if (!user || user.role !== 'volunteer') {
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
                <p className="text-xs text-muted-foreground">Volunteer Portal</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
              Back to Auth
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-3xl font-bold mb-2">Create Volunteer Account</h1>
            <p className="text-muted-foreground">
              Enter your email and password to create your account, then you can complete your volunteer profile.
            </p>
          </div>

          <Card variant="elevated" className="animate-slide-up">
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
              <CardDescription>This account will be used to access the volunteer dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVolunteerSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="volunteer-email">Email *</Label>
                  <Input
                    id="volunteer-email"
                    type="email"
                    placeholder="Enter your email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="volunteer-password">Password *</Label>
                  <Input
                    id="volunteer-password"
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
              <p className="text-xs text-muted-foreground">Volunteer Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {volunteer?.profileCompleted && (
              <Badge variant={volunteer.availability === 'available' ? 'success' : 'warning'}>
                {volunteer.availability === 'available' ? 'Available' : 'Busy'}
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger 
              value="tasks" 
              disabled={!volunteer?.profileCompleted}
              className="flex items-center gap-2"
            >
              <ClipboardList className="w-4 h-4" />
              My Tasks
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              disabled={!volunteer?.profileCompleted}
              className="flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="animate-fade-in">
            <Card variant="elevated" className="max-w-2xl">
              <CardHeader>
                <CardTitle>Volunteer Profile</CardTitle>
                <CardDescription>
                  {volunteer?.profileCompleted 
                    ? 'Update your profile and availability'
                    : 'Complete your profile to start receiving tasks'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        placeholder="Enter your name"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact">Contact Number *</Label>
                      <Input
                        id="contact"
                        placeholder="+91 9876543210"
                        value={profileForm.contactNumber}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, contactNumber: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        placeholder="Enter your city"
                        value={profileForm.city}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, city: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="availability">Availability *</Label>
                      <Select 
                        value={profileForm.availability}
                        onValueChange={(value: 'available' | 'busy') => 
                          setProfileForm(prev => ({ ...prev, availability: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="busy">Busy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Skills * (Select all that apply)</Label>
                    <div className="flex flex-wrap gap-2">
                      {SKILLS.map((skill) => (
                        <Badge
                          key={skill.value}
                          variant={profileForm.skills.includes(skill.value) ? 'default' : 'outline'}
                          className="cursor-pointer transition-all hover:scale-105"
                          onClick={() => toggleSkill(skill.value)}
                        >
                          {skill.label}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Location *</Label>
                      <Button type="button" variant="outline" size="sm" onClick={handleUseMyLocation}>
                        <MapPin className="w-4 h-4 mr-2" />
                        Use My Location
                      </Button>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="lat">Latitude</Label>
                        <Input
                          id="lat"
                          type="number"
                          step="any"
                          placeholder="e.g., 19.0760"
                          value={profileForm.latitude}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, latitude: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lng">Longitude</Label>
                        <Input
                          id="lng"
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

                  <Button type="submit" variant="hero" className="w-full" size="lg">
                    {volunteer?.profileCompleted ? 'Update Profile' : 'Complete Profile'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="animate-fade-in">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">My Active Tasks</h2>
                <Badge variant="secondary">{activeTasks.length} active</Badge>
              </div>

              {activeTasks.length === 0 ? (
                <Card className="p-12 text-center">
                  <ClipboardList className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Active Tasks</h3>
                  <p className="text-muted-foreground">
                    Tasks will appear here when they're assigned to you by the AI system.
                  </p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {activeTasks.map((task) => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onAction={handleTaskAction}
                      getPriorityVariant={getPriorityVariant}
                      getStatusVariant={getStatusVariant}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="animate-fade-in">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Task History</h2>
                <Badge variant="secondary">{completedTasks.length} completed</Badge>
              </div>

              {completedTasks.length === 0 ? (
                <Card className="p-12 text-center">
                  <History className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Completed Tasks</h3>
                  <p className="text-muted-foreground">
                    Your completed tasks will appear here.
                  </p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {completedTasks.map((task) => (
                    <Card key={task.id} variant="default" className="opacity-75">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold">{task.title}</h3>
                            <p className="text-sm text-muted-foreground">{task.shelterName}</p>
                          </div>
                          <Badge variant="status_completed">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function TaskCard({ 
  task, 
  onAction,
  getPriorityVariant,
  getStatusVariant
}: { 
  task: Task; 
  onAction: (id: string, action: 'accept' | 'decline' | 'complete') => void;
  getPriorityVariant: (p: string) => any;
  getStatusVariant: (s: string) => any;
}) {
  return (
    <Card variant="elevated" className="animate-slide-up">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant={getPriorityVariant(task.priority)}>
                {task.priority === 'high' && <AlertTriangle className="w-3 h-3 mr-1" />}
                {task.priority === 'medium' && <Minus className="w-3 h-3 mr-1" />}
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
              </Badge>
              <Badge variant={getStatusVariant(task.status)}>
                {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
              </Badge>
              {task.aiAssigned && (
                <Badge variant="ai">
                  <Bot className="w-3 h-3 mr-1" />
                  AI Assigned
                </Badge>
              )}
            </div>
            
            <h3 className="text-lg font-semibold mb-1">{task.title}</h3>
            <p className="text-sm text-muted-foreground mb-3">{task.shelterName}</p>
            
            <ScrollArea className="h-24 rounded-lg bg-muted/50 p-3 mb-4">
              <p className="text-sm">{task.description}</p>
            </ScrollArea>

            <div className="flex flex-wrap gap-1">
              {task.requiredSkills.map(skill => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex md:flex-col gap-2">
            {task.status === 'assigned' && (
              <>
                <Button 
                  variant="success" 
                  size="sm" 
                  onClick={() => onAction(task.id, 'accept')}
                  className="flex-1 md:flex-none"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Accept
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onAction(task.id, 'decline')}
                  className="flex-1 md:flex-none"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Decline
                </Button>
              </>
            )}
            {task.status === 'accepted' && (
              <Button 
                variant="success" 
                size="sm" 
                onClick={() => onAction(task.id, 'complete')}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Mark Complete
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
