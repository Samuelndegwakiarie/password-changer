import { useState, useEffect, useCallback } from 'react';
import type {
  RecoverlyStorageState,
  AccountRecord,
  RecoveryRecord,
  UserSettings,
  RecoveryStatus,
  MessagePayload,
  MessageResponse,
} from '@recoverly/shared-types';
import { storage, INITIAL_STATE } from '../storage/chrome-storage';
import { transitionRecovery } from '../domain/state-machine';

export function useRecoverlyState() {
  const [state, setState] = useState<RecoverlyStorageState>(INITIAL_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async <T = unknown>(payload: MessagePayload): Promise<T> => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(payload, (response: MessageResponse<T>) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (!response || !response.success) {
            reject(new Error(response?.error ?? 'Unknown error communicating with extension'));
          } else {
            resolve(response.data);
          }
        });
      });
    }

    // Fallback for non-extension preview / tests: simulate handler
    const current = await storage.getState();
    switch (payload.type) {
      case 'GET_STATE':
        return current as unknown as T;
      case 'UPDATE_SETTINGS':
        return (await storage.updateSettings(payload.settings)) as unknown as T;
      case 'ADD_ACCOUNT': {
        const now = new Date().toISOString();
        const acc: AccountRecord = {
          ...payload.account,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        };
        await storage.saveAccount(acc);
        return acc as unknown as T;
      }
      case 'UPDATE_ACCOUNT': {
        const existing = current.accounts[payload.id];
        if (!existing) throw new Error('Account not found');
        const updated = { ...existing, ...payload.updates, updatedAt: new Date().toISOString() };
        await storage.saveAccount(updated);
        return updated as unknown as T;
      }
      case 'DELETE_ACCOUNT':
        await storage.deleteAccount(payload.id);
        return { deleted: true } as unknown as T;
      case 'START_RECOVERY': {
        const acc = current.accounts[payload.accountId];
        if (!acc) throw new Error('Account not found');
        const now = new Date().toISOString();
        const rec: RecoveryRecord = {
          id: crypto.randomUUID(),
          accountId: acc.id,
          status: 'destination_found',
          destinationUrl: `https://${acc.domain}`,
          startedAt: now,
          updatedAt: now,
        };
        await storage.saveRecovery(rec);
        current.activeRecoveryId = rec.id;
        await storage.setState(current);
        return rec as unknown as T;
      }
      case 'CANCEL_RECOVERY': {
        current.activeRecoveryId = undefined;
        await storage.setState(current);
        return { cancelled: true } as unknown as T;
      }
      case 'TRANSITION_RECOVERY': {
        const rec = current.recoveries[payload.recoveryId];
        if (!rec) throw new Error('Recovery record not found');
        const updated = transitionRecovery(rec, payload.nextStatus, payload.metadata as any);
        current.recoveries[updated.id] = updated;
        if (['completed', 'cancelled', 'failed'].includes(updated.status)) {
          current.activeRecoveryId = undefined;
        }
        await storage.setState(current);
        return updated as unknown as T;
      }
      case 'CONFIRM_STORAGE': {
        const rec = current.recoveries[payload.recoveryId];
        if (!rec) throw new Error('Recovery record not found');
        const updated = transitionRecovery(rec, 'completed', {
          storageEvidence: payload.confirmed ? 'user_confirmed' : 'not_confirmed',
        });
        current.recoveries[updated.id] = updated;
        current.activeRecoveryId = undefined;
        await storage.setState(current);
        return updated as unknown as T;
      }
      case 'EXPORT_DATA':
        return (await storage.exportData()) as unknown as T;
      case 'PURGE_ALL_DATA':
        await storage.purgeAll();
        return { purged: true } as unknown as T;
      default:
        return {} as unknown as T;
    }
  }, []);

  const refreshState = useCallback(async () => {
    try {
      setLoading(true);
      const s = await sendMessage<RecoverlyStorageState>({ type: 'GET_STATE' });
      setState(s);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [sendMessage]);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  const addAccount = async (account: Omit<AccountRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    await sendMessage({ type: 'ADD_ACCOUNT', account });
    await refreshState();
  };

  const updateAccount = async (id: string, updates: Partial<AccountRecord>) => {
    await sendMessage({ type: 'UPDATE_ACCOUNT', id, updates });
    await refreshState();
  };

  const deleteAccount = async (id: string) => {
    await sendMessage({ type: 'DELETE_ACCOUNT', id });
    await refreshState();
  };

  const startRecovery = async (accountId: string) => {
    const rec = await sendMessage<RecoveryRecord>({ type: 'START_RECOVERY', accountId });
    await refreshState();
    return rec;
  };

  const transitionRecoveryState = async (
    recoveryId: string,
    nextStatus: RecoveryStatus,
    metadata?: Record<string, unknown>
  ) => {
    const rec = await sendMessage<RecoveryRecord>({
      type: 'TRANSITION_RECOVERY',
      recoveryId,
      nextStatus,
      metadata,
    });
    await refreshState();
    return rec;
  };

  const cancelRecovery = async (recoveryId: string) => {
    await sendMessage({ type: 'CANCEL_RECOVERY', recoveryId });
    await refreshState();
  };

  const confirmStorage = async (recoveryId: string, confirmed: boolean) => {
    await sendMessage({ type: 'CONFIRM_STORAGE', recoveryId, confirmed });
    await refreshState();
  };

  const updateSettings = async (settings: Partial<UserSettings>) => {
    await sendMessage({ type: 'UPDATE_SETTINGS', settings });
    await refreshState();
  };

  const purgeAllData = async () => {
    await sendMessage({ type: 'PURGE_ALL_DATA' });
    await refreshState();
  };

  return {
    state,
    loading,
    error,
    refreshState,
    addAccount,
    updateAccount,
    deleteAccount,
    startRecovery,
    transitionRecoveryState,
    cancelRecovery,
    confirmStorage,
    updateSettings,
    purgeAllData,
    activeRecovery: state.activeRecoveryId ? state.recoveries[state.activeRecoveryId] : undefined,
  };
}
