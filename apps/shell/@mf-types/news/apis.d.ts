
    export type RemoteKeys = 'news/App';
    type PackageType<T> = T extends 'news/App' ? typeof import('news/App') :any;