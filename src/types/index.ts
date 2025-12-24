export type UserRole = 'victim' | 'volunteer' | 'coordinator';

export interface User {
  id: string;
  email: string;
  role: UserRole | null;
  createdAt: Date;
}

export interface Location {
  latitude: number;
  longitude: number;
}

export interface Victim {
  id: string;
visitorId: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  medicalCondition?: string;
  location: Location;
  assignedShelterId?: string;
  createdAt: Date;
}

export interface Shelter {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  location: Location;
  totalCapacity: number;
  currentOccupancy: number;
  contactNumber: string;
  managerName: string;
  managerContact: string;
  coordinatorId: string;
  createdAt: Date;
}

export interface Resource {
  id: string;
  shelterId: string;
  type: 'food' | 'water' | 'medicine' | 'clothes' | 'blankets' | 'other';
  quantityAvailable: number;
  quantityNeeded: number;
  unit: string;
  lastUpdated: Date;
}

export type VolunteerSkill = 
  | 'first_aid' 
  | 'driving' 
  | 'cooking' 
  | 'rescue' 
  | 'logistics' 
  | 'medical' 
  | 'counseling'
  | 'communication'
  | 'construction';

export interface Volunteer {
  id: string;
  userId: string;
  name: string;
  contactNumber: string;
  city: string;
  skills: VolunteerSkill[];
  availability: 'available' | 'busy';
  location: Location;
  profileCompleted: boolean;
  createdAt: Date;
}

export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'created' | 'assigned' | 'accepted' | 'completed' | 'declined';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  shelterId: string;
  shelterName: string;
  assignedVolunteerId?: string;
  assignedVolunteerName?: string;
  requiredSkills: VolunteerSkill[];
  aiAssigned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Donation {
  id: string;
  shelterId: string;
  resourceType: Resource['type'];
  quantity: number;
  donorName?: string;
  donorContact?: string;
  createdAt: Date;
}
