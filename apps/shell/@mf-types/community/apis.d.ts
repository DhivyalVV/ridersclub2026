
    export type RemoteKeys = 'community/App';
    type PackageType<T> = T extends 'community/App' ? typeof import('community/App') :any;