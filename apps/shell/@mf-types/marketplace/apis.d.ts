
    export type RemoteKeys = 'marketplace/App';
    type PackageType<T> = T extends 'marketplace/App' ? typeof import('marketplace/App') :any;