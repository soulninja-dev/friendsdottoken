'use client';

import { AppHero } from '../ui/ui-layout';
import { MintList } from './onboard-ui';

export default function OnboardFeature() {
  return (
    <>
      {/* todo:
    - show a list of mints they own, then dropdown when clicked
    - option to create tokenmints
    - "choose token to gate"
    - mint more tokens under mint so that more people can sub?
      ( need a permissionless way of doing this, but im unsure how unless the platform has mintAuthority, in which case i can't query unless i store the chosen mint offchain? )

    */}

      <AppHero title={'Your Mints'} subtitle="">
        <div className="my-4">
          <MintList />
        </div>
      </AppHero>
    </>
  );
}
