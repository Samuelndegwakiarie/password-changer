import { describe, it, expect } from 'vitest';
import {
  validateTransition,
  transitionRecovery,
  getStatusDisplayLabel,
  InvalidTransitionError,
} from './state-machine';
import type { RecoveryRecord } from '@recoverly/shared-types';

describe('Recovery State Machine', () => {
  const initialRecord: RecoveryRecord = {
    id: 'test-rec-1',
    accountId: 'test-acc-1',
    status: 'not_started',
    startedAt: '2026-10-31T00:00:00.000Z',
    updatedAt: '2026-10-31T00:00:00.000Z',
  };

  it('allows valid forward progression', () => {
    let rec = transitionRecovery(initialRecord, 'destination_found');
    expect(rec.status).toBe('destination_found');

    rec = transitionRecovery(rec, 'waiting_for_user_auth');
    expect(rec.status).toBe('waiting_for_user_auth');

    rec = transitionRecovery(rec, 'ready_to_generate');
    expect(rec.status).toBe('ready_to_generate');

    rec = transitionRecovery(rec, 'password_generated');
    expect(rec.status).toBe('password_generated');

    rec = transitionRecovery(rec, 'fields_filled');
    expect(rec.status).toBe('fields_filled');

    rec = transitionRecovery(rec, 'awaiting_user_submission');
    expect(rec.status).toBe('awaiting_user_submission');

    rec = transitionRecovery(rec, 'website_change_confirmed', { websiteChangeEvidence: 'user_confirmed' });
    expect(rec.status).toBe('website_change_confirmed');

    rec = transitionRecovery(rec, 'storage_pending');
    expect(rec.status).toBe('storage_pending');

    rec = transitionRecovery(rec, 'storage_user_confirmed', { storageEvidence: 'user_confirmed' });
    expect(rec.status).toBe('storage_user_confirmed');

    rec = transitionRecovery(rec, 'completed');
    expect(rec.status).toBe('completed');
  });

  it('prohibits direct transition from password_generated to completed', () => {
    const rec: RecoveryRecord = {
      ...initialRecord,
      status: 'password_generated',
    };
    expect(validateTransition('password_generated', 'completed')).toBe(false);
    expect(() => transitionRecovery(rec, 'completed')).toThrow(InvalidTransitionError);
  });

  it('accurately displays status labels distinguishing storage confirmation', () => {
    expect(getStatusDisplayLabel('completed', 'user_confirmed')).toBe('Recovery Completed');
    expect(getStatusDisplayLabel('completed', 'not_confirmed')).toBe('Password Changed (Saving Not Confirmed)');
    expect(getStatusDisplayLabel('awaiting_user_submission')).toBe('Awaiting Your Submission');
  });

  it('allows cancelling from intermediate states', () => {
    const rec: RecoveryRecord = {
      ...initialRecord,
      status: 'waiting_for_user_auth',
    };
    const cancelled = transitionRecovery(rec, 'cancelled');
    expect(cancelled.status).toBe('cancelled');
  });
});
