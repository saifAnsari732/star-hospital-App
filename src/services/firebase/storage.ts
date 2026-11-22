import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage';
import { firebaseAuth, firebaseStorage, isFirebaseConfigured } from '../../config/firebase';
import { profileService } from '../profileService';
import { secureLogger } from '../../utils/logger';

const ALLOWED_AVATAR_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const;
const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB limit enforced in storage.rules
const SAFE_USER_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const SAFE_STORAGE_AVATAR_PATH_PATTERN = /^profile_images\/[A-Za-z0-9_-]{1,128}\/[A-Za-z0-9._-]+$/;

export interface ProfilePhotoUploadInput {
  userId: string;
  fileUri: string;
  mimeType?: string;
}

export interface ProfilePhotoUploadResult {
  downloadUrl: string;
  storagePath: string;
  persistedToFirebase: boolean;
}

const getExtensionFromMime = (mimeType: string): string => {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return 'jpg';
};

export const firebaseStorageService = {
  isReady(): boolean {
    return Boolean(isFirebaseConfigured && firebaseStorage);
  },

  validateProfilePhotoInput(mimeType: string, sizeBytes?: number): void {
    const normalized = mimeType.toLowerCase();
    if (!(ALLOWED_AVATAR_MIME_TYPES as readonly string[]).includes(normalized)) {
      throw new Error('Only JPEG, PNG, or WebP profile images are supported.');
    }
    if (sizeBytes !== undefined) {
      if (sizeBytes <= 0) {
        throw new Error('Profile image file is empty.');
      }
      if (sizeBytes > MAX_AVATAR_BYTES) {
        throw new Error('Profile image must be 5 MB or smaller.');
      }
    }
  },

  async uploadProfilePhoto({
    userId,
    fileUri,
    mimeType = 'image/jpeg',
  }: ProfilePhotoUploadInput): Promise<ProfilePhotoUploadResult> {
    const trimmedUserId = userId?.trim() || '';
    if (!trimmedUserId || !fileUri) {
      throw new Error('User ID and image URI are required for avatar upload.');
    }
    if (!SAFE_USER_ID_PATTERN.test(trimmedUserId)) {
      throw new Error('Invalid user ID for avatar storage path.');
    }

    this.validateProfilePhotoInput(mimeType);
    const extension = getExtensionFromMime(mimeType.toLowerCase());
    const storagePath = `profile_images/${trimmedUserId}/avatar.${extension}`;

    const activeFirebaseUid = firebaseAuth?.currentUser?.uid;
    const canUploadAsOwner = !activeFirebaseUid || activeFirebaseUid === trimmedUserId;

    if (this.isReady() && firebaseStorage && canUploadAsOwner && activeFirebaseUid) {
      try {
        const response = await fetch(fileUri);
        const blob = await response.blob();
        this.validateProfilePhotoInput(mimeType, blob.size);

        const storageRef = ref(firebaseStorage, storagePath);
        await uploadBytes(storageRef, blob, {
          contentType: mimeType.toLowerCase(),
          customMetadata: { ownerUid: trimmedUserId },
        });
        const downloadUrl = await getDownloadURL(storageRef);

        // Sync resulting avatar URL with ICTHospital / profileService
        await profileService.uploadAvatar(downloadUrl);

        secureLogger.info('firebaseStorage', 'Uploaded profile avatar to Firebase Storage', {
          storagePath,
        });

        return {
          downloadUrl,
          storagePath,
          persistedToFirebase: true,
        };
      } catch (err) {
        secureLogger.warn('firebaseStorage', 'Firebase Storage avatar upload failed; falling back', err);
      }
    }

    const fallbackResult = await profileService.uploadAvatar(fileUri);
    return {
      downloadUrl: fallbackResult.photoUrl || fileUri,
      storagePath,
      persistedToFirebase: false,
    };
  },

  async deleteProfilePhoto(storagePath: string, ownerUid?: string): Promise<boolean> {
    if (
      !this.isReady() ||
      !firebaseStorage ||
      storagePath.includes('..') ||
      !SAFE_STORAGE_AVATAR_PATH_PATTERN.test(storagePath)
    ) {
      return false;
    }

    if (ownerUid && !storagePath.startsWith(`profile_images/${ownerUid}/`)) {
      return false;
    }

    const activeUid = firebaseAuth?.currentUser?.uid;
    if (activeUid && !storagePath.startsWith(`profile_images/${activeUid}/`)) {
      return false;
    }

    try {
      await deleteObject(ref(firebaseStorage, storagePath));
      return true;
    } catch (err) {
      secureLogger.warn('firebaseStorage', 'Failed to delete profile photo from Storage', err);
      return false;
    }
  },
};

export default firebaseStorageService;
