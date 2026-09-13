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

const initialProjects: Project[] = [
  {
    id: 'proj-1',
    title: 'Clean Drinking Water Solar Filtration Units',
    category: 'Water & Sanitation',
    description: 'Installing solar-powered deep tube wells and UV purification kiosks in saline-prone coastal villages.',
    coverImage: 'https://images.unsplash.com/photo-1541888946425-d0fbb18f86f6?w=800&q=80',
    location: 'Satkhira & Khulna Coastal Belt',
    progress: 85,
    status: 'Active',
    budget: 45000
  },
  {
    id: 'proj-2',
    title: 'Rural Community School & Computer Lab',
    category: 'Education',
    description: 'Constructing free primary education centers equipped with solar power and digital learning tools.',
    coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80',
    location: 'Sylhet Rural District',
    progress: 60,
    status: 'Active',
    budget: 32000
  },
  {
    id: 'proj-3',
    title: 'Mobile Emergency Medical & Dental Clinics',
    category: 'Healthcare',
    description: 'Dispatching fully equipped ambulances and volunteer doctors to remote villages lacking healthcare access.',
    coverImage: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&q=80',
    location: 'Northern Char Islands',
    progress: 100,
    status: 'Completed',
    budget: 50000
  },
  {
    id: 'proj-4',
    title: 'Afforestation & Mangrove Belt Protection',
    category: 'Environment',
    description: 'Planting 100,000 mangrove saplings to protect coastal embankments from cyclone storm surges.',
    coverImage: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=800&q=80',
    location: 'Sundarbans Buffer Zone',
    progress: 100,
    status: 'Completed',
    budget: 65000
  }
];

const initialCampaigns: Campaign[] = [
  {
    id: 'camp-1',
    name: 'Emergency Flood Relief Appeal',
    category: 'Disaster Relief',
    description: 'Immediate dry rations, clean drinking water pouches, and medical emergency kits for flood-marooned families.',
    goalAmount: 100000,
    currentAmount: 68500,
    donorsCount: 342,
    coverImage: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&q=80',
    status: 'Active'
  },
  {
    id: 'camp-2',
    name: 'Winter Warmth Clothing Drive',
    category: 'Community Care',
    description: 'Distributing warm wool blankets, thermal jackets, and winter clothing kits for children and senior citizens.',
    goalAmount: 25000,
    currentAmount: 26200,
    donorsCount: 188,
    coverImage: 'https://images.unsplash.com/photo-1518398046578-8cca57782e17?w=800&q=80',
    status: 'Completed'
  },
  {
    id: 'camp-3',
    name: 'Women Micro-Enterprise Grants',
    category: 'Livelihoods',
    description: 'Providing interest-free seed capital and sewing equipment to empower rural women craftspeople.',
    goalAmount: 40000,
    currentAmount: 18400,
    donorsCount: 95,
    coverImage: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80',
    status: 'Active'
  }
];

const initialVolunteers: Volunteer[] = [
  { id: 'v-1', volunteerId: 'VOL-000001', name: 'Tahmid Rahman', email: 'tahmid@example.com', phone: '+880 1711-234567', department: 'Field Operations', status: 'Active' },
  { id: 'v-2', volunteerId: 'VOL-000002', name: 'Farzana Yasmin', email: 'farzana@example.com', phone: '+880 1812-987654', department: 'Medical & Health', status: 'Active' },
  { id: 'v-3', volunteerId: 'VOL-000003', name: 'Tanvir Hossain', email: 'tanvir@example.com', phone: '+880 1913-456789', department: 'Logistics & Relief', status: 'Active' }
];

const initialEvents: Event[] = [
  { 
    id: 'e-1', 
    title: 'Annual Humanitarian Gala 2026', 
    date: 'Oct 15, 2026', 
    time: '6:30 PM - 10:00 PM',
    location: 'Grand Ballroom, Civic Center', 
    description: 'An evening celebrating our donors, partners, and community volunteers with live awards and keynote speeches.',
    coverImage: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80',
    category: 'Fundraiser',
    attendeesCount: 250,
    status: 'Upcoming'
  },
  { 
    id: 'e-2', 
    title: 'Mega Free Health Camp & Eye Screening', 
    date: 'Nov 02, 2026', 
    time: '9:00 AM - 4:00 PM',
    location: 'Community Center, Sub-district 4', 
    description: 'Free medical consultations, cataract screenings, and prescription distribution by volunteer doctors.',
    coverImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
    category: 'Healthcare',
    attendeesCount: 500,
    status: 'Upcoming'
  },
  { 
    id: 'e-3', 
    title: 'Youth Volunteer Orientation & Training', 
    date: 'Nov 18, 2026', 
    time: '10:00 AM - 1:00 PM',
    location: 'NGO Headquarters Hall', 
    description: 'Comprehensive training session on disaster response, ID card protocol, and ethical community engagement.',
    coverImage: 'https://images.unsplash.com/photo-1528323273322-d81458248d40?w=800&q=80',
    category: 'Workshop',
    attendeesCount: 65,
    status: 'Upcoming'
  }
];

const initialNews: News[] = [
  { 
    id: 'n-1', 
    title: 'NGO Reaches Milestone: 50,000 Individuals Provided Clean Drinking Water', 
    excerpt: 'Our engineering and community volunteer teams inaugurated the 40th solar-powered filtration plant today.',
    content: 'Through generous donor contributions and tireless volunteer coordination, our Clean Water Initiative has now connected over 50,000 residents to potable water sources, drastically reducing waterborne diseases.',
    date: 'Sep 05, 2026', 
    coverImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
    author: 'Editorial Team',
    category: 'Impact Story',
    status: 'Published'
  },
  { 
    id: 'n-2', 
    title: 'Annual Transparency & Impact Audit Report 2025 Released', 
    excerpt: 'Read about our 92% program expense efficiency and independently verified financial audit results.',
    content: 'We take pride in rigorous fiscal discipline and zero tolerance for inefficiency. 92 cents of every dollar donated went straight to frontline humanitarian programs.',
    date: 'Aug 18, 2026', 
    coverImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80',
    author: 'Finance & Compliance',
    category: 'Governance',
    status: 'Published'
  }
];

const initialDonations: Donation[] = [
  {
    id: 'don-1',
    receiptNumber: 'REC-2026-008129',
    donorName: 'Amina Khatun',
    donorEmail: 'amina.k@example.com',
    amount: 500,
    campaignId: 'camp-1',
    campaignName: 'Emergency Flood Relief Appeal',
    paymentMethod: 'card',
    status: 'Completed',
    createdAt: '2026-09-08T10:15:00Z'
  },
  {
    id: 'don-2',
    receiptNumber: 'REC-2026-008130',
    donorName: 'Dr. Michael Chen',
    donorEmail: 'mchen@medicalnet.org',
    amount: 1000,
    campaignId: 'camp-1',
    campaignName: 'Emergency Flood Relief Appeal',
    paymentMethod: 'bank',
    status: 'Completed',
    createdAt: '2026-09-09T14:30:00Z'
  },
  {
    id: 'don-3',
    receiptNumber: 'REC-2026-008131',
    donorName: 'Rahim Chowdhury',
    donorEmail: 'r.chowdhury@gmail.com',
    amount: 100,
    campaignId: 'camp-2',
    campaignName: 'Winter Warmth Clothing Drive',
    paymentMethod: 'mobile',
    status: 'Completed',
    createdAt: '2026-09-10T09:45:00Z'
  }
];

const initialMessages: ContactMessage[] = [
  {
    id: 'msg-1',
    name: 'Sabrina Alom',
    email: 'sabrina.alom@partner.org',
    phone: '+880 1712-334455',
    subject: 'Corporate CSR Partnership Opportunity',
    message: 'Hello! Our corporation is planning to allocate CSR funds for rural education. We would love to discuss sponsoring one of your upcoming school renovations.',
    isRead: false,
    createdAt: '2026-09-10T11:20:00Z'
  },
  {
    id: 'msg-2',
    name: 'David Reynolds',
    email: 'dreynolds@globalaid.org',
    phone: '+1 (415) 555-0199',
    subject: 'Volunteer Medical Team Inquiries',
    message: 'We have a group of 8 certified paramedics and physicians eager to join your mobile health camps next month. How do we proceed with credentials verification?',
    isRead: true,
    createdAt: '2026-09-09T16:05:00Z'
  }
];

const initialDocuments: TransparencyDoc[] = [
  {
    id: 'doc-1',
    title: 'Annual Audited Financial Statements FY 2025',
    category: 'Financial Audit',
    year: '2025',
    fileSize: '3.4 MB',
    fileUrl: '#',
    description: 'Certified financial statements audited by Chartered Accountants showing 92% program expenditure.',
    uploadedAt: '2026-01-15'
  },
  {
    id: 'doc-2',
    title: 'Government NGO Affairs Bureau Registration Certificate',
    category: 'Tax Exemption',
    year: '2024-2029',
    fileSize: '1.2 MB',
    fileUrl: '#',
    description: 'Official renewal and authorization certificate issued by the regulatory affairs bureau.',
    uploadedAt: '2024-06-10'
  },
  {
    id: 'doc-3',
    title: 'Organizational Constitution & Governance Bylaws',
    category: 'Governance & Bylaws',
    year: '2024',
    fileSize: '2.1 MB',
    fileUrl: '#',
    description: 'Standard operating procedures, executive council guidelines, and child-safeguarding policy.',
    uploadedAt: '2024-03-01'
  },
  {
    id: 'doc-4',
    title: 'Global Impact & Social Return on Investment (SROI) Report',
    category: 'Annual Report',
    year: '2025',
    fileSize: '5.8 MB',
    fileUrl: '#',
    description: 'Third-party assessment of community outcomes, hygiene metrics, and school attendance rates.',
    uploadedAt: '2026-02-20'
  }
];

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
  projects: initialProjects,
  campaigns: initialCampaigns,
  volunteers: initialVolunteers,
  events: initialEvents,
  news: initialNews,
  donations: initialDonations,
  messages: initialMessages,
  documents: initialDocuments,
  stats: {
    peopleHelped: "52,400+",
    volunteers: "1,250+",
    projectsCompleted: "48",
    fundsRaised: "$2.65M",
  },

  syncNgoWithUser: async (userId: string) => {
    set({ userId });
    unsubscribers.forEach(u => u());
    unsubscribers = [];

    const setupCollectionSync = async (colName: string, initialData: any[], stateKey: keyof NgoState) => {
      const colRef = collection(db, colName);
      try {
        const snap = await getDocs(colRef);
        if (snap.empty) {
          for (const item of initialData) {
            try {
              await setDoc(doc(colRef, item.id), sanitizeForFirestore(item));
            } catch (err) {
              // Ignore offline write errors
            }
          }
        }
        const unsub = onSnapshot(colRef, (snapshot) => {
          const items: any[] = [];
          snapshot.forEach(d => items.push(d.data()));
          if (items.length > 0) {
            set({ [stateKey]: items } as any);
          }
        }, (err) => {
          console.warn(`Snapshot listener warning for ${colName}:`, err.message);
        });
        unsubscribers.push(unsub);
      } catch (e: any) {
        console.warn(`Could not sync collection ${colName} (operating in offline fallback mode):`, e?.message);
      }
    };

    await setupCollectionSync('projects', initialProjects, 'projects');
    await setupCollectionSync('campaigns', initialCampaigns, 'campaigns');
    await setupCollectionSync('volunteers', initialVolunteers, 'volunteers');
    await setupCollectionSync('events', initialEvents, 'events');
    await setupCollectionSync('news', initialNews, 'news');
    await setupCollectionSync('donations', initialDonations, 'donations');
    await setupCollectionSync('messages', initialMessages, 'messages');
    await setupCollectionSync('documents', initialDocuments, 'documents');

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
    const updated = get().projects.filter(p => p.id !== id);
    set({ projects: updated });
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
    const updated = get().campaigns.filter(c => c.id !== id);
    set({ campaigns: updated });
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
