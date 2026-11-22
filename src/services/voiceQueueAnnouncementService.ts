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
    return false;
  }

  /**
   * Speak announcement text using Web Speech API or device TTS with optimal Hindi/English voice
   */
  async speak(text: string, lang: 'hi-IN' | 'en-IN' | 'en-US' = 'hi-IN'): Promise<void> {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      logger.info('voiceAnnouncement', 'TTS not available in this environment', { text });
      return;
    }

    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.92; // Slightly slowed for hospital clarity
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Select natural Indian or Hindi voice if available
      const voices = window.speechSynthesis.getVoices();
      const targetVoice = voices.find(
        (v) =>
          v.lang.toLowerCase().includes(lang.toLowerCase()) ||
          v.lang.toLowerCase().includes('hi') ||
          v.name.toLowerCase().includes('india') ||
          v.name.toLowerCase().includes('hindi')
      );
      if (targetVoice) {
        utterance.voice = targetVoice;
      }

      window.speechSynthesis.speak(utterance);
      logger.info('voiceAnnouncement', 'Speech utterance started', { text, lang });
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
