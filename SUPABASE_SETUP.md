# Supabase Integration Guide

This guide will help you integrate Supabase into your Flood Relief Management System.

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Create a new project
3. Note your project URL and anon key from Settings > API

## Step 2: Set Up Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Step 3: Set Up Database Tables

Run these SQL commands in your Supabase SQL Editor:

### Users Table (extends Supabase auth.users)
```sql
-- Create profiles table that extends auth.users
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  role TEXT CHECK (role IN ('victim', 'volunteer', 'coordinator')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Create policy for users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

### Shelters Table
```sql
CREATE TABLE shelters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  total_capacity INTEGER NOT NULL,
  current_occupancy INTEGER DEFAULT 0,
  contact_number TEXT NOT NULL,
  manager_name TEXT NOT NULL,
  manager_contact TEXT NOT NULL,
  manager_address TEXT,
  manager_state TEXT,
  manager_pincode TEXT,
  coordinator_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE shelters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shelters" ON shelters
  FOR SELECT USING (true);

CREATE POLICY "Coordinators can insert their own shelters" ON shelters
  FOR INSERT WITH CHECK (auth.uid() = coordinator_id);

CREATE POLICY "Coordinators can update their own shelters" ON shelters
  FOR UPDATE USING (auth.uid() = coordinator_id);
```

### Victims Table
```sql
CREATE TABLE victims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')) NOT NULL,
  medical_condition TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  assigned_shelter_id UUID REFERENCES shelters(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE victims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own victim record" ON victims
  FOR SELECT USING (auth.uid() = visitor_id);

CREATE POLICY "Users can insert own victim record" ON victims
  FOR INSERT WITH CHECK (auth.uid() = visitor_id);
```

### Volunteers Table
```sql
CREATE TABLE volunteers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  city TEXT NOT NULL,
  skills TEXT[] NOT NULL,
  availability TEXT CHECK (availability IN ('available', 'busy')) DEFAULT 'available',
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  profile_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view volunteers" ON volunteers
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own volunteer record" ON volunteers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own volunteer record" ON volunteers
  FOR UPDATE USING (auth.uid() = user_id);
```

### Tasks Table
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')) NOT NULL,
  status TEXT CHECK (status IN ('created', 'assigned', 'accepted', 'completed', 'declined')) DEFAULT 'created',
  shelter_id UUID REFERENCES shelters(id) NOT NULL,
  shelter_name TEXT NOT NULL,
  assigned_volunteer_id UUID REFERENCES volunteers(id),
  assigned_volunteer_name TEXT,
  required_skills TEXT[] NOT NULL,
  ai_assigned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tasks" ON tasks
  FOR SELECT USING (true);

CREATE POLICY "Coordinators can insert tasks for their shelters" ON tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM shelters 
      WHERE shelters.id = tasks.shelter_id 
      AND shelters.coordinator_id = auth.uid()
    )
  );

CREATE POLICY "Coordinators can update tasks for their shelters" ON tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM shelters 
      WHERE shelters.id = tasks.shelter_id 
      AND shelters.coordinator_id = auth.uid()
    )
  );
```

### Resources Table
```sql
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shelter_id UUID REFERENCES shelters(id) NOT NULL,
  type TEXT CHECK (type IN ('food', 'water', 'medicine', 'clothes', 'blankets', 'other')) NOT NULL,
  quantity_available INTEGER DEFAULT 0,
  quantity_needed INTEGER DEFAULT 0,
  unit TEXT NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view resources" ON resources
  FOR SELECT USING (true);

CREATE POLICY "Coordinators can manage resources for their shelters" ON resources
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM shelters 
      WHERE shelters.id = resources.shelter_id 
      AND shelters.coordinator_id = auth.uid()
    )
  );
```

### Donations Table
```sql
CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shelter_id UUID REFERENCES shelters(id) NOT NULL,
  resource_type TEXT CHECK (resource_type IN ('food', 'water', 'medicine', 'clothes', 'blankets', 'other')) NOT NULL,
  quantity INTEGER NOT NULL,
  donor_name TEXT,
  donor_contact TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view donations" ON donations
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert donations" ON donations
  FOR INSERT WITH CHECK (true);
```

## Step 4: Create Database Functions

### Function to update task updated_at timestamp
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Function to create profile on user signup
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Step 5: Update Your Code

The `AuthContext.tsx` and `DataContext.tsx` files have been updated to use Supabase. Make sure to:

1. Set your environment variables
2. Run the SQL migrations above
3. Restart your dev server

## Testing

After setup, test the integration:
1. Sign up a new user
2. Create a shelter (as coordinator)
3. Register as a victim
4. Create tasks and assign volunteers

## Troubleshooting

- **RLS Errors**: Make sure Row Level Security policies are set up correctly
- **Auth Errors**: Check that your Supabase URL and anon key are correct
- **Type Errors**: Ensure your database schema matches the TypeScript types

