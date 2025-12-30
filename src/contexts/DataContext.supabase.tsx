import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Shelter, Victim, Volunteer, Task, Resource, Donation, VolunteerSkill } from '@/types';
import { supabase } from '@/lib/supabase';

interface DataContextType {
  shelters: Shelter[];
  victims: Victim[];
  volunteers: Volunteer[];
  tasks: Task[];
  resources: Resource[];
  donations: Donation[];
  
  // Shelter operations
  addShelter: (shelter: Omit<Shelter, 'id' | 'createdAt'>) => Promise<Shelter>;
  updateShelter: (id: string, data: Partial<Shelter>) => Promise<void>;
  
  // Victim operations
  registerVictim: (victim: Omit<Victim, 'id' | 'createdAt' | 'assignedShelterId'>) => Promise<{ victim: Victim; shelter: Shelter | null }>;
  
  // Volunteer operations
  addVolunteer: (volunteer: Omit<Volunteer, 'id' | 'createdAt'>) => Promise<Volunteer>;
  updateVolunteer: (id: string, data: Partial<Volunteer>) => Promise<void>;
  getVolunteerByUserId: (userId: string) => Volunteer | undefined;
  
  // Task operations
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'aiAssigned'>) => Promise<Task>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  assignTaskToVolunteer: (taskId: string, volunteerId: string) => Promise<void>;
  getTasksByVolunteer: (volunteerId: string) => Task[];
  getTasksByShelter: (shelterId: string) => Task[];
  
  // Resource operations
  addResource: (resource: Omit<Resource, 'id' | 'lastUpdated'>) => Promise<Resource>;
  updateResource: (id: string, data: Partial<Resource>) => Promise<void>;
  getResourcesByShelter: (shelterId: string) => Resource[];
  
  // Donation operations
  addDonation: (donation: Omit<Donation, 'id' | 'createdAt'>) => Promise<void>;
  
  // AI Assignment
  runAIAssignment: (taskId: string) => Promise<void>;
  
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

// Helper functions to convert between DB and app types
const dbToShelter = (db: any): Shelter => ({
  id: db.id,
  name: db.name,
  address: db.address,
  city: db.city,
  state: db.state,
  pincode: db.pincode,
  location: { latitude: db.latitude, longitude: db.longitude },
  totalCapacity: db.total_capacity,
  currentOccupancy: db.current_occupancy,
  contactNumber: db.contact_number,
  managerName: db.manager_name,
  managerContact: db.manager_contact,
  managerAddress: db.manager_address,
  managerState: db.manager_state,
  managerPincode: db.manager_pincode,
  coordinatorId: db.coordinator_id,
  createdAt: new Date(db.created_at),
});

const shelterToDb = (shelter: Omit<Shelter, 'id' | 'createdAt'>) => ({
  name: shelter.name,
  address: shelter.address,
  city: shelter.city,
  state: shelter.state,
  pincode: shelter.pincode,
  latitude: shelter.location.latitude,
  longitude: shelter.location.longitude,
  total_capacity: shelter.totalCapacity,
  current_occupancy: shelter.currentOccupancy,
  contact_number: shelter.contactNumber,
  manager_name: shelter.managerName,
  manager_contact: shelter.managerContact,
  manager_address: shelter.managerAddress,
  manager_state: shelter.managerState,
  manager_pincode: shelter.managerPincode,
  coordinator_id: shelter.coordinatorId,
});

export function DataProvider({ children }: { children: ReactNode }) {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [victims, setVictims] = useState<Victim[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);

  // Load initial data
  useEffect(() => {
    loadShelters();
    loadVictims();
    loadVolunteers();
    loadTasks();
    loadResources();
    loadDonations();
  }, []);

  const loadShelters = async () => {
    const { data, error } = await supabase.from('shelters').select('*');
    if (!error && data) {
      setShelters(data.map(dbToShelter));
    }
  };

  const loadVictims = async () => {
    const { data, error } = await supabase.from('victims').select('*');
    if (!error && data) {
      setVictims(data.map((v: any) => ({
        id: v.id,
        visitorId: v.visitor_id,
        name: v.name,
        age: v.age,
        gender: v.gender,
        medicalCondition: v.medical_condition,
        location: { latitude: v.latitude, longitude: v.longitude },
        assignedShelterId: v.assigned_shelter_id,
        createdAt: new Date(v.created_at),
      })));
    }
  };

  const loadVolunteers = async () => {
    const { data, error } = await supabase.from('volunteers').select('*');
    if (!error && data) {
      setVolunteers(data.map((v: any) => ({
        id: v.id,
        userId: v.user_id,
        name: v.name,
        contactNumber: v.contact_number,
        city: v.city,
        skills: v.skills,
        availability: v.availability,
        location: { latitude: v.latitude, longitude: v.longitude },
        profileCompleted: v.profile_completed,
        createdAt: new Date(v.created_at),
      })));
    }
  };

  const loadTasks = async () => {
    const { data, error } = await supabase.from('tasks').select('*');
    if (!error && data) {
      setTasks(data.map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        priority: t.priority,
        status: t.status,
        shelterId: t.shelter_id,
        shelterName: t.shelter_name,
        assignedVolunteerId: t.assigned_volunteer_id,
        assignedVolunteerName: t.assigned_volunteer_name,
        requiredSkills: t.required_skills,
        aiAssigned: t.ai_assigned,
        createdAt: new Date(t.created_at),
        updatedAt: new Date(t.updated_at),
      })));
    }
  };

  const loadResources = async () => {
    const { data, error } = await supabase.from('resources').select('*');
    if (!error && data) {
      setResources(data.map((r: any) => ({
        id: r.id,
        shelterId: r.shelter_id,
        type: r.type,
        quantityAvailable: r.quantity_available,
        quantityNeeded: r.quantity_needed,
        unit: r.unit,
        lastUpdated: new Date(r.last_updated),
      })));
    }
  };

  const loadDonations = async () => {
    const { data, error } = await supabase.from('donations').select('*');
    if (!error && data) {
      setDonations(data.map((d: any) => ({
        id: d.id,
        shelterId: d.shelter_id,
        resourceType: d.resource_type,
        quantity: d.quantity,
        donorName: d.donor_name,
        donorContact: d.donor_contact,
        createdAt: new Date(d.created_at),
      })));
    }
  };

  const addShelter = async (shelterData: Omit<Shelter, 'id' | 'createdAt'>): Promise<Shelter> => {
    const { data, error } = await supabase
      .from('shelters')
      .insert(shelterToDb(shelterData))
      .select()
      .single();

    if (error) throw error;
    const newShelter = dbToShelter(data);
    setShelters(prev => [...prev, newShelter]);
    return newShelter;
  };

  const updateShelter = async (id: string, data: Partial<Shelter>): Promise<void> => {
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.address) updateData.address = data.address;
    if (data.city) updateData.city = data.city;
    if (data.state) updateData.state = data.state;
    if (data.pincode) updateData.pincode = data.pincode;
    if (data.location) {
      updateData.latitude = data.location.latitude;
      updateData.longitude = data.location.longitude;
    }
    if (data.totalCapacity !== undefined) updateData.total_capacity = data.totalCapacity;
    if (data.currentOccupancy !== undefined) updateData.current_occupancy = data.currentOccupancy;
    if (data.contactNumber) updateData.contact_number = data.contactNumber;
    if (data.managerName) updateData.manager_name = data.managerName;
    if (data.managerContact) updateData.manager_contact = data.managerContact;
    if (data.managerAddress !== undefined) updateData.manager_address = data.managerAddress;
    if (data.managerState !== undefined) updateData.manager_state = data.managerState;
    if (data.managerPincode !== undefined) updateData.manager_pincode = data.managerPincode;

    const { error } = await supabase
      .from('shelters')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    await loadShelters();
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

  const registerVictim = async (victimData: Omit<Victim, 'id' | 'createdAt' | 'assignedShelterId'>): Promise<{ victim: Victim; shelter: Shelter | null }> => {
    const result = findNearestAvailableShelter(victimData.location);
    
    const { data, error } = await supabase
      .from('victims')
      .insert({
        visitor_id: victimData.visitorId,
        name: victimData.name,
        age: victimData.age,
        gender: victimData.gender,
        medical_condition: victimData.medicalCondition,
        latitude: victimData.location.latitude,
        longitude: victimData.location.longitude,
        assigned_shelter_id: result?.shelter.id,
      })
      .select()
      .single();

    if (error) throw error;

    const newVictim: Victim = {
      id: data.id,
      visitorId: data.visitor_id,
      name: data.name,
      age: data.age,
      gender: data.gender,
      medicalCondition: data.medical_condition,
      location: { latitude: data.latitude, longitude: data.longitude },
      assignedShelterId: data.assigned_shelter_id,
      createdAt: new Date(data.created_at),
    };

    setVictims(prev => [...prev, newVictim]);

    if (result) {
      await updateShelter(result.shelter.id, {
        currentOccupancy: result.shelter.currentOccupancy + 1,
      });
    }

    return { victim: newVictim, shelter: result?.shelter || null };
  };

  const addVolunteer = async (volunteerData: Omit<Volunteer, 'id' | 'createdAt'>): Promise<Volunteer> => {
    const { data, error } = await supabase
      .from('volunteers')
      .insert({
        user_id: volunteerData.userId,
        name: volunteerData.name,
        contact_number: volunteerData.contactNumber,
        city: volunteerData.city,
        skills: volunteerData.skills,
        availability: volunteerData.availability,
        latitude: volunteerData.location.latitude,
        longitude: volunteerData.location.longitude,
        profile_completed: volunteerData.profileCompleted,
      })
      .select()
      .single();

    if (error) throw error;

    const newVolunteer: Volunteer = {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      contactNumber: data.contact_number,
      city: data.city,
      skills: data.skills,
      availability: data.availability,
      location: { latitude: data.latitude, longitude: data.longitude },
      profileCompleted: data.profile_completed,
      createdAt: new Date(data.created_at),
    };

    setVolunteers(prev => [...prev, newVolunteer]);
    return newVolunteer;
  };

  const updateVolunteer = async (id: string, data: Partial<Volunteer>): Promise<void> => {
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.contactNumber) updateData.contact_number = data.contactNumber;
    if (data.city) updateData.city = data.city;
    if (data.skills) updateData.skills = data.skills;
    if (data.availability) updateData.availability = data.availability;
    if (data.location) {
      updateData.latitude = data.location.latitude;
      updateData.longitude = data.location.longitude;
    }
    if (data.profileCompleted !== undefined) updateData.profile_completed = data.profileCompleted;

    const { error } = await supabase
      .from('volunteers')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    await loadVolunteers();
  };

  const getVolunteerByUserId = (userId: string) => {
    return volunteers.find(v => v.userId === userId);
  };

  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'aiAssigned'>): Promise<Task> => {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        status: taskData.status,
        shelter_id: taskData.shelterId,
        shelter_name: taskData.shelterName,
        required_skills: taskData.requiredSkills,
      })
      .select()
      .single();

    if (error) throw error;

    const newTask: Task = {
      id: data.id,
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: data.status,
      shelterId: data.shelter_id,
      shelterName: data.shelter_name,
      assignedVolunteerId: data.assigned_volunteer_id,
      assignedVolunteerName: data.assigned_volunteer_name,
      requiredSkills: data.required_skills,
      aiAssigned: data.ai_assigned,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

    setTasks(prev => [...prev, newTask]);
    return newTask;
  };

  const updateTask = async (id: string, data: Partial<Task>): Promise<void> => {
    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.description) updateData.description = data.description;
    if (data.priority) updateData.priority = data.priority;
    if (data.status) updateData.status = data.status;
    if (data.assignedVolunteerId) updateData.assigned_volunteer_id = data.assignedVolunteerId;
    if (data.assignedVolunteerName) updateData.assigned_volunteer_name = data.assignedVolunteerName;
    if (data.aiAssigned !== undefined) updateData.ai_assigned = data.aiAssigned;

    const { error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    await loadTasks();
  };

  const assignTaskToVolunteer = async (taskId: string, volunteerId: string): Promise<void> => {
    const volunteer = volunteers.find(v => v.id === volunteerId);
    if (volunteer) {
      await updateTask(taskId, {
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

  const runAIAssignment = async (taskId: string): Promise<void> => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const availableVolunteers = volunteers.filter(v => 
      v.availability === 'available' && v.profileCompleted
    );

    if (availableVolunteers.length === 0) return;

    const scored = availableVolunteers.map(vol => {
      const matchingSkills = task.requiredSkills.filter(skill => 
        vol.skills.includes(skill)
      );
      return {
        volunteer: vol,
        score: matchingSkills.length,
      };
    });

    scored.sort((a, b) => b.score - a.score);
    
    if (scored[0] && scored[0].score > 0) {
      await assignTaskToVolunteer(taskId, scored[0].volunteer.id);
    }
  };

  const addResource = async (resourceData: Omit<Resource, 'id' | 'lastUpdated'>): Promise<Resource> => {
    const { data, error } = await supabase
      .from('resources')
      .insert({
        shelter_id: resourceData.shelterId,
        type: resourceData.type,
        quantity_available: resourceData.quantityAvailable,
        quantity_needed: resourceData.quantityNeeded,
        unit: resourceData.unit,
      })
      .select()
      .single();

    if (error) throw error;

    const newResource: Resource = {
      id: data.id,
      shelterId: data.shelter_id,
      type: data.type,
      quantityAvailable: data.quantity_available,
      quantityNeeded: data.quantity_needed,
      unit: data.unit,
      lastUpdated: new Date(data.last_updated),
    };

    setResources(prev => [...prev, newResource]);
    return newResource;
  };

  const updateResource = async (id: string, data: Partial<Resource>): Promise<void> => {
    const updateData: any = {};
    if (data.type) updateData.type = data.type;
    if (data.quantityAvailable !== undefined) updateData.quantity_available = data.quantityAvailable;
    if (data.quantityNeeded !== undefined) updateData.quantity_needed = data.quantityNeeded;
    if (data.unit) updateData.unit = data.unit;

    const { error } = await supabase
      .from('resources')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    await loadResources();
  };

  const getResourcesByShelter = (shelterId: string) => {
    return resources.filter(r => r.shelterId === shelterId);
  };

  const addDonation = async (donationData: Omit<Donation, 'id' | 'createdAt'>): Promise<void> => {
    const { data, error } = await supabase
      .from('donations')
      .insert({
        shelter_id: donationData.shelterId,
        resource_type: donationData.resourceType,
        quantity: donationData.quantity,
        donor_name: donationData.donorName,
        donor_contact: donationData.donorContact,
      })
      .select()
      .single();

    if (error) throw error;

    const newDonation: Donation = {
      id: data.id,
      shelterId: data.shelter_id,
      resourceType: data.resource_type,
      quantity: data.quantity,
      donorName: data.donor_name,
      donorContact: data.donor_contact,
      createdAt: new Date(data.created_at),
    };

    setDonations(prev => [...prev, newDonation]);

    // Update resource quantity
    const resource = resources.find(r => 
      r.shelterId === donationData.shelterId && r.type === donationData.resourceType
    );
    if (resource) {
      await updateResource(resource.id, {
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


