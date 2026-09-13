import { getAccessToken } from './auth';

export type StorageCategory = 
  | 'idcardimg'
  | 'eventimg'
  | 'projectimg'
  | 'campaignimg'
  | 'branding'
  | 'documents'
  | 'galleryimg';

export interface DriveFolderDetails {
  category: StorageCategory;
  name: string;
  description: string;
  folderId: string | null;
  driveUrl: string | null;
}

export const FOLDER_CONFIGS: Record<StorageCategory, { name: string; description: string }> = {
  idcardimg: {
    name: 'idcardimg',
    description: 'Member & Volunteer ID card photos, profile pictures, and generated card images'
  },
  eventimg: {
    name: 'eventimg',
    description: 'Event photos, campaign banners, and schedule visuals'
  },
  projectimg: {
    name: 'projectimg',
    description: 'Program, initiative, and project documentation media'
  },
  campaignimg: {
    name: 'campaignimg',
    description: 'Fundraising campaigns, emergency appeals, and cause imagery'
  },
  branding: {
    name: 'branding',
    description: 'Official NGO logo, seals, signatures, and brand assets'
  },
  documents: {
    name: 'documents',
    description: 'Audit reports, transparency documents, and official certificates'
  },
  galleryimg: {
    name: 'galleryimg',
    description: 'Photo gallery, press coverage, and field activity albums'
  }
};

const ROOT_FOLDER_NAME = 'NGO';

// Cache folder IDs in memory and localStorage for fast lookups
let cachedRootFolderId: string | null = null;
const cachedSubfolderIds: Record<string, string> = {};

function loadCache() {
  try {
    if (!cachedRootFolderId) {
      cachedRootFolderId = localStorage.getItem('gdrive_root_ngo_folder_id');
    }
    const savedSubfolders = localStorage.getItem('gdrive_subfolders_cache');
    if (savedSubfolders) {
      const parsed = JSON.parse(savedSubfolders);
      Object.assign(cachedSubfolderIds, parsed);
    }
  } catch (e) {
    // Ignore storage issues
  }
}

function saveCache() {
  try {
    if (cachedRootFolderId) {
      localStorage.setItem('gdrive_root_ngo_folder_id', cachedRootFolderId);
    }
    localStorage.setItem('gdrive_subfolders_cache', JSON.stringify(cachedSubfolderIds));
  } catch (e) {
    // Ignore storage issues
  }
}

// Automatically deduce category based on input hints
export function resolveCategory(pathOrCategory?: string): StorageCategory {
  if (!pathOrCategory) return 'idcardimg';
  const lower = pathOrCategory.toLowerCase();
  
  if (lower.includes('event')) return 'eventimg';
  if (lower.includes('project') || lower.includes('program')) return 'projectimg';
  if (lower.includes('campaign') || lower.includes('cause') || lower.includes('donate')) return 'campaignimg';
  if (lower.includes('logo') || lower.includes('brand') || lower.includes('seal') || lower.includes('sign')) return 'branding';
  if (lower.includes('doc') || lower.includes('report') || lower.includes('transparency') || lower.includes('pdf')) return 'documents';
  if (lower.includes('gallery') || lower.includes('album')) return 'galleryimg';
  if (lower.includes('idcard') || lower.includes('member') || lower.includes('volunteer') || lower.includes('photo')) return 'idcardimg';

  // Check if it's already one of the explicit keys
  if (lower in FOLDER_CONFIGS) {
    return lower as StorageCategory;
  }

  return 'idcardimg';
}

/**
 * Get or create the main root folder named "NGO"
 */
export async function getOrCreateRootNgoFolder(token: string): Promise<string> {
  loadCache();
  if (cachedRootFolderId) {
    // Verify it still exists
    try {
      const checkRes = await fetch(`https://www.googleapis.com/drive/v3/files/${cachedRootFolderId}?fields=id,trashed`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const checkData = await checkRes.json();
      if (checkData.id && !checkData.trashed) {
        return cachedRootFolderId;
      }
    } catch (err) {
      // Need to re-query
    }
    cachedRootFolderId = null;
  }

  // 1. Search for existing root folder "NGO"
  const query = encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and name='${ROOT_FOLDER_NAME}' and trashed=false`);
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const searchData = await searchRes.json();

  if (searchData.files && searchData.files.length > 0) {
    cachedRootFolderId = searchData.files[0].id;
    saveCache();
    return cachedRootFolderId!;
  }

  // 2. Create the "NGO" root folder if not found
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: ROOT_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder'
    })
  });
  const createData = await createRes.json();
  cachedRootFolderId = createData.id;
  saveCache();

  // Make root folder publicly readable so images can be served on website
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${cachedRootFolderId}/permissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone'
      })
    });
  } catch (err) {
    console.warn('Could not set public permissions on NGO root folder:', err);
  }

  return cachedRootFolderId!;
}

/**
 * Get or create a specific subfolder inside "NGO" (e.g., idcardimg, eventimg, etc.)
 */
export async function getOrCreateSubfolder(token: string, category: StorageCategory): Promise<string> {
  loadCache();
  const folderName = FOLDER_CONFIGS[category]?.name || category;

  const rootId = await getOrCreateRootNgoFolder(token);

  if (cachedSubfolderIds[folderName]) {
    return cachedSubfolderIds[folderName];
  }

  // Search for subfolder within the NGO folder
  const query = encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and name='${folderName}' and '${rootId}' in parents and trashed=false`);
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const searchData = await searchRes.json();

  if (searchData.files && searchData.files.length > 0) {
    const subId = searchData.files[0].id;
    cachedSubfolderIds[folderName] = subId;
    saveCache();
    return subId;
  }

  // Create subfolder inside "NGO"
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [rootId]
    })
  });
  const createData = await createRes.json();
  const subId = createData.id;
  cachedSubfolderIds[folderName] = subId;
  saveCache();

  // Make subfolder publicly readable
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${subId}/permissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone'
      })
    });
  } catch (err) {
    console.warn(`Could not set public permissions on ${folderName}:`, err);
  }

  return subId;
}

/**
 * Ensures all requested subfolders exist in Google Drive and returns their links
 */
export async function syncAllNgoFolders(): Promise<{
  rootFolder: { id: string; name: string; url: string };
  subfolders: DriveFolderDetails[];
}> {
  const token = await getAccessToken();
  if (!token) throw new Error('Google Drive account is not connected. Please log in with Google.');

  const rootId = await getOrCreateRootNgoFolder(token);
  const categories = Object.keys(FOLDER_CONFIGS) as StorageCategory[];
  
  const subfolderResults: DriveFolderDetails[] = [];

  for (const cat of categories) {
    const folderId = await getOrCreateSubfolder(token, cat);
    subfolderResults.push({
      category: cat,
      name: FOLDER_CONFIGS[cat].name,
      description: FOLDER_CONFIGS[cat].description,
      folderId,
      driveUrl: `https://drive.google.com/drive/folders/${folderId}`
    });
  }

  return {
    rootFolder: {
      id: rootId,
      name: ROOT_FOLDER_NAME,
      url: `https://drive.google.com/drive/folders/${rootId}`
    },
    subfolders: subfolderResults
  };
}

// Storage Mode: 'local' (Private, zero Drive access needed) vs 'gdrive' (Google Drive)
export type StorageMode = 'local' | 'gdrive';

export function getStorageMode(): StorageMode {
  return (localStorage.getItem('ngo_storage_mode') as StorageMode) || 'local';
}

export function setStorageMode(mode: StorageMode) {
  localStorage.setItem('ngo_storage_mode', mode);
}

/**
 * High-performance client-side image compressor.
 * Compresses images to ~100-200KB WebP/JPEG so direct web storage is fast and light.
 */
export async function compressImage(file: File, maxWidth = 1200, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    // If not an image (e.g. PDF doc), return data URL directly
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Main upload function:
 * Directs files into the organized Google Drive structure or Private Web Storage.
 * NGO -> idcardimg | eventimg | projectimg | campaignimg | branding | documents | galleryimg
 */
export const uploadImage = async (
  file: File, 
  path: string, 
  explicitCategory?: StorageCategory | string
): Promise<string> => {
  const vpsUrl = import.meta.env.VITE_VPS_UPLOAD_URL || 'http://74.225.235.215:4000/api/upload';
  
  try {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(vpsUrl, {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (data.success && data.url) {
      return data.url;
    }
  } catch (err) {
    console.warn('VPS upload failed, falling back to local compression', err);
  }

  const currentMode = getStorageMode();
  if (currentMode === 'local') {
    return await compressImage(file);
  }

  const token = await getAccessToken();
  if (!token) {
    return await compressImage(file);
  }

  try {
    const category = resolveCategory(explicitCategory || path);
    const targetFolderId = await getOrCreateSubfolder(token, category);

    const fileName = file.name || path.split('/').pop() || `${Date.now()}_file.png`;
    const metadata = {
      name: fileName,
      parents: [targetFolderId],
    };

    const initRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': file.type || 'image/png',
        'X-Upload-Content-Length': file.size.toString()
      },
      body: JSON.stringify(metadata)
    });

    const uploadUrl = initRes.headers.get('Location');
    if (!uploadUrl) {
      throw new Error('Failed to initiate Google Drive upload');
    }

    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'image/png'
      },
      body: file
    });

    const uploadData = await uploadRes.json();
    const fileId = uploadData.id;

    try {
      await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone'
        })
      });
    } catch (e) {
      // Non-fatal
    }

    const fileMetaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=webContentLink,thumbnailLink`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const fileMeta = await fileMetaRes.json();

    if (fileMeta.thumbnailLink) {
      return fileMeta.thumbnailLink.replace(/=s\d+$/, '=s1200');
    }

    return `https://lh3.googleusercontent.com/d/${fileId}=s1200`;
  } catch (err) {
    console.warn('Google Drive upload encountered an issue, safely falling back to private web storage:', err);
    return await compressImage(file);
  }
};

export const uploadFile = uploadImage;
