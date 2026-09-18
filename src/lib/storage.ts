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
  idcardimg: { name: 'idcardimg', description: 'Member & Volunteer ID card photos' },
  eventimg: { name: 'eventimg', description: 'Event photos' },
  projectimg: { name: 'projectimg', description: 'Program media' },
  campaignimg: { name: 'campaignimg', description: 'Campaign imagery' },
  branding: { name: 'branding', description: 'NGO logo & assets' },
  documents: { name: 'documents', description: 'Reports & certificates' },
  galleryimg: { name: 'galleryimg', description: 'Photo gallery' }
};

export const getStorageMode = () => 'local';
export const setStorageMode = (mode: string) => {};
export const getDriveSyncStatus = () => ({ isConnected: false, rootFolderId: null, subfolders: {} });
export const ensureNgoDriveFolders = async () => ({ rootId: 'local', subfolders: {} });

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        // Optimized for ID badges, print center, and web responsive cards (max 600px square)
        const maxDim = 600;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.80));
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const uploadImage = async (
  file: File, 
  path: string, 
  explicitCategory?: StorageCategory | string
): Promise<string> => {
  return await compressImage(file);
};

export const uploadFile = uploadImage;
export const syncAllNgoFolders = async () => ({ success: true, count: 7 });
