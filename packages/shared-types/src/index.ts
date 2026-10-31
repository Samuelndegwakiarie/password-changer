/**
 * Recoverly Shared Domain Types
 * Rules compliance: No passwords, password hashes, secrets, cookies, or OTP types.
 */

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'unknown';

export type RiskCategory = 'breached' | 'reused' | 'weak' | 'user_reported';

export type ImportanceCategory = 'email' | 'financial' | 'identity' | 'social' | 'shopping' | 'work' | 'other';

export type AccountSource = 'manual' | 'local_import' | 'supported_integration';

export interface AccountRecord {
  id: string; // UUID v4
  domain: string; // Normalized registrable domain (e.g., example.com)
  displayName: string; // User-editable label
  usernameHint?: string; // Optional masked username (e.g. j***@gmail.com)
  riskCategories: RiskCategory[];
  riskLevel: RiskLevel;
  importance: ImportanceCategory;
  source: AccountSource;
  notes?: string; // Non-secret user notes
  createdAt: string; // ISO 8601 UTC
  updatedAt: string; // ISO 8601 UTC
  lastReviewedAt?: string; // ISO 8601 UTC
}

export type RecoveryStatus =
  | 'not_started'
  | 'destination_found'
  | 'waiting_for_user_auth'
  | 'ready_to_generate'
  | 'password_generated'
  | 'fields_filled'
  | 'awaiting_user_submission'
  | 'website_change_confirmed'
  | 'storage_pending'
  | 'storage_user_confirmed'
  | 'completed'
  | 'failed'
  | 'manual_action_required'
  | 'cancelled';

export interface RecoveryRecord {
  id: string; // UUID v4
  accountId: string;
  status: RecoveryStatus;
  destinationUrl?: string;
  adapterId?: string;
  startedAt: string; // ISO 8601 UTC
  updatedAt: string; // ISO 8601 UTC
  websiteChangeEvidence?: 'adapter_signal' | 'user_confirmed';
  storageEvidence?: 'user_confirmed' | 'not_confirmed';
  failureCode?: string;
  failureMessage?: string;
}

export interface ActivityRecord {
  id: string; // UUID v4
  accountId: string;
  domain: string;
  status: RecoveryStatus;
  timestamp: string; // ISO 8601 UTC
  adapterId?: string;
  failureCode?: string;
  evidenceType?: 'adapter_signal' | 'user_confirmed' | 'manual';
  details?: string;
}

export interface UserSettings {
  onboardingCompleted: boolean;
  telemetryConsent: boolean;
  breachCheckConsent: boolean;
  defaultPasswordLength: number; // 16 - 64 (default 20)
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  avoidAmbiguous: boolean;
}

export interface PasswordFieldMap {
  newPasswordSelector: string;
  confirmPasswordSelector?: string;
  currentPasswordSelector?: string; // selector only, never read value
}

export interface AdapterDetectionResult {
  detected: boolean;
  fields: PasswordFieldMap | null;
  requiresAuth: boolean;
  mfaDetected?: boolean;
  captchaDetected?: boolean;
}

export interface RecoverlyStorageState {
  version: number;
  settings: UserSettings;
  accounts: Record<string, AccountRecord>;
  recoveries: Record<string, RecoveryRecord>;
  activities: ActivityRecord[];
  activeRecoveryId?: string;
}

// Background <-> UI <-> Content Script Messaging Types
export type MessagePayload =
  | { type: 'GET_STATE' }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<UserSettings> }
  | { type: 'ADD_ACCOUNT'; account: Omit<AccountRecord, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'UPDATE_ACCOUNT'; id: string; updates: Partial<Omit<AccountRecord, 'id' | 'createdAt'>> }
  | { type: 'DELETE_ACCOUNT'; id: string }
  | { type: 'START_RECOVERY'; accountId: string }
  | { type: 'TRANSITION_RECOVERY'; recoveryId: string; nextStatus: RecoveryStatus; metadata?: Record<string, unknown> }
  | { type: 'CANCEL_RECOVERY'; recoveryId: string }
  | { type: 'DETECT_PAGE_FORM'; tabId: number }
  | { type: 'FILL_PASSWORD_APPROVAL'; recoveryId: string; password: string } // In-memory only!
  | { type: 'CONFIRM_STORAGE'; recoveryId: string; confirmed: boolean }
  | { type: 'CLEAR_EPHEMERAL_SECRET' }
  | { type: 'CHECK_BREACH_RANGE'; hashPrefix: string }
  | { type: 'EXPORT_DATA' }
  | { type: 'PURGE_ALL_DATA' };

export type MessageResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };
