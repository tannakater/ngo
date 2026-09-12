import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../lib/firebase';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

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

  // Actions
  addProject: (project: Omit<Project, 'id'>) => void;
  updateProject: (id: string, project: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  addCampaign: (campaign: Omit<Campaign, 'id'>) => void;
  updateCampaign: (id: string, campaign: Partial<Campaign>) => void;
  deleteCampaign: (id: string) => void;

  addDonation: (donation: Omit<Donation, 'id' | 'receiptNumber' | 'createdAt'>) => string;
  updateDonation: (id: string, donation: Partial<Donation>) => void;
  deleteDonation: (id: string) => void;
  approveDonation: (id: string, approver?: string | { name: string; role?: string }) => Promise<Donation | null>;

  addEvent: (event: Omit<Event, 'id'>) => void;
  updateEvent: (id: string, event: Partial<Event>) => void;
  deleteEvent: (id: string) => void;

  addNews: (newsItem: Omit<News, 'id'>) => void;
  updateNews: (id: string, newsItem: Partial<News>) => void;
  deleteNews: (id: string) => void;

  addMessage: (msg: Omit<ContactMessage, 'id' | 'isRead' | 'createdAt'>) => void;
  markMessageRead: (id: string) => void;
  deleteMessage: (id: string) => void;

  addDocument: (doc: Omit<TransparencyDoc, 'id' | 'uploadedAt'>) => void;
  updateDocument: (id: string, doc: Partial<TransparencyDoc>) => void;
  deleteDocument: (id: string) => void;

  updateStats: (newStats: Partial<NgoState['stats']>) => void;
}

const STORAGE_KEY = 'ngo_state_storage_v1';

const initialProjects: Project[] = [
  {
    id: 'proj-1',
    title: 'Clean Water Initiative',
    category: 'Water & Sanitation',
    description: 'Providing safe drinking water, deep tube-wells, and filtration systems to 15 rural communities.',
    coverImage: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80',
    location: 'Rural Coastal Districts',
    progress: 75,
    status: 'Active',
    budget: 50000
  },
  {
    id: 'proj-2',
    title: 'Education for Every Child',
    category: 'Education',
    description: 'Renovating village schools, distributing free backpacks, books, and tablets for underprivileged students.',
    coverImage: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80',
    location: 'Northern Division',
    progress: 40,
    status: 'Active',
    budget: 120000
  },
  {
    id: 'proj-3',
    title: 'Mobile Health Clinics',
    category: 'Healthcare',
    description: 'Deploying equipped ambulance clinics with volunteer doctors providing free medicine and general checkups.',
    coverImage: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&q=80',
    location: 'Riverine Char Areas',
    progress: 90,
    status: 'Active',
    budget: 85000
  },
  {
    id: 'proj-4',
    title: 'Reforestation & Mangrove Restoration',
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

// Helper to load persisted state safely
const loadPersistedState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        projects: parsed.projects || initialProjects,
        campaigns: parsed.campaigns || initialCampaigns,
        volunteers: parsed.volunteers || initialVolunteers,
        events: parsed.events || initialEvents,
        news: parsed.news || initialNews,
        donations: parsed.donations || initialDonations,
        messages: parsed.messages || initialMessages,
        documents: parsed.documents || initialDocuments,
        stats: parsed.stats || {
          peopleHelped: "52,400+",
          volunteers: "1,250+",
          projectsCompleted: "48",
          fundsRaised: "$2.65M",
        }
      };
    }
  } catch (e) {
    console.error('Failed to load persisted NGO state', e);
  }
  return {
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
    }
  };
};

const saveToLocalStorage = (state: Partial<NgoState>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      projects: state.projects,
      campaigns: state.campaigns,
      volunteers: state.volunteers,
      events: state.events,
      news: state.news,
      donations: state.donations,
      messages: state.messages,
      documents: state.documents,
      stats: state.stats
    }));
  } catch (e) {
    console.error('Failed to save NGO state to localStorage', e);
  }
};

// Helper function to reliably match a campaign by ID or Name (case-insensitive & trimmed)
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

const initialState = loadPersistedState();

export const useNgoStore = create<NgoState>((set, get) => ({
  ...initialState,

  addProject: (projectData) => {
    const newProject: Project = { ...projectData, id: uuidv4() };
    const updated = [newProject, ...get().projects];
    set({ projects: updated });
    saveToLocalStorage({ ...get(), projects: updated });
  },

  updateProject: (id, projectUpdate) => {
    const updated = get().projects.map(p => p.id === id ? { ...p, ...projectUpdate } : p);
    set({ projects: updated });
    saveToLocalStorage({ ...get(), projects: updated });
  },

  deleteProject: (id) => {
    const updated = get().projects.filter(p => p.id !== id);
    set({ projects: updated });
    saveToLocalStorage({ ...get(), projects: updated });
  },

  addCampaign: (campaignData) => {
    const newCampaign: Campaign = { ...campaignData, id: uuidv4(), donorsCount: 0 };
    const updated = [newCampaign, ...get().campaigns];
    set({ campaigns: updated });
    saveToLocalStorage({ ...get(), campaigns: updated });
  },

  updateCampaign: (id, campaignUpdate) => {
    const updated = get().campaigns.map(c => c.id === id ? { ...c, ...campaignUpdate } : c);
    set({ campaigns: updated });
    saveToLocalStorage({ ...get(), campaigns: updated });
  },

  deleteCampaign: (id) => {
    const updated = get().campaigns.filter(c => c.id !== id);
    set({ campaigns: updated });
    saveToLocalStorage({ ...get(), campaigns: updated });
  },

  addDonation: (donationData) => {
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
    
    // Auto-update campaign amount and donors count if donation is already Completed
    let updatedCampaigns = get().campaigns;
    if (status === 'Completed') {
      const amountToAdd = Number(donationData.amount) || 0;
      updatedCampaigns = get().campaigns.map(c => {
        if (isCampaignMatch(c, donationData.campaignId, donationData.campaignName)) {
          const newCurrent = Number(c.currentAmount || 0) + amountToAdd;
          const isCompleted = newCurrent >= c.goalAmount && c.status === 'Active';
          return {
            ...c,
            currentAmount: newCurrent,
            donorsCount: (c.donorsCount || 0) + 1,
            status: isCompleted ? ('Completed' as const) : c.status
          };
        }
        return c;
      });
    }

    const updatedDonations = [newDonation, ...get().donations];
    set({ donations: updatedDonations, campaigns: updatedCampaigns });
    saveToLocalStorage({ ...get(), donations: updatedDonations, campaigns: updatedCampaigns });

    // Sync to Cloud Firestore immediately so all admins and devices see it in real-time
    try {
      setDoc(doc(db, 'donations', id), newDonation).catch(err => {
        console.warn('Firestore setDoc donation fallback to local:', err);
      });
    } catch (err) {
      console.warn('Could not sync donation to Firestore:', err);
    }

    return receipt;
  },

  approveDonation: async (id: string, approver?: string | { name: string; role?: string }) => {
    const donation = get().donations.find(d => d.id === id);
    if (!donation) return null;

    // Prevent duplicate crediting if already completed
    if (donation.status === 'Completed') {
      return donation;
    }

    let approverName = 'Admin Directorate';
    let approverRole = 'Administrator';

    if (typeof approver === 'string') {
      approverName = approver.trim() || 'Admin Directorate';
      if (approverName.toLowerCase().includes('mod')) {
        approverRole = 'Moderator';
      }
    } else if (approver) {
      approverName = approver.name?.trim() || 'Admin Directorate';
      approverRole = approver.role || (approverName.toLowerCase().includes('mod') ? 'Moderator' : 'Administrator');
    }

    const approvedUpdate: Partial<Donation> = {
      status: 'Completed',
      approvedAt: new Date().toISOString(),
      approvedBy: approverName,
      approverRole: approverRole,
      receiptSent: true,
      receiptSentAt: new Date().toISOString()
    };

    // Auto-credit the donation amount directly onto the specific campaign amount loading bar
    const donationAmount = Number(donation.amount) || 0;
    const updatedCampaigns = get().campaigns.map(c => {
      if (isCampaignMatch(c, donation.campaignId, donation.campaignName)) {
        const newCurrent = Number(c.currentAmount || 0) + donationAmount;
        const reachedGoal = newCurrent >= c.goalAmount && c.status === 'Active';
        return {
          ...c,
          currentAmount: newCurrent,
          donorsCount: (c.donorsCount || 0) + 1,
          status: reachedGoal ? ('Completed' as const) : c.status
        };
      }
      return c;
    });

    const updatedDonations = get().donations.map(d => d.id === id ? { ...d, ...approvedUpdate } : d);
    set({ donations: updatedDonations, campaigns: updatedCampaigns });
    saveToLocalStorage({ ...get(), donations: updatedDonations, campaigns: updatedCampaigns });

    // Sync approval update to Cloud Firestore
    try {
      updateDoc(doc(db, 'donations', id), approvedUpdate).catch(err => {
        console.warn('Firestore updateDoc donation fallback to local:', err);
      });
    } catch (err) {
      console.warn('Could not update donation in Firestore:', err);
    }

    return { ...donation, ...approvedUpdate };
  },

  updateDonation: (id, donationUpdate) => {
    const existing = get().donations.find(d => d.id === id);
    if (!existing) return;

    const mergedDonation: Donation = { ...existing, ...donationUpdate };
    let updatedCampaigns = get().campaigns;

    const wasCompleted = existing.status === 'Completed';
    const isCompleted = mergedDonation.status === 'Completed';

    if (!wasCompleted && isCompleted) {
      // Transition to Completed: Auto-add amount to campaign loading bar
      const amountToAdd = Number(mergedDonation.amount) || 0;
      updatedCampaigns = updatedCampaigns.map(c => {
        if (isCampaignMatch(c, mergedDonation.campaignId, mergedDonation.campaignName)) {
          const newCurrent = Number(c.currentAmount || 0) + amountToAdd;
          const reachedGoal = newCurrent >= c.goalAmount && c.status === 'Active';
          return {
            ...c,
            currentAmount: newCurrent,
            donorsCount: (c.donorsCount || 0) + 1,
            status: reachedGoal ? ('Completed' as const) : c.status
          };
        }
        return c;
      });
    } else if (wasCompleted && !isCompleted) {
      // Transition from Completed to Pending/Failed: Deduct amount from campaign
      const amountToDeduct = Number(existing.amount) || 0;
      updatedCampaigns = updatedCampaigns.map(c => {
        if (isCampaignMatch(c, existing.campaignId, existing.campaignName)) {
          return {
            ...c,
            currentAmount: Math.max(0, Number(c.currentAmount || 0) - amountToDeduct),
            donorsCount: Math.max(0, (c.donorsCount || 1) - 1)
          };
        }
        return c;
      });
    } else if (wasCompleted && isCompleted) {
      // Remained completed: check for campaign or amount modification
      const oldAmount = Number(existing.amount) || 0;
      const newAmount = Number(mergedDonation.amount) || 0;
      const isSameCamp = existing.campaignId === mergedDonation.campaignId &&
                         existing.campaignName === mergedDonation.campaignName;

      if (!isSameCamp) {
        // Deduct from old campaign, add to new campaign
        updatedCampaigns = updatedCampaigns.map(c => {
          if (isCampaignMatch(c, existing.campaignId, existing.campaignName)) {
            return {
              ...c,
              currentAmount: Math.max(0, Number(c.currentAmount || 0) - oldAmount),
              donorsCount: Math.max(0, (c.donorsCount || 1) - 1)
            };
          }
          if (isCampaignMatch(c, mergedDonation.campaignId, mergedDonation.campaignName)) {
            return {
              ...c,
              currentAmount: Number(c.currentAmount || 0) + newAmount,
              donorsCount: (c.donorsCount || 0) + 1
            };
          }
          return c;
        });
      } else if (newAmount !== oldAmount) {
        // Adjust difference on campaign
        const diff = newAmount - oldAmount;
        updatedCampaigns = updatedCampaigns.map(c => {
          if (isCampaignMatch(c, mergedDonation.campaignId, mergedDonation.campaignName)) {
            return {
              ...c,
              currentAmount: Math.max(0, Number(c.currentAmount || 0) + diff)
            };
          }
          return c;
        });
      }
    }

    const updated = get().donations.map(d => d.id === id ? mergedDonation : d);
    set({ donations: updated, campaigns: updatedCampaigns });
    saveToLocalStorage({ ...get(), donations: updated, campaigns: updatedCampaigns });

    try {
      updateDoc(doc(db, 'donations', id), donationUpdate).catch(err => {
        console.warn('Firestore updateDoc fallback:', err);
      });
    } catch (err) {
      console.warn('Could not update donation in Firestore:', err);
    }
  },

  deleteDonation: (id) => {
    const existing = get().donations.find(d => d.id === id);
    let updatedCampaigns = get().campaigns;

    if (existing && existing.status === 'Completed') {
      const amountToDeduct = Number(existing.amount) || 0;
      updatedCampaigns = updatedCampaigns.map(c => {
        if (isCampaignMatch(c, existing.campaignId, existing.campaignName)) {
          return {
            ...c,
            currentAmount: Math.max(0, Number(c.currentAmount || 0) - amountToDeduct),
            donorsCount: Math.max(0, (c.donorsCount || 1) - 1)
          };
        }
        return c;
      });
    }

    const updated = get().donations.filter(d => d.id !== id);
    set({ donations: updated, campaigns: updatedCampaigns });
    saveToLocalStorage({ ...get(), donations: updated, campaigns: updatedCampaigns });

    try {
      deleteDoc(doc(db, 'donations', id)).catch(err => {
        console.warn('Firestore deleteDoc fallback:', err);
      });
    } catch (err) {
      console.warn('Could not delete donation in Firestore:', err);
    }
  },

  addEvent: (eventData) => {
    const newEvent: Event = { ...eventData, id: uuidv4(), attendeesCount: 0, status: 'Upcoming' };
    const updated = [newEvent, ...get().events];
    set({ events: updated });
    saveToLocalStorage({ ...get(), events: updated });
  },

  updateEvent: (id, eventUpdate) => {
    const updated = get().events.map(e => e.id === id ? { ...e, ...eventUpdate } : e);
    set({ events: updated });
    saveToLocalStorage({ ...get(), events: updated });
  },

  deleteEvent: (id) => {
    const updated = get().events.filter(e => e.id !== id);
    set({ events: updated });
    saveToLocalStorage({ ...get(), events: updated });
  },

  addNews: (newsData) => {
    const newArticle: News = { ...newsData, id: uuidv4() };
    const updated = [newArticle, ...get().news];
    set({ news: updated });
    saveToLocalStorage({ ...get(), news: updated });
  },

  updateNews: (id, newsUpdate) => {
    const updated = get().news.map(n => n.id === id ? { ...n, ...newsUpdate } : n);
    set({ news: updated });
    saveToLocalStorage({ ...get(), news: updated });
  },

  deleteNews: (id) => {
    const updated = get().news.filter(n => n.id !== id);
    set({ news: updated });
    saveToLocalStorage({ ...get(), news: updated });
  },

  addMessage: (msgData) => {
    const newMsg: ContactMessage = {
      ...msgData,
      id: uuidv4(),
      isRead: false,
      createdAt: new Date().toISOString()
    };
    const updated = [newMsg, ...get().messages];
    set({ messages: updated });
    saveToLocalStorage({ ...get(), messages: updated });
  },

  markMessageRead: (id) => {
    const updated = get().messages.map(m => m.id === id ? { ...m, isRead: true } : m);
    set({ messages: updated });
    saveToLocalStorage({ ...get(), messages: updated });
  },

  deleteMessage: (id) => {
    const updated = get().messages.filter(m => m.id !== id);
    set({ messages: updated });
    saveToLocalStorage({ ...get(), messages: updated });
  },

  addDocument: (docData) => {
    const newDoc: TransparencyDoc = {
      ...docData,
      id: uuidv4(),
      uploadedAt: new Date().toISOString().split('T')[0]
    };
    const updated = [newDoc, ...get().documents];
    set({ documents: updated });
    saveToLocalStorage({ ...get(), documents: updated });
  },

  updateDocument: (id, docUpdate) => {
    const updated = get().documents.map(d => d.id === id ? { ...d, ...docUpdate } : d);
    set({ documents: updated });
    saveToLocalStorage({ ...get(), documents: updated });
  },

  deleteDocument: (id) => {
    const updated = get().documents.filter(d => d.id !== id);
    set({ documents: updated });
    saveToLocalStorage({ ...get(), documents: updated });
  },

  updateStats: (newStats) => {
    const updated = { ...get().stats, ...newStats };
    set({ stats: updated });
    saveToLocalStorage({ ...get(), stats: updated });
  }
}));

// Real-time synchronization across devices (Cloud Firestore) and tabs (Storage Event)
export const initDonationsSync = () => {
  if (typeof window === 'undefined') return;

  // 1. Cross-tab immediate sync via storage events
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        const updates: Partial<NgoState> = {};
        if (parsed.donations) updates.donations = parsed.donations;
        if (parsed.campaigns) updates.campaigns = parsed.campaigns;
        if (Object.keys(updates).length > 0) {
          useNgoStore.setState(updates);
        }
      } catch (e) {
        // Non-fatal
      }
    }
  });

  // 2. Cloud Firestore real-time listener for multi-device sync
  try {
    onSnapshot(collection(db, 'donations'), (snapshot) => {
      if (!snapshot.empty) {
        const cloudDonations: Donation[] = [];
        snapshot.forEach(docSnap => {
          cloudDonations.push(docSnap.data() as Donation);
        });

        const currentLocal = useNgoStore.getState().donations;
        const donationMap = new Map<string, Donation>();
        currentLocal.forEach(d => donationMap.set(d.id, d));
        cloudDonations.forEach(d => donationMap.set(d.id, d));

        const merged = Array.from(donationMap.values()).sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        useNgoStore.setState({ donations: merged });
        saveToLocalStorage({ ...useNgoStore.getState(), donations: merged });
      }
    }, (err) => {
      console.warn('Firestore donation sync channel notice:', err.message);
    });
  } catch (err) {
    console.warn('Cloud sync initialization notice:', err);
  }
};

// Automatically start sync
initDonationsSync();
