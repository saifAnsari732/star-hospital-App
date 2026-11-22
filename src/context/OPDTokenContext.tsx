import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Share } from '../utils/share';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OPDToken, LiveQueueStep } from '../types/opdToken';

export interface OPDTokenContextType {
  currentToken: OPDToken | null;
  liveQueue: OPDToken[];
  tokenHistory: OPDToken[];
  isLoading: boolean;
  generateToken: (
    doctorId: string,
    visitType?: string,
    paymentMeta?: { isPaid?: boolean; paymentAmount?: number; paymentId?: string }
  ) => Promise<OPDToken>;
  fetchTokenStatus: (tokenNumber: string) => Promise<OPDToken>;
  refreshQueue: () => Promise<void>;
  shareToken: (tokenNumber?: string) => Promise<void>;
  callNextToken: (doctorId: string) => Promise<OPDToken | null>;
  completeToken: (tokenId: string) => Promise<void>;
  setCurrentToken: (token: OPDToken | null) => void;
}

const STORAGE_TOKEN_KEY = '@star_hospital_opd_current_token_v1';
const STORAGE_HISTORY_KEY = '@star_hospital_opd_token_history_v1';

const INITIAL_STEPS: LiveQueueStep[] = [
  { tokenNumber: 'A-100', status: 'completed', label: 'Completed' },
  { tokenNumber: 'A-101', status: 'current', label: 'In Consultation' },
  { tokenNumber: 'A-102', status: 'waiting', label: 'Currently in Queue' },
];

export const INITIAL_DEFAULT_TOKEN: OPDToken = {
  id: 'tok-102',
  tokenNumber: 'A-102',
  patientId: 'pat-1001',
  patientName: 'Rahul Sharma',
  patientMrn: 'P-00102',
  doctorId: 'doc-1',
  doctorName: 'Dr. Amit Sharma',
  department: 'General Physician',
  servingToken: 'A-101',
  queuePosition: 2,
  estimatedWaitMinutes: 15,
  status: 'arrived',
  roomNo: 'Room 104',
  generatedAt: '2026-11-15T09:15:00.000Z',
  liveSteps: INITIAL_STEPS,
};

const INITIAL_QUEUE: OPDToken[] = [
  {
    id: 'tok-100',
    tokenNumber: 'A-100',
    patientId: 'pat-099',
    patientName: 'Sanjay Verma',
    doctorId: 'doc-1',
    doctorName: 'Dr. Amit Sharma',
    department: 'General Physician',
    servingToken: 'A-100',
    queuePosition: 0,
    estimatedWaitMinutes: 0,
    status: 'completed',
    roomNo: 'Room 104',
    generatedAt: '2026-11-15T08:30:00.000Z',
    liveSteps: INITIAL_STEPS,
  },
  {
    id: 'tok-101',
    tokenNumber: 'A-101',
    patientId: 'pat-100',
    patientName: 'Meena Gupta',
    doctorId: 'doc-1',
    doctorName: 'Dr. Amit Sharma',
    department: 'General Physician',
    servingToken: 'A-101',
    queuePosition: 1,
    estimatedWaitMinutes: 5,
    status: 'in_consultation',
    roomNo: 'Room 104',
    generatedAt: '2026-11-15T08:50:00.000Z',
    liveSteps: INITIAL_STEPS,
  },
  INITIAL_DEFAULT_TOKEN,
  {
    id: 'tok-103',
    tokenNumber: 'A-103',
    patientId: 'pat-103',
    patientName: 'Priya Patel',
    doctorId: 'doc-1',
    doctorName: 'Dr. Amit Sharma',
    department: 'General Physician',
    servingToken: 'A-101',
    queuePosition: 3,
    estimatedWaitMinutes: 25,
    status: 'arrived',
    roomNo: 'Room 104',
    generatedAt: '2026-11-15T09:20:00.000Z',
    liveSteps: INITIAL_STEPS,
  },
  {
    id: 'tok-104',
    tokenNumber: 'A-104',
    patientId: 'pat-104',
    patientName: 'Sunil Kumar',
    doctorId: 'doc-1',
    doctorName: 'Dr. Amit Sharma',
    department: 'General Physician',
    servingToken: 'A-101',
    queuePosition: 4,
    estimatedWaitMinutes: 35,
    status: 'arrived',
    roomNo: 'Room 104',
    generatedAt: '2026-11-15T09:30:00.000Z',
    liveSteps: INITIAL_STEPS,
  },
];

const INITIAL_HISTORY: OPDToken[] = [
  INITIAL_DEFAULT_TOKEN,
  {
    id: 'tok-089',
    tokenNumber: 'A-089',
    patientId: 'pat-1001',
    patientName: 'Rahul Sharma',
    doctorId: 'doc-2',
    doctorName: 'Dr. Priya Mehta',
    department: 'Cardiologist',
    servingToken: 'A-089',
    queuePosition: 0,
    estimatedWaitMinutes: 0,
    status: 'completed',
    roomNo: 'Room 208',
    generatedAt: '2026-10-10T10:00:00.000Z',
    liveSteps: [
      { tokenNumber: 'A-088', status: 'completed' },
      { tokenNumber: 'A-089', status: 'completed' },
    ],
  },
  {
    id: 'tok-054',
    tokenNumber: 'A-054',
    patientId: 'pat-1001',
    patientName: 'Rahul Sharma',
    doctorId: 'doc-3',
    doctorName: 'Dr. Rakesh Verma',
    department: 'Orthopedic',
    servingToken: 'A-054',
    queuePosition: 0,
    estimatedWaitMinutes: 0,
    status: 'completed',
    roomNo: 'Room 112',
    generatedAt: '2026-09-02T11:30:00.000Z',
    liveSteps: [
      { tokenNumber: 'A-053', status: 'completed' },
      { tokenNumber: 'A-054', status: 'completed' },
    ],
  },
];

const OPDTokenContext = createContext<OPDTokenContextType | undefined>(undefined);

export const OPDTokenProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentToken, setCurrentToken] = useState<OPDToken | null>(INITIAL_DEFAULT_TOKEN);
  const [liveQueue, setLiveQueue] = useState<OPDToken[]>(INITIAL_QUEUE);
  const [tokenHistory, setTokenHistory] = useState<OPDToken[]>(INITIAL_HISTORY);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Restore state from AsyncStorage
  useEffect(() => {
    let isMounted = true;
    const loadPersistedTokens = async () => {
      try {
        const storedToken = await AsyncStorage.getItem(STORAGE_TOKEN_KEY);
        const storedHistory = await AsyncStorage.getItem(STORAGE_HISTORY_KEY);
        if (isMounted) {
          if (storedToken) {
            setCurrentToken(JSON.parse(storedToken));
          }
          if (storedHistory) {
            setTokenHistory(JSON.parse(storedHistory));
          }
        }
      } catch (err) {
        console.warn('[OPDTokenContext] Failed to load stored tokens:', err);
      }
    };
    loadPersistedTokens();
    return () => {
      isMounted = false;
    };
  }, []);

  const saveCurrentToken = async (token: OPDToken | null) => {
    setCurrentToken(token);
    try {
      if (token) {
        await AsyncStorage.setItem(STORAGE_TOKEN_KEY, JSON.stringify(token));
      } else {
        await AsyncStorage.removeItem(STORAGE_TOKEN_KEY);
      }
    } catch (err) {
      console.warn('[OPDTokenContext] Failed to persist current token:', err);
    }
  };

  const generateToken = async (
    doctorId: string,
    visitType: string = 'first_visit',
    paymentMeta?: { isPaid?: boolean; paymentAmount?: number; paymentId?: string }
  ): Promise<OPDToken> => {
    setIsLoading(true);
    // Simulate brief network delay
    await new Promise((resolve) => setTimeout(resolve, 400));

    const nextNumber = 103 + Math.floor(Math.random() * 10);
    const tokenNumberStr = `A-${nextNumber}`;
    const previousServing = currentToken?.servingToken || 'A-101';

    // Doctor mapping
    let doctorName = 'Dr. Amit Sharma';
    let department = 'General Physician';
    let roomNo = 'Room 104';

    if (doctorId === 'doc-2' || doctorId.includes('priya')) {
      doctorName = 'Dr. Priya Mehta';
      department = 'Cardiologist';
      roomNo = 'Room 208';
    } else if (doctorId === 'doc-3' || doctorId.includes('rakesh')) {
      doctorName = 'Dr. Rakesh Verma';
      department = 'Orthopedic';
      roomNo = 'Room 112';
    }

    const steps: LiveQueueStep[] = [
      { tokenNumber: `A-${nextNumber - 2}`, status: 'completed', label: 'Completed' },
      { tokenNumber: previousServing, status: 'current', label: 'In Consultation' },
      { tokenNumber: tokenNumberStr, status: 'waiting', label: 'Currently in Queue' },
    ];

    const newToken: OPDToken = {
      id: `tok-${Date.now()}`,
      tokenNumber: tokenNumberStr,
      patientId: 'pat-1001',
      patientName: 'Rahul Sharma',
      patientMrn: 'P-00102',
      doctorId,
      doctorName,
      department,
      servingToken: previousServing,
      queuePosition: 3,
      estimatedWaitMinutes: visitType === 'emergency' ? 5 : 20,
      status: 'arrived',
      roomNo,
      generatedAt: new Date().toISOString(),
      liveSteps: steps,
      isPaid: paymentMeta?.isPaid ?? true,
      paymentAmount: paymentMeta?.paymentAmount ?? 500,
      paymentId: paymentMeta?.paymentId,
    };

    const updatedHistory = [newToken, ...tokenHistory];
    const updatedQueue = [...liveQueue, newToken];

    setTokenHistory(updatedHistory);
    setLiveQueue(updatedQueue);
    await saveCurrentToken(newToken);

    try {
      await AsyncStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (err) {
      console.warn('[OPDTokenContext] Failed to persist token history:', err);
    }

    setIsLoading(false);
    return newToken;
  };

  const fetchTokenStatus = async (tokenNumber: string): Promise<OPDToken> => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 300));

    const found =
      (currentToken && currentToken.tokenNumber === tokenNumber ? currentToken : null) ||
      liveQueue.find((t) => t.tokenNumber === tokenNumber) ||
      tokenHistory.find((t) => t.tokenNumber === tokenNumber);

    setIsLoading(false);
    if (found) {
      return found;
    }

    // Fallback constructed token
    const fallbackToken: OPDToken = {
      ...INITIAL_DEFAULT_TOKEN,
      tokenNumber,
      id: `tok-${tokenNumber.replace(/\D/g, '')}`,
    };
    return fallbackToken;
  };

  const refreshQueue = async (): Promise<void> => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 350));

    if (currentToken && currentToken.queuePosition > 1) {
      const newQueuePos = currentToken.queuePosition - 1;
      const newWaitTime = Math.max(5, (newQueuePos - 1) * 7);
      const newServing = `A-${parseInt(currentToken.servingToken.replace('A-', ''), 10) + 1}`;

      const updatedSteps: LiveQueueStep[] = [
        { tokenNumber: currentToken.servingToken, status: 'completed', label: 'Completed' },
        { tokenNumber: newServing, status: 'current', label: 'In Consultation' },
        { tokenNumber: currentToken.tokenNumber, status: 'waiting', label: 'Currently in Queue' },
      ];

      const updatedToken: OPDToken = {
        ...currentToken,
        queuePosition: newQueuePos,
        estimatedWaitMinutes: newWaitTime,
        servingToken: newServing,
        liveSteps: updatedSteps,
      };

      await saveCurrentToken(updatedToken);
    }
    setIsLoading(false);
  };

  const shareToken = async (tokenNumber?: string): Promise<void> => {
    const targetToken =
      (tokenNumber ? liveQueue.find((t) => t.tokenNumber === tokenNumber) : null) || currentToken;

    if (!targetToken) {
      return;
    }

    const shareMessage =
      `Star Hospital OPD Token: ${targetToken.tokenNumber}\n` +
      `Patient: ${targetToken.patientName}\n` +
      `Doctor: ${targetToken.doctorName} (${targetToken.department})\n` +
      `Room: ${targetToken.roomNo || 'Room 104'}\n` +
      `Queue Position: #${targetToken.queuePosition}\n` +
      `Estimated Wait: ~${targetToken.estimatedWaitMinutes} mins\n` +
      `Star Hospital — Smart Healthcare for Everyone`;

    try {
      await Share.share({
        message: shareMessage,
        title: `Star Hospital OPD Token ${targetToken.tokenNumber}`,
      });
    } catch (err) {
      console.warn('[OPDTokenContext] Share dialog dismissed or failed:', err);
    }
  };

  const callNextToken = async (doctorId: string): Promise<OPDToken | null> => {
    const nextWaiting = liveQueue.find(
      (t) => t.doctorId === doctorId && (t.status === 'arrived' || t.status === 'in_consultation')
    );

    if (nextWaiting) {
      const updatedQueue = liveQueue.map((item) => {
        if (item.id === nextWaiting.id) {
          return {
            ...item,
            status: 'in_consultation' as const,
            consultStartedAt: new Date().toISOString(),
          };
        }
        return item;
      });
      setLiveQueue(updatedQueue);
      return nextWaiting;
    }
    return null;
  };

  const completeToken = async (tokenId: string): Promise<void> => {
    const updatedQueue = liveQueue.map((item) => {
      if (item.id === tokenId) {
        return {
          ...item,
          status: 'completed' as const,
          completedAt: new Date().toISOString(),
        };
      }
      return item;
    });
    setLiveQueue(updatedQueue);

    if (currentToken && currentToken.id === tokenId) {
      await saveCurrentToken({
        ...currentToken,
        status: 'completed',
        completedAt: new Date().toISOString(),
      });
    }
  };

  return (
    <OPDTokenContext.Provider
      value={{
        currentToken,
        liveQueue,
        tokenHistory,
        isLoading,
        generateToken,
        fetchTokenStatus,
        refreshQueue,
        shareToken,
        callNextToken,
        completeToken,
        setCurrentToken: saveCurrentToken,
      }}
    >
      {children}
    </OPDTokenContext.Provider>
  );
};

export const useOPDToken = (): OPDTokenContextType => {
  const context = useContext(OPDTokenContext);
  if (!context) {
    throw new Error('useOPDToken must be used within an OPDTokenProvider');
  }
  return context;
};

export default OPDTokenContext;
