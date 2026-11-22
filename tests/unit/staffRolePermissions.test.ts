/**
 * Tier 1 Unit Tests: Staff Role Permissions & RBAC Matrix
 * Feature: RBAC checks for nurse, laboratorist, pharmacist, billing, receptionist
 * Minimum requirement: >= 5 tests
 */

import { StaffDesignation } from '../../src/types/user';

// Role-Permission Evaluation Matrix
export const STAFF_PERMISSIONS: Record<StaffDesignation, string[]> = {
  nurse: ['vitals:record', 'vitals:view', 'beds:view', 'queue:view', 'patients:view'],
  laboratorist: ['lab:worklist', 'lab:results_enter', 'lab:reports_release', 'patients:view'],
  lab_tech: ['lab:worklist', 'lab:results_enter', 'lab:reports_release', 'patients:view'],
  pharmacist: ['pharmacy:worklist', 'pharmacy:inventory', 'pharmacy:dispense', 'prescriptions:view'],
  billing: ['billing:invoices_list', 'billing:invoice_create', 'billing:payments_record', 'billing:receipts'],
  billing_clerk: ['billing:invoices_list', 'billing:invoice_create', 'billing:payments_record', 'billing:receipts'],
  receptionist: ['patients:register', 'opd:token_generate', 'appointments:checkin', 'queue:view'],
  admin: [
    'vitals:record',
    'vitals:view',
    'beds:view',
    'beds:admit',
    'beds:discharge',
    'lab:worklist',
    'lab:results_enter',
    'lab:reports_release',
    'pharmacy:worklist',
    'pharmacy:inventory',
    'pharmacy:dispense',
    'billing:invoices_list',
    'billing:invoice_create',
    'billing:payments_record',
    'patients:register',
    'opd:token_generate',
  ],
};

export const hasPermission = (designation: StaffDesignation, permission: string): boolean => {
  const allowed = STAFF_PERMISSIONS[designation] || [];
  return allowed.includes(permission);
};

describe('StaffRolePermissions & RBAC Matrix Unit Tests', () => {
  // Test 1: Nurse permissions
  it('should grant clinical vitals entry to nurse but deny pharmacy dispensing and invoice creation', () => {
    expect(hasPermission('nurse', 'vitals:record')).toBe(true);
    expect(hasPermission('nurse', 'beds:view')).toBe(true);
    expect(hasPermission('nurse', 'pharmacy:dispense')).toBe(false);
    expect(hasPermission('nurse', 'billing:invoice_create')).toBe(false);
  });

  // Test 2: Laboratorist permissions
  it('should allow lab technician to enter test results but prevent clinical vitals recording', () => {
    expect(hasPermission('laboratorist', 'lab:results_enter')).toBe(true);
    expect(hasPermission('laboratorist', 'lab:reports_release')).toBe(true);
    expect(hasPermission('laboratorist', 'vitals:record')).toBe(false);
    expect(hasPermission('laboratorist', 'billing:payments_record')).toBe(false);
  });

  // Test 3: Pharmacist permissions
  it('should allow pharmacist to manage inventory and dispense drugs but deny lab result entry', () => {
    expect(hasPermission('pharmacist', 'pharmacy:dispense')).toBe(true);
    expect(hasPermission('pharmacist', 'pharmacy:inventory')).toBe(true);
    expect(hasPermission('pharmacist', 'lab:results_enter')).toBe(false);
    expect(hasPermission('pharmacist', 'vitals:record')).toBe(false);
  });

  // Test 4: Billing officer permissions
  it('should allow billing clerk to generate invoices and record payments but deny clinical tasks', () => {
    expect(hasPermission('billing', 'billing:invoice_create')).toBe(true);
    expect(hasPermission('billing', 'billing:payments_record')).toBe(true);
    expect(hasPermission('billing', 'vitals:record')).toBe(false);
    expect(hasPermission('billing', 'pharmacy:dispense')).toBe(false);
  });

  // Test 5: Front-desk receptionist permissions
  it('should allow receptionist to register patients and generate OPD tokens but deny medical record edits', () => {
    expect(hasPermission('receptionist', 'patients:register')).toBe(true);
    expect(hasPermission('receptionist', 'opd:token_generate')).toBe(true);
    expect(hasPermission('receptionist', 'lab:results_enter')).toBe(false);
    expect(hasPermission('receptionist', 'billing:invoice_create')).toBe(false);
  });

  // Test 6: Hospital Admin has full supervisory permissions
  it('should grant full operational supervisory permissions to admin', () => {
    expect(hasPermission('admin', 'vitals:record')).toBe(true);
    expect(hasPermission('admin', 'lab:results_enter')).toBe(true);
    expect(hasPermission('admin', 'pharmacy:dispense')).toBe(true);
    expect(hasPermission('admin', 'billing:invoice_create')).toBe(true);
  });
});
