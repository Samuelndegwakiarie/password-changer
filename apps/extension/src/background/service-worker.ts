import { storage } from '../storage/chrome-storage';
import { transitionRecovery } from '../domain/state-machine';
import { EphemeralSecretHolder } from '@recoverly/password-core';
import { defaultAdapterRegistry } from '@recoverly/adapter-contracts';
import type {
  MessagePayload,
  MessageResponse,
  RecoveryRecord,
  AccountRecord,
} from '@recoverly/shared-types';

const ephemeralSecretHolder = new EphemeralSecretHolder(5 * 60 * 1000); // 5 min TTL

// Enable side panel to open on action click if supported
if (typeof chrome !== 'undefined' && chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {
    // Ignore error if unsupported in current Chrome build
  });
}

// Clear secrets on tab closed or navigated away
if (typeof chrome !== 'undefined' && chrome.tabs) {
  chrome.tabs.onRemoved.addListener(() => {
    ephemeralSecretHolder.clear();
  });
  chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
    if (changeInfo.url) {
      ephemeralSecretHolder.clear();
    }
  });
}

// Message dispatcher
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener(
    (
      message: MessagePayload,
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response: MessageResponse) => void
    ) => {
      handleMessage(message)
        .then(result => sendResponse({ success: true, data: result }))
        .catch(err => {
          const errMsg = err instanceof Error ? err.message : String(err);
          sendResponse({ success: false, error: errMsg });
        });
      return true; // Keep channel open for async response
    }
  );
}

async function handleMessage(message: MessagePayload): Promise<unknown> {
  switch (message.type) {
    case 'GET_STATE': {
      return await storage.getState();
    }

    case 'UPDATE_SETTINGS': {
      return await storage.updateSettings(message.settings);
    }

    case 'ADD_ACCOUNT': {
      const now = new Date().toISOString();
      const newAccount: AccountRecord = {
        ...message.account,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      };
      await storage.saveAccount(newAccount);
      return newAccount;
    }

    case 'UPDATE_ACCOUNT': {
      const state = await storage.getState();
      const existing = state.accounts[message.id];
      if (!existing) throw new Error('Account not found');
      const updated: AccountRecord = {
        ...existing,
        ...message.updates,
        updatedAt: new Date().toISOString(),
      };
      await storage.saveAccount(updated);
      return updated;
    }

    case 'DELETE_ACCOUNT': {
      await storage.deleteAccount(message.id);
      return { deleted: true };
    }

    case 'START_RECOVERY': {
      const state = await storage.getState();
      const account = state.accounts[message.accountId];
      if (!account) throw new Error('Account not found');

      // Discover target URL
      const adapter = defaultAdapterRegistry.findAdapterForUrl(`https://${account.domain}`);
      const targetUrl = adapter.getChangePasswordUrl(`https://${account.domain}`);
      const now = new Date().toISOString();

      const newRecovery: RecoveryRecord = {
        id: crypto.randomUUID(),
        accountId: account.id,
        status: targetUrl ? 'destination_found' : 'manual_action_required',
        destinationUrl: targetUrl?.toString() ?? `https://${account.domain}`,
        adapterId: adapter.id,
        startedAt: now,
        updatedAt: now,
      };

      state.recoveries[newRecovery.id] = newRecovery;
      state.activeRecoveryId = newRecovery.id;
      await storage.setState(state);

      await storage.addActivity({
        id: crypto.randomUUID(),
        accountId: account.id,
        domain: account.domain,
        status: newRecovery.status,
        timestamp: now,
        adapterId: adapter.id,
        details: 'Recovery initiated by user',
      });

      // Open tab if in Chrome context
      if (typeof chrome !== 'undefined' && chrome.tabs && newRecovery.destinationUrl) {
        chrome.tabs.create({ url: newRecovery.destinationUrl });
      }

      return newRecovery;
    }

    case 'TRANSITION_RECOVERY': {
      const state = await storage.getState();
      const recovery = state.recoveries[message.recoveryId];
      if (!recovery) throw new Error('Recovery record not found');

      const nextRec = transitionRecovery(recovery, message.nextStatus, message.metadata as any);
      state.recoveries[nextRec.id] = nextRec;

      const account = state.accounts[nextRec.accountId];
      if (account) {
        await storage.addActivity({
          id: crypto.randomUUID(),
          accountId: account.id,
          domain: account.domain,
          status: nextRec.status,
          timestamp: new Date().toISOString(),
          adapterId: nextRec.adapterId,
          evidenceType: nextRec.websiteChangeEvidence,
          details: `Status changed to ${nextRec.status}`,
        });
      }

      if (['completed', 'cancelled', 'failed'].includes(nextRec.status)) {
        ephemeralSecretHolder.clear();
        state.activeRecoveryId = undefined;
      }
      await storage.setState(state);

      return nextRec;
    }

    case 'CANCEL_RECOVERY': {
      ephemeralSecretHolder.clear();
      const state = await storage.getState();
      const recovery = state.recoveries[message.recoveryId];
      if (recovery) {
        const nextRec = transitionRecovery(recovery, 'cancelled');
        state.recoveries[nextRec.id] = nextRec;
      }
      state.activeRecoveryId = undefined;
      await storage.setState(state);
      return { cancelled: true };
    }

    case 'FILL_PASSWORD_APPROVAL': {
      // In-memory operation: inject script into active tab to fill fields
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTab?.id) {
          await chrome.tabs.sendMessage(activeTab.id, {
            type: 'FILL_DOM_FIELDS',
            password: message.password,
          });
        }
      }
      return { filled: true };
    }

    case 'CONFIRM_STORAGE': {
      const state = await storage.getState();
      const recovery = state.recoveries[message.recoveryId];
      if (!recovery) throw new Error('Recovery record not found');

      const nextRec = transitionRecovery(recovery, 'completed', {
        storageEvidence: message.confirmed ? 'user_confirmed' : 'not_confirmed',
      });
      state.recoveries[nextRec.id] = nextRec;
      ephemeralSecretHolder.clear();
      state.activeRecoveryId = undefined;
      await storage.setState(state);
      return nextRec;
    }

    case 'CLEAR_EPHEMERAL_SECRET': {
      ephemeralSecretHolder.clear();
      return { cleared: true };
    }

    case 'EXPORT_DATA': {
      return await storage.exportData();
    }

    case 'PURGE_ALL_DATA': {
      ephemeralSecretHolder.clear();
      await storage.purgeAll();
      return { purged: true };
    }

    default:
      throw new Error(`Unknown message type: ${(message as any).type}`);
  }
}
