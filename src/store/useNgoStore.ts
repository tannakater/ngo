import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../lib/firebase';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';

export interface Project {
  id: string;
  title: string;
  category?: string;
  description: string;
  coverImage: string;
  location: string;
  progress: number;
  status: 'Active' | 'Completed' | 'Draft';
  budget: number;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  goalAmount: number;
  currentAmount: number;
  coverImage: string;
  status: 'Active' | 'Completed' | 'Paused';
  category?: string;
  donorsCount?: number;
}

export interface Volunteer {
  id: string;
  volunteerId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  status: 'Active' | 'Pending' | 'Suspended';
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time?: string;
  location: string;
  description?: string;
  coverImage: string;
  category?: string;
  attendeesCount?: number;
  status?: 'Upcoming' | 'Completed' | 'Cancelled';
}

export interface News {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  date: string;
  coverImage: string;
  author?: string;
  category?: string;
  status?: 'Published' | 'Draft';
}

export interface Donation {
  id: string;
  receiptNumber: string;
  donorName: string;
  donorEmail: string;
  donorPhone?: string;
  amount: number;
  currency?: string;
  frequency?: 'one-time' | 'monthly';
  transactionId?: string;
  isAnonymous?: boolean;
  dedication?: string;
  campaignId: string;
  campaignName: string;
  paymentMethod: 'card' | 'bank' | 'mobile' | 'cash';
  status: 'Completed' | 'Pending' | 'Failed';
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  approverRole?: string;
  receiptSent?: boolean;
  receiptSentAt?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface TransparencyDoc {
  id: string;
  title: string;
  category: 'Annual Report' | 'Financial Audit' | 'Tax Exemption' | 'Governance & Bylaws';
  year: string;
  fileSize: string;
  fileUrl: string;
  description?: string;
  uploadedAt: string;
}

export interface NgoState {
  userId: string | null;
  projects: Project[];
  campaigns: Campaign[];
  volunteers: Volunteer[];
  events: Event[];
  news: News[];
  donations: Donation[];
  messages: ContactMessage[];
  documents: TransparencyDoc[];
  stats: {
    peopleHelped: string;
    volunteers: string;
    projectsCompleted: string;
    fundsRaised: string;
  };
  syncNgoWithUser: (userId: string) => Promise<void>;
  disconnectNgoFirebase: () => void;
  addProject: (project: Omit<Project, 'id'>) => Promise<void>;
  updateProject: (id: string, project: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addCampaign: (campaign: Omit<Campaign, 'id'>) => Promise<void>;
  updateCampaign: (id: string, campaign: Partial<Campaign>) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  addVolunteer: (volunteer: Omit<Volunteer, 'id'>) => Promise<void>;
  updateVolunteer: (id: string, volunteer: Partial<Volunteer>) => Promise<void>;
  deleteVolunteer: (id: string) => Promise<void>;
  addEvent: (event: Omit<Event, 'id'>) => Promise<void>;
  updateEvent: (id: string, event: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  addNews: (news: Omit<News, 'id'>) => Promise<void>;
  updateNews: (id: string, news: Partial<News>) => Promise<void>;
  deleteNews: (id: string) => Promise<void>;
  addDonation: (donation: Omit<Donation, 'id' | 'receiptNumber' | 'createdAt'>) => Promise<Donation>;
  updateDonation: (id: string, donation: Partial<Donation>) => Promise<void>;
  deleteDonation: (id: string) => Promise<void>;
  addMessage: (message: Omit<ContactMessage, 'id' | 'isRead' | 'createdAt'>) => Promise<void>;
  markMessageRead: (id: string) => Promise<void>;
  deleteMessage: (id: string) => Promise<void>;
  addDocument: (doc: Omit<TransparencyDoc, 'id' | 'uploadedAt'>) => Promise<void>;
  updateDocument: (id: string, doc: Partial<TransparencyDoc>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  updateStats: (stats: Partial<NgoState['stats']>) => Promise<void>;
}

const initialProjects: Project[] = [];

const initialCampaigns: Campaign[] = [];
const initialVolunteers: Volunteer[] = [];
const initialEvents: Event[] = [];
const initialNews: News[] = [];
const initialDonations: Donation[] = [];
const initialMessages: ContactMessage[] = [];
const initialDocuments: TransparencyDoc[] = [];

const sanitizeForFirestore = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

export const isCampaignMatch = (camp: Campaign, campaignId?: string, campaignName?: string): boolean => {
  if (!campaignId && !campaignName) return false;
  const cId = (camp.id || '').trim().toLowerCase();
  const targetId = (campaignId || '').trim().toLowerCase();
  if (cId && targetId && (cId === targetId || targetId.includes(cId) || cId.includes(targetId))) {
    return true;
  }
  const cName = (camp.name || '').trim().toLowerCase();
  const targetName = (campaignName || '').trim().toLowerCase();
  if (cName && targetName && (cName === targetName || cName.includes(targetName) || targetName.includes(cName))) {
    return true;
  }
  return false;
};

let unsubscribers: (() => void)[] = [];

export const useNgoStore = create<NgoState>((set, get) => ({
  userId: null,
  projects: [],
  campaigns: [],
  volunteers: [],
  events: [],
  news: [],
  donations: [],
  messages: [],
  documents: [],
  stats: {
    peopleHelped: "0+",
    volunteers: "0+",
    projectsCompleted: "0",
    fundsRaised: "$0",
  },

  syncNgoWithUser: async (userId: string) => {
    set({ userId });
    unsubscribers.forEach(u => u());
    unsubscribers = [];

    const setupCollectionSync = async (colName: string, stateKey: keyof NgoState) => {
      const colRef = collection(db, colName);
      try {
        const unsub = onSnapshot(colRef, (snapshot) => {
          const items: any[] = [];
          snapshot.forEach(d => items.push(d.data()));
          set({ [stateKey]: items } as any);
        }, (err) => {
          console.warn(`Snapshot listener warning for ${colName}:`, err.message);
        });
        unsubscribers.push(unsub);
      } catch (e: any) {
        console.warn(`Could not sync collection ${colName}:`, e?.message);
      }
    };

    await setupCollectionSync('projects', 'projects');
    await setupCollectionSync('campaigns', 'campaigns');
    await setupCollectionSync('volunteers', 'volunteers');
    await setupCollectionSync('events', 'events');
    await setupCollectionSync('news', 'news');
    await setupCollectionSync('donations', 'donations');
    await setupCollectionSync('messages', 'messages');
    await setupCollectionSync('documents', 'documents');

    // Stats doc
    try {
      const statsRef = doc(db, 'app_stats', 'main');
      const statsSnap = await getDocs(collection(db, 'app_stats'));
      if (statsSnap.empty) {
        await setDoc(statsRef, sanitizeForFirestore(get().stats));
      }
      const unsubStats = onSnapshot(statsRef, (docSnap) => {
        if (docSnap.exists()) {
          set({ stats: docSnap.data() as any });
        }
      });
      unsubscribers.push(unsubStats);
    } catch (e) {
      console.warn('Could not sync stats doc:', e);
    }
  },

  disconnectNgoFirebase: () => {
    unsubscribers.forEach(u => u());
    unsubscribers = [];
    set({ userId: null });
  },

  addProject: async (projectData) => {
    const id = uuidv4();
    const newProject: Project = { ...projectData, id };
    const updated = [newProject, ...get().projects];
    set({ projects: updated });
    try {
      await setDoc(doc(db, 'projects', id), sanitizeForFirestore(newProject));
    } catch (e) {
      console.warn('Could not add project to collection:', e);
    }
  },
  updateProject: async (id, projectUpdate) => {
    const updated = get().projects.map(p => p.id === id ? { ...p, ...projectUpdate } : p);
    set({ projects: updated });
    try {
      const proj = updated.find(p => p.id === id);
      if (proj) {
        await updateDoc(doc(db, 'projects', id), sanitizeForFirestore(proj));
      }
    } catch (e) {
      console.warn('Could not update project on collection:', e);
    }
  },
  deleteProject: async (id) => {
    set({ projects: get().projects.filter(p => p.id !== id) });
    try {
      await deleteDoc(doc(db, 'projects', id));
    } catch (e) {
      console.warn('Could not delete project from collection:', e);
    }
  },

  addCampaign: async (campaignData) => {
    const id = uuidv4();
    const newCampaign: Campaign = { ...campaignData, id, donorsCount: 0 };
    const updated = [newCampaign, ...get().campaigns];
    set({ campaigns: updated });
    try {
      await setDoc(doc(db, 'campaigns', id), sanitizeForFirestore(newCampaign));
    } catch (e) {
      console.warn('Could not add campaign to collection:', e);
    }
  },
  updateCampaign: async (id, campaignUpdate) => {
    const updated = get().campaigns.map(c => c.id === id ? { ...c, ...campaignUpdate } : c);
    set({ campaigns: updated });
    try {
      const camp = updated.find(c => c.id === id);
      if (camp) {
        await updateDoc(doc(db, 'campaigns', id), sanitizeForFirestore(camp));
      }
    } catch (e) {
      console.warn('Could not update campaign on collection:', e);
    }
  },
  deleteCampaign: async (id) => {
    set({ campaigns: get().campaigns.filter(c => c.id !== id) });
    try {
      await deleteDoc(doc(db, 'campaigns', id));
    } catch (e) {
      console.warn('Could not delete campaign from collection:', e);
    }
  },

  addVolunteer: async (volunteerData) => {
    const id = uuidv4();
    const newVolunteer: Volunteer = { ...volunteerData, id };
    const updated = [newVolunteer, ...get().volunteers];
    set({ volunteers: updated });
    try {
      await setDoc(doc(db, 'volunteers', id), sanitizeForFirestore(newVolunteer));
    } catch (e) {
      console.warn('Could not add volunteer to collection:', e);
    }
  },
  updateVolunteer: async (id, volunteerUpdate) => {
    const updated = get().volunteers.map(v => v.id === id ? { ...v, ...volunteerUpdate } : v);
    set({ volunteers: updated });
    try {
      const vol = updated.find(v => v.id === id);
      if (vol) {
        await updateDoc(doc(db, 'volunteers', id), sanitizeForFirestore(vol));
      }
    } catch (e) {
      console.warn('Could not update volunteer on collection:', e);
    }
  },
  deleteVolunteer: async (id) => {
    const updated = get().volunteers.filter(v => v.id !== id);
    set({ volunteers: updated });
    try {
      await deleteDoc(doc(db, 'volunteers', id));
    } catch (e) {
      console.warn('Could not delete volunteer from collection:', e);
    }
  },

  addEvent: async (eventData) => {
    const id = uuidv4();
    const newEvent: Event = { ...eventData, id };
    const updated = [newEvent, ...get().events];
    set({ events: updated });
    try {
      await setDoc(doc(db, 'events', id), sanitizeForFirestore(newEvent));
    } catch (e) {
      console.warn('Could not add event to collection:', e);
    }
  },
  updateEvent: async (id, eventUpdate) => {
    const updated = get().events.map(e => e.id === id ? { ...e, ...eventUpdate } : e);
    set({ events: updated });
    try {
      const ev = updated.find(e => e.id === id);
      if (ev) {
        await updateDoc(doc(db, 'events', id), sanitizeForFirestore(ev));
      }
    } catch (e) {
      console.warn('Could not update event on collection:', e);
    }
  },
  deleteEvent: async (id) => {
    const updated = get().events.filter(e => e.id !== id);
    set({ events: updated });
    try {
      await deleteDoc(doc(db, 'events', id));
    } catch (e) {
      console.warn('Could not delete event from collection:', e);
    }
  },

  addNews: async (newsData) => {
    const id = uuidv4();
    const newNews: News = { ...newsData, id };
    const updated = [newNews, ...get().news];
    set({ news: updated });
    try {
      await setDoc(doc(db, 'news', id), sanitizeForFirestore(newNews));
    } catch (e) {
      console.warn('Could not add news to collection:', e);
    }
  },
  updateNews: async (id, newsUpdate) => {
    const updated = get().news.map(n => n.id === id ? { ...n, ...newsUpdate } : n);
    set({ news: updated });
    try {
      const item = updated.find(n => n.id === id);
      if (item) {
        await updateDoc(doc(db, 'news', id), sanitizeForFirestore(item));
      }
    } catch (e) {
      console.warn('Could not update news on collection:', e);
    }
  },
  deleteNews: async (id) => {
    const updated = get().news.filter(n => n.id !== id);
    set({ news: updated });
    try {
      await deleteDoc(doc(db, 'news', id));
    } catch (e) {
      console.warn('Could not delete news from collection:', e);
    }
  },

  addDonation: async (donationData) => {
    const id = uuidv4();
    const receipt = `REC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const status = donationData.status || 'Pending';
    const newDonation: Donation = {
      ...donationData,
      id,
      receiptNumber: receipt,
      status,
      createdAt: new Date().toISOString()
    };
    const updated = [newDonation, ...get().donations];
    set({ donations: updated });
    try {
      await setDoc(doc(db, 'donations', id), sanitizeForFirestore(newDonation));
    } catch (e) {
      console.warn('Could not add donation to collection:', e);
    }
    return newDonation;
  },
  updateDonation: async (id, donationUpdate) => {
    const updated = get().donations.map(d => d.id === id ? { ...d, ...donationUpdate } : d);
    set({ donations: updated });
    try {
      const don = updated.find(d => d.id === id);
      if (don) {
        await updateDoc(doc(db, 'donations', id), sanitizeForFirestore(don));
      }
    } catch (e) {
      console.warn('Could not update donation on collection:', e);
    }
  },
  deleteDonation: async (id) => {
    const updated = get().donations.filter(d => d.id !== id);
    set({ donations: updated });
    try {
      await deleteDoc(doc(db, 'donations', id));
    } catch (e) {
      console.warn('Could not delete donation from collection:', e);
    }
  },

  addMessage: async (msgData) => {
    const id = uuidv4();
    const newMsg: ContactMessage = {
      ...msgData,
      id,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    const updated = [newMsg, ...get().messages];
    set({ messages: updated });
    try {
      await setDoc(doc(db, 'messages', id), sanitizeForFirestore(newMsg));
    } catch (e) {
      console.warn('Could not add message to collection:', e);
    }
  },
  markMessageRead: async (id) => {
    const updated = get().messages.map(m => m.id === id ? { ...m, isRead: true } : m);
    set({ messages: updated });
    try {
      await updateDoc(doc(db, 'messages', id), { isRead: true });
    } catch (e) {
      console.warn('Could not mark message read on collection:', e);
    }
  },
  deleteMessage: async (id) => {
    const updated = get().messages.filter(m => m.id !== id);
    set({ messages: updated });
    try {
      await deleteDoc(doc(db, 'messages', id));
    } catch (e) {
      console.warn('Could not delete message from collection:', e);
    }
  },

  addDocument: async (docData) => {
    const id = uuidv4();
    const newDoc: TransparencyDoc = {
      ...docData,
      id,
      uploadedAt: new Date().toISOString().split('T')[0]
    };
    const updated = [newDoc, ...get().documents];
    set({ documents: updated });
    try {
      await setDoc(doc(db, 'documents', id), sanitizeForFirestore(newDoc));
    } catch (e) {
      console.warn('Could not add document to collection:', e);
    }
  },
  updateDocument: async (id, docUpdate) => {
    const updated = get().documents.map(d => d.id === id ? { ...d, ...docUpdate } : d);
    set({ documents: updated });
    try {
      const item = updated.find(d => d.id === id);
      if (item) {
        await updateDoc(doc(db, 'documents', id), sanitizeForFirestore(item));
      }
    } catch (e) {
      console.warn('Could not update document on collection:', e);
    }
  },
  deleteDocument: async (id) => {
    const updated = get().documents.filter(d => d.id !== id);
    set({ documents: updated });
    try {
      await deleteDoc(doc(db, 'documents', id));
    } catch (e) {
      console.warn('Could not delete document from collection:', e);
    }
  },

  updateStats: async (newStats) => {
    const updated = { ...get().stats, ...newStats };
    set({ stats: updated });
    try {
      await setDoc(doc(db, 'app_stats', 'main'), sanitizeForFirestore(updated), { merge: true });
    } catch (e) {
      console.warn('Could not update stats on collection:', e);
    }
  }
}));

export const initDonationsSync = () => {};
