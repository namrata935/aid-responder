// src/components/coordinator/TasksSection.tsx
// Phase 2: TasksSection with Gemini AI Volunteer Suggestions

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
  X,
  Sparkles,
  Star,
  TrendingUp
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

interface VolunteerSuggestion extends Volunteer {
  ai_score: number;
  ai_reason: string;
  rank: number;
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

// IMPORTANT: Replace this with your actual Gemini API key
const GEMINI_API_KEY = 'AIzaSyBCxx9ZF3UTTeANV1kQmteC0a4LeRDXj4k';

export function TasksSection({ 
  tasks, 
  shelterId,
  shelterName,
  onTasksChange
}: TasksSectionProps) {
  const [remainingSlots, setRemainingSlots] = useState<number>(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiRanking, setAiRanking] = useState(false);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [rankedVolunteers, setRankedVolunteers] = useState<VolunteerSuggestion[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedVolunteers, setSelectedVolunteers] = useState<string[]>([]);
  const [taskAssignments, setTaskAssignments] = useState<Record<number, TaskAssignment[]>>({});
  
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'Medium' as TaskPriority,
    volunteers_required: '1',
  });

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
          score,
          reason,
          rank,
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
      
      await checkAndUpdateTaskStatuses(assignmentMap);
    } catch (err: any) {
      console.error('Error loading assignments:', err);
    }
  };

  const checkAndUpdateTaskStatuses = async (assignmentMap: Record<number, TaskAssignment[]>) => {
    try {
      const updatePromises = tasks.map(async (task) => {
        const assignments = assignmentMap[task.task_id] || [];
        const acceptedCount = assignments.filter(a => a.status === 'accepted').length;
        
        if (acceptedCount >= task.volunteers_required && task.status !== 'Completed') {
          const { error } = await supabase
            .from('tasks')
            .update({ status: 'Completed' })
            .eq('task_id', task.task_id);
          
          if (error) {
            console.error(`Error updating task ${task.task_id} status:`, error);
          } else {
            console.log(`Task ${task.task_id} marked as Completed`);
            onTasksChange();
          }
        }
      });

      await Promise.all(updatePromises);
    } catch (err: any) {
      console.error('Error checking task statuses:', err);
    }
  };

  const rankVolunteersWithAI = async (task: Task, availableVolunteers: Volunteer[]) => {
    if (availableVolunteers.length === 0) {
      toast.error('No volunteers available to rank');
      return [];
    }

    setAiRanking(true);
    try {
      console.log('🤖 Starting AI ranking for task:', task.title);

      // Prepare volunteer data for AI
      const volunteersList = availableVolunteers.map((v, i) => 
        `${i + 1}. ${v.name} - Skills: ${v.skills.join(', ')}`
      ).join('\n');

      const prompt = `You are an AI assistant helping coordinate disaster relief efforts. Analyze this task and rank ALL volunteers based on how well their skills match the task requirements.

Task Title: ${task.title}
Task Description: ${task.description}
Task Priority: ${task.priority}
Volunteers Required: ${task.volunteers_required}

Available Volunteers:
${volunteersList}

IMPORTANT: You must rank ALL ${availableVolunteers.length} volunteers, even if some don't match well.

For each volunteer, provide:
1. A match score from 0-100 (100 = perfect match)
2. A brief reason explaining why they got that score

Return ONLY a valid JSON array with this exact format, no other text:
[
  {
    "volunteer_index": 0,
    "score": 95,
    "reason": "Has medical and logistics skills which perfectly match the task requirements"
  },
  {
    "volunteer_index": 1,
    "score": 70,
    "reason": "Has driving skills which partially match transportation needs"
  }
]

Rules:
- Include ALL ${availableVolunteers.length} volunteers
- Order by score (highest first)
- Scores must range from 0-100
- Keep reasons under 100 characters
- Return valid JSON only`;

      console.log('📤 Sending request to Gemini API...');

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
            }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Gemini API error:', errorData);
        throw new Error(`Gemini API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('📥 Received response from Gemini API');

      // Extract text from Gemini response
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!aiText) {
        throw new Error('No response text from Gemini');
      }

      console.log('🔍 AI Response:', aiText);

      // Clean the response - remove markdown code blocks if present
      let cleanedText = aiText.trim();
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Parse the JSON
      const rankings = JSON.parse(cleanedText);

      if (!Array.isArray(rankings)) {
        throw new Error('AI response is not an array');
      }

      // Map rankings to volunteers
      const rankedVolunteers: VolunteerSuggestion[] = rankings.map((ranking: any, index: number) => {
        const volunteer = availableVolunteers[ranking.volunteer_index];
        return {
          ...volunteer,
          ai_score: ranking.score,
          ai_reason: ranking.reason,
          rank: index + 1,
        };
      });

      console.log('✅ AI ranking complete:', rankedVolunteers.length, 'volunteers ranked');
      toast.success(`AI ranked ${rankedVolunteers.length} volunteers!`);

      return rankedVolunteers;
    } catch (err: any) {
      console.error('❌ AI ranking error:', err);
      toast.error('AI ranking failed: ' + err.message);
      
      // Fallback: return volunteers without AI ranking
      return availableVolunteers.map((v, i) => ({
        ...v,
        ai_score: 0,
        ai_reason: 'AI ranking unavailable',
        rank: i + 1,
      }));
    } finally {
      setAiRanking(false);
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

      if (error) throw error;
      
      setNewTask({ 
        title: '', 
        description: '', 
        priority: 'Medium', 
        volunteers_required: '1' 
      });
      setShowCreateForm(false);
      
      toast.success('Task created successfully!');
      onTasksChange();
    } catch (err: any) {
      console.error('Error creating task:', err);
      toast.error(err.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const openAssignModal = async (task: Task) => {
    const slots = getRemainingSlots(task);
    setRemainingSlots(slots);
    setSelectedTask(task);
    setSelectedVolunteers([]);
    setShowAssignModal(true);

    // Get AI suggestions
    const ranked = await rankVolunteersWithAI(task, volunteers);
    setRankedVolunteers(ranked);
  };

  const toggleVolunteer = (volunteerId: string) => {
    setSelectedVolunteers(prev => {
      if (prev.includes(volunteerId)) {
        return prev.filter(id => id !== volunteerId);
      }

      if (prev.length >= remainingSlots) {
        toast.error(`You can only add ${remainingSlots} volunteer(s)`);
        return prev;
      }

      return [...prev, volunteerId];
    });
  };

  const selectTopAISuggestions = () => {
    const topVolunteers = rankedVolunteers
      .slice(0, remainingSlots)
      .map(v => v.id);
    setSelectedVolunteers(topVolunteers);
    toast.success(`Selected top ${topVolunteers.length} AI suggestions`);
  };

  const handleAssignVolunteers = async () => {
    if (!selectedTask) return;

    if (selectedVolunteers.length > remainingSlots) {
      toast.error(`You can only assign ${remainingSlots} volunteer(s)`);
      return;
    }

    if (selectedVolunteers.length === 0) {
      toast.error('Please select at least one volunteer');
      return;
    }

    setLoading(true);
    try {
      // Prepare assignments with AI data
      const assignments = selectedVolunteers.map(volunteerId => {
        const rankedVol = rankedVolunteers.find(v => v.id === volunteerId);
        return {
          task_id: selectedTask.task_id,
          volunteer_id: volunteerId,
          availability: true,
          status: 'shown',
          score: rankedVol?.ai_score || 0,
          reason: rankedVol?.ai_reason || 'Manually selected',
          rank: rankedVol?.rank || 999,
        };
      });

      const { data: assignData, error: assignError } = await supabase
        .from('recommended_for')
        .insert(assignments)
        .select();

      if (assignError) throw assignError;

      // Update task status
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ status: 'Assigned' })
        .eq('task_id', selectedTask.task_id)
        .neq('status', 'Completed');

      if (updateError) throw updateError;

      toast.success(`Task assigned to ${selectedVolunteers.length} volunteer(s)!`);
      
      setShowAssignModal(false);
      setSelectedTask(null);
      setSelectedVolunteers([]);
      setRankedVolunteers([]);
      
      await loadTaskAssignments();
      onTasksChange();
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

  const getRemainingSlots = (task: Task) => {
    const assignments = taskAssignments[task.task_id] || [];
    const acceptedCount = assignments.filter(a => a.status === 'accepted').length;
    const pendingCount = assignments.filter(a => a.status === 'shown').length;
    return Math.max(0, task.volunteers_required - acceptedCount - pendingCount);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number): any => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'secondary';
    return 'destructive';
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
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Create New Task with AI Suggestions
            </CardTitle>
            <CardDescription>AI will suggest the best volunteers based on their skills</CardDescription>
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
                placeholder="Provide detailed instructions about what volunteers will do..."
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

      {/* Volunteer Assignment Modal with AI Suggestions */}
      {showAssignModal && selectedTask && (
        <Card variant="elevated" className="border-2 border-purple-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  AI-Powered Volunteer Selection
                </CardTitle>
                <CardDescription>
                  Select {remainingSlots} volunteer(s) for: {selectedTask.title}
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setShowAssignModal(false);
                  setRankedVolunteers([]);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiRanking ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-12 h-12 animate-spin text-purple-500 mb-4" />
                <p className="text-lg font-medium">AI is analyzing volunteers...</p>
                <p className="text-sm text-muted-foreground">This may take a few seconds</p>
              </div>
            ) : (
              <>
                {rankedVolunteers.length > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-purple-600" />
                        <span className="font-medium text-purple-900">
                          AI Suggestions Ready
                        </span>
                      </div>
                      <Button
                        size="sm"
                        onClick={selectTopAISuggestions}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Star className="w-4 h-4 mr-2" />
                        Select Top {remainingSlots}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>
                    Select Volunteers ({selectedVolunteers.length}/{remainingSlots})
                  </Label>
                  <ScrollArea className="h-96 border rounded-lg p-4">
                    {rankedVolunteers.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No volunteers available
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {rankedVolunteers.map(volunteer => (
                          <div
                            key={volunteer.id}
                            className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                              selectedVolunteers.includes(volunteer.id)
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                            onClick={() => toggleVolunteer(volunteer.id)}
                          >
                            <Checkbox
                              checked={selectedVolunteers.includes(volunteer.id)}
                              onCheckedChange={() => toggleVolunteer(volunteer.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-xs">
                                  Rank #{volunteer.rank}
                                </Badge>
                                <Badge 
                                  variant={getScoreBadgeVariant(volunteer.ai_score)}
                                  className="text-xs"
                                >
                                  <Star className="w-3 h-3 mr-1" />
                                  {volunteer.ai_score}% Match
                                </Badge>
                              </div>
                              <p className="font-medium text-lg">{volunteer.name}</p>
                              <p className="text-sm text-muted-foreground mb-2">{volunteer.contact}</p>
                              
                              <div className="flex flex-wrap gap-1 mb-2">
                                {volunteer.skills?.map(skill => (
                                  <Badge key={skill} variant="secondary" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                              
                              <div className="bg-blue-50 border-l-4 border-blue-400 p-2 mt-2">
                                <p className="text-xs text-blue-900">
                                  <strong>AI Insight:</strong> {volunteer.ai_reason}
                                </p>
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
                    onClick={() => {
                      setShowAssignModal(false);
                      setRankedVolunteers([]);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <Card className="p-12 text-center">
          <ClipboardList className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Tasks Created</h3>
          <p className="text-muted-foreground">Create tasks and let AI suggest the best volunteers.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {tasks.map(task => {
            const stats = getTaskStats(task);
            const remainingSlots = getRemainingSlots(task);
            const needsAssignment = task.status !== 'Completed' && remainingSlots > 0 && stats.pending === 0;
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

                    <div className="flex gap-2 flex-col">
                      {needsAssignment && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => openAssignModal(task)}
                        >
                          <Sparkles className="w-4 h-4 mr-2 text-purple-300" />
                          {stats.accepted === 0 && stats.pending === 0
                            ? 'Get AI Suggestions'
                            : `Add ${remainingSlots} More`}
                        </Button>
                      )}
                      {stats.pending > 0 && remainingSlots > 0 && (
                        <p className="text-sm text-muted-foreground italic">
                          Waiting for {stats.pending} volunteer{stats.pending > 1 ? 's' : ''} to respond
                        </p>
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