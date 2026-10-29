import { Injectable } from '@nestjs/common';
import type { RideRoutePreview } from '@ridersclub/types';

export interface RouteMapProvider {
  buildRoutePreview(params: {
    startLocation: string;
    destination: string;
    estimatedDistanceKm?: number;
    estimatedDurationMinutes?: number;
  }): RideRoutePreview;
}

export const ROUTE_MAP_PROVIDER_TOKEN = 'ROUTE_MAP_PROVIDER';

@Injectable()
export class OpenStreetMapRouteAdapter implements RouteMapProvider {
  buildRoutePreview(params: {
    startLocation: string;
    destination: string;
    estimatedDistanceKm?: number;
    estimatedDurationMinutes?: number;
  }): RideRoutePreview {
    const startTrimmed = params.startLocation.trim();
    const destTrimmed = params.destination.trim();

    const estimatedDistanceKm =
      params.estimatedDistanceKm ??
      Math.max(35, Math.min(450, (startTrimmed.length + destTrimmed.length) * 3));
    const estimatedDurationMinutes =
      params.estimatedDurationMinutes ?? Math.round((estimatedDistanceKm / 55) * 60);

    const query = encodeURIComponent(`${startTrimmed} to ${destTrimmed}`);

    return {
      providerName: 'OpenStreetMap / OSRM Route Adapter',
      startAddress: startTrimmed,
      destinationAddress: destTrimmed,
      estimatedDistanceKm,
      estimatedDurationMinutes,
      waypoints: [
        `Assembly & Safety Briefing: ${startTrimmed}`,
        'Mid-Route Fuel & Hydration Checkpoint',
        `Final Destination: ${destTrimmed}`,
      ],
      mapExternalUrl: `https://www.openstreetmap.org/search?query=${query}`,
    };
  }
}

