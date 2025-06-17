function aStar(start, end, map) {
  const openSet = [{ ...start, g: 0, h: heuristic(start, end), f: heuristic(start, end) }];
  const closedSet = new Set();
  const cameFrom = {};
  while (openSet.length > 0) {
    openSet.sort((a, b) => a.f - b.f);
    let current = openSet.shift();
    if (current.x === end.x && current.y === end.y) return reconstructPath(cameFrom, current);
    closedSet.add(`${current.x},${current.y}`);
    getNeighbors(current, map).forEach(neighbor => {
      if (closedSet.has(`${neighbor.x},${neighbor.y}`)) return;
      const tentativeGScore = current.g + 1;
      let neighborNode = openSet.find(n => n.x === neighbor.x && n.y === neighbor.y);
      if (!neighborNode) {
        neighborNode = { ...neighbor, g: tentativeGScore, h: heuristic(neighbor, end), f: tentativeGScore + heuristic(neighbor, end) };
        cameFrom[`${neighbor.x},${neighbor.y}`] = current;
        openSet.push(neighborNode);
      } else if (tentativeGScore < neighborNode.g) {
        neighborNode.g = tentativeGScore;
        neighborNode.f = tentativeGScore + neighborNode.h;
        cameFrom[`${neighbor.x},${neighbor.y}`] = current;
      }
    });
  }
  return [];
}
function heuristic(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }
function getNeighbors(node, map) {
  const neighbors = [];
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
    if (dx === 0 && dy === 0) continue;
    const newX = node.x + dx, newY = node.y + dy;
    if (newX >= 0 && newX < map.width && newY >= 0 && newY < map.height) {
      const tileIndex = newY * map.width + newX;
      if (map.tiles[tileIndex] !== 1 && map.tiles[tileIndex] !== 2) neighbors.push({ x: newX, y: newY });
    }
  }
  return neighbors;
}
function reconstructPath(cameFrom, current) {
  const totalPath = [current];
  while (cameFrom[`${current.x},${current.y}`]) {
    current = cameFrom[`${current.x},${current.y}`];
    totalPath.unshift(current);
  }
  return totalPath;
}
