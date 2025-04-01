import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { isAddress, ethers } from 'ethers';
import {
  isMinter,
  nextAccessTime,
  requestTokens,
  verifyFaucetBalance,
  withdrawalAmount,
} from './taurusFaucet.js';

export const createFaucetRequestTokensTool = (
  provider: ethers.JsonRpcProvider,
  wallet: ethers.Wallet,
) =>
  new DynamicStructuredTool({
    name: 'faucet_request_tokens',
    description: `
    Send a token request to the faucet contract on the Auto EVM Autonomys Network.
    USE THIS WHEN:
    - You need to request tokens for your wallet.
    - You need to request tokens for a different wallet.
    `,
    schema: z.object({ address: z.string() }),
    func: async ({ address }) => {
      if (!address)
        return {
          success: false,
          message: `You need to provide an address to request tokens.`,
        };
      if (!isAddress(address))
        return {
          success: false,
          message: `The provided address is not a valid Ethereum address.`,
        };

      const currentTime = BigInt(Math.floor(Date.now() / 1000));

      const [faucetBalance, nextAccessTimeForAddress, isMinterForAddress, currentWithdrawalAmount] =
        await Promise.all([
          verifyFaucetBalance(provider),
          nextAccessTime(address, wallet),
          isMinter(wallet),
          withdrawalAmount(wallet),
        ]);

      if (currentTime <= nextAccessTimeForAddress) {
        if (!isMinterForAddress)
          return {
            success: false,
            message: `You are not a minter for the faucet contract on the Auto EVM Autonomys Network.`,
          };

        if (faucetBalance < currentWithdrawalAmount)
          return {
            success: false,
            message: `Faucet balance is too low, please wait for refill`,
          };

        return await requestTokens(address, wallet);
      } else {
        const timeToWait = nextAccessTimeForAddress - currentTime;
        const formattedTime = timeToWait.toString();
        return {
          success: false,
          message: `You have to wait ${formattedTime} seconds before requesting tokens again.`,
        };
      }
    },
  });
