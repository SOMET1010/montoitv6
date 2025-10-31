# New Architecture Quick Start Guide

**For Developers:** How to use the new refactored architecture

---

## 🚀 Quick Reference

### 1. Routing

**Add a new route:**
```typescript
// src/routes/index.tsx
const NewPage = lazy(() => import('../pages/NewPage'));

// In routes array:
{
  path: 'nouvelle-page',
  element: (
    <ProtectedRoute allowedRoles={['locataire', 'proprietaire']}>
      <NewPage />
    </ProtectedRoute>
  ),
}
```

**Navigate programmatically:**
```typescript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate('/dashboard/locataire');
```

**Get route params:**
```typescript
import { useParams } from 'react-router-dom';

const { id } = useParams();
```

---

### 2. Authentication

**Access user and profile:**
```typescript
import { useAuthStore } from '../stores/authStore';

const { user, profile, loading, signOut } = useAuthStore();

if (loading) return <Loading />;
if (!user) return <Login />;

console.log(profile?.user_type); // 'locataire', 'proprietaire', etc.
```

**Sign in/out:**
```typescript
const { signIn, signOut } = useAuthStore();

// Sign in
const { error } = await signIn(email, password);

// Sign out
await signOut();
```

---

### 3. Data Fetching with React Query

**Fetch properties:**
```typescript
import { useProperties, useProperty } from '../hooks/useProperties';

// List properties with filters
const { data: properties, isLoading, error } = useProperties({
  city: 'Abidjan',
  propertyType: 'appartement'
});

// Single property
const { data: property } = useProperty(propertyId);
```

**Fetch leases:**
```typescript
import { useTenantLeases, useActiveLease } from '../hooks/useLeases';

// All tenant leases
const { data: leases } = useTenantLeases(tenantId);

// Active lease only
const { data: activeLease } = useActiveLease(tenantId);
```

**Fetch messages:**
```typescript
import { useConversations, useMessages } from '../hooks/useMessages';

// User's conversations
const { data: conversations } = useConversations(userId);

// Messages in a conversation
const { data: messages } = useMessages(conversationId);

// Real-time updates
useRealtimeMessages(conversationId);
```

---

### 4. Mutations (Create, Update, Delete)

**Create property:**
```typescript
import { useCreateProperty } from '../hooks/useProperties';

const createProperty = useCreateProperty();

const handleSubmit = async (propertyData) => {
  const { data, error } = await createProperty.mutateAsync(propertyData);
  if (!error) {
    navigate(`/propriete/${data.id}`);
  }
};
```

**Update lease:**
```typescript
import { useUpdateLease } from '../hooks/useLeases';

const updateLease = useUpdateLease();

const handleUpdate = async () => {
  await updateLease.mutateAsync({
    id: leaseId,
    updates: { status: 'actif' }
  });
};
```

**Send message:**
```typescript
import { useSendMessage } from '../hooks/useMessages';

const sendMessage = useSendMessage();

const handleSend = async () => {
  await sendMessage.mutateAsync({
    conversation_id: conversationId,
    sender_id: userId,
    content: messageText
  });
};
```

---

### 5. Direct Repository Access (When Needed)

```typescript
import { propertyRepository } from '../api/repositories';

// Use in non-component contexts (edge functions, services, etc.)
const { data, error } = await propertyRepository.getById(propertyId);
```

---

## 📁 File Organization

### Where to put new code:

**New page component:**
```
src/pages/NewPage.tsx
```

**New reusable component:**
```
src/components/NewComponent.tsx
```

**New repository:**
```
src/api/repositories/newEntityRepository.ts
```

**New custom hook:**
```
src/hooks/useNewEntity.ts
```

**New service:**
```
src/services/newService.ts
```

---

## 🎯 Best Practices

### DO ✅
- Use React Query hooks for data fetching
- Use Zustand authStore for authentication
- Use repositories for data access
- Use ProtectedRoute for protected pages
- Use lazy loading for route components
- Use TypeScript types from database.types.ts
- Keep components under 300 lines
- Extract reusable logic into custom hooks

### DON'T ❌
- Don't call Supabase directly in pages (use repositories)
- Don't use AuthContext (use authStore)
- Don't use manual routing (use React Router)
- Don't use useEffect for data fetching (use React Query)
- Don't create large monolithic components
- Don't duplicate code (extract to reusable components/hooks)

---

## 🔧 Common Patterns

### Pattern 1: Protected Page with Data

```typescript
import { useAuthStore } from '../stores/authStore';
import { useProperties } from '../hooks/useProperties';

export default function MyPage() {
  const { user, profile } = useAuthStore();
  const { data: properties, isLoading } = useProperties({
    owner_id: user?.id
  });

  if (isLoading) return <Loading />;

  return (
    <div>
      <h1>My Properties</h1>
      {properties?.map(p => <PropertyCard key={p.id} property={p} />)}
    </div>
  );
}
```

### Pattern 2: Form with Mutation

```typescript
import { useCreateProperty } from '../hooks/useProperties';
import { useNavigate } from 'react-router-dom';

export default function AddPropertyForm() {
  const navigate = useNavigate();
  const createProperty = useCreateProperty();

  const handleSubmit = async (formData) => {
    const { data, error } = await createProperty.mutateAsync(formData);

    if (error) {
      alert('Erreur: ' + error.message);
      return;
    }

    navigate(`/propriete/${data.id}`);
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Pattern 3: Real-time Updates

```typescript
import { useMessages, useRealtimeMessages } from '../hooks/useMessages';

export default function ChatView({ conversationId }) {
  const { data: messages } = useMessages(conversationId);

  // Auto-updates when new messages arrive
  useRealtimeMessages(conversationId);

  return (
    <div>
      {messages?.map(m => <Message key={m.id} message={m} />)}
    </div>
  );
}
```

---

## 🐛 Debugging

### Check React Query cache:
```typescript
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();
console.log(queryClient.getQueryData(['properties']));
```

### Check Zustand store:
```typescript
import { useAuthStore } from '../stores/authStore';

const state = useAuthStore.getState();
console.log(state);
```

### Invalidate cache manually:
```typescript
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();
queryClient.invalidateQueries({ queryKey: ['properties'] });
```

---

## 📚 Available Repositories

1. **propertyRepository** - Properties CRUD
2. **paymentRepository** - Payments and transactions
3. **leaseRepository** - Leases and contracts
4. **messageRepository** - Messages and conversations
5. **userRepository** - User profiles and verification
6. **maintenanceRepository** - Maintenance requests
7. **applicationRepository** - Property applications

---

## 🔗 Available Hooks

**Properties:**
- `useProperties(filters)`
- `useProperty(id)`
- `useOwnerProperties(ownerId)`
- `useFeaturedProperties()`
- `useCreateProperty()`
- `useUpdateProperty()`
- `useDeleteProperty()`

**Leases:**
- `useLease(id)`
- `useTenantLeases(tenantId)`
- `useLandlordLeases(landlordId)`
- `usePropertyLeases(propertyId)`
- `useActiveLease(tenantId)`
- `useExpiringLeases(days)`
- `useCreateLease()`
- `useUpdateLease()`

**Messages:**
- `useConversations(userId)`
- `useConversation(conversationId)`
- `useMessages(conversationId)`
- `useUnreadCount(userId)`
- `useCreateConversation()`
- `useSendMessage()`
- `useMarkAsRead()`
- `useRealtimeMessages(conversationId)`

**Other:**
- `useContract(contractId)` (existing)
- `useVerification(userId)` (existing)
- `useMessageNotifications()` (existing)

---

## 💡 Tips

1. **Use React Query DevTools in development:**
   ```bash
   npm install @tanstack/react-query-devtools
   ```

2. **Check the repository before creating a new one**
   - Look in `src/api/repositories/index.ts`

3. **Use TypeScript autocomplete**
   - Import types from `src/lib/database.types.ts`
   - Let TypeScript guide you

4. **Follow the existing patterns**
   - Look at how similar pages are implemented
   - Copy and adapt rather than reinventing

5. **When in doubt, check the docs:**
   - React Router: https://reactrouter.com
   - React Query: https://tanstack.com/query
   - Zustand: https://zustand-demo.pmnd.rs

---

## 🚨 Migration Guide (For Existing Pages)

**Step 1:** Replace direct Supabase calls
```typescript
// Before
const { data } = await supabase.from('properties').select('*');

// After
import { useProperties } from '../hooks/useProperties';
const { data: properties } = useProperties();
```

**Step 2:** Replace AuthContext
```typescript
// Before
import { useAuth } from '../contexts/AuthContext';
const { user, profile } = useAuth();

// After
import { useAuthStore } from '../stores/authStore';
const { user, profile } = useAuthStore();
```

**Step 3:** Replace manual navigation
```typescript
// Before
window.location.href = '/dashboard';

// After
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();
navigate('/dashboard');
```

---

## ✅ Checklist for New Features

- [ ] Create repository if needed
- [ ] Create React Query hooks if needed
- [ ] Create page component in `src/pages/`
- [ ] Add route to `src/routes/index.tsx`
- [ ] Add protection if needed (`ProtectedRoute`)
- [ ] Use TypeScript types
- [ ] Extract reusable components
- [ ] Test the feature
- [ ] Update documentation

---

**Questions?** Check ARCHITECTURAL_REFACTORING_PHASE1_COMPLETE.md for detailed documentation.
