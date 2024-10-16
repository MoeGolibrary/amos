/*
 * @since 2021-12-31 12:11:29
 * @author junbao <junbao@moego.pet>
 */

import { Rick, select, userPostListBox } from 'amos-testing';

describe('PagedListBox', function () {
  it('should create PagedListBox', function () {
    select(userPostListBox.getOrDefault(Rick.id)).getPage();
    select(userPostListBox.getOrDefault(Rick.id)).getAll();
  });
});