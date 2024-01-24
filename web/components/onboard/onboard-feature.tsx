'use client';

import { useWallet } from '@solana/wallet-adapter-react';

export default function OnboardFeature() {
  const { publicKey } = useWallet();
  console.log(publicKey);

  return <div>{publicKey ? publicKey.toString() : ''}</div>;
}
