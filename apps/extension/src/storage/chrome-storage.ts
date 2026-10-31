import type {
  RecoverlyStorageState,
  AccountRecord,
  RecoveryRecord,
  ActivityRecord,
  UserSettings,
} from '@recoverly/shared-types';

const STORAGE_KEY = 'recoverly_state_v1';

export const DEFAULT_USER_SETTINGS: UserSettings = {
  onboardingCompleted: false,
  telemetryConsent: false,
  breachCheckConsent: false,
  defaultPasswordLength: 20,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true,
  avoidAmbiguous: false,
};

export function createInitialState(): RecoverlyStorageState {
  return {
    version: 1,
    settings: { ...DEFAULT_USER_SETTINGS },
    accounts: {},
    recoveries: {},
    activities: [],
  };
}

export const INITIAL_STATE: RecoverlyStorageState = createInitialState();

class StorageAdapter {
  private inMemoryFallback: RecoverlyStorageState | null = null;

  private isExtensionEnvironment(): boolean {
    return (
      typeof chrome !== 'undefined' &&
      typeof chrome.storage !== 'undefined' &&
      typeof chrome.storage.local !== 'undefined'
    );
  }

  public async getState(): Promise<RecoverlyStorageState> {
    if (this.isExtensionEnvironment()) {
      return new Promise(resolve => {
        chrome.storage.local.get([STORAGE_KEY], result => {
          if (chrome.runtime.lastError || !result[STORAGE_KEY]) {
            resolve(createInitialState());
          } else {
            resolve(result[STORAGE_KEY] as RecoverlyStorageState);
          }
        });
      });
    }

    // Dev/Test Fallback (e.g. standard browser or Vitest)
    if (!this.inMemoryFallback) {
      const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (stored) {
        try {
          this.inMemoryFallback = JSON.parse(stored);
        } catch {
          this.inMemoryFallback = createInitialState();
        }
      } else {
        this.inMemoryFallback = createInitialState();
      }
    }
    // Return deep copy so caller mutations don't inadvertently mutate internal reference without setState
    return JSON.parse(JSON.stringify(this.inMemoryFallback));
  }

  public async setState(state: RecoverlyStorageState): Promise<void> {
    // Security check: ensure no prohibited fields exist
    this.assertNoSecrets(state);

    if (this.isExtensionEnvironment()) {
      return new Promise((resolve, reject) => {
        chrome.storage.local.set({ [STORAGE_KEY]: state }, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      });
    }

    this.inMemoryFallback = JSON.parse(JSON.stringify(state));
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }

  public async updateSettings(updates: Partial<UserSettings>): Promise<UserSettings> {
    const state = await this.getState();
    state.settings = { ...state.settings, ...updates };
    await this.setState(state);
    return state.settings;
  }

  public async saveAccount(account: AccountRecord): Promise<void> {
    const state = await this.getState();
    state.accounts[account.id] = account;
    await this.setState(state);
  }

  public async deleteAccount(accountId: string): Promise<void> {
    const state = await this.getState();
    delete state.accounts[accountId];
    // Also remove associated recovery records
    for (const [id, rec] of Object.entries(state.recoveries)) {
      if (rec.accountId === accountId) {
        delete state.recoveries[id];
      }
    }
    await this.setState(state);
  }

  public async saveRecovery(recovery: RecoveryRecord): Promise<void> {
    const state = await this.getState();
    state.recoveries[recovery.id] = recovery;
    await this.setState(state);
  }

  public async addActivity(activity: ActivityRecord): Promise<void> {
    const state = await this.getState();
    state.activities.unshift(activity);
    // Limit activities to last 200 items to prevent storage bloat
    if (state.activities.length > 200) {
      state.activities = state.activities.slice(0, 200);
    }
    await this.setState(state);
  }

  public async purgeAll(): Promise<void> {
    if (this.isExtensionEnvironment()) {
      await new Promise<void>(resolve => chrome.storage.local.clear(resolve));
    } else {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
      this.inMemoryFallback = null;
    }
    await this.setState(createInitialState());
  }

  public async exportData(): Promise<string> {
    const state = await this.getState();
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        version: state.version,
        accounts: Object.values(state.accounts),
        recoveries: Object.values(state.recoveries),
        activities: state.activities,
      },
      null,
      2
    );
  }

  /**
   * Defensive assertion preventing secret keys from ever being persisted.
   */
  private assertNoSecrets(obj: unknown): void {
    const jsonStr = JSON.stringify(obj);
    const prohibited = [
      'password',
      'password_hash',
      'secret',
      'cookie',
      'otp',
      'recovery_code',
      'token',
    ];
    // We check keys specifically, allowing normal words like "passwordLength" in settings
    for (const key of prohibited) {
      const regex = new RegExp(`"${key}"\\s*:`, 'i');
      if (regex.test(jsonStr)) {
        throw new Error(`CRITICAL SECURITY VIOLATION: Attempted to persist prohibited field "${key}" to local storage.`);
      }
    }
  }
}

export const storage = new StorageAdapter();
