import * as React from 'react';

export interface RouteSeoMetadata {
  title: string;
  description: string;
  robots: 'index, follow' | 'noindex, nofollow';
  canonicalPath: string;
}

export const RIDERSCLUB_SEO_UPDATE_EVENT = 'ridersclub:seo-update';

export interface SeoUpdateEventDetail {
  title?: string;
  description?: string;
  canonicalPath?: string;
  robots?: 'index, follow' | 'noindex, nofollow';
}

const DEFAULT_SEO: RouteSeoMetadata = {
  title: 'RidersClub — Community Platform for Vehicle Owners & Riders',
  description:
    'RidersClub is the community platform for vehicle owners and riders — join riding communities, discover group rides, read rider news, find verified mechanics, and buy or sell pre-owned vehicles.',
  robots: 'index, follow',
  canonicalPath: '/',
};

const ROUTE_SEO_RULES: Array<{
  matches: (pathname: string) => boolean;
  meta: Omit<RouteSeoMetadata, 'canonicalPath'>;
}> = [
  {
    matches: (p) => p === '/' || p.startsWith('/communities'),
    meta: {
      title: 'Riding Communities & Clubs — RidersClub',
      description:
        'Discover and join verified riding communities, touring clubs, and mechanic guilds across India on RidersClub.',
      robots: 'index, follow',
    },
  },
  {
    matches: (p) => p.startsWith('/news'),
    meta: {
      title: 'Rider News & Guides — RidersClub',
      description:
        'Read touring guides, high-altitude riding tips, pre-purchase inspection checklists, and motorcycle maintenance articles.',
      robots: 'index, follow',
    },
  },
  {
    matches: (p) => p.startsWith('/rides'),
    meta: {
      title: 'Group Rides & Touring Events — RidersClub',
      description:
        'Browse upcoming group rides, weekend breakfast runs, and long-distance touring events organized by fellow riders.',
      robots: 'index, follow',
    },
  },
  {
    matches: (p) => p.startsWith('/help'),
    meta: {
      title: 'Roadside Help & Breakdown Assistance — RidersClub',
      description:
        'Request or offer peer-to-peer roadside assistance for flat tires, battery jump-starts, fuel, and mechanical breakdowns.',
      robots: 'index, follow',
    },
  },
  {
    matches: (p) => p.startsWith('/mechanics'),
    meta: {
      title: 'Verified Mechanics & Workshops Directory — RidersClub',
      description:
        'Find admin-verified motorcycle and vehicle workshops, specialist mechanics, and service centers near your city.',
      robots: 'index, follow',
    },
  },
  {
    matches: (p) => p.startsWith('/marketplace'),
    meta: {
      title: 'Secondhand Vehicles Marketplace — RidersClub',
      description:
        'Buy and sell pre-owned motorcycles and vehicles directly with verified community riders and transparent service history.',
      robots: 'index, follow',
    },
  },
  {
    matches: (p) => p.startsWith('/garage'),
    meta: {
      title: 'My Private Garage — RidersClub',
      description: 'Manage your private vehicles, odometer logs, and service history.',
      robots: 'noindex, nofollow',
    },
  },
  {
    matches: (p) => p.startsWith('/profile'),
    meta: {
      title: 'Rider Profile — RidersClub',
      description: 'View and manage your RidersClub account and rider profile.',
      robots: 'noindex, nofollow',
    },
  },
  {
    matches: (p) => p.startsWith('/auth'),
    meta: {
      title: 'Sign In — RidersClub',
      description: 'Sign in to your RidersClub account.',
      robots: 'noindex, nofollow',
    },
  },
  {
    matches: (p) => p.startsWith('/admin'),
    meta: {
      title: 'Admin & Safety Moderation — RidersClub',
      description: 'Moderation and verification workspace for RidersClub administrators.',
      robots: 'noindex, nofollow',
    },
  },
];

export function resolveRouteSeo(pathname: string): RouteSeoMetadata {
  const normalized = pathname.trim() || '/';
  const matched = ROUTE_SEO_RULES.find((rule) => rule.matches(normalized));
  if (matched) {
    return {
      ...matched.meta,
      canonicalPath: normalized,
    };
  }

  return {
    title: 'Page Not Found — RidersClub',
    description: DEFAULT_SEO.description,
    robots: 'noindex, nofollow',
    canonicalPath: normalized,
  };
}

function upsertMetaTag(
  selectorAttr: 'name' | 'property',
  attrValue: string,
  content: string,
): void {
  let element = document.head.querySelector<HTMLMetaElement>(
    `meta[${selectorAttr}="${attrValue}"]`,
  );
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(selectorAttr, attrValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function upsertCanonicalLink(href: string): void {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

export function applyDocumentSeo(meta: RouteSeoMetadata): void {
  if (typeof document === 'undefined') return;

  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : '';
  const canonicalUrl = `${origin}${meta.canonicalPath}`;

  document.title = meta.title;
  upsertMetaTag('name', 'description', meta.description);
  upsertMetaTag('name', 'robots', meta.robots);
  upsertMetaTag('property', 'og:title', meta.title);
  upsertMetaTag('property', 'og:description', meta.description);
  upsertMetaTag('property', 'og:url', canonicalUrl);
  upsertMetaTag('name', 'twitter:title', meta.title);
  upsertMetaTag('name', 'twitter:description', meta.description);
  upsertCanonicalLink(canonicalUrl);
}

export function useRouteSeo(pathname: string): void {
  React.useEffect(() => {
    applyDocumentSeo(resolveRouteSeo(pathname));
  }, [pathname]);

  React.useEffect(() => {
    function handleSeoUpdate(event: Event): void {
      const detail = (event as CustomEvent<SeoUpdateEventDetail>).detail;
      if (!detail) return;
      const base = resolveRouteSeo(pathname);
      applyDocumentSeo({
        title: detail.title ?? base.title,
        description: detail.description ?? base.description,
        robots: detail.robots ?? base.robots,
        canonicalPath: detail.canonicalPath ?? base.canonicalPath,
      });
    }

    window.addEventListener(RIDERSCLUB_SEO_UPDATE_EVENT, handleSeoUpdate);
    return () => {
      window.removeEventListener(RIDERSCLUB_SEO_UPDATE_EVENT, handleSeoUpdate);
    };
  }, [pathname]);
}
