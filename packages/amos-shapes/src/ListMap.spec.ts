/*
 * @since 2020-12-03 11:42:27
 * @author acrazing <joking.young@gmail.com>
 */

import { TodoStatus } from 'amos-testing';
import { EnumValues } from 'amos-utils';
import { List } from './List';
import { ListMap } from './ListMap';

describe('AmosListDict', () => {
  it('should create ListMap', () => {
    // default list map
    const foo = new ListMap<number, List<number>>(new List(0));
    foo.setAt(1, 2, 3);
    foo.set(0, [0]);
    foo.getOrDefault(0);
    foo.getOrDefault(0).get(0)!.toExponential();
    // @ts-expect-error
    foo.getOrDefault('');
    // @ts-expect-error
    foo.getOrDefault(0).get(0).substr();

    // with value type limit
    const bar = new ListMap<number, List<EnumValues<typeof TodoStatus>>>(
      new List(TodoStatus.created),
    );
    // @ts-expect-error
    expect(bar.getOrDefault(0).get(0) === 10).toBeFalsy();

    class EList<T> extends List<T> {
      fine() {}
    }

    const l1 = new ListMap<number, EList<EnumValues<typeof TodoStatus>>>(
      new EList(TodoStatus.created),
    );
    l1.getOrDefault(0)?.fine();

    class NList extends List<number> {
      fine() {}
    }

    const l2 = new ListMap<number, NList>(new NList(0));
    l2.getOrDefault(0)?.fine();
  });
});