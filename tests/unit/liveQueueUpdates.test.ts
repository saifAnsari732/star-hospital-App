/**
 * Tier 3 Pairwise & Integration Tests: Live Queue Updates & Stepper Progression
 * Verifies live queue state synchronization, token advancement, and stepper integrity
 */

import { mockAdapter } from '../../src/services/mock/mockAdapter';

describe('Tier 3: Live Queue Updates & Stepper Progression', () => {
  beforeEach(() => {
    mockAdapter.reset();
  });

  // Test 1: Stepper state consistency across token life cycle
  it('should accurately progress token through arrived -> in_consultation -> completed', async () => {
    // 1. Generate new token A-103
    const genRes = await mockAdapter.generateToken('pat-1', 'doc-1');
    const token = genRes.data;
    expect(token.status).toBe('arrived');
    expect(token.queuePosition).toBeGreaterThan(0);

    // 2. Doctor calls token A-102 (currently next in queue)
    await mockAdapter.callNextToken('doc-1');

    // 3. Doctor calls token A-103
    const callRes = await mockAdapter.callNextToken('doc-1');
    expect(callRes.data?.tokenNumber).toBe(token.tokenNumber);
    expect(callRes.data?.status).toBe('in_consultation');
    expect(callRes.data?.queuePosition).toBe(0);
    expect(callRes.data?.estimatedWaitMinutes).toBe(0);

    // 4. Complete consultation
    const compRes = await mockAdapter.completeToken(token.id);
    expect(compRes.data.status).toBe('completed');
    expect(compRes.data.completedAt).toBeDefined();
  });

  // Test 2: Multi-doctor queue isolation
  it('should maintain independent queues and serving tokens for different doctors', async () => {
    // Generate token for Dr. Amit (doc-1) and Dr. Priya (doc-2)
    const tokenDoc1 = await mockAdapter.generateToken('pat-1', 'doc-1');
    const tokenDoc2 = await mockAdapter.generateToken('pat-2', 'doc-2');

    expect(tokenDoc1.data.doctorId).toBe('doc-1');
    expect(tokenDoc2.data.doctorId).toBe('doc-2');

    // Calling next for doc-1 should not affect doc-2's queue
    await mockAdapter.callNextToken('doc-1');

    const doc2Tokens = mockAdapter.tokens.filter((t) => t.doctorId === 'doc-2');
    const doc2Arrived = doc2Tokens.find((t) => t.id === tokenDoc2.data.id);
    expect(doc2Arrived?.status).toBe('arrived');
  });

  // Test 3: Serving token synchronization across all waiting tokens
  it('should update servingToken property across all waiting patients when caller advances', async () => {
    await mockAdapter.generateToken('pat-1', 'doc-1');
    await mockAdapter.generateToken('pat-2', 'doc-1');

    // Doctor calls next
    await mockAdapter.callNextToken('doc-1');

    // All waiting tokens for doc-1 should now have servingToken set to A-102
    const waitingTokens = mockAdapter.tokens.filter(
      (t) => t.doctorId === 'doc-1' && t.status === 'arrived'
    );

    waitingTokens.forEach((t) => {
      expect(t.servingToken).toBe('A-102');
    });
  });
});
