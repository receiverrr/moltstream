/**
 * Welcome Bot Example
 * 
 * This example shows a simple agent that greets new viewers by name when they send their first chat message.
 * It uses memory to track who has already been welcomed.
 * 
 * Run with:
 * npx tsx examples/welcome-bot/index.ts
 */

import { MoltAgent } from '@moltstream/core';
import { MockAdapter } from '@moltstream/adapters';
import { PolicyEngine } from '@moltstream/policy';
import { AuditLogger } from '@moltstream/audit';

const COOLDOWN_MS = 5000;
let lastWelcomeAt = 0;

const policy = new PolicyEngine({ preset: 'safe-mode' });
const audit = new AuditLogger({ traces: true });
const adapter = new MockAdapter(); // for local testing/chat simulation

// Using MockAdapter for local dev/testing — replace with real adapter (Twitch etc.) in production
const agent = new MoltAgent({
  adapter,
  policy,
  audit,
  traces: true, // enable reasoning traces
});

// Using ctx.memory for persistent tracking of welcomed users
// This survives restarts in real adapters (persistent backend later)
agent.onAudienceEvent('chat', async (event, ctx) => {
  const username = event.data.user ?? 'viewer';
  const rawMessage = event.data.message ?? '';
  const lower = rawMessage.toLowerCase();
  const isCommand = lower.includes('!welcome');

  const now = Date.now();
  const inCooldown = now - lastWelcomeAt < COOLDOWN_MS;

  const recent = ctx.memory.recent(100);
  const alreadyWelcomed = recent.some(
    (entry) => entry.type === 'audience' && entry.data?.event === 'welcomed' && entry.data?.user === username,
  );

  // Auto-welcome first-time chatters, but rate-limit welcomes.
  // The !welcome command can bypass the cooldown for users who haven't been welcomed yet.
  if (alreadyWelcomed || (inCooldown && !isCommand)) {
    return;
  }

  lastWelcomeAt = now;

  const message = `Welcome to the stream, @${username}! Glad you're here! 🚀`;

  await adapter.sendChat(message);

  ctx.memory.store({
    sessionId: ctx.session.id,
    type: 'audience',
    data: {
      event: 'welcomed',
      user: username,
      message: rawMessage,
      viaCommand: isCommand,
    },
  });

  audit.log({
    type: 'welcome',
    agentId: agent.id,
    payload: {
      username,
      message,
      viaCommand: isCommand,
      memoryStored: true,
    },
    reason: isCommand ? 'Triggered by !welcome command' : 'First message from new viewer',
  });

  console.log(`Welcomed new viewer: ${username}${isCommand ? ' (via command)' : ''}`);
});

agent
  .start()
  .then(() =>
    console.log('Welcome Bot is running! Send chat messages in the mock adapter to test.'),
  )
  .catch(console.error);

// === Simulation: auto-send some test chat messages to see the bot in action ===
setTimeout(() => {
  console.log('\n=== Starting simulation ===');
  console.log('Memory is now used for welcomes — check audit logs or attach a real backend to inspect entries.');

  const simulateChat = (username: string, message: string) => {
    console.log(`Simulating chat from ${username}: ${message}`);
    // Note: MockAdapter currently does not expose a public API to inject incoming events.
    // It already simulates random chat internally after connect(), so here we just
    // demonstrate what would be sent back out by the adapter.
    // For custom simulations, extend MockAdapter with a simulateChat(...) helper.
  };

  simulateChat('newbie42', 'yo whats up');
  setTimeout(
    () =>
      simulateChat('newbie42', 'second message - should NOT trigger welcome (already welcomed)'),
    1500,
  );
  setTimeout(() => simulateChat('coolkid', 'first msg here!'), 3000);
}, 2000);

