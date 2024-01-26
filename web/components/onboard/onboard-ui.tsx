'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
  useGetTokenAccounts,
  useTransferSol,
} from '../account/account-data-access';
import { useMemo, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import * as web3 from '@solana/web3.js';
import { IconRefresh } from '@tabler/icons-react';
import { AccountTokenBalance } from '../account/account-ui';
import { ExplorerLink } from '../cluster/cluster-ui';
import { AppModal, ellipsify } from '../ui/ui-layout';
import { useCreateMint } from './onboard-data-access';

export function MintList() {
  const { publicKey } = useWallet();
  if (!publicKey) {
    return <>pls connect wallet</>;
  }

  return <MintListUI address={publicKey} />;
}

export function MintListUI({ address }: { address: web3.PublicKey }) {
  const [showAll, setShowAll] = useState(false);
  // todo: write useGetMintableTokenAccounts
  const query = useGetTokenAccounts({ address });
  const client = useQueryClient();
  const items = useMemo(() => {
    if (showAll) return query.data;
    return query.data?.slice(0, 5);
  }, [query.data, showAll]);

  const [showMintTokenModal, setMintTokenModal] = useState(false);
  const [showCreateMintModal, setCreateMintModal] = useState(false);

  return (
    <div className="space-y-2">
      <div className="justify-center">
        <div className="flex justify-between">
          <h2 className="text-2xl font-bold">Mints</h2>
          <div className="space-x-2">
            {query.isLoading ? (
              <span className="loading loading-spinner"></span>
            ) : (
              <button
                className="btn btn-sm btn-outline"
                onClick={async () => {
                  await query.refetch();
                  await client.invalidateQueries({
                    queryKey: ['getTokenAccountBalance'],
                  });
                }}
              >
                <IconRefresh size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
      {query.isError && (
        <pre className="alert alert-error">
          Error: {query.error?.message.toString()}
        </pre>
      )}
      {query.isSuccess && (
        <div>
          {query.data.length === 0 ? (
            <div>No Mints found.</div>
          ) : (
            <table className="table border-4 rounded-lg border-separate border-base-300">
              <thead>
                <tr>
                  <th>Mint Address</th>
                  <th>Name</th>
                  <th className="text-right">Supply</th>
                  <th>Mint tokens</th>
                </tr>
              </thead>
              <tbody>
                {/* change params to mintAddress and Name */}
                {items?.map(({ account, pubkey }) => (
                  <tr key={pubkey.toString()}>
                    <td>
                      <div className="flex">
                        <span className="font-mono">
                          <ExplorerLink
                            label={ellipsify(pubkey.toString())}
                            path={`account/${pubkey.toString()}`}
                          />
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex">
                        <span className="font-mono">
                          <p>{account.owner.toString()}</p>
                        </span>
                      </div>
                    </td>
                    <td className="text-right">
                      <span className="font-mono">
                        {/* change to token mint supply */}
                        <AccountTokenBalance address={pubkey} />
                      </span>
                    </td>
                    <td>
                      {/* button which invokes that modal */}
                      <button
                        disabled={!address}
                        className="btn btn-md lg:btn-md"
                        onClick={() => setMintTokenModal(true)}
                      >
                        mint
                      </button>
                      <ModalMintToken
                        address={address}
                        show={showMintTokenModal}
                        hide={() => setMintTokenModal(false)}
                      />
                    </td>
                  </tr>
                ))}
                {/* create mint button and modal */}
                <tr>
                  <td className="p-5">
                    <button
                      disabled={!address}
                      className="btn btn-md lg:btn-md p-5 text-center"
                      onClick={() => setCreateMintModal(true)}
                    >
                      Create
                    </button>
                    <ModalCreateMint
                      address={address}
                      show={showCreateMintModal}
                      hide={() => setCreateMintModal(false)}
                    />
                  </td>
                </tr>

                {(query.data?.length ?? 0) > 5 && (
                  <tr>
                    <td colSpan={4} className="text-center">
                      <button
                        className="btn btn-xs btn-outline"
                        onClick={() => setShowAll(!showAll)}
                      >
                        {showAll ? 'Show Less' : 'Show All'}
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function ModalMintToken({
  hide,
  show,
  address,
}: {
  hide: () => void;
  show: boolean;
  address: web3.PublicKey;
}) {
  //   const wallet = useWallet();
  const [amount, setAmount] = useState('1');
  // todo: change mutation to mint token
  const mutation = useTransferSol({ address });

  return (
    <AppModal
      hide={hide}
      show={show}
      title="Adjust Supply"
      // submitDisabled={!destination || !amount || mutation.isPending}
      submitDisabled={!amount}
      submitLabel="Mint"
      submit={() => {
        mutation
          .mutateAsync({
            destination: new web3.PublicKey(address),
            amount: parseFloat(amount),
          })
          .then(() => hide());
      }}
    >
      <input
        disabled={mutation.isPending}
        type="number"
        step="any"
        min="1"
        placeholder="Amount"
        className="input input-bordered w-full"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
    </AppModal>
  );
}

function ModalCreateMint({
  hide,
  show,
  address,
}: {
  hide: () => void;
  show: boolean;
  address: web3.PublicKey;
}) {
  //   const wallet = useWallet();
  // todo: change mutation to create mint
  const mutation = useCreateMint({ address });

  return (
    <AppModal
      hide={hide}
      show={show}
      title="Create New Mint"
      // submitDisabled={!destination || !amount || mutation.isPending}
      submitLabel="Create"
      submit={() => {
        mutation
          .mutateAsync({
            amount: 100,
            name: 'GOLD',
            symbol: 'GOLD',
            uri: 'soulninja.eth',
          })
          .then(() => hide());
      }}
    >
      <p>
        This creates a new Token Mint from which tokens can be minted and
        transferred!
      </p>
    </AppModal>
  );
}
