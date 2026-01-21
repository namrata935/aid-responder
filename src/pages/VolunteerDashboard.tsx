// Phase 1: Updated VolunteerDashboard with task acceptance/rejection - FIXED
// This version works with manual assignment from coordinators

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
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
  LogOut,
  AlertTriangle,
  Minus,
  Loader2,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

const SKILLS = [
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

interface VolunteerProfile {
  id: string;
  name: string;
  contact: string;
  skills: string[];
  availability: string;
}

interface AssignedTask {
  task_id: number;
  title: string;
  description: string;
  priority: string;
  volunteers_required: number;
  shelter_name: string;
  assignment_status: string;
  completion_status: string | null;
  created_at: string;
}

export default function VolunteerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<VolunteerProfile | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [assignedTasks, setAssignedTasks] = useState<AssignedTask[]>([]);
  const [completedTasks, setCompletedTasks] = useState<AssignedTask[]>([]);
  
  const [profileForm, setProfileForm] = useState({
    name: '',
    contact: '',
    skills: [] as string[],
    availability: 'available' as 'available' | 'busy',
  });

  useEffect(() => {
    if (!user || user.role !== 'Volunteer') {
      navigate('/auth');
      return;
    }
    loadProfile();
  }, [user, navigate]);

  useEffect(() => {
    if (profile) {
      loadTasks();
    }
  }, [profile]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('volunteers')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setProfile(data);
        setProfileForm({
          name: data.name || '',
          contact: data.contact || '',
          skills: data.skills || [],
          availability: data.availability || 'available',
        });
        setActiveTab('tasks');
      } else {
        setProfile(null);
        setActiveTab('profile');
      }
    } catch (err: any) {
      console.error('Error loading profile:', err);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTasks = async () => {
    if (!user) return;

    try {
      console.log('Loading tasks for volunteer:', user.id);

      // Get tasks assigned to this volunteer through recommended_for
      const { data: recommendedData, error: recommendedError } = await supabase
        .from('recommended_for')
        .select(`
          task_id,
          status,
          tasks (
            task_id,
            title,
            description,
            priority,
            volunteers_required,
            created_at,
            shelters (name)
          )
        `)
        .eq('volunteer_id', user.id);

      if (recommendedError) {
        console.error('Error loading recommended tasks:', recommendedError);
        throw recommendedError;
      }

      console.log('Recommended tasks data:', recommendedData);

      // Get completion status for these tasks
      const taskIds = recommendedData?.map((item: any) => item.task_id) || [];
      let completionData: any[] = [];
      
      if (taskIds.length > 0) {
        const { data: compData, error: compError } = await supabase
          .from('completed_by')
          .select('task_id, status')
          .eq('volunteer_id', user.id)
          .in('task_id', taskIds);

        if (compError) {
          console.error('Error loading completions:', compError);
        } else {
          completionData = compData || [];
        }
      }

      console.log('Completion data:', completionData);

      // Create a map of completion statuses
      const completionMap: Record<number, string> = {};
      completionData.forEach((comp: any) => {
        completionMap[comp.task_id] = comp.status;
      });

      // Format tasks
      const allTasks: AssignedTask[] = (recommendedData || [])
        .filter((item: any) => item.tasks) // Filter out any null tasks
        .map((item: any) => ({
          task_id: item.task_id,
          title: item.tasks.title,
          description: item.tasks.description,
          priority: item.tasks.priority,
          volunteers_required: item.tasks.volunteers_required,
          shelter_name: item.tasks.shelters?.name || 'Unknown Shelter',
          assignment_status: item.status,
          completion_status: completionMap[item.task_id] || null,
          created_at: item.tasks.created_at,
        }));

      console.log('Formatted tasks:', allTasks);

      // Separate into active and completed
      const active = allTasks.filter(t => 
        t.assignment_status === 'shown' || 
        (t.assignment_status === 'accepted' && t.completion_status !== 'completed')
      );
      
      const completed = allTasks.filter(t => 
        t.completion_status === 'completed'
      );

      console.log('Active tasks:', active);
      console.log('Completed tasks:', completed);

      setAssignedTasks(active);
      setCompletedTasks(completed);
    } catch (err: any) {
      console.error('Error loading tasks:', err);
      toast.error('Failed to load tasks');
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (profileForm.skills.length === 0) {
      toast.error('Please select at least one skill');
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('volunteers')
        .upsert({
          id: user?.id,
          name: profileForm.name,
          contact: profileForm.contact,
          skills: profileForm.skills,
          availability: profileForm.availability,
        }, {
          onConflict: 'id',
        });

      if (error) throw error;

      toast.success('Profile saved successfully!');
      await loadProfile();
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error(error.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const toggleSkill = (skill: string) => {
    setProfileForm(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const handleAcceptTask = async (taskId: number) => {
    if (!user) return;

    try {
      console.log('Accepting task:', taskId);

      // Update recommended_for status
      const { error: updateError } = await supabase
        .from('recommended_for')
        .update({ status: 'accepted' })
        .eq('task_id', taskId)
        .eq('volunteer_id', user.id);

      if (updateError) {
        console.error('Error updating recommendation:', updateError);
        throw updateError;
      }

      // Add to completed_by with 'accepted' status
      const { error: insertError } = await supabase
        .from('completed_by')
        .insert({
          task_id: taskId,
          volunteer_id: user.id,
          status: 'accepted',
        });

      if (insertError) {
        console.error('Error inserting completion:', insertError);
        throw insertError;
      }

      // Check if all required volunteers have accepted
      await checkAndUpdateTaskStatus(taskId);

      toast.success('Task accepted! Good luck!');
      loadTasks();
    } catch (err: any) {
      console.error('Error accepting task:', err);
      toast.error(err.message || 'Failed to accept task');
    }
  };

  const handleRejectTask = async (taskId: number) => {
    if (!user) return;

    try {
      console.log('Rejecting task:', taskId);

      const { error } = await supabase
        .from('recommended_for')
        .update({ status: 'rejected' })
        .eq('task_id', taskId)
        .eq('volunteer_id', user.id);

      if (error) {
        console.error('Error rejecting task:', error);
        throw error;
      }

      toast.success('Task declined');
      loadTasks();
    } catch (err: any) {
      console.error('Error rejecting task:', err);
      toast.error(err.message || 'Failed to decline task');
    }
  };

  const handleCompleteTask = async (taskId: number) => {
    if (!user) return;

    try {
      console.log('Completing task:', taskId);

      const { error } = await supabase
        .from('completed_by')
        .update({ status: 'completed' })
        .eq('task_id', taskId)
        .eq('volunteer_id', user.id);

      if (error) {
        console.error('Error completing task:', error);
        throw error;
      }

      // Check if all volunteers have completed
      await checkAndUpdateTaskStatus(taskId);

      toast.success('Great job! Task marked as completed.');
      loadTasks();
    } catch (err: any) {
      console.error('Error completing task:', err);
      toast.error(err.message || 'Failed to complete task');
    }
  };

  const checkAndUpdateTaskStatus = async (taskId: number) => {
    try {
      // Get task details
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('volunteers_required')
        .eq('task_id', taskId)
        .single();

      if (taskError) throw taskError;

      // Get all accepted volunteers
      const { data: acceptedData, error: acceptedError } = await supabase
        .from('recommended_for')
        .select('volunteer_id')
        .eq('task_id', taskId)
        .eq('status', 'accepted');

      if (acceptedError) throw acceptedError;

      // If all required volunteers accepted, update task to 'In Progress'
      if (acceptedData.length === taskData.volunteers_required) {
        await supabase
          .from('tasks')
          .update({ status: 'In Progress' })
          .eq('task_id', taskId);
      }

      // Check if all accepted volunteers have completed
      const { data: completedData, error: completedError } = await supabase
        .from('completed_by')
        .select('volunteer_id')
        .eq('task_id', taskId)
        .eq('status', 'completed');

      if (completedError) throw completedError;

      // If all accepted volunteers completed, mark task as Completed
      if (completedData.length === acceptedData.length && completedData.length === taskData.volunteers_required) {
        await supabase
          .from('tasks')
          .update({ status: 'Completed' })
          .eq('task_id', taskId);
      }
    } catch (err) {
      console.error('Error updating task status:', err);
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

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'High': return 'priority_high';
      case 'Medium': return 'priority_medium';
      case 'Low': return 'priority_low';
      default: return 'secondary';
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
            {profile && (
              <Badge variant={profile.availability === 'available' ? 'success' : 'warning'}>
                {profile.availability === 'available' ? 'Available' : 'Busy'}
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
              disabled={!profile}
              className="flex items-center gap-2"
            >
              <ClipboardList className="w-4 h-4" />
              My Tasks
              {assignedTasks.length > 0 && (
                <Badge variant="default" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {assignedTasks.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              disabled={!profile}
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
                  {profile 
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
                        disabled={saving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact">Contact Number *</Label>
                      <Input
                        id="contact"
                        placeholder="+91 9876543210"
                        value={profileForm.contact}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, contact: e.target.value }))}
                        required
                        disabled={saving}
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="availability">Availability *</Label>
                      <Select 
                        value={profileForm.availability}
                        onValueChange={(value: 'available' | 'busy') => 
                          setProfileForm(prev => ({ ...prev, availability: value }))
                        }
                        disabled={saving}
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
                          onClick={() => !saving && toggleSkill(skill.value)}
                        >
                          {skill.label}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    variant="hero" 
                    className="w-full" 
                    size="lg"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      profile ? 'Update Profile' : 'Complete Profile'
                    )}
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
                <Badge variant="secondary">{assignedTasks.length} active</Badge>
              </div>

              {assignedTasks.length === 0 ? (
                <Card className="p-12 text-center">
                  <ClipboardList className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Active Tasks</h3>
                  <p className="text-muted-foreground">
                    Tasks will appear here when coordinators assign them to you.
                  </p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {assignedTasks.map((task) => (
                    <Card key={task.task_id} variant="elevated" className="animate-slide-up">
                      <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <Badge variant={getPriorityVariant(task.priority)}>
                                {task.priority === 'High' && <AlertTriangle className="w-3 h-3 mr-1" />}
                                {task.priority === 'Medium' && <Minus className="w-3 h-3 mr-1" />}
                                {task.priority} Priority
                              </Badge>
                              <Badge variant="outline">
                                <Users className="w-3 h-3 mr-1" />
                                {task.volunteers_required} volunteers needed
                              </Badge>
                            </div>
                            
                            <h3 className="text-lg font-semibold mb-1">{task.title}</h3>
                            <p className="text-sm text-muted-foreground mb-3">{task.shelter_name}</p>
                            
                            <ScrollArea className="h-24 rounded-lg bg-muted/50 p-3 mb-4">
                              <p className="text-sm">{task.description}</p>
                            </ScrollArea>
                          </div>

                          <div className="flex md:flex-col gap-2">
                            {task.assignment_status === 'shown' && !task.completion_status && (
                              <>
                                <Button 
                                  variant="success" 
                                  size="sm" 
                                  onClick={() => handleAcceptTask(task.task_id)}
                                  className="flex-1 md:flex-none"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Accept
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleRejectTask(task.task_id)}
                                  className="flex-1 md:flex-none"
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Decline
                                </Button>
                              </>
                            )}
                            {task.completion_status === 'accepted' && (
                              <Button 
                                variant="success" 
                                size="sm" 
                                onClick={() => handleCompleteTask(task.task_id)}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Mark Complete
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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
                    <Card key={task.task_id} variant="default" className="opacity-75">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold">{task.title}</h3>
                            <p className="text-sm text-muted-foreground">{task.shelter_name}</p>
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