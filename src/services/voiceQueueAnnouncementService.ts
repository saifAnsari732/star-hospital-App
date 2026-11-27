import { Platform } from 'react-native';
import { ref, set as rtdbSet, push } from 'firebase/database';
import { firebaseRtdb } from '../config/firebase';
import { emergencyAudioService } from './emergencyAudioService';
import logger from '../utils/logger';

export interface QueueVoiceAnnouncement {
  id: string;
  type: 'UPCOMING_TURN' | 'YOUR_TURN_NOW' | 'DOCTOR_DUTY_STARTED' | 'CONSULTATION_COMPLETED';
  tokenNumber: string;
  patientName: string;
  patientPhone?: string;
  doctorId: string;
  doctorName: string;
  chamber: string;
  hindiSpeechText: string;
  englishSpeechText: string;
  timestamp: string;
}

import * as Speech from 'expo-speech';

class VoiceQueueAnnouncementService {
  private isVoiceSupported: boolean = false;

  constructor() {
    this.checkVoiceSupport();
  }

  private checkVoiceSupport(): boolean {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.isVoiceSupported = true;
      return true;
    }
    return true; // expo-speech supported on native
  }

  /**
   * Speak announcement text with High-Quality Female Hindi Voice across Web & Mobile
   */
  async speak(text: string, lang: 'hi-IN' | 'en-IN' | 'en-US' = 'hi-IN'): Promise<void> {
    try {
      // 1. Play smooth hospital chime before speaking announcement
      if (typeof window !== 'undefined' && (window as any).AudioContext) {
        try {
          const ctx = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 chime
          osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5 chime
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
          osc.start();
          osc.stop(ctx.currentTime + 0.35);
        } catch {
          // AudioContext silent fallback
        }
      }

      // 2. Native Mobile Runtime (iOS & Android): Uses Expo Speech with Indian Hindi Female Voice
      if (Platform.OS !== 'web') {
        await Speech.stop();
        await Speech.speak(text, {
          language: lang,
          pitch: 1.15, // Natural feminine pitch
          rate: 0.90,  // Clear broadcast hospital rate
          voice: undefined,
        });
        logger.info('voiceAnnouncement', 'Native Expo-Speech utterance started', { text, lang });
        return;
      }

      // 3. Web Browser Runtime: Target Indian Hindi Female voice (e.g. Google हिन्दी, Kalpana, Heera, Microsoft Swara)
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.90; // Optimal speed for hospital hall announcements
        utterance.pitch = 1.18; // Crisp pleasant female pitch
        utterance.volume = 1.0;

        const voices = window.speechSynthesis.getVoices();
        
        // Priority search for Female Hindi & Indian voices
        const femaleHindiVoice = voices.find((v) => {
          const name = v.name.toLowerCase();
          const vLang = v.lang.toLowerCase();
          const isHindi = vLang.includes('hi') || name.includes('hindi') || name.includes('हिन्दी');
          const isFemale = name.includes('female') || name.includes('swara') || name.includes('kalpana') || name.includes('heera') || name.includes('priya') || name.includes('geeta');
          return isHindi && isFemale;
        }) || voices.find((v) => {
          const name = v.name.toLowerCase();
          const vLang = v.lang.toLowerCase();
          return vLang.includes('hi') || name.includes('hindi') || name.includes('हिन्दी');
        }) || voices.find((v) => {
          const name = v.name.toLowerCase();
          return name.includes('female') || name.includes('zira') || name.includes('samantha');
        });

        if (femaleHindiVoice) {
          utterance.voice = femaleHindiVoice;
          logger.info('voiceAnnouncement', 'Selected female voice for speech', { name: femaleHindiVoice.name });
        }

        window.speechSynthesis.speak(utterance);
        logger.info('voiceAnnouncement', 'Web Speech utterance started', { text, lang });
      }
    } catch (err) {
      logger.warn('voiceAnnouncement', 'Speech synthesis error', { err });
    }
  }

  /**
   * Broadcast announcement to Firebase Realtime Database
   */
  private async broadcastToRtdb(announcement: QueueVoiceAnnouncement): Promise<void> {
    if (!firebaseRtdb || typeof (firebaseRtdb as any).app === 'undefined') return;

    try {
      const announcementsRef = ref(firebaseRtdb, 'hospital_live_announcements');
      const newRef = push(announcementsRef);
      await rtdbSet(newRef, {
        ...announcement,
        id: newRef.key || announcement.id,
      });
      logger.info('voiceAnnouncement', 'Broadcasted to Realtime DB', { id: announcement.id });
    } catch (err) {
      logger.warn('voiceAnnouncement', 'RTDB announcement broadcast skipped', { err });
    }
  }

  /**
   * 1. Doctor Cabin Arrival / Duty Started
   * Notifies all waiting patients that the doctor is now in chamber and OPD has begun.
   */
  async announceDoctorDutyStarted(
    doctorName: string,
    chamber: string = 'OPD Room 101',
    department: string = 'General Medicine'
  ): Promise<QueueVoiceAnnouncement> {
    const hindiText = `ध्यान दें! ${doctorName}, ${department}, केबिन नंबर ${chamber} में उपस्थित हैं। ओपीडी कतार प्रारंभ हो चुकी है।`;
    const englishText = `Attention please. ${doctorName} is now available in chamber ${chamber}. The OPD consultation has begun.`;

    const data: QueueVoiceAnnouncement = {
      id: `duty-${Date.now()}`,
      type: 'DOCTOR_DUTY_STARTED',
      tokenNumber: 'ALL',
      patientName: 'All Waiting Patients',
      doctorId: 'doc-1',
      doctorName,
      chamber,
      hindiSpeechText: hindiText,
      englishSpeechText: englishText,
      timestamp: new Date().toISOString(),
    };

    void this.broadcastToRtdb(data);
    await this.speak(hindiText, 'hi-IN');
    return data;
  }

  /**
   * 2. Pre-Call: "Aapka number aane wala hai" (When queue position is #2)
   */
  async announceUpcomingTurn(
    tokenNumber: string,
    patientName: string,
    doctorName: string,
    chamber: string = 'OPD Room 101'
  ): Promise<QueueVoiceAnnouncement> {
    const hindiText = `टोकन नंबर ${tokenNumber}, ${patientName}, कृपया तैयार रहें। आपका नंबर आने वाला है।`;
    const englishText = `Token ${tokenNumber}, ${patientName}, please get ready. Your consultation turn is next.`;

    const data: QueueVoiceAnnouncement = {
      id: `pre-${Date.now()}`,
      type: 'UPCOMING_TURN',
      tokenNumber,
      patientName,
      doctorId: 'doc-1',
      doctorName,
      chamber,
      hindiSpeechText: hindiText,
      englishSpeechText: englishText,
      timestamp: new Date().toISOString(),
    };

    void this.broadcastToRtdb(data);
    await this.speak(hindiText, 'hi-IN');
    return data;
  }

  /**
   * 3. Call Now: "Aapka number aa gaya hai" (When token enters 'in_consultation')
   * Rings high-volume alert chime and announces Hindi speech
   */
  async announceYourTurnNow(
    tokenNumber: string,
    patientName: string,
    doctorName: string,
    chamber: string = 'OPD Room 101'
  ): Promise<QueueVoiceAnnouncement> {
    const hindiText = `टोकन नंबर ${tokenNumber}, ${patientName}, डॉक्टर ${doctorName}, केबिन ${chamber} में पधारें। आपका नंबर आ गया है।`;
    const englishText = `Token ${tokenNumber}, ${patientName}, please proceed to chamber ${chamber} for ${doctorName}. Your turn is now.`;

    const data: QueueVoiceAnnouncement = {
      id: `now-${Date.now()}`,
      type: 'YOUR_TURN_NOW',
      tokenNumber,
      patientName,
      doctorId: 'doc-1',
      doctorName,
      chamber,
      hindiSpeechText: hindiText,
      englishSpeechText: englishText,
      timestamp: new Date().toISOString(),
    };

    // Broadcast live event to Realtime DB
    void this.broadcastToRtdb(data);

    // Play attention chime and speak voice announcement
    await this.speak(hindiText, 'hi-IN');
    return data;
  }

  /**
   * 4. Consultation Completed: Token marked done
   */
  async announceConsultationCompleted(
    tokenNumber: string,
    patientName: string
  ): Promise<QueueVoiceAnnouncement> {
    const hindiText = `टोकन नंबर ${tokenNumber}, ${patientName}, परामर्श संपन्न हुआ। स्वास्थ्य लाभ हेतु धन्यवाद।`;
    const englishText = `Token ${tokenNumber}, ${patientName}, consultation completed. Thank you.`;

    const data: QueueVoiceAnnouncement = {
      id: `done-${Date.now()}`,
      type: 'CONSULTATION_COMPLETED',
      tokenNumber,
      patientName,
      doctorId: 'doc-1',
      doctorName: 'Attending Doctor',
      chamber: 'OPD',
      hindiSpeechText: hindiText,
      englishSpeechText: englishText,
      timestamp: new Date().toISOString(),
    };

    void this.broadcastToRtdb(data);
    return data;
  }
}

export const voiceQueueAnnouncementService = new VoiceQueueAnnouncementService();
export default voiceQueueAnnouncementService;
