import * as React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './button.js';

export interface RemoteErrorBoundaryProps {
  remoteName: string;
  remoteUrl?: string;
  children: React.ReactNode;
}

interface RemoteErrorBoundaryState {
  hasError: boolean;
  errorMessage: string | null;
}

export class RemoteErrorBoundary extends React.Component<
  RemoteErrorBoundaryProps,
  RemoteErrorBoundaryState
> {
  constructor(props: RemoteErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: null,
    };
  }

  static getDerivedStateFromError(error: unknown): RemoteErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error instanceof Error ? error.message : 'Failed to load remote module.',
    };
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, errorMessage: null });
  };

  override render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50/80 p-6 text-slate-900 shadow-sm"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-slate-900">
                {this.props.remoteName} Micro-Frontend Unavailable
              </h3>
              <p className="mt-1 text-sm text-slate-700">
                The Shell application is running normally, but the federated remote module could not
                be loaded. Verify that the remote server is running and reachable.
              </p>
              {this.props.remoteUrl && (
                <p className="mt-2 font-mono text-xs text-slate-600">
                  Remote Entry: {this.props.remoteUrl}
                </p>
              )}
              {this.state.errorMessage && (
                <p className="mt-1 font-mono text-xs text-amber-900">
                  Reason: {this.state.errorMessage}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-3">
                <Button variant="default" size="sm" onClick={this.handleRetry}>
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  Retry Module
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

