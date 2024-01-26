/* eslint-disable no-useless-catch */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';

/*
  Compute the Solana explorer address for the various data
*/
export function explorerURL({
  address,
  txSignature,
  cluster,
}: {
  address?: string;
  txSignature?: string;
  cluster?: 'devnet' | 'testnet' | 'mainnet' | 'mainnet-beta';
}) {
  let baseUrl: string;
  //
  if (address) baseUrl = `https://explorer.solana.com/address/${address}`;
  else if (txSignature)
    baseUrl = `https://explorer.solana.com/tx/${txSignature}`;
  else return '[unknown]';

  // auto append the desired search params
  const url = new URL(baseUrl);
  url.searchParams.append('cluster', cluster || 'devnet');
  return url.toString() + '\n';
}

/**
 * Auto airdrop the given wallet of of a balance of < 0.5 SOL
 */
export async function airdropOnLowBalance(
  connection: Connection,
  keypair: Keypair,
  forceAirdrop: boolean = false
) {
  // get the current balance
  const balance = await connection.getBalance(keypair.publicKey);

  // define the low balance threshold before airdrop
  const MIN_BALANCE_TO_AIRDROP = LAMPORTS_PER_SOL / 2; // current: 0.5 SOL

  // check the balance of the two accounts, airdrop when low
  if (forceAirdrop === true || balance < MIN_BALANCE_TO_AIRDROP) {
    console.log(
      `Requesting airdrop of 1 SOL to ${keypair.publicKey.toBase58()}...`
    );
    await connection
      .requestAirdrop(keypair.publicKey, LAMPORTS_PER_SOL)
      .then((sig) => {
        console.log('Tx signature:', sig);
        // balance = balance + LAMPORTS_PER_SOL;
      });

    // fetch the new balance
    // const newBalance = await connection.getBalance(keypair.publicKey);
    // return newBalance;
  }
  // else console.log("Balance of:", balance / LAMPORTS_PER_SOL, "SOL");

  return balance;
}

/*
  Helper function to extract a transaction signature from a failed transaction's error message
*/
export async function extractSignatureFromFailedTransaction(
  connection: Connection,
  err: any,
  fetchLogs?: boolean
) {
  if (err?.signature) return err.signature;

  // extract the failed transaction's signature
  const failedSig = new RegExp(
    /^((.*)?Error: )?(Transaction|Signature) ([A-Z0-9]{32,}) /gim
  ).exec(err?.message?.toString())?.[4];

  // ensure a signature was found
  if (failedSig) {
    // when desired, attempt to fetch the program logs from the cluster
    if (fetchLogs)
      await connection
        .getTransaction(failedSig, {
          maxSupportedTransactionVersion: 0,
        })
        .then((tx) => {
          console.log(`\n==== Transaction logs for ${failedSig} ====`);
          console.log(explorerURL({ txSignature: failedSig }), '');
          console.log(
            tx?.meta?.logMessages ?? 'No log messages provided by RPC'
          );
          console.log(`==== END LOGS ====\n`);
        });
    else {
      console.log('\n========================================');
      console.log(explorerURL({ txSignature: failedSig }));
      console.log('========================================\n');
    }
  }

  // always return the failed signature value
  return failedSig;
}

/*
  Standard number formatter
*/
export function numberFormatter(num: number, forceDecimals = false) {
  // set the significant figures
  const minimumFractionDigits = num < 1 || forceDecimals ? 10 : 2;

  // do the formatting
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits,
  }).format(num);
}

/*
  Display a separator in the console, with our without a message
*/
export function printConsoleSeparator(message?: string) {
  console.log('\n===============================================');
  console.log('===============================================\n');
  if (message) console.log(message);
}

/**
 * Helper function to build a signed transaction
 */
export async function buildTransaction({
  connection,
  payer,
  signers,
  instructions,
}: {
  connection: Connection;
  payer: PublicKey;
  signers: Keypair[];
  instructions: TransactionInstruction[];
}): Promise<VersionedTransaction> {
  const blockhash = await connection
    .getLatestBlockhash()
    .then((res) => res.blockhash);

  const messageV0 = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();
  const tx = new VersionedTransaction(messageV0);

  signers.forEach((s) => tx.sign([s]));

  return tx;
}
