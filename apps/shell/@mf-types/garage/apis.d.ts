
    export type RemoteKeys = 'garage/App';
    type PackageType<T> = T extends 'garage/App' ? typeof import('garage/App') :any;