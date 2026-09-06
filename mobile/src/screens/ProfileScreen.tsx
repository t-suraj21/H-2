import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { GoogleIcon } from '../components/common/GoogleIcon';
import { useAuth } from '../context/AuthContext';
import { searchHistoryApi } from '../services/productApi';
import { MainTabScreenProps } from '../navigation/types';

interface PlatformInfo {
  id: 'amazon' | 'flipkart' | 'myntra' | 'meesho';
  name: string;
  tagline: string;
  color: string;
  badgeColor: string;
  homeUrl: string;
  ordersUrl: string;
  icon: any;
}

const PLATFORMS: PlatformInfo[] = [
  {
    id: 'amazon',
    name: 'Amazon India',
    tagline: 'Prime Delivery & Pay',
    color: '#FF9900',
    badgeColor: '#FFF7ED',
    homeUrl: 'https://www.amazon.in',
    ordersUrl: 'https://www.amazon.in/gp/css/order-history',
    icon: 'shopping-cart',
  },
  {
    id: 'flipkart',
    name: 'Flipkart',
    tagline: 'Plus SuperCoins & Deals',
    color: '#2874F0',
    badgeColor: '#EFF6FF',
    homeUrl: 'https://www.flipkart.com',
    ordersUrl: 'https://www.flipkart.com/account/orders',
    icon: 'local-mall',
  },
  {
    id: 'myntra',
    name: 'Myntra',
    tagline: 'Fashion Insider Studio',
    color: '#FF3F6C',
    badgeColor: '#FFF1F2',
    homeUrl: 'https://www.myntra.com',
    ordersUrl: 'https://www.myntra.com/my/orders',
    icon: 'checkroom',
  },
  {
    id: 'meesho',
    name: 'Meesho',
    tagline: 'Direct Wholesale Mall',
    color: '#570741',
    badgeColor: '#FDF2F8',
    homeUrl: 'https://www.meesho.com',
    ordersUrl: 'https://www.meesho.com/orders',
    icon: 'storefront',
  },
];

export const ProfileScreen: React.FC<MainTabScreenProps<'Profile'>> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, token, isAuthenticated, logout, updateProfile, syncAllPlatforms, refreshUser } = useAuth();

  // Settings states
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(true);
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Sync profile with MongoDB database on mount and on pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (isAuthenticated) {
        await refreshUser();
      }
    } finally {
      setRefreshing(false);
    }
  }, [isAuthenticated, refreshUser]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshUser();
    }
  }, [isAuthenticated, refreshUser]);

  // Modals
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isEditAddressOpen, setIsEditAddressOpen] = useState(false);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [activeLegalModal, setActiveLegalModal] = useState<'privacy' | 'terms' | 'about' | null>(null);

  // Form states for Edit Profile
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editGender, setEditGender] = useState<'male' | 'female' | 'other' | 'unspecified'>(
    user?.gender || 'unspecified'
  );
  const [editDob, setEditDob] = useState(user?.dateOfBirth || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Form states for Edit Shipping Address
  const [addrFullName, setAddrFullName] = useState(user?.shippingAddress?.fullName || user?.name || '');
  const [addrLine1, setAddrLine1] = useState(user?.shippingAddress?.addressLine1 || '');
  const [addrLine2, setAddrLine2] = useState(user?.shippingAddress?.addressLine2 || '');
  const [addrCity, setAddrCity] = useState(user?.shippingAddress?.city || '');
  const [addrState, setAddrState] = useState(user?.shippingAddress?.state || '');
  const [addrPincode, setAddrPincode] = useState(user?.shippingAddress?.pincode || '');
  const [addrType, setAddrType] = useState<'home' | 'work' | 'other'>(
    user?.shippingAddress?.addressType || 'home'
  );
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Calculate Profile Completion Score
  const getProfileScore = () => {
    let score = 30; // base score for account
    if (user?.name && user.name !== 'Guest Shopper' && user.name !== 'HL² Shopper') score += 15;
    if (user?.phone) score += 20;
    if (user?.shippingAddress?.addressLine1 && user?.shippingAddress?.pincode) score += 25;
    if (user?.gender && user.gender !== 'unspecified') score += 10;
    return Math.min(score, 100);
  };

  const profileScore = getProfileScore();

  // One-tap Sync Master Profile to all 4 platforms
  const handleSyncAll = async () => {
    setIsSyncing(true);
    setSyncSuccessMsg(null);
    try {
      const res = await syncAllPlatforms();
      if (res.success) {
        setSyncSuccessMsg('✅ Profile & address synced with Amazon, Flipkart, Myntra & Meesho!');
        setTimeout(() => setSyncSuccessMsg(null), 4000);
      } else {
        Alert.alert('Sync Status', res.message || 'Synchronization complete.');
      }
    } catch {
      Alert.alert('Error', 'Unable to sync platforms right now.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Open store in WebView
  const openStore = (platform: PlatformInfo, isOrders: boolean = false) => {
    setIsOrdersModalOpen(false);
    navigation.navigate('ShoppingWebView', {
      platformName: isOrders ? `${platform.name} Orders` : platform.name,
      url: isOrders ? platform.ordersUrl : platform.homeUrl,
      color: platform.color,
    });
  };

  // Open Edit Profile modal with fresh data
  const handleOpenEditProfile = () => {
    setEditName(user?.name || '');
    setEditPhone(user?.phone || '');
    setEditGender(user?.gender || 'unspecified');
    setEditDob(user?.dateOfBirth || '');
    setIsEditProfileOpen(true);
  };

  // Save Edit Profile
  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Required', 'Please provide your name.');
      return;
    }
    setIsSavingProfile(true);
    try {
      const res = await updateProfile({
        name: editName.trim(),
        phone: editPhone.trim() || undefined,
        gender: editGender,
        dateOfBirth: editDob.trim() || undefined,
      });

      if (res.success) {
        setIsEditProfileOpen(false);
        setSyncSuccessMsg('✨ Master profile details saved and synced across stores!');
        setTimeout(() => setSyncSuccessMsg(null), 3500);
      } else {
        Alert.alert('Update Failed', res.message || 'Could not update profile.');
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred while saving.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Open Edit Address modal with fresh data
  const handleOpenEditAddress = () => {
    setAddrFullName(user?.shippingAddress?.fullName || user?.name || '');
    setAddrLine1(user?.shippingAddress?.addressLine1 || '');
    setAddrLine2(user?.shippingAddress?.addressLine2 || '');
    setAddrCity(user?.shippingAddress?.city || '');
    setAddrState(user?.shippingAddress?.state || '');
    setAddrPincode(user?.shippingAddress?.pincode || '');
    setAddrType(user?.shippingAddress?.addressType || 'home');
    setIsEditAddressOpen(true);
  };

  // Save Edit Address
  const handleSaveAddress = async () => {
    if (!addrLine1.trim() || !addrCity.trim() || !addrPincode.trim()) {
      Alert.alert('Required Fields', 'Please enter Address Line 1, City, and PIN Code.');
      return;
    }
    setIsSavingAddress(true);
    try {
      const res = await updateProfile({
        shippingAddress: {
          fullName: addrFullName.trim() || user?.name || '',
          addressLine1: addrLine1.trim(),
          addressLine2: addrLine2.trim(),
          city: addrCity.trim(),
          state: addrState.trim(),
          pincode: addrPincode.trim(),
          country: 'India',
          addressType: addrType,
        },
      });

      if (res.success) {
        setIsEditAddressOpen(false);
        setSyncSuccessMsg('📦 Delivery address updated! Ready for auto-fill in all 4 stores.');
        setTimeout(() => setSyncSuccessMsg(null), 3500);
      } else {
        Alert.alert('Update Failed', res.message || 'Could not save address.');
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred while saving address.');
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Destructive Action: Sign Out
  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your HL² account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  // Destructive Action: Clear Search History
  const handleClearSearchHistory = () => {
    Alert.alert(
      'Clear Search History',
      'This will permanently delete all your recent product searches from HL². This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear History',
          style: 'destructive',
          onPress: async () => {
            setIsClearingHistory(true);
            try {
              const res = await searchHistoryApi.clearSearchHistory(token);
              if (res.success) {
                Alert.alert('History Cleared', 'Your search history has been wiped.');
              }
            } catch {
              Alert.alert('Error', 'Failed to clear search history.');
            } finally {
              setIsClearingHistory(false);
            }
          },
        },
      ]
    );
  };

  const getInitials = (name?: string) => {
    if (!name) return 'HL';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const hasAddress = Boolean(user?.shippingAddress?.addressLine1 && user?.shippingAddress?.pincode);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 6 }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Profile</Text>
          <Text style={styles.headerSubtitle}>Universal E-Commerce Identity</Text>
        </View>
        <TouchableOpacity
          style={styles.headerSyncBtn}
          onPress={handleSyncAll}
          disabled={isSyncing}
          activeOpacity={0.7}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color="#2563EB" />
          ) : (
            <>
              <GoogleIcon name="sync" size={16} color="#2563EB" style={{ marginRight: 4 }} />
              <Text style={styles.headerSyncBtnText}>Sync Stores</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Sync Success Feedback Banner */}
      {syncSuccessMsg && (
        <View style={styles.feedbackBanner}>
          <GoogleIcon name="check-circle" size={16} color="#10B981" style={{ marginRight: 8 }} />
          <Text style={styles.feedbackBannerText}>{syncSuccessMsg}</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 95 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#2563EB"
            colors={['#2563EB']}
          />
        }
      >
        {/* ==================================================== */}
        {/* 1. MASTER PROFILE HERO CARD (VIP AESTHETIC) */}
        {/* ==================================================== */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.avatarGlow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
              </View>
            </View>

            <View style={styles.heroInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.heroName} numberOfLines={1}>
                  {user?.name || 'Guest Shopper'}
                </Text>
                <TouchableOpacity
                  style={styles.heroEditPencil}
                  onPress={handleOpenEditProfile}
                  activeOpacity={0.7}
                >
                  <GoogleIcon name="edit" size={14} color="#CBD5E1" />
                </TouchableOpacity>
              </View>

              {/* Email badge */}
              <View style={styles.contactRow}>
                <GoogleIcon name="email" size={12} color="#94A3B8" style={{ marginRight: 5 }} />
                <Text style={styles.contactText} numberOfLines={1}>
                  {user?.email || 'guest@hl2.app'}
                </Text>
              </View>

              {/* Phone badge */}
              <View style={styles.contactRow}>
                <GoogleIcon name="phone" size={12} color="#94A3B8" style={{ marginRight: 5 }} />
                <Text style={styles.contactText}>
                  {user?.phone ? `+91 ${user.phone}` : 'No phone linked — tap to add'}
                </Text>
              </View>
            </View>
          </View>

          {/* Membership Tier & Status */}
          <View style={styles.tierBanner}>
            <View style={styles.tierPill}>
              <GoogleIcon name="stars" size={14} color="#F59E0B" style={{ marginRight: 4 }} />
              <Text style={styles.tierPillText}>HL² ALL-STORE PASS • VIP</Text>
            </View>
            <Text style={styles.tierSubText}>Auto-login & auto-fill enabled</Text>
          </View>

          {/* Profile Strength Progress Bar */}
          <View style={styles.profileMeterContainer}>
            <View style={styles.meterLabels}>
              <Text style={styles.meterTitle}>Universal Profile Strength</Text>
              <Text style={styles.meterPercent}>{profileScore}%</Text>
            </View>
            <View style={styles.meterTrack}>
              <View style={[styles.meterFill, { width: `${profileScore}%` }]} />
            </View>
            {profileScore < 100 && (
              <TouchableOpacity onPress={handleOpenEditAddress} activeOpacity={0.8}>
                <Text style={styles.meterHint}>
                  {!hasAddress ? '👉 Add delivery address to reach 100% store compatibility' : '👉 Add gender & birthday to complete profile'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ==================================================== */}
        {/* 2. CONNECTED SHOPPING PLATFORMS HUB */}
        {/* ==================================================== */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionHeader}>Connected Store Accounts</Text>
            <Text style={styles.sectionSubHeader}>
              1 Master Profile powers 4 shopping giants
            </Text>
          </View>
          <TouchableOpacity
            style={styles.syncAllButton}
            onPress={handleSyncAll}
            disabled={isSyncing}
            activeOpacity={0.8}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <GoogleIcon name="sync" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.syncAllButtonText}>Sync All</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.platformsContainer}>
          {PLATFORMS.map((platform) => {
            const isConnected = user?.connectedPlatforms?.[platform.id]?.connected !== false;
            return (
              <View key={platform.id} style={styles.platformCard}>
                <View style={styles.platformMainRow}>
                  {/* Brand Icon Box */}
                  <View style={[styles.platformIconBox, { backgroundColor: platform.badgeColor }]}>
                    <GoogleIcon name={platform.icon} size={22} color={platform.color} />
                  </View>

                  {/* Brand Details */}
                  <View style={styles.platformDetails}>
                    <View style={styles.platformTitleRow}>
                      <Text style={styles.platformName}>{platform.name}</Text>
                      <View style={styles.connectedBadge}>
                        <View style={styles.greenDot} />
                        <Text style={styles.connectedBadgeText}>
                          {isConnected ? 'SYNCED' : 'READY'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.platformTagline}>{platform.tagline}</Text>
                    <Text style={styles.platformSyncInfo}>
                      Profile & Address linked via HL² Secure Injection
                    </Text>
                  </View>
                </View>

                {/* Platform Action Buttons */}
                <View style={styles.platformActionRow}>
                  <TouchableOpacity
                    style={[styles.platformOpenBtn, { borderColor: platform.color }]}
                    onPress={() => openStore(platform, false)}
                    activeOpacity={0.8}
                  >
                    <GoogleIcon name="open-in-new" size={14} color={platform.color} style={{ marginRight: 4 }} />
                    <Text style={[styles.platformOpenBtnText, { color: platform.color }]}>
                      Open Store
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.platformOrdersBtn}
                    onPress={() => openStore(platform, true)}
                    activeOpacity={0.8}
                  >
                    <GoogleIcon name="local-shipping" size={14} color="#475569" style={{ marginRight: 4 }} />
                    <Text style={styles.platformOrdersBtnText}>Track Orders</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* ==================================================== */}
        {/* 3. MULTI-STORE ACTIVITY & QUICK ACTIONS GRID */}
        {/* ==================================================== */}
        <Text style={styles.sectionHeader}>Activity & Orders Hub</Text>
        <View style={styles.activityGrid}>
          {/* Track All Orders */}
          <TouchableOpacity
            style={styles.activityTile}
            onPress={() => setIsOrdersModalOpen(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.activityIconBox, { backgroundColor: '#EFF6FF' }]}>
              <GoogleIcon name="local-shipping" size={22} color="#2563EB" />
            </View>
            <Text style={styles.activityTitle}>My Orders</Text>
            <Text style={styles.activitySub}>Amazon, Flipkart & more</Text>
          </TouchableOpacity>

          {/* Wishlist */}
          <TouchableOpacity
            style={styles.activityTile}
            onPress={() => navigation.navigate('Watchlist')}
            activeOpacity={0.7}
          >
            <View style={[styles.activityIconBox, { backgroundColor: '#FDF2F8' }]}>
              <GoogleIcon name="favorite-border" size={22} color="#EC4899" />
            </View>
            <Text style={styles.activityTitle}>Watchlist</Text>
            <Text style={styles.activitySub}>Tracked items</Text>
          </TouchableOpacity>

          {/* Price Drop Alerts */}
          <TouchableOpacity
            style={styles.activityTile}
            onPress={() => navigation.navigate('Alerts')}
            activeOpacity={0.7}
          >
            <View style={[styles.activityIconBox, { backgroundColor: '#FEF3C7' }]}>
              <GoogleIcon name="notifications-active" size={22} color="#D97706" />
            </View>
            <Text style={styles.activityTitle}>Price Alerts</Text>
            <Text style={styles.activitySub}>Automated drops</Text>
          </TouchableOpacity>

          {/* Shopping Hub Home */}
          <TouchableOpacity
            style={styles.activityTile}
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.7}
          >
            <View style={[styles.activityIconBox, { backgroundColor: '#F0FDF4' }]}>
              <GoogleIcon name="storefront" size={22} color="#10B981" />
            </View>
            <Text style={styles.activityTitle}>Stores Hub</Text>
            <Text style={styles.activitySub}>Browse all 4 stores</Text>
          </TouchableOpacity>
        </View>

        {/* ==================================================== */}
        {/* 4. MASTER DELIVERY & SHIPPING ADDRESS */}
        {/* ==================================================== */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionHeader}>Universal Delivery Address</Text>
            <Text style={styles.sectionSubHeader}>
              Auto-filled during checkout on all 4 stores
            </Text>
          </View>
          <TouchableOpacity
            style={styles.editAddressPill}
            onPress={handleOpenEditAddress}
            activeOpacity={0.8}
          >
            <GoogleIcon name="edit" size={13} color="#2563EB" style={{ marginRight: 4 }} />
            <Text style={styles.editAddressPillText}>{hasAddress ? 'Edit' : 'Add'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.addressCard}>
          {hasAddress ? (
            <View>
              <View style={styles.addressTopRow}>
                <View style={styles.addressTypeBadge}>
                  <GoogleIcon
                    name={user?.shippingAddress?.addressType === 'work' ? 'work' : 'home'}
                    size={12}
                    color="#2563EB"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.addressTypeBadgeText}>
                    {(user?.shippingAddress?.addressType || 'HOME').toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.addressRecipient}>
                  {user?.shippingAddress?.fullName || user?.name}
                </Text>
              </View>

              <Text style={styles.addressLines}>
                {user?.shippingAddress?.addressLine1}
                {user?.shippingAddress?.addressLine2 ? `, ${user.shippingAddress.addressLine2}` : ''}
              </Text>
              <Text style={styles.addressCity}>
                {user?.shippingAddress?.city}, {user?.shippingAddress?.state || ''} —{' '}
                <Text style={{ fontWeight: '700', color: '#0F172A' }}>
                  {user?.shippingAddress?.pincode}
                </Text>
              </Text>
              <Text style={styles.addressCountry}>India • Mobile: {user?.phone || 'Linked'}</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.emptyAddressBox}
              onPress={handleOpenEditAddress}
              activeOpacity={0.7}
            >
              <GoogleIcon name="add-location-alt" size={28} color="#2563EB" />
              <Text style={styles.emptyAddressTitle}>No Default Address Set</Text>
              <Text style={styles.emptyAddressSub}>
                Add your shipping address once, and HL² will auto-fill it whenever you shop on Amazon, Flipkart, Myntra, or Meesho.
              </Text>
              <View style={styles.addAddressBtn}>
                <Text style={styles.addAddressBtnText}>+ Add Shipping Address</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* ==================================================== */}
        {/* 5. PERSONAL DETAILS & PREFERENCES */}
        {/* ==================================================== */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>Personal Information</Text>
          <TouchableOpacity onPress={handleOpenEditProfile} activeOpacity={0.8}>
            <Text style={styles.editSectionLink}>Edit Details</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.settingsCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Full Name</Text>
            <Text style={styles.infoValue}>{user?.name || 'Guest Shopper'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email || 'guest@hl2.app'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone Number</Text>
            <Text style={styles.infoValue}>{user?.phone ? `+91 ${user.phone}` : 'Not added'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Gender</Text>
            <Text style={styles.infoValue}>
              {user?.gender && user.gender !== 'unspecified'
                ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1)
                : 'Not specified'}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date of Birth</Text>
            <Text style={styles.infoValue}>{user?.dateOfBirth || 'Not specified'}</Text>
          </View>
        </View>

        {/* ==================================================== */}
        {/* 6. NOTIFICATION & PREFERENCE SWITCHES */}
        {/* ==================================================== */}
        <Text style={styles.sectionHeader}>Notification Preferences</Text>
        <View style={styles.settingsCard}>
          <View style={styles.switchRow}>
            <View style={styles.switchTextCol}>
              <View style={styles.switchTitleRow}>
                <GoogleIcon name="notifications" size={16} color="#0F172A" style={{ marginRight: 6 }} />
                <Text style={styles.switchTitle}>Push Notifications</Text>
              </View>
              <Text style={styles.switchSub}>
                Instant price drop alerts across Amazon, Flipkart, Meesho & Myntra
              </Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: '#E2E8F0', true: '#2563EB' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={styles.switchTextCol}>
              <View style={styles.switchTitleRow}>
                <GoogleIcon name="mail-outline" size={16} color="#0F172A" style={{ marginRight: 6 }} />
                <Text style={styles.switchTitle}>Email Deal Digests</Text>
              </View>
              <Text style={styles.switchSub}>
                Weekly curated price drop digests from all 4 shopping giants
              </Text>
            </View>
            <Switch
              value={emailAlertsEnabled}
              onValueChange={setEmailAlertsEnabled}
              trackColor={{ false: '#E2E8F0', true: '#2563EB' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* ==================================================== */}
        {/* 7. LEGAL, PRIVACY & ABOUT */}
        {/* ==================================================== */}
        <Text style={styles.sectionHeader}>Legal & Support</Text>
        <View style={styles.settingsCard}>
          <TouchableOpacity
            style={styles.navRow}
            activeOpacity={0.7}
            onPress={() => setActiveLegalModal('privacy')}
          >
            <View style={styles.navIconBox}>
              <GoogleIcon name="security" size={18} color="#0F172A" />
            </View>
            <View style={styles.navTextCol}>
              <Text style={styles.navTitle}>Privacy Policy</Text>
              <Text style={styles.navSub}>Encrypted credentials, zero data selling</Text>
            </View>
            <GoogleIcon name="chevron-right" size={20} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.navRow}
            activeOpacity={0.7}
            onPress={() => setActiveLegalModal('terms')}
          >
            <View style={styles.navIconBox}>
              <GoogleIcon name="description" size={18} color="#0F172A" />
            </View>
            <View style={styles.navTextCol}>
              <Text style={styles.navTitle}>Terms of Service</Text>
              <Text style={styles.navSub}>Multi-store auto-fill & shopping terms</Text>
            </View>
            <GoogleIcon name="chevron-right" size={20} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.navRow}
            activeOpacity={0.7}
            onPress={() => setActiveLegalModal('about')}
          >
            <View style={styles.navIconBox}>
              <GoogleIcon name="info" size={18} color="#2563EB" />
            </View>
            <View style={styles.navTextCol}>
              <Text style={styles.navTitle}>About HL² Universal Hub</Text>
              <Text style={styles.navSub}>Version 2.0.0 • Multi-Store Architecture</Text>
            </View>
            <GoogleIcon name="chevron-right" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* ==================================================== */}
        {/* 8. DATA MANAGEMENT & LOGOUT */}
        {/* ==================================================== */}
        <Text style={styles.sectionHeader}>Account Actions</Text>
        <View style={styles.settingsCard}>
          <TouchableOpacity
            style={styles.navRow}
            activeOpacity={0.7}
            onPress={handleClearSearchHistory}
            disabled={isClearingHistory}
          >
            <View style={[styles.navIconBox, { backgroundColor: '#FEF2F2' }]}>
              <GoogleIcon name="delete-outline" size={18} color="#DC2626" />
            </View>
            <View style={styles.navTextCol}>
              <Text style={[styles.navTitle, { color: '#DC2626' }]}>
                {isClearingHistory ? 'Clearing History...' : 'Clear Search History'}
              </Text>
              <Text style={styles.navSub}>Remove cached searches & links</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Sign Out / Sign In Button */}
        <View style={{ marginTop: 8, marginBottom: 20 }}>
          {isAuthenticated ? (
            <TouchableOpacity
              style={styles.signOutBtn}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <GoogleIcon name="logout" size={16} color="#DC2626" style={{ marginRight: 6 }} />
              <Text style={styles.signOutBtnText}>Sign Out of HL²</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.signInBtn}
              onPress={() => navigation.navigate('Auth', { screen: 'Login' })}
              activeOpacity={0.88}
            >
              <GoogleIcon name="login" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.signInBtnText}>Sign In / Create Account</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Footer */}
        <View style={styles.appFooter}>
          <View style={styles.footerBrandRow}>
            <Text style={styles.footerBrandBadge}>HL</Text>
            <Text style={styles.footerBrandSup}>²</Text>
            <Text style={styles.appFooterBrand}>Universal Shopping Hub</Text>
          </View>
          <Text style={styles.appFooterVersion}>
            Amazon • Flipkart • Myntra • Meesho Unified
          </Text>
        </View>
      </ScrollView>

      {/* ==================================================== */}
      {/* MODAL 1: EDIT PERSONAL DETAILS */}
      {/* ==================================================== */}
      <Modal
        visible={isEditProfileOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsEditProfileOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Master Profile</Text>
            <TouchableOpacity
              onPress={() => setIsEditProfileOpen(false)}
              style={styles.modalCloseBtn}
            >
              <GoogleIcon name="close" size={20} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.textInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="e.g. John Doe"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.inputLabel}>Phone Number (+91)</Text>
            <TextInput
              style={styles.textInput}
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="10-digit mobile number"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              maxLength={10}
            />

            <Text style={styles.inputLabel}>Gender</Text>
            <View style={styles.genderRow}>
              {(['male', 'female', 'other'] as const).map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.genderPill,
                    editGender === g && styles.genderPillActive,
                  ]}
                  onPress={() => setEditGender(g)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.genderPillText,
                      editGender === g && styles.genderPillTextActive,
                    ]}
                  >
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Date of Birth</Text>
            <TextInput
              style={styles.textInput}
              value={editDob}
              onChangeText={setEditDob}
              placeholder="DD/MM/YYYY"
              placeholderTextColor="#94A3B8"
            />

            <TouchableOpacity
              style={styles.saveModalBtn}
              onPress={handleSaveProfile}
              disabled={isSavingProfile}
              activeOpacity={0.85}
            >
              {isSavingProfile ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveModalBtnText}>Save & Sync Profile</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* ==================================================== */}
      {/* MODAL 2: EDIT DELIVERY ADDRESS */}
      {/* ==================================================== */}
      <Modal
        visible={isEditAddressOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsEditAddressOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Universal Delivery Address</Text>
            <TouchableOpacity
              onPress={() => setIsEditAddressOpen(false)}
              style={styles.modalCloseBtn}
            >
              <GoogleIcon name="close" size={20} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalHelperText}>
              This address will automatically fill in Amazon, Flipkart, Myntra, and Meesho checkouts.
            </Text>

            <Text style={styles.inputLabel}>Address Type</Text>
            <View style={styles.genderRow}>
              {(['home', 'work', 'other'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.genderPill,
                    addrType === t && styles.genderPillActive,
                  ]}
                  onPress={() => setAddrType(t)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.genderPillText,
                      addrType === t && styles.genderPillTextActive,
                    ]}
                  >
                    {t.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Recipient Full Name</Text>
            <TextInput
              style={styles.textInput}
              value={addrFullName}
              onChangeText={setAddrFullName}
              placeholder="Full name for delivery"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.inputLabel}>Flat, House No., Building, Apartment</Text>
            <TextInput
              style={styles.textInput}
              value={addrLine1}
              onChangeText={setAddrLine1}
              placeholder="e.g. Flat 402, Sunshine Heights"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.inputLabel}>Area, Colony, Street, Landmark</Text>
            <TextInput
              style={styles.textInput}
              value={addrLine2}
              onChangeText={setAddrLine2}
              placeholder="e.g. Near City Mall, MG Road"
              placeholderTextColor="#94A3B8"
            />

            <View style={styles.twoColRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.inputLabel}>City</Text>
                <TextInput
                  style={styles.textInput}
                  value={addrCity}
                  onChangeText={setAddrCity}
                  placeholder="e.g. Mumbai"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.inputLabel}>State</Text>
                <TextInput
                  style={styles.textInput}
                  value={addrState}
                  onChangeText={setAddrState}
                  placeholder="e.g. Maharashtra"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>PIN Code (6 digits)</Text>
            <TextInput
              style={styles.textInput}
              value={addrPincode}
              onChangeText={setAddrPincode}
              placeholder="e.g. 400001"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              maxLength={6}
            />

            <TouchableOpacity
              style={styles.saveModalBtn}
              onPress={handleSaveAddress}
              disabled={isSavingAddress}
              activeOpacity={0.85}
            >
              {isSavingAddress ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveModalBtnText}>Save & Apply to All Stores</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* ==================================================== */}
      {/* MODAL 3: ORDERS HUB SELECTOR */}
      {/* ==================================================== */}
      <Modal
        visible={isOrdersModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsOrdersModalOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Multi-Store Orders</Text>
            <TouchableOpacity
              onPress={() => setIsOrdersModalOpen(false)}
              style={styles.modalCloseBtn}
            >
              <GoogleIcon name="close" size={20} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.modalHelperText}>
              Select a store to view your orders, shipments, and live delivery tracking.
            </Text>

            {PLATFORMS.map((platform) => (
              <TouchableOpacity
                key={platform.id}
                style={styles.orderStoreCard}
                onPress={() => openStore(platform, true)}
                activeOpacity={0.7}
              >
                <View style={[styles.platformIconBox, { backgroundColor: platform.badgeColor }]}>
                  <GoogleIcon name={platform.icon} size={22} color={platform.color} />
                </View>
                <View style={styles.orderStoreInfo}>
                  <Text style={styles.orderStoreTitle}>{platform.name} Orders</Text>
                  <Text style={styles.orderStoreSub}>View shipments & tracking</Text>
                </View>
                <GoogleIcon name="chevron-right" size={20} color="#94A3B8" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* ==================================================== */}
      {/* MODAL 4: LEGAL & ABOUT */}
      {/* ==================================================== */}
      <Modal
        visible={activeLegalModal !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setActiveLegalModal(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {activeLegalModal === 'privacy'
                ? 'Privacy Policy'
                : activeLegalModal === 'terms'
                ? 'Terms of Service'
                : 'About HL²'}
            </Text>
            <TouchableOpacity
              onPress={() => setActiveLegalModal(null)}
              style={styles.modalCloseBtn}
            >
              <GoogleIcon name="close" size={20} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {activeLegalModal === 'privacy' ? (
              <View style={styles.legalContent}>
                <Text style={styles.legalSectionTitle}>1. Privacy-First Unified Identity</Text>
                <Text style={styles.legalParagraph}>
                  HL² is engineered to protect your personal information. Your credentials, phone number, and delivery addresses are encrypted on device and in transit. We never sell or broker your data.
                </Text>
                <Text style={styles.legalSectionTitle}>2. Auto-Fill Security</Text>
                <Text style={styles.legalParagraph}>
                  Auto-fill injections into Amazon, Flipkart, Myntra, and Meesho occur locally within your app's isolated WebView sandbox. No third-party servers intercept your credentials.
                </Text>
              </View>
            ) : activeLegalModal === 'terms' ? (
              <View style={styles.legalContent}>
                <Text style={styles.legalSectionTitle}>1. Universal E-Commerce Access</Text>
                <Text style={styles.legalParagraph}>
                  HL² provides unified access and credential autofill for Amazon, Flipkart, Myntra, and Meesho. All purchases and financial transactions occur directly on the authorized retailer platforms.
                </Text>
                <Text style={styles.legalSectionTitle}>2. Merchant Disclosures</Text>
                <Text style={styles.legalParagraph}>
                  HL² is independent and connects to real online shopping platforms to give shoppers a single, convenient control center.
                </Text>
              </View>
            ) : (
              <View style={styles.legalContent}>
                <View style={styles.aboutHero}>
                  <View style={styles.aboutLogoBadge}>
                    <Text style={styles.aboutLogoText}>HL</Text>
                    <Text style={styles.aboutLogoSup}>²</Text>
                  </View>
                  <Text style={styles.aboutAppName}>HL² Universal Shopping Hub</Text>
                  <Text style={styles.aboutTagline}>Amazon • Flipkart • Myntra • Meesho</Text>
                </View>
                <Text style={styles.legalParagraph}>
                  HL² empowers shoppers across India with a single master identity that works seamlessly across all top e-commerce platforms. One profile, one delivery address, infinite shopping.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  headerSyncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  headerSyncBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderBottomWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  feedbackBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  // Hero Card
  heroCard: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarGlow: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  heroName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    flex: 1,
  },
  heroEditPencil: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  contactText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  tierBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tierPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 0.3,
  },
  tierSubText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  profileMeterContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 14,
    padding: 12,
  },
  meterLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  meterTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  meterPercent: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F59E0B',
  },
  meterTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },
  meterHint: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 6,
    fontWeight: '500',
  },

  // Sections
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
    marginTop: 6,
    marginLeft: 2,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  sectionSubHeader: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  syncAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  syncAllButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  editSectionLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
    marginBottom: 2,
  },

  // Connected Platforms
  platformsContainer: {
    marginBottom: 20,
    gap: 10,
  },
  platformCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1.2,
    borderRadius: 18,
    padding: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  platformMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  platformIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  platformDetails: {
    flex: 1,
  },
  platformTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  platformName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 4,
  },
  connectedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.3,
  },
  platformTagline: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  platformSyncInfo: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  platformActionRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  platformOpenBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    borderRadius: 18,
    borderWidth: 1.2,
    backgroundColor: '#FFFFFF',
  },
  platformOpenBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  platformOrdersBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  platformOrdersBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },

  // Activity Grid
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  activityTile: {
    width: '48.4%',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1.2,
    borderRadius: 18,
    padding: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  activityIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  activitySub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  // Address Card
  editAddressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  editAddressPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1.2,
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  addressTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  addressTypeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
  },
  addressRecipient: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  addressLines: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  addressCity: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  addressCountry: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  emptyAddressBox: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  emptyAddressTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
  },
  emptyAddressSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 4,
    paddingHorizontal: 12,
  },
  addAddressBtn: {
    marginTop: 12,
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  addAddressBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Settings & Info Cards
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1.2,
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  switchTextCol: {
    flex: 1,
    marginRight: 12,
  },
  switchTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  switchSub: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  navIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  navTextCol: {
    flex: 1,
  },
  navTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  navSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
  },
  signOutBtnText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 23,
    backgroundColor: '#0F172A',
  },
  signInBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // App Footer
  appFooter: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  footerBrandBadge: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  footerBrandSup: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
    marginTop: -4,
    marginRight: 6,
  },
  appFooterBrand: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  appFooterVersion: {
    fontSize: 11,
    color: '#94A3B8',
  },

  // Modals
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  modalHelperText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  textInput: {
    height: 48,
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  genderPill: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  genderPillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  genderPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  genderPillTextActive: {
    color: '#2563EB',
    fontWeight: '800',
  },
  twoColRow: {
    flexDirection: 'row',
  },
  saveModalBtn: {
    height: 48,
    backgroundColor: '#2563EB',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  saveModalBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // Orders Store Card in Modal
  orderStoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 10,
  },
  orderStoreInfo: {
    flex: 1,
  },
  orderStoreTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  orderStoreSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  // Legal modal content
  legalContent: {
    paddingBottom: 40,
  },
  legalSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 16,
    marginBottom: 6,
  },
  legalParagraph: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  aboutHero: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 16,
  },
  aboutLogoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1.5,
    marginBottom: 10,
  },
  aboutLogoText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  aboutLogoSup: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563EB',
    marginTop: -8,
  },
  aboutAppName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  aboutTagline: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '700',
    marginTop: 2,
  },
});
