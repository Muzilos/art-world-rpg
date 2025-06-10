// pathfinding.ts

interface Node {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent: Node | null;
}

export const aStar = (start: { x: number; y: number }, end: { x: number; y: number }, map: number[][]) => {
  const getNeighbors = (node: Node): Node[] => {
    const neighbors: Node[] = [];
    const directions = [
      { x: 0, y: -1 }, // up
      { x: 1, y: 0 },  // right
      { x: 0, y: 1 },  // down
      { x: -1, y: 0 }  // left
    ];

    for (const dir of directions) {
      const newX = node.x + dir.x;
      const newY = node.y + dir.y;

      // Check if the new position is within bounds and walkable
      if (
        newX >= 0 && newX < map[0].length &&
        newY >= 0 && newY < map.length &&
        map[newY][newX] !== 1 // Assuming 1 is a wall
      ) {
        neighbors.push({
          x: newX,
          y: newY,
          g: 0,
          h: 0,
          f: 0,
          parent: null
        });
      }
    }

    return neighbors;
  };

  const calculateHeuristic = (node: Node, end: { x: number; y: number }) => {
    return Math.abs(node.x - end.x) + Math.abs(node.y - end.y);
  };

  const openSet: Node[] = [{
    x: start.x,
    y: start.y,
    g: 0,
    h: calculateHeuristic({ x: start.x, y: start.y, g: 0, h: 0, f: 0, parent: null }, end),
    f: 0,
    parent: null
  }];
  const closedSet: Node[] = [];

  while (openSet.length > 0) {
    // Find node with lowest f score
    let currentIndex = 0;
    for (let i = 0; i < openSet.length; i++) {
      if (openSet[i].f < openSet[currentIndex].f) {
        currentIndex = i;
      }
    }

    const current = openSet[currentIndex];

    // Check if we've reached the end
    if (current.x === end.x && current.y === end.y) {
      const path: { x: number; y: number }[] = [];
      let temp = current;
      while (temp.parent) {
        path.push({ x: temp.x, y: temp.y });
        temp = temp.parent;
      }
      return path.reverse();
    }

    // Remove current from openSet and add to closedSet
    openSet.splice(currentIndex, 1);
    closedSet.push(current);

    // Check neighbors
    const neighbors = getNeighbors(current);
    for (const neighbor of neighbors) {
      if (closedSet.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
        continue;
      }

      const tentativeG = current.g + 1;

      if (!openSet.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
        openSet.push(neighbor);
      } else if (tentativeG >= neighbor.g) {
        continue;
      }

      neighbor.parent = current;
      neighbor.g = tentativeG;
      neighbor.h = calculateHeuristic(neighbor, end);
      neighbor.f = neighbor.g + neighbor.h;
    }
  }

  return []; // No path found
}; 