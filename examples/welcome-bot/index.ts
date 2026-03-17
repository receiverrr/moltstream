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

const welcomed = new Set<string>();

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

agent.onAudienceEvent('chat', async (event, ctx) => {
  const username = event.data.user ?? 'viewer';

  if (!welcomed.has(username)) {
    welcomed.add(username);

    const message = `Welcome to the stream, @${username}! Glad you're here! 🚀`;

    await ctx.adapter.sendChat(message);

    audit.log({
      type: 'welcome',
      agentId: agent.id,
      payload: { username, message },
      reason: 'First message from new viewer',
    });

    console.log(`Welcomed new viewer: ${username}`);
  }
});

agent
  .start()
  .then(() =>
    console.log('Welcome Bot is running! Send chat messages in the mock adapter to test.'),
  )
  .catch(console.error);

