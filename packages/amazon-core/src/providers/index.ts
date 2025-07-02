/**
 * Amazon API providers
 * Following AI SDK provider patterns
 */

// Re-export provider interface types only
export type {
	AdvertisingProvider as IAdvertisingProvider,
	APIResponse,
	AssociatesProvider as IAssociatesProvider,
	BaseAmazonProvider,
	BrandAnalyticsProvider as IBrandAnalyticsProvider,
	DSPProvider as IDSPProvider,
	RequestOptions,
	SPAPIProvider as ISPAPIProvider,
} from "../types/provider";
export { AdvertisingProvider } from "./advertising";
export { AssociatesProvider } from "./associates";
export type { AttributionProvider } from "./attribution";
export { AttributionProviderImpl } from "./attribution";
export { BrandAnalyticsProvider } from "./brand-analytics";
export { DSPProvider } from "./dsp";
export type { SearchPerformanceProvider } from "./search-performance";
export { createSearchPerformanceProvider } from "./search-performance";
export { SPAPIProvider } from "./sp-api";
