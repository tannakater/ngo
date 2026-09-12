export interface Organization {
  id: string;
  name: string;
  nameBn?: string; // Bengali name
  shortName: string;
  tagline: string;
  logoUrl: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  facebook?: string; // Social links
  primaryColor: string;
  secondaryColor: string;
  cardBackground: string;
  registrationNumber: string;
  emergencyContact: string;
  qrVerificationUrl: string;
  noticeText?: string; // e.g. "If found, return to..."
  currency?: string; // Standard operational currency, e.g. USD, BDT, EUR, GBP
  mission?: string; // Organization mission statement
  vision?: string; // Organization vision statement
}

export interface Member {
  id: string; // The database ID
  memberId: string; // The display ID (e.g. ORG-0001)
  role?: 'Member' | 'Volunteer' | 'Staff'; // Added role
  firstName: string;
  lastName: string;
  photoUrl: string;
  designation: string;
  department: string;
  phone: string;
  email: string;
  bloodGroup: string;
  dateOfBirth: string;
  joiningDate: string;
  address: string;
  village?: string;
  postOffice?: string;
  thana?: string;
  district?: string;
  nid?: string;
  emergencyContact: string;
  status: 'Active' | 'Inactive' | 'Pending';

  customFields: Record<string, string>;

  // ID Card Generation & Lifecycle State
  idCardGenerated?: boolean;
  idCardGeneratedAt?: string;
  idCardTemplateId?: string;
  needsRegeneration?: boolean; // Set to true if an admin edits member info after card was already generated
}

export interface CardTemplate {
  id: string;
  name: string;
  width: number; // in mm
  height: number; // in mm
  orientation: 'portrait' | 'landscape';
  frontElements: CardElement[]; // Keep for backwards compat or custom templates
  backElements: CardElement[];
  backgroundUrl?: string;
  backgroundColor?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export type ElementType = 'text' | 'image' | 'qr' | 'barcode' | 'shape';

export interface CardElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
  
  // Text specific
  content?: string; // Can include template tags like {{firstName}}
  qrData?: string; // QR code data payload or template string
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number | string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  
  // Image specific
  src?: string; // Image URL or placeholder keyword
  borderRadius?: number;
  
  // Generic styling
  opacity?: number;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  shadow?: string;
}

export interface CustomFieldDefinition {
  id: string;
  name: string;
  type: 'text' | 'date' | 'number';
  required: boolean;
  showOnCard: boolean;
}

export interface WebUser {
  id: string;
  email: string;
  role: 'admin' | 'moderator';
  name: string;
  createdAt: string;
}
