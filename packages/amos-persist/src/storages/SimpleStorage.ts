/*
 * @since 2024-10-18 00:33:43
 * @author junbao <junbao@moego.pet>
 */

import { ValueOrPromise } from 'amos-utils';
import { PersistEntry, PersistValue } from '../types';
import type { StorageEngine } from './Storage';

// compat with Web Storage and React Native AsyncStorage
export interface Storage {
  length?: number;
  getItem(key: string): ValueOrPromise<string | null>;
  setItem(key: string, value: string): ValueOrPromise<void>;
  removeItem(key: string): ValueOrPromise<void>;
  key?(index: number): string | null;
  getAllKeys?(): ValueOrPromise<readonly string[]>;
}

export class SimpleStorage implements StorageEngine {
  constructor(
    readonly prefix: string,
    readonly storage: Storage,
  ) {}

  async getMulti(items: readonly string[]): Promise<readonly (PersistValue | null)[]> {
    return Promise.all(items.map((key) => this.getItem(key)));
  }

  async getPrefix(prefix: string): Promise<readonly PersistEntry[]> {
    const keys = await this.allKeys(prefix);
    const r = await Promise.all(keys.map((k) => this.getItem(k)));
    return keys.map((k, i) => [k, ...(r[i] || [])] as const).filter((v) => v.length === 3);
  }

  async setMulti(items: readonly PersistEntry[]): Promise<void> {
    for (const [key, version, value] of items) {
      this.storage.setItem(this.genKey(key), JSON.stringify([version, value]));
    }
  }

  async removeMulti(items: readonly string[]): Promise<void> {
    await Promise.all(items.map((key) => this.storage.removeItem(this.genKey(key))));
  }

  async removePrefix(prefix: string): Promise<void> {
    const keys = await this.allKeys(prefix);
    await Promise.all(keys.map((k) => this.storage.removeItem(this.genKey(k))));
  }

  /**
   * Get item with key without {@link prefix}.
   */
  private async getItem(key: string): Promise<PersistValue | null> {
    const v = await this.storage.getItem(this.genKey(key));
    if (!v) {
      return null;
    }
    return JSON.parse(v);
  }

  /**
   * Get all keys start with prefix, without {@link prefix}.
   */
  private async allKeys(prefix: string) {
    const keyPrefix = this.genKey(prefix);
    const headSize = this.genKey('').length;
    if (this.storage.getAllKeys) {
      const keys = await this.storage.getAllKeys();
      return keys.filter((k) => k.startsWith(keyPrefix)).map((k) => k.substring(headSize));
    } else if (this.storage.length && this.storage.key) {
      const keys: string[] = [];
      for (let i = 0, size = this.storage.length; i < size; i++) {
        const key = this.storage.key(i);
        if (key?.startsWith(keyPrefix)) {
          keys.push(key!.substring(headSize));
        }
      }
      return keys;
    }
    return [];
  }

  private genKey(key: string) {
    return `${this.prefix}${key}`;
  }
}
