const { randomInt } = require('node:crypto');

const WORDS = Object.freeze([
  'PIZZA', 'ROCKET', 'CAT', 'CASTLE', 'GUITAR', 'PENGUIN', 'SUNFLOWER',
  'BICYCLE', 'ROBOT', 'VOLCANO', 'DRAGON', 'PIRATE', 'GHOST', 'RAINBOW',
  'CAMERA', 'SUBMARINE', 'APPLE', 'BANANA', 'CARROT', 'CUPCAKE', 'DONUT',
  'HAMBURGER', 'POPCORN', 'SANDWICH', 'WATERMELON', 'PINEAPPLE', 'COOKIE',
  'CHEESE', 'CHERRY', 'STRAWBERRY', 'DOG', 'RABBIT', 'ELEPHANT', 'GIRAFFE',
  'LION', 'TIGER', 'MONKEY', 'FROG', 'TURTLE', 'BUTTERFLY', 'SPIDER', 'BEE',
  'OCTOPUS', 'SHARK', 'WHALE', 'DOLPHIN', 'CRAB', 'SNAIL', 'OWL', 'SNAKE',
  'HORSE', 'DUCK', 'CHICKEN', 'FISH', 'BEAR', 'FOX', 'ZEBRA', 'DINOSAUR',
  'UNICORN', 'SNOWMAN', 'MERMAID', 'WIZARD', 'CROWN', 'SWORD', 'TREASURE',
  'TELESCOPE', 'PLANET', 'STAR', 'MOON', 'SUN', 'CLOUD', 'LIGHTNING',
  'TORNADO', 'MOUNTAIN', 'ISLAND', 'BEACH', 'TREE', 'FLOWER', 'CACTUS',
  'MUSHROOM', 'LEAF', 'UMBRELLA', 'BALLOON', 'KITE', 'TENT', 'CAMPFIRE',
  'LIGHTHOUSE', 'BRIDGE', 'WINDMILL', 'PYRAMID', 'IGLOO', 'HOUSE', 'CAR',
  'BUS', 'TRAIN', 'AIRPLANE', 'HELICOPTER', 'SAILBOAT', 'SKATEBOARD',
  'SCOOTER', 'TRACTOR', 'TRUCK', 'PARACHUTE', 'BACKPACK', 'BOOK', 'PENCIL',
  'SCISSORS', 'CLOCK', 'KEY', 'LOCK', 'PHONE', 'COMPUTER', 'TELEVISION',
  'HEADPHONES', 'MICROPHONE', 'DRUM', 'PIANO', 'TRUMPET', 'VIOLIN',
  'SOCCER', 'BASKETBALL', 'BASEBALL', 'TENNIS', 'BOWLING', 'TROPHY',
  'MEDAL', 'HAT', 'BOOT', 'GLOVE', 'SCARF', 'SOCK', 'GLASSES', 'WATCH',
  'RING', 'NECKLACE', 'CHAIR', 'TABLE', 'BED', 'LAMP', 'MIRROR', 'LADDER',
  'BROOM', 'BUCKET', 'HAMMER', 'SAW', 'SHOVEL', 'WHEELBARROW', 'WHEEL',
  'CANDLE', 'PRESENT',
].filter((word, index, words) => words.indexOf(word) === index));

// Each room owns its deck. Rematches keep drawing from the same deck.
function nextWord(room) {
  if (!room.wordDeck?.length) {
    room.wordDeck = [...WORDS];
    for (let i = room.wordDeck.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [room.wordDeck[i], room.wordDeck[j]] = [room.wordDeck[j], room.wordDeck[i]];
    }
    // Avoid an immediate repeat when a new deck follows an exhausted deck.
    const last = room.wordDeck.length - 1;
    if (room.wordDeck[last] === room.word) {
      [room.wordDeck[0], room.wordDeck[last]] = [room.wordDeck[last], room.wordDeck[0]];
    }
  }
  return room.wordDeck.pop();
}

module.exports = { WORDS, nextWord };
