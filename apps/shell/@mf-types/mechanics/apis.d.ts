
    export type RemoteKeys = 'mechanics/App';
    type PackageType<T> = T extends 'mechanics/App' ? typeof import('mechanics/App') :any;