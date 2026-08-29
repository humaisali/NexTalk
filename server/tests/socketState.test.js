const test = require('node:test');
const assert = require('node:assert/strict');
const socketHandler = require('../socket/socketHandler');

const state = socketHandler._test;

test.beforeEach(() => {
  state.roomUsers.clear();
  state.userSockets.clear();
  state.socketRateLimits.clear();
});

test('keeps a user online until their final socket disconnects', () => {
  state.addUserSocket('user-1', 'socket-a');
  state.addUserSocket('user-1', 'socket-b');
  assert.deepEqual(state.getUserSocketIds('user-1').sort(), ['socket-a', 'socket-b']);
  assert.equal(state.removeUserSocket('user-1', 'socket-a'), 1);
  assert.equal(state.removeUserSocket('user-1', 'socket-b'), 0);
});

test('keeps room presence until the final tab leaves', () => {
  const base = { userId: 'user-1', username: 'Ada', avatar: '' };
  state.addUserToRoom('room-1', { ...base, socketId: 'socket-a' });
  state.addUserToRoom('room-1', { ...base, socketId: 'socket-b' });

  assert.equal(state.getRoomUserList('room-1').length, 1);
  assert.equal(state.removeUserFromRoom('room-1', 'user-1', 'socket-a'), false);
  assert.equal(state.getRoomUserList('room-1').length, 1);
  assert.equal(state.removeUserFromRoom('room-1', 'user-1', 'socket-b'), true);
  assert.equal(state.getRoomUserList('room-1').length, 0);
});

test('enforces per-user socket event limits', () => {
  assert.equal(state.withinSocketRateLimit('user-1', 'mood', 2, 60_000), true);
  assert.equal(state.withinSocketRateLimit('user-1', 'mood', 2, 60_000), true);
  assert.equal(state.withinSocketRateLimit('user-1', 'mood', 2, 60_000), false);
});
