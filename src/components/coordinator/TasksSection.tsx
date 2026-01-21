// src/components/coordinator/TasksSection.tsx
// Phase 1: TasksSection with Manual Volunteer Selection - FIXED VERSION

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus,
  ClipboardList,
  AlertTriangle,
  Minus,
  Clock,
  Users,
  CheckCircle,
  Loader2,
  X
} from 'lucide-react';
import { toast } from 'sonner';

type TaskPriority = 'High' | 'Medium' | 'Low';

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

interface Volunteer {
  id: string;
  name: string;
  contact: string;
  skills: string[];
  availability: string;
}

interface TaskAssignment {
  task_id: number;
  volunteer_id: string;
  volunteer_name: string;
  status: string;
}

interface TasksSectionProps {
  tasks: Task[];
  shelterId: number;
  shelterName: string;
  onTasksChange: () => void;
}

export function TasksSection({ 
  tasks, 
  shelterId,
  shelterName,
  onTasksChange
}: TasksSectionProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedVolunteers, setSelectedVolunteers] = useState<string[]>([]);
  const [taskAssignments, setTaskAssignments] = useState<Record<number, TaskAssignment[]>>({});
  
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'Medium' as TaskPriority,
    volunteers_required: '1',
  });

  // Load volunteers and assignments whenever tasks change
  useEffect(() => {
    loadVolunteers();
    if (tasks.length > 0) {
      loadTaskAssignments();
    }
  }, [tasks]);

  const loadVolunteers = async () => {
    try {
      const { data, error } = await supabase
        .from('volunteers')
        .select('*')
        .eq('availability', 'available');

      if (error) throw error;
      
      console.log('Loaded volunteers:', data);
      setVolunteers(data || []);
    } catch (err: any) {
      console.error('Error loading volunteers:', err);
      toast.error('Failed to load volunteers');
    }
  };

  const loadTaskAssignments = async () => {
    if (tasks.length === 0) return;

    try {
      const taskIds = tasks.map(t => t.task_id);
      const { data, error } = await supabase
        .from('recommended_for')
        .select(`
          task_id,
          volunteer_id,
          status,
          volunteers (name)
        `)
        .in('task_id', taskIds);

      if (error) throw error;

      const assignmentMap: Record<number, TaskAssignment[]> = {};
      data?.forEach((item: any) => {
        if (!assignmentMap[item.task_id]) {
          assignmentMap[item.task_id] = [];
        }
        assignmentMap[item.task_id].push({
          task_id: item.task_id,
          volunteer_id: item.volunteer_id,
          volunteer_name: item.volunteers?.name || 'Unknown',
          status: item.status,
        });
      });

      console.log('Loaded task assignments:', assignmentMap);
      setTaskAssignments(assignmentMap);
    } catch (err: any) {
      console.error('Error loading assignments:', err);
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim() || !newTask.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const volunteersRequired = parseInt(newTask.volunteers_required);
    if (isNaN(volunteersRequired) || volunteersRequired < 1) {
      toast.error('Please enter a valid number of volunteers required');
      return;
    }

    setLoading(true);
    try {
      console.log('Creating task:', {
        shelter_id: shelterId,
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        status: 'Created',
        volunteers_required: volunteersRequired,
      });

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          shelter_id: shelterId,
          title: newTask.title,
          description: newTask.description,
          priority: newTask.priority,
          status: 'Created',
          volunteers_required: volunteersRequired,
        })
        .select();

      if (error) {
        console.error('Task creation error:', error);
        throw error;
      }
      
      console.log('Task created successfully:', data);
      
      // Reset form
      setNewTask({ 
        title: '', 
        description: '', 
        priority: 'Medium', 
        volunteers_required: '1' 
      });
      setShowCreateForm(false);
      
      toast.success('Task created successfully!');
      
      // Refresh the tasks list
      onTasksChange();
    } catch (err: any) {
      console.error('Error creating task:', err);
      toast.error(err.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const openAssignModal = (task: Task) => {
    console.log('Opening assign modal for task:', task);
    setSelectedTask(task);
    setSelectedVolunteers([]);
    setShowAssignModal(true);
  };

  const toggleVolunteer = (volunteerId: string) => {
    setSelectedVolunteers(prev => 
      prev.includes(volunteerId)
        ? prev.filter(id => id !== volunteerId)
        : [...prev, volunteerId]
    );
  };

  const handleAssignVolunteers = async () => {
    if (!selectedTask || selectedVolunteers.length === 0) {
      toast.error('Please select at least one volunteer');
      return;
    }

    if (selectedVolunteers.length > selectedTask.volunteers_required) {
      toast.error(`You can only assign ${selectedTask.volunteers_required} volunteer(s)`);
      return;
    }

    setLoading(true);
    try {
      console.log('Assigning volunteers:', {
        task_id: selectedTask.task_id,
        volunteers: selectedVolunteers,
      });

      // Insert into recommended_for table
      const assignments = selectedVolunteers.map(volunteerId => ({
        task_id: selectedTask.task_id,
        volunteer_id: volunteerId,
        availability: true,
        status: 'shown',
      }));

      const { data: assignData, error: assignError } = await supabase
        .from('recommended_for')
        .insert(assignments)
        .select();

      if (assignError) {
        console.error('Assignment error:', assignError);
        throw assignError;
      }

      console.log('Volunteers assigned:', assignData);

      // Update task status to 'Assigned'
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ status: 'Assigned' })
        .eq('task_id', selectedTask.task_id);

      if (updateError) {
        console.error('Task update error:', updateError);
        throw updateError;
      }

      toast.success(`Task assigned to ${selectedVolunteers.length} volunteer(s)!`);
      
      // Close modal and reset
      setShowAssignModal(false);
      setSelectedTask(null);
      setSelectedVolunteers([]);
      
      // Refresh tasks and assignments
      onTasksChange();
      loadTaskAssignments();
    } catch (err: any) {
      console.error('Error assigning volunteers:', err);
      toast.error(err.message || 'Failed to assign volunteers');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'High': return <AlertTriangle className="w-3 h-3" />;
      case 'Medium': return <Minus className="w-3 h-3" />;
      case 'Low': return <Clock className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const getTaskStats = (task: Task) => {
    const assignments = taskAssignments[task.task_id] || [];
    const accepted = assignments.filter(a => a.status === 'accepted').length;
    const rejected = assignments.filter(a => a.status === 'rejected').length;
    const pending = assignments.filter(a => a.status === 'shown').length;
    
    return { total: assignments.length, accepted, rejected, pending };
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

      {/* Create Task Form */}
      {showCreateForm && (
        <Card variant="elevated" className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle>Create New Task</CardTitle>
            <CardDescription>Create a task and then assign volunteers manually</CardDescription>
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
              <Label>Task Description *</Label>
              <Textarea
                placeholder="Provide detailed instructions..."
                rows={6}
                value={newTask.description}
                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select 
                  value={newTask.priority}
                  onValueChange={(v: TaskPriority) => setNewTask(prev => ({ ...prev, priority: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High Priority</SelectItem>
                    <SelectItem value="Medium">Medium Priority</SelectItem>
                    <SelectItem value="Low">Low Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Volunteers Required</Label>
                <Input
                  type="number"
                  min="1"
                  value={newTask.volunteers_required}
                  onChange={(e) => setNewTask(prev => ({ ...prev, volunteers_required: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleCreateTask} 
                variant="hero"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Task
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Volunteer Assignment Modal */}
      {showAssignModal && selectedTask && (
        <Card variant="elevated" className="border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Assign Volunteers</CardTitle>
                <CardDescription>
                  Select {selectedTask.volunteers_required} volunteer(s) for: {selectedTask.title}
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowAssignModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>
                Select Volunteers ({selectedVolunteers.length}/{selectedTask.volunteers_required})
              </Label>
              <ScrollArea className="h-64 border rounded-lg p-4">
                {volunteers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No available volunteers found
                  </p>
                ) : (
                  <div className="space-y-2">
                    {volunteers.map(volunteer => (
                      <div
                        key={volunteer.id}
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => toggleVolunteer(volunteer.id)}
                      >
                        <Checkbox
                          checked={selectedVolunteers.includes(volunteer.id)}
                          onCheckedChange={() => toggleVolunteer(volunteer.id)}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{volunteer.name}</p>
                          <p className="text-sm text-muted-foreground">{volunteer.contact}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {volunteer.skills?.map(skill => (
                              <Badge key={skill} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleAssignVolunteers}
                variant="hero"
                disabled={loading || selectedVolunteers.length === 0}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    Assign {selectedVolunteers.length} Volunteer(s)
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowAssignModal(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <Card className="p-12 text-center">
          <ClipboardList className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Tasks Created</h3>
          <p className="text-muted-foreground">Create tasks and assign them to volunteers.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {tasks.map(task => {
            const stats = getTaskStats(task);
            const needsAssignment = task.status === 'Created';
            const assignments = taskAssignments[task.task_id] || [];
            
            return (
              <Card key={task.task_id} variant="elevated">
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge 
                        variant={
                          task.priority === 'High' ? 'priority_high' : 
                          task.priority === 'Medium' ? 'priority_medium' : 
                          'priority_low'
                        }
                      >
                        {getPriorityIcon(task.priority)}
                        <span className="ml-1">{task.priority}</span>
                      </Badge>
                      <Badge 
                        variant={
                          task.status === 'Completed' ? 'status_completed' : 
                          task.status === 'Assigned' ? 'status_assigned' : 
                          'status_pending'
                        }
                      >
                        {task.status}
                      </Badge>
                      <Badge variant="outline">
                        <Users className="w-3 h-3 mr-1" />
                        {task.volunteers_required} required
                      </Badge>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-2">{task.title}</h3>
                      <ScrollArea className="h-20 rounded-lg bg-muted/50 p-3">
                        <p className="text-sm">{task.description}</p>
                      </ScrollArea>
                    </div>

                    {/* Assignment Status */}
                    {stats.total > 0 && (
                      <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">Volunteers:</span>
                          <span>{stats.total}/{task.volunteers_required}</span>
                        </div>
                        {stats.accepted > 0 && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span>{stats.accepted} accepted</span>
                          </div>
                        )}
                        {stats.pending > 0 && (
                          <div className="flex items-center gap-2 text-sm text-yellow-600">
                            <Clock className="w-4 h-4" />
                            <span>{stats.pending} pending</span>
                          </div>
                        )}
                        {stats.rejected > 0 && (
                          <div className="flex items-center gap-2 text-sm text-red-600">
                            <X className="w-4 h-4" />
                            <span>{stats.rejected} rejected</span>
                          </div>
                        )}
                        
                        {/* Show assigned volunteers */}
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-xs text-muted-foreground mb-2">Assigned to:</p>
                          <div className="flex flex-wrap gap-1">
                            {assignments.map((assignment, idx) => (
                              <Badge 
                                key={idx} 
                                variant={
                                  assignment.status === 'accepted' ? 'success' :
                                  assignment.status === 'rejected' ? 'destructive' :
                                  'secondary'
                                }
                                className="text-xs"
                              >
                                {assignment.volunteer_name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {needsAssignment && (
                        <Button 
                          variant="default"
                          size="sm"
                          onClick={() => openAssignModal(task)}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Assign Volunteers
                        </Button>
                      )}
                      {stats.total < task.volunteers_required && task.status === 'Assigned' && (
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => openAssignModal(task)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add More Volunteers
                        </Button>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(task.created_at).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}