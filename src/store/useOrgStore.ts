import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Organization, Member, CustomFieldDefinition, CardTemplate, WebUser } from '../types';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, onSnapshot, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { useAuditStore } from './useAuditStore';

export type { Member, Organization, CardTemplate };

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
  addMember: (member: Omit<Member, 'id' | 'memberId'>) => void;
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

const initialSeedMembers: Member[] = [];

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

// Helper to merge members locally from multiple snapshot sources
let localPrivateMembers: Member[] = [];
let localPublicMembers: Member[] = [];
const mergeAndSetMembers = (set: any) => {
  const allMembersMap = new Map<string, Member>();
  localPublicMembers.forEach(m => allMembersMap.set(m.id, m));
  localPrivateMembers.forEach(m => allMembersMap.set(m.id, m));
  const merged = Array.from(allMembersMap.values());
  set({ members: merged });
  
};

export const useOrgStore = create<OrgState>((set, get) => ({
  userId: null,
  organization: defaultOrganization,
  members: initialSeedMembers,
  customFields: [],
  templates: defaultTemplates,
  activeTemplateId: "tpl-bd-foundation",
  webUsers: [],

  syncWithFirebase: async (userId: string) => {
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
    } catch (e) {
      console.warn("Could not fetch workspaces", e);
    }
    
    set({ userId: workspaceId });
    
    if (unsubUser) unsubUser();
    if (unsubMembers) unsubMembers();
    if (unsubPublicVolunteers) unsubPublicVolunteers();

    try {
      const userDocRef = doc(db, 'users', workspaceId);
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) {
        await setDoc(userDocRef, sanitizeForFirestore({
          organization: get().organization,
          customFields: get().customFields,
          templates: get().templates,
          activeTemplateId: get().activeTemplateId,
          webUsers: get().webUsers
        }));
      } else {
        const data = docSnap.data();
        if (!data.webUsers && get().webUsers.length > 0) {
          try {
            await updateDoc(userDocRef, { webUsers: sanitizeForFirestore(get().webUsers) });
          } catch (e) {}
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
          // Local persistence fallback
          try {
            localStorage.setItem('ngo_org_data', JSON.stringify({
              organization: newOrg,
              members: get().members,
              customFields: newFields,
              templates: newTemplates,
              activeTemplateId: newActiveId,
              webUsers: newWebUsers
            }));
          } catch (e) {}
        }
      }, (err) => {
        console.warn('Workspace sync listener notice:', err.message);
      });

      const membersRef = collection(db, 'users', workspaceId, 'members');
      
      // Auto-migration: if cloud members are empty but we have local members, push them
      try {
        const snap = await getDocs(membersRef);
        if (snap.empty && get().members.length > 0) {
          get().members.forEach(async (member) => {
            try {
              await setDoc(doc(db, 'users', workspaceId, 'members', member.id), sanitizeForFirestore(member));
            } catch (e) {
              console.warn('Failed to migrate member', e);
            }
          });
        }
      } catch(err) {
        console.warn('Migration check failed', err);
      }

      unsubMembers = onSnapshot(membersRef, (snapshot) => {
        const fetchedMembers: Member[] = [];
        snapshot.forEach(doc => {
          fetchedMembers.push({ ...doc.data(), id: doc.id } as Member);
        });
        localPrivateMembers = fetchedMembers;
        mergeAndSetMembers(set);
      }, (err) => {
        console.warn('Members sync listener notice:', err.message);
      });

      const publicVolunteersRef = collection(db, 'public_volunteers');
      unsubPublicVolunteers = onSnapshot(publicVolunteersRef, (snapshot) => {
        const fetchedPublic: Member[] = [];
        snapshot.forEach(doc => {
          fetchedPublic.push({ ...doc.data(), id: doc.id } as Member);
        });
        localPublicMembers = fetchedPublic;
        mergeAndSetMembers(set);
      }, (err) => {
        console.warn('Public volunteers sync listener notice:', err.message);
      });
    } catch (err) {
      console.warn('Firebase sync offline fallback', err);
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
    
    try {
      localStorage.setItem('ngo_org_profile', JSON.stringify(newOrg));
    } catch (e) {}

    if (userId) {
      try {
        const userDocRef = doc(db, 'users', userId);
        await setDoc(userDocRef, sanitizeForFirestore({
          organization: newOrg
        }), { merge: true });
      } catch (e) {
        console.warn('Could not update org on firestore:', e);
      }
    }
  },

  addMember: async (memberData) => {
    const { userId, members, organization } = get();
    const nextNum = members.length + 1;
    const prefix = organization.shortName || 'GHF';
    const memberIdString = `${prefix}-${String(nextNum).padStart(6, '0')}`;
    const newId = uuidv4();
    
    const newMember: Member = {
      ...memberData,
      id: newId,
      memberId: memberIdString
    };
    
    const updatedMembers = [newMember, ...members];
    set({ members: updatedMembers });
    

    if (userId) {
      try {
        await setDoc(doc(db, 'users', userId, 'members', newId), sanitizeForFirestore(newMember));
        useAuditStore.getState().addLog({
          action: 'Created',
          entity: 'Member',
          entityId: newId,
          details: `Added new member: ${newMember.name} (${newMember.role})`
        });
      } catch (e) {
        console.warn('Could not add member to firestore:', e);
      }
    } else {
      try {
        await setDoc(doc(db, 'public_volunteers', newId), sanitizeForFirestore(newMember));
      } catch (e) {
        console.warn('Could not add public volunteer to firestore:', e);
      }
    }
  },

  updateMember: async (id, memberUpdate) => {
    const { userId, members } = get();
    const oldMember = members.find(m => m.id === id);
    const newMembers = members.map(m => m.id === id ? { ...m, ...memberUpdate } : m);
    set({ members: newMembers });
    
    
    if (userId) {
      try {
        const memberToUpdate = newMembers.find(m => m.id === id);
        if (memberToUpdate) {
          try {
            await updateDoc(doc(db, 'users', userId, 'members', id), sanitizeForFirestore(memberToUpdate as any));
          } catch (e: any) {
            if (e.code === 'not-found') {
              // It might be a public volunteer, let's update there or move it
              await updateDoc(doc(db, 'public_volunteers', id), sanitizeForFirestore(memberToUpdate as any));
            } else {
              throw e;
            }
          }
          useAuditStore.getState().addLog({
            action: 'Updated',
            entity: 'Member',
            entityId: id,
            details: `Updated details for ${memberToUpdate.name}`
          });
        }
      } catch (e) {
        console.warn('Could not update member on firestore:', e);
      }
    }
  },

  deleteMember: async (id) => {
    const { userId, members } = get();
    const oldMember = members.find(m => m.id === id);
    const updatedMembers = members.filter(m => m.id !== id);
    set({ members: updatedMembers });
    

    if (userId) {
      try {
        await deleteDoc(doc(db, 'users', userId, 'members', id));
        useAuditStore.getState().addLog({
          action: 'Deleted',
          entity: 'Member',
          entityId: id,
          details: `Deleted member: ${oldMember?.name || 'Unknown'}`
        });
      } catch (e) {
        console.warn('Could not delete member on firestore:', e);
      }
      try {
        await deleteDoc(doc(db, 'public_volunteers', id));
      } catch (e) {
        // Ignored
      }
    }
  },

  addCustomField: async (field) => {
    const { userId, customFields } = get();
    const newFields = [...customFields, { ...field, id: uuidv4() }];
    set({ customFields: newFields });
    
    
    if (userId) {
      try {
        await updateDoc(doc(db, 'users', userId), sanitizeForFirestore({
          customFields: newFields
        }));
      } catch (e) {
        console.warn(e);
      }
    }
  },

  removeCustomField: async (id) => {
    const { userId, customFields } = get();
    const newFields = customFields.filter(f => f.id !== id);
    set({ customFields: newFields });
    
    
    if (userId) {
      try {
        await updateDoc(doc(db, 'users', userId), sanitizeForFirestore({
          customFields: newFields
        }));
      } catch (e) {
        console.warn(e);
      }
    }
  },

  addTemplate: async (template) => {
    const { userId, templates } = get();
    const newTemplates = [...templates, { ...template, id: uuidv4() }];
    set({ templates: newTemplates });
    
    
    if (userId) {
      try {
        await updateDoc(doc(db, 'users', userId), sanitizeForFirestore({
          templates: newTemplates
        }));
      } catch (e) {
        console.warn(e);
      }
    }
  },

  updateTemplate: async (id, templateUpdate) => {
    const { userId, templates } = get();
    const newTemplates = templates.map(t => t.id === id ? { ...t, ...templateUpdate } : t);
    set({ templates: newTemplates });
    
    
    if (userId) {
      try {
        await updateDoc(doc(db, 'users', userId), sanitizeForFirestore({
          templates: newTemplates
        }));
      } catch (e) {
        console.warn(e);
      }
    }
  },

  deleteTemplate: async (id) => {
    const { userId, templates, activeTemplateId } = get();
    if (templates.length <= 1) {
      return; // Keep at least one template
    }
    const newTemplates = templates.filter(t => t.id !== id);
    const newActiveId = activeTemplateId === id ? newTemplates[0].id : activeTemplateId;
    set({ templates: newTemplates, activeTemplateId: newActiveId });
    

    if (userId) {
      try {
        await updateDoc(doc(db, 'users', userId), sanitizeForFirestore({
          templates: newTemplates,
          activeTemplateId: newActiveId
        }));
      } catch (e) {
        console.warn(e);
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
    

    if (userId) {
      try {
        await updateDoc(doc(db, 'users', userId), sanitizeForFirestore({
          templates: newTemplates
        }));
      } catch (e) {
        console.warn(e);
      }
    }
  },

  setActiveTemplate: async (id) => {
    const { userId } = get();
    set({ activeTemplateId: id });
    
    
    if (userId) {
      try {
        await updateDoc(doc(db, 'users', userId), sanitizeForFirestore({
          activeTemplateId: id
        }));
      } catch (e) {
        console.warn(e);
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
    
    if (userId) {
      try {
        await updateDoc(doc(db, 'users', userId), sanitizeForFirestore({ webUsers: updated }));
        useAuditStore.getState().addLog({
          action: 'Created',
          entity: 'Admin User',
          entityId: newUser.id,
          details: `Added new admin/web user: ${newUser.name} (${newUser.role})`
        });
      } catch (e) {}
    }
  },
  
  updateWebUser: async (id, updates) => {
    const { webUsers, userId } = get();
    const oldUser = webUsers.find(u => u.id === id);
    const updated = webUsers.map(u => u.id === id ? { ...u, ...updates } : u);
    set({ webUsers: updated });
    
    if (userId) {
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
      } catch (e) {}
    }
  },
  
  removeWebUser: async (id) => {
    const { webUsers, userId } = get();
    const oldUser = webUsers.find(u => u.id === id);
    const updated = webUsers.filter(u => u.id !== id);
    set({ webUsers: updated });
    
    if (userId) {
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
      } catch (e) {}
    }
  }
}));
