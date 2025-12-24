import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Shelter, Victim, Volunteer, Task, Resource, Donation, VolunteerSkill } from '@/types';

// Mock initial data
const initialShelters: Shelter[] = [
  {
    id: '1',
    name: 'Central Relief Camp',
    address: '123 Main Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    location: { latitude: 19.0760, longitude: 72.8777 },
    totalCapacity: 500,
    currentOccupancy: 320,
    contactNumber: '+91 9876543210',
    managerName: 'Rahul Sharma',
    managerContact: '+91 9876543211',
    coordinatorId: 'coord1',
    createdAt: new Date(),
  },
  {
    id: '2',
    name: 'East Zone Shelter',
    address: '456 Park Avenue',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400051',
    location: { latitude: 19.0596, longitude: 72.8295 },
    totalCapacity: 300,
    currentOccupancy: 150,
    contactNumber: '+91 9876543220',
    managerName: 'Priya Patel',
    managerContact: '+91 9876543221',
    coordinatorId: 'coord2',
    createdAt: new Date(),
  },
  {
    id: '3',
    name: 'North Community Center',
    address: '789 Hill Road',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400080',
    location: { latitude: 19.1136, longitude: 72.8697 },
    totalCapacity: 400,
    currentOccupancy: 398,
    contactNumber: '+91 9876543230',
    managerName: 'Amit Kumar',
    managerContact: '+91 9876543231',
    coordinatorId: 'coord3',
    createdAt: new Date(),
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

const initialVolunteers: Volunteer[] = [
  {
    id: 'vol1',
    userId: 'user1',
    name: 'Raj Kumar',
    contactNumber: '+91 9876543100',
    city: 'Mumbai',
    skills: ['first_aid', 'driving', 'logistics'],
    availability: 'available',
    location: { latitude: 19.0728, longitude: 72.8826 },
    profileCompleted: true,
    createdAt: new Date(),
  },
];

interface DataContextType {
  shelters: Shelter[];
  victims: Victim[];
  volunteers: Volunteer[];
  tasks: Task[];
  resources: Resource[];
  donations: Donation[];
  
  // Shelter operations
  addShelter: (shelter: Omit<Shelter, 'id' | 'createdAt'>) => Shelter;
  updateShelter: (id: string, data: Partial<Shelter>) => void;
  
  // Victim operations
  registerVictim: (victim: Omit<Victim, 'id' | 'createdAt' | 'assignedShelterId'>) => { victim: Victim; shelter: Shelter | null };
  
  // Volunteer operations
  addVolunteer: (volunteer: Omit<Volunteer, 'id' | 'createdAt'>) => Volunteer;
  updateVolunteer: (id: string, data: Partial<Volunteer>) => void;
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
  findNearestAvailableShelter: (location: { latitude: number; longitude: number }) => { shelter: Shelter; distance: number } | null;
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
  const [shelters, setShelters] = useState<Shelter[]>(initialShelters);
  const [victims, setVictims] = useState<Victim[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>(initialVolunteers);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [donations, setDonations] = useState<Donation[]>([]);

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

  const findNearestAvailableShelter = (location: { latitude: number; longitude: number }) => {
    const availableShelters = shelters.filter(s => s.currentOccupancy < s.totalCapacity);
    if (availableShelters.length === 0) return null;

    let nearest = availableShelters[0];
    let minDistance = calculateDistance(location, nearest.location);

    for (const shelter of availableShelters) {
      const distance = calculateDistance(location, shelter.location);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = shelter;
      }
    }

    return { shelter: nearest, distance: Math.round(minDistance * 10) / 10 };
  };

  const registerVictim = (victimData: Omit<Victim, 'id' | 'createdAt' | 'assignedShelterId'>) => {
    const result = findNearestAvailableShelter(victimData.location);
    
    const newVictim: Victim = {
      ...victimData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      assignedShelterId: result?.shelter.id,
    };

    setVictims(prev => [...prev, newVictim]);

    if (result) {
      updateShelter(result.shelter.id, {
        currentOccupancy: result.shelter.currentOccupancy + 1,
      });
    }

    return { victim: newVictim, shelter: result?.shelter || null };
  };

  const addVolunteer = (volunteerData: Omit<Volunteer, 'id' | 'createdAt'>) => {
    const newVolunteer: Volunteer = {
      ...volunteerData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    setVolunteers(prev => [...prev, newVolunteer]);
    return newVolunteer;
  };

  const updateVolunteer = (id: string, data: Partial<Volunteer>) => {
    setVolunteers(prev => prev.map(v => v.id === id ? { ...v, ...data } : v));
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
