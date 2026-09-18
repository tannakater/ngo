import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { db, auth } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { isQuotaExhausted, recordQuotaExhausted } from '../lib/quotaManager';
import { useAuditStore } from './useAuditStore';
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
let supabaseNgoChannel: any = null;

function mapSupabaseCampaign(row: any): Campaign {
  return {
    id: row.id,
    name: row.name || 'Untitled Campaign',
    description: row.description || '',
    goalAmount: Number(row.goal_amount ?? row.goalAmount) || 0,
    currentAmount: Number(row.current_amount ?? row.currentAmount) || 0,
    coverImage: row.cover_image || row.coverImage || '',
    status: (row.status === 'Completed' || row.status === 'Paused') ? row.status : 'Active',
    category: row.category,
    donorsCount: Number(row.donors_count ?? row.donorsCount) || 0,
  };
}

function mapSupabaseProject(row: any): Project {
  return {
    id: row.id,
    title: row.title || 'Untitled Project',
    category: row.category,
    description: row.description || '',
    coverImage: row.cover_image || row.coverImage || '',
    location: row.location || 'Bangladesh',
    progress: Number(row.progress) || 0,
    status: (row.status === 'Completed' || row.status === 'Draft') ? row.status : 'Active',
    budget: Number(row.budget) || 0,
  };
}

function mapSupabaseDonation(row: any): Donation {
  return {
    id: row.id,
    receiptNumber: row.receipt_number || row.receiptNumber,
    donorName: row.donor_name || row.donorName,
    donorEmail: row.donor_email || row.donorEmail,
    donorPhone: row.donor_phone || row.donorPhone,
    amount: Number(row.amount) || 0,
    currency: row.currency || 'BDT',
    frequency: row.frequency || 'one-time',
    transactionId: row.transaction_id || row.transactionId,
    isAnonymous: Boolean(row.is_anonymous ?? row.isAnonymous),
    dedication: row.dedication,
    campaignId: row.campaign_id || row.campaignId,
    campaignName: row.campaign_name || row.campaignName,
    paymentMethod: row.payment_method || row.paymentMethod || 'card',
    status: row.status || 'Pending',
    approvedAt: row.approved_at || row.approvedAt,
    approvedBy: row.approved_by || row.approvedBy,
    approverRole: row.approver_role || row.approverRole,
    receiptSent: Boolean(row.receipt_sent ?? row.receiptSent),
    smsSent: Boolean(row.sms_sent ?? row.smsSent),
    emailSent: Boolean(row.email_sent ?? row.emailSent),
    createdAt: row.created_at || row.createdAt || new Date().toISOString()
  };
}

function mapSupabaseMessage(row: any): ContactMessage {
  return {
    id: row.id,
    name: row.name || '',
    email: row.email || '',
    phone: row.phone,
    subject: row.subject || 'General Inquiry',
    message: row.message || '',
    isRead: Boolean(row.is_read ?? row.isRead),
    createdAt: row.created_at || row.createdAt || new Date().toISOString()
  };
}

const syncNgoWithSupabase = (set: any, get: () => NgoState) => {
  if (!supabase) return;

  // 1. Fetch campaigns from Supabase for instant cross-device sync
  Promise.resolve(supabase.from('campaigns').select('*').order('created_at', { ascending: false })).then(({ data, error }) => {
    if (!error && Array.isArray(data)) {
      const mapped = data.map(mapSupabaseCampaign).filter(c => c && c.id && !isIdDeleted(c.id));
      const current = get().campaigns;
      const campMap = new Map<string, Campaign>();
      current.forEach(c => { if (c && c.id && !isIdDeleted(c.id)) campMap.set(c.id, c); });
      mapped.forEach(c => campMap.set(c.id, { ...campMap.get(c.id), ...c }));
      const merged = Array.from(campMap.values());
      set({ campaigns: merged });
      saveStoredNgoData({ campaigns: merged });
    }
  }).catch(err => console.warn('Supabase fetch campaigns notice:', err));

  // 2. Fetch projects from Supabase
  Promise.resolve(supabase.from('projects').select('*').order('created_at', { ascending: false })).then(({ data, error }) => {
    if (!error && Array.isArray(data)) {
      const mapped = data.map(mapSupabaseProject).filter(p => p && p.id && !isIdDeleted(p.id));
      const current = get().projects;
      const projMap = new Map<string, Project>();
      current.forEach(p => { if (p && p.id && !isIdDeleted(p.id)) projMap.set(p.id, p); });
      mapped.forEach(p => projMap.set(p.id, { ...projMap.get(p.id), ...p }));
      const merged = Array.from(projMap.values());
      set({ projects: merged });
      saveStoredNgoData({ projects: merged });
    }
  }).catch(err => console.warn('Supabase fetch projects notice:', err));

  // 3. Fetch donations
  Promise.resolve(supabase.from('donations').select('*').order('created_at', { ascending: false })).then(({ data, error }) => {
    if (!error && Array.isArray(data)) {
      const mapped = data.map(mapSupabaseDonation).filter(d => d && d.id && !isIdDeleted(d.id));
      const current = get().donations;
      const donMap = new Map<string, Donation>();
      current.forEach(d => { if (d && d.id && !isIdDeleted(d.id)) donMap.set(d.id, d); });
      mapped.forEach(d => donMap.set(d.id, { ...donMap.get(d.id), ...d }));
      const merged = Array.from(donMap.values());
      set({ donations: merged });
      saveStoredNgoData({ donations: merged });
    }
  }).catch(err => console.warn('Supabase fetch donations error:', err));

  // 4. Fetch messages
  Promise.resolve(supabase.from('messages').select('*').order('created_at', { ascending: false })).then(({ data, error }) => {
    if (!error && Array.isArray(data)) {
      const mapped = data.map(mapSupabaseMessage).filter(m => m && m.id && !isIdDeleted(m.id));
      const current = get().messages;
      const msgMap = new Map<string, ContactMessage>();
      current.forEach(m => { if (m && m.id && !isIdDeleted(m.id)) msgMap.set(m.id, m); });
      mapped.forEach(m => msgMap.set(m.id, { ...msgMap.get(m.id), ...m }));
      const merged = Array.from(msgMap.values());
      set({ messages: merged });
      saveStoredNgoData({ messages: merged });
    }
  }).catch(err => console.warn('Supabase fetch messages error:', err));

  // 5. Supabase Realtime Channel for Instant Cross-Device Sync
  if (!supabaseNgoChannel) {
    try {
      supabaseNgoChannel = supabase
        .channel('public:ngo_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns' }, (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const camp = mapSupabaseCampaign(payload.new);
            if (isIdDeleted(camp.id)) return;
            const current = get().campaigns;
            const idx = current.findIndex(c => c.id === camp.id);
            let updated: Campaign[];
            if (idx >= 0) {
              updated = [...current];
              updated[idx] = { ...updated[idx], ...camp };
            } else {
              updated = [camp, ...current];
            }
            set({ campaigns: updated });
            saveStoredNgoData({ campaigns: updated });
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const delId = payload.old.id;
            if (delId) {
              markIdDeleted(delId);
              const updated = get().campaigns.filter(c => c.id !== delId);
              set({ campaigns: updated });
              saveStoredNgoData({ campaigns: updated });
            }
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const proj = mapSupabaseProject(payload.new);
            if (isIdDeleted(proj.id)) return;
            const current = get().projects;
            const idx = current.findIndex(p => p.id === proj.id);
            let updated: Project[];
            if (idx >= 0) {
              updated = [...current];
              updated[idx] = { ...updated[idx], ...proj };
            } else {
              updated = [proj, ...current];
            }
            set({ projects: updated });
            saveStoredNgoData({ projects: updated });
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const delId = payload.old.id;
            if (delId) {
              markIdDeleted(delId);
              const updated = get().projects.filter(p => p.id !== delId);
              set({ projects: updated });
              saveStoredNgoData({ projects: updated });
            }
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const don = mapSupabaseDonation(payload.new);
            if (isIdDeleted(don.id)) return;
            const current = get().donations;
            const idx = current.findIndex(d => d.id === don.id);
            let updated: Donation[];
            if (idx >= 0) {
              updated = [...current];
              updated[idx] = { ...updated[idx], ...don };
            } else {
              updated = [don, ...current];
            }
            set({ donations: updated });
            saveStoredNgoData({ donations: updated });
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const delId = payload.old.id;
            if (delId) {
              markIdDeleted(delId);
              const updated = get().donations.filter(d => d.id !== delId);
              set({ donations: updated });
              saveStoredNgoData({ donations: updated });
            }
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const msg = mapSupabaseMessage(payload.new);
            if (isIdDeleted(msg.id)) return;
            const current = get().messages;
            const idx = current.findIndex(m => m.id === msg.id);
            let updated: ContactMessage[];
            if (idx >= 0) {
              updated = [...current];
              updated[idx] = { ...updated[idx], ...msg };
            } else {
              updated = [msg, ...current];
            }
            set({ messages: updated });
            saveStoredNgoData({ messages: updated });
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const delId = payload.old.id;
            if (delId) {
              markIdDeleted(delId);
              const updated = get().messages.filter(m => m.id !== delId);
              set({ messages: updated });
              saveStoredNgoData({ messages: updated });
            }
          }
        })
        .subscribe();
    } catch (e) {
      console.warn('Supabase Ngo realtime channel error:', e);
    }
  }
};

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

    // Always trigger Supabase sync and realtime listeners
    syncNgoWithSupabase(set, get);

    const setupCollectionSync = async (colName: string, stateKey: keyof NgoState) => {
      const colRef = collection(db, colName);
      try {
        const unsub = onSnapshot(colRef, (snapshot) => {
          const rawItems: any[] = [];
          snapshot.forEach(d => {
            const data = d.data();
            const id = d.id || data.id;
            if (!isIdDeleted(id)) {
              rawItems.push({ ...data, id });
            }
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

          if (snapshot.empty) {
            // If the cloud collection is empty, seed it to Firestore so other devices receive it
            const initialItems = (get()[stateKey] as any[]) || [];
            initialItems.forEach(async item => {
              if (item && item.id) {
                try {
                  await setDoc(doc(db, colName, item.id), sanitizeForFirestore(item), { merge: true });
                } catch (e) {}
              }
            });
          } else {
            // Authoritative remote dataset from Firestore across all devices
            set({ [stateKey]: validatedItems } as any);
            saveStoredNgoData({ [stateKey]: validatedItems } as any);
          }
        }, (err) => {
          if (recordQuotaExhausted(err)) {
            // Unsubscribe active listeners if quota is strictly exhausted
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
        if (statsSnap.empty && auth.currentUser) {
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

    useAuditStore.getState().addLog({
      action: 'Created',
      category: 'Programs',
      entity: 'Field Program',
      entityId: id,
      details: `Created new field program: ${validated.title} [Location: ${validated.location}]`
    });

    if (supabase) {
      Promise.resolve(supabase.from('projects').upsert([{
        id,
        title: validated.title,
        category: validated.category || null,
        description: validated.description || '',
        cover_image: validated.coverImage || '',
        location: validated.location || 'Bangladesh',
        progress: validated.progress || 0,
        status: validated.status || 'Active',
        budget: validated.budget || 0,
      }])).catch(err => console.warn('Supabase project upsert notice:', err));
    }

    try {
      await setDoc(doc(db, 'projects', id), sanitizeForFirestore(validated), { merge: true });
    } catch (e: any) {
      console.warn('Firestore write error for project:', e);
    }
  },
  updateProject: async (id, projectUpdate) => {
    if (isIdDeleted(id)) return;
    const oldProj = get().projects.find(p => p.id === id);
    const updated = get().projects.map(p => p.id === id ? { ...p, ...projectUpdate } : p);
    set({ projects: updated });
    saveStoredNgoData({ projects: updated });

    if (oldProj) {
      useAuditStore.getState().addLog({
        action: 'Updated',
        category: 'Programs',
        entity: 'Field Program',
        entityId: id,
        details: `Updated field program: ${oldProj.title}`
      });
    }

    const proj = updated.find(p => p.id === id);
    if (proj && supabase) {
      Promise.resolve(supabase.from('projects').update({
        title: proj.title,
        category: proj.category || null,
        description: proj.description || '',
        cover_image: proj.coverImage || '',
        location: proj.location || 'Bangladesh',
        progress: proj.progress || 0,
        status: proj.status || 'Active',
        budget: proj.budget || 0,
      }).eq('id', id)).catch(err => console.warn('Supabase project update notice:', err));
    }

    try {
      if (proj) {
        await setDoc(doc(db, 'projects', id), sanitizeForFirestore(proj) as any, { merge: true });
      }
    } catch (e: any) {
      console.warn('Firestore update error for project:', e);
    }
  },
  deleteProject: async (id) => {
    const oldProj = get().projects.find(p => p.id === id);
    propagateRecordDeletion(id, 'project');
    const updated = get().projects.filter(p => p.id !== id && !isIdDeleted(p.id));
    set({ projects: updated });
    saveStoredNgoData({ projects: updated });

    useAuditStore.getState().addLog({
      action: 'Deleted',
      category: 'Programs',
      severity: 'warning',
      entity: 'Field Program',
      entityId: id,
      details: `Removed field program: ${oldProj?.title || id}`
    });

    if (supabase) {
      Promise.resolve(supabase.from('projects').delete().eq('id', id)).catch(() => {});
    }

    try {
      await deleteDoc(doc(db, 'projects', id));
    } catch (e: any) {
      console.warn('Firestore delete error for project:', e);
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

    useAuditStore.getState().addLog({
      action: 'Created',
      category: 'Campaigns',
      entity: 'Campaign',
      entityId: id,
      details: `Launched fundraising campaign: ${validated.name} [Target: ${validated.goalAmount.toLocaleString()} BDT]`
    });

    if (supabase) {
      Promise.resolve(supabase.from('campaigns').upsert([{
        id,
        name: validated.name,
        description: validated.description || '',
        goal_amount: validated.goalAmount || 0,
        current_amount: validated.currentAmount || 0,
        cover_image: validated.coverImage || '',
        status: validated.status || 'Active',
        category: validated.category || null,
        donors_count: validated.donorsCount || 0,
      }])).catch(err => console.warn('Supabase campaign upsert notice:', err));
    }

    try {
      await setDoc(doc(db, 'campaigns', id), sanitizeForFirestore(validated), { merge: true });
    } catch (e: any) {
      console.warn('Firestore write error for campaign:', e);
    }
  },
  updateCampaign: async (id, campaignUpdate) => {
    if (isIdDeleted(id)) return;
    const oldCamp = get().campaigns.find(c => c.id === id);
    const updated = get().campaigns.map(c => c.id === id ? { ...c, ...campaignUpdate } : c);
    set({ campaigns: updated });
    saveStoredNgoData({ campaigns: updated });

    if (oldCamp) {
      useAuditStore.getState().addLog({
        action: 'Updated',
        category: 'Campaigns',
        entity: 'Campaign',
        entityId: id,
        details: `Updated fundraising campaign: ${oldCamp.name}`
      });
    }

    const camp = updated.find(c => c.id === id);
    if (camp && supabase) {
      Promise.resolve(supabase.from('campaigns').update({
        name: camp.name,
        description: camp.description || '',
        goal_amount: camp.goalAmount || 0,
        current_amount: camp.currentAmount || 0,
        cover_image: camp.coverImage || '',
        status: camp.status || 'Active',
        category: camp.category || null,
        donors_count: camp.donorsCount || 0,
      }).eq('id', id)).catch(err => console.warn('Supabase campaign update notice:', err));
    }

    try {
      if (camp) {
        await setDoc(doc(db, 'campaigns', id), sanitizeForFirestore(camp) as any, { merge: true });
      }
    } catch (e: any) {
      console.warn('Firestore update error for campaign:', e);
    }
  },
  deleteCampaign: async (id) => {
    const oldCamp = get().campaigns.find(c => c.id === id);
    propagateRecordDeletion(id, 'campaign');
    const updated = get().campaigns.filter(c => c.id !== id && !isIdDeleted(c.id));
    set({ campaigns: updated });
    saveStoredNgoData({ campaigns: updated });

    useAuditStore.getState().addLog({
      action: 'Deleted',
      category: 'Campaigns',
      severity: 'warning',
      entity: 'Campaign',
      entityId: id,
      details: `Removed fundraising campaign: ${oldCamp?.name || id}`
    });

    if (supabase) {
      Promise.resolve(supabase.from('campaigns').delete().eq('id', id)).catch(() => {});
    }

    try {
      await deleteDoc(doc(db, 'campaigns', id));
    } catch (e: any) {
      console.warn('Firestore delete error for campaign:', e);
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

    useAuditStore.getState().addLog({
      action: 'Created',
      category: 'Volunteers',
      entity: 'Volunteer',
      entityId: id,
      details: `Enrolled volunteer: ${validated.name} (${validated.department}) [ID: ${validated.volunteerId}]`
    });

    if (supabase) {
      const parts = (validated.name || '').trim().split(' ');
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '';
      Promise.resolve(
        supabase.from('public_volunteers').upsert([{
          id,
          member_id: validated.volunteerId || 'DAK-VOL',
          first_name: firstName,
          last_name: lastName,
          email: validated.email || null,
          phone: validated.phone || null,
          role: 'Volunteer',
          designation: 'Volunteer Applicant',
          department: validated.department || 'General Support',
          status: validated.status || 'Pending'
        }])
      ).then(({ error }) => {
        if (error) console.warn('Supabase volunteer upsert:', error.message);
      }).catch(err => console.warn('Supabase volunteer error:', err));
    }

    try {
      await setDoc(doc(db, 'volunteers', id), sanitizeForFirestore(validated), { merge: true });
    } catch (e: any) {
      console.warn('Firestore write error for volunteer:', e);
    }
  },
  updateVolunteer: async (id, volunteerUpdate) => {
    if (isIdDeleted(id)) return;
    const oldVol = get().volunteers.find(v => v.id === id);
    const updated = get().volunteers.map(v => v.id === id ? { ...v, ...volunteerUpdate } : v);
    set({ volunteers: updated });
    saveStoredNgoData({ volunteers: updated });

    if (oldVol) {
      useAuditStore.getState().addLog({
        action: 'Updated',
        category: 'Volunteers',
        entity: 'Volunteer',
        entityId: id,
        details: `Updated volunteer records for: ${oldVol.name} [ID: ${oldVol.volunteerId}]`
      });
    }

    try {
      const vol = updated.find(v => v.id === id);
      if (vol) {
        await setDoc(doc(db, 'volunteers', id), sanitizeForFirestore(vol) as any, { merge: true });
      }
    } catch (e: any) {
      console.warn('Firestore update error for volunteer:', e);
    }
  },
  deleteVolunteer: async (id) => {
    const oldVol = get().volunteers.find(v => v.id === id);
    propagateRecordDeletion(id, 'volunteer');
    const updated = get().volunteers.filter(v => v.id !== id && !isIdDeleted(v.id));
    set({ volunteers: updated });
    saveStoredNgoData({ volunteers: updated });

    if (supabase) {
      Promise.resolve(supabase.from('public_volunteers').delete().eq('id', id)).catch(() => {});
      Promise.resolve(supabase.from('volunteers').delete().eq('id', id)).catch(() => {});
    }

    useAuditStore.getState().addLog({
      action: 'Deleted',
      category: 'Volunteers',
      severity: 'warning',
      entity: 'Volunteer',
      entityId: id,
      details: `Removed volunteer record: ${oldVol?.name || id}`
    });

    try {
      await deleteDoc(doc(db, 'volunteers', id));
    } catch (e: any) {
      console.warn('Firestore delete error for volunteer:', e);
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

    useAuditStore.getState().addLog({
      action: 'Created',
      category: 'Content',
      entity: 'Event',
      entityId: id,
      details: `Scheduled event: ${validated.title} on ${validated.date}`
    });

    try {
      await setDoc(doc(db, 'events', id), sanitizeForFirestore(validated), { merge: true });
    } catch (e: any) {
      console.warn('Firestore write error for event:', e);
    }
  },
  updateEvent: async (id, eventUpdate) => {
    if (isIdDeleted(id)) return;
    const updated = get().events.map(e => e.id === id ? { ...e, ...eventUpdate } : e);
    set({ events: updated });
    saveStoredNgoData({ events: updated });
    try {
      const ev = updated.find(e => e.id === id);
      if (ev) {
        await setDoc(doc(db, 'events', id), sanitizeForFirestore(ev) as any, { merge: true });
      }
    } catch (e: any) {
      console.warn('Firestore update error for event:', e);
    }
  },
  deleteEvent: async (id) => {
    propagateRecordDeletion(id, 'event');
    const updated = get().events.filter(e => e.id !== id && !isIdDeleted(e.id));
    set({ events: updated });
    saveStoredNgoData({ events: updated });
    try {
      await deleteDoc(doc(db, 'events', id));
    } catch (e: any) {
      console.warn('Firestore delete error for event:', e);
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

    useAuditStore.getState().addLog({
      action: 'Created',
      category: 'Content',
      entity: 'News Article',
      entityId: id,
      details: `Published news article: ${validated.title}`
    });

    try {
      await setDoc(doc(db, 'news', id), sanitizeForFirestore(validated), { merge: true });
    } catch (e: any) {
      console.warn('Firestore write error for news:', e);
    }
  },
  updateNews: async (id, newsUpdate) => {
    if (isIdDeleted(id)) return;
    const updated = get().news.map(n => n.id === id ? { ...n, ...newsUpdate } : n);
    set({ news: updated });
    saveStoredNgoData({ news: updated });
    try {
      const item = updated.find(n => n.id === id);
      if (item) {
        await setDoc(doc(db, 'news', id), sanitizeForFirestore(item) as any, { merge: true });
      }
    } catch (e: any) {
      console.warn('Firestore update error for news:', e);
    }
  },
  deleteNews: async (id) => {
    propagateRecordDeletion(id, 'news');
    const updated = get().news.filter(n => n.id !== id && !isIdDeleted(n.id));
    set({ news: updated });
    saveStoredNgoData({ news: updated });
    try {
      await deleteDoc(doc(db, 'news', id));
    } catch (e: any) {
      console.warn('Firestore delete error for news:', e);
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

    useAuditStore.getState().addLog({
      action: 'Created',
      category: 'Donations',
      severity: 'info',
      entity: 'Donation',
      entityId: id,
      details: `Received donation: ৳${validated.amount.toLocaleString()} from ${validated.donorName} [Receipt: ${validated.receiptNumber}, Method: ${validated.paymentMethod}]`,
      metadata: {
        receiptNumber: validated.receiptNumber,
        amount: validated.amount,
        donorName: validated.donorName,
        paymentMethod: validated.paymentMethod,
        currency: validated.currency
      }
    });

    // Supabase Dual-Write
    if (supabase) {
      Promise.resolve(
        supabase.from('donations').upsert([{
          id,
          receipt_number: validated.receiptNumber || null,
          donor_name: validated.donorName,
          donor_email: validated.donorEmail || null,
          donor_phone: validated.donorPhone || null,
          amount: validated.amount,
          currency: validated.currency || 'BDT',
          frequency: validated.frequency || 'one-time',
          transaction_id: validated.transactionId || null,
          is_anonymous: Boolean(validated.isAnonymous),
          dedication: validated.dedication || null,
          campaign_id: validated.campaignId || null,
          campaign_name: validated.campaignName || null,
          payment_method: validated.paymentMethod || 'card',
          status: validated.status || 'Pending',
          approved_at: validated.approvedAt || null,
          approved_by: validated.approvedBy || null,
          approver_role: validated.approverRole || null,
          receipt_sent: Boolean(validated.receiptSent),
          sms_sent: Boolean(validated.smsSent),
          email_sent: Boolean(validated.emailSent),
          created_at: validated.createdAt || new Date().toISOString()
        }])
      ).then(({ error }) => {
        if (error) console.warn('Supabase donation upsert:', error.message);
      }).catch(err => console.warn('Supabase donation error:', err));
    }

    try {
      await setDoc(doc(db, 'donations', id), sanitizeForFirestore(validated), { merge: true });
    } catch (e: any) {
      console.warn('Firestore write error for donation:', e);
    }
    return validated;
  },
  updateDonation: async (id, donationUpdate) => {
    if (isIdDeleted(id)) return;
    const oldDon = get().donations.find(d => d.id === id);
    const updated = get().donations.map(d => d.id === id ? { ...d, ...donationUpdate } : d);
    set({ donations: updated });
    saveStoredNgoData({ donations: updated });

    if (oldDon) {
      useAuditStore.getState().addLog({
        action: 'Updated',
        category: 'Donations',
        entity: 'Donation',
        entityId: id,
        details: `Updated donation record for receipt: ${oldDon.receiptNumber}`
      });
    }

    try {
      const don = updated.find(d => d.id === id);
      if (don) {
        await setDoc(doc(db, 'donations', id), sanitizeForFirestore(don) as any, { merge: true });
      }
    } catch (e: any) {
      console.warn('Firestore update error for donation:', e);
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
    
    useAuditStore.getState().addLog({
      action: 'Approved',
      category: 'Donations',
      severity: 'success',
      entity: 'Donation Audit',
      entityId: id,
      details: `Audited and verified donation receipt ${updatedDon.receiptNumber} (৳${updatedDon.amount.toLocaleString()}) by ${officer.name} (${officer.role})`,
      metadata: {
        receiptNumber: updatedDon.receiptNumber,
        amount: updatedDon.amount,
        donorName: updatedDon.donorName,
        approvedBy: officer.name,
        approverRole: officer.role,
        approvedAt: new Date().toISOString()
      }
    });

    // Also update campaign currentAmount if campaign is matched
    const campaign = get().campaigns.find(c => isCampaignMatch(c, updatedDon.campaignId, updatedDon.campaignName));
    if (campaign && !isIdDeleted(campaign.id)) {
      const newCurrent = (campaign.currentAmount || 0) + updatedDon.amount;
      const newDonors = (campaign.donorsCount || 0) + 1;
      const updatedCampaigns = get().campaigns.map(c => c.id === campaign.id ? { ...c, currentAmount: newCurrent, donorsCount: newDonors } : c);
      set({ campaigns: updatedCampaigns });
      saveStoredNgoData({ campaigns: updatedCampaigns });
      
      try {
        await setDoc(doc(db, 'campaigns', campaign.id), {
          currentAmount: newCurrent,
          donorsCount: newDonors
        }, { merge: true });
      } catch (e: any) {
        console.warn('Firestore campaign amount update error:', e);
      }
    }

    // Supabase Dual-Write Update
    if (supabase) {
      Promise.resolve(
        supabase.from('donations').update({
          status: 'Completed',
          approved_at: new Date().toISOString(),
          approved_by: officer.name,
          approver_role: officer.role,
          receipt_sent: true,
          sms_sent: true,
          email_sent: true
        }).eq('id', id)
      ).then(({ error }) => {
        if (error) console.warn('Supabase donation approval update:', error.message);
      }).catch(err => console.warn('Supabase donation approval error:', err));
    }

    try {
      await setDoc(doc(db, 'donations', id), sanitizeForFirestore(updatedDon) as any, { merge: true });
    } catch (e: any) {
      console.warn('Firestore donation approval write error:', e);
    }
    return updatedDon;
  },
  deleteDonation: async (id) => {
    const oldDon = get().donations.find(d => d.id === id);
    propagateRecordDeletion(id, 'donation');
    const updated = get().donations.filter(d => d.id !== id && !isIdDeleted(d.id));
    set({ donations: updated });
    saveStoredNgoData({ donations: updated });

    if (supabase) {
      Promise.resolve(supabase.from('donations').delete().eq('id', id)).catch(() => {});
    }

    useAuditStore.getState().addLog({
      action: 'Deleted',
      category: 'Donations',
      severity: 'warning',
      entity: 'Donation',
      entityId: id,
      details: `Cancelled/deleted donation record: ${oldDon?.receiptNumber || id} (৳${oldDon?.amount?.toLocaleString() || 0})`
    });

    try {
      await deleteDoc(doc(db, 'donations', id));
    } catch (e: any) {
      console.warn('Firestore delete donation error:', e);
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

    // Supabase Dual-Write
    if (supabase) {
      Promise.resolve(
        supabase.from('messages').upsert([{
          id,
          name: validated.name || '',
          email: validated.email || '',
          phone: validated.phone || null,
          subject: validated.subject || 'General Inquiry',
          message: validated.message || '',
          is_read: false,
          created_at: validated.createdAt || new Date().toISOString()
        }])
      ).then(({ error }) => {
        if (error) console.warn('Supabase message upsert:', error.message);
      }).catch(err => console.warn('Supabase message error:', err));
    }

    try {
      await setDoc(doc(db, 'messages', id), sanitizeForFirestore(validated), { merge: true });
    } catch (e: any) {
      console.warn('Firestore write error for message:', e);
    }
  },
  markMessageRead: async (id) => {
    if (isIdDeleted(id)) return;
    const updated = get().messages.map(m => m.id === id ? { ...m, isRead: true } : m);
    set({ messages: updated });
    saveStoredNgoData({ messages: updated });
    try {
      await setDoc(doc(db, 'messages', id), { isRead: true }, { merge: true });
    } catch (e: any) {
      console.warn('Firestore update error for message read:', e);
    }
  },
  deleteMessage: async (id) => {
    propagateRecordDeletion(id, 'message');
    const updated = get().messages.filter(m => m.id !== id && !isIdDeleted(m.id));
    set({ messages: updated });
    saveStoredNgoData({ messages: updated });

    if (supabase) {
      Promise.resolve(supabase.from('messages').delete().eq('id', id)).catch(() => {});
    }

    try {
      await deleteDoc(doc(db, 'messages', id));
    } catch (e: any) {
      console.warn('Firestore delete error for message:', e);
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

    useAuditStore.getState().addLog({
      action: 'Created',
      category: 'Content',
      entity: 'Transparency Document',
      entityId: id,
      details: `Uploaded audit/transparency document: ${validated.title} (${validated.category}) [Year: ${validated.year}]`
    });

    try {
      await setDoc(doc(db, 'documents', id), sanitizeForFirestore(validated), { merge: true });
    } catch (e: any) {
      console.warn('Firestore write error for document:', e);
    }
  },
  updateDocument: async (id, docUpdate) => {
    if (isIdDeleted(id)) return;
    const updated = get().documents.map(d => d.id === id ? { ...d, ...docUpdate } : d);
    set({ documents: updated });
    saveStoredNgoData({ documents: updated });
    try {
      const item = updated.find(d => d.id === id);
      if (item) {
        await setDoc(doc(db, 'documents', id), sanitizeForFirestore(item) as any, { merge: true });
      }
    } catch (e: any) {
      console.warn('Firestore update error for document:', e);
    }
  },
  deleteDocument: async (id) => {
    const oldDoc = get().documents.find(d => d.id === id);
    propagateRecordDeletion(id, 'document');
    const updated = get().documents.filter(d => d.id !== id && !isIdDeleted(d.id));
    set({ documents: updated });
    saveStoredNgoData({ documents: updated });

    useAuditStore.getState().addLog({
      action: 'Deleted',
      category: 'Content',
      severity: 'warning',
      entity: 'Transparency Document',
      entityId: id,
      details: `Removed transparency document: ${oldDoc?.title || id}`
    });

    try {
      await deleteDoc(doc(db, 'documents', id));
    } catch (e: any) {
      console.warn('Firestore delete error for document:', e);
    }
  },

  updateStats: async (newStats) => {
    const updated = { ...get().stats, ...newStats };
    set({ stats: updated });
    saveStoredNgoData({ stats: updated });
    try {
      await setDoc(doc(db, 'app_stats', 'main'), sanitizeForFirestore(updated), { merge: true });
    } catch (e: any) {
      console.warn('Firestore stats update error:', e);
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

  setTimeout(() => {
    syncNgoWithSupabase(useNgoStore.setState, useNgoStore.getState);
  }, 50);

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
