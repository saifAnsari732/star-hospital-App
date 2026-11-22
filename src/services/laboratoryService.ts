import apiClient, { withMockFallback } from './apiClient';
import {
  DiagnosticReportItem,
  LabTest,
  SaveLabResultRequest,
} from '../types/laboratory';
import {
  mockLabReports,
  mockAvailableLabTests,
} from '../fixtures/mockLabReports';

export const laboratoryService = {
  /**
   * Get laboratory and radiology diagnostic reports
   */
  async getDiagnosticReports(filters?: {
    patientId?: string;
    type?: 'lab' | 'radiology';
    status?: string;
  }): Promise<DiagnosticReportItem[]> {
    return withMockFallback(
      () =>
        apiClient.get<DiagnosticReportItem[]>('/api/v1/lab/reports', {
          params: filters,
        } as any),
      () => {
        let results = [...mockLabReports];

        if (filters?.patientId) {
          results = results.filter((r) => r.patientId === filters.patientId);
        }

        if (filters?.type) {
          results = results.filter((r) => r.type === filters.type);
        }

        if (filters?.status) {
          results = results.filter((r) => r.status === filters.status);
        }

        return results;
      }
    );
  },

  /**
   * Get single diagnostic report with all laboratory parameters
   */
  async getReportById(reportId: string): Promise<DiagnosticReportItem> {
    return withMockFallback(
      () => apiClient.get<DiagnosticReportItem>(`/api/v1/lab/reports/${reportId}`),
      () => {
        const found = mockLabReports.find(
          (r) => r.id === reportId || r.reportNumber === reportId
        );
        return found || mockLabReports[0];
      }
    );
  },

  /**
   * Get hospital test catalogue with prices and turnaround times
   */
  async getAvailableTests(category?: string): Promise<LabTest[]> {
    return withMockFallback(
      () =>
        apiClient.get<LabTest[]>('/api/v1/lab/tests', {
          params: { category },
        } as any),
      () => {
        if (!category || category === 'All') return mockAvailableLabTests;
        return mockAvailableLabTests.filter((t) => t.category === category);
      }
    );
  },

  /**
   * Save test result findings (Technician / Laboratorist entry)
   */
  async saveLabResults(
    req: SaveLabResultRequest
  ): Promise<DiagnosticReportItem> {
    return withMockFallback(
      () =>
        apiClient.post<DiagnosticReportItem>(
          `/api/v1/lab/reports/${req.reportId}/results`,
          req
        ),
      () => {
        const report =
          mockLabReports.find((r) => r.id === req.reportId) || mockLabReports[0];

        if (req.results) {
          report.results = req.results;
        }
        if (req.resultSummary) {
          report.resultSummary = req.resultSummary;
        }
        if (req.markCompleted) {
          report.status = 'completed';
        }

        return { ...report };
      }
    );
  },

  /**
   * Get download URL / PDF for a lab or radiology report
   */
  async downloadReport(
    reportId: string
  ): Promise<{ downloadUrl: string; fileName: string }> {
    return withMockFallback(
      () =>
        apiClient.get<{ downloadUrl: string; fileName: string }>(
          `/api/v1/lab/reports/${reportId}/download`
        ),
      () => {
        const report =
          mockLabReports.find((r) => r.id === reportId) || mockLabReports[0];
        return {
          downloadUrl: report.downloadUrl || 'https://example.com/reports/sample.pdf',
          fileName: `${report.reportNumber}_${report.testName.replace(/\s+/g, '_')}.pdf`,
        };
      }
    );
  },
};

export default laboratoryService;
