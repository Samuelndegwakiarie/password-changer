import type { PasswordChangeAdapter } from './adapter';
import { WellKnownChangePasswordAdapter } from './builtins/well-known';
import { GitHubChangePasswordAdapter } from './builtins/github';
import { GoogleAccountChangePasswordAdapter } from './builtins/google';
import { MockSiteChangePasswordAdapter } from './builtins/standard-mock';
import { normalizeDomain, isSameOrSubdomain } from './url-validator';

export class AdapterRegistry {
  private adapters: Map<string, PasswordChangeAdapter> = new Map();
  private domainMap: Map<string, PasswordChangeAdapter> = new Map();
  private fallbackAdapter: PasswordChangeAdapter;

  constructor() {
    this.fallbackAdapter = new WellKnownChangePasswordAdapter();
    this.register(this.fallbackAdapter);
    this.register(new GitHubChangePasswordAdapter());
    this.register(new GoogleAccountChangePasswordAdapter());
    this.register(new MockSiteChangePasswordAdapter());
  }

  public register(adapter: PasswordChangeAdapter): void {
    this.adapters.set(adapter.id, adapter);
    for (const domain of adapter.domains) {
      this.domainMap.set(normalizeDomain(domain), adapter);
    }
  }

  public getAdapterById(id: string): PasswordChangeAdapter | null {
    return this.adapters.get(id) ?? null;
  }

  public findAdapterForUrl(urlStr: string): PasswordChangeAdapter {
    try {
      const parsed = new URL(urlStr);
      const targetHost = normalizeDomain(parsed.hostname);

      // Check exact match
      if (this.domainMap.has(targetHost)) {
        return this.domainMap.get(targetHost)!;
      }

      // Check subdomain match
      for (const [registeredDomain, adapter] of this.domainMap.entries()) {
        if (isSameOrSubdomain(targetHost, registeredDomain)) {
          return adapter;
        }
      }
    } catch {
      // invalid url fallback
    }

    return this.fallbackAdapter;
  }

  public listAdapters(): PasswordChangeAdapter[] {
    return Array.from(this.adapters.values());
  }
}

export const defaultAdapterRegistry = new AdapterRegistry();
