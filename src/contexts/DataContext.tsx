import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Shelter, Victim, Volunteer, Task, Resource, Donation, VolunteerSkill } from '@/types';
import { supabase } from '@/lib/supabase';

// Mock initial data (kept for tasks, resources, donations)
const initialTasks: Task[] = [
  {
    id: '1',
    title: 'Medical Supply Distribution',
    description: 'Distribute medical supplies to families in Block A. Ensure each family receives one first-aid kit and necessary medications. Priority should be given to elderly and children. Document distribution for records.',
    priority: 'high',
    status: 'assigned',
    shelterId: '1',
    shelterName: 'Central Relief Camp',
    assignedVolunteerId: 'vol1',
    assignedVolunteerName: 'Raj Kumar',
    requiredSkills: ['medical', 'logistics'],
    aiAssigned: true,
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(),
  },
  {
    id: '2',
    title: 'Food Preparation Assistance',
    description: 'Help in the community kitchen to prepare meals for 200+ people. Tasks include vegetable cutting, cooking assistance, and meal packaging. Shift: 6 AM to 12 PM.',
    priority: 'medium',
    status: 'created',
    shelterId: '1',
    shelterName: 'Central Relief Camp',
    requiredSkills: ['cooking'],
    aiAssigned: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const initialResources: Resource[] = [
  { id: '1', shelterId: '1', type: 'food', quantityAvailable: 500, quantityNeeded: 1000, unit: 'kg', lastUpdated: new Date() },
  { id: '2', shelterId: '1', type: 'water', quantityAvailable: 2000, quantityNeeded: 3000, unit: 'liters', lastUpdated: new Date() },
  { id: '3', shelterId: '1', type: 'medicine', quantityAvailable: 100, quantityNeeded: 200, unit: 'kits', lastUpdated: new Date() },
  { id: '4', shelterId: '1', type: 'blankets', quantityAvailable: 300, quantityNeeded: 500, unit: 'pieces', lastUpdated: new Date() },
  { id: '5', shelterId: '2', type: 'food', quantityAvailable: 300, quantityNeeded: 600, unit: 'kg', lastUpdated: new Date() },
  { id: '6', shelterId: '2', type: 'water', quantityAvailable: 1500, quantityNeeded: 2000, unit: 'liters', lastUpdated: new Date() },
];

interface DataContextType {
  shelters: Shelter[];
  victims: Victim[];
  volunteers: Volunteer[];
  tasks: Task[];
  resources: Resource[];
  donations: Donation[];
  loading: boolean;
  
  // Shelter operations
  addShelter: (shelter: Omit<Shelter, 'id' | 'createdAt'>) => Shelter;
  updateShelter: (id: string, data: Partial<Shelter>) => void;
  
  // Victim operations
  registerVictim: (victim: Omit<Victim, 'id' | 'createdAt' | 'assignedShelterId'>) => { victim: Victim; shelter: Shelter | null };
  
  // Volunteer operations
  addVolunteer: (volunteer: Omit<Volunteer, 'id' | 'createdAt'>) => Promise<Volunteer>;
  updateVolunteer: (id: string, data: Partial<Volunteer>) => Promise<void>;
  getVolunteerByUserId: (userId: string) => Volunteer | undefined;
  
  // Task operations
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'aiAssigned'>) => Task;
  updateTask: (id: string, data: Partial<Task>) => void;
  assignTaskToVolunteer: (taskId: string, volunteerId: string) => void;
  getTasksByVolunteer: (volunteerId: string) => Task[];
  getTasksByShelter: (shelterId: string) => Task[];
  
  // Resource operations
  addResource: (resource: Omit<Resource, 'id' | 'lastUpdated'>) => Resource;
  updateResource: (id: string, data: Partial<Resource>) => void;
  getResourcesByShelter: (shelterId: string) => Resource[];
  
  // Donation operations
  addDonation: (donation: Omit<Donation, 'id' | 'createdAt'>) => void;
  
  // AI Assignment
  runAIAssignment: (taskId: string) => void;
  
  // Utility
  getShelterById: (id: string) => Shelter | undefined;
  findNearestAvailableShelter: (location: { latitude: number; longitude: number }) => Promise<{ shelter: Shelter; distance: number } | null>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

function calculateDistance(loc1: { latitude: number; longitude: number }, loc2: { latitude: number; longitude: number }): number {
  const R = 6371; // Earth's radius in km
  const dLat = (loc2.latitude - loc1.latitude) * Math.PI / 180;
  const dLon = (loc2.longitude - loc1.longitude) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(loc1.latitude * Math.PI / 180) * Math.cos(loc2.latitude * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [victims, setVictims] = useState<Victim[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch shelters and volunteers from Supabase on mount
  useEffect(() => {
    fetchShelters();
    fetchVolunteers();
  }, []);

  const fetchShelters = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shelters')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform database shelters to app format
      const transformedShelters: Shelter[] = (data || []).map(shelter => ({
        id: shelter.id,
        name: shelter.name,
        address: shelter.address,
        city: shelter.city,
        state: shelter.state,
        pincode: shelter.pincode,
        location: {
          latitude: parseFloat(shelter.latitude),
          longitude: parseFloat(shelter.longitude),
        },
        totalCapacity: shelter.capacity,
        currentOccupancy: shelter.current_occupancy,
        contactNumber: shelter.contact_number,
        managerName: shelter.manager_name,
        managerContact: shelter.manager_contact,
        coordinatorId: shelter.coordinator_id,
        createdAt: new Date(shelter.created_at),
      }));

      setShelters(transformedShelters);
    } catch (error) {
      console.error('Error fetching shelters:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVolunteers = async () => {
    try {
      const { data, error } = await supabase
        .from('volunteers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform database volunteers to app format
      const transformedVolunteers: Volunteer[] = (data || []).map(volunteer => ({
        id: volunteer.id,
        userId: volunteer.id, // The volunteer id IS the user id (UUID from auth)
        name: volunteer.name,
        contactNumber: volunteer.contact,
        skills: volunteer.skills || [],
        availability: volunteer.availability || 'available',
        profileCompleted: !!(volunteer.name && volunteer.contact && volunteer.skills?.length > 0),
        createdAt: new Date(volunteer.created_at),
      }));

      setVolunteers(transformedVolunteers);
    } catch (error) {
      console.error('Error fetching volunteers:', error);
    }
  };

  const addShelter = (shelterData: Omit<Shelter, 'id' | 'createdAt'>) => {
    const newShelter: Shelter = {
      ...shelterData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    setShelters(prev => [...prev, newShelter]);
    return newShelter;
  };

  const updateShelter = (id: string, data: Partial<Shelter>) => {
    setShelters(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  };

  const findNearestAvailableShelter = async (location: { latitude: number; longitude: number }) => {
    console.log('🔍 Finding nearest shelter for location:', location);
    
    // Fetch latest shelters from database to ensure we have current occupancy
    const { data, error } = await supabase
      .from('shelters')
      .select('*');

    if (error) {
      console.error('❌ Error fetching shelters:', error);
      return null;
    }

    console.log('📊 Total shelters fetched from database:', data?.length || 0);
    console.log('🏠 All shelters:', data);

    // Transform and filter available shelters
    const availableShelters: Shelter[] = (data || [])
      .filter(s => {
        const isAvailable = s.current_occupancy < s.capacity;
        console.log(`🏠 ${s.name}: ${s.current_occupancy}/${s.capacity} - Available: ${isAvailable}`);
        return isAvailable;
      })
      .map(shelter => ({
        id: shelter.id,
        name: shelter.name,
        address: shelter.address,
        city: shelter.city,
        state: shelter.state,
        pincode: shelter.pincode,
        location: {
          latitude: parseFloat(shelter.latitude),
          longitude: parseFloat(shelter.longitude),
        },
        totalCapacity: shelter.capacity,
        currentOccupancy: shelter.current_occupancy,
        contactNumber: shelter.contact_number,
        managerName: shelter.manager_name,
        managerContact: shelter.manager_contact,
        coordinatorId: shelter.coordinator_id,
        createdAt: new Date(shelter.created_at),
      }));

    console.log('✅ Available shelters after filtering:', availableShelters.length);

    if (availableShelters.length === 0) {
      console.log('❌ No available shelters found');
      return null;
    }

    let nearest = availableShelters[0];
    let minDistance = calculateDistance(location, nearest.location);

    console.log(`📍 Initial shelter: ${nearest.name}, Distance: ${minDistance.toFixed(2)} km`);

    for (const shelter of availableShelters) {
      const distance = calculateDistance(location, shelter.location);
      console.log(`📍 Checking ${shelter.name}: Distance: ${distance.toFixed(2)} km`);
      
      if (distance < minDistance) {
        minDistance = distance;
        nearest = shelter;
        console.log(`✨ New nearest shelter: ${nearest.name} at ${minDistance.toFixed(2)} km`);
      }
    }

    const result = { shelter: nearest, distance: Math.round(minDistance * 10) / 10 };
    console.log('🎯 Final result:', result);
    
    return result;
  };

  const registerVictim = (victimData: Omit<Victim, 'id' | 'createdAt' | 'assignedShelterId'>) => {
    // Note: This function is kept for compatibility but the actual registration
    // should happen in VictimDashboard using Supabase directly
    const newVictim: Victim = {
      ...victimData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      assignedShelterId: undefined,
    };

    setVictims(prev => [...prev, newVictim]);
    return { victim: newVictim, shelter: null };
  };

  const addVolunteer = async (volunteerData: Omit<Volunteer, 'id' | 'createdAt'>) => {
    try {
      // Insert into Supabase
      const { data, error } = await supabase
        .from('volunteers')
        .insert({
          id: volunteerData.userId, // Use userId as the primary key
          name: volunteerData.name,
          contact: volunteerData.contactNumber,
          skills: volunteerData.skills,
          availability: volunteerData.availability,
          
        })
        .select()
        .single();

      if (error) throw error;

      // Transform back to app format
      const newVolunteer: Volunteer = {
        id: data.id,
        userId: data.id,
        name: data.name,
        contactNumber: data.contact,
        skills: data.skills || [],
        availability: data.availability || 'available',
        
        profileCompleted: volunteerData.profileCompleted,
        createdAt: new Date(data.created_at),
      };

      // Update local state
      setVolunteers(prev => [...prev, newVolunteer]);
      
      return newVolunteer;
    } catch (error) {
      console.error('Error adding volunteer:', error);
      throw error;
    }
  };

  const updateVolunteer = async (id: string, data: Partial<Volunteer>) => {
    try {
      // Prepare update object for Supabase
      const updateData: any = {};
      
      if (data.name !== undefined) updateData.name = data.name;
      if (data.contactNumber !== undefined) updateData.contact = data.contactNumber;
      if (data.city !== undefined) updateData.city = data.city;
      if (data.skills !== undefined) updateData.skills = data.skills;
      if (data.availability !== undefined) updateData.availability = data.availability;
      

      // Update in Supabase
      const { error } = await supabase
        .from('volunteers')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setVolunteers(prev => prev.map(v => v.id === id ? { ...v, ...data } : v));
    } catch (error) {
      console.error('Error updating volunteer:', error);
      throw error;
    }
  };

  const getVolunteerByUserId = (userId: string) => {
    return volunteers.find(v => v.userId === userId);
  };

  const addTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'aiAssigned'>) => {
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      aiAssigned: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setTasks(prev => [...prev, newTask]);
    return newTask;
  };

  const updateTask = (id: string, data: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data, updatedAt: new Date() } : t));
  };

  const assignTaskToVolunteer = (taskId: string, volunteerId: string) => {
    const volunteer = volunteers.find(v => v.id === volunteerId);
    if (volunteer) {
      updateTask(taskId, {
        assignedVolunteerId: volunteerId,
        assignedVolunteerName: volunteer.name,
        status: 'assigned',
        aiAssigned: true,
      });
    }
  };

  const getTasksByVolunteer = (volunteerId: string) => {
    return tasks.filter(t => t.assignedVolunteerId === volunteerId);
  };

  const getTasksByShelter = (shelterId: string) => {
    return tasks.filter(t => t.shelterId === shelterId);
  };

  const runAIAssignment = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Find best matching volunteer based on skills and availability
    const availableVolunteers = volunteers.filter(v => 
      v.availability === 'available' && v.profileCompleted
    );

    if (availableVolunteers.length === 0) return;

    // Score volunteers based on skill match
    const scored = availableVolunteers.map(vol => {
      const matchingSkills = task.requiredSkills.filter(skill => 
        vol.skills.includes(skill)
      );
      return {
        volunteer: vol,
        score: matchingSkills.length,
      };
    });

    // Sort by score and pick the best
    scored.sort((a, b) => b.score - a.score);
    
    if (scored[0] && scored[0].score > 0) {
      assignTaskToVolunteer(taskId, scored[0].volunteer.id);
    }
  };

  const addResource = (resourceData: Omit<Resource, 'id' | 'lastUpdated'>) => {
    const newResource: Resource = {
      ...resourceData,
      id: crypto.randomUUID(),
      lastUpdated: new Date(),
    };
    setResources(prev => [...prev, newResource]);
    return newResource;
  };

  const updateResource = (id: string, data: Partial<Resource>) => {
    setResources(prev => prev.map(r => r.id === id ? { ...r, ...data, lastUpdated: new Date() } : r));
  };

  const getResourcesByShelter = (shelterId: string) => {
    return resources.filter(r => r.shelterId === shelterId);
  };

  const addDonation = (donationData: Omit<Donation, 'id' | 'createdAt'>) => {
    const newDonation: Donation = {
      ...donationData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    setDonations(prev => [...prev, newDonation]);

    // Update resource quantity
    const resource = resources.find(r => 
      r.shelterId === donationData.shelterId && r.type === donationData.resourceType
    );
    if (resource) {
      updateResource(resource.id, {
        quantityAvailable: resource.quantityAvailable + donationData.quantity,
      });
    }
  };

  const getShelterById = (id: string) => shelters.find(s => s.id === id);

  return (
    <DataContext.Provider value={{
      shelters,
      victims,
      volunteers,
      tasks,
      resources,
      donations,
      loading,
      addShelter,
      updateShelter,
      registerVictim,
      addVolunteer,
      updateVolunteer,
      getVolunteerByUserId,
      addTask,
      updateTask,
      assignTaskToVolunteer,
      getTasksByVolunteer,
      getTasksByShelter,
      runAIAssignment,
      addResource,
      updateResource,
      getResourcesByShelter,
      addDonation,
      getShelterById,
      findNearestAvailableShelter,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}