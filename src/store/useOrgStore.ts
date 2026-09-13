import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Organization, Member, CustomFieldDefinition, CardTemplate, WebUser } from '../types';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, onSnapshot, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';

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

const initialSeedMembers: Member[] = [
  {
    id: 'mem-1',
    memberId: 'GHF-000001',
    firstName: 'Arafat',
    lastName: 'Hossain',
    role: 'Staff',
    designation: 'Executive Director',
    department: 'Administration',
    phone: '+880 1711-002233',
    email: 'arafat@globalhope.org',
    bloodGroup: 'O+',
    status: 'Active',
    dateOfBirth: '1985-04-12',
    joiningDate: '2022-01-15',
    emergencyContact: '+880 1711-998877',
    address: 'Gulshan-2, Dhaka',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=faces&q=80',
    customFields: {},
    idCardGenerated: true,
    idCardGeneratedAt: '2026-03-01T10:00:00Z',
    needsRegeneration: false,
  },
  {
    id: 'mem-2',
    memberId: 'GHF-000002',
    firstName: 'Nusrat',
    lastName: 'Jahan',
    role: 'Staff',
    designation: 'Head of Programs & Relief',
    department: 'Field Operations',
    phone: '+880 1812-334455',
    email: 'nusrat@globalhope.org',
    bloodGroup: 'A+',
    status: 'Active',
    dateOfBirth: '1990-09-24',
    joiningDate: '2022-03-01',
    emergencyContact: '+880 1812-778899',
    address: 'Dhanmondi, Dhaka',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop&crop=faces&q=80',
    customFields: {},
    idCardGenerated: true,
    idCardGeneratedAt: '2026-03-05T14:30:00Z',
    needsRegeneration: false,
  },
  {
    id: 'mem-3',
    memberId: 'GHF-000003',
    firstName: 'Tahmid',
    lastName: 'Rahman',
    role: 'Volunteer',
    designation: 'Lead Field Volunteer',
    department: 'Disaster Response',
    phone: '+880 1913-667788',
    email: 'tahmid.r@globalhope.org',
    bloodGroup: 'B+',
    status: 'Active',
    dateOfBirth: '1996-11-05',
    joiningDate: '2023-05-10',
    emergencyContact: '+880 1913-221100',
    address: 'Uttara, Dhaka',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=faces&q=80',
    customFields: { VolunteerBadge: 'Gold Responder' }
  },
  {
    id: 'mem-4',
    memberId: 'GHF-000004',
    firstName: 'Dr. Sharmin',
    lastName: 'Akter',
    role: 'Member',
    designation: 'Senior Medical Advisor',
    department: 'Health Services',
    phone: '+880 1614-889900',
    email: 'dr.sharmin@globalhope.org',
    bloodGroup: 'AB+',
    status: 'Active',
    dateOfBirth: '1982-02-18',
    joiningDate: '2023-08-20',
    emergencyContact: '+880 1614-332211',
    address: 'Mirpur DOHS, Dhaka',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop&crop=faces&q=80',
    customFields: { License: 'BMDC-A-48921' }
  },
  {
    id: 'mem-5',
    memberId: 'GHF-000005',
    firstName: 'Farhana',
    lastName: 'Kabir',
    role: 'Volunteer',
    designation: 'Community Organizer',
    department: 'Education & Outreach',
    phone: '+880 1515-112233',
    email: 'farhana@globalhope.org',
    bloodGroup: 'O-',
    status: 'Active',
    dateOfBirth: '1998-07-14',
    joiningDate: '2024-01-12',
    emergencyContact: '+880 1515-445566',
    address: 'Chittagong Port Area',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=faces&q=80',
    customFields: { Language: 'Bangla, English, Rohingya' }
  },
  {
    id: 'vol-req-1',
    memberId: 'GHF-000006',
    firstName: 'Tanvir',
    lastName: 'Hasan',
    role: 'Volunteer',
    designation: 'Volunteer Applicant',
    department: 'Disaster Relief & Logistics',
    phone: '+880 1712-445566',
    email: 'tanvir.hasan@example.com',
    bloodGroup: 'B+',
    status: 'Pending',
    dateOfBirth: '1999-05-18',
    joiningDate: new Date().toISOString().split('T')[0],
    emergencyContact: '+880 1712-998877',
    address: 'Mohammadpur, Dhaka',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop&crop=faces&q=80',
    customFields: { Experience: '2 years emergency first responder training' }
  },
  {
    id: 'vol-req-2',
    memberId: 'GHF-000007',
    firstName: 'Sumaiya',
    lastName: 'Akter',
    role: 'Volunteer',
    designation: 'Volunteer Applicant',
    department: 'Medical & Community Health',
    phone: '+880 1819-332211',
    email: 'sumaiya.med@example.com',
    bloodGroup: 'O+',
    status: 'Pending',
    dateOfBirth: '2001-09-12',
    joiningDate: new Date().toISOString().split('T')[0],
    emergencyContact: '+880 1819-001122',
    address: 'Dhanmondi Road 27, Dhaka',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop&crop=faces&q=80',
    customFields: { Skills: 'Nursing student, First Aid CPR Certified' }
  }
];

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
          saveLocalOrgData({
            organization: newOrg,
            members: get().members,
            customFields: newFields,
            templates: newTemplates,
            activeTemplateId: newActiveId,
            webUsers: newWebUsers
          });
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
    const newOrg = { ...organization, ...orgUpdate };
    set({ organization: newOrg });
    
    
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
        }
      } catch (e) {
        console.warn('Could not update member on firestore:', e);
      }
    }
  },

  deleteMember: async (id) => {
    const { userId, members } = get();
    const updatedMembers = members.filter(m => m.id !== id);
    set({ members: updatedMembers });
    

    if (userId) {
      try {
        await deleteDoc(doc(db, 'users', userId, 'members', id));
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
      } catch (e) {}
    }
  },
  
  updateWebUser: async (id, updates) => {
    const { webUsers, userId } = get();
    const updated = webUsers.map(u => u.id === id ? { ...u, ...updates } : u);
    set({ webUsers: updated });
    
    if (userId) {
      try {
        await updateDoc(doc(db, 'users', userId), sanitizeForFirestore({ webUsers: updated }));
      } catch (e) {}
    }
  },
  
  removeWebUser: async (id) => {
    const { webUsers, userId } = get();
    const updated = webUsers.filter(u => u.id !== id);
    set({ webUsers: updated });
    
    if (userId) {
      try {
        await updateDoc(doc(db, 'users', userId), sanitizeForFirestore({ webUsers: updated }));
      } catch (e) {}
    }
  }
}));
