/**
 * Amazon SP-API specific types and interfaces
 */

/**
 * SP-API Order interfaces
 */
export interface SPAPIOrder {
	AmazonOrderId: string;
	SellerOrderId?: string;
	PurchaseDate: string;
	LastUpdateDate: string;
	OrderStatus:
		| "Pending"
		| "Unshipped"
		| "PartiallyShipped"
		| "Shipped"
		| "Canceled"
		| "Unfulfillable"
		| "InvoiceUnconfirmed"
		| "PendingAvailability";
	FulfillmentChannel: "MFN" | "AFN";
	SalesChannel?: string;
	OrderChannel?: string;
	ShipServiceLevel?: string;
	OrderTotal?: {
		CurrencyCode: string;
		Amount: string;
	};
	NumberOfItemsShipped?: number;
	NumberOfItemsUnshipped?: number;
	PaymentExecutionDetail?: {
		PaymentExecutionDetailItem: Array<{
			Payment: {
				CurrencyCode: string;
				Amount: string;
			};
			PaymentMethod: string;
		}>;
	};
	PaymentMethod?: "COD" | "CVS" | "Other";
	PaymentMethodDetails?: string[];
	MarketplaceId: string;
	ShipmentServiceLevelCategory?: string;
	EasyShipShipmentStatus?: string;
	CbaDisplayableShippingLabel?: string;
	OrderType?:
		| "StandardOrder"
		| "LongLeadTimeOrder"
		| "Preorder"
		| "BackOrder"
		| "SourcingOnDemandOrder";
	EarliestShipDate?: string;
	LatestShipDate?: string;
	EarliestDeliveryDate?: string;
	LatestDeliveryDate?: string;
	IsBusinessOrder?: boolean;
	IsPrime?: boolean;
	IsPremiumOrder?: boolean;
	IsGlobalExpressEnabled?: boolean;
	ReplacedOrderId?: string;
	IsReplacementOrder?: boolean;
	PromiseResponseDueDate?: string;
	IsEstimatedShipDateSet?: boolean;
	IsSoldByAB?: boolean;
	IsIBA?: boolean;
	DefaultShipFromLocationAddress?: {
		Name?: string;
		AddressLine1?: string;
		AddressLine2?: string;
		AddressLine3?: string;
		City?: string;
		County?: string;
		District?: string;
		StateOrRegion?: string;
		Municipality?: string;
		PostalCode?: string;
		CountryCode?: string;
		Phone?: string;
		AddressType?: string;
	};
	BuyerRequestedCancel?: {
		IsBuyerRequestedCancel?: boolean;
		BuyerCancelReason?: string;
	};
	FulfillmentInstruction?: {
		FulfillmentSupplySourceId?: string;
	};
	IsISPU?: boolean;
	IsAccessPointOrder?: boolean;
	MarketplaceTaxInfo?: {
		TaxClassifications?: Array<{
			Name?: string;
			Value?: string;
		}>;
	};
	SellerDisplayName?: string;
	ShippingAddress?: {
		Name: string;
		AddressLine1?: string;
		AddressLine2?: string;
		AddressLine3?: string;
		City?: string;
		County?: string;
		District?: string;
		StateOrRegion?: string;
		Municipality?: string;
		PostalCode?: string;
		CountryCode?: string;
		Phone?: string;
		AddressType?: "Residential" | "Commercial";
	};
	BuyerInfo?: {
		BuyerEmail?: string;
		BuyerName?: string;
		BuyerCounty?: string;
		BuyerTaxInfo?: {
			TaxClassifications?: Array<{
				Name?: string;
				Value?: string;
			}>;
		};
		PurchaseOrderNumber?: string;
	};
	AutomatedShippingSettings?: {
		HasAutomatedShippingSettings?: boolean;
		AutomatedCarrier?: string;
		AutomatedShipMethod?: string;
	};
	HasRegulatedItems?: boolean;
	ElectronicInvoiceStatus?: string;
}

export interface SPAPIOrderItem {
	ASIN: string;
	SellerSKU?: string;
	OrderItemId: string;
	Title?: string;
	QuantityOrdered: number;
	QuantityShipped?: number;
	ProductInfo?: {
		NumberOfItems?: number;
	};
	PointsGranted?: {
		PointsNumber?: number;
		PointsMonetaryValue?: {
			CurrencyCode: string;
			Amount: string;
		};
	};
	ItemPrice?: {
		CurrencyCode: string;
		Amount: string;
	};
	ShippingPrice?: {
		CurrencyCode: string;
		Amount: string;
	};
	ItemTax?: {
		CurrencyCode: string;
		Amount: string;
	};
	ShippingTax?: {
		CurrencyCode: string;
		Amount: string;
	};
	ShippingDiscount?: {
		CurrencyCode: string;
		Amount: string;
	};
	ShippingDiscountTax?: {
		CurrencyCode: string;
		Amount: string;
	};
	PromotionDiscount?: {
		CurrencyCode: string;
		Amount: string;
	};
	PromotionDiscountTax?: {
		CurrencyCode: string;
		Amount: string;
	};
	PromotionIds?: string[];
	CODFee?: {
		CurrencyCode: string;
		Amount: string;
	};
	CODFeeDiscount?: {
		CurrencyCode: string;
		Amount: string;
	};
	IsGift?: boolean;
	ConditionNote?: string;
	ConditionId?: string;
	ConditionSubtypeId?: string;
	ScheduledDeliveryStartDate?: string;
	ScheduledDeliveryEndDate?: string;
	PriceDesignation?: string;
	TaxCollection?: {
		Model?: "MarketplaceFacilitator" | "Standard";
		ResponsibleParty?:
			| "Amazon Services, Inc."
			| "Amazon Web Services, Inc."
			| string;
	};
	SerialNumberRequired?: boolean;
	IsTransparency?: boolean;
	IossNumber?: string;
	StoreChainStoreId?: string;
	DeemedResellerCategory?: "IOSS" | "UOSS";
	BuyerInfo?: {
		BuyerCustomizedInfo?: {
			CustomizedURL?: string;
		};
		GiftWrapPrice?: {
			CurrencyCode: string;
			Amount: string;
		};
		GiftWrapTax?: {
			CurrencyCode: string;
			Amount: string;
		};
		GiftMessageText?: string;
		GiftWrapLevel?: string;
	};
	BuyerRequestedCancel?: {
		IsBuyerRequestedCancel?: boolean;
		BuyerCancelReason?: string;
	};
	SubstitutionPreferences?: {
		SubstitutionType?: "CUSTOMER_SUBSTITUTION" | "AMAZON_SUBSTITUTION";
		SubstitutionOptions?: Array<{
			ASIN?: string;
			QuantityRequested?: number;
			SellerSKU?: string;
			ItemPrice?: {
				CurrencyCode: string;
				Amount: string;
			};
			ShippingPrice?: {
				CurrencyCode: string;
				Amount: string;
			};
		}>;
	};
	Measurement?: {
		Unit?: string;
		Value?: number;
	};
}

export interface SPAPIOrdersResponse {
	payload: {
		Orders: SPAPIOrder[];
		NextToken?: string;
		LastUpdatedBefore?: string;
		CreatedBefore?: string;
	};
	errors?: Array<{
		code: string;
		message: string;
		details?: string;
	}>;
}

/**
 * SP-API Catalog interfaces
 */
export interface SPAPICatalogItem {
	asin: string;
	attributes?: Record<string, any>;
	identifiers?: Array<{
		identifierType: string;
		identifier: string;
	}>;
	images?: Array<{
		variant: string;
		link: string;
		height?: number;
		width?: number;
	}>;
	productTypes?: Array<{
		productType: string;
		marketplaceId?: string;
	}>;
	relationships?: Array<{
		color?: string;
		edition?: string;
		flavor?: string;
		format?: string;
		size?: string;
		parentAsins?: string[];
		childAsins?: string[];
		variationTheme?: string;
	}>;
	salesRanks?: Array<{
		productCategoryId: string;
		rank: number;
		classificationRanks?: Array<{
			classificationId: string;
			title: string;
			link: string;
			rank: number;
		}>;
	}>;
	summaries?: Array<{
		marketplaceId: string;
		adultProduct?: boolean;
		autographed?: boolean;
		brand?: string;
		browseNode?: {
			ancestor?: {
				contextFreeName?: string;
				displayName?: string;
				id?: string;
			};
			contextFreeName?: string;
			displayName?: string;
			id?: string;
			isRoot?: boolean;
			salesRank?: number;
		};
		color?: string;
		itemClassification?: string;
		itemName?: string;
		manufacturer?: string;
		memorabilia?: boolean;
		modelNumber?: string;
		packageQuantity?: number;
		partNumber?: string;
		releaseDate?: string;
		size?: string;
		style?: string;
		tradeInEligible?: boolean;
		websiteDisplayGroup?: string;
		websiteDisplayGroupName?: string;
	}>;
	vendorDetails?: Array<{
		marketplaceId: string;
		brandCode?: string;
		categoryCode?: string;
		manufacturerCode?: string;
		manufacturerCodeParent?: string;
		productCategory?: string;
		productGroup?: string;
		productSubcategory?: string;
		replenishmentCategory?: string;
	}>;
}

export interface SPAPICatalogResponse {
	items: SPAPICatalogItem[];
	refinements?: {
		brands?: Array<{
			numberOfResults: number;
			brandName: string;
		}>;
		classifications?: Array<{
			numberOfResults: number;
			classificationId: string;
			displayName: string;
		}>;
	};
	pagination?: {
		nextToken?: string;
		previousToken?: string;
	};
}

/**
 * SP-API Inventory interfaces
 */
export interface SPAPIInventoryItem {
	sellerSku?: string;
	fnSku?: string;
	asin?: string;
	condition?: string;
	inventoryDetails?: {
		fulfillableQuantity?: number;
		inboundWorkingQuantity?: number;
		inboundShippedQuantity?: number;
		inboundReceivingQuantity?: number;
		reservedQuantity?: {
			totalReservedQuantity?: number;
			pendingCustomerOrderQuantity?: number;
			pendingTransshipmentQuantity?: number;
			fcProcessingQuantity?: number;
		};
		researchingQuantity?: {
			totalResearchingQuantity?: number;
			researchingQuantityBreakdown?: Array<{
				name: string;
				quantity: number;
			}>;
		};
		unfulfillableQuantity?: {
			totalUnfulfillableQuantity?: number;
			customerDamagedQuantity?: number;
			warehouseDamagedQuantity?: number;
			distributorDamagedQuantity?: number;
			carrierDamagedQuantity?: number;
			defectiveQuantity?: number;
			expiredQuantity?: number;
		};
	};
	totalQuantity?: number;
	lastUpdatedTime?: string;
	productName?: string;
	totalReservedQuantity?: number;
	fulfillableQuantity?: number;
	inboundWorkingQuantity?: number;
	inboundShippedQuantity?: number;
	inboundReceivingQuantity?: number;
}

export interface SPAPIInventoryResponse {
	payload: {
		granularity: {
			granularityType?: string;
			granularityId?: string;
		};
		inventorySummaries: SPAPIInventoryItem[];
		pagination?: {
			nextToken?: string;
		};
	};
	errors?: Array<{
		code: string;
		message: string;
		details?: string;
	}>;
}

/**
 * SP-API Reports interfaces
 */
export interface SPAPIReport {
	reportType: string;
	reportId: string;
	dataStartTime?: string;
	dataEndTime?: string;
	scheduleId?: string;
	createdTime: string;
	processingStatus: "CANCELLED" | "DONE" | "FATAL" | "IN_PROGRESS" | "IN_QUEUE";
	processingStartTime?: string;
	processingEndTime?: string;
	reportDocumentId?: string;
	marketplaceIds?: string[];
}

export interface SPAPIReportsResponse {
	reports: SPAPIReport[];
	nextToken?: string;
}

/**
 * SP-API Listings interfaces
 */
export interface SPAPIListing {
	sku: string;
	status: "BUYABLE" | "DISCOVERABLE" | "DELETED";
	fnSku?: string;
	asin?: string;
	productType?: string;
	conditionType?: string;
	price?: {
		listingPrice: {
			amount: number;
			currencyCode: string;
		};
		businessPrice?: {
			amount: number;
			currencyCode: string;
		};
		quantityDiscounts?: Array<{
			quantityTier: number;
			quantityDiscountType: "FIXED_AMOUNT" | "PERCENT_OFF";
			discountAmount?: number;
			discountPercent?: number;
		}>;
	};
	quantity?: number;
	businessPrice?: {
		amount: number;
		currencyCode: string;
	};
	quantityDiscounts?: Array<{
		quantityTier: number;
		quantityDiscountType: "FIXED_AMOUNT" | "PERCENT_OFF";
		discountAmount?: number;
		discountPercent?: number;
	}>;
	fulfillmentChannels?: Array<{
		fulfillmentChannelCode: "AMAZON_NA" | "MERCHANT";
	}>;
	merchantShippingGroup?: string;
	issues?: Array<{
		code: string;
		message: string;
		severity: "ERROR" | "WARNING";
		attributeName?: string;
	}>;
}

export interface SPAPIListingsResponse {
	items: SPAPIListing[];
	nextToken?: string;
}

/**
 * SP-API Feeds interfaces
 */
export interface SPAPIFeed {
	feedId: string;
	feedType: string;
	marketplaceIds?: string[];
	createdTime: string;
	processingStatus: "CANCELLED" | "DONE" | "FATAL" | "IN_PROGRESS" | "IN_QUEUE";
	processingStartTime?: string;
	processingEndTime?: string;
	resultFeedDocumentId?: string;
}

export interface SPAPIFeedsResponse {
	feeds: SPAPIFeed[];
	nextToken?: string;
}

/**
 * SP-API Financial Events interfaces
 */
export interface SPAPIFinancialEvent {
	eventGroupId?: string;
	eventGroupStart?: string;
	eventGroupEnd?: string;
	originalTotal?: {
		currencyCode?: string;
		currencyAmount?: number;
	};
	convertedTotal?: {
		currencyCode?: string;
		currencyAmount?: number;
	};
	conversionRate?: number;
	postedDate?: string;
}

export interface SPAPIFinancialEventsResponse {
	payload: {
		financialEvents: {
			shipmentEventList?: SPAPIFinancialEvent[];
			refundEventList?: SPAPIFinancialEvent[];
			guaranteeClaimEventList?: SPAPIFinancialEvent[];
			chargebackEventList?: SPAPIFinancialEvent[];
			payWithAmazonEventList?: SPAPIFinancialEvent[];
			serviceProviderCreditEventList?: SPAPIFinancialEvent[];
			retrochargeEventList?: SPAPIFinancialEvent[];
			rentalTransactionEventList?: SPAPIFinancialEvent[];
			productAdsPaymentEventList?: SPAPIFinancialEvent[];
			serviceFeeEventList?: SPAPIFinancialEvent[];
			sellerDealPaymentEventList?: SPAPIFinancialEvent[];
			debtRecoveryEventList?: SPAPIFinancialEvent[];
			loanServicingEventList?: SPAPIFinancialEvent[];
			adjustmentEventList?: SPAPIFinancialEvent[];
			safeTReimbursementEventList?: SPAPIFinancialEvent[];
			sellerReviewEnrollmentPaymentEventList?: SPAPIFinancialEvent[];
			fbaLiquidationEventList?: SPAPIFinancialEvent[];
			couponPaymentEventList?: SPAPIFinancialEvent[];
			imagingServicesFeeEventList?: SPAPIFinancialEvent[];
			networkComminglingTransactionEventList?: SPAPIFinancialEvent[];
			affordabilityExpenseEventList?: SPAPIFinancialEvent[];
			affordabilityExpenseReversalEventList?: SPAPIFinancialEvent[];
		};
		nextToken?: string;
	};
	errors?: Array<{
		code: string;
		message: string;
		details?: string;
	}>;
}

/**
 * SP-API common response wrapper
 */
export interface SPAPIResponse<T> {
	payload?: T;
	errors?: Array<{
		code: string;
		message: string;
		details?: string;
	}>;
	pagination?: {
		nextToken?: string;
	};
}

/**
 * SP-API error response
 */
export interface SPAPIError {
	code: string;
	message: string;
	details?: string;
}
