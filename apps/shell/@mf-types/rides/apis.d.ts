
    export type RemoteKeys = 'rides/App';
    type PackageType<T> = T extends 'rides/App' ? typeof import('rides/App') :any;