import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import { useDispatch } from 'react-redux';
import { deleteEntry } from '../../db/dbconfiguration';
import { removeEntry } from '../../redux/actions/action';
import Color from '../../styles/color';

const { width } = Dimensions.get('window');

export default function JournalCard({ item, onPress, navigation, onDelete }) {
  const dispatch = useDispatch();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // const photos = item.photos ? JSON.parse(item.photos) : [];
  let photos = [];
  try {
    const firstParse = JSON.parse(item.photos);
    photos = Array.isArray(firstParse) ? firstParse : JSON.parse(firstParse);
  } catch (error) {
    console.warn('Photo parsing failed:', error);
    photos = [];
  }

  // Auto-cycle through images every 2 seconds
  useEffect(() => {
    if (photos.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex(prevIndex =>
          prevIndex === photos.length - 1 ? 0 : prevIndex + 1,
        );
      }, 2500);

      return () => clearInterval(interval);
    }
  }, [photos.length]);

  const handleDelete = async () => {
    Alert.alert('Delete Entry', 'Are you sure you want to delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const result = await deleteEntry(item.id);
          if (result.success) {
            dispatch(removeEntry(item.id));
            if (onDelete) onDelete();
          }
        },
      },
    ]);
  };

  const handleEdit = () => {
    navigation.navigate('AddEntry', { item });
  };

  // Updated tags parsing
  const parseTags = tagData => {
    try {
      if (!tagData) return [];

      let parsed = tagData;
      // Keep parsing until we get an array
      while (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
      }

      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('Tags parsing failed:', error);
      return [];
    }
  };

  const tags = parseTags(item.tags);

  return (
    <TouchableOpacity onPress={onPress} style={styles.card}>
      <View style={styles.imageContainer}>
        {photos.length > 0 ? (
          <Image
            source={{ uri: photos[currentImageIndex] }}
            style={styles.photo}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <MaterialIcons name="image" size={60} color="#CCC" />
          </View>
        )}

        {/* Location Badge */}
        <View style={styles.locationBadge}>
          <MaterialIcons name="location-on" size={16} color="#FFFFFF" />
          <Text style={styles.locationText} numberOfLines={1}>
            {item.location || 'Unknown Location'}
          </Text>
        </View>

        {/* Tags Section */}
        {tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {tags.length > 3 && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>+{tags.length - 3}</Text>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons Column */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
            <MaterialIcons name="edit" size={20} color="#333" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
            <MaterialIcons name="delete" size={20} color="#C70039" />
          </TouchableOpacity>
        </View>

        {/* Image indicators */}
        {photos.length > 1 && (
          <View style={styles.indicatorContainer}>
            {photos.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  currentImageIndex === index && styles.activeIndicator,
                ]}
              />
            ))}
          </View>
        )}

        {/* Title and Description Overlay */}
        <View style={styles.titleOverlay}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Color.white,
    borderRadius: 20,
    marginVertical: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 280,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    maxWidth: width * 0.5,
  },
  locationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  tagsContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: Color.lightgreen,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    color: Color.btnColor,
    fontSize: 11,
    fontWeight: '500',
  },
  actionButtons: {
    position: 'absolute',
    right: 16,
    top: 16,
    gap: 8,
  },
  actionButton: {
    backgroundColor: Color.white,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 60,
    left: 16,
    flexDirection: 'row',
    gap: 6,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  activeIndicator: {
    backgroundColor: '#FFFFFF',
    width: 20,
  },
  titleOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: `${Color.maincolor}CC`,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#E0E0E0',
    lineHeight: 18,
  },
});
