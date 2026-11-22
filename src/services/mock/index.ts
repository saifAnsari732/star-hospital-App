/**
 * Star Hospital Mobile App
 * Mock Service Layer Exports
 */

export * from './mockNetworkDelay';
export {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
  getInitialPatients,
  getInitialDoctors,
  getInitialTokens,
  getInitialAppointments,
  getInitialPrescriptions,
  getInitialReports,
  getInitialInvoices,
  getInitialBeds,
  getInitialKpis,
  getInitialMedicines,
  MockAdapterEngine,
  mockAdapter,
  mockAdapter as default,
} from './mockAdapter';
