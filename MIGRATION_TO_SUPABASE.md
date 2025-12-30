# Migration Guide: Switching to Supabase

## Quick Start

To switch from localStorage to Supabase:

### Step 1: Set up environment variables
Create a `.env` file in the root:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 2: Set up database
Follow the SQL migrations in `SUPABASE_SETUP.md` to create all tables.

### Step 3: Replace context files

**Option A: Rename files (Recommended)**
```bash
# Backup original files
mv src/contexts/AuthContext.tsx src/contexts/AuthContext.local.tsx
mv src/contexts/DataContext.tsx src/contexts/DataContext.local.tsx

# Use Supabase versions
mv src/contexts/AuthContext.supabase.tsx src/contexts/AuthContext.tsx
mv src/contexts/DataContext.supabase.tsx src/contexts/DataContext.tsx
```

**Option B: Update imports manually**
Update `src/App.tsx` to import from the new files:
```typescript
import { AuthProvider } from './contexts/AuthContext.supabase';
import { DataProvider } from './contexts/DataContext.supabase';
```

### Step 4: Update async calls

The Supabase versions return Promises, so you may need to update some calls:

**Before (localStorage):**
```typescript
const shelter = addShelter(shelterData);
```

**After (Supabase):**
```typescript
const shelter = await addShelter(shelterData);
```

### Step 5: Restart dev server
```bash
npm run dev
```

## Key Differences

1. **All data operations are async** - Functions return Promises
2. **Real-time updates** - Data syncs with Supabase automatically
3. **Authentication** - Uses Supabase Auth instead of localStorage
4. **Row Level Security** - Database enforces access control

## Testing Checklist

- [ ] User signup works
- [ ] User login works
- [ ] Role selection saves to database
- [ ] Shelter creation works
- [ ] Victim registration works
- [ ] Volunteer profile creation works
- [ ] Task creation and assignment works
- [ ] Resource management works

## Rollback

If you need to rollback:
```bash
mv src/contexts/AuthContext.tsx src/contexts/AuthContext.supabase.tsx
mv src/contexts/DataContext.tsx src/contexts/DataContext.supabase.tsx
mv src/contexts/AuthContext.local.tsx src/contexts/AuthContext.tsx
mv src/contexts/DataContext.local.tsx src/contexts/DataContext.tsx
```

