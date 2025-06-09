// pathfinding.ts

interface Node {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent: Node | null;
}

export const aStar = (start: { x: number; y: number }, end: { x: number; y: number }, grid: number[][]): { x: number; y: number }[] => {
  const openSet: Node[] = [];
  const closedSet: Set<string> = new Set();
  
  const startNode: Node = {
    x: start.x,
    y: start.y,
    g: 0,
    h: 0,
    f: 0,
    parent: null
  };
  
  openSet.push(startNode);
  
  const directions = [
    { x: 1, y: 0 },   // right
    { x: -1, y: 0 },  // left
    { x: 0, y: 1 },   // down
    { x: 0, y: -1 },  // up
    { x: 1, y: 1 },   // down-right
    { x: 1, y: -1 },  // up-right
    { x: -1, y: 1 },  // down-left
    { x: -1, y: -1 }  // up-left
  ];

  while (openSet.length > 0) {
    let currentIndex = 0;
    for (let i = 0; i < openSet.length; i++) {
      if (openSet[i].f < openSet[currentIndex].f) {
        currentIndex = i;
      }
    }
    
    const currentNode = openSet[currentIndex];
    
    if (currentNode.x === end.x && currentNode.y === end.y) {
      const path: { x: number; y: number }[] = [];
      let current: Node | null = currentNode;
      while (current) {
        path.unshift({ x: current.x, y: current.y });
        current = current.parent;
      }
      return path;
    }
    
    openSet.splice(currentIndex, 1);
    closedSet.add(`${currentNode.x},${currentNode.y}`);
    
    for (const dir of directions) {
      const neighbor = { x: currentNode.x + dir.x, y: currentNode.y + dir.y };
      // Skip if out of bounds or wall
      if (
        neighbor.x < 0 || neighbor.x >= grid[0].length ||
        neighbor.y < 0 || neighbor.y >= grid.length ||
        grid[neighbor.y][neighbor.x] === 1
      ) {
        continue;
      }
      // Prevent diagonal movement through corners
      if (Math.abs(dir.x) === 1 && Math.abs(dir.y) === 1) {
        const n1 = grid[currentNode.y][currentNode.x + dir.x];
        const n2 = grid[currentNode.y + dir.y][currentNode.x];
        if (n1 === 1 || n2 === 1) continue;
      }
      if (closedSet.has(`${neighbor.x},${neighbor.y}`)) {
        continue;
      }
      const gScore = currentNode.g + (Math.abs(dir.x) === 1 && Math.abs(dir.y) === 1 ? 1.414 : 1);
      const hScore = Math.abs(neighbor.x - end.x) + Math.abs(neighbor.y - end.y);
      const fScore = gScore + hScore;
      const neighborNode: Node = {
        x: neighbor.x,
        y: neighbor.y,
        g: gScore,
        h: hScore,
        f: fScore,
        parent: currentNode
      };
      const existingNode = openSet.find(n => n.x === neighbor.x && n.y === neighbor.y);
      if (existingNode && existingNode.g <= gScore) {
        continue;
      }
      openSet.push(neighborNode);
    }
  }
  return []; // No path found
}; 