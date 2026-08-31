import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_HEIGHT = 150;
const CARD_WIDTH = 220;
const CARD_MARGIN = 8;

interface MovingBackgroundProps {
  opacity?: number;
  speedMultiplier?: number;
  type?: 'all' | 'video' | 'music' | 'article' | 'onboarding';
  direction?: 'vertical' | 'horizontal' | 'diagonal' | 'circular';
}

// 1. Completely unique image sets to avoid repetition
const ONBOARD_IMAGES = [
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&q=70', // crowd
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=70', // concert lights
  'https://images.unsplash.com/photo-1481887329431-874607c62f26?w=300&q=70', // street neon
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=70', // DJ decks
  'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=300&q=70', // festival
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&q=70', // neon face
];

const VIDEO_IMAGES = [
  'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=300&q=70', // movie clapper
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&q=70', // cinema seats
  'https://images.unsplash.com/photo-1492446845049-9c50cc313f00?w=300&q=70', // camera lens
  'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=300&q=70', // projector screen
  'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=300&q=70', // cinema sign
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&q=70', // theater
];

const MUSIC_IMAGES = [
  'https://images.unsplash.com/photo-1487180142328-0c4e37023af5?w=300&q=70', // vinyl record
  'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=300&q=70', // jazz piano
  'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=300&q=70', // guitar close up
  'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=300&q=70', // retro mic
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&q=70', // concert stage
  'https://images.unsplash.com/photo-1516280440614-37939bbacd6a?w=300&q=70', // microphone singer
];

const ARTICLE_IMAGES = [
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=300&q=70', // newspaper print
  'https://images.unsplash.com/photo-1495020689067-958852a6565d?w=300&q=70', // newspaper stacks
  'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=300&q=70', // journalism desk
  'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=300&q=70', // tablet news feed
  'https://images.unsplash.com/photo-1504711698883-96500feec7b5?w=300&q=70', // reading news
  'https://images.unsplash.com/photo-1566378246598-5b11a0ff78da?w=300&q=70', // news writing
];

export default function MovingBackground({
  opacity = 0.85,
  speedMultiplier = 1.0,
  type = 'all',
  direction = 'vertical',
}: MovingBackgroundProps) {
  
  // Assign completely distinct image pools
  let pool: string[] = [];
  if (type === 'video') pool = VIDEO_IMAGES;
  else if (type === 'music') pool = MUSIC_IMAGES;
  else if (type === 'article') pool = ARTICLE_IMAGES;
  else if (type === 'onboarding') pool = ONBOARD_IMAGES;
  else {
    // 'all' combines them uniquely
    pool = [VIDEO_IMAGES[0], MUSIC_IMAGES[0], ARTICLE_IMAGES[0], VIDEO_IMAGES[1], MUSIC_IMAGES[1], ARTICLE_IMAGES[1]];
  }

  // Double the pool size to enable infinite looping scrolls without blanks
  const images = [...pool, ...pool];

  // Animation values
  const animValue1 = useRef(new Animated.Value(0)).current;
  const animValue2 = useRef(new Animated.Value(0)).current;
  const animValue3 = useRef(new Animated.Value(0)).current;

  // Single loop distance
  const travelDistance = 3 * (CARD_HEIGHT + CARD_MARGIN);

  useEffect(() => {
    animValue1.setValue(0);
    animValue2.setValue(0);
    animValue3.setValue(0);

    const durationBase = direction === 'horizontal' ? 24000 : 20000;

    const anim1 = Animated.loop(
      Animated.timing(animValue1, {
        toValue: -travelDistance,
        duration: durationBase / speedMultiplier,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const anim2 = Animated.loop(
      Animated.timing(animValue2, {
        toValue: travelDistance,
        duration: (durationBase + 2000) / speedMultiplier,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const anim3 = Animated.loop(
      Animated.timing(animValue3, {
        toValue: -travelDistance,
        duration: (durationBase - 2000) / speedMultiplier,
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
  }, [speedMultiplier, direction, type]);

  // --- RENDERING MODES ---

  // 1. VERTICAL SCROLLING
  const renderVertical = () => {
    return (
      <View style={styles.verticalContainer}>
        {renderVerticalColumn(images.slice(0, 6), animValue1)}
        {renderVerticalColumn(images.slice(3, 9), animValue2)}
        {renderVerticalColumn(images.slice(6, 12), animValue3)}
      </View>
    );
  };

  const renderVerticalColumn = (columnImages: string[], anim: Animated.Value) => {
    return (
      <Animated.View style={[styles.column, { transform: [{ translateY: anim }] }]}>
        {columnImages.map((uri, idx) => (
          <ImageBackground key={idx} source={{ uri }} style={styles.verticalCard} imageStyle={styles.cardImg}>
            <View style={styles.playBadge}>
              <Ionicons name="play" size={10} color="#fff" />
            </View>
          </ImageBackground>
        ))}
      </Animated.View>
    );
  };

  // 2. HORIZONTAL SCROLLING (Filmstrip effect for Videos Tab)
  const renderHorizontal = () => {
    const horizontalTravel = 3 * (CARD_WIDTH + CARD_MARGIN);
    
    // Set interpolation to slide left/right
    const translateX1 = animValue1.interpolate({
      inputRange: [-travelDistance, travelDistance],
      outputRange: [-horizontalTravel, horizontalTravel],
    });

    const translateX2 = animValue2.interpolate({
      inputRange: [-travelDistance, travelDistance],
      outputRange: [horizontalTravel, -horizontalTravel],
    });

    const translateX3 = animValue3.interpolate({
      inputRange: [-travelDistance, travelDistance],
      outputRange: [-horizontalTravel, horizontalTravel],
    });

    return (
      <View style={styles.horizontalContainer}>
        {renderHorizontalRow(images.slice(0, 6), translateX1)}
        {renderHorizontalRow(images.slice(3, 9), translateX2)}
        {renderHorizontalRow(images.slice(6, 12), translateX3)}
      </View>
    );
  };

  const renderHorizontalRow = (rowImages: string[], translateAnim: any) => {
    return (
      <Animated.View style={[styles.row, { transform: [{ translateX: translateAnim }] }]}>
        {rowImages.map((uri, idx) => (
          <ImageBackground key={idx} source={{ uri }} style={styles.horizontalCard} imageStyle={styles.cardImg}>
            <View style={styles.playBadge}>
              <Ionicons name="play" size={10} color="#fff" />
            </View>
          </ImageBackground>
        ))}
      </Animated.View>
    );
  };

  // 3. DIAGONAL SCROLLING (Home Screen)
  const renderDiagonal = () => {
    return (
      <View style={[styles.diagonalWrapper, { transform: [{ rotate: '-15deg' }, { scale: 1.3 }] }]}>
        {renderVertical()}
      </View>
    );
  };

  // 4. CIRCULAR ROTATING (Music Screen)
  const renderCircular = () => {
    const spin = animValue1.interpolate({
      inputRange: [-travelDistance, 0],
      outputRange: ['-360deg', '0deg'],
    });

    const circleSize = 110;
    const radius = 145;

    return (
      <View style={styles.circularWrapper}>
        <Animated.View style={[styles.circleGrid, { transform: [{ rotate: spin }] }]}>
          {images.slice(0, 8).map((uri, idx) => {
            const angle = (idx * 360) / 8;
            const x = radius * Math.cos((angle * Math.PI) / 180);
            const y = radius * Math.sin((angle * Math.PI) / 180);

            return (
              <ImageBackground
                key={idx}
                source={{ uri }}
                style={[
                  styles.circleCard,
                  {
                    left: 200 + x - circleSize / 2,
                    top: 200 + y - circleSize / 2,
                    width: circleSize,
                    height: circleSize,
                    borderRadius: circleSize / 2,
                  },
                ]}
                imageStyle={{ borderRadius: circleSize / 2 }}
              >
                <View style={styles.vinylCenter} />
              </ImageBackground>
            );
          })}
        </Animated.View>
      </View>
    );
  };

  if (direction === 'horizontal') return <View style={[styles.container, { opacity }]}>{renderHorizontal()}</View>;
  if (direction === 'diagonal') return <View style={[styles.container, { opacity }]}>{renderDiagonal()}</View>;
  if (direction === 'circular') return <View style={[styles.container, { opacity }]}>{renderCircular()}</View>;
  return <View style={[styles.container, { opacity }]}>{renderVertical()}</View>;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: -180,
    left: 0,
    right: 0,
    bottom: -180,
    overflow: 'hidden',
  },
  verticalContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
    marginHorizontal: 3,
  },
  verticalCard: {
    height: CARD_HEIGHT,
    borderRadius: 12,
    marginBottom: CARD_MARGIN,
    overflow: 'hidden',
    backgroundColor: '#1a1a22',
  },
  horizontalContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  horizontalCard: {
    height: 140,
    width: CARD_WIDTH,
    borderRadius: 12,
    marginRight: CARD_MARGIN,
    overflow: 'hidden',
    backgroundColor: '#1a1a22',
  },
  diagonalWrapper: {
    flex: 1,
  },
  circularWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleGrid: {
    width: SCREEN_WIDTH * 1.5,
    height: SCREEN_HEIGHT * 1.5,
  },
  circleCard: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: '#1a1a22',
    borderWidth: 1,
    borderColor: '#a855f7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vinylCenter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#0a0a0f',
  },
  cardImg: {
    resizeMode: 'cover',
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
