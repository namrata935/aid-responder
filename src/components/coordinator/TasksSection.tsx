// src/components/coordinator/TasksSection.tsx
// Phase 2+: AI Rankings with Full Storage & Cascading Assignment

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
  TrendingUp,
  ChevronRight
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

interface VolunteerRanking {
  volunteer_id: string;
  volunteer_name: string;
  volunteer_skills: string[];
  score: number;
  reason: string;
  rank: number;
  status: string; // 'pending', 'shown', 'accepted', 'rejected'
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

// IMPORTANT: Replace with your actual Gemini API key
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;


export function TasksSection({ 
  tasks, 
  shelterId,
  shelterName,
  onTasksChange
}: TasksSectionProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showRankingsModal, setShowRankingsModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiRanking, setAiRanking] = useState(false);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskRankings, setTaskRankings] = useState<Record<number, VolunteerRanking[]>>({});
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
      loadTaskRankingsAndAssignments();
    }
  }, [tasks]);

  const loadVolunteers = async () => {
    try {
      const { data, error } = await supabase
        .from('volunteers')
        .select('*')
        .eq('availability', 'available');

      if (error) throw error;
      setVolunteers(data || []);
    } catch (err: any) {
      console.error('Error loading volunteers:', err);
      toast.error('Failed to load volunteers');
    }
  };

  const loadTaskRankingsAndAssignments = async () => {
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
          volunteers (name, skills)
        `)
        .in('task_id', taskIds)
        .order('rank', { ascending: true });

      if (error) throw error;

      // Organize rankings by task
      const rankingsMap: Record<number, VolunteerRanking[]> = {};
      const assignmentsMap: Record<number, TaskAssignment[]> = {};

      data?.forEach((item: any) => {
        // Add to rankings
        if (!rankingsMap[item.task_id]) {
          rankingsMap[item.task_id] = [];
        }
        rankingsMap[item.task_id].push({
          volunteer_id: item.volunteer_id,
          volunteer_name: item.volunteers?.name || 'Unknown',
          volunteer_skills: item.volunteers?.skills || [],
          score: item.score || 0,
          reason: item.reason || '',
          rank: item.rank || 999,
          status: item.status,
        });

        // Add to assignments (only shown/accepted/rejected)
        if (['shown', 'accepted', 'rejected'].includes(item.status)) {
          if (!assignmentsMap[item.task_id]) {
            assignmentsMap[item.task_id] = [];
          }
          assignmentsMap[item.task_id].push({
            task_id: item.task_id,
            volunteer_id: item.volunteer_id,
            volunteer_name: item.volunteers?.name || 'Unknown',
            status: item.status,
          });
        }
      });

      setTaskRankings(rankingsMap);
      setTaskAssignments(assignmentsMap);
      
      await checkAndUpdateTaskStatuses(assignmentsMap);
    } catch (err: any) {
      console.error('Error loading rankings:', err);
    }
  };

  const checkAndUpdateTaskStatuses = async (assignmentMap: Record<number, TaskAssignment[]>) => {
    try {
      const updatePromises = tasks.map(async (task) => {
        const assignments = assignmentMap[task.task_id] || [];
        const acceptedCount = assignments.filter(a => a.status === 'accepted').length;
        
        if (acceptedCount >= task.volunteers_required && task.status !== 'Completed') {
          await supabase
            .from('tasks')
            .update({ status: 'Completed' })
            .eq('task_id', task.task_id);
          onTasksChange();
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

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
            }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!aiText) throw new Error('No response from Gemini');

      let cleanedText = aiText.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
      const rankings = JSON.parse(cleanedText);

      if (!Array.isArray(rankings)) throw new Error('AI response is not an array');

      // Store ALL rankings in database
      const rankingsToStore = rankings.map((ranking: any, index: number) => {
        const volunteer = availableVolunteers[ranking.volunteer_index];
        return {
          task_id: task.task_id,
          volunteer_id: volunteer.id,
          availability: true,
          status: 'pending', // All start as pending
          score: ranking.score,
          reason: ranking.reason,
          rank: index + 1,
        };
      });

      // Insert ALL rankings at once
      const { error: insertError } = await supabase
        .from('recommended_for')
        .insert(rankingsToStore);

      if (insertError) throw insertError;

      // Now auto-assign top N volunteers
      const topN = rankingsToStore.slice(0, task.volunteers_required);
      const topNIds = topN.map(r => r.volunteer_id);

      // Update their status to 'shown'
      const { error: updateError } = await supabase
        .from('recommended_for')
        .update({ status: 'shown' })
        .eq('task_id', task.task_id)
        .in('volunteer_id', topNIds);

      if (updateError) throw updateError;

      // Update task status
      await supabase
        .from('tasks')
        .update({ status: 'Assigned' })
        .eq('task_id', task.task_id);

      toast.success(`AI ranked ${rankings.length} volunteers and assigned top ${task.volunteers_required}!`);
      
      await loadTaskRankingsAndAssignments();
      onTasksChange();

      return rankings;
    } catch (err: any) {
      console.error('AI ranking error:', err);
      toast.error('AI ranking failed: ' + err.message);
      return [];
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
      toast.error('Please enter a valid number of volunteers');
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
        .select()
        .single();

      if (error) throw error;
      
      setNewTask({ 
        title: '', 
        description: '', 
        priority: 'Medium', 
        volunteers_required: '1' 
      });
      setShowCreateForm(false);
      
      // Automatically run AI ranking
      toast.success('Task created! Getting AI suggestions...');
      await rankVolunteersWithAI(data, volunteers);
      
    } catch (err: any) {
      console.error('Error creating task:', err);
      toast.error(err.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignNextVolunteer = async (task: Task) => {
    const rankings = taskRankings[task.task_id] || [];
    const assignments = taskAssignments[task.task_id] || [];
    
    // Find next pending volunteer
    const nextVolunteer = rankings.find(r => r.status === 'pending');
    
    if (!nextVolunteer) {
      toast.error('No more volunteers available in rankings');
      return;
    }

    const acceptedCount = assignments.filter(a => a.status === 'accepted').length;
    const pendingCount = assignments.filter(a => a.status === 'shown').length;
    const remainingSlots = task.volunteers_required - acceptedCount - pendingCount;

    if (remainingSlots <= 0) {
      toast.error('All volunteer slots are filled or pending');
      return;
    }

    setLoading(true);
    try {
      // Update status to 'shown'
      const { error } = await supabase
        .from('recommended_for')
        .update({ status: 'shown' })
        .eq('task_id', task.task_id)
        .eq('volunteer_id', nextVolunteer.volunteer_id);

      if (error) throw error;

      toast.success(`Assigned to ${nextVolunteer.volunteer_name} (Rank #${nextVolunteer.rank})`);
      await loadTaskRankingsAndAssignments();
    } catch (err: any) {
      console.error('Error assigning next volunteer:', err);
      toast.error('Failed to assign next volunteer');
    } finally {
      setLoading(false);
    }
  };

  const openRankingsModal = (task: Task) => {
    setSelectedTask(task);
    setShowRankingsModal(true);
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
              Create Task with AI Auto-Assignment
            </CardTitle>
            <CardDescription>
              AI will rank all volunteers and automatically assign the top matches
            </CardDescription>
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
                placeholder="Describe what volunteers will do, required skills, etc..."
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

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-sm text-purple-900">
                <strong>✨ AI Magic:</strong> When you create this task, AI will automatically rank 
                all volunteers and assign the top {newTask.volunteers_required} match(es). 
                You can view all rankings and manually assign more if needed.
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleCreateTask} 
                variant="hero"
                disabled={loading || aiRanking}
              >
                {loading || aiRanking ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {aiRanking ? 'AI Ranking...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create & Auto-Assign
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCreateForm(false)}
                disabled={loading || aiRanking}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View All Rankings Modal */}
      {showRankingsModal && selectedTask && (
        <Card variant="elevated" className="border-2 border-purple-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                  All AI Rankings
                </CardTitle>
                <CardDescription>
                  {selectedTask.title}
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowRankingsModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {(taskRankings[selectedTask.task_id] || []).map((ranking, idx) => (
                  <div
                    key={ranking.volunteer_id}
                    className={`p-4 rounded-lg border-2 ${
                      ranking.status === 'accepted' ? 'border-green-500 bg-green-50' :
                      ranking.status === 'rejected' ? 'border-red-500 bg-red-50' :
                      ranking.status === 'shown' ? 'border-yellow-500 bg-yellow-50' :
                      'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Rank #{ranking.rank}</Badge>
                        <Badge variant={getScoreBadgeVariant(ranking.score)}>
                          <Star className="w-3 h-3 mr-1" />
                          {ranking.score}%
                        </Badge>
                        <Badge variant={
                          ranking.status === 'accepted' ? 'success' :
                          ranking.status === 'rejected' ? 'destructive' :
                          ranking.status === 'shown' ? 'secondary' :
                          'outline'
                        }>
                          {ranking.status}
                        </Badge>
                      </div>
                    </div>
                    <p className="font-medium text-lg mb-1">{ranking.volunteer_name}</p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {ranking.volunteer_skills?.map(skill => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-blue-900 bg-blue-50 p-2 rounded">
                      <strong>AI:</strong> {ranking.reason}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <Card className="p-12 text-center">
          <ClipboardList className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Tasks Created</h3>
          <p className="text-muted-foreground">
            Create tasks and AI will automatically rank and assign volunteers.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {tasks.map(task => {
            const stats = getTaskStats(task);
            const remainingSlots = getRemainingSlots(task);
            const rankings = taskRankings[task.task_id] || [];
            const hasRankings = rankings.length > 0;
            const hasPendingRankings = rankings.some(r => r.status === 'pending');
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
                      {hasRankings && (
                        <Badge variant="ai" className="bg-purple-100 text-purple-700">
                          <Sparkles className="w-3 h-3 mr-1" />
                          AI Ranked
                        </Badge>
                      )}
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
                          <span>{stats.accepted + stats.pending}/{task.volunteers_required}</span>
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
                            <span>{stats.pending} pending response</span>
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

                    <div className="flex flex-wrap gap-2">
                      {task.status === 'Created' && !hasRankings && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => rankVolunteersWithAI(task, volunteers)}
                          disabled={aiRanking || loading}
                        >
                          {aiRanking ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              AI Ranking...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Get AI Suggestions
                            </>
                          )}
                        </Button>
                      )}

                      {hasRankings && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openRankingsModal(task)}
                        >
                          <TrendingUp className="w-4 h-4 mr-2" />
                          View All Rankings ({rankings.length})
                        </Button>
                      )}

                      {hasPendingRankings && remainingSlots > 0 && task.status !== 'Completed' && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleAssignNextVolunteer(task)}
                          disabled={loading}
                        >
                          {loading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <>
                              <ChevronRight className="w-4 h-4 mr-2" />
                              Assign Next Volunteer
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    {stats.rejected > 0 && hasPendingRankings && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-900">
                          <strong>💡 Tip:</strong> {stats.rejected} volunteer(s) rejected. 
                          Click "Assign Next Volunteer" to assign from the ranked list.
                        </p>
                      </div>
                    )}

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