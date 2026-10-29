/// <reference types="vite/client" />

declare module 'community/App' {
  import type * as React from 'react';

  export interface CommunityRemoteAppProps {
    initialSection?: 'communities' | 'blogs';
  }

  export const CommunityRemoteApp: React.ComponentType<CommunityRemoteAppProps>;
  export default CommunityRemoteApp;
}

declare module 'rides/App' {
  import type * as React from 'react';

  export const RidesRemoteApp: React.ComponentType;
  export default RidesRemoteApp;
}

declare module 'help/App' {
  import type * as React from 'react';

  export const HelpRemoteApp: React.ComponentType;
  export default HelpRemoteApp;
}

declare module 'mechanics/App' {
  import type * as React from 'react';

  export const MechanicsRemoteApp: React.ComponentType;
  export default MechanicsRemoteApp;
}

declare module 'garage/App' {
  import type * as React from 'react';

  export const GarageRemoteApp: React.ComponentType;
  export default GarageRemoteApp;
}

declare module 'marketplace/App' {
  import type * as React from 'react';

  export const MarketplaceRemoteApp: React.ComponentType;
  export default MarketplaceRemoteApp;
}
