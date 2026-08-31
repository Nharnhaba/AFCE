import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CARD_HEIGHT = 160;
const CARD_MARGIN = 6;
const TOTAL_CARD_HEIGHT = CARD_HEIGHT + CARD_MARGIN;

interface MovingBackgroundProps {
  opacity?: number;
  speedMultiplier?: number;
  type?: 'all' | 'video' | 'music' | 'article';
}

const VIDEO_IMAGES = [
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=300&q=70', // mountains
  'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=300&q=70', // ocean
  'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?w=300&q=70', // cyberpunk city
  'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=300&q=70', // racing
];

const MUSIC_IMAGES = [
  'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&q=70', // neon nights concert
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=70', // lofi setup
  'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=300&q=70', // arcade
  'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=300&q=70', // acoustic guitar
];

const ARTICLE_IMAGES = [
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=300&q=70', // news/newspaper
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&q=70', // global connectivity
  'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?w=300&q=70', // global cityscape
  'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&q=70', // news flash
];

export default function MovingBackground({
  opacity = 0.85,
  speedMultiplier = 1.0,
  type = 'all',
}: MovingBackgroundProps) {
  
  let col1Images: string[] = [];
  let col2Images: string[] = [];
  let col3Images: string[] = [];

  if (type === 'video') {
    col1Images = [...VIDEO_IMAGES, ...VIDEO_IMAGES];
    col2Images = [...VIDEO_IMAGES, ...VIDEO_IMAGES];
    col3Images = [...VIDEO_IMAGES, ...VIDEO_IMAGES];
  } else if (type === 'music') {
    col1Images = [...MUSIC_IMAGES, ...MUSIC_IMAGES];
    col2Images = [...MUSIC_IMAGES, ...MUSIC_IMAGES];
    col3Images = [...MUSIC_IMAGES, ...MUSIC_IMAGES];
  } else if (type === 'article') {
    col1Images = [...ARTICLE_IMAGES, ...ARTICLE_IMAGES];
    col2Images = [...ARTICLE_IMAGES, ...ARTICLE_IMAGES];
    col3Images = [...ARTICLE_IMAGES, ...ARTICLE_IMAGES];
  } else {
    // 'all' category - mix of all media types
    col1Images = [...VIDEO_IMAGES, ...VIDEO_IMAGES];
    col2Images = [...MUSIC_IMAGES, ...MUSIC_IMAGES];
    col3Images = [...ARTICLE_IMAGES, ...ARTICLE_IMAGES];
  }

  // Height of single loop of 4 cards
  const travelDistance = 4 * TOTAL_CARD_HEIGHT;

  const scrollYCol1 = useRef(new Animated.Value(0)).current;
  const scrollYCol2 = useRef(new Animated.Value(0)).current;
  const scrollYCol3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    scrollYCol1.setValue(0);
    scrollYCol2.setValue(0);
    scrollYCol3.setValue(0);

    const anim1 = Animated.loop(
      Animated.timing(scrollYCol1, {
        toValue: -travelDistance,
        duration: 20000 / speedMultiplier,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const anim2 = Animated.loop(
      Animated.timing(scrollYCol2, {
        toValue: travelDistance,
        duration: 22000 / speedMultiplier,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const anim3 = Animated.loop(
      Animated.timing(scrollYCol3, {
        toValue: -travelDistance,
        duration: 18000 / speedMultiplier,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [speedMultiplier, type]);

  const renderColumn = (images: string[], animValue: Animated.Value) => {
    return (
      <Animated.View
        style={[
          styles.column,
          {
            transform: [{ translateY: animValue }],
          },
        ]}
      >
        {images.map((uri, idx) => (
          <ImageBackground
            key={`${idx}`}
            source={{ uri }}
            style={styles.card}
            imageStyle={styles.cardImage}
          >
            <View style={styles.playBadge}>
              <Ionicons name="play" size={10} color="#fff" />
            </View>
          </ImageBackground>
        ))}
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { opacity }]}>
      {renderColumn(col1Images, scrollYCol1)}
      {renderColumn(col2Images, scrollYCol2)}
      {renderColumn(col3Images, scrollYCol3)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: -180, 
    left: 0,
    right: 0,
    bottom: -180, 
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  column: {
    flex: 1,
    marginHorizontal: 3,
  },
  card: {
    height: CARD_HEIGHT,
    borderRadius: 12,
    marginBottom: CARD_MARGIN,
    overflow: 'hidden',
    backgroundColor: '#1a1a22',
  },
  cardImage: {
    resizeMode: 'cover',
    opacity: 1.0,
  },
  playBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(168, 85, 247, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
    margin: 6,
  },
});
