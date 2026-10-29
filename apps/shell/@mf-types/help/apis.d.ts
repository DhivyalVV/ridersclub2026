
    export type RemoteKeys = 'help/App';
    type PackageType<T> = T extends 'help/App' ? typeof import('help/App') :any;