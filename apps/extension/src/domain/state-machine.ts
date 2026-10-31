import type { RecoveryStatus, RecoveryRecord } from '@recoverly/shared-types';

const VALID_TRANSITIONS: Record<RecoveryStatus, readonly RecoveryStatus[]> = {
  not_started: ['destination_found', 'cancelled', 'manual_action_required'],
  destination_found: ['waiting_for_user_auth', 'manual_action_required', 'cancelled'],
  waiting_for_user_auth: ['ready_to_generate', 'manual_action_required', 'cancelled'],
  ready_to_generate: ['password_generated', 'cancelled'],
  password_generated: ['fields_filled', 'manual_action_required', 'cancelled'],
  fields_filled: ['awaiting_user_submission', 'manual_action_required', 'cancelled'],
  awaiting_user_submission: ['website_change_confirmed', 'failed', 'manual_action_required', 'cancelled'],
  website_change_confirmed: ['storage_pending', 'completed', 'cancelled'],
  storage_pending: ['storage_user_confirmed', 'completed', 'cancelled'],
  storage_user_confirmed: ['completed'],
  failed: ['manual_action_required', 'cancelled'],
  manual_action_required: ['website_change_confirmed', 'storage_pending', 'completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export class InvalidTransitionError extends Error {
  constructor(from: RecoveryStatus, to: RecoveryStatus) {
    super(`Invalid recovery state transition from "${from}" to "${to}".`);
    this.name = 'InvalidTransitionError';
  }
}

export function validateTransition(current: RecoveryStatus, next: RecoveryStatus): boolean {
  const allowed = VALID_TRANSITIONS[current] ?? [];
  return allowed.includes(next);
}

export function transitionRecovery(
  record: RecoveryRecord,
  nextStatus: RecoveryStatus,
  options?: {
    websiteChangeEvidence?: 'adapter_signal' | 'user_confirmed';
    storageEvidence?: 'user_confirmed' | 'not_confirmed';
    failureCode?: string;
    failureMessage?: string;
    destinationUrl?: string;
  }
): RecoveryRecord {
  if (!validateTransition(record.status, nextStatus)) {
    throw new InvalidTransitionError(record.status, nextStatus);
  }

  // Security Invariant: Can NEVER transition directly from password_generated to completed
  if (record.status === 'password_generated' && nextStatus === 'completed') {
    throw new Error('Security Invariant Violation: Direct transition from password_generated to completed is prohibited.');
  }

  return {
    ...record,
    status: nextStatus,
    updatedAt: new Date().toISOString(),
    destinationUrl: options?.destinationUrl ?? record.destinationUrl,
    websiteChangeEvidence: options?.websiteChangeEvidence ?? record.websiteChangeEvidence,
    storageEvidence: options?.storageEvidence ?? record.storageEvidence,
    failureCode: options?.failureCode ?? record.failureCode,
    failureMessage: options?.failureMessage ?? record.failureMessage,
  };
}

export function getStatusDisplayLabel(status: RecoveryStatus, storageEvidence?: 'user_confirmed' | 'not_confirmed'): string {
  switch (status) {
    case 'not_started':
      return 'Not Started';
    case 'destination_found':
      return 'Change Page Found';
    case 'waiting_for_user_auth':
      return 'Sign In Required';
    case 'ready_to_generate':
      return 'Ready to Generate';
    case 'password_generated':
      return 'Password Generated';
    case 'fields_filled':
      return 'Password Fields Filled';
    case 'awaiting_user_submission':
      return 'Awaiting Your Submission';
    case 'website_change_confirmed':
      return 'Website Change Confirmed';
    case 'storage_pending':
      return 'Confirming Password Manager Save';
    case 'storage_user_confirmed':
      return 'Storage Confirmed';
    case 'completed':
      if (storageEvidence === 'not_confirmed') {
        return 'Password Changed (Saving Not Confirmed)';
      }
      return 'Recovery Completed';
    case 'manual_action_required':
      return 'Manual Action Required';
    case 'failed':
      return 'Change Failed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}
