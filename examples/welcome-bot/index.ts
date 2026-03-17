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

