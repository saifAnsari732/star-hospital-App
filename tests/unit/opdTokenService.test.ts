/**
 * Tier 1 Unit Tests: OPD Token Generation & Queue Math Service
 * Feature: Token generation, queue position math, wait time estimation, status transitions
 * Minimum requirement: >= 5 tests
 */

import { mockAdapter } from '../../src/services/mock/mockAdapter';

describe('OPDTokenService & Queue Math Unit Tests', () => {
  beforeEach(() => {
    mockAdapter.reset();
  });

  // Test 1: Sequential token numbering
  it('should generate sequential token number with A- prefix', async () => {
    const response = await mockAdapter.generateToken('pat-1', 'doc-1', 'first_visit');

    expect(response.success).toBe(true);
    expect(response.data.tokenNumber).toMatch(/^A-\d+$/);
    const tokenNum = parseInt(response.data.tokenNumber.replace('A-', ''), 10);
    expect(tokenNum).toBeGreaterThanOrEqual(103);
  });

  // Test 2: Queue position calculation
  it('should correctly calculate queue position based on waiting tokens count', async () => {
    const waitingBefore = mockAdapter.tokens.filter(
      (t) => t.doctorId === 'doc-1' && t.status === 'arrived'
    ).length;

    const response = await mockAdapter.generateToken('pat-2', 'doc-1', 'first_visit');

    expect(response.data.queuePosition).toBe(waitingBefore + 1);
  });

  // Test 3: Wait time estimation math
  it('should estimate wait time proportional to queue position (10 mins per patient)', async () => {
    const response = await mockAdapter.generateToken('pat-1', 'doc-1', 'first_visit');

    // Expected wait = queuePosition * 10
    expect(response.data.estimatedWaitMinutes).toBe(response.data.queuePosition * 10);
  });

  // Test 4: Emergency priority wait time
  it('should allocate reduced emergency wait time (5 minutes) for emergency visit type', async () => {
    const response = await mockAdapter.generateToken('pat-1', 'doc-1', 'emergency');

    expect(response.data.estimatedWaitMinutes).toBe(5);
  });

  // Test 5: Doctor queue advancement (Call Next)
  it('should advance arrived token to in_consultation and update serving token', async () => {
    // Current serving is A-101. Next waiting is A-102.
    const response = await mockAdapter.callNextToken('doc-1');

    expect(response.success).toBe(true);
    expect(response.data).not.toBeNull();
    expect(response.data?.tokenNumber).toBe('A-102');
    expect(response.data?.status).toBe('in_consultation');
    expect(response.data?.consultStartedAt).toBeDefined();

    // Previous token A-101 should now be completed
    const previousToken = mockAdapter.tokens.find((t) => t.tokenNumber === 'A-101');
    expect(previousToken?.status).toBe('completed');
  });

  // Test 6: Queue position decrement upon call next
  it('should decrement queue positions of remaining waiting patients when next token is called', async () => {
    // Add another waiting token
    await mockAdapter.generateToken('pat-2', 'doc-1');
    const tokenBefore = mockAdapter.tokens.find((t) => t.tokenNumber === 'A-103');
    const posBefore = tokenBefore?.queuePosition || 0;

    await mockAdapter.callNextToken('doc-1');

    const tokenAfter = mockAdapter.tokens.find((t) => t.tokenNumber === 'A-103');
    if (tokenAfter) {
      expect(tokenAfter.queuePosition).toBe(Math.max(1, posBefore - 1));
      expect(tokenAfter.servingToken).toBe('A-102');
    }
  });

  // Test 7: Complete consultation
  it('should mark token as completed with ISO timestamp', async () => {
    const response = await mockAdapter.completeToken('tok-102');

    expect(response.success).toBe(true);
    expect(response.data.status).toBe('completed');
    expect(response.data.completedAt).toBeDefined();
  });

  // Test 8: Live queue stepper steps validation
  it('should maintain 3-step live queue stepper with completed, current, and waiting states', async () => {
    const response = await mockAdapter.generateToken('pat-1', 'doc-1');
    const steps = response.data.liveSteps;

    expect(steps.length).toBe(3);
    expect(steps[0].status).toBe('completed');
    expect(steps[1].status).toBe('current');
    expect(steps[2].status).toBe('waiting');
    expect(steps[2].tokenNumber).toBe(response.data.tokenNumber);
  });
});
