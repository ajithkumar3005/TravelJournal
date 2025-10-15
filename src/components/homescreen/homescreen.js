import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  RefreshControl,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useDispatch, useSelector } from 'react-redux';
import { initDB, getEntries, clearDatabase } from '../../db/dbconfiguration';
import JournalCard from '../journal/journal';
import { setEntries } from '../../redux/actions/action';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import { clearUserSession } from '../../services/secureStore';
import Toast from 'react-native-toast-message';
import Color from '../../styles/color';

const EmptyListView = () => (
  <View style={styles.emptyContainer}>
    <MaterialIcons name="note-add" size={64} color="#66A5AD" />
    <Text style={styles.emptyTitle}>No Entries Yet</Text>
    <Text style={styles.emptySubtitle}>
      Start documenting your journey by adding your first entry
    </Text>
  </View>
);

export default function JournalHomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const entries = useSelector(state => state.journal.entries);
  const [searchText, setSearchText] = useState('');
  const [filteredEntries, setFilteredEntries] = useState(entries);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState([null, null]);
  const [location, setLocation] = useState(null); // Optionally use location API for proximity filtering
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [radius, setRadius] = useState(10); // Default 10km radius

  const loadData = async () => {
    try {
      await initDB(); // Initialize database first
      const storedEntries = await getEntries();
      dispatch(setEntries(storedEntries));
      setFilteredEntries(storedEntries);
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  // Search function
  const handleSearch = async text => {
    setSearchText(text);
    if (!text.trim()) {
      const allEntries = await getEntries();
      setFilteredEntries(allEntries);
      return;
    }

    try {
      const dbEntries = await getEntries();
      const filtered = dbEntries.filter(entry => {
        const searchTerm = text.toLowerCase();
        const titleMatch = entry.title?.toLowerCase().includes(searchTerm);
        const descMatch = entry.description?.toLowerCase().includes(searchTerm);
        const parsedTags = parseData(entry.tags, []);
        const tagMatch = parsedTags.some(tag =>
          tag.toLowerCase().includes(searchTerm),
        );
        return titleMatch || descMatch || tagMatch;
      });
      setFilteredEntries(filtered);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const parseData = (data, defaultValue = []) => {
    try {
      return typeof data === 'string' ? JSON.parse(data) : defaultValue;
    } catch (error) {
      return defaultValue;
    }
  };

  const handleFilter = async () => {
    try {
      const dbEntries = await getEntries();
      let filtered = dbEntries;

      // Apply date range filter if both dates are present
      if (fromDate && toDate) {
        filtered = filtered.filter(entry => {
          const entryDate = new Date(entry.date);
          return entryDate >= fromDate && entryDate <= toDate;
        });
      }

      // Apply location filter if coordinates are available
      if (currentLocation && radius) {
        filtered = filtered.filter(entry => {
          if (entry.location === 'Unknown') return false;

          const [lat, lon] = entry.location.split(',').map(Number);
          const distance = calculateDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            lat,
            lon,
          );
          return distance <= radius;
        });
      }

      // Apply search text if present
      if (searchText.trim()) {
        const searchTerm = searchText.toLowerCase();
        filtered = filtered.filter(
          entry =>
            entry.title?.toLowerCase().includes(searchTerm) ||
            entry.description?.toLowerCase().includes(searchTerm),
        );
      }

      setFilteredEntries(filtered);
      setFilterModalVisible(false);
    } catch (error) {
      console.error('Filter error:', error);
    }
  };

  const isFilterEnabled = () => {
    return (
      (fromDate && toDate) ||
      (currentLocation && radius) ||
      searchText.trim().length > 0
    );
  };

  // Basic distance calculation (for demonstration purposes)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = value => (value * Math.PI) / 180;
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure? This will clear all your data.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await clearUserSession(); // Clear auth data
            await clearDatabase(); // Clear SQLite data
            dispatch(setEntries([])); // Clear Redux state

            Toast.show({
              type: 'success',
              text1: 'Logged out successfully',
              text2: 'All data cleared',
              position: 'bottom',
            });

            navigation.replace('Login');
          } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'Failed to logout and clear data');
          }
        },
      },
    ]);
  };

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, []),
  );
  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={[Color.maincolor, Color.btnColor]}
        style={styles.gradient}
      >
        <View style={styles.container}>
          <View style={styles.headerContainer}>
            <Text style={styles.header}>My Travel Journal</Text>
            <TouchableOpacity
              onPress={handleLogout}
              style={styles.logoutButton}
            >
              <MaterialIcons name="logout" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchBarWrapper}>
              <MaterialIcons
                name="search"
                size={20}
                color="#FFFF"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search entries..."
                placeholderTextColor="#FFFF"
                value={searchText}
                onChangeText={handleSearch}
              />
            </View>

            <TouchableOpacity
              style={styles.filterIconButton}
              onPress={() => setFilterModalVisible(true)}
            >
              <MaterialIcons name="tune" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('AddEntry')}
          >
            <Text style={styles.buttonText}>+ Add New Entry</Text>
          </TouchableOpacity>

          {/* Filter Modal */}
          {filterModalVisible && (
            <Modal
              transparent={true}
              animationType="slide"
              visible={filterModalVisible}
              onRequestClose={() => setFilterModalVisible(false)}
            >
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <Text style={styles.filterTitle}>Filter by Date Range</Text>
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => setShowFromPicker(true)}
                  >
                    <Text style={styles.dateText}>
                      From:{' '}
                      {fromDate ? fromDate.toLocaleDateString() : 'Select date'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => setShowToPicker(true)}
                  >
                    <Text style={styles.dateText}>
                      To: {toDate ? toDate.toLocaleDateString() : 'Select date'}
                    </Text>
                  </TouchableOpacity>

                  {/* 👇 Date Picker Components */}
                  {showFromPicker && (
                    <DateTimePicker
                      value={fromDate || new Date()}
                      mode="date"
                      display="default"
                      onChange={(event, selectedDate) => {
                        setShowFromPicker(false);
                        if (selectedDate) setFromDate(selectedDate);
                      }}
                    />
                  )}

                  {showToPicker && (
                    <DateTimePicker
                      value={toDate || new Date()}
                      mode="date"
                      display="default"
                      onChange={(event, selectedDate) => {
                        setShowToPicker(false);
                        if (selectedDate) setToDate(selectedDate);
                      }}
                    />
                  )}

                  {/* Action Buttons */}
                  <TouchableOpacity
                    style={[
                      styles.applyButton,
                      !isFilterEnabled() && styles.disabledButton,
                    ]}
                    onPress={handleFilter}
                    disabled={!isFilterEnabled()}
                  >
                    <Text style={styles.buttonText}>Apply Filters</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setFilterModalVisible(false)}
                  >
                    <Text style={styles.buttonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}

          <FlatList
            data={filteredEntries}
            keyExtractor={item => item.id?.toString()}
            renderItem={({ item }) => (
              <JournalCard
                item={item}
                onPress={() => navigation.navigate('Details', { item })}
                navigation={navigation}
                onDelete={loadData}
              />
            )}
            ListEmptyComponent={EmptyListView}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#07575B']}
                tintColor="#07575B"
              />
            }
            contentContainerStyle={[
              styles.listContent,
              !filteredEntries.length && styles.emptyList,
            ]}
          />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Color.maincolor,
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  logoutButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  searchBarWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Color.lightcolor,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Color.white,
    padding: 0,
  },
  filterIconButton: {
    width: 48,
    height: 48,
    backgroundColor: Color.bgcolor,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  button: {
    backgroundColor: Color.btnColor,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#003B46',
    marginBottom: 20,
    textAlign: 'center',
  },
  dateInput: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dateText: {
    fontSize: 15,
    color: '#333',
  },
  applyButton: {
    backgroundColor: '#07575B',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  closeButton: {
    backgroundColor: '#07575B',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 22,
  },
});
