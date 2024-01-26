'use client';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import { useAddressToast, useTransactionToast } from '../ui/ui-layout';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeMint2Instruction,
  createMintToCheckedInstruction,
  getAssociatedTokenAddress,
  getMinimumBalanceForRentExemptMint,
} from '@solana/spl-token';
import toast from 'react-hot-toast';
import { explorerURL } from '@/utils/helpers';

export function useCreateMint({ address }: { address: PublicKey }) {
  const { connection } = useConnection();
  const addressToast = useAddressToast();
  const { publicKey, sendTransaction } = useWallet();
  const client = useQueryClient();

  return useMutation({
    mutationKey: [
      'create-token-mint',
      { endpoint: connection.rpcEndpoint, address },
    ],
    mutationFn: async (input: {
      amount: number;
      name: string;
      symbol: string;
      uri: string;
    }) => {
      try {
        if (publicKey != address) {
          return;
        }

        const mintKeypair = Keypair.generate();

        const tokenConfig = {
          decimals: 2,
          name: input.name,
          symbol: input.symbol,
          uri: input.uri,
        };

        const lamports = await getMinimumBalanceForRentExemptMint(connection);

        const createMintAccountInstruction = SystemProgram.createAccount({
          fromPubkey: address,
          newAccountPubkey: mintKeypair.publicKey,
          space: MINT_SIZE,
          lamports,
          programId: TOKEN_PROGRAM_ID,
        });

        const initializeMintInstruction = createInitializeMint2Instruction(
          mintKeypair.publicKey,
          tokenConfig.decimals,
          address,
          address,
          TOKEN_PROGRAM_ID
        );

        const sig = await sendTransaction(
          new Transaction().add(
            createMintAccountInstruction,
            initializeMintInstruction
          ),
          connection,
          {
            signers: [mintKeypair],
          }
        );

        // print the explorer url
        console.log('Transaction completed.');
        console.log(explorerURL({ txSignature: sig }));

        return mintKeypair.publicKey;
      } catch (err) {
        console.error('Failed to send transaction:');
        return;
      }
    },
    onSuccess: (signature) => {
      if (signature) {
        addressToast(signature.toString());
      }
      return Promise.all([
        client.invalidateQueries({
          queryKey: [
            'get-mintable-token-accounts',
            { endpoint: connection.rpcEndpoint, address },
          ],
        }),
      ]);
    },
    onError: (error) => {
      toast.error(`Transaction failed! ${error}`);
    },
  });
}

export function useMintToken({ address }: { address: PublicKey }) {
  const { connection } = useConnection();
  const transactionToast = useTransactionToast();
  const { publicKey, sendTransaction } = useWallet();
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['mint-token', { endpoint: connection.rpcEndpoint, address }],
    mutationFn: async (input: { amount: number; mint: string; to: string }) => {
      try {
        if (publicKey != address) {
          return;
        }

        const MINT_ADDRESS = new PublicKey(input.mint);
        const TO_ADDRESS = new PublicKey(input.to);

        const ATA = await getAssociatedTokenAddress(
          MINT_ADDRESS,
          TO_ADDRESS,
          false,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        );

        const transaction = new Transaction().add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            ATA,
            TO_ADDRESS,
            MINT_ADDRESS,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          ),
          createMintToCheckedInstruction(
            MINT_ADDRESS,
            ATA,
            address,
            100e2, // amount. if your decimals is 8, you mint 10^8 for 1 token.
            2
          )
        );

        const sig = await sendTransaction(transaction, connection);
        return sig;
      } catch (err) {
        console.error('Failed to send transaction:');
        return;
      }
    },
    onSuccess: (signature) => {
      if (signature) {
        transactionToast(signature.toString());
      }
      return Promise.all([
        client.invalidateQueries({
          queryKey: [
            'get-mintable-token-accounts',
            { endpoint: connection.rpcEndpoint, address },
          ],
        }),
      ]);
    },
    onError: (error) => {
      toast.error(`Transaction failed! ${error}`);
    },
  });
}
