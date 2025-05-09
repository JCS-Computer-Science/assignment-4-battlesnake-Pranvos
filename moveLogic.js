export default function move(gameState) {
  const myHeadPosition = gameState['you']['body'][0];
  const mySnakeLength = gameState['you']['body']['length'];
  let mySnakeHealth = gameState['you']['health'];
  const boardWidth = gameState['board']['width'];
  const boardHeight = gameState['board']['height'];
  const foodLocations = gameState['board']['food'];
  const otherSnakes = gameState['board']['snakes'].filter(snake => snake['id'] !== gameState['you']['id']);
  const hazards = gameState['board']['hazards'] || [];
  const stormDamage = gameState['board']['damagePerTurn'] || 0;
  const turn = gameState['turn'];

  // Apply storm damage
  if (stormDamage > 0) {
    mySnakeHealth -= stormDamage;
    gameState['you']['health'] = mySnakeHealth;
  }

  const moveSafety = {
    up: true,
    down: true,
    left: true,
    right: true
  };

  // Basic boundary checks
  if (myHeadPosition['x'] <= 0) moveSafety['left'] = false;
  if (myHeadPosition['x'] >= boardWidth - 1) moveSafety['right'] = false;
  if (myHeadPosition['y'] <= 0) moveSafety['down'] = false;
  if (myHeadPosition['y'] >= boardHeight - 1) moveSafety['up'] = false;

  // Check for self collisions
  for (let i = 1; i < mySnakeLength; i++) {
    const segment = gameState['you']['body'][i];
    if (segment['x'] === myHeadPosition['x'] + 1 && segment['y'] === myHeadPosition['y']) moveSafety['right'] = false;
    else if (segment['x'] === myHeadPosition['x'] - 1 && segment['y'] === myHeadPosition['y']) moveSafety['left'] = false;
    else if (segment['x'] === myHeadPosition['x'] && segment['y'] === myHeadPosition['y'] + 1) moveSafety['up'] = false;
    else if (segment['x'] === myHeadPosition['x'] && segment['y'] === myHeadPosition['y'] - 1) moveSafety['down'] = false;
  }

  // Check for collisions with other snakes and potential head to head collisions
  for (const snake of otherSnakes) {
    for (let i = 0; i < snake['body'].length; i++) {
      const segment = snake['body'][i];
      if (segment['x'] === myHeadPosition['x'] + 1 && segment['y'] === myHeadPosition['y']) moveSafety['right'] = false;
      else if (segment['x'] === myHeadPosition['x'] - 1 && segment['y'] === myHeadPosition['y']) moveSafety['left'] = false;
      else if (segment['x'] === myHeadPosition['x'] && segment['y'] === myHeadPosition['y'] + 1) moveSafety['up'] = false;
      else if (segment['x'] === myHeadPosition['x'] && segment['y'] === myHeadPosition['y'] - 1) moveSafety['down'] = false;
    }

    // Check for potential head to head collisions
    if (snake['body']['length'] >= mySnakeLength) {
      const otherHeadX = snake['body'][0]['x'];
      const otherHeadY = snake['body'][0]['y'];

      if (otherHeadX === myHeadPosition['x'] + 1 && otherHeadY === myHeadPosition['y']) moveSafety['right'] = false;
      else if (otherHeadX === myHeadPosition['x'] - 1 && otherHeadY === myHeadPosition['y']) moveSafety['left'] = false;
      else if (otherHeadX === myHeadPosition['x'] && otherHeadY === myHeadPosition['y'] + 1) moveSafety['up'] = false;
      else if (otherHeadX === myHeadPosition['x'] && otherHeadY === myHeadPosition['y'] - 1) moveSafety['down'] = false;
    }
  }

  const safeMoves = [];
  for (const [direction, isSafe] of Object.entries(moveSafety)) {
    if (isSafe) {
      safeMoves.push(direction);
    }
  }

  if (safeMoves.length === 0) {
    // If no safe moves, try to move towards the center
    const center_x = Math.floor(boardWidth / 2);
    const center_y = Math.floor(boardHeight / 2);
    if (myHeadPosition['x'] < center_x && moveSafety['right']) return { move: 'right' };
    if (myHeadPosition['x'] > center_x && moveSafety['left']) return { move: 'left' };
    if (myHeadPosition['y'] < center_y && moveSafety['up']) return { move: 'up' };
    if (myHeadPosition['y'] > center_y && moveSafety['down']) return { move: 'down' };

    const fallbackMoves = ["up", "right", "down", "left"];
    for (let i = 0; i < fallbackMoves.length; i++) {
      const move = fallbackMoves[i];
      if (moveSafety[move]) {
        return { move: move };
      }
    }
    return { move: 'down' };
  }

  function calculateDistance(pos1, pos2) {
    return Math.abs(pos1['x'] - pos2['x']) + Math.abs(pos1['y'] - pos2['y']);
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

  function getAccessibleSpaces(head, boardWidth, boardHeight, allSnakeBodies, hazards) {
    let count = 0;
    const visited = new Set();
    const queue = [head];

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

      for (let i = 0; i < adjacentPositions.length; i++) { //iterating through adjacentPositions
        const nextPosition = adjacentPositions[i];
        if (
          nextPosition['x'] >= 0 &&
          nextPosition['x'] < boardWidth &&
          nextPosition['y'] >= 0 &&
          nextPosition['y'] < boardHeight &&
          !isOccupied(nextPosition, allSnakeBodies, hazards) &&
          !visited.has(`${nextPosition['x']},${nextPosition['y']}`)
        ) {
          queue.push(nextPosition);
        }
      }
    }
    return count;
  }

  function isOccupied(position, allSnakeBodies, hazards) {
    for (let snakeIndex = 0; snakeIndex < allSnakeBodies.length; snakeIndex++) {
      const snake = allSnakeBodies[snakeIndex];
      if (!snake || !snake['body']) continue; // defensive check
      for (let segmentIndex = 0; segmentIndex < snake['body'].length; segmentIndex++) {
        const segment = snake['body'][segmentIndex];
        if (segment['x'] === position['x'] && segment['y'] === position['y']) {
          return true;
        }
      }
    }
    for (const hazard of hazards) {
      if (hazard['x'] === position['x'] && hazard['y'] === position['y']) {
        return true;
      }
    }
    return false;
  }

  function getPossibleMoves(head, boardWidth, boardHeight, allSnakeBodies, hazards) {
    const moves = [];
    const allSnakes = [];

    // my snake
    allSnakes.push({ body: gameState['you']['body'] });
    // other snakes
    for (let i = 0; i < otherSnakes.length; i++) {
      allSnakes.push(otherSnakes[i]);
    }

    if (head['x'] > 0 && !isOccupied({ x: head['x'] - 1, y: head['y'] }, allSnakes, hazards)) {
      moves.push({ direction: 'left', x: head['x'] - 1, y: head['y'] });
    }
    if (head['x'] < boardWidth - 1 && !isOccupied({ x: head['x'] + 1, y: head['y'] }, allSnakes, hazards)) {
      moves.push({ direction: 'right', x: head['x'] + 1, y: head['y'] });
    }
    if (head['y'] > 0 && !isOccupied({ x: head['x'], y: head['y'] - 1 }, allSnakes, hazards)) {
      moves.push({ direction: 'down', x: head['x'], y: head['y'] - 1 });
    }
    if (head['y'] < boardHeight - 1 && !isOccupied({ x: head['x'], y: head['y'] + 1 }, allSnakes, hazards)) {
      moves.push({ direction: 'up', x: head['x'], y: head['y'] + 1 });
    }
    return moves;
  }

  function willEatFood(head, move, food) {
    const nextHead = { ...head };
    switch (move) {
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
    return food.some(f => f['x'] === nextHead['x'] && f['y'] === nextHead['y']);
  }

  const futureHazards = [];
  const hazardInterval = 25;
  const turnsUntilNextHazard = hazardInterval - (turn % hazardInterval);

  // Predict future hazard locations
  if (turnsUntilNextHazard <= 3) {
    const expansionAmount = 1;
    futureHazards.push(
      { x: 0 - expansionAmount, y: myHeadPosition['y'] },
      { x: boardWidth - 1 + expansionAmount, y: myHeadPosition['y'] },
      { x: myHeadPosition['x'], y: 0 - expansionAmount },
      { x: myHeadPosition['x'], y: boardHeight - 1 + expansionAmount },
    );
  }
  //add current hazards
  for (let i = 0; i< hazards.length; i++){
    futureHazards.push(hazards[i]);
  }

  function chooseMove(myHeadPosition, mySnakeLength, otherSnakes, boardWidth, boardHeight, gameState, futureHazards, foodLocations) {
    let bestMove = null;
    let maxSpaces = -1;
    let foodDistance = Infinity;
    const aggressiveFoodFactor = 1.5;
    const attackLengthDiff = 3;
    const attackSpaceThreshold = 3;
    let targetSnake = null;

    const possibleMoves = getPossibleMoves(myHeadPosition, boardWidth, boardHeight, [{ body: gameState['you']['body'] }, ...otherSnakes], futureHazards);

    for (let i = 0; i < possibleMoves.length; i++) {
      const move = possibleMoves[i];
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
          if (attackDistance <= 4) {
            canAttack = true;
            targetSnake = otherSnake;
            break;
          }
        }
      }
      if (foodLocations.length > 0) {
        const nearestFood = findNearestFood(nextHead, foodLocations);
        if (nearestFood) {
          const distanceToFood = calculateDistance(nextHead, nearestFood);
          for (const otherSnake of otherSnakes) {
            if (otherSnake['body']['length'] >= mySnakeLength) {
              const otherSnakeHead = otherSnake['body'][0];
              const otherSnakeDistanceToFood = calculateDistance(otherSnakeHead, nearestFood);
              if (otherSnakeDistanceToFood <= distanceToFood) {
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
          if (otherSnakePossibleMoves.length === 0) {
            isTrapping = true;
            break;
          }
        }
      }

      // Calculate distance to the nearest food
      let currentFoodDistance = Infinity;
      if (foodLocations.length > 0) {
        const nearestFood = findNearestFood(nextHead, foodLocations);
        if (nearestFood) {
          currentFoodDistance = calculateDistance(nextHead, nearestFood);
        }
      }
      // Prioritize attack
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

      if (spaces > maxSpaces && !isTrapping && (!isRiskyFood || gameState['you']['health'] > 50) && !isHeadToHead) {
        maxSpaces = spaces;
        bestMove = move['direction'];
        foodDistance = currentFoodDistance;
      } else if (spaces === maxSpaces && !isTrapping && currentFoodDistance < foodDistance * aggressiveFoodFactor && !isHeadToHead) {
        bestMove = move['direction'];
        foodDistance = currentFoodDistance;
      } else if (gameState['you']['health'] < 30 && currentFoodDistance < 3 && !isHeadToHead) {
        bestMove = move['direction'];
        foodDistance = currentFoodDistance;
      }
    }
    return { move: bestMove };
  }

  //  hunting logic for other snakes
  if (mySnakeHealth > 60 && mySnakeLength > 8) {
    return chooseMove(myHeadPosition, mySnakeLength, otherSnakes, boardWidth, boardHeight, gameState, futureHazards, foodLocations);
  }

  // Prioritize food aggressively when health is moderate or snake is short
  if (foodLocations.length > 0 && (mySnakeHealth < 70 || mySnakeLength < 8)) {
    let closestFood = findNearestFood(myHeadPosition, foodLocations);
    if (closestFood) {
      const dx = closestFood['x'] - myHeadPosition['x'];
      const dy = closestFood['y'] - myHeadPosition['y'];
      let targetDirection;

      if (dx > 0 && moveSafety['right']) targetDirection = 'right';
      else if (dx < 0 && moveSafety['left']) targetDirection = 'left';
      else if (dy > 0 && moveSafety['up']) targetDirection = 'up';
      else if (dy < 0 && moveSafety['down']) targetDirection = 'down';

      if (targetDirection) {
        let foodIsSafe = true;
        for (const otherSnake of otherSnakes) {
          if (otherSnake['body']['length'] >= mySnakeLength) {
            const otherSnakeHead = otherSnake['body'][0];
            const myDistanceToFood = calculateDistance(myHeadPosition, closestFood);
            const otherSnakeDistanceToFood = calculateDistance(otherSnakeHead, closestFood);
            if (otherSnakeDistanceToFood <= myDistanceToFood) {
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

  // Check for food in hazard zones
  if (foodLocations.length > 0 && mySnakeHealth < 70) {
    let closestFood = findNearestFood(myHeadPosition, foodLocations);
    if (closestFood) {
      const dx = closestFood['x'] - myHeadPosition['x'];
      const dy = closestFood['y'] - myHeadPosition['y'];
      let targetDirection;

      // Allow moves into hazards if they lead to food
      const hazardMoveSafety = {
        up: true,
        down: true,
        left: true,
        right: true
      };


      for (let i = 1; i < mySnakeLength; i++) {
        const segment = gameState['you']['body'][i];
        if (segment['x'] === myHeadPosition['x'] + 1 && segment['y'] === myHeadPosition['y']) hazardMoveSafety['right'] = false;
        else if (segment['x'] === myHeadPosition['x'] - 1 && segment['y'] === myHeadPosition['y']) hazardMoveSafety['left'] = false;
        else if (segment['x'] === myHeadPosition['x'] && segment['y'] === myHeadPosition['y'] + 1) hazardMoveSafety['up'] = false;
        else if (segment['x'] === myHeadPosition['x'] && segment['y'] === myHeadPosition['y'] - 1) hazardMoveSafety['down'] = false;
      }

      if (dx > 0 && hazardMoveSafety['right']) targetDirection = 'right';
      else if (dx < 0 && hazardMoveSafety['left']) targetDirection = 'left';
      else if (dy > 0 && hazardMoveSafety['up']) targetDirection = 'up';
      else if (dy < 0 && hazardMoveSafety['down']) targetDirection = 'down';

      if (targetDirection) {
        let foodIsSafe = true;
        for (const otherSnake of otherSnakes) {
          if (otherSnake['body']['length'] >= mySnakeLength) {
            const otherSnakeHead = otherSnake['body'][0];
            const myDistanceToFood = calculateDistance(myHeadPosition, closestFood);
            const otherSnakeDistanceToFood = calculateDistance(otherSnakeHead, closestFood);
            if (otherSnakeDistanceToFood <= myDistanceToFood) {
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

  return chooseMove(myHeadPosition, mySnakeLength, otherSnakes, boardWidth, boardHeight, gameState, futureHazards, foodLocations);
}
