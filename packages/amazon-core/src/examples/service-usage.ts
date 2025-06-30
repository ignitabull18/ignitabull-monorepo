/**
 * Example usage of the unified Amazon service
 * Demonstrates cross-provider functionality and service orchestration
 */

import type { AmazonServiceConfig } from "../services/amazon-service";
import { AmazonService } from "../services/amazon-service";

/**
 * Example: Initialize Amazon service with all providers
 */
async function initializeAmazonService(): Promise<AmazonService> {
	const config: AmazonServiceConfig = {
		spApi: {
			clientId: process.env.AMAZON_SP_CLIENT_ID!,
			clientSecret: process.env.AMAZON_SP_CLIENT_SECRET!,
			refreshToken: process.env.AMAZON_SP_REFRESH_TOKEN!,
			lwaClientId: process.env.AMAZON_LWA_CLIENT_ID!,
			lwaClientSecret: process.env.AMAZON_LWA_CLIENT_SECRET!,
			region: "us-east-1",
		},
		advertising: {
			clientId: process.env.AMAZON_ADV_CLIENT_ID!,
			clientSecret: process.env.AMAZON_ADV_CLIENT_SECRET!,
			refreshToken: process.env.AMAZON_ADV_REFRESH_TOKEN!,
			profileId: process.env.AMAZON_ADV_PROFILE_ID!,
			region: "us-east-1",
		},
		associates: {
			accessKey: process.env.AMAZON_ASSOCIATES_ACCESS_KEY!,
			secretKey: process.env.AMAZON_ASSOCIATES_SECRET_KEY!,
			partnerTag: process.env.AMAZON_ASSOCIATES_PARTNER_TAG!,
			region: "us-east-1",
		},
		globalConfig: {
			debug: process.env.NODE_ENV === "development",
			timeout: 30000,
			retry: {
				maxRetries: 3,
				baseDelay: 1000,
				maxDelay: 30000,
				backoffMultiplier: 2,
				retryableStatuses: [429, 500, 502, 503, 504],
				retryableErrors: ["ECONNRESET", "ETIMEDOUT", "ENOTFOUND"],
			},
		},
	};

	const amazonService = new AmazonService(config);
	await amazonService.initialize();

	return amazonService;
}

/**
 * Example: Get comprehensive product insights
 */
async function getProductInsights(amazonService: AmazonService, asin: string) {
	console.log(`\n🔍 Getting comprehensive insights for ASIN: ${asin}`);

	try {
		const insights = await amazonService.getProductInsights(asin);

		console.log("📊 Product Insights:");
		console.log(`- ASIN: ${insights.asin}`);
		console.log(`- Last Updated: ${insights.lastUpdated}`);

		// SP-API data
		if (insights.spApiData) {
			console.log("\n📦 SP-API Data:");
			console.log(`- Inventory Status: ${insights.spApiData.inventoryStatus}`);
			if (insights.spApiData.catalogInfo) {
				console.log(
					`- Title: ${insights.spApiData.catalogInfo.summaries?.[0]?.itemName}`,
				);
			}
		}

		// Advertising data
		if (insights.advertisingData) {
			console.log("\n📢 Advertising Data:");
			console.log(`- Is Advertised: ${insights.advertisingData.isAdvertised}`);
			console.log(
				`- Campaigns: ${insights.advertisingData.campaigns?.length || 0}`,
			);
			if (insights.advertisingData.performance) {
				console.log(`- ACOS: ${insights.advertisingData.performance.acos}%`);
			}
		}

		// Associates data
		if (insights.associatesData) {
			console.log("\n🔗 Associates Data:");
			console.log(
				`- Title: ${insights.associatesData.productInfo?.ItemInfo?.Title?.DisplayValue}`,
			);
			console.log(`- Rating: ${insights.associatesData.rating}/5`);
			console.log(`- Reviews: ${insights.associatesData.reviewCount}`);
			console.log(`- Affiliate Link: ${insights.associatesData.affiliateLink}`);
		}

		return insights;
	} catch (error) {
		console.error("❌ Failed to get product insights:", error);
		throw error;
	}
}

/**
 * Example: Health monitoring
 */
async function monitorServiceHealth(amazonService: AmazonService) {
	console.log("\n🏥 Checking service health...");

	try {
		const health = await amazonService.getHealthStatus();

		console.log(`Overall Status: ${health.status.toUpperCase()}`);
		console.log(`Last Checked: ${health.lastChecked}`);

		console.log("\nProvider Status:");
		health.providers.forEach((provider) => {
			const statusEmoji =
				provider.status === "healthy"
					? "✅"
					: provider.status === "degraded"
						? "⚠️"
						: "❌";
			console.log(`${statusEmoji} ${provider.providerId}: ${provider.status}`);
			if (provider.responseTime) {
				console.log(`   Response Time: ${provider.responseTime}ms`);
			}
			if (provider.message) {
				console.log(`   Message: ${provider.message}`);
			}
		});

		return health;
	} catch (error) {
		console.error("❌ Health check failed:", error);
		throw error;
	}
}

/**
 * Example: Cross-provider product search
 */
async function searchProducts(amazonService: AmazonService, keywords: string) {
	console.log(`\n🔎 Searching for products: "${keywords}"`);

	try {
		const searchResults = await amazonService.searchProducts({
			keywords,
			includeInventory: true,
			includeAdvertising: true,
			includeAssociates: true,
		});

		console.log(`Found ${searchResults.totalCount} products`);
		console.log(`Data sources: ${searchResults.sources.join(", ")}`);

		console.log("\nTop Results:");
		searchResults.results.slice(0, 5).forEach((result, index) => {
			console.log(`\n${index + 1}. ${result.title || "No title"}`);
			console.log(`   ASIN: ${result.asin}`);

			if (result.associatesData?.ItemInfo?.Features?.DisplayValues) {
				console.log(
					`   Features: ${result.associatesData.ItemInfo.Features.DisplayValues.slice(0, 2).join(", ")}`,
				);
			}

			if (result.associatesData?.Offers?.Listings?.[0]?.Price) {
				const price = result.associatesData.Offers.Listings[0].Price;
				console.log(`   Price: ${price.DisplayAmount}`);
			}

			if (result.associatesData?.CustomerReviews) {
				const reviews = result.associatesData.CustomerReviews;
				console.log(
					`   Rating: ${reviews.StarRating?.Value}/5 (${reviews.Count} reviews)`,
				);
			}
		});

		return searchResults;
	} catch (error) {
		console.error("❌ Product search failed:", error);
		throw error;
	}
}

/**
 * Example: Marketplace analytics
 */
async function getMarketplaceAnalytics(
	amazonService: AmazonService,
	marketplaceId: string,
) {
	console.log(`\n📈 Getting marketplace insights for: ${marketplaceId}`);

	try {
		const insights = await amazonService.getMarketplaceInsights(marketplaceId);

		console.log("📊 Marketplace Analytics:");

		// Order metrics
		if (insights.orderMetrics) {
			console.log("\n📦 Order Metrics (Last 30 days):");
			console.log(`- Total Orders: ${insights.orderMetrics.totalOrders}`);
			console.log(`- Revenue: $${insights.orderMetrics.revenue.toFixed(2)}`);
			console.log(
				`- Average Order Value: $${insights.orderMetrics.averageOrderValue.toFixed(2)}`,
			);
		}

		// Advertising metrics
		if (insights.advertisingMetrics) {
			console.log("\n📢 Advertising Metrics:");
			console.log(
				`- Total Spend: $${insights.advertisingMetrics.totalSpend.toFixed(2)}`,
			);
			console.log(
				`- Total Sales: $${insights.advertisingMetrics.totalSales.toFixed(2)}`,
			);
			console.log(`- ROAS: ${insights.advertisingMetrics.roas.toFixed(2)}x`);
			console.log(
				`- Active Campaigns: ${insights.advertisingMetrics.topPerformingCampaigns.length}`,
			);
		}

		return insights;
	} catch (error) {
		console.error("❌ Failed to get marketplace insights:", error);
		throw error;
	}
}

/**
 * Example: Direct provider access for advanced use cases
 */
async function advancedProviderUsage(amazonService: AmazonService) {
	console.log("\n🔧 Advanced provider usage examples...");

	// Direct SP-API access
	const spApiProvider = amazonService.getProvider("sp-api");
	if (spApiProvider) {
		console.log("\n📦 SP-API: Getting recent orders...");
		try {
			const orders = await spApiProvider.getOrders({
				marketplaceIds: ["ATVPDKIKX0DER"], // US marketplace
				createdAfter: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
				maxResultsPerPage: 10,
			});
			console.log(
				`Found ${orders.payload.Orders?.length || 0} orders in last 7 days`,
			);
		} catch (error) {
			console.warn("Could not fetch orders:", error);
		}
	}

	// Direct Advertising API access
	const advertisingProvider = amazonService.getProvider("advertising");
	if (advertisingProvider) {
		console.log("\n📢 Advertising: Getting active campaigns...");
		try {
			const campaigns = await advertisingProvider.getCampaigns({
				stateFilter: "enabled",
				count: 10,
			});
			console.log(`Found ${campaigns.campaigns.length} active campaigns`);
		} catch (error) {
			console.warn("Could not fetch campaigns:", error);
		}
	}

	// Direct Associates API access
	const associatesProvider = amazonService.getProvider("associates");
	if (associatesProvider) {
		console.log("\n🔗 Associates: Getting browse nodes...");
		try {
			const browseNode = await associatesProvider.getBrowseNode("283155"); // Electronics
			console.log(`Browse node: ${browseNode.DisplayName}`);
		} catch (error) {
			console.warn("Could not fetch browse node:", error);
		}
	}
}

/**
 * Main example function
 */
async function main() {
	console.log("🚀 Amazon Service Examples");
	console.log("========================");

	try {
		// Initialize service
		const amazonService = await initializeAmazonService();
		console.log("✅ Amazon service initialized successfully");

		// Monitor health
		await monitorServiceHealth(amazonService);

		// Example ASIN (Kindle Paperwhite)
		const exampleASIN = "B08KTZ8249";

		// Get product insights
		await getProductInsights(amazonService, exampleASIN);

		// Search products
		await searchProducts(amazonService, "wireless headphones");

		// Get marketplace analytics
		await getMarketplaceAnalytics(amazonService, "ATVPDKIKX0DER");

		// Advanced usage
		await advancedProviderUsage(amazonService);

		console.log("\n✅ All examples completed successfully!");
	} catch (error) {
		console.error("\n❌ Example failed:", error);
		process.exit(1);
	}
}

// Export for use in other files
export {
	initializeAmazonService,
	getProductInsights,
	monitorServiceHealth,
	searchProducts,
	getMarketplaceAnalytics,
	advancedProviderUsage,
	main,
};

// Run if this file is executed directly
if (require.main === module) {
	main().catch(console.error);
}
