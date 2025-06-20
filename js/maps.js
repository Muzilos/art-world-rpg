const TILE_SIZE = 32; // Size of each tile in pixels

// Updated tile colors for art world theme
const tileColors = {
  0: '#d6d2c4', // Sidewalk tan
  1: '#7c2d12', // Dull brick red (buildings)
  2: '#4a5568', // Dark gray (furniture/walls)
  3: '#8b5cf6', // Purple (art supplies/decorative elements)
  4: '#a0aec0', // Light gray (paths)
  5: '#d69e2e', // Yellow (special areas/doors)
};

// Function to get the color for a specific tile type
const getTileColor = (tileType) => {
  return tileColors[tileType] || '#ffffff';
};