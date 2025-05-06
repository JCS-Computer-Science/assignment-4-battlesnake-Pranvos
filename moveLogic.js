export default function move(gameState) {
  const mySnake = gameState.you;
  const myHeadPosition = mySnake.body[0] || { x: 0, y: 0 };
  const mySnakeBody = mySnake.body || [];
  const mySnakeLength = mySnakeBody.length || 0;
  let mySnakeHealth = mySnake.health || 100;
  const boardWidth = gameState.board.width;
  const boardHeight = gameState.board.height;
  const foodLocations = gameState.board.food || [];
  const otherSnakes = gameState.board.snakes.filter(snake => snake.id !== mySnake.id);
  const hazards = gameState.board.hazards || [];
  const stormDamage = gameState.board.damagePerTurn || 0;
  const turn = gameState.turn;

  // Apply storm damage
  if (stormDamage > 0) {
    mySnakeHealth -= stormDamage;
    gameState.you.health = mySnakeHealth;
  }

  const moveSafety = {
    up: true,
    down: true,
    left: true,
    right: true
  };

  // Boundary checks
  if (myHeadPosition.x <= 0) moveSafety.left = false;
  if (myHeadPosition.x >= boardWidth - 1) moveSafety.right = false;
  if (myHeadPosition.y <= 0) moveSafety.down = false;
  if (myHeadPosition.y >= boardHeight - 1) moveSafety.up = false;

  // Self-collision checks, skip if length <= 1
  if (mySnakeLength > 1) {
    for (let i = 1; i < mySnakeLength; i++) {
      const segment = mySnakeBody[i];
      if (segment.x === myHeadPosition.x + 1 && segment.y === myHeadPosition.y) moveSafety.right = false;
      if (segment.x === myHeadPosition.x - 1 && segment.y === myHeadPosition.y) moveSafety.left = false;
      if (segment.x === myHeadPosition.x && segment.y === myHeadPosition.y + 1) moveSafety.up = false;
      if (segment.x === myHeadPosition.x && segment.y === myHeadPosition.y - 1) moveSafety.down = false;
    }
  }

  // Collisions with other snakes and head-to-head
  for (const snake of otherSnakes) {
    if (!snake.body) continue;
    // Body collisions
    for (const segment of snake.body) {
      if (segment.x === myHeadPosition.x + 1 && segment.y === myHeadPosition.y) moveSafety.right = false;
      if (segment.x === myHeadPosition.x - 1 && segment.y === myHeadPosition.y) moveSafety.left = false;
      if (segment.x === myHeadPosition.x && segment.y === myHeadPosition.y + 1) moveSafety.up = false;
      if (segment.x === myHeadPosition.x && segment.y === myHeadPosition.y - 1) moveSafety.down = false;
    }

    // Head-to-head collisions for larger or equal snakes
    if (snake.body.length >= mySnakeLength) {
      const otherHead = snake.body[0];
      const possibleOtherMoves = [
        { x: otherHead.x + 1, y: otherHead.y }, // right
        { x: otherHead.x - 1, y: otherHead.y }, // left
        { x: otherHead.x, y: otherHead.y + 1 }, // up
        { x: otherHead.x, y: otherHead.y - 1 }  // down
      ].filter(pos => pos.x >= 0 && pos.x < boardWidth && pos.y >= 0 && pos.y < boardHeight);

      for (const pos of possibleOtherMoves) {
        if (pos.x === myHeadPosition.x + 1 && pos.y === myHeadPosition.y) moveSafety.right = false;
        if (pos.x === myHeadPosition.x - 1 && pos.y === myHeadPosition.y) moveSafety.left = false;
        if (pos.x === myHeadPosition.x && pos.y === myHeadPosition.y + 1) moveSafety.up = false;
        if (pos.x === myHeadPosition.x && pos.y === myHeadPosition.y - 1) moveSafety.down = false;
      }
    }
  }

  // Hazard avoidance if health is sufficient
  for (const hazard of hazards) {
    if (mySnakeHealth > 50) {
      if (hazard.x === myHeadPosition.x + 1 && hazard.y === myHeadPosition.y) moveSafety.right = false;
      if (hazard.x === myHeadPosition.x - 1 && hazard.y === myHeadPosition.y) moveSafety.left = false;
      if (hazard.x === myHeadPosition.x && hazard.y === myHeadPosition.y + 1) moveSafety.up = false;
      if (hazard.x === myHeadPosition.x && hazard.y === myHeadPosition.y - 1) moveSafety.down = false;
    }
  }

  const safeMoves = Object.entries(moveSafety)
    .filter(([, isSafe]) => isSafe)
    .map(([direction]) => direction);

  if (safeMoves.length === 0) {
    // Emergency fallback: prioritize boundary-safe moves
    const emergencyMoves = [
      { direction: 'up', x: myHeadPosition.x, y: myHeadPosition.y + 1 },
      { direction: 'right', x: myHeadPosition.x + 1, y: myHeadPosition.y },
      { direction: 'down', x: myHeadPosition.x, y: myHeadPosition.y - 1 },
      { direction: 'left', x: myHeadPosition.x - 1, y: myHeadPosition.y }
    ].filter(move => move.x >= 0 && move.x < boardWidth && move.y >= 0 && move.y < boardHeight);

    if (emergencyMoves.length > 0) {
      return { move: emergencyMoves[0].direction };
    }
    return { move: 'down' }; // Last resort
  }

  function calculateDistance(pos1, pos2) {
    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
  }

  function findNearestFood(currentPosition, foodList) {
    if (!foodList || foodList.length === 0) return null;
    let nearestFood = foodList[0];
    let minDistance = calculateDistance(currentPosition, nearestFood);
    for (let i = 1; i < foodList.length; i++) {
      const distance = calculateDistance(currentPosition, foodList[i]);
      if (distance < minDistance) {
        minDistance = distance;
        nearestFood = foodList[i];
      }
    }
    return nearestFood;
  }

  function countAvailableSpaces(position, boardWidth, boardHeight, allSnakeBodies, hazards, willEat) {
    let count = 0;
    const visited = new Set();
    const queue = [position];

    while (queue.length > 0) {
      const current = queue.shift();
      const key = `${current.x},${current.y}`;

      if (visited.has(key)) continue;
      visited.add(key);
      count++;

      const adjacentPositions = [
        { x: current.x, y: current.y + 1 },
        { x: current.x, y: current.y - 1 },
        { x: current.x - 1, y: current.y },
        { x: current.x + 1, y: current.y }
      ];

      for (const nextPosition of adjacentPositions) {
        if (
          nextPosition.x >= 0 &&
          nextPosition.x < boardWidth &&
          nextPosition.y >= 0 &&
          nextPosition.y < boardHeight &&
          !isOccupied(nextPosition, allSnakeBodies, hazards, willEat) &&
          !visited.has(`${nextPosition.x},${nextPosition.y}`)
        ) {
          queue.push(nextPosition);
        }
      }
    }
    return count;
  }

  function isOccupied(position, allSnakeBodies, hazards, willEat = false) {
    const mySnake = allSnakeBodies[0];
    for (let i = 0; i < allSnakeBodies.length; i++) {
      const snake = allSnakeBodies[i];
      if (!snake || !snake.body) continue;
      for (let j = 0; j < snake.body.length; j++) {
        const segment = snake.body[j];
        // Skip my snake's tail if not eating food
        if (i === 0 && j === snake.body.length - 1 && !willEat) continue;
        if (segment.x === position.x && segment.y === position.y) {
          return true;
        }
      }
    }
    for (const hazard of hazards) {
      if (hazard.x === position.x && hazard.y === position.y) {
        return true;
      }
    }
    return false;
  }

  function getPossibleMoves(head, boardWidth, boardHeight, allSnakeBodies, hazards, willEat) {
    const moves = [];
    const allSnakes = [{ body: mySnakeBody }, ...otherSnakes];

    if (head.x > 0 && !isOccupied({ x: head.x - 1, y: head.y }, allSnakes, hazards, willEat)) {
      moves.push({ direction: 'left', x: head.x - 1, y: head.y });
    }
    if (head.x < boardWidth - 1 && !isOccupied({ x: head.x + 1, y: head.y }, allSnakes, hazards, willEat)) {
      moves.push({ direction: 'right', x: head.x + 1, y: head.y });
    }
    if (head.y > 0 && !isOccupied({ x: head.x, y: head.y - 1 }, allSnakes, hazards, willEat)) {
      moves.push({ direction: 'down', x: head.x, y: head.y - 1 });
    }
    if (head.y < boardHeight - 1 && !isOccupied({ x: head.x, y: head.y + 1 }, allSnakes, hazards, willEat)) {
      moves.push({ direction: 'up', x: head.x, y: head.y + 1 });
    }
    return moves;
  }

  function willEatFood(head, move, food) {
    const nextHead = { ...head };
    switch (move) {
      case 'up':
        nextHead.y++;
        break;
      case 'down':
        nextHead.y--;
        break;
      case 'left':
        nextHead.x--;
        break;
      case 'right':
        nextHead.x++;
        break;
    }
    return food.some(f => f.x === nextHead.x && f.y === nextHead.y);
  }

  // Predict future hazards (e.g., shrinking walls)
  const futureHazards = [...hazards];
  const hazardInterval = 25;
  const turnsUntilNextHazard = hazardInterval - (turn % hazardInterval);
  if (turnsUntilNextHazard <= 3) {
    const shrinkAmount = 1;
    for (let x = shrinkAmount; x < boardWidth - shrinkAmount; x++) {
      futureHazards.push({ x, y: shrinkAmount }, { x, y: boardHeight - 1 - shrinkAmount });
    }
    for (let y = shrinkAmount; y < boardHeight - shrinkAmount; y++) {
      futureHazards.push({ x: shrinkAmount, y }, { x: boardWidth - 1 - shrinkAmount, y });
    }
  }

  // Prioritize food when health is low, snake is small, or early game
  if (foodLocations.length > 0 && (mySnakeHealth < 50 || mySnakeLength < 10 || turn < 50)) {
    const closestFood = findNearestFood(myHeadPosition, foodLocations);
    if (closestFood) {
      const dx = closestFood.x - myHeadPosition.x;
      const dy = closestFood.y - myHeadPosition.y;
      let targetDirection;

      if (dx > 0 && moveSafety.right) targetDirection = 'right';
      else if (dx < 0 && moveSafety.left) targetDirection = 'left';
      else if (dy > 0 && moveSafety.up) targetDirection = 'up';
      else if (dy < 0 && moveSafety.down) targetDirection = 'down';

      if (targetDirection) {
        let foodIsSafe = true;
        for (const otherSnake of otherSnakes) {
          if (otherSnake.body.length >= mySnakeLength || otherSnake.body.length + 1 > mySnakeLength) {
            const otherSnakeHead = otherSnake.body[0];
            const myDistanceToFood = calculateDistance(myHeadPosition, closestFood);
            const otherSnakeDistanceToFood = calculateDistance(otherSnakeHead, closestFood);
            if (otherSnakeDistanceToFood < myDistanceToFood) {
              foodIsSafe = false;
              break;
            }
          }
        }
        if (foodIsSafe) {
          return { move: targetDirection };
        }
      }
    }
  }

  const possibleMoves = getPossibleMoves(myHeadPosition, boardWidth, boardHeight, [{ body: mySnakeBody }, ...otherSnakes], futureHazards, false);
  let bestMove = null;
  let maxSpaces = -1;
  let foodDistance = Infinity;
  const aggressiveFoodFactor = 6;
  const minSpacesRequired = Math.max(5, mySnakeLength * 2);

  for (const move of possibleMoves) {
    const willEat = willEatFood(myHeadPosition, move.direction, foodLocations);
    const nextHead = { x: move.x, y: move.y };
    const spaces = countAvailableSpaces(nextHead, boardWidth, boardHeight, [{ body: mySnakeBody }, ...otherSnakes], futureHazards, willEat);
    let isTrapping = false;
    let isRiskyFood = false;
    let isHeadToHead = false;

    // Check for head-to-head with larger snakes
    for (const otherSnake of otherSnakes) {
      if (otherSnake.body.length >= mySnakeLength) {
        const otherHead = otherSnake.body[0];
        const otherPossibleMoves = [
          { x: otherHead.x + 1, y: otherHead.y },
          { x: otherHead.x - 1, y: otherHead.y },
          { x: otherHead.x, y: otherHead.y + 1 },
          { x: otherHead.x, y: otherHead.y - 1 }
        ].filter(pos => pos.x >= 0 && pos.x < boardWidth && pos.y >= 0 && pos.y < boardHeight);
        if (otherPossibleMoves.some(pos => pos.x === nextHead.x && pos.y === nextHead.y)) {
          isHeadToHead = true;
          break;
        }
      }
    }

    // Check food risk
    if (foodLocations.length > 0) {
      const nearestFood = findNearestFood(nextHead, foodLocations);
      if (nearestFood) {
        const distanceToFood = calculateDistance(nextHead, nearestFood);
        for (const otherSnake of otherSnakes) {
          if (otherSnake.body.length >= mySnakeLength) {
            const otherSnakeHead = otherSnake.body[0];
            const otherSnakeDistanceToFood = calculateDistance(otherSnakeHead, nearestFood);
            if (otherSnakeDistanceToFood < distanceToFood) {
              isRiskyFood = true;
              break;
            }
          }
        }
      }
    }

    // Check if move traps smaller snakes
    for (const otherSnake of otherSnakes) {
      if (otherSnake.body.length < mySnakeLength) {
        const otherSnakeHead = otherSnake.body[0];
        const otherSnakePossibleMoves = getPossibleMoves(otherSnakeHead, boardWidth, boardHeight, [{ body: mySnakeBody }, ...otherSnakes], futureHazards, false);
        if (otherSnakePossibleMoves.length === 0) {
          isTrapping = true;
          break;
        }
      }
    }

    // Calculate food distance
    let currentFoodDistance = Infinity;
    if (foodLocations.length > 0) {
      const nearestFood = findNearestFood(nextHead, foodLocations);
      if (nearestFood) {
        currentFoodDistance = calculateDistance(nextHead, nearestFood);
      }
    }

    if (spaces > maxSpaces && spaces >= minSpacesRequired && !isTrapping && (!isRiskyFood || mySnakeHealth > 60) && !isHeadToHead) {
      maxSpaces = spaces;
      bestMove = move.direction;
      foodDistance = currentFoodDistance;
    } else if (spaces === maxSpaces && !isTrapping && currentFoodDistance < foodDistance * aggressiveFoodFactor && !isHeadToHead) {
      bestMove = move.direction;
      foodDistance = currentFoodDistance;
    } else if (mySnakeHealth < 20 && currentFoodDistance < 3 && !isHeadToHead) {
      bestMove = move.direction;
      foodDistance = currentFoodDistance;
    }
  }

  if (bestMove) {
    return { move: bestMove };
  }

  if (safeMoves.length > 0) {
    return { move: safeMoves[0] };
  }

  return { move: 'down' };
}

export function getGameVerdict(gameState) {
  const mySnake = gameState.you;
  const otherSnakes = gameState.board.snakes.filter(snake => snake.id !== mySnake.id);

  if (mySnake.health <= 0) {
    return "loss";
  }

  if (otherSnakes.length === 0 || otherSnakes.every(snake => snake.health <= 0)) {
    return "win";
  }

  if (mySnake.body.length === 0) {
    return "loss";
  }

  function isTrapped(head, boardWidth, boardHeight, allSnakeBodies, hazards) {
    const visited = new Set();
    const queue = [head];

    while (queue.length > 0) {
      const current = queue.shift();
      const key = `${current.x},${current.y}`;

      if (visited.has(key)) continue;
      visited.add(key);

      const adjacentPositions = [
        { x: current.x, y: current.y + 1 },
        { x: current.x, y: current.y - 1 },
        { x: current.x - 1, y: current.y },
        { x: current.x + 1, y: current.y }
      ];

      for (const nextPosition of adjacentPositions) {
        if (
          nextPosition.x >= 0 &&
          nextPosition.x < boardWidth &&
          nextPosition.y >= 0 &&
          nextPosition.y < boardHeight &&
          !isOccupied(nextPosition, allSnakeBodies, hazards, false) &&
          !visited.has(`${nextPosition.x},${nextPosition.y}`)
        ) {
          return false;
        }
      }
    }
    return true;
  }

  function isOccupied(position, allSnakeBodies, hazards, willEat = false) {
    const mySnake = allSnakeBodies[0];
    for (let i = 0; i < allSnakeBodies.length; i++) {
      const snake = allSnakeBodies[i];
      if (!snake || !snake.body) continue;
      for (let j = 0; j < snake.body.length; j++) {
        const segment = snake.body[j];
        if (i === 0 && j === snake.body.length - 1 && !willEat) continue;
        if (segment.x === position.x && segment.y === position.y) {
          return true;
        }
      }
    }
    for (const hazard of hazards) {
      if (hazard.x === position.x && hazard.y === position.y) {
        return true;
      }
    }
    return false;
  }

  const allSnakeBodies = [mySnake, ...otherSnakes];
  if (isTrapped(mySnake.body[0], gameState.board.width, gameState.board.height, allSnakeBodies, gameState.board.hazards)) {
    return "loss";
  }

  return "ongoing";
}
