/**
 * Amazon API providers
 * Following AI SDK provider patterns
 */

// Re-export provider types
export type {
	AdvertisingConfig,
	AdvertisingProvider as IAdvertisingProvider,
	APIResponse,
	AssociatesConfig,
	AssociatesProvider as IAssociatesProvider,
	BaseAmazonProvider,
	BrandAnalyticsConfig,
	BrandAnalyticsProvider as IBrandAnalyticsProvider,
	DSPConfig,
	DSPProvider as IDSPProvider,
	RequestOptions,
	SPAPIConfig,
	SPAPIProvider as ISPAPIProvider,
} from "../types/provider";
export { AdvertisingProvider } from "./advertising";
export { AssociatesProvider } from "./associates";
export { AttributionProvider, AttributionProviderImpl } from "./attribution";
export { BrandAnalyticsProvider } from "./brand-analytics";
export { DSPProvider } from "./dsp";
export {
	createSearchPerformanceProvider,
	SearchPerformanceProvider,
} from "./search-performance";
export { SPAPIProvider } from "./sp-api";
