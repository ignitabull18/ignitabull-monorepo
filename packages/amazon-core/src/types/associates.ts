/**
 * Amazon Associates API (Product Advertising API 5.0) specific types and interfaces
 */

/**
 * Base request interfaces
 */
export interface GetItemsRequest {
	ItemIds: string[];
	Resources?: string[];
	ItemIdType?: "ASIN" | "UPC" | "EAN" | "ISBN";
	Condition?: "Any" | "New" | "Used" | "Collectible" | "Refurbished";
	CurrencyOfPreference?: string;
	LanguagesOfPreference?: string[];
	Merchant?: "All" | "Amazon";
}

export interface SearchItemsRequest {
	Keywords?: string;
	BrowseNodeId?: string;
	Resources?: string[];
	SearchIndex?: string;
	ItemCount?: number;
	ItemPage?: number;
	SortBy?: string;
	Brand?: string;
	Condition?: "Any" | "New" | "Used" | "Collectible" | "Refurbished";
	DeliveryFlags?: string[];
	MaxPrice?: number;
	MinPrice?: number;
	MinReviewsRating?: number;
	MinSavingPercent?: number;
	OfferCount?: number;
	CurrencyOfPreference?: string;
	LanguagesOfPreference?: string[];
	Merchant?: "All" | "Amazon";
	Title?: string;
	Author?: string;
	Artist?: string;
}

export interface GetBrowseNodesRequest {
	BrowseNodeIds: string[];
	Resources?: string[];
	LanguagesOfPreference?: string[];
}

export interface GetVariationsRequest {
	ASIN: string;
	Resources?: string[];
	VariationCount?: number;
	VariationPage?: number;
	CurrencyOfPreference?: string;
	LanguagesOfPreference?: string[];
	Merchant?: "All" | "Amazon";
}

/**
 * Product interfaces
 */
export interface AssociatesProduct {
	ASIN: string;
	ParentASIN?: string;
	DetailPageURL?: string;
	ItemInfo?: {
		Title?: {
			DisplayValue?: string;
			Label?: string;
			Locale?: string;
		};
		ByLineInfo?: {
			Brand?: {
				DisplayValue?: string;
				Label?: string;
				Locale?: string;
			};
			Manufacturer?: {
				DisplayValue?: string;
				Label?: string;
				Locale?: string;
			};
			Contributors?: Array<{
				Name?: string;
				Role?: string;
				Locale?: string;
			}>;
		};
		Classifications?: {
			ProductGroup?: {
				DisplayValue?: string;
				Label?: string;
				Locale?: string;
			};
			Binding?: {
				DisplayValue?: string;
				Label?: string;
				Locale?: string;
			};
		};
		ContentInfo?: {
			Edition?: {
				DisplayValue?: string;
				Label?: string;
				Locale?: string;
			};
			Languages?: {
				Primary?: Array<{
					DisplayValue?: string;
					Type?: string;
				}>;
			};
			PagesCount?: {
				DisplayValue?: number;
				Label?: string;
				Locale?: string;
			};
			PublicationDate?: {
				DisplayValue?: string;
				Label?: string;
				Locale?: string;
			};
		};
		ContentRating?: {
			AudienceRating?: {
				DisplayValue?: string;
				Label?: string;
				Locale?: string;
			};
		};
		ExternalIds?: {
			EANs?: Array<{
				DisplayValue?: string;
				Label?: string;
				Locale?: string;
			}>;
			ISBNs?: Array<{
				DisplayValue?: string;
				Label?: string;
				Locale?: string;
			}>;
			UPCs?: Array<{
				DisplayValue?: string;
				Label?: string;
				Locale?: string;
			}>;
		};
		Features?: {
			DisplayValues?: string[];
			Label?: string;
			Locale?: string;
		};
		ManufactureInfo?: {
			ItemPartNumber?: {
				DisplayValue?: string;
				Label?: string;
				Locale?: string;
			};
			Model?: {
				DisplayValue?: string;
				Label?: string;
				Locale?: string;
			};
			Warranty?: {
				DisplayValue?: string;
				Label?: string;
				Locale?: string;
			};
		};
		ProductInfo?: {
			Color?: {
				DisplayValue?: string;
				Label?: string;
				Locale?: string;
			};
			IsAdultProduct?: {
				DisplayValue?: boolean;
				Label?: string;
				Locale?: string;
			};
			ItemDimensions?: {
				Height?: {
					DisplayValue?: number;
					Label?: string;
					Locale?: string;
					Unit?: string;
				};
				Length?: {
					DisplayValue?: number;
					Label?: string;
					Locale?: string;
					Unit?: string;
				};
				Weight?: {
					DisplayValue?: number;
					Label?: string;
					Locale?: string;
					Unit?: string;
				};
				Width?: {
					DisplayValue?: number;
					Label?: string;
					Locale?: string;
					Unit?: string;
				};
			};
			ReleaseDate?: {
				DisplayValue?: string;
				Label?: string;
				Locale?: string;
			};
			Size?: {
				DisplayValue?: string;
				Label?: string;
				Locale?: string;
			};
			UnitCount?: {
				DisplayValue?: number;
				Label?: string;
				Locale?: string;
			};
		};
		TechnicalInfo?: {
			Formats?: {
				DisplayValues?: string[];
				Label?: string;
				Locale?: string;
			};
			EnergyEfficiencyClass?: {
				DisplayValue?: string;
				Label?: string;
				Locale?: string;
			};
		};
		TradeInInfo?: {
			EligibleForTradeIn?: boolean;
			Price?: {
				Amount?: number;
				Currency?: string;
				DisplayAmount?: string;
			};
		};
		VariationSummary?: {
			Price?: {
				HighestPrice?: {
					Amount?: number;
					Currency?: string;
					DisplayAmount?: string;
				};
				LowestPrice?: {
					Amount?: number;
					Currency?: string;
					DisplayAmount?: string;
				};
			};
			VariationCount?: number;
		};
	};
	Images?: {
		Primary?: AssociatesImage;
		Variants?: AssociatesImage[];
	};
	Offers?: {
		Listings?: AssociatesOffer[];
		Summaries?: Array<{
			Condition?: {
				Value?: string;
				DisplayValue?: string;
			};
			HighestPrice?: {
				Amount?: number;
				Currency?: string;
				DisplayAmount?: string;
			};
			LowestPrice?: {
				Amount?: number;
				Currency?: string;
				DisplayAmount?: string;
			};
			OfferCount?: number;
		}>;
	};
	BrowseNodeInfo?: {
		BrowseNodes?: AssociatesBrowseNode[];
		WebsiteSalesRank?: {
			SalesRanks?: Array<{
				ContextFreeName?: string;
				DisplayName?: string;
				Rank?: number;
			}>;
		};
	};
	CustomerReviews?: {
		Count?: number;
		StarRating?: {
			Value?: number;
		};
	};
	RentalOffers?: {
		Listings?: Array<{
			Availability?: {
				MaxOrderQuantity?: number;
				Message?: string;
				MinOrderQuantity?: number;
				Type?: string;
			};
			BasePrice?: {
				Amount?: number;
				Currency?: string;
				DisplayAmount?: string;
			};
			Condition?: {
				SubCondition?: {
					Value?: string;
					DisplayValue?: string;
				};
				Value?: string;
				DisplayValue?: string;
			};
			DeliveryInfo?: {
				IsAmazonFulfilled?: boolean;
				IsFreeShippingEligible?: boolean;
				IsPrimeEligible?: boolean;
			};
			Id?: string;
			MerchantInfo?: {
				DefaultShippingCountry?: string;
				FeedbackCount?: number;
				FeedbackRating?: number;
				Id?: string;
				Name?: string;
			};
			RentalTerms?: Array<{
				Price?: {
					Amount?: number;
					Currency?: string;
					DisplayAmount?: string;
				};
				Unit?: string;
			}>;
		}>;
	};
	VariationAttributes?: Array<{
		Name?: string;
		Value?: string;
	}>;
}

export interface AssociatesImage {
	URL?: string;
	Height?: number;
	Width?: number;
}

export interface AssociatesOffer {
	Availability?: {
		MaxOrderQuantity?: number;
		Message?: string;
		MinOrderQuantity?: number;
		Type?: string;
	};
	Condition?: {
		SubCondition?: {
			Value?: string;
			DisplayValue?: string;
		};
		Value?: string;
		DisplayValue?: string;
	};
	DeliveryInfo?: {
		IsAmazonFulfilled?: boolean;
		IsFreeShippingEligible?: boolean;
		IsPrimeEligible?: boolean;
		ShippingCharges?: Array<{
			Amount?: number;
			Currency?: string;
			DisplayAmount?: string;
			IsRateTaxInclusive?: boolean;
			Type?: string;
		}>;
	};
	Id?: string;
	IsBuyBoxWinner?: boolean;
	LoyaltyPoints?: {
		Points?: number;
	};
	MerchantInfo?: {
		DefaultShippingCountry?: string;
		FeedbackCount?: number;
		FeedbackRating?: number;
		Id?: string;
		Name?: string;
	};
	Price?: {
		Amount?: number;
		Currency?: string;
		DisplayAmount?: string;
		PricePerUnit?: number;
		Savings?: {
			Amount?: number;
			Currency?: string;
			DisplayAmount?: string;
			Percentage?: number;
		};
	};
	ProgramEligibility?: {
		IsPrimeExclusive?: boolean;
		IsPrimePantry?: boolean;
	};
	Promotions?: Array<{
		Amount?: number;
		Currency?: string;
		DisplayAmount?: string;
		DiscountPercent?: number;
		Type?: string;
	}>;
	SavingBasis?: {
		Amount?: number;
		Currency?: string;
		DisplayAmount?: string;
	};
	ViolatesMAP?: boolean;
}

/**
 * Browse Node interfaces
 */
export interface AssociatesBrowseNode {
	Id?: string;
	DisplayName?: string;
	ContextFreeName?: string;
	IsRoot?: boolean;
	SalesRank?: number;
	Ancestor?: {
		Ancestor?: AssociatesBrowseNode;
		ContextFreeName?: string;
		DisplayName?: string;
		Id?: string;
	};
	Children?: AssociatesBrowseNode[];
}

/**
 * Response interfaces
 */
export interface AssociatesProductResponse {
	ItemsResult?: {
		Items?: AssociatesProduct[];
	};
	Errors?: AssociatesError[];
}

export interface AssociatesSearchResponse {
	SearchResult?: {
		Items?: AssociatesProduct[];
		SearchURL?: string;
		TotalResultCount?: number;
	};
	Errors?: AssociatesError[];
}

export interface AssociatesVariationsResponse {
	VariationsResult?: {
		Items?: AssociatesProduct[];
		VariationSummary?: {
			PageCount?: number;
			VariationCount?: number;
		};
	};
	Errors?: AssociatesError[];
}

export interface AssociatesCartCreateResponse {
	CartCreateResult?: {
		Cart?: {
			CartId?: string;
			HMAC?: string;
			PurchaseURL?: string;
			SubTotal?: {
				Amount?: number;
				Currency?: string;
				DisplayAmount?: string;
			};
			CartItems?: Array<{
				CartItemId?: string;
				ASIN?: string;
				Quantity?: number;
				Title?: string;
				ProductGroup?: string;
				Price?: {
					Amount?: number;
					Currency?: string;
					DisplayAmount?: string;
				};
			}>;
		};
	};
	Errors?: AssociatesError[];
}

/**
 * Error interfaces
 */
export interface AssociatesError {
	__type?: string;
	message?: string;
	Code?: string;
	Message?: string;
}

/**
 * Common enums and constants
 */
export type AssociatesCondition =
	| "Any"
	| "New"
	| "Used"
	| "Collectible"
	| "Refurbished";

export type AssociatesSearchIndex =
	| "All"
	| "AmazonVideo"
	| "Apparel"
	| "Appliances"
	| "ArtsAndCrafts"
	| "Automotive"
	| "Baby"
	| "Beauty"
	| "Books"
	| "Classical"
	| "Collectibles"
	| "DigitalMusic"
	| "Electronics"
	| "EverythingElse"
	| "Fashion"
	| "FashionBaby"
	| "FashionBoys"
	| "FashionGirls"
	| "FashionMen"
	| "FashionWomen"
	| "GardenAndOutdoor"
	| "GiftCards"
	| "GroceryAndGourmetFood"
	| "Handmade"
	| "HealthAndPersonalCare"
	| "HomeAndKitchen"
	| "Industrial"
	| "Jewelry"
	| "KindleStore"
	| "Luggage"
	| "LuxuryBeauty"
	| "Magazines"
	| "MobileAndAccessories"
	| "MobileApps"
	| "MoviesAndTV"
	| "Music"
	| "MusicalInstruments"
	| "OfficeProducts"
	| "PetSupplies"
	| "Photo"
	| "Shoes"
	| "Software"
	| "SportsAndOutdoors"
	| "ToolsAndHomeImprovement"
	| "ToysAndGames"
	| "VHS"
	| "VideoGames"
	| "Watches";

export type AssociatesSortBy =
	| "AvgCustomerReviews"
	| "Featured"
	| "NewestArrivals"
	| "Price:HighToLow"
	| "Price:LowToHigh"
	| "Relevance";

export type AssociatesDeliveryFlag =
	| "AmazonGlobal"
	| "FreeShipping"
	| "FulfilledByAmazon"
	| "Prime";

export type AssociatesMerchant = "All" | "Amazon";

export type AssociatesItemIdType = "ASIN" | "UPC" | "EAN" | "ISBN";

/**
 * Resource constants for different operations
 */
export const ASSOCIATES_ITEM_RESOURCES = [
	"BrowseNodeInfo.BrowseNodes",
	"BrowseNodeInfo.BrowseNodes.Ancestor",
	"BrowseNodeInfo.BrowseNodes.SalesRank",
	"BrowseNodeInfo.WebsiteSalesRank",
	"CustomerReviews.Count",
	"CustomerReviews.StarRating",
	"Images.Primary",
	"Images.Variants",
	"ItemInfo.ByLineInfo",
	"ItemInfo.Classifications",
	"ItemInfo.ContentInfo",
	"ItemInfo.ContentRating",
	"ItemInfo.ExternalIds",
	"ItemInfo.Features",
	"ItemInfo.ManufactureInfo",
	"ItemInfo.ProductInfo",
	"ItemInfo.TechnicalInfo",
	"ItemInfo.Title",
	"ItemInfo.TradeInInfo",
	"Offers.Listings",
	"Offers.Summaries",
	"ParentASIN",
	"RentalOffers.Listings",
	"SearchRefinements",
] as const;

export const ASSOCIATES_SEARCH_RESOURCES = [
	"BrowseNodeInfo.BrowseNodes",
	"Images.Primary",
	"ItemInfo.Title",
	"ItemInfo.Features",
	"Offers.Listings",
	"Offers.Summaries",
	"CustomerReviews.Count",
	"CustomerReviews.StarRating",
] as const;

export const ASSOCIATES_BROWSE_NODE_RESOURCES = [
	"BrowseNodes.Ancestor",
	"BrowseNodes.Children",
] as const;

export const ASSOCIATES_VARIATION_RESOURCES = [
	"ItemInfo.Title",
	"ItemInfo.VariationSummary",
	"Images.Primary",
	"Offers.Listings",
	"Offers.Summaries",
	"VariationAttributes",
] as const;

/**
 * Helper interfaces for convenience methods
 */
export interface AssociatesSearchOptions {
	searchIndex?: AssociatesSearchIndex;
	itemCount?: number;
	itemPage?: number;
	sortBy?: AssociatesSortBy;
	minPrice?: number;
	maxPrice?: number;
	brand?: string;
	condition?: AssociatesCondition;
	merchant?: AssociatesMerchant;
}

export interface AssociatesAffiliateLink {
	url: string;
	asin?: string;
	customId?: string;
	partnerTag: string;
}

/**
 * Marketplace mappings
 */
export const ASSOCIATES_MARKETPLACES = {
	"us-east-1": "www.amazon.com",
	"us-west-2": "www.amazon.com",
	"eu-west-1": "www.amazon.co.uk",
	"eu-central-1": "www.amazon.de",
	"ap-northeast-1": "www.amazon.co.jp",
} as const;

/**
 * Currency mappings
 */
export const ASSOCIATES_CURRENCIES = {
	"us-east-1": "USD",
	"us-west-2": "USD",
	"eu-west-1": "GBP",
	"eu-central-1": "EUR",
	"ap-northeast-1": "JPY",
} as const;
