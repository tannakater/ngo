import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../lib/firebase';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { isQuotaExhausted, recordQuotaExhausted } from '../lib/quotaManager';
import { 
  markIdDeleted, 
  isIdDeleted, 
  filterNonDeleted, 
  isStoreInitialized, 
  setStoreInitialized,
  propagateRecordDeletion 
} from '../lib/tombstones';

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
  smsSent?: boolean;
  smsSentAt?: string;
  smsMessage?: string;
  emailSent?: boolean;
  emailSentAt?: string;
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
  approveDonation: (id: string, officer: { name: string; role: string }) => Promise<Donation | null>;
  deleteDonation: (id: string) => Promise<void>;
  addMessage: (message: Omit<ContactMessage, 'id' | 'isRead' | 'createdAt'>) => Promise<void>;
  markMessageRead: (id: string) => Promise<void>;
  deleteMessage: (id: string) => Promise<void>;
  addDocument: (doc: Omit<TransparencyDoc, 'id' | 'uploadedAt'>) => Promise<void>;
  updateDocument: (id: string, doc: Partial<TransparencyDoc>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  updateStats: (stats: Partial<NgoState['stats']>) => Promise<void>;
}

// Default Seed Data
const defaultProjects: Project[] = [
  {
    id: 'proj-flood-relief',
    title: 'Emergency Flood Relief & Rehabilitation',
    category: 'Disaster Relief',
    description: 'Providing dry food rations, clean water purification kits, and emergency medical aid to flood-affected communities.',
    coverImage: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?q=80&w=1200&auto=format&fit=crop',
    location: 'Feni, Sylhet & Noakhali',
    progress: 78,
    status: 'Active',
    budget: 500000
  },
  {
    id: 'proj-winter-warmth',
    title: 'Winter Warmth & Blanket Distribution',
    category: 'Community Welfare',
    description: 'Distributing warm wool blankets, thermal clothing, and sweaters to underprivileged children and elder citizens.',
    coverImage: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1200&auto=format&fit=crop',
    location: 'Northern Districts & Kurigram',
    progress: 92,
    status: 'Active',
    budget: 300000
  },
  {
    id: 'proj-clean-water',
    title: 'Safe Drinking Water Deep Tube-Wells',
    category: 'Healthcare & Water',
    description: 'Installing deep freshwater tube-wells in arsenic and saline-affected coastal rural belts.',
    coverImage: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?q=80&w=1200&auto=format&fit=crop',
    location: 'Satkhira & Khulna Coastal Belt',
    progress: 100,
    status: 'Completed',
    budget: 450000
  },
  {
    id: 'proj-education-orphan',
    title: 'Orphan & Underprivileged Child Education',
    category: 'Education',
    description: 'Providing monthly school stipends, educational supplies, books, and uniforms to disadvantaged pupils.',
    coverImage: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1200&auto=format&fit=crop',
    location: 'Dhaka & Chittagong Slums',
    progress: 65,
    status: 'Active',
    budget: 250000
  }
];

const defaultCampaigns: Campaign[] = [
  {
    id: 'camp-flood-2026',
    name: 'Emergency Flood Relief Fund 2026',
    description: 'Emergency food baskets, medicine, and makeshift shelter support for stranded families.',
    goalAmount: 500000,
    currentAmount: 385000,
    donorsCount: 48,
    coverImage: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?q=80&w=1200&auto=format&fit=crop',
    status: 'Active',
    category: 'Emergency Relief'
  },
  {
    id: 'camp-winter-warmth',
    name: 'Winter Warmth Drive for Cold-Hit Families',
    description: 'High-grade blankets and thermal jackets for vulnerable rural communities.',
    goalAmount: 300000,
    currentAmount: 240000,
    donorsCount: 36,
    coverImage: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1200&auto=format&fit=crop',
    status: 'Active',
    category: 'Community Welfare'
  },
  {
    id: 'camp-safe-water',
    name: 'Clean Water Wells in Coastal Saline Areas',
    description: 'Permanent deep-aquifer tube wells providing arsenic-free water to 1,200+ villagers.',
    goalAmount: 450000,
    currentAmount: 450000,
    donorsCount: 52,
    coverImage: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?q=80&w=1200&auto=format&fit=crop',
    status: 'Completed',
    category: 'Healthcare & Water'
  }
];

const defaultDonations: Donation[] = [
  {
    id: 'don-1',
    receiptNumber: 'REC-2026-849102',
    donorName: 'Farhan Rahman',
    donorEmail: 'farhan.r@example.com',
    donorPhone: '+880 1711-234567',
    amount: 15000,
    currency: 'BDT',
    frequency: 'one-time',
    transactionId: 'TXN-BKASH-89214',
    campaignId: 'camp-flood-2026',
    campaignName: 'Emergency Flood Relief Fund 2026',
    paymentMethod: 'mobile',
    status: 'Completed',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    approvedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    approvedBy: 'Admin Team',
    approverRole: 'Finance Director',
    receiptSent: true,
    smsSent: true
  },
  {
    id: 'don-2',
    receiptNumber: 'REC-2026-382910',
    donorName: 'Nusrat Jahan',
    donorEmail: 'nusrat.j@example.com',
    amount: 25000,
    currency: 'BDT',
    frequency: 'one-time',
    transactionId: 'TXN-NAGAD-44102',
    campaignId: 'camp-winter-warmth',
    campaignName: 'Winter Warmth Drive for Cold-Hit Families',
    paymentMethod: 'mobile',
    status: 'Completed',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    approvedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    approvedBy: 'Admin Team',
    approverRole: 'Finance Director',
    receiptSent: true
  },
  {
    id: 'don-3',
    receiptNumber: 'REC-2026-992014',
    donorName: 'Tariqul Islam',
    donorEmail: 'tariqul@example.com',
    amount: 50000,
    currency: 'BDT',
    frequency: 'monthly',
    transactionId: 'TXN-BANK-10293',
    campaignId: 'camp-safe-water',
    campaignName: 'Clean Water Wells in Coastal Saline Areas',
    paymentMethod: 'bank',
    status: 'Completed',
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    approvedAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    approvedBy: 'Admin Team',
    approverRole: 'Executive Officer',
    receiptSent: true
  },
  {
    id: 'don-4',
    receiptNumber: 'REC-2026-110293',
    donorName: 'Anonymous Supporter',
    donorEmail: 'supporter@gmail.com',
    amount: 5000,
    currency: 'BDT',
    isAnonymous: true,
    campaignId: 'camp-flood-2026',
    campaignName: 'Emergency Flood Relief Fund 2026',
    paymentMethod: 'mobile',
    status: 'Completed',
    createdAt: new Date().toISOString(),
    approvedAt: new Date().toISOString(),
    approvedBy: 'Admin Team',
    approverRole: 'Duty Officer'
  }
];

const defaultVolunteers: Volunteer[] = [
  {
    id: 'vol-1',
    volunteerId: 'VOL-2026-001',
    name: 'Tanvir Hossain',
    email: 'tanvir.h@example.com',
    phone: '+880 1819-876543',
    department: 'Disaster Response',
    status: 'Active'
  },
  {
    id: 'vol-2',
    volunteerId: 'VOL-2026-002',
    name: 'Sabrina Akter',
    email: 'sabrina.a@example.com',
    phone: '+880 1712-345678',
    department: 'Medical & First Aid',
    status: 'Active'
  },
  {
    id: 'vol-3',
    volunteerId: 'VOL-2026-003',
    name: 'Mehedi Hasan',
    email: 'mehedi.h@example.com',
    phone: '+880 1913-987654',
    department: 'Logistics & Warehouse',
    status: 'Active'
  }
];

const defaultEvents: Event[] = [
  {
    id: 'ev-1',
    title: 'Annual Winter Warmth Distribution Gala',
    date: '2026-11-15',
    time: '10:00 AM',
    location: 'District Community Auditorium, Kurigram',
    description: 'Distributing warm clothing to 1,500 families.',
    coverImage: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1200&auto=format&fit=crop',
    category: 'Relief Drive',
    attendeesCount: 240,
    status: 'Upcoming'
  }
];

const defaultNews: News[] = [
  {
    id: 'news-1',
    title: 'DakSeba Foundation Deploys Emergency Relief Teams to Flood Zones',
    excerpt: 'Over 3,500 food relief packs and freshwater jerrycans delivered directly to marooned households.',
    content: 'Our field volunteers reached remote char areas with motorboats, providing immediate sustenance and emergency medical aid.',
    date: '2026-09-15',
    coverImage: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?q=80&w=1200&auto=format&fit=crop',
    author: 'Field Communications Unit',
    category: 'Field Operations',
    status: 'Published'
  }
];

const defaultDocuments: TransparencyDoc[] = [
  {
    id: 'doc-audit-2025',
    title: 'Annual Financial Audit Report FY 2024-2025',
    category: 'Financial Audit',
    year: '2025',
    fileSize: '3.4 MB',
    fileUrl: '#',
    description: 'Statutory audit conducted by chartered accountants verifying 100% fund disbursement.',
    uploadedAt: '2025-12-31'
  },
  {
    id: 'doc-ngo-bylaws',
    title: 'Constitution & Operational Bylaws',
    category: 'Governance & Bylaws',
    year: '2026',
    fileSize: '1.8 MB',
    fileUrl: '#',
    description: 'Official organizational constitution registered with the Government NGO Affairs Bureau.',
    uploadedAt: '2026-01-10'
  }
];

const defaultStats = {
  peopleHelped: "45,000+",
  volunteers: "1,250+",
  projectsCompleted: "38",
  fundsRaised: "1,850,000 BDT",
};

// ==========================================
// CLIENT-SIDE DATA INTEGRITY VALIDATION ENGINE
// ==========================================

export function validateProjectRecord(item: any): Project | null {
  if (!item || typeof item !== 'object') return null;
  const rawId = item.id ? String(item.id).trim() : '';
  if (!rawId || isIdDeleted(rawId)) return null;

  const title = typeof item.title === 'string' && item.title.trim().length > 0
    ? item.title.trim()
    : 'Untitled Program';

  const progress = typeof item.progress === 'number'
    ? Math.max(0, Math.min(100, item.progress))
    : (Number(item.progress) >= 0 ? Math.max(0, Math.min(100, Number(item.progress))) : 0);

  const budget = typeof item.budget === 'number'
    ? Math.max(0, item.budget)
    : (Number(item.budget) >= 0 ? Number(item.budget) : 0);

  const status: 'Active' | 'Completed' | 'Draft' =
    item.status === 'Completed' || item.status === 'Draft' ? item.status : 'Active';

  return {
    id: rawId,
    title,
    category: item.category ? String(item.category).trim() : undefined,
    description: typeof item.description === 'string' ? item.description : '',
    coverImage: typeof item.coverImage === 'string' ? item.coverImage : '',
    location: typeof item.location === 'string' ? item.location : 'Bangladesh',
    progress,
    status,
    budget,
  };
}

export function validateCampaignRecord(item: any): Campaign | null {
  if (!item || typeof item !== 'object') return null;
  const rawId = item.id ? String(item.id).trim() : '';
  if (!rawId || isIdDeleted(rawId)) return null;

  const name = typeof item.name === 'string' && item.name.trim().length > 0
    ? item.name.trim()
    : 'Untitled Campaign';

  const goalAmount = typeof item.goalAmount === 'number'
    ? Math.max(0, item.goalAmount)
    : (Number(item.goalAmount) >= 0 ? Number(item.goalAmount) : 0);

  const currentAmount = typeof item.currentAmount === 'number'
    ? Math.max(0, item.currentAmount)
    : (Number(item.currentAmount) >= 0 ? Number(item.currentAmount) : 0);

  const donorsCount = typeof item.donorsCount === 'number'
    ? Math.max(0, Math.floor(item.donorsCount))
    : (Number(item.donorsCount) >= 0 ? Math.max(0, Math.floor(Number(item.donorsCount))) : 0);

  const status: 'Active' | 'Completed' | 'Paused' =
    item.status === 'Completed' || item.status === 'Paused' ? item.status : 'Active';

  return {
    id: rawId,
    name,
    description: typeof item.description === 'string' ? item.description : '',
    goalAmount,
    currentAmount,
    coverImage: typeof item.coverImage === 'string' ? item.coverImage : '',
    status,
    category: item.category ? String(item.category).trim() : undefined,
    donorsCount,
  };
}

export function validateVolunteerRecord(item: any): Volunteer | null {
  if (!item || typeof item !== 'object') return null;
  const rawId = item.id ? String(item.id).trim() : '';
  const rawVolId = item.volunteerId ? String(item.volunteerId).trim() : '';
  if (!rawId || isIdDeleted(rawId) || (rawVolId && isIdDeleted(rawVolId))) return null;

  const name = typeof item.name === 'string' && item.name.trim().length > 0
    ? item.name.trim()
    : 'Anonymous Volunteer';

  const status: 'Active' | 'Pending' | 'Suspended' =
    item.status === 'Pending' || item.status === 'Suspended' ? item.status : 'Active';

  return {
    id: rawId,
    volunteerId: rawVolId || rawId,
    name,
    email: typeof item.email === 'string' ? item.email.trim() : '',
    phone: typeof item.phone === 'string' ? item.phone.trim() : '',
    department: typeof item.department === 'string' ? item.department.trim() : 'General Support',
    status,
  };
}

export function validateEventRecord(item: any): Event | null {
  if (!item || typeof item !== 'object') return null;
  const rawId = item.id ? String(item.id).trim() : '';
  if (!rawId || isIdDeleted(rawId)) return null;

  const title = typeof item.title === 'string' && item.title.trim().length > 0
    ? item.title.trim()
    : 'Untitled Event';

  const status: 'Upcoming' | 'Completed' | 'Cancelled' =
    item.status === 'Completed' || item.status === 'Cancelled' ? item.status : 'Upcoming';

  return {
    id: rawId,
    title,
    date: typeof item.date === 'string' && item.date.trim().length > 0 ? item.date.trim() : new Date().toISOString().split('T')[0],
    time: item.time ? String(item.time).trim() : undefined,
    location: typeof item.location === 'string' ? item.location.trim() : 'Bangladesh',
    description: item.description ? String(item.description) : undefined,
    coverImage: typeof item.coverImage === 'string' ? item.coverImage : '',
    category: item.category ? String(item.category).trim() : undefined,
    attendeesCount: typeof item.attendeesCount === 'number' ? Math.max(0, item.attendeesCount) : 0,
    status,
  };
}

export function validateNewsRecord(item: any): News | null {
  if (!item || typeof item !== 'object') return null;
  const rawId = item.id ? String(item.id).trim() : '';
  if (!rawId || isIdDeleted(rawId)) return null;

  const title = typeof item.title === 'string' && item.title.trim().length > 0
    ? item.title.trim()
    : 'Community Update';

  const status: 'Published' | 'Draft' = item.status === 'Draft' ? 'Draft' : 'Published';

  return {
    id: rawId,
    title,
    excerpt: typeof item.excerpt === 'string' ? item.excerpt.trim() : '',
    content: item.content ? String(item.content) : undefined,
    date: typeof item.date === 'string' && item.date.trim().length > 0 ? item.date.trim() : new Date().toISOString().split('T')[0],
    coverImage: typeof item.coverImage === 'string' ? item.coverImage : '',
    author: item.author ? String(item.author).trim() : 'DakSheba Press',
    category: item.category ? String(item.category).trim() : undefined,
    status,
  };
}

export function validateDonationRecord(item: any): Donation | null {
  if (!item || typeof item !== 'object') return null;
  const rawId = item.id ? String(item.id).trim() : '';
  if (!rawId || isIdDeleted(rawId)) return null;

  const amount = typeof item.amount === 'number'
    ? Math.max(0, item.amount)
    : (Number(item.amount) >= 0 ? Number(item.amount) : 0);

  const status: 'Completed' | 'Pending' | 'Failed' =
    item.status === 'Completed' || item.status === 'Failed' ? item.status : 'Pending';

  const paymentMethod: 'card' | 'bank' | 'mobile' | 'cash' =
    item.paymentMethod === 'bank' || item.paymentMethod === 'mobile' || item.paymentMethod === 'cash'
      ? item.paymentMethod
      : 'card';

  return {
    id: rawId,
    receiptNumber: typeof item.receiptNumber === 'string' && item.receiptNumber.trim().length > 0
      ? item.receiptNumber.trim()
      : `REC-${Date.now()}`,
    donorName: typeof item.donorName === 'string' && item.donorName.trim().length > 0
      ? item.donorName.trim()
      : 'Anonymous Donor',
    donorEmail: typeof item.donorEmail === 'string' ? item.donorEmail.trim() : '',
    donorPhone: item.donorPhone ? String(item.donorPhone).trim() : undefined,
    amount,
    currency: item.currency || 'BDT',
    frequency: item.frequency === 'monthly' ? 'monthly' : 'one-time',
    transactionId: item.transactionId ? String(item.transactionId).trim() : undefined,
    isAnonymous: Boolean(item.isAnonymous),
    dedication: item.dedication ? String(item.dedication).trim() : undefined,
    campaignId: typeof item.campaignId === 'string' ? item.campaignId.trim() : '',
    campaignName: typeof item.campaignName === 'string' ? item.campaignName.trim() : 'General Fund',
    paymentMethod,
    status,
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
    approvedAt: item.approvedAt ? String(item.approvedAt) : undefined,
    approvedBy: item.approvedBy ? String(item.approvedBy) : undefined,
    approverRole: item.approverRole ? String(item.approverRole) : undefined,
    receiptSent: Boolean(item.receiptSent),
    receiptSentAt: item.receiptSentAt ? String(item.receiptSentAt) : undefined,
    smsSent: Boolean(item.smsSent),
    smsSentAt: item.smsSentAt ? String(item.smsSentAt) : undefined,
    smsMessage: item.smsMessage ? String(item.smsMessage) : undefined,
    emailSent: Boolean(item.emailSent),
    emailSentAt: item.emailSentAt ? String(item.emailSentAt) : undefined,
  };
}

export function validateMessageRecord(item: any): ContactMessage | null {
  if (!item || typeof item !== 'object') return null;
  const rawId = item.id ? String(item.id).trim() : '';
  if (!rawId || isIdDeleted(rawId)) return null;

  return {
    id: rawId,
    name: typeof item.name === 'string' ? item.name.trim() : 'Anonymous',
    email: typeof item.email === 'string' ? item.email.trim() : '',
    phone: item.phone ? String(item.phone).trim() : undefined,
    subject: typeof item.subject === 'string' ? item.subject.trim() : 'No Subject',
    message: typeof item.message === 'string' ? item.message.trim() : '',
    isRead: Boolean(item.isRead),
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
  };
}

export function validateDocumentRecord(item: any): TransparencyDoc | null {
  if (!item || typeof item !== 'object') return null;
  const rawId = item.id ? String(item.id).trim() : '';
  if (!rawId || isIdDeleted(rawId)) return null;

  const category: TransparencyDoc['category'] =
    item.category === 'Financial Audit' || item.category === 'Tax Exemption' || item.category === 'Governance & Bylaws'
      ? item.category
      : 'Annual Report';

  return {
    id: rawId,
    title: typeof item.title === 'string' ? item.title.trim() : 'Official Document',
    category,
    year: typeof item.year === 'string' ? item.year.trim() : `${new Date().getFullYear()}`,
    fileSize: typeof item.fileSize === 'string' ? item.fileSize.trim() : '1.0 MB',
    fileUrl: typeof item.fileUrl === 'string' ? item.fileUrl.trim() : '#',
    description: item.description ? String(item.description) : undefined,
    uploadedAt: typeof item.uploadedAt === 'string' ? item.uploadedAt : new Date().toISOString().split('T')[0],
  };
}

/**
 * Validates a list of records:
 * 1. Strictly filters out any deleted records (tombstones).
 * 2. Applies individual entity structure validation.
 * 3. Deduplicates records by unique ID to prevent multi-source duplicates or ghost states.
 */
export function validateCollectionIntegrity<T extends { id: string }>(
  items: any[],
  validator: (item: any) => T | null
): T[] {
  if (!Array.isArray(items)) return [];
  const map = new Map<string, T>();

  for (const raw of items) {
    if (!raw) continue;
    const rawId = raw.id ? String(raw.id).trim() : '';
    if (!rawId || isIdDeleted(rawId)) {
      continue;
    }
    const validated = validator(raw);
    if (validated && validated.id && !isIdDeleted(validated.id)) {
      if (!map.has(validated.id)) {
        map.set(validated.id, validated);
      }
    }
  }

  return Array.from(map.values());
}

/**
 * Master client-side data integrity check before updating the store and UI.
 * Verifies that any incoming partial state strictly adheres to integrity constraints,
 * disallows resurrection of deleted records, and prevents reversion to obsolete states.
 */
export function validateNgoDataIntegrity(
  partial: Partial<NgoState>,
  _currentState?: NgoState
): Partial<NgoState> {
  const result: Partial<NgoState> = { ...partial };

  if (Array.isArray(result.projects)) {
    result.projects = validateCollectionIntegrity(result.projects, validateProjectRecord);
  }
  if (Array.isArray(result.campaigns)) {
    result.campaigns = validateCollectionIntegrity(result.campaigns, validateCampaignRecord);
  }
  if (Array.isArray(result.volunteers)) {
    result.volunteers = validateCollectionIntegrity(result.volunteers, validateVolunteerRecord);
  }
  if (Array.isArray(result.events)) {
    result.events = validateCollectionIntegrity(result.events, validateEventRecord);
  }
  if (Array.isArray(result.news)) {
    result.news = validateCollectionIntegrity(result.news, validateNewsRecord);
  }
  if (Array.isArray(result.donations)) {
    result.donations = validateCollectionIntegrity(result.donations, validateDonationRecord);
  }
  if (Array.isArray(result.messages)) {
    result.messages = validateCollectionIntegrity(result.messages, validateMessageRecord);
  }
  if (Array.isArray(result.documents)) {
    result.documents = validateCollectionIntegrity(result.documents, validateDocumentRecord);
  }

  return result;
}

// Local storage helper with historical key recovery & tombstone enforcement
const STORAGE_KEY = 'daksheba_ngo_data';

const loadStoredNgoData = () => {
  try {
    if (typeof window !== 'undefined') {
      const primaryRaw = localStorage.getItem(STORAGE_KEY);
      const isInit = isStoreInitialized('ngo') || !!primaryRaw;

      // Primary canonical storage
      if (primaryRaw) {
        try {
          const parsed = JSON.parse(primaryRaw);
          return {
            projects: validateCollectionIntegrity(
              Array.isArray(parsed.projects) ? parsed.projects : defaultProjects,
              validateProjectRecord
            ),
            campaigns: validateCollectionIntegrity(
              Array.isArray(parsed.campaigns) ? parsed.campaigns : defaultCampaigns,
              validateCampaignRecord
            ),
            volunteers: validateCollectionIntegrity(
              Array.isArray(parsed.volunteers) ? parsed.volunteers : defaultVolunteers,
              validateVolunteerRecord
            ),
            events: validateCollectionIntegrity(
              Array.isArray(parsed.events) ? parsed.events : defaultEvents,
              validateEventRecord
            ),
            news: validateCollectionIntegrity(
              Array.isArray(parsed.news) ? parsed.news : defaultNews,
              validateNewsRecord
            ),
            donations: validateCollectionIntegrity(
              Array.isArray(parsed.donations) ? parsed.donations : defaultDonations,
              validateDonationRecord
            ),
            messages: validateCollectionIntegrity(
              Array.isArray(parsed.messages) ? parsed.messages : [],
              validateMessageRecord
            ),
            documents: validateCollectionIntegrity(
              Array.isArray(parsed.documents) ? parsed.documents : defaultDocuments,
              validateDocumentRecord
            ),
            stats: parsed.stats || defaultStats,
          };
        } catch (e) {}
      }

      // Legacy key fallback if primary storage has never been initialized
      const legacyKeys = [
        'ngo_state_storage_v1',
        'ngo_org_store_data',
        'ngo_org_data',
        'idforge_org_storage_v1'
      ];

      let recoveredProjects: Project[] | null = null;
      let recoveredCampaigns: Campaign[] | null = null;
      let recoveredVolunteers: Volunteer[] | null = null;
      let recoveredEvents: Event[] | null = null;
      let recoveredNews: News[] | null = null;
      let recoveredDonations: Donation[] | null = null;
      let recoveredMessages: ContactMessage[] | null = null;
      let recoveredDocuments: TransparencyDoc[] | null = null;
      let recoveredStats: any = null;

      for (const key of legacyKeys) {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          let parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object' && parsed.state) {
            parsed = parsed.state;
          }
          if (Array.isArray(parsed?.projects) && !recoveredProjects) {
            recoveredProjects = validateCollectionIntegrity(parsed.projects, validateProjectRecord);
          }
          if (Array.isArray(parsed?.campaigns) && !recoveredCampaigns) {
            recoveredCampaigns = validateCollectionIntegrity(parsed.campaigns, validateCampaignRecord);
          }
          if (Array.isArray(parsed?.volunteers) && !recoveredVolunteers) {
            recoveredVolunteers = validateCollectionIntegrity(parsed.volunteers, validateVolunteerRecord);
          }
          if (Array.isArray(parsed?.events) && !recoveredEvents) {
            recoveredEvents = validateCollectionIntegrity(parsed.events, validateEventRecord);
          }
          if (Array.isArray(parsed?.news) && !recoveredNews) {
            recoveredNews = validateCollectionIntegrity(parsed.news, validateNewsRecord);
          }
          if (Array.isArray(parsed?.donations) && !recoveredDonations) {
            recoveredDonations = validateCollectionIntegrity(parsed.donations, validateDonationRecord);
          }
          if (Array.isArray(parsed?.messages) && !recoveredMessages) {
            recoveredMessages = validateCollectionIntegrity(parsed.messages, validateMessageRecord);
          }
          if (Array.isArray(parsed?.documents) && !recoveredDocuments) {
            recoveredDocuments = validateCollectionIntegrity(parsed.documents, validateDocumentRecord);
          }
          if (parsed?.stats && !recoveredStats) {
            recoveredStats = parsed.stats;
          }
        } catch (e) {}
      }

      // Never re-seed default projects/campaigns if the user has initialized or cleared the store
      const projects: Project[] = recoveredProjects !== null
        ? recoveredProjects
        : (isInit ? [] : validateCollectionIntegrity(defaultProjects, validateProjectRecord));

      const campaigns: Campaign[] = recoveredCampaigns !== null
        ? recoveredCampaigns
        : (isInit ? [] : validateCollectionIntegrity(defaultCampaigns, validateCampaignRecord));

      const volunteers: Volunteer[] = recoveredVolunteers !== null
        ? recoveredVolunteers
        : (isInit ? [] : validateCollectionIntegrity(defaultVolunteers, validateVolunteerRecord));

      const events: Event[] = recoveredEvents !== null
        ? recoveredEvents
        : (isInit ? [] : validateCollectionIntegrity(defaultEvents, validateEventRecord));

      const news: News[] = recoveredNews !== null
        ? recoveredNews
        : (isInit ? [] : validateCollectionIntegrity(defaultNews, validateNewsRecord));

      const donations: Donation[] = recoveredDonations !== null
        ? recoveredDonations
        : (isInit ? [] : validateCollectionIntegrity(defaultDonations, validateDonationRecord));

      const documents: TransparencyDoc[] = recoveredDocuments !== null
        ? recoveredDocuments
        : (isInit ? [] : validateCollectionIntegrity(defaultDocuments, validateDocumentRecord));

      return {
        projects,
        campaigns,
        volunteers,
        events,
        news,
        donations,
        messages: (recoveredMessages || []) as ContactMessage[],
        documents,
        stats: recoveredStats || defaultStats,
      };
    }
  } catch (e) {
    console.warn('Failed to parse local stored NGO data:', e);
  }
  return {
    projects: validateCollectionIntegrity(defaultProjects, validateProjectRecord),
    campaigns: validateCollectionIntegrity(defaultCampaigns, validateCampaignRecord),
    volunteers: validateCollectionIntegrity(defaultVolunteers, validateVolunteerRecord),
    events: validateCollectionIntegrity(defaultEvents, validateEventRecord),
    news: validateCollectionIntegrity(defaultNews, validateNewsRecord),
    donations: validateCollectionIntegrity(defaultDonations, validateDonationRecord),
    messages: [] as ContactMessage[],
    documents: validateCollectionIntegrity(defaultDocuments, validateDocumentRecord),
    stats: defaultStats,
  };
};

const saveStoredNgoData = (data: Partial<NgoState>) => {
  try {
    if (typeof window !== 'undefined') {
      setStoreInitialized('ngo');
      const validated = validateNgoDataIntegrity(data);
      const raw = localStorage.getItem(STORAGE_KEY);
      const existing = raw ? JSON.parse(raw) : {};
      const merged = { ...existing, ...validated };
      const serialized = JSON.stringify(merged);
      localStorage.setItem(STORAGE_KEY, serialized);
      localStorage.setItem('ngo_state_storage_v1', serialized);
    }
  } catch (e) {}
};

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

const initialData = loadStoredNgoData();

export const useNgoStore = create<NgoState>((rawSet, get) => {
  const set: typeof rawSet = (partial, replace) => {
    const current = get();
    const next = typeof partial === 'function' ? (partial as any)(current) : partial;
    const validated = validateNgoDataIntegrity(next, current);
    rawSet(validated, replace);
  };

  return {
  userId: null,
  projects: initialData.projects,
  campaigns: initialData.campaigns,
  volunteers: initialData.volunteers,
  events: initialData.events,
  news: initialData.news,
  donations: initialData.donations,
  messages: initialData.messages,
  documents: initialData.documents,
  stats: initialData.stats,

  syncNgoWithUser: async (userId: string) => {
    set({ userId });
    unsubscribers.forEach(u => {
      try { u(); } catch (e) {}
    });
    unsubscribers = [];

    // If quota was already exhausted, operate smoothly in offline mode
    if (isQuotaExhausted()) {
      return;
    }

    const setupCollectionSync = async (colName: string, stateKey: keyof NgoState) => {
      const colRef = collection(db, colName);
      try {
        const unsub = onSnapshot(colRef, (snapshot) => {
          const rawItems: any[] = [];
          snapshot.forEach(d => {
            const data = d.data();
            const id = d.id || data.id;
            rawItems.push({ ...data, id });
          });

          // Validate and filter against tombstones & schema before touching the store or UI
          let validatedItems: any[] = [];
          switch (stateKey) {
            case 'projects':
              validatedItems = validateCollectionIntegrity(rawItems, validateProjectRecord);
              break;
            case 'campaigns':
              validatedItems = validateCollectionIntegrity(rawItems, validateCampaignRecord);
              break;
            case 'volunteers':
              validatedItems = validateCollectionIntegrity(rawItems, validateVolunteerRecord);
              break;
            case 'events':
              validatedItems = validateCollectionIntegrity(rawItems, validateEventRecord);
              break;
            case 'news':
              validatedItems = validateCollectionIntegrity(rawItems, validateNewsRecord);
              break;
            case 'donations':
              validatedItems = validateCollectionIntegrity(rawItems, validateDonationRecord);
              break;
            case 'messages':
              validatedItems = validateCollectionIntegrity(rawItems, validateMessageRecord);
              break;
            case 'documents':
              validatedItems = validateCollectionIntegrity(rawItems, validateDocumentRecord);
              break;
            default:
              validatedItems = filterNonDeleted(rawItems);
          }

          // Update state and persistence (reflects deletions as well)
          set({ [stateKey]: validatedItems } as any);
          saveStoredNgoData({ [stateKey]: validatedItems } as any);
        }, (err) => {
          if (recordQuotaExhausted(err)) {
            // Unsubscribe all active listeners immediately to prevent error cascade
            unsubscribers.forEach(u => {
              try { u(); } catch (e) {}
            });
            unsubscribers = [];
          } else {
            console.warn(`Snapshot listener notice for ${colName}:`, err?.message);
          }
        });
        unsubscribers.push(unsub);
      } catch (e: any) {
        recordQuotaExhausted(e);
      }
    };

    try {
      await setupCollectionSync('projects', 'projects');
      await setupCollectionSync('campaigns', 'campaigns');
      await setupCollectionSync('volunteers', 'volunteers');
      await setupCollectionSync('events', 'events');
      await setupCollectionSync('news', 'news');
      await setupCollectionSync('donations', 'donations');
      await setupCollectionSync('messages', 'messages');
      await setupCollectionSync('documents', 'documents');

      // Stats doc with full error callback
      const statsRef = doc(db, 'app_stats', 'main');
      try {
        const statsSnap = await getDocs(collection(db, 'app_stats'));
        if (statsSnap.empty) {
          await setDoc(statsRef, sanitizeForFirestore(get().stats));
        }
      } catch (e: any) {
        recordQuotaExhausted(e);
      }

      const unsubStats = onSnapshot(statsRef, (docSnap) => {
        if (docSnap.exists()) {
          const statsData = docSnap.data() as any;
          set({ stats: statsData });
          saveStoredNgoData({ stats: statsData });
        }
      }, (err) => {
        recordQuotaExhausted(err);
      });
      unsubscribers.push(unsubStats);
    } catch (e: any) {
      recordQuotaExhausted(e);
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
    const validated = validateProjectRecord(newProject);
    if (!validated) return;
    const updated = [validated, ...get().projects];
    set({ projects: updated });
    saveStoredNgoData({ projects: updated });
    if (!isQuotaExhausted()) {
      try {
        await setDoc(doc(db, 'projects', id), sanitizeForFirestore(validated));
      } catch (e: any) {
        recordQuotaExhausted(e);
      }
    }
  },
  updateProject: async (id, projectUpdate) => {
    if (isIdDeleted(id)) return;
    const updated = get().projects.map(p => p.id === id ? { ...p, ...projectUpdate } : p);
    set({ projects: updated });
    saveStoredNgoData({ projects: updated });
    if (!isQuotaExhausted()) {
      try {
        const proj = updated.find(p => p.id === id);
        if (proj) {
          await updateDoc(doc(db, 'projects', id), sanitizeForFirestore(proj) as any);
        }
      } catch (e: any) {
        recordQuotaExhausted(e);
      }
    }
  },
  deleteProject: async (id) => {
    propagateRecordDeletion(id, 'project');
    const updated = get().projects.filter(p => p.id !== id && !isIdDeleted(p.id));
    set({ projects: updated });
    saveStoredNgoData({ projects: updated });
    if (!isQuotaExhausted()) {
      try {
        await deleteDoc(doc(db, 'projects', id));
      } catch (e: any) {
        recordQuotaExhausted(e);
      }
    }
  },

  addCampaign: async (campaignData) => {
    const id = uuidv4();
    const newCampaign: Campaign = { ...campaignData, id, donorsCount: 0 };
    const validated = validateCampaignRecord(newCampaign);
    if (!validated) return;
    const updated = [validated, ...get().campaigns];
    set({ campaigns: updated });
    saveStoredNgoData({ campaigns: updated });
    if (!isQuotaExhausted()) {
      try {
        await setDoc(doc(db, 'campaigns', id), sanitizeForFirestore(validated));
      } catch (e: any) {
        recordQuotaExhausted(e);
      }
    }
  },
  updateCampaign: async (id, campaignUpdate) => {
    if (isIdDeleted(id)) return;
    const updated = get().campaigns.map(c => c.id === id ? { ...c, ...campaignUpdate } : c);
    set({ campaigns: updated });
    saveStoredNgoData({ campaigns: updated });
    if (!isQuotaExhausted()) {
      try {
        const camp = updated.find(c => c.id === id);
        if (camp) {
          await updateDoc(doc(db, 'campaigns', id), sanitizeForFirestore(camp) as any);
        }
      } catch (e: any) {
        recordQuotaExhausted(e);
      }
    }
  },
  deleteCampaign: async (id) => {
    propagateRecordDeletion(id, 'campaign');
    const updated = get().campaigns.filter(c => c.id !== id && !isIdDeleted(c.id));
    set({ campaigns: updated });
    saveStoredNgoData({ campaigns: updated });
    if (!isQuotaExhausted()) {
      try {
        await deleteDoc(doc(db, 'campaigns', id));
      } catch (e: any) {
        recordQuotaExhausted(e);
      }
    }
  },

  addVolunteer: async (volunteerData) => {
    const id = uuidv4();
    const newVolunteer: Volunteer = { ...volunteerData, id };
    const validated = validateVolunteerRecord(newVolunteer);
    if (!validated) return;
    const updated = [validated, ...get().volunteers];
    set({ volunteers: updated });
    saveStoredNgoData({ volunteers: updated });
    if (!isQuotaExhausted()) {
      try {
        await setDoc(doc(db, 'volunteers', id), sanitizeForFirestore(validated));
      } catch (e: any) {
        recordQuotaExhausted(e);
      }
    }
  },
  updateVolunteer: async (id, volunteerUpdate) => {
    if (isIdDeleted(id)) return;
    const updated = get().volunteers.map(v => v.id === id ? { ...v, ...volunteerUpdate } : v);
    set({ volunteers: updated });
    saveStoredNgoData({ volunteers: updated });
    if (!isQuotaExhausted()) {
      try {
        const vol = updated.find(v => v.id === id);
        if (vol) {
          await updateDoc(doc(db, 'volunteers', id), sanitizeForFirestore(vol) as any);
        }
      } catch (e: any) {
        recordQuotaExhausted(e);
      }
    }
  },
  deleteVolunteer: async (id) => {
    propagateRecordDeletion(id, 'volunteer');
    const updated = get().volunteers.filter(v => v.id !== id && !isIdDeleted(v.id));
    set({ volunteers: updated });
    saveStoredNgoData({ volunteers: updated });
    if (!isQuotaExhausted()) {
      try {
        await deleteDoc(doc(db, 'volunteers', id));
      } catch (e: any) {
        recordQuotaExhausted(e);
      }
    }
  },

  addEvent: async (eventData) => {
    const id = uuidv4();
    const newEvent: Event = { ...eventData, id };
    const validated = validateEventRecord(newEvent);
    if (!validated) return;
    const updated = [validated, ...get().events];
    set({ events: updated });
    saveStoredNgoData({ events: updated });
    if (!isQuotaExhausted()) {
      try {
        await setDoc(doc(db, 'events', id), sanitizeForFirestore(validated));
      } catch (e: any) {
        recordQuotaExhausted(e);
      }
    }
  },
  updateEvent: async (id, eventUpdate) => {
    if (isIdDeleted(id)) return;
    const updated = get().events.map(e => e.id === id ? { ...e, ...eventUpdate } : e);
    set({ events: updated });
    saveStoredNgoData({ events: updated });
    if (!isQuotaExhausted()) {
      try {
        const ev = updated.find(e => e.id === id);
        if (ev) {
          await updateDoc(doc(db, 'events', id), sanitizeForFirestore(ev) as any);
        }
      } catch (e: any) {
        recordQuotaExhausted(e);
      }
    }
  },
  deleteEvent: async (id) => {
    propagateRecordDeletion(id, 'event');
    const updated = get().events.filter(e => e.id !== id && !isIdDeleted(e.id));
    set({ events: updated });
    saveStoredNgoData({ events: updated });
    if (!isQuotaExhausted()) {
      try {
        await deleteDoc(doc(db, 'events', id));
      } catch (e: any) {
        recordQuotaExhausted(e);
      }
    }
  },

  addNews: async (newsData) => {
    const id = uuidv4();
    const newNews: News = { ...newsData, id };
    const validated = validateNewsRecord(newNews);
    if (!validated) return;
    const updated = [validated, ...get().news];
    set({ news: updated });
    saveStoredNgoData({ news: updated });
    if (!isQuotaExhausted()) {
      try {
        await setDoc(doc(db, 'news', id), sanitizeForFirestore(validated));
      } catch (e: any) {
        recordQuotaExhausted(e);
      }
    }
  },
  updateNews: async (id, newsUpdate) => {
    if (isIdDeleted(id)) return;
    const updated = get().news.map(n => n.id === id ? { ...n, ...newsUpdate } : n);
    set({ news: updated });
    saveStoredNgoData({ news: updated });
    if (!isQuotaExhausted()) {
      try {
        const item = updated.find(n => n.id === id);
        if (item) {
          await updateDoc(doc(db, 'news', id), sanitizeForFirestore(item) as any);
        }
      } catch (e: any) {
        recordQuotaExhausted(e);
      }
    }
  },
  deleteNews: async (id) => {
    propagateRecordDeletion(id, 'news');
    const updated = get().news.filter(n => n.id !== id && !isIdDeleted(n.id));
    set({ news: updated });
    saveStoredNgoData({ news: updated });
    if (!isQuotaExhausted()) {
      try {
        await deleteDoc(doc(db, 'news', id));
      } catch (e: any) {
        recordQuotaExhausted(e);
      }
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
    const validated = validateDonationRecord(newDonation);
    if (!validated) return newDonation;
    const updated = [validated, ...get().donations];
    set({ donations: updated });
    saveStoredNgoData({ donations: updated });
    if (!isQuotaExhausted()) {
      try {
        await setDoc(doc(db, 'donations', id), sanitizeForFirestore(validated));
      } catch (e: any) {
        recordQuotaExhausted(e);
      }
    }
    return validated;
  },
  updateDonation: async (id, donationUpdate) => {
    if (isIdDeleted(id)) return;
    const updated = get().donations.map(d => d.id === id ? { ...d, ...donationUpdate } : d);
    set({ donations: updated });
    saveStoredNgoData({ donations: updated });
    if (!isQuotaExhausted()) {
      try {
        const don = updated.find(d => d.id === id);
        if (don) {
          await updateDoc(doc(db, 'donations', id), sanitizeForFirestore(don) as any);
        }
      } catch (e: any) {
        recordQuotaExhausted(e);
      }
    }
  },
  approveDonation: async (id, officer) => {
    if (isIdDeleted(id)) return null;
    const don = get().donations.find(d => d.id === id);
    if (!don) return null;
    const updatedDon: Donation = {
      ...don,
      status: 'Completed',
      approvedBy: officer.name,
      approverRole: officer.role,
      receiptSent: true,
      receiptSentAt: new Date().toISOString(),
      smsSent: true,
      smsSentAt: new Date().toISOString(),
      smsMessage: `ধন্যবাদ ${don.donorName || 'সুহৃদ'}, ডাকসেবা ফাউন্ডেশনে আপনার অনুদান (${don.amount} ${don.currency || 'BDT'}) সফলভাবে গৃহীত হয়েছে। রসিদ নং: ${don.receiptNumber}`,
      emailSent: true,
      emailSentAt: new Date().toISOString()
    };
    const updated = get().donations.map(d => d.id === id ? updatedDon : d);
    set({ donations: updated });
    saveStoredNgoData({ donations: updated });
    
    // Also update campaign currentAmount if campaign is matched
    const campaign = get().campaigns.find(c => isCampaignMatch(c, updatedDon.campaignId, updatedDon.campaignName));
    if (campaign && !isIdDeleted(campaign.id)) {
      const newCurrent = (campaign.currentAmount || 0) + updatedDon.amount;
      const newDonors = (campaign.donorsCount || 0) + 1;
      const updatedCampaigns = get().campaigns.map(c => c.id === campaign.id ? { ...c, currentAmount: newCurrent, donorsCount: newDonors } : c);
      set({ campaigns: updatedCampaigns });
      saveStoredNgoData({ campaigns: updatedCampaigns });
      
      if (!isQuotaExhausted()) {
        try {
          await updateDoc(doc(db, 'campaigns', campaign.id), {
            currentAmount: newCurrent,
            donorsCount: newDonors
          });
        } catch (e: any) {
          recordQuotaExhausted(e);
        }
      }
    }

    if (!isQuotaExhausted()) {
      try {
        await updateDoc(doc(db, 'donations', id), sanitizeForFirestore(updatedDon) as any);
      } catch (e: any) {
        recordQuotaExhausted(e);
      }
    }
    return updatedDon;
  },
  deleteDonation: async (id) => {
    propagateRecordDeletion(id, 'donation');
    const updated = get().donations.filter(d => d.id !== id && !isIdDeleted(d.id));
    set({ donations: updated });
    saveStoredNgoData({ donations: updated });
    if (!isQuotaExhausted()) {
      try {
        await deleteDoc(doc(db, 'donations', id));
      } catch (e: any) {
        recordQuotaExhausted(e);
      }
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
    const validated = validateMessageRecord(newMsg);
    if (!validated) return;
    const updated = [validated, ...get().messages];
    set({ messages: updated });
    saveStoredNgoData({ messages: updated });
    if (!isQuotaExhausted()) {
      try {
        await setDoc(doc(db, 'messages', id), sanitizeForFirestore(validated));
      } catch (e: any) {
        recordQuotaExhausted(e);
      }
    }
  },
  markMessageRead: async (id) => {
    if (isIdDeleted(id)) return;
    const updated = get().messages.map(m => m.id === id ? { ...m, isRead: true } : m);
    set({ messages: updated });
    saveStoredNgoData({ messages: updated });
    if (!isQuotaExhausted()) {
      try {
        await updateDoc(doc(db, 'messages', id), { isRead: true });
      } catch (e: any) {
        recordQuotaExhausted(e);
      }
    }
  },
  deleteMessage: async (id) => {
    propagateRecordDeletion(id, 'message');
    const updated = get().messages.filter(m => m.id !== id && !isIdDeleted(m.id));
    set({ messages: updated });
    saveStoredNgoData({ messages: updated });
    if (!isQuotaExhausted()) {
      try {
        await deleteDoc(doc(db, 'messages', id));
      } catch (e: any) {
        recordQuotaExhausted(e);
      }
    }
  },

  addDocument: async (docData) => {
    const id = uuidv4();
    const newDoc: TransparencyDoc = {
      ...docData,
      id,
      uploadedAt: new Date().toISOString().split('T')[0]
    };
    const validated = validateDocumentRecord(newDoc);
    if (!validated) return;
    const updated = [validated, ...get().documents];
    set({ documents: updated });
    saveStoredNgoData({ documents: updated });
    if (!isQuotaExhausted()) {
      try {
        await setDoc(doc(db, 'documents', id), sanitizeForFirestore(validated));
      } catch (e: any) {
        recordQuotaExhausted(e);
      }
    }
  },
  updateDocument: async (id, docUpdate) => {
    if (isIdDeleted(id)) return;
    const updated = get().documents.map(d => d.id === id ? { ...d, ...docUpdate } : d);
    set({ documents: updated });
    saveStoredNgoData({ documents: updated });
    if (!isQuotaExhausted()) {
      try {
        const item = updated.find(d => d.id === id);
        if (item) {
          await updateDoc(doc(db, 'documents', id), sanitizeForFirestore(item) as any);
        }
      } catch (e: any) {
        recordQuotaExhausted(e);
      }
    }
  },
  deleteDocument: async (id) => {
    propagateRecordDeletion(id, 'document');
    const updated = get().documents.filter(d => d.id !== id && !isIdDeleted(d.id));
    set({ documents: updated });
    saveStoredNgoData({ documents: updated });
    if (!isQuotaExhausted()) {
      try {
        await deleteDoc(doc(db, 'documents', id));
      } catch (e: any) {
        recordQuotaExhausted(e);
      }
    }
  },

  updateStats: async (newStats) => {
    const updated = { ...get().stats, ...newStats };
    set({ stats: updated });
    saveStoredNgoData({ stats: updated });
    if (!isQuotaExhausted()) {
      try {
        await setDoc(doc(db, 'app_stats', 'main'), sanitizeForFirestore(updated), { merge: true });
      } catch (e: any) {
        recordQuotaExhausted(e);
      }
    }
  }
  };
});

// Attach runtime interceptor to useNgoStore.setState to prevent external mutations from bypassing validation
const originalSetState = useNgoStore.setState;
useNgoStore.setState = (partial: any, replace?: any) => {
  const current = useNgoStore.getState();
  const next = typeof partial === 'function' ? partial(current) : partial;
  const validated = validateNgoDataIntegrity(next, current);
  return originalSetState(validated, replace);
};

// Cross-app reactive deletion listener: updates store state and UI immediately when any record is deleted
if (typeof window !== 'undefined') {
  const handleRecordDeletion = (event: globalThis.Event) => {
    const customEv = event as unknown as CustomEvent<{ id?: string; ids?: string[]; entityType?: string }>;
    const idsToPurge = new Set<string>();
    if (customEv.detail?.id) idsToPurge.add(customEv.detail.id.trim());
    if (Array.isArray(customEv.detail?.ids)) {
      customEv.detail.ids.forEach(id => id && idsToPurge.add(id.trim()));
    }

    if (idsToPurge.size === 0) return;

    const current = useNgoStore.getState();
    let hasChanges = false;

    const clean = <T extends { id: string }>(list: T[]): T[] => {
      const filtered = list.filter(item => item && item.id && !idsToPurge.has(item.id.trim()) && !isIdDeleted(item.id));
      if (filtered.length !== list.length) hasChanges = true;
      return filtered;
    };

    const nextProjects = clean(current.projects);
    const nextCampaigns = clean(current.campaigns);
    const nextVolunteers = clean(current.volunteers);
    const nextEvents = clean(current.events);
    const nextNews = clean(current.news);
    const nextDonations = clean(current.donations);
    const nextMessages = clean(current.messages);
    const nextDocuments = clean(current.documents);

    if (hasChanges) {
      useNgoStore.setState({
        projects: nextProjects,
        campaigns: nextCampaigns,
        volunteers: nextVolunteers,
        events: nextEvents,
        news: nextNews,
        donations: nextDonations,
        messages: nextMessages,
        documents: nextDocuments,
      });
    }
  };

  window.addEventListener('daksheba-record-deleted', handleRecordDeletion as EventListener);
  window.addEventListener('ngo-record-deleted', handleRecordDeletion as EventListener);

  window.addEventListener('storage', (e) => {
    if (e.key === 'daksheba_deleted_ids') {
      const current = useNgoStore.getState();
      useNgoStore.setState({
        projects: validateCollectionIntegrity(current.projects, validateProjectRecord),
        campaigns: validateCollectionIntegrity(current.campaigns, validateCampaignRecord),
        volunteers: validateCollectionIntegrity(current.volunteers, validateVolunteerRecord),
        events: validateCollectionIntegrity(current.events, validateEventRecord),
        news: validateCollectionIntegrity(current.news, validateNewsRecord),
        donations: validateCollectionIntegrity(current.donations, validateDonationRecord),
        messages: validateCollectionIntegrity(current.messages, validateMessageRecord),
        documents: validateCollectionIntegrity(current.documents, validateDocumentRecord),
      });
    }
  });
}

export const initDonationsSync = () => {};
