import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import {
  isMinter,
  lockTime,
  nextAccessTime,
  requestTokens,
  withdrawalAmount,
} from './utils/faucet.js';

export const createFaucetLockTimeTool = () =>
  new DynamicStructuredTool({
    name: 'faucet_lock_time',
    description: `
    Get the lock time for the faucet contract on the Auto EVM Autonomy Network.
    USE THIS WHEN:
    - You need to know the standard lock time between requests.
    `,
    schema: z.object({}),
    func: async () => {
      const result = await lockTime();
      return result;
    },
  });

export const createFaucetNextAccessTimeTool = () =>
  new DynamicStructuredTool({
    name: 'faucet_next_access_time',
    description: `
    Get the next access time for the faucet contract on the Auto EVM Autonomy Network for a specific wallet.
    USE THIS WHEN:
    - You need to know when the faucet will be unlocked for a specific wallet.
    `,
    schema: z.object({ address: z.string() }),
    func: async ({ address }) => {
      const result = await nextAccessTime(address);
      return result;
    },
  });

export const createFaucetIsMinterTool = () =>
  new DynamicStructuredTool({
    name: 'faucet_is_minter',
    description: `
    Get the isMinter status for the faucet contract on the Auto EVM Autonomy Network for a specific wallet.
    USE THIS WHEN:
    - You need to know if the wallet is a minter for the faucet contract on the Auto EVM Autonomy Network.
    This allow you to verify if the wallet you are using to send the request is actually allowed to do so.
    `,
    schema: z.object({ address: z.string() }),
    func: async ({ address }) => {
      const result = await isMinter(address);
      return result;
    },
  });

export const createFaucetWithdrawalAmountTool = () =>
  new DynamicStructuredTool({
    name: 'faucet_withdrawal_amount',
    description: `
    Get the withdrawal amount for the faucet contract on the Auto EVM Autonomy Network.
    USE THIS WHEN:
    - You need to know the amount of tokens the faucet is set to dispatch.
    `,
    schema: z.object({}),
    func: async () => {
      const result = await withdrawalAmount();
      return result;
    },
  });

export const createFaucetRequestTokensTool = () =>
  new DynamicStructuredTool({
    name: 'faucet_request_tokens',
    description: `
    Send a token request to the faucet contract on the Auto EVM Autonomy Network.
    USE THIS WHEN:
    - You need to request tokens for your wallet.
    - You need to request tokens for a different wallet.
    `,
    schema: z.object({ address: z.string() }),
    func: async ({ address }) => {
      const result = await requestTokens(address);
      return result;
    },
  });

export const createAllFaucetTools = () => {
  const faucetLockTimeTool = createFaucetLockTimeTool();
  const faucetNextAccessTimeTool = createFaucetNextAccessTimeTool();
  const faucetIsMinterTool = createFaucetIsMinterTool();
  const faucetWithdrawalAmountTool = createFaucetWithdrawalAmountTool();
  const faucetRequestTokensTool = createFaucetRequestTokensTool();

  return [
    faucetLockTimeTool,
    faucetNextAccessTimeTool,
    faucetIsMinterTool,
    faucetWithdrawalAmountTool,
    faucetRequestTokensTool,
  ];
};
