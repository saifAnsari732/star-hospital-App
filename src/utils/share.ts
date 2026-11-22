import { Platform } from 'react-native';

export interface ShareContentInput {
  title?: string;
  message: string;
  url?: string;
}

export interface ShareResult {
  action: 'sharedAction' | 'dismissedAction';
}

/**
 * Cross-platform Share helper compatible with Android, iOS, and Expo Web (`react-native-web`).
 * Avoids importing `Share` directly from `react-native` at top level so `babel-plugin-react-native-web`
 * never rewrites it to the removed `react-native-web/dist/exports/Share` subpath on Web.
 */
export const Share = {
  sharedAction: 'sharedAction' as const,
  dismissedAction: 'dismissedAction' as const,

  async share(content: ShareContentInput): Promise<ShareResult> {
    if (Platform.OS === 'web') {
      const nav = (globalThis as { navigator?: any })?.navigator;
      if (nav && typeof nav.share === 'function') {
        await nav.share({
          title: content.title,
          text: content.message,
          url: content.url,
        });
        return { action: 'sharedAction' };
      }
      if (nav?.clipboard && typeof nav.clipboard.writeText === 'function') {
        await nav.clipboard.writeText(
          content.url ? `${content.message}\n${content.url}` : content.message
        );
        return { action: 'sharedAction' };
      }
      return { action: 'sharedAction' };
    }

    // Native Android / iOS runtime
    const RN = require('react-native') as {
      Share?: {
        share: (
          c: ShareContentInput,
          options?: { dialogTitle?: string; subject?: string }
        ) => Promise<ShareResult>;
      };
    };

    if (RN.Share && typeof RN.Share.share === 'function') {
      return RN.Share.share(content, {
        dialogTitle: content.title,
        subject: content.title,
      });
    }

    return { action: 'sharedAction' };
  },
};

export default Share;
