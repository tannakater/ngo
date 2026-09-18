import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Organization, Member, CustomFieldDefinition, CardTemplate, WebUser } from '../types';
import { db, auth } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { doc, getDoc, setDoc, collection, onSnapshot, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { useAuditStore } from './useAuditStore';
import { isQuotaExhausted, recordQuotaExhausted } from '../lib/quotaManager';
import { markIdDeleted, isIdDeleted, filterNonDeleted, isStoreInitialized, setStoreInitialized } from '../lib/tombstones';

export type { Member, Organization, CardTemplate };

export function getNextSequentialMemberId(members: Member[], prefix = 'DAK-'): string {
  const existingNumbers = members
    .map(m => {
      const match = (m.memberId || '').match(/(\d{6})$/);
      return match ? parseInt(match[1], 10) : null;
    })
    .filter((n): n is number => n !== null);

  if (existingNumbers.length === 0) {
    return `${prefix}261001`;
  }
  const max = Math.max(...existingNumbers);
  return `${prefix}${max + 1}`;
}

const initialSeedMembers: Member[] = [
  {
    id: 'mem-seed-1',
    memberId: 'DAK-261001',
    firstName: 'Dr. Mahfuzur',
    lastName: 'Rahman',
    designation: 'President & Founder',
    department: 'Administration',
    role: 'Staff',
    phone: '+880 1711-002233',
    email: 'president@dakshebafoundation.org',
    bloodGroup: 'A+',
    dateOfBirth: '1985-03-15',
    joiningDate: '2024-01-01',
    address: 'Gulshan, Dhaka, Bangladesh',
    emergencyContact: '+880 1711-998877',
    status: 'Active',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&q=80',
    customFields: {}
  },
  {
    id: 'mem-seed-2',
    memberId: 'DAK-261002',
    firstName: 'Farhana',
    lastName: 'Yasmin',
    designation: 'General Secretary',
    department: 'Operations',
    role: 'Staff',
    phone: '+880 1722-334455',
    email: 'secretary@dakshebafoundation.org',
    bloodGroup: 'B+',
    dateOfBirth: '1990-07-20',
    joiningDate: '2024-01-10',
    address: 'Dhanmondi, Dhaka, Bangladesh',
    emergencyContact: '+880 1722-998877',
    status: 'Active',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&q=80',
    customFields: {}
  },
  {
    id: 'mem-seed-3',
    memberId: 'DAK-261003',
    firstName: 'Rafi',
    lastName: 'Rakib',
    designation: 'Vice President',
    department: 'Fundraising',
    role: 'Volunteer',
    phone: '+880 1790-650636',
    email: 'rafi@dakshebafoundation.org',
    bloodGroup: 'O+',
    dateOfBirth: '1998-05-12',
    joiningDate: '2025-11-20',
    address: 'Dhaka, Bangladesh',
    emergencyContact: '+880 1790-650636',
    status: 'Active',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&q=80',
    customFields: {}
  },
  {
    id: 'mem-seed-4',
    memberId: 'DAK-261004',
    firstName: 'Md',
    lastName: 'Parvez',
    designation: 'Senior Vice Secretary',
    department: 'General Support',
    role: 'Volunteer',
    phone: '+880 1790-650636',
    email: 'parvez@dakshebafoundation.org',
    bloodGroup: 'A+',
    dateOfBirth: '1997-03-14',
    joiningDate: '2025-10-10',
    address: 'Sylhet, Bangladesh',
    emergencyContact: '+880 1790-650636',
    status: 'Active',
    photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&q=80',
    customFields: {}
  },
  {
    id: 'mem-seed-5',
    memberId: 'DAK-261005',
    firstName: 'Ahamed',
    lastName: 'Monir',
    designation: 'Field Officer',
    department: 'Relief & Crisis',
    role: 'Volunteer',
    phone: '+880 1790-650636',
    email: 'monir@dakshebafoundation.org',
    bloodGroup: 'AB+',
    dateOfBirth: '1996-07-09',
    joiningDate: '2025-09-01',
    address: 'Rajshahi, Bangladesh',
    emergencyContact: '+880 1790-650636',
    status: 'Active',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&q=80',
    customFields: {}
  },
  {
    id: 'mem-seed-6',
    memberId: 'DAK-261006',
    firstName: 'Saeem',
    lastName: 'Ahmed',
    designation: 'Organizing Secretary',
    department: 'Education',
    role: 'Volunteer',
    phone: '+880 1790-650636',
    email: 'saeem@dakshebafoundation.org',
    bloodGroup: 'O+',
    dateOfBirth: '1999-08-22',
    joiningDate: '2025-12-01',
    address: 'Chittagong, Bangladesh',
    emergencyContact: '+880 1790-650636',
    status: 'Active',
    photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=400&fit=crop&q=80',
    customFields: {}
  },
  {
    id: 'mem-seed-7',
    memberId: 'DAK-261007',
    firstName: 'Tamim',
    lastName: 'Iqbal',
    designation: 'Executive Member',
    department: 'General Support',
    role: 'Volunteer',
    phone: '+880 1790-650636',
    email: 'tamim@dakshebafoundation.org',
    bloodGroup: 'B+',
    dateOfBirth: '2000-01-01',
    joiningDate: '2026-01-15',
    address: 'Dhaka, Bangladesh',
    emergencyContact: '+880 1790-650636',
    status: 'Active',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&q=80',
    customFields: {}
  },
  {
    id: 'mem-seed-8',
    memberId: 'DAK-261008',
    firstName: 'Manob',
    lastName: 'Chowdhury',
    designation: 'Community Coordinator',
    department: 'Healthcare',
    role: 'Volunteer',
    phone: '+880 1790-650636',
    email: 'manob@dakshebafoundation.org',
    bloodGroup: 'B-',
    dateOfBirth: '1995-11-30',
    joiningDate: '2025-08-15',
    address: 'Khulna, Bangladesh',
    emergencyContact: '+880 1790-650636',
    status: 'Active',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&q=80',
    customFields: {}
  }
];

export const DEFAULT_OFFICIAL_LOGO_SVG = "/daksheba.jpg";

const sanitizeForFirestore = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

const defaultOrganization: Organization = {
  id: 'org-1',
  name: 'DakSeba Foundation',
  nameBn: 'দাকসেবা ফাউন্ডেশন',
  shortName: 'DAK',
  tagline: 'Empowering Communities, Sustaining Lives & Restoring Hope',
  logoUrl: DEFAULT_OFFICIAL_LOGO_SVG,
  address: 'DakSeba Headquarters, Dhaka',
  phone: '+880 1711-002233',
  email: 'info@dakshebafoundation.org',
  website: 'https://dakshebafoundation.org',
  facebook: 'https://facebook.com/dakshebafoundation',
  primaryColor: '#000000',
  secondaryColor: '#059669',
  cardBackground: '#ffffff',
  registrationNumber: 'NGO-AB-2023-09412',
  emergencyContact: '+880 1711-998877',
  qrVerificationUrl: typeof window !== 'undefined' && window.location?.origin ? `${window.location.origin}/verify?id=` : '/verify?id=',
  noticeText: 'If found, please return this card to the organization office or contact support.',
  currency: 'BDT',
  mission: 'To mobilize swift, equitable resources and certified volunteer networks to combat poverty, provide disaster relief, build robust water and health infrastructure, and ensure quality educational pathways for historically underserved communities.',
  vision: 'A world where every individual, regardless of geographic vulnerability or economic background, enjoys clean water, quality education, resilient healthcare, and the security of a compassionate, organized community safety net.',
};

const defaultTemplates: CardTemplate[] = [
  {
    id: 'tpl-bd-foundation',
    name: 'Standard 5cm x 8cm ID Card',
    width: 50,
    height: 80,
    orientation: 'portrait',
    backgroundColor: '#ffffff',
    primaryColor: '#064e3b',
    secondaryColor: '#059669',
    frontElements: [],
    backElements: []
  },
  {
    id: 'tpl-volunteer-pass',
    name: 'Field Volunteer Pass (5cm x 8cm)',
    width: 50,
    height: 80,
    orientation: 'portrait',
    backgroundColor: '#f8fafc',
    primaryColor: '#0284c7',
    secondaryColor: '#0369a1',
    frontElements: [],
    backElements: []
  }
];

let unsubUser: (() => void) | null = null;
let unsubMembers: (() => void) | null = null;
let unsubPublicVolunteers: (() => void) | null = null;
let supabaseOrgChannel: any = null;

let localPrivateMembers: Member[] = [];
let localPublicMembers: Member[] = [];

function mapSupabaseMember(row: any): Member {
  return {
    id: row.id,
    memberId: row.member_id || row.memberId || 'DAK-261001',
    firstName: row.first_name || row.firstName || '',
    lastName: row.last_name || row.lastName || '',
    email: row.email || '',
    phone: row.phone || '',
    role: row.role || 'Volunteer',
    designation: row.designation || '',
    department: row.department || '',
    bloodGroup: row.blood_group || row.bloodGroup || '',
    dateOfBirth: row.date_of_birth || row.dateOfBirth || '',
    joiningDate: row.joining_date || row.joiningDate || '',
    address: row.address || '',
    photoUrl: row.photo_url || row.photoUrl || '',
    emergencyContact: row.emergency_contact || row.emergencyContact || '',
    status: row.status || 'Active',
    customFields: row.custom_fields || row.customFields || {},
    idCardGenerated: row.id_card_generated ?? row.idCardGenerated,
    needsRegeneration: row.needs_regeneration ?? row.needsRegeneration
  };
}

const syncWithSupabase = (set: any, get: () => OrgState) => {
  if (!supabase) return;

  // 1. Fetch public volunteer applications
  Promise.resolve(supabase.from('public_volunteers').select('*')).then(({ data, error }) => {
    if (!error && Array.isArray(data)) {
      localPublicMembers = data.map(mapSupabaseMember);
      mergeAndSetMembers(set, get);
    }
  }).catch(err => console.warn('Supabase fetch public_volunteers error:', err));

  // 2. Fetch active members
  Promise.resolve(supabase.from('members').select('*')).then(({ data, error }) => {
    if (!error && Array.isArray(data)) {
      localPrivateMembers = data.map(mapSupabaseMember);
      mergeAndSetMembers(set, get);
    }
  }).catch(err => console.warn('Supabase fetch members error:', err));

  // 3. Supabase Realtime Channel
  if (!supabaseOrgChannel) {
    try {
      supabaseOrgChannel = supabase
        .channel('public:org_members_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'public_volunteers' }, (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const mem = mapSupabaseMember(payload.new);
            const idx = localPublicMembers.findIndex(m => m.id === mem.id);
            if (idx >= 0) localPublicMembers[idx] = mem;
            else localPublicMembers.unshift(mem);
            mergeAndSetMembers(set, get);
          } else if (payload.eventType === 'DELETE' && payload.old) {
            localPublicMembers = localPublicMembers.filter(m => m.id !== payload.old.id);
            mergeAndSetMembers(set, get);
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const mem = mapSupabaseMember(payload.new);
            const idx = localPrivateMembers.findIndex(m => m.id === mem.id);
            if (idx >= 0) localPrivateMembers[idx] = mem;
            else localPrivateMembers.unshift(mem);
            mergeAndSetMembers(set, get);
          } else if (payload.eventType === 'DELETE' && payload.old) {
            localPrivateMembers = localPrivateMembers.filter(m => m.id !== payload.old.id);
            mergeAndSetMembers(set, get);
          }
        })
        .subscribe();
    } catch (e) {
      console.warn('Supabase realtime channel error:', e);
    }
  }
};

const mergeAndSetMembers = (set: any, get: () => OrgState) => {
  const currentMembers = get().members || [];
  const memberMap = new Map<string, Member>();

  // 1. Maintain all currently active members in memory, strictly excluding any deleted tombstones
  currentMembers.forEach(m => {
    if (m && m.id && !isIdDeleted(m.id)) {
      memberMap.set(m.id, m);
    }
  });

  // 2. Overlay remote public volunteers safely
  localPublicMembers.forEach(m => {
    if (!m || !m.id || isIdDeleted(m.id)) return;
    const existing = memberMap.get(m.id);
    memberMap.set(m.id, {
      ...existing,
      ...m,
      // If previous version had photo and remote omitted it, safeguard the photo
      photoUrl: m.photoUrl || existing?.photoUrl || ''
    });
  });

  // 3. Overlay remote private members safely
  localPrivateMembers.forEach(m => {
    if (!m || !m.id || isIdDeleted(m.id)) return;
    const existing = memberMap.get(m.id);
    memberMap.set(m.id, {
      ...existing,
      ...m,
      photoUrl: m.photoUrl || existing?.photoUrl || ''
    });
  });

  const merged = Array.from(memberMap.values()).filter(m => !isIdDeleted(m.id));
  set({ members: merged });
  saveStoredOrgData({ members: merged });
};

const loadStoredOrgData = () => {
  try {
    if (typeof window !== 'undefined') {
      const isInit = isStoreInitialized('org') || !!localStorage.getItem('ngo_org_store_data');

      // Search all legacy storage keys across previous versions to ensure zero data loss
      const historicalKeys = [
        'ngo_org_store_data',
        'ngo_org_data',
        'idforge_org_storage_v1',
        'ngo_state_storage_v1',
        'ngo_members',
        'idforge_members',
        'daksheba_ngo_data'
      ];

      const allRecoveredMembers: Member[] = [];
      let foundOrg: any = null;
      let foundCustomFields: any = null;
      let foundTemplates: any = null;
      let foundActiveTemplateId: any = null;
      let foundWebUsers: any = null;

      for (const key of historicalKeys) {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          let parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object' && parsed.state) {
            parsed = parsed.state; // zustand persist format
          }
          if (Array.isArray(parsed?.members)) {
            parsed.members.forEach((m: Member) => {
              if (m && m.id && !isIdDeleted(m.id) && !allRecoveredMembers.some(existing => existing.id === m.id)) {
                allRecoveredMembers.push(m);
              }
            });
          }
          if (parsed?.organization && !foundOrg) {
            foundOrg = parsed.organization;
          }
          if (Array.isArray(parsed?.customFields) && parsed.customFields.length > 0 && !foundCustomFields) {
            foundCustomFields = parsed.customFields;
          }
          if (Array.isArray(parsed?.templates) && parsed.templates.length > 0 && !foundTemplates) {
            foundTemplates = parsed.templates;
          }
          if (parsed?.activeTemplateId && !foundActiveTemplateId) {
            foundActiveTemplateId = parsed.activeTemplateId;
          }
          if (Array.isArray(parsed?.webUsers) && parsed.webUsers.length > 0 && !foundWebUsers) {
            foundWebUsers = parsed.webUsers;
          }
        } catch (e) {}
      }

      // If store is initialized, do not fall back to initialSeedMembers if user deleted all members
      const finalMembers = allRecoveredMembers.filter(m => !isIdDeleted(m.id));
      const resolvedMembers = isInit 
        ? finalMembers 
        : (finalMembers.length > 0 ? finalMembers : initialSeedMembers.filter(m => !isIdDeleted(m.id)));

      return {
        organization: { ...defaultOrganization, ...(foundOrg || {}) },
        members: resolvedMembers,
        customFields: foundCustomFields || [],
        templates: Array.isArray(foundTemplates) && foundTemplates.length > 0 ? foundTemplates : defaultTemplates,
        activeTemplateId: foundActiveTemplateId || 'tpl-bd-foundation',
        webUsers: foundWebUsers || []
      };
    }
  } catch (e) {
    console.warn('Data loader fallback:', e);
  }
  return {
    organization: defaultOrganization,
    members: initialSeedMembers.filter(m => !isIdDeleted(m.id)),
    customFields: [],
    templates: defaultTemplates,
    activeTemplateId: 'tpl-bd-foundation',
    webUsers: []
  };
};

const saveStoredOrgData = (partial: Record<string, any>) => {
  try {
    if (typeof window !== 'undefined') {
      setStoreInitialized('org');
      const prevRaw = localStorage.getItem('ngo_org_store_data') || localStorage.getItem('ngo_org_data');
      const prev = prevRaw ? JSON.parse(prevRaw) : {};
      const updated = { ...prev, ...partial };
      const serialized = JSON.stringify(updated);

      try {
        localStorage.setItem('ngo_org_store_data', serialized);
        // Synchronize across legacy keys for backward-compatibility
        localStorage.setItem('ngo_org_data', serialized);
        localStorage.setItem('idforge_org_storage_v1', JSON.stringify({ state: updated, version: 1 }));
      } catch (storageError) {
        console.warn('LocalStorage quota warning - data retained in memory:', storageError);
      }
    }
  } catch (e) {}
};

interface OrgState {
  userId: string | null;
  organization: Organization;
  members: Member[];
  customFields: CustomFieldDefinition[];
  templates: CardTemplate[];
  activeTemplateId: string | null;
  webUsers: WebUser[];
  
  // Actions
  syncWithFirebase: (userId: string) => void;
  disconnectFirebase: () => void;
  updateOrganization: (org: Partial<Organization>) => void;
  addMember: (member: Omit<Member, 'id'>) => void;
  updateMember: (id: string, member: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  addCustomField: (field: Omit<CustomFieldDefinition, 'id'>) => void;
  removeCustomField: (id: string) => void;
  addTemplate: (template: Omit<CardTemplate, 'id'>) => void;
  updateTemplate: (id: string, template: Partial<CardTemplate>) => void;
  deleteTemplate: (id: string) => void;
  duplicateTemplate: (id: string) => void;
  setActiveTemplate: (id: string) => void;
  addWebUser: (user: Omit<WebUser, 'id' | 'createdAt'>) => void;
  updateWebUser: (id: string, updates: Partial<WebUser>) => void;
  removeWebUser: (id: string) => void;
}

const initialOrgData = loadStoredOrgData();

export const useOrgStore = create<OrgState>((set, get) => ({
  userId: null,
  organization: initialOrgData.organization,
  members: initialOrgData.members,
  customFields: initialOrgData.customFields,
  templates: initialOrgData.templates,
  activeTemplateId: initialOrgData.activeTemplateId,
  webUsers: initialOrgData.webUsers,

  syncWithFirebase: async (userId: string) => {
    // Always trigger Supabase data synchronization & realtime subscriptions
    syncWithSupabase(set, get);

    if (isQuotaExhausted()) {
      return;
    }

    let workspaceId = userId;
    
    try {
      const email = auth.currentUser?.email;
      if (email && email.toLowerCase() !== 'prankp343@gmail.com' && email.toLowerCase() !== 'admin@ngo.org') {
         const usersSnap = await getDocs(collection(db, 'users'));
         usersSnap.forEach(docSnap => {
            const data = docSnap.data();
            if (data.webUsers && Array.isArray(data.webUsers)) {
               if (data.webUsers.find((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
                  workspaceId = docSnap.id;
               }
            }
         });
      }
    } catch (e: any) {
      recordQuotaExhausted(e);
      if (isQuotaExhausted()) return;
    }
    
    set({ userId: workspaceId });
    
    if (unsubUser) unsubUser();
    if (unsubMembers) unsubMembers();
    if (unsubPublicVolunteers) unsubPublicVolunteers();

    try {
      const userDocRef = doc(db, 'users', workspaceId);
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) {
        if (auth.currentUser) {
          await setDoc(userDocRef, sanitizeForFirestore({
            organization: get().organization,
            customFields: get().customFields,
            templates: get().templates,
            activeTemplateId: get().activeTemplateId,
            webUsers: get().webUsers
          }));
        }
      } else {
        const data = docSnap.data();
        if (!data.webUsers && get().webUsers.length > 0 && auth.currentUser) {
          try {
            await updateDoc(userDocRef, { webUsers: sanitizeForFirestore(get().webUsers) });
          } catch (e: any) {
            recordQuotaExhausted(e);
          }
        }
      }

      unsubUser = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const remoteOrg = data.organization || {};
          const currentOrg = get().organization;
          const newOrg = { 
            ...defaultOrganization, 
            ...currentOrg,
            ...remoteOrg,
            name: (remoteOrg.name === 'Global Hope Foundation' && currentOrg.name && currentOrg.name !== 'Global Hope Foundation') ? currentOrg.name : (remoteOrg.name || currentOrg.name || defaultOrganization.name),
          };
          const newFields = data.customFields || get().customFields;
          const newTemplates = data.templates || get().templates;
          const newActiveId = data.activeTemplateId || get().activeTemplateId;
          const newWebUsers = data.webUsers || get().webUsers;
          
          set({
            organization: newOrg,
            customFields: newFields,
            templates: newTemplates,
            activeTemplateId: newActiveId,
            webUsers: newWebUsers,
          });
          saveStoredOrgData({
            organization: newOrg,
            members: get().members,
            customFields: newFields,
            templates: newTemplates,
            activeTemplateId: newActiveId,
            webUsers: newWebUsers
          });
        }
      }, (err) => {
        recordQuotaExhausted(err);
      });

      const membersRef = collection(db, 'users', workspaceId, 'members');
      
      unsubMembers = onSnapshot(membersRef, (snapshot) => {
        const fetchedMembers: Member[] = [];
        snapshot.forEach(doc => {
          fetchedMembers.push({ ...doc.data(), id: doc.id } as Member);
        });
        localPrivateMembers = fetchedMembers;
        mergeAndSetMembers(set, get);
      }, (err) => {
        recordQuotaExhausted(err);
      });

      const publicVolunteersRef = collection(db, 'public_volunteers');
      unsubPublicVolunteers = onSnapshot(publicVolunteersRef, (snapshot) => {
        const fetchedPublic: Member[] = [];
        snapshot.forEach(doc => {
          fetchedPublic.push({ ...doc.data(), id: doc.id } as Member);
        });
        localPublicMembers = fetchedPublic;
        mergeAndSetMembers(set, get);
      }, (err) => {
        recordQuotaExhausted(err);
      });
    } catch (err: any) {
      recordQuotaExhausted(err);
    }
  },

  disconnectFirebase: () => {
    if (unsubUser) { unsubUser(); unsubUser = null; }
    if (unsubMembers) { unsubMembers(); unsubMembers = null; }
    if (unsubPublicVolunteers) { unsubPublicVolunteers(); unsubPublicVolunteers = null; }
    set({ userId: null });
  },

  updateOrganization: async (orgUpdate) => {
    const { userId, organization } = get();
    const newOrg = { ...organization, ...orgUpdate, logoUrl: DEFAULT_OFFICIAL_LOGO_SVG };
    set({ organization: newOrg });
    saveStoredOrgData({ organization: newOrg });
    
    try {
      localStorage.setItem('ngo_org_profile', JSON.stringify(newOrg));
    } catch (e) {}

    if (userId && !isQuotaExhausted()) {
      try {
        const userDocRef = doc(db, 'users', userId);
        await setDoc(userDocRef, sanitizeForFirestore({
          organization: newOrg
        }), { merge: true });
      } catch (e: any) {
        recordQuotaExhausted(e);
      }
    }
  },

  addMember: async (memberData) => {
    const { userId, members } = get();
    const newId = uuidv4();
    const assignedMemberId = memberData.memberId && memberData.memberId.trim() && memberData.memberId !== 'ID-PENDING'
      ? memberData.memberId.trim()
      : getNextSequentialMemberId(members);
    
    const newMember: Member = {
      ...memberData,
      id: newId,
      memberId: assignedMemberId
    };
    
    const updatedMembers = [newMember, ...members];
    set({ members: updatedMembers });
    saveStoredOrgData({ members: updatedMembers });

    // Supabase dual-sync
    if (supabase) {
      const isPublic = !auth.currentUser || !userId;
      const targetTable = isPublic ? 'public_volunteers' : 'members';
      Promise.resolve(
        supabase.from(targetTable).upsert([{
          id: newId,
          member_id: newMember.memberId,
          first_name: newMember.firstName,
          last_name: newMember.lastName,
          email: newMember.email || null,
          phone: newMember.phone || null,
          role: newMember.role || 'Volunteer',
          designation: newMember.designation || (isPublic ? 'Volunteer Applicant' : ''),
          department: newMember.department || '',
          blood_group: newMember.bloodGroup || '',
          date_of_birth: newMember.dateOfBirth || '',
          joining_date: newMember.joiningDate || '',
          address: newMember.address || '',
          photo_url: newMember.photoUrl || '',
          emergency_contact: newMember.emergencyContact || '',
          status: newMember.status || (isPublic ? 'Pending' : 'Active'),
          custom_fields: newMember.customFields || {}
        }])
      ).then(({ error }) => {
        if (error) console.warn('Supabase member upsert:', error.message);
      }).catch(err => console.warn('Supabase member error:', err));
    }

    if (!isQuotaExhausted()) {
      if (auth.currentUser && userId) {
        try {
          await setDoc(doc(db, 'users', userId, 'members', newId), sanitizeForFirestore(newMember));
          useAuditStore.getState().addLog({
            action: 'Created',
            entity: 'Member',
            entityId: newId,
            details: `Added new member: ${newMember.firstName} ${newMember.lastName} (${newMember.role}) [ID: ${newMember.memberId}]`
          });
        } catch (e: any) {
          recordQuotaExhausted(e);
        }
      } else {
        try {
          await setDoc(doc(db, 'public_volunteers', newId), sanitizeForFirestore(newMember));
          useAuditStore.getState().addLog({
            action: 'Created',
            category: 'Volunteers',
            entity: 'Volunteer Applicant',
            entityId: newId,
            details: `New public volunteer application: ${newMember.firstName} ${newMember.lastName} (${newMember.department})`,
            performedBy: `${newMember.firstName} ${newMember.lastName}`,
            performedByEmail: newMember.email || 'applicant@dakseba.org',
            performedByRole: 'Public Applicant'
          });
        } catch (e: any) {
          recordQuotaExhausted(e);
        }
      }
    }
  },

  updateMember: async (id, memberUpdate) => {
    const { userId, members } = get();
    const newMembers = members.map(m => m.id === id ? { ...m, ...memberUpdate } : m);
    set({ members: newMembers });
    saveStoredOrgData({ members: newMembers });
    
    if (userId && !isQuotaExhausted()) {
      try {
        const memberToUpdate = newMembers.find(m => m.id === id);
        if (memberToUpdate) {
          try {
            await updateDoc(doc(db, 'users', userId, 'members', id), sanitizeForFirestore(memberToUpdate as any));
          } catch (e: any) {
            if (e.code === 'not-found') {
              await updateDoc(doc(db, 'public_volunteers', id), sanitizeForFirestore(memberToUpdate as any));
            } else {
              throw e;
            }
          }
          useAuditStore.getState().addLog({
            action: 'Updated',
            entity: 'Member',
            entityId: id,
            details: `Updated details for ${memberToUpdate.firstName} ${memberToUpdate.lastName}`
          });
        }
      } catch (e: any) {
        recordQuotaExhausted(e);
      }
    }
  },

  deleteMember: async (id) => {
    markIdDeleted(id);
    const { userId, members } = get();
    const oldMember = members.find(m => m.id === id);
    const updatedMembers = members.filter(m => m.id !== id);
    set({ members: updatedMembers });
    saveStoredOrgData({ members: updatedMembers });

    if (userId && !isQuotaExhausted()) {
      try {
        await deleteDoc(doc(db, 'users', userId, 'members', id));
        useAuditStore.getState().addLog({
          action: 'Deleted',
          entity: 'Member',
          entityId: id,
          details: `Deleted member: ${oldMember ? oldMember.firstName + ' ' + oldMember.lastName : 'Unknown'}`
        });
      } catch (e: any) {
        recordQuotaExhausted(e);
      }
      try {
        await deleteDoc(doc(db, 'public_volunteers', id));
      } catch (e) {}
    }
  },

  addCustomField: async (field) => {
    const { userId, customFields } = get();
    const newFields = [...customFields, { ...field, id: uuidv4() }];
    set({ customFields: newFields });
    saveStoredOrgData({ customFields: newFields });
    
    if (userId && !isQuotaExhausted()) {
      try {
        await updateDoc(doc(db, 'users', userId), sanitizeForFirestore({
          customFields: newFields
        }));
      } catch (e: any) {
        recordQuotaExhausted(e);
      }
    }
  },

  removeCustomField: async (id) => {
    markIdDeleted(id);
    const { userId, customFields } = get();
    const newFields = customFields.filter(f => f.id !== id);
    set({ customFields: newFields });
    saveStoredOrgData({ customFields: newFields });
    
    if (userId && !isQuotaExhausted()) {
      try {
        await updateDoc(doc(db, 'users', userId), sanitizeForFirestore({
          customFields: newFields
        }));
      } catch (e: any) {
        recordQuotaExhausted(e);
      }
    }
  },

  addTemplate: async (template) => {
    const { userId, templates } = get();
    const newTemplates = [...templates, { ...template, id: uuidv4() }];
    set({ templates: newTemplates });
    saveStoredOrgData({ templates: newTemplates });
    
    if (userId && !isQuotaExhausted()) {
      try {
        await updateDoc(doc(db, 'users', userId), sanitizeForFirestore({
          templates: newTemplates
        }));
      } catch (e: any) {
        recordQuotaExhausted(e);
      }
    }
  },

  updateTemplate: async (id, templateUpdate) => {
    const { userId, templates } = get();
    const newTemplates = templates.map(t => t.id === id ? { ...t, ...templateUpdate } : t);
    set({ templates: newTemplates });
    saveStoredOrgData({ templates: newTemplates });
    
    if (userId && !isQuotaExhausted()) {
      try {
        await updateDoc(doc(db, 'users', userId), sanitizeForFirestore({
          templates: newTemplates
        }));
      } catch (e: any) {
        recordQuotaExhausted(e);
      }
    }
  },

  deleteTemplate: async (id) => {
    const { userId, templates, activeTemplateId } = get();
    if (templates.length <= 1) {
      return;
    }
    markIdDeleted(id);
    const newTemplates = templates.filter(t => t.id !== id);
    const newActiveId = activeTemplateId === id ? newTemplates[0].id : activeTemplateId;
    set({ templates: newTemplates, activeTemplateId: newActiveId });
    saveStoredOrgData({ templates: newTemplates, activeTemplateId: newActiveId });
    
    if (userId && !isQuotaExhausted()) {
      try {
        await updateDoc(doc(db, 'users', userId), sanitizeForFirestore({
          templates: newTemplates,
          activeTemplateId: newActiveId
        }));
      } catch (e: any) {
        recordQuotaExhausted(e);
      }
    }
  },

  duplicateTemplate: async (id) => {
    const { userId, templates } = get();
    const templateToDup = templates.find(t => t.id === id);
    if (!templateToDup) return;

    const newTemplate: CardTemplate = {
      ...JSON.parse(JSON.stringify(templateToDup)),
      id: uuidv4(),
      name: `${templateToDup.name} (Copy)`
    };

    const newTemplates = [...templates, newTemplate];
    set({ templates: newTemplates });
    saveStoredOrgData({ templates: newTemplates });
    
    if (userId && !isQuotaExhausted()) {
      try {
        await updateDoc(doc(db, 'users', userId), sanitizeForFirestore({
          templates: newTemplates
        }));
      } catch (e: any) {
        recordQuotaExhausted(e);
      }
    }
  },

  setActiveTemplate: async (id) => {
    const { userId } = get();
    set({ activeTemplateId: id });
    saveStoredOrgData({ activeTemplateId: id });
    
    if (userId && !isQuotaExhausted()) {
      try {
        await updateDoc(doc(db, 'users', userId), sanitizeForFirestore({
          activeTemplateId: id
        }));
      } catch (e: any) {
        recordQuotaExhausted(e);
      }
    }
  },

  addWebUser: async (userData) => {
    const { webUsers, userId } = get();
    const newUser: WebUser = {
      ...userData,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    };
    const updated = [...webUsers, newUser];
    set({ webUsers: updated });
    saveStoredOrgData({ webUsers: updated });
    
    if (userId && !isQuotaExhausted()) {
      try {
        await updateDoc(doc(db, 'users', userId), sanitizeForFirestore({ webUsers: updated }));
        useAuditStore.getState().addLog({
          action: 'Created',
          entity: 'Admin User',
          entityId: newUser.id,
          details: `Added new admin/web user: ${newUser.name} (${newUser.role})`
        });
      } catch (e: any) {
        recordQuotaExhausted(e);
      }
    }
  },
  
  updateWebUser: async (id, updates) => {
    const { webUsers, userId } = get();
    const oldUser = webUsers.find(u => u.id === id);
    const updated = webUsers.map(u => u.id === id ? { ...u, ...updates } : u);
    set({ webUsers: updated });
    saveStoredOrgData({ webUsers: updated });
    
    if (userId && !isQuotaExhausted()) {
      try {
        await updateDoc(doc(db, 'users', userId), sanitizeForFirestore({ webUsers: updated }));
        if (oldUser) {
          useAuditStore.getState().addLog({
            action: 'Updated',
            entity: 'Admin User',
            entityId: id,
            details: `Updated details for admin/web user: ${oldUser.name}`
          });
        }
      } catch (e: any) {
        recordQuotaExhausted(e);
      }
    }
  },
  
  removeWebUser: async (id) => {
    const { webUsers, userId } = get();
    const oldUser = webUsers.find(u => u.id === id);
    const updated = webUsers.filter(u => u.id !== id);
    set({ webUsers: updated });
    saveStoredOrgData({ webUsers: updated });
    
    if (userId && !isQuotaExhausted()) {
      try {
        await updateDoc(doc(db, 'users', userId), sanitizeForFirestore({ webUsers: updated }));
        if (oldUser) {
          useAuditStore.getState().addLog({
            action: 'Deleted',
            entity: 'Admin User',
            entityId: id,
            details: `Removed admin/web user: ${oldUser.name}`
          });
        }
      } catch (e: any) {
        recordQuotaExhausted(e);
      }
    }
  }
}));

// Auto-sync with Supabase on module load
if (typeof window !== 'undefined') {
  setTimeout(() => {
    syncWithSupabase(useOrgStore.setState, useOrgStore.getState);
  }, 50);
}

