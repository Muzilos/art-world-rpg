const TILE_SIZE = 32; // Size of each tile in pixels

// Tile colors for art world theme
const tileColors = {
  0: '#d6d2c4', // Sidewalk tan
  1: '#7c2d12', // Dull brick red (buildings)
  2: '#4a5568', // Dark gray (furniture/walls)
  3: '#8b5cf6', // Purple (art supplies/decorative elements)
  4: '#a0aec0', // Light gray (paths)
  5: '#d69e2e', // Yellow (special areas/doors)
  6: '#8B4513', // Earthy Brown for forest paths
  7: '#2d5016',  // Dark forest green (dense trees)
  8: '#4a7c2a',  // Medium forest green (light trees)
  9: '#87ceeb',  // Sky blue (water)
  10: '#f4e4bc', // Cream (classroom floors)
  11: '#8b4513', // Dark wood (classroom furniture)
  12: '#ffffff', // White (gallery walls)
  13: '#ffd700', // Gold (special art areas)
  14: '#cd853f', // Tan (studio floors)
  15: '#696969', // Dark gray (machinery/equipment)
  16: '#98fb98', // Light green (grass clearings)
  17: '#dda0dd', // Plum (art supply areas)
  18: '#f0e68c', // Khaki (pathways)
  19: '#ff6347', // Tomato (warning/restricted areas)
  20: '#4169e1', // Royal blue (water features)
  21: '#000000', // Black (walls)
};

// Tiles you cannot walk on top of
const unwalkableTiles = [1, 2, 7, 9, 11, 12, 15, 20, 21]

// Function to get the color for a specific tile type
const getTileColor = (tileType) => {
  return tileColors[tileType] || '#ffffff';
};