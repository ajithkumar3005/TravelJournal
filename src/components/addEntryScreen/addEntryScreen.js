import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useDispatch } from 'react-redux';
import { addEntry, updateEntry } from '../../redux/actions/action';
import { saveEntry, initDB, updateDataEntry } from '../../db/dbconfiguration';
import { SafeAreaView } from 'react-native-safe-area-context';
import Geolocation from '@react-native-community/geolocation';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import LinearGradient from 'react-native-linear-gradient';
import { analyzeImage } from '../../services/visionApi';
import NetInfo from '@react-native-community/netinfo';
import Color from '../../styles/color';

export default function AddEntryScreen({ navigation, route }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [photos, setPhotos] = useState([]);
  const [location, setLocation] = useState(null);
  const [tags, setTags] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const dispatch = useDispatch();
  const editItem = route.params?.item;

  useEffect(() => {
    const fetchLocation = async () => {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Denied',
          'We need your location to tag this journal entry.',
        );
        return;
      }

      Geolocation.getCurrentPosition(
        position => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        error => console.log('Geolocation error:', error),
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 },
      );
    };

    fetchLocation();
  }, []);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message:
              'This app needs access to your location to tag your journal entry.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const parseData = (data, defaultValue = []) => {
    try {
      let result = data;
      while (typeof result === 'string') {
        result = JSON.parse(result);
      }
      return Array.isArray(result) ? result : defaultValue;
    } catch (error) {
      console.error('Error parsing data:', error);
      return defaultValue;
    }
  };

  useEffect(() => {
    if (editItem) {
      setTitle(editItem.title);
      setDesc(editItem.description);

      const parsedPhotos = parseData(editItem.photos, []);
      setPhotos(parsedPhotos);

      if (editItem.location !== 'Unknown') {
        const [lat, lon] = editItem.location.split(',');
        setLocation({ latitude: parseFloat(lat), longitude: parseFloat(lon) });
      }

      setTags(parseData(editItem.tags, []));

      if (editItem.date) {
        setSelectedDate(new Date(editItem.date));
      }
    }
  }, [editItem]);

  useEffect(() => {
    initDB().catch(err =>
      console.error('Database initialization failed:', err),
    );
  }, []);

  useEffect(() => {
    // Add network listener
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  const pickImage = async () => {
    if (photos.length >= 5) {
      Alert.alert('Limit Reached', 'Maximum 5 photos allowed');
      return;
    }

    launchImageLibrary(
      {
        mediaType: 'photo',
        includeBase64: true,
        selectionLimit: 5 - photos.length,
      },
      async res => {
        if (res.assets) {
          const newPhotos = res.assets.map(img => img.uri);
          setPhotos([...photos, ...newPhotos]);

          // Only analyze if online
          if (isOnline) {
            setIsAnalyzing(true);
            try {
              for (const photo of newPhotos) {
                const result = await analyzeImage(photo);
                if (result.success) {
                  setTags(prevTags => [
                    ...new Set([...prevTags, ...result.tags]),
                  ]);
                }
              }
            } catch (error) {
              console.error('Image analysis error:', error);
            } finally {
              setIsAnalyzing(false);
            }
          }
        }
      },
    );
  };

  const removePhoto = index => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const saveJournal = async () => {
    try {
      if (!title.trim()) {
        Alert.alert('Error', 'Title is required');
        return;
      }

      const formattedEntry = {
        title: title.trim(),
        description: desc.trim(),
        photos: JSON.stringify(photos || []),
        date: selectedDate.toISOString(),
        location: location
          ? `${location.latitude},${location.longitude}`
          : 'Unknown',
        tags: JSON.stringify(tags || []),
        isOffline: !isOnline || (photos.length > 0 && tags.length === 0), // Mark as offline if no network or has unanalyzed photos
      };

      let result;
      if (editItem) {
        result = await updateDataEntry(editItem.id, formattedEntry);
        if (result.success) {
          dispatch(
            updateEntry({
              ...formattedEntry,
              id: editItem.id,
              photos: photos || [],
              tags: tags || [],
            }),
          );
        }
      } else {
        result = await saveEntry(formattedEntry);
        if (result.success) {
          dispatch(
            addEntry({
              ...formattedEntry,
              id: result.id,
              photos: photos || [],
              tags: tags || [],
            }),
          );
        }
      }

      if (!result.success) {
        const errorMessage =
          result.error?.message || result.error || 'Failed to save entry';
        console.error('Operation failed:', errorMessage);
        throw new Error(errorMessage);
      }

      navigation.navigate('Home');
    } catch (error) {
      const errorMessage = error?.message || 'An unexpected error occurred';
      console.error('Error saving journal:', {
        error,
        message: errorMessage,
        stack: error?.stack,
      });
      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={[Color.maincolor, Color.btnColor]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {editItem ? 'Edit Entry' : 'New Entry'}
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Title Input Card */}
          <View style={styles.card}>
            <View style={styles.inputHeader}>
              <MaterialIcons name="title" size={22} color="#07575B" />
              <Text style={styles.inputLabel}>Title</Text>
            </View>
            <TextInput
              placeholder="Enter a title for your journey"
              placeholderTextColor="#999"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
            />
          </View>

          {/* Description Input Card */}
          <View style={styles.card}>
            <View style={styles.inputHeader}>
              <MaterialIcons name="description" size={22} color="#07575B" />
              <Text style={styles.inputLabel}>Description</Text>
            </View>
            <TextInput
              placeholder="Share your experience..."
              placeholderTextColor="#999"
              value={desc}
              onChangeText={setDesc}
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={5}
            />
          </View>

          {/* Date Picker Card */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => setShowDatePicker(true)}
          >
            <View style={styles.inputHeader}>
              <MaterialIcons name="event" size={22} color="#07575B" />
              <Text style={styles.inputLabel}>Date</Text>
            </View>
            <View style={styles.dateDisplay}>
              <Text style={styles.dateText}>
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
              <MaterialIcons name="chevron-right" size={24} color="#999" />
            </View>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (date) {
                  setSelectedDate(date);
                }
              }}
            />
          )}

          {/* Photos Card */}
          <View style={styles.card}>
            <View style={styles.inputHeader}>
              <MaterialIcons name="photo-library" size={22} color="#07575B" />
              <Text style={styles.inputLabel}>Photos ({photos.length}/5)</Text>
            </View>

            <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
              <MaterialIcons
                name="add-photo-alternate"
                size={32}
                color="#07575B"
              />
              <Text style={styles.addPhotoText}>Add Photos</Text>
            </TouchableOpacity>

            {photos.length > 0 && (
              <View style={styles.photoGrid}>
                {photos.map((photo, index) => (
                  <View key={index} style={styles.photoContainer}>
                    <Image source={{ uri: photo }} style={styles.thumbnail} />
                    <TouchableOpacity
                      onPress={() => removePhoto(index)}
                      style={styles.removeButton}
                    >
                      <MaterialIcons name="close" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Location Info Card */}
          {location && (
            <View style={styles.card}>
              <View style={styles.inputHeader}>
                <MaterialIcons name="location-on" size={22} color="#07575B" />
                <Text style={styles.inputLabel}>Location</Text>
              </View>
              <View style={styles.locationInfo}>
                <MaterialIcons name="my-location" size={20} color="#666" />
                <Text style={styles.locationText}>
                  {location.latitude.toFixed(6)},{' '}
                  {location.longitude.toFixed(6)}
                </Text>
              </View>
            </View>
          )}

          {/* Tags Display */}
          {tags.length > 0 && (
            <View style={styles.card}>
              <View style={styles.inputHeader}>
                <MaterialIcons name="local-offer" size={22} color="#07575B" />
                <Text style={styles.inputLabel}>Auto-detected Tags</Text>
              </View>
              <View style={styles.tagContainer}>
                {tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          {isAnalyzing && (
            <View style={styles.card}>
              <Text style={styles.analyzingText}>Analyzing images...</Text>
            </View>
          )}

          {/* Save Button */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveJournal}
            disabled={isAnalyzing}
          >
            <LinearGradient
              colors={[Color.maincolor, Color.btnColor]}
              style={styles.saveButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <MaterialIcons name="check-circle" size={24} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>
                {editItem ? 'Update Entry' : 'Save Entry'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  input: {
    backgroundColor: Color.white,
    color: Color.fontColor,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dateText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  addPhotoButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  addPhotoText: {
    fontSize: 15,
    color: '#07575B',
    fontWeight: '600',
    marginTop: 8,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  photoContainer: {
    position: 'relative',
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(199, 0, 57, 0.9)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  saveButton: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 10,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#F0F7F8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#07575B',
  },
  tagText: {
    color: '#07575B',
    fontSize: 14,
  },
  analyzingText: {
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
