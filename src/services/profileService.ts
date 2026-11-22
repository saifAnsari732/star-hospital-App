import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient, {
  withMockFallback,
  USER_INFO_STORAGE_KEY,
} from './apiClient';
import { UpdateProfileRequest, ChangePasswordRequest } from '../types/profile';
import { User } from '../types/user';
import { mockPatients } from '../fixtures/mockPatients';

export const profileService = {
  /**
   * Update profile details (name, phone, email, address, language)
   */
  async updateProfile(req: UpdateProfileRequest): Promise<User> {
    return withMockFallback(
      () => apiClient.put<User>('/api/v1/profile', req),
      async () => {
        let currentUser: User;
        try {
          const stored = await AsyncStorage.getItem(USER_INFO_STORAGE_KEY);
          currentUser = stored ? (JSON.parse(stored) as User) : {
            id: mockPatients[0].id,
            name: mockPatients[0].name,
            email: mockPatients[0].email,
            phone: mockPatients[0].phone,
            role: 'patient',
          };
        } catch {
          currentUser = {
            id: mockPatients[0].id,
            name: mockPatients[0].name,
            email: mockPatients[0].email,
            phone: mockPatients[0].phone,
            role: 'patient',
          };
        }

        const updatedUser: User = {
          ...currentUser,
          name: req.name || currentUser.name,
          phone: req.phone || currentUser.phone,
          email: req.email || currentUser.email,
          address: req.address || currentUser.address,
          city: req.city || currentUser.city,
          avatarUrl: req.photoUrl || currentUser.avatarUrl,
        };

        await AsyncStorage.setItem(
          USER_INFO_STORAGE_KEY,
          JSON.stringify(updatedUser)
        );

        return updatedUser;
      }
    );
  },

  /**
   * Change user password
   */
  async changePassword(
    req: ChangePasswordRequest
  ): Promise<{ success: boolean; message: string }> {
    return withMockFallback(
      () =>
        apiClient.post<{ success: boolean; message: string }>(
          '/api/v1/profile/change-password',
          req
        ),
      () => ({
        success: true,
        message: 'Password changed successfully.',
      })
    );
  },

  /**
   * Upload user avatar / profile photo
   */
  async uploadAvatar(
    imageUriOrBase64: string
  ): Promise<{ photoUrl: string }> {
    return withMockFallback(
      () =>
        apiClient.post<{ photoUrl: string }>('/api/v1/profile/avatar', {
          image: imageUriOrBase64,
        }),
      () => ({
        photoUrl: imageUriOrBase64.startsWith('http')
          ? imageUriOrBase64
          : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
      })
    );
  },
};

export default profileService;
