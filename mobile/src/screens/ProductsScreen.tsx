import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Animated,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GoogleIcon, GoogleIconName } from '../components/common/GoogleIcon';
import { openStoreApp } from '../utils/platformLauncher';
import { RootStackScreenProps } from '../navigation/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 56) / 2;

// ─── Platform Definitions ──────────────────────────────────────────────
interface PlatformInfo {
  id: string;
  name: string;
  color: string;
  icon: GoogleIconName;
}

const PLATFORMS: Record<string, PlatformInfo> = {
  amazon: { id: 'amazon', name: 'Amazon', color: '#FF9900', icon: 'local-mall' },
  flipkart: { id: 'flipkart', name: 'Flipkart', color: '#2874F0', icon: 'storefront' },
  meesho: { id: 'meesho', name: 'Meesho', color: '#570741', icon: 'shopping-bag' },
  myntra: { id: 'myntra', name: 'Myntra', color: '#FF3F6C', icon: 'checkroom' },
  croma: { id: 'croma', name: 'Croma', color: '#00A389', icon: 'devices' },
};

// ─── Category Definitions ──────────────────────────────────────────────
interface ProductCategory {
  id: string;
  label: string;
  emoji: string;
}

const CATEGORIES: ProductCategory[] = [
  { id: 'all', label: 'All', emoji: '🛍️' },
  { id: 'smartphones', label: 'Phones', emoji: '📱' },
  { id: 'laptops', label: 'Laptops', emoji: '💻' },
  { id: 'audio', label: 'Audio', emoji: '🎧' },
  { id: 'mens-fashion', label: "Men", emoji: '👔' },
  { id: 'womens-fashion', label: "Women", emoji: '👗' },
  { id: 'home-kitchen', label: 'Home', emoji: '🏠' },
];

// ─── Real Product Data with Images ─────────────────────────────────────
interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: string;
  mrp?: string;
  discount?: string;
  platformId: string;
  url: string;
  image: string;
  rating?: string;
  reviews?: string;
  badge?: string;
}

const ALL_PRODUCTS: Product[] = [
  // ── 📱 Smartphones ──
  {
    id: 'iphone-16-pro-max',
    name: 'iPhone 16 Pro Max 256GB',
    brand: 'Apple',
    category: 'smartphones',
    price: '₹1,44,900',
    mrp: '₹1,49,900',
    discount: '3% off',
    platformId: 'amazon',
    url: 'https://www.amazon.in/Apple-iPhone-16-Pro-Max/dp/B0DGXK5WPR',
    image: 'https://m.media-amazon.com/images/I/61hLuYgMvIL._SL1500_.jpg',
    rating: '4.5',
    reviews: '2,847',
    badge: 'Bestseller',
  },
  {
    id: 'samsung-s24-ultra',
    name: 'Galaxy S24 Ultra 5G 256GB',
    brand: 'Samsung',
    category: 'smartphones',
    price: '₹1,29,999',
    mrp: '₹1,49,999',
    discount: '13% off',
    platformId: 'flipkart',
    url: 'https://www.flipkart.com/samsung-galaxy-s24-ultra-5g-titanium-gray-256-gb-12-gb-ram/p/itm1ea459ff1edb2',
    image: 'https://rukminim2.flixcart.com/image/416/416/xif0q/mobile/h/d/9/-original-imagxqg5zuymhcv8.jpeg',
    rating: '4.6',
    reviews: '15,423',
    badge: 'Top Rated',
  },
  {
    id: 'oneplus-12',
    name: 'OnePlus 12 5G 256GB',
    brand: 'OnePlus',
    category: 'smartphones',
    price: '₹64,999',
    mrp: '₹69,999',
    discount: '7% off',
    platformId: 'amazon',
    url: 'https://www.amazon.in/OnePlus-Silky-Black-256GB-Storage/dp/B0CQH3M43L',
    image: 'https://m.media-amazon.com/images/I/71MIEVRbSBL._SL1500_.jpg',
    rating: '4.4',
    reviews: '5,612',
  },
  {
    id: 'pixel-8-pro',
    name: 'Pixel 8 Pro 128GB',
    brand: 'Google',
    category: 'smartphones',
    price: '₹83,999',
    mrp: '₹1,06,999',
    discount: '21% off',
    platformId: 'flipkart',
    url: 'https://www.flipkart.com/google-pixel-8-pro-bay-128-gb-12-gb-ram/p/itm20bba0751c5b6',
    image: 'https://rukminim2.flixcart.com/image/416/416/xif0q/mobile/y/l/n/-original-imagtghfnkkbsvxa.jpeg',
    rating: '4.3',
    reviews: '3,981',
  },
  {
    id: 'redmi-note-13-pro',
    name: 'Redmi Note 13 Pro+ 5G',
    brand: 'Xiaomi',
    category: 'smartphones',
    price: '₹29,999',
    mrp: '₹34,999',
    discount: '14% off',
    platformId: 'amazon',
    url: 'https://www.amazon.in/Redmi-Note-Pro-Fusion-Purple/dp/B0CS5VMWM7',
    image: 'https://m.media-amazon.com/images/I/71He0JnNqkL._SL1500_.jpg',
    rating: '4.2',
    reviews: '18,234',
    badge: 'Value Pick',
  },
  {
    id: 'iphone-15',
    name: 'iPhone 15 128GB Blue',
    brand: 'Apple',
    category: 'smartphones',
    price: '₹69,900',
    mrp: '₹79,900',
    discount: '12% off',
    platformId: 'croma',
    url: 'https://www.croma.com/apple-iphone-15-128gb-blue-/p/271029',
    image: 'https://m.media-amazon.com/images/I/71d7rfSl0wL._SL1500_.jpg',
    rating: '4.6',
    reviews: '45,671',
  },
  {
    id: 'realme-narzo-70',
    name: 'Narzo 70 Turbo 5G 128GB',
    brand: 'Realme',
    category: 'smartphones',
    price: '₹14,999',
    mrp: '₹17,999',
    discount: '17% off',
    platformId: 'flipkart',
    url: 'https://www.flipkart.com/realme-narzo-70-turbo-5g-turbo-purple-128-gb-6-gb-ram/p/itm54a9c9f2e4cc7',
    image: 'https://rukminim2.flixcart.com/image/416/416/xif0q/mobile/w/x/a/-original-imags7gzhjfgnfgd.jpeg',
    rating: '4.1',
    reviews: '7,342',
    badge: 'Budget King',
  },
  {
    id: 'vivo-v30-pro',
    name: 'Vivo V30 Pro 5G',
    brand: 'Vivo',
    category: 'smartphones',
    price: '₹39,999',
    mrp: '₹46,999',
    discount: '15% off',
    platformId: 'amazon',
    url: 'https://www.amazon.in/Vivo-V30-Pro-Peacock-Green/dp/B0CW1GLQRZ',
    image: 'https://m.media-amazon.com/images/I/61T94bq+KQL._SL1500_.jpg',
    rating: '4.2',
    reviews: '2,187',
  },

  // ── 💻 Laptops ──
  {
    id: 'macbook-air-m3',
    name: 'MacBook Air M3 15" 256GB',
    brand: 'Apple',
    category: 'laptops',
    price: '₹1,34,900',
    mrp: '₹1,39,900',
    discount: '4% off',
    platformId: 'amazon',
    url: 'https://www.amazon.in/Apple-MacBook-Laptop-chip-Liquid/dp/B0CX22ZW1T',
    image: 'https://m.media-amazon.com/images/I/71f5Eu5lJSL._SL1500_.jpg',
    rating: '4.7',
    reviews: '1,234',
    badge: 'Most Popular',
  },
  {
    id: 'hp-pavilion-15',
    name: 'HP Pavilion 15 Ryzen 5',
    brand: 'HP',
    category: 'laptops',
    price: '₹54,990',
    mrp: '₹64,578',
    discount: '15% off',
    platformId: 'flipkart',
    url: 'https://www.flipkart.com/hp-pavilion-15-amd-ryzen-5-hexa-core-7530u-16-gb-512-gb-ssd-windows-11-home-15-eh2024au-thin-light-laptop/p/itm09bd4ee5d319c',
    image: 'https://rukminim2.flixcart.com/image/416/416/xif0q/computer/k/l/l/-original-imagp48y8wrnzfrm.jpeg',
    rating: '4.3',
    reviews: '8,921',
  },
  {
    id: 'dell-inspiron-16',
    name: 'Dell Inspiron 16 5630 i5',
    brand: 'Dell',
    category: 'laptops',
    price: '₹63,490',
    mrp: '₹78,821',
    discount: '19% off',
    platformId: 'croma',
    url: 'https://www.croma.com/dell-inspiron-16-5630-intel-core-i5-13th-gen/p/271342',
    image: 'https://m.media-amazon.com/images/I/71J-mDvRnoL._SL1500_.jpg',
    rating: '4.2',
    reviews: '4,567',
  },
  {
    id: 'asus-vivobook-15',
    name: 'VivoBook 15 OLED i5',
    brand: 'ASUS',
    category: 'laptops',
    price: '₹49,990',
    mrp: '₹62,990',
    discount: '21% off',
    platformId: 'amazon',
    url: 'https://www.amazon.in/ASUS-Vivobook-Display-i5-1335U-K3504VA-LK542WS/dp/B0C9CKNLQ7',
    image: 'https://m.media-amazon.com/images/I/71MpFMmge5L._SL1500_.jpg',
    rating: '4.4',
    reviews: '3,128',
    badge: 'OLED Display',
  },
  {
    id: 'lenovo-ideapad-slim3',
    name: 'IdeaPad Slim 3 14" i3',
    brand: 'Lenovo',
    category: 'laptops',
    price: '₹35,990',
    mrp: '₹52,890',
    discount: '32% off',
    platformId: 'flipkart',
    url: 'https://www.flipkart.com/lenovo-ideapad-slim-3-intel-core-i3-13th-gen-1315u-8-gb-256-gb-ssd-windows-11-home-14irh8-thin-light-laptop/p/itmdc49b2a51c1c3',
    image: 'https://rukminim2.flixcart.com/image/416/416/xif0q/computer/z/3/i/-original-imagptgpfcgfnt9z.jpeg',
    rating: '4.1',
    reviews: '12,342',
    badge: 'Budget Pick',
  },
  {
    id: 'macbook-pro-m3',
    name: 'MacBook Pro M3 Pro 14"',
    brand: 'Apple',
    category: 'laptops',
    price: '₹1,99,900',
    mrp: '₹1,99,900',
    platformId: 'croma',
    url: 'https://www.croma.com/apple-macbook-pro-m3-pro-chip-14-inch/p/274123',
    image: 'https://m.media-amazon.com/images/I/61lsac-RjUL._SL1500_.jpg',
    rating: '4.8',
    reviews: '912',
  },

  // ── 🎧 Audio ──
  {
    id: 'sony-wh1000xm5',
    name: 'WH-1000XM5 Wireless ANC',
    brand: 'Sony',
    category: 'audio',
    price: '₹24,990',
    mrp: '₹34,990',
    discount: '29% off',
    platformId: 'amazon',
    url: 'https://www.amazon.in/Sony-WH-1000XM5-Cancelling-Headphones-Hands-Free/dp/B09XS7JWHH',
    image: 'https://m.media-amazon.com/images/I/51aXvjzcukL._SL1500_.jpg',
    rating: '4.5',
    reviews: '9,876',
    badge: '#1 Headphones',
  },
  {
    id: 'boat-airdopes-141',
    name: 'Airdopes 141 ANC Earbuds',
    brand: 'boAt',
    category: 'audio',
    price: '₹1,299',
    mrp: '₹3,490',
    discount: '63% off',
    platformId: 'flipkart',
    url: 'https://www.flipkart.com/boat-airdopes-141-anc-bluetooth-headset/p/itm5f3c3f53f5e2a',
    image: 'https://rukminim2.flixcart.com/image/416/416/xif0q/headphone/z/e/k/-original-imagz7xzfhuz9gzq.jpeg',
    rating: '4.1',
    reviews: '1,23,456',
    badge: 'Best Value',
  },
  {
    id: 'jbl-tune-230nc',
    name: 'Tune 230NC TWS Earbuds',
    brand: 'JBL',
    category: 'audio',
    price: '₹4,499',
    mrp: '₹7,999',
    discount: '44% off',
    platformId: 'amazon',
    url: 'https://www.amazon.in/JBL-Tune-230NC-Cancellation-Earbuds/dp/B09PBLWZ3Q',
    image: 'https://m.media-amazon.com/images/I/61Nre2KlsiL._SL1500_.jpg',
    rating: '4.3',
    reviews: '32,145',
  },
  {
    id: 'airpods-pro-2',
    name: 'AirPods Pro 2 USB-C',
    brand: 'Apple',
    category: 'audio',
    price: '₹24,900',
    mrp: '₹24,900',
    platformId: 'croma',
    url: 'https://www.croma.com/apple-airpods-pro-2nd-generation-usb-c/p/270756',
    image: 'https://m.media-amazon.com/images/I/61SUj2aKoEL._SL1500_.jpg',
    rating: '4.7',
    reviews: '67,234',
    badge: 'Premium',
  },
  {
    id: 'samsung-buds-fe',
    name: 'Galaxy Buds FE ANC',
    brand: 'Samsung',
    category: 'audio',
    price: '₹4,999',
    mrp: '₹6,999',
    discount: '29% off',
    platformId: 'flipkart',
    url: 'https://www.flipkart.com/samsung-galaxy-buds-fe-bluetooth-headset/p/itm2e1c24aeda0f7',
    image: 'https://rukminim2.flixcart.com/image/416/416/xif0q/headphone/v/j/4/-original-imagrjcnxmhujdkv.jpeg',
    rating: '4.2',
    reviews: '8,732',
  },
  {
    id: 'boat-rockerz-550',
    name: 'Rockerz 550 ANC Over-Ear',
    brand: 'boAt',
    category: 'audio',
    price: '₹1,799',
    mrp: '₹4,490',
    discount: '60% off',
    platformId: 'amazon',
    url: 'https://www.amazon.in/boAt-Rockerz-550ANC-Cancellation-Bluetooth/dp/B0B6FHXRS6',
    image: 'https://m.media-amazon.com/images/I/51vKaFsfEqL._SL1500_.jpg',
    rating: '4.0',
    reviews: '45,321',
    badge: 'Trending',
  },

  // ── 👔 Men's Fashion ──
  {
    id: 'levis-511-slim',
    name: "511 Slim Fit Stretch Jeans",
    brand: "Levi's",
    category: 'mens-fashion',
    price: '₹2,799',
    mrp: '₹4,499',
    discount: '38% off',
    platformId: 'myntra',
    url: 'https://www.myntra.com/jeans/levis/levis-men-511-slim-fit-stretchable-jeans/14900204/buy',
    image: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/14900204/2021/8/18/c17be9b0-0b0a-4d45-89a4-5a5d7e5a0a0d1629270978854-Levis-Men-Jeans-1631629270978372-1.jpg',
    rating: '4.3',
    reviews: '14,287',
    badge: 'Bestseller',
  },
  {
    id: 'nike-air-max',
    name: 'Air Max 270 Sneakers',
    brand: 'Nike',
    category: 'mens-fashion',
    price: '₹12,795',
    mrp: '₹14,995',
    discount: '15% off',
    platformId: 'myntra',
    url: 'https://www.myntra.com/sports-shoes/nike/nike-men-air-max-270-sneakers/21403296/buy',
    image: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/21403296/2023/1/3/7bcc1f6c-7b4c-4c01-852c-f8b79b4fa9a61672736019969NikeMenWhiteAIRMAX270Sneakers1.jpg',
    rating: '4.5',
    reviews: '3,892',
  },
  {
    id: 'allen-solly-formal',
    name: 'Slim Fit Formal Shirt',
    brand: 'Allen Solly',
    category: 'mens-fashion',
    price: '₹1,299',
    mrp: '₹2,499',
    discount: '48% off',
    platformId: 'myntra',
    url: 'https://www.myntra.com/shirts/allen-solly/allen-solly-men-slim-fit-formal-shirt/18946050/buy',
    image: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/18946050/2022/7/20/7fa1b8c5-1e1d-4b4d-b3b4-1e1d4b4db3b41658305024774AllenSollyMenSlimFitFormalsShirt1.jpg',
    rating: '4.1',
    reviews: '7,234',
  },
  {
    id: 'us-polo-tshirt',
    name: 'Classic Polo T-Shirt',
    brand: 'U.S. Polo Assn.',
    category: 'mens-fashion',
    price: '₹899',
    mrp: '₹1,999',
    discount: '55% off',
    platformId: 'amazon',
    url: 'https://www.amazon.in/U-S-Polo-Assn-Regular-USTS6411_Navy/dp/B09TQJRL2L',
    image: 'https://m.media-amazon.com/images/I/61pMOm2bqLL._SL1500_.jpg',
    rating: '4.2',
    reviews: '23,451',
    badge: 'Value Deal',
  },
  {
    id: 'puma-running-shoes',
    name: 'Softride Runner V2',
    brand: 'Puma',
    category: 'mens-fashion',
    price: '₹3,499',
    mrp: '₹5,999',
    discount: '42% off',
    platformId: 'flipkart',
    url: 'https://www.flipkart.com/puma-softride-runner-v2-running-shoes-men/p/itm6fa77f39ea16d',
    image: 'https://rukminim2.flixcart.com/image/416/416/xif0q/shoe/i/4/j/-original-imagpv3dvagbahyz.jpeg',
    rating: '4.3',
    reviews: '8,921',
  },
  {
    id: 'peter-england-chinos',
    name: 'Slim Fit Cotton Chinos',
    brand: 'Peter England',
    category: 'mens-fashion',
    price: '₹1,199',
    mrp: '₹2,299',
    discount: '48% off',
    platformId: 'myntra',
    url: 'https://www.myntra.com/trousers/peter-england/peter-england-men-slim-fit-chinos/22147696/buy',
    image: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/22147696/2023/3/13/f75c4b3f-7a0d-4b4f-b3f7-a0d4b4fb3f71678704012345PeterEnglandMenSlimFitChinos1.jpg',
    rating: '4.0',
    reviews: '5,123',
  },
  {
    id: 'meesho-mens-kurta',
    name: 'Cotton Kurta Pajama Set',
    brand: 'Ethnic Craft',
    category: 'mens-fashion',
    price: '₹459',
    mrp: '₹1,499',
    discount: '69% off',
    platformId: 'meesho',
    url: 'https://www.meesho.com/mens-kurta-pajama-set',
    image: 'https://images.meesho.com/images/products/282284812/vmpst_512.webp',
    rating: '3.9',
    reviews: '42,123',
    badge: 'Lowest Price',
  },

  // ── 👗 Women's Fashion ──
  {
    id: 'libas-kurta-set',
    name: 'Floral Printed Kurta Set',
    brand: 'Libas',
    category: 'womens-fashion',
    price: '₹1,099',
    mrp: '₹2,499',
    discount: '56% off',
    platformId: 'myntra',
    url: 'https://www.myntra.com/kurta-sets/libas/libas-floral-printed-kurta-with-trousers/18574610/buy',
    image: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/18574610/2022/6/29/19e9b0f5-d0fb-4f14-b0f5-d0fb4f14b0f51656499012345Libas-1.jpg',
    rating: '4.2',
    reviews: '11,234',
    badge: 'Trending',
  },
  {
    id: 'anouk-anarkali',
    name: 'Embroidered Anarkali Kurta',
    brand: 'Anouk',
    category: 'womens-fashion',
    price: '₹1,499',
    mrp: '₹2,999',
    discount: '50% off',
    platformId: 'myntra',
    url: 'https://www.myntra.com/kurtas/anouk/anouk-women-embroidered-anarkali-kurta/15338234/buy',
    image: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/15338234/2021/9/7/e5c6c2e5-ab55-4b0c-86c2-e5ab554b0c861630999012345Anouk-1.jpg',
    rating: '4.3',
    reviews: '6,789',
  },
  {
    id: 'nike-airforce-1-w',
    name: 'Air Force 1 \'07 White',
    brand: 'Nike',
    category: 'womens-fashion',
    price: '₹8,195',
    mrp: '₹8,695',
    discount: '6% off',
    platformId: 'myntra',
    url: 'https://www.myntra.com/casual-shoes/nike/nike-women-air-force-1-07-sneakers/16865508/buy',
    image: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/16865508/2022/2/14/c59e5e92-5a7f-4d3a-9e5e-925a7f4d3a9e1644818012345-Nike-1.jpg',
    rating: '4.6',
    reviews: '9,123',
  },
  {
    id: 'biba-palazzo-set',
    name: 'Printed Palazzo Kurta Set',
    brand: 'BIBA',
    category: 'womens-fashion',
    price: '₹1,799',
    mrp: '₹3,499',
    discount: '49% off',
    platformId: 'amazon',
    url: 'https://www.amazon.in/BIBA-Womens-Cotton-Straight-Kurta/dp/B0C2H3HR7M',
    image: 'https://m.media-amazon.com/images/I/71qg39DkpvL._SL1500_.jpg',
    rating: '4.1',
    reviews: '3,456',
    badge: "Editor's Pick",
  },
  {
    id: 'fabindia-saree',
    name: 'Cotton Handloom Saree',
    brand: 'FabIndia',
    category: 'womens-fashion',
    price: '₹2,990',
    mrp: '₹4,990',
    discount: '40% off',
    platformId: 'myntra',
    url: 'https://www.myntra.com/sarees/fabindia/fabindia-cotton-handloom-saree/21789482/buy',
    image: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/21789482/2023/1/20/0f8e8f1e-1a3b-4e5e-8e8f-1e1a3b4e5e8e1674198012345FabIndia-1.jpg',
    rating: '4.4',
    reviews: '2,345',
  },
  {
    id: 'meesho-women-dress',
    name: 'Georgette A-Line Dress',
    brand: 'StyleUp',
    category: 'womens-fashion',
    price: '₹399',
    mrp: '₹1,299',
    discount: '69% off',
    platformId: 'meesho',
    url: 'https://www.meesho.com/womens-georgette-dress',
    image: 'https://images.meesho.com/images/products/217635342/zhlpk_512.webp',
    rating: '3.8',
    reviews: '52,345',
    badge: 'Under ₹499',
  },
  {
    id: 'hm-women-tops',
    name: 'Ribbed Crop Top Pack of 2',
    brand: 'H&M',
    category: 'womens-fashion',
    price: '₹599',
    mrp: '₹999',
    discount: '40% off',
    platformId: 'myntra',
    url: 'https://www.myntra.com/tops/hm/hm-pack-of-2-ribbed-crop-tops/23456782/buy',
    image: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/23456782/2023/6/14/a1b2c3d4-e5f6-7890-1234-567890abcdef1686735012345-HM-1.jpg',
    rating: '4.0',
    reviews: '8,901',
  },

  // ── 🏠 Home & Kitchen ──
  {
    id: 'prestige-induction',
    name: 'PIC 20 Induction Cooktop',
    brand: 'Prestige',
    category: 'home-kitchen',
    price: '₹2,199',
    mrp: '₹3,295',
    discount: '33% off',
    platformId: 'amazon',
    url: 'https://www.amazon.in/Prestige-PIC-20-1200-Watt-Induction/dp/B009SSNVM8',
    image: 'https://m.media-amazon.com/images/I/71kpO85J8BL._SL1500_.jpg',
    rating: '4.1',
    reviews: '65,234',
    badge: 'Bestseller',
  },
  {
    id: 'pigeon-steel-set',
    name: 'Stainless Steel Cookware 5pc',
    brand: 'Pigeon',
    category: 'home-kitchen',
    price: '₹1,499',
    mrp: '₹3,995',
    discount: '62% off',
    platformId: 'flipkart',
    url: 'https://www.flipkart.com/pigeon-stainless-steel-cookware-set-5-piece/p/itma1d2d5d8f35db',
    image: 'https://rukminim2.flixcart.com/image/416/416/kjhgn0w0-0/cookware-set/h/h/p/12913-pigeon-original-imafz2z7hzghyygm.jpeg',
    rating: '4.0',
    reviews: '34,567',
  },
  {
    id: 'milton-flask',
    name: 'Thermosteel Flip Lid 1L',
    brand: 'Milton',
    category: 'home-kitchen',
    price: '₹699',
    mrp: '₹1,235',
    discount: '43% off',
    platformId: 'amazon',
    url: 'https://www.amazon.in/Milton-Thermosteel-Flip-1000-Silver/dp/B013HLAI4O',
    image: 'https://m.media-amazon.com/images/I/61+WGrspURL._SL1500_.jpg',
    rating: '4.3',
    reviews: '1,23,456',
    badge: 'Top Rated',
  },
  {
    id: 'havells-ceiling-fan',
    name: 'Pacer BLDC Ceiling Fan',
    brand: 'Havells',
    category: 'home-kitchen',
    price: '₹3,899',
    mrp: '₹5,100',
    discount: '24% off',
    platformId: 'croma',
    url: 'https://www.croma.com/havells-pacer-bldc-ceiling-fan/p/268934',
    image: 'https://m.media-amazon.com/images/I/41FzU+DVKQL._SL1001_.jpg',
    rating: '4.2',
    reviews: '12,345',
  },
  {
    id: 'borosil-glass-set',
    name: 'Vision Glass Set 6pcs',
    brand: 'Borosil',
    category: 'home-kitchen',
    price: '₹599',
    mrp: '₹899',
    discount: '33% off',
    platformId: 'amazon',
    url: 'https://www.amazon.in/Borosil-Vision-Glass-Set-Transparent/dp/B00M3D1JLG',
    image: 'https://m.media-amazon.com/images/I/51HqQ33o8VL._SL1500_.jpg',
    rating: '4.4',
    reviews: '45,678',
  },
  {
    id: 'meesho-bedsheet',
    name: 'Cotton Double Bedsheet Set',
    brand: 'Dreamscape',
    category: 'home-kitchen',
    price: '₹349',
    mrp: '₹1,299',
    discount: '73% off',
    platformId: 'meesho',
    url: 'https://www.meesho.com/cotton-double-bedsheet',
    image: 'https://images.meesho.com/images/products/166038052/bpmff_512.webp',
    rating: '3.9',
    reviews: '78,234',
    badge: 'Under ₹399',
  },
  {
    id: 'kent-ro-purifier',
    name: 'Grand Plus RO Purifier',
    brand: 'KENT',
    category: 'home-kitchen',
    price: '₹15,500',
    mrp: '₹21,500',
    discount: '28% off',
    platformId: 'flipkart',
    url: 'https://www.flipkart.com/kent-grand-plus-zn-ro-water-purifier/p/itmb38e81dfe51c6',
    image: 'https://rukminim2.flixcart.com/image/416/416/k2urki80/water-purifier/h/y/g/kent-grand-plus-zn-original-imafhycz2snjfdhm.jpeg',
    rating: '4.1',
    reviews: '23,456',
  },
];

// ─── Component ────────────────────────────────────────────────────────
export const ProductsScreen: React.FC<RootStackScreenProps<'Products'>> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchText, setSearchText] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, []);

  const filteredProducts = ALL_PRODUCTS.filter((p) => {
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    const matchesSearch =
      searchText.trim() === '' ||
      p.name.toLowerCase().includes(searchText.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchText.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOpenProduct = useCallback(
    async (product: Product) => {
      try {
        await openStoreApp({
          platformId: product.platformId,
          customUrl: product.url,
          navigation,
        });
      } catch {
        navigation.navigate('ShoppingWebView', {
          platformName: PLATFORMS[product.platformId]?.name || 'Store',
          url: product.url,
          color: PLATFORMS[product.platformId]?.color || '#2563EB',
          platformId: product.platformId,
        });
      }
    },
    [navigation]
  );

  const handleCompare = useCallback(
    (product: Product) => {
      navigation.navigate('ProductComparison', {
        title: `${product.brand} ${product.name}`,
        category: product.category,
      });
    },
    [navigation]
  );

  const getPlatform = (platformId: string): PlatformInfo =>
    PLATFORMS[platformId] || PLATFORMS.amazon;

  const renderProductCard = (product: Product) => {
    const platform = getPlatform(product.platformId);
    return (
      <TouchableOpacity
        key={product.id}
        style={styles.productCard}
        onPress={() => handleOpenProduct(product)}
        activeOpacity={0.88}
      >
        {/* Badge */}
        {product.badge && (
          <View style={[styles.cardBadge, { backgroundColor: platform.color }]}>
            <Text style={styles.cardBadgeText}>{product.badge}</Text>
          </View>
        )}

        {/* Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.image }}
            style={styles.productImage}
            resizeMode="contain"
            defaultSource={undefined}
          />
          {/* Platform dot */}
          <View style={[styles.platformDot, { backgroundColor: platform.color }]}>
            <GoogleIcon name={platform.icon} size={10} color="#FFFFFF" />
          </View>
        </View>

        {/* Info */}
        <View style={styles.cardInfo}>
          <Text style={styles.cardBrand}>{product.brand}</Text>
          <Text style={styles.cardName} numberOfLines={2}>{product.name}</Text>

          {/* Price Row */}
          <View style={styles.priceRow}>
            <Text style={styles.cardPrice}>{product.price}</Text>
            {product.mrp && product.mrp !== product.price && (
              <Text style={styles.cardMrp}>{product.mrp}</Text>
            )}
          </View>
          {product.discount && (
            <Text style={[styles.cardDiscount, { color: '#059669' }]}>{product.discount}</Text>
          )}

          {/* Rating */}
          {product.rating && (
            <View style={styles.ratingRow}>
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>{product.rating}</Text>
                <Text style={styles.ratingStar}>★</Text>
              </View>
              {product.reviews && (
                <Text style={styles.reviewsText}>({product.reviews})</Text>
              )}
            </View>
          )}

          {/* Platform Label */}
          <View style={[styles.platformLabel, { backgroundColor: `${platform.color}12` }]}>
            <View style={[styles.platformLabelDot, { backgroundColor: platform.color }]} />
            <Text style={[styles.platformLabelText, { color: platform.color }]}>
              {platform.name}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Two columns
  const leftCol = filteredProducts.filter((_, i) => i % 2 === 0);
  const rightCol = filteredProducts.filter((_, i) => i % 2 === 1);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <GoogleIcon name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Products</Text>
          <Text style={styles.headerSubtitle}>
            {filteredProducts.length} items • 5 stores
          </Text>
        </View>
        <View style={styles.liveTag}>
          <View style={styles.liveGreenDot} />
          <Text style={styles.liveTagText}>LIVE</Text>
        </View>
      </View>

      {/* ─── Search Bar ─── */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <GoogleIcon name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products, brands..."
            placeholderTextColor="#94A3B8"
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearBtn}>
              <GoogleIcon name="close" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ─── Category Tabs ─── */}
      <View style={styles.categorySection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryTab, isActive && styles.categoryTabActive]}
                onPress={() => setActiveCategory(cat.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text style={[styles.categoryLabel, isActive && styles.categoryLabelActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ─── Product Grid ─── */}
      <ScrollView
        contentContainerStyle={[styles.gridContainer, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <GoogleIcon name="search-off" size={52} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptySubtitle}>
              Try a different search or category
            </Text>
          </View>
        ) : (
          <>
            {/* Stores strip */}
            <View style={styles.storesStrip}>
              {Object.values(PLATFORMS).map((p) => (
                <View key={p.id} style={[styles.storeChip, { borderColor: `${p.color}30` }]}>
                  <View style={[styles.storeChipDot, { backgroundColor: p.color }]} />
                  <Text style={[styles.storeChipName, { color: p.color }]}>{p.name}</Text>
                </View>
              ))}
            </View>

            {/* Grid */}
            <View style={styles.gridColumns}>
              <View style={styles.gridColumn}>
                {leftCol.map((p) => renderProductCard(p))}
              </View>
              <View style={styles.gridColumn}>
                {rightCol.map((p) => renderProductCard(p))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  liveGreenDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
    marginRight: 4,
  },
  liveTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 0.8,
  },

  // ── Search ──
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1.2,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  clearBtn: {
    padding: 4,
  },

  // ── Category Tabs ──
  categorySection: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  categoryRow: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  categoryTabActive: {
    backgroundColor: '#0F172A',
  },
  categoryEmoji: {
    fontSize: 13,
    marginRight: 5,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  categoryLabelActive: {
    color: '#FFFFFF',
  },

  // ── Grid ──
  gridContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  gridColumns: {
    flexDirection: 'row',
    gap: 10,
  },
  gridColumn: {
    flex: 1,
    gap: 10,
  },

  // ── Stores Strip ──
  storesStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  storeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  storeChipDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4,
  },
  storeChipName: {
    fontSize: 10,
    fontWeight: '700',
  },

  // ── Product Card ──
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEF2F6',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cardBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  imageContainer: {
    width: '100%',
    height: 150,
    backgroundColor: '#FAFBFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    position: 'relative',
  },
  productImage: {
    width: '75%',
    height: '85%',
  },
  platformDot: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  cardInfo: {
    padding: 10,
  },
  cardBrand: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  cardName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 16,
    marginBottom: 6,
    minHeight: 32,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  cardMrp: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  cardDiscount: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#047857',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    gap: 2,
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  ratingStar: {
    color: '#FFFFFF',
    fontSize: 8,
  },
  reviewsText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
  },
  platformLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  platformLabelDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4,
  },
  platformLabelText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // ── Empty State ──
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
});
