/*
 * @since 2022-02-18 00:04:50
 * @author acrazing <joking.young@gmail.com>
 */

import { override } from 'amos-utils';
import { StoreEnhancer } from '../createStore';

export const withCache: () => StoreEnhancer = () => (next) => (options) =>
  override(next(options), 'select', (original) => (selectable: any) => {
    // TODO
    return original(selectable) as any;
  });