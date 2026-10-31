/**
 * Recoverly Ephemeral Secret Holder
 * Compliance:
 * - Keeps secrets strictly in volatile in-memory closure/ref
 * - Auto-wipes after configurable timeout (default 5 minutes)
 * - Explicit clear on cancel, completion, navigation, or reset
 * - Overwrites internal buffer if applicable
 */

export class EphemeralSecretHolder {
  private secret: string | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly ttlMs: number;

  constructor(ttlMs: number = 5 * 60 * 1000) {
    this.ttlMs = ttlMs;
  }

  public setSecret(val: string): void {
    this.clear();
    this.secret = val;
    this.timer = setTimeout(() => {
      this.clear();
    }, this.ttlMs);
  }

  public getSecret(): string | null {
    return this.secret;
  }

  public hasSecret(): boolean {
    return this.secret !== null;
  }

  public clear(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.secret = null;
  }
}
