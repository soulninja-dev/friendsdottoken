// 'use client';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import { useTransactionToast } from '../ui/ui-layout';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createInitializeMint2Instruction,
  getMinimumBalanceForRentExemptMint,
} from '@solana/spl-token';
import toast from 'react-hot-toast';
import { explorerURL } from '@/utils/helpers';

// import {
//   MINT_SIZE,
//   TOKEN_PROGRAM_ID,
//   createInitializeMintInstruction,
//   getMinimumBalanceForRentExemptMint,
// } from '@solana/spl-token';

// import { useConnection, useWallet } from '@solana/wallet-adapter-react';

// import * as web3 from '@solana/web3.js';
// import { useTransactionToast } from '../ui/ui-layout';

// // create a mint and set mint sig and address
// export function useCreateMint = async (event) => {
//   const { connection } = useConnection();
//   const transactionToast = useTransactionToast();
//   event.preventDefault();
//   if (!connection || !publicKey) {
//     return;
//   }

//   const mint = web3.Keypair.generate();

//   const lamports = await getMinimumBalanceForRentExemptMint(connection);

//   const transaction = new web3.Transaction();

//   transaction.add(
//     web3.SystemProgram.createAccount({
//       fromPubkey: publicKey,
//       newAccountPubkey: mint.publicKey,
//       space: MINT_SIZE,
//       lamports,
//       programId: TOKEN_PROGRAM_ID,
//     }),
//     createInitializeMintInstruction(
//       mint.publicKey,
//       0,
//       publicKey,
//       publicKey,
//       TOKEN_PROGRAM_ID
//     )
//   );

//   sendTransaction(transaction, connection, {
//     signers: [mint],
//   }).then((sig) => {
//     setTxSig(sig);
//     setMint(mint.publicKey.toString());
//   });
// };

// export function useGetMintableTokenAccounts({
//   address,
// }: {
//   address: PublicKey;
// }) {
//   const { connection } = useConnection();

//   return useQuery({
//     queryKey: [
//       'get-mintable-token-accounts',
//       { endpoint: connection.rpcEndpoint, address },
//     ],
//     queryFn: async () => {
//       const [tokenAccounts, token2022Accounts] = await Promise.all([
//         connection.T(address, {
//           programId: TOKEN_PROGRAM_ID,
//         }),
//         connection.getParsedTokenAccountsByOwner(address, {
//           programId: TOKEN_2022_PROGRAM_ID,
//         }),
//       ]);
//       return [...tokenAccounts.value, ...token2022Accounts.value];
//     },
//   });
// }

export function useCreateMint({ address }: { address: PublicKey }) {
  const { connection } = useConnection();
  const transactionToast = useTransactionToast();
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

        // metadata ix
        // // derive the pda address for the Metadata account
        // const metadataAccount = PublicKey.findProgramAddressSync(
        //   [
        //     Buffer.from('metadata'),
        //     METADATA_PROGRAM_ID.toBuffer(),
        //     mintKeypair.publicKey.toBuffer(),
        //   ],
        //   METADATA_PROGRAM_ID
        // )[0];

        // createaccount instruction for the mint's Metadata account
        // const createMetadataInstruction =
        //   createCreateMetadataAccountV3Instruction(
        //     {
        //       metadata: metadataAccount,
        //       mint: mintKeypair.publicKey,
        //       mintAuthority: payer.publicKey,
        //       payer: payer.publicKey,
        //       updateAuthority: payer.publicKey,
        //     },
        //     {
        //       createMetadataAccountArgsV3: {
        //         data: {
        //           creators: null,
        //           name: tokenConfig.name,
        //           symbol: tokenConfig.symbol,
        //           uri: tokenConfig.uri,
        //           sellerFeeBasisPoints: 0,
        //           collection: null,
        //           uses: null,
        //         },
        //         // `collectionDetails` - for non-nft type tokens, normally set to `null` to not have a value set
        //         collectionDetails: null,
        //         // should the metadata be updatable?
        //         isMutable: true,
        //       },
        //     }
        //   );

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
