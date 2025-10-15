import React, { useState } from 'react';
import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { deleteEntry } from '../../db/dbconfiguration';
import { removeEntry } from '../../redux/actions/action';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Color from '../../styles/color';

const { width } = Dimensions.get('window');

export default function DetailScreen({ route, navigation }) {
  const { item } = route.params;
  const dispatch = useDispatch();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const parsePhotos = () => {
    try {
      let photos = item.photos;
      while (typeof photos === 'string') {
        photos = JSON.parse(photos);
      }
      return Array.isArray(photos) ? photos : [];
    } catch (error) {
      console.error('Error parsing photos:', error);
      return [];
    }
  };

  const parseTags = tagData => {
    try {
      if (!tagData) return [];
      let parsed = tagData;
      while (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
      }
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('Tags parsing failed:', error);
      return [];
    }
  };

  const photos = parsePhotos();
  const tags = parseTags(item.tags);

  const handleDelete = () => {
    Alert.alert('Delete Entry', 'Are you sure you want to delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const result = await deleteEntry(item.id);
          if (result.success) {
            dispatch(removeEntry(item.id));
            navigation.goBack();
          }
        },
      },
    ]);
  };

  const handleEdit = () => {
    navigation.navigate('AddEntry', { item });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#042026', '#003B46']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.headerTitle}>Journey Details</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Image Section */}
          {photos.length > 0 && (
            <View style={styles.heroSection}>
              <Image
                source={{ uri: photos[selectedImageIndex] }}
                style={styles.heroImage}
                resizeMode="cover"
              />

              {/* Image Indicators */}
              {photos.length > 1 && (
                <View style={styles.indicatorContainer}>
                  {photos.map((_, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setSelectedImageIndex(index)}
                    >
                      <View
                        style={[
                          styles.indicator,
                          selectedImageIndex === index &&
                            styles.activeIndicator,
                        ]}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Gradient Overlay */}
              <LinearGradient
                colors={['transparent', 'rgba(4, 32, 38, 0.8)']}
                style={styles.imageOverlay}
              />
            </View>
          )}

          {/* Content Section */}
          <View style={styles.contentSection}>
            {/* Title Card */}
            <View style={styles.card}>
              <View style={styles.titleRow}>
                <View style={styles.iconContainer}>
                  <MaterialIcons name="book" size={24} color="#07575B" />
                </View>
                <View style={styles.titleContent}>
                  <Text style={styles.title}>{item.title}</Text>
                  <View style={styles.dateRow}>
                    <MaterialIcons name="event" size={16} color="#999" />
                    <Text style={styles.date}>
                      {new Date(item.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Description Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="description" size={20} color="#07575B" />
                <Text style={styles.cardTitle}>Story</Text>
              </View>
              <Text style={styles.description}>{item.description}</Text>
            </View>

            {/* Location Card */}
            {item.location !== 'Unknown' && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <MaterialIcons name="location-on" size={20} color="#07575B" />
                  <Text style={styles.cardTitle}>Location</Text>
                </View>
                <View style={styles.locationContent}>
                  <MaterialIcons name="my-location" size={18} color="#666" />
                  <Text style={styles.locationText}>{item.location}</Text>
                </View>
              </View>
            )}

            {/* Photo Gallery Card */}
            {photos.length > 1 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <MaterialIcons
                    name="photo-library"
                    size={20}
                    color="#07575B"
                  />
                  <Text style={styles.cardTitle}>Photos ({photos.length})</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.galleryContainer}
                >
                  {photos.map((photo, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setSelectedImageIndex(index)}
                    >
                      <Image
                        source={{ uri: photo }}
                        style={[
                          styles.galleryImage,
                          selectedImageIndex === index &&
                            styles.selectedGalleryImage,
                        ]}
                        resizeMode="cover"
                      />
                      {selectedImageIndex === index && (
                        <View style={styles.selectedOverlay}>
                          <MaterialIcons
                            name="check-circle"
                            size={24}
                            color="#FFFFFF"
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Tags Card */}
            {tags.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <MaterialIcons name="local-offer" size={20} color="#07575B" />
                  <Text style={styles.cardTitle}>Tags</Text>
                </View>
                <View style={styles.tagsContainer}>
                  {tags.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionContainer}>
              <TouchableOpacity
                style={styles.editButtonWrapper}
                onPress={handleEdit}
              >
                <LinearGradient
                  colors={['#07575B', '#003B46']}
                  style={styles.actionButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <MaterialIcons name="edit" size={22} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Edit</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButtonWrapper}
                onPress={handleDelete}
              >
                <View style={styles.deleteButton}>
                  <MaterialIcons name="delete" size={22} color="#C70039" />
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
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
    backgroundColor: Color.maincolor,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
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
    color: Color.white,
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    position: 'relative',
    width: '100%',
    height: 300,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  activeIndicator: {
    backgroundColor: '#FFFFFF',
    width: 24,
  },
  contentSection: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: Color.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F8F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  date: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
  },
  locationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
  },
  galleryContainer: {
    paddingVertical: 4,
    gap: 12,
  },
  galleryImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  selectedGalleryImage: {
    borderColor: '#07575B',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 8,
    right: 20,
    backgroundColor: '#07575B',
    borderRadius: 12,
    padding: 2,
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  editButtonWrapper: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButtonWrapper: {
    flex: 1,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
    backgroundColor: '#FFF5F5',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFE0E0',
  },
  deleteButtonText: {
    color: '#C70039',
    fontSize: 16,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  tag: {
    backgroundColor: Color.lightgreen,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Color.btnColor,
  },
  tagText: {
    color: Color.btnColor,
    fontSize: 14,
    fontWeight: '500',
  },
});
