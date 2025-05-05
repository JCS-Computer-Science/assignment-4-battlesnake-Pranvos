
      if (targetDirection) {
        let foodIsSafe = true;
        for (const otherSnake of otherSnakes) {
          if (otherSnake['body']['length'] >= mySnakeLength || otherSnake['body']['length'] + 1 > mySnakeLength) {
            const otherSnakeHead = otherSnake['body'][0];
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

  const possibleMoves = getPossibleMoves(myHeadPosition, boardWidth, boardHeight, [{ body: gameState['you']['body'] }, ...otherSnakes], futureHazards);
  let bestMove = null;
  let maxSpaces = -1;
  let foodDistance = Infinity;
  const aggressiveFoodFactor = 3; // Higher value = more aggressive
  const attackLengthDiff = 3;    // Min length difference to attack
  const attackSpaceThreshold = 5; // Min accessible spaces for attack

  for (const move of possibleMoves) {
    const nextHead = { ...myHeadPosition };
    switch (move['direction']) {
      case 'up':
        nextHead['y']++;
        break;
      case 'down':
        nextHead['y']--;
        break;
      case 'left':
        nextHead['x']--;
        break;
      case 'right':
        nextHead['x']++;
        break;
    }

    const spaces = getAccessibleSpaces({ x: nextHead['x'], y: nextHead['y'] }, boardWidth, boardHeight, [{ body: gameState['you']['body'] }, ...otherSnakes], futureHazards);
    let isTrapping = false;
    let isRiskyFood = false;
    let isHeadToHead = false;
    let canAttack = false;
    let targetSnake = null;
    let targetMove = null;

    for (const otherSnake of otherSnakes) {
      if (otherSnake['body']['length'] >= mySnakeLength) {
        const otherHeadX = otherSnake['body'][0]['x'];
        const otherHeadY = otherSnake['body'][0]['y'];
        if (
          (nextHead['x'] === otherHeadX + 1 && nextHead['y'] === otherHeadY) ||
          (nextHead['x'] === otherHeadX - 1 && nextHead['y'] === otherHeadY) ||
          (nextHead['x'] === otherHeadX && nextHead['y'] === otherHeadY + 1) ||
          (nextHead['x'] === otherHeadX && nextHead['y'] === otherHeadY - 1)
        ) {
          isHeadToHead = true;
          break;
        }
      }
      if (mySnakeLength > otherSnake['body']['length'] + attackLengthDiff) {
        const otherHeadX = otherSnake['body'][0]['x'];
        const otherHeadY = otherSnake['body'][0]['y'];
        const attackDistance = calculateDistance(nextHead, { x: otherHeadX, y: otherHeadY });
        if (attackDistance <= 2) { // Only attack if close
          canAttack = true;
          targetSnake = otherSnake;
          targetMove = move['direction'];
          break;
        }
      }
    }
    if (foodLocations['length'] > 0) {
      const nearestFood = findNearestFood(nextHead, foodLocations);
      if (nearestFood) {
        const distanceToFood = calculateDistance(nextHead, nearestFood);
        for (const otherSnake of otherSnakes) {
          if (otherSnake['body']['length'] >= mySnakeLength) {
            const otherSnakeHead = otherSnake['body'][0];
            const otherSnakeDistanceToFood = calculateDistance(otherSnakeHead, nearestFood);
            if (otherSnakeDistanceToFood < distanceToFood) {
              isRiskyFood = true;
              break;
            }
          }
        }
      }
    }

    for (const otherSnake of otherSnakes) {
      if (otherSnake['body']['length'] < mySnakeLength) {
        const otherSnakeHead = otherSnake['body'][0];
        const otherSnakePossibleMoves = getPossibleMoves(otherSnakeHead, boardWidth, boardHeight, [{ body: gameState['you']['body'] }, ...otherSnakes], futureHazards);
        if (otherSnakePossibleMoves['length'] === 0) {
          isTrapping = true;
          break;
        }
      }
    }

    // Calculate distance to the nearest food
    let currentFoodDistance = Infinity;
    if (foodLocations['length'] > 0) {
      const nearestFood = findNearestFood(nextHead, foodLocations);
      if (nearestFood) {
        currentFoodDistance = calculateDistance(nextHead, nearestFood);
      }
    }

    if (canAttack && spaces >= attackSpaceThreshold) {
      if (targetSnake) {
        const targetHead = targetSnake['body'][0];
        const possibleTargetMoves = getPossibleMoves(targetHead, boardWidth, boardHeight, [{ body: gameState['you']['body'] }, ...otherSnakes], futureHazards);
        if (possibleTargetMoves.length <= 2) {
          return { move: move['direction'] };
        }
      }
      return { move: move['direction'] };
    }

    if (spaces > maxSpaces && !isTrapping && (!isRiskyFood || mySnakeHealth > 60) && !isHeadToHead) {
      maxSpaces = spaces;
      bestMove = move['direction'];
      foodDistance = currentFoodDistance;
    } else if (spaces === maxSpaces && !isTrapping && currentFoodDistance < foodDistance * aggressiveFoodFactor && !isHeadToHead) {
      bestMove = move['direction'];
      foodDistance = currentFoodDistance;
    } else if (mySnakeHealth < 20 && currentFoodDistance < 3 && !isHeadToHead) {
      bestMove = move['direction'];
      foodDistance = currentFoodDistance;
    }
  }

  if (bestMove) {
    return { move: bestMove };
  }

  if (safeMoves.length > 0) {
    return { move: safeMoves[0] };
  }

  // //move down if nothing else is safe
  // return { move: 'down' };
}

export function getGameVerdict(gameState) {
  const mySnake = gameState['you'];
  const otherSnakes = gameState['board']['snakes']['filter'](snake => snake['id'] !== mySnake['id']);

  if (mySnake['health'] <= 0) {
    return "loss";
  }

  if (otherSnakes['length'] === 0) {
    return "win";
  }

  let otherSnakesAlive = 0;
  for (const snake of otherSnakes) {
    if (snake['health'] > 0) {
      otherSnakesAlive++;
    }
  }
  if (otherSnakesAlive === 0) {
    return "win";
  }

  if (mySnake['body']['length'] === 0) {
    return "loss"
  }

  // Check if the snake is trapped
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
          !isOccupied(nextPosition, allSnakeBodies, hazards) &&
          !visited.has(`${nextPosition.x},${nextPosition.y}`)
        ) {
          return false;
        }
      }
    }
    return true;
  }

  const allSnakeBodies = [mySnake, ...otherSnakes];
  if (isTrapped(mySnake['body'][0], boardWidth, boardHeight, allSnakeBodies, hazards)) {
    return "loss";
  }

  return "ongoing";
}
