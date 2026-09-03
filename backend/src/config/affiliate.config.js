import { config } from './env.js';

/**
 * Retailer Affiliate Rules and Tracking Configuration
 */
export const affiliateConfig = {
  enabled: config.AFFILIATE_ENABLED,
  defaultCampaignSource: config.APP_CAMPAIGN_SOURCE,

  retailers: {
    amazon: {
      name: 'Amazon',
      domains: ['amazon.in', 'amazon.com', 'amzn.to', 'amzn.in'],
      paramKey: 'tag',
      defaultTag: config.AFFILIATE_AMAZON_TAG,
      subTrackingKey: 'ascsubtag',
      extraParams: {
        linkCode: 'll1',
      },
    },
    flipkart: {
      name: 'Flipkart',
      domains: ['flipkart.com', 'dl.flipkart.com'],
      paramKey: 'affid',
      defaultTag: config.AFFILIATE_FLIPKART_AFFID,
      subTrackingKey: 'affExtParam1',
      extraParams: {},
    },
    croma: {
      name: 'Croma',
      domains: ['croma.com'],
      paramKey: 'utm_source',
      defaultTag: config.AFFILIATE_CROMA_TAG,
      subTrackingKey: 'subId',
      extraParams: {
        utm_medium: 'app_referral',
        utm_campaign: 'price_comparison',
      },
    },
  },

  defaultTracking: {
    utm_source: 'hl2',
    utm_medium: 'price_comparison_app',
    utm_campaign: 'buy_now',
  },
};

export default affiliateConfig;
