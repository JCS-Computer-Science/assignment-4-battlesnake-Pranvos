export default function move(gameState) {
  const myHeadPosition = gameState.you.body[0];
  const mySnakeLength = gameState.you.body.length;
  let mySnakeHealth = gameState.you.health;
  const boardWidth = gameState.board.width;
  const boardHeight = gameState.board.height;
  const foodLocations = gameState.board.food;
  const otherSnakes = gameState.board.snakes.filter(snake => snake.id !== gameState.you.id);
  const hazards = gameState.board.hazards || [];
  const stormDamage = gameState.board.damagePerTurn || 0;
  const turn = gameState.turn;

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

  if (myHeadPosition.x <= 0) moveSafety.left = false;
  if (myHeadPosition.x >= boardWidth - 1) moveSafety.right = false;
  if (myHeadPosition.y <= 0) moveSafety.down = false;
  if (myHeadPosition.y >= boardHeight - 1) moveSafety.up = false;

  for (let i = 1; i < mySnakeLength; i++) {
    const segment = gameState.you.body[i];
    if (segment.x === myHeadPosition.x + 1 && segment.y === myHeadPosition.y) moveSafety.right = false;
    else if (segment.x === myHeadPosition.x - 1 && segment.y === myHeadPosition.y) moveSafety.left = false;
    else if (segment.x === myHeadPosition.x && segment.y === myHeadPosition.y + 1) moveSafety.up = false;
    else if (segment.x === myHeadPosition.x && segment.y === myHeadPosition.y - 1) moveSafety.down = false;
  }

  for (const snake of otherSnakes) {
    for (const segment of snake.body) {
      if (segment.x === myHeadPosition.x + 1 && segment.y === myHeadPosition.y) moveSafety.right = false;
      else if (segment.x === myHeadPosition.x - 1 && segment.y === myHeadPosition.y) moveSafety.left = false;
      else if (segment.x === myHeadPosition.x && segment.y === myHeadPosition.y + 1) moveSafety.up = false;
      else if (segment.x === myHeadPosition.x && segment.y === myHeadPosition.y - 1) moveSafety.down = false;
    }

    if (snake.body.length >= mySnakeLength) {
      const otherHeadX = snake.body[0].x;
      const otherHeadY = snake.body[0].y;

      if (otherHeadX === myHeadPosition.x + 1 && otherHeadY === myHeadPosition.y) moveSafety.right = false;
      else if (otherHeadX === myHeadPosition.x - 1 && otherHeadY === myHeadPosition.y) moveSafety.left = false;
      else if (otherHeadX === myHeadPosition.x && otherHeadY === myHeadPosition.y + 1) moveSafety.up = false;
      else if (otherHeadX === myHeadPosition.x && otherHeadY === myHeadPosition.y - 1) moveSafety.down = false;
    }
  }

  const safeMoves = Object.entries(moveSafety)
    .filter(([, isSafe]) => isSafe)
    .map(([direction]) => direction);

  if (safeMoves.length === 0) {
    const center_x = Math.floor(boardWidth / 2);
    const center_y = Math.floor(boardHeight / 2);
    if (myHeadPosition.x < center_x && moveSafety.right) return { move: 'right' };
    if (myHeadPosition.x > center_x && moveSafety.left) return { move: 'left' };
    if (myHeadPosition.y < center_y && moveSafety.up) return { move: 'up' };
    if (myHeadPosition.y > center_y && moveSafety.down) return { move: 'down' };

    const fallbackMoves = ["up", "right", "down", "left"];
    for (const move of fallbackMoves) {
      if (moveSafety[move]) return { move };
    }
    return { move: 'down' };
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

      for (const nextPosition of adjacentPositions) {
        if (
          nextPosition.x >= 0 &&
          nextPosition.x < boardWidth &&
          nextPosition.y >= 0 &&
          nextPosition.y < boardHeight &&
          !isOccupied(nextPosition, allSnakeBodies, hazards) &&
          !visited.has(`${nextPosition.x},${nextPosition.y}`)
        ) {
          queue.push(nextPosition);
        }
      }
    }
    return count;
  }

  function isOccupied(position, allSnakeBodies, hazards) {
    for (const snake of allSnakeBodies) {
      if (!snake || !snake.body) continue;
      for (const segment of snake.body) {
        if (segment.x === position.x && segment.y === position.y) return true;
      }
    }
    for (const hazard of hazards) {
      if (hazard.x === position.x && hazard.y === position.y) return true;
    }
    return false;
  }

  function getPossibleMoves(head, boardWidth, boardHeight, allSnakeBodies, hazards) {
    const moves = [];
    const allSnakes = [{ body: gameState.you.body }];
    for (const snake of otherSnakes) {
      allSnakes.push(snake);
    }

    if (head.x > 0 && !isOccupied({ x: head.x - 1, y: head.y }, allSnakes, hazards)) {
      moves.push({ direction: 'left', x: head.x - 1, y: head.y });
    }
    if (head.x < boardWidth - 1 && !isOccupied({ x: head.x + 1, y: head.y }, allSnakes, hazards)) {
      moves.push({ direction: 'right', x: head.x + 1, y: head.y });
    }
    if (head.y > 0 && !isOccupied({ x: head.x, y: head.y - 1 }, allSnakes, hazards)) {
      moves.push({ direction: 'down', x: head.x, y: head.y - 1 });
    }
    if (head.y < boardHeight - 1 && !isOccupied({ x: head.x, y: head.y + 1 }, allSnakes, hazards)) {
      moves.push({ direction: 'up', x: head.x, y: head.y + 1 });
    }
    return moves;
  }

  function willEatFood(head, move, food) {
    const nextHead = { x: head.x, y: head.y };
    switch (move) {
      case 'up': nextHead.y++; break;
      case 'down': nextHead.y--; break;
      case 'left': nextHead.x--; break;
      case 'right': nextHead.x++; break;
    }
    for (const f of food) {
      if (f.x === nextHead.x && f.y === nextHead.y) return true;
    }
    return false;
  }

  function canSurvive(position, health, turns, snakeBody, otherSnakes, hazards, foodLocations, boardWidth, boardHeight, stormDamage, maxDepth = 10) {
    if (health <= 0) return false;
    if (turns >= maxDepth) return health > stormDamage * 2; // Ensure enough health to survive a few more turns

    const newSnakeBody = [position];
    for (let i = 0; i < snakeBody.length - 1; i++) {
      newSnakeBody.push(snakeBody[i]);
    }

    const allSnakes = [{ body: newSnakeBody }];
    for (const snake of otherSnakes) {
      allSnakes.push(snake);
    }
    const possibleMoves = getPossibleMoves(position, boardWidth, boardHeight, allSnakes, hazards);

    if (possibleMoves.length === 0) return false;

    for (const move of possibleMoves) {
      const nextHead = { x: move.x, y: move.y };
      let newHealth = health - stormDamage; // Apply storm damage each turn
      const isHazard = hazards.some(h => h.x === nextHead.x && h.y === nextHead.y);
      if (isHazard) newHealth -= 14; // Additional hazard damage
      if (willEatFood(position, move.direction, foodLocations)) {
        newHealth = 100; // Eating food restores health
      }

      if (canSurvive(nextHead, newHealth, turns + 1, newSnakeBody, otherSnakes, hazards, foodLocations, boardWidth, boardHeight, stormDamage, maxDepth)) {
        return true;
      }
    }
    return false;
  }

  const futureHazards = [];
  const hazardInterval = 25;
  const turnsUntilNextHazard = hazardInterval - (turn % hazardInterval);

  if (turnsUntilNextHazard <= 3) {
    const expansionAmount = 1;
    futureHazards.push(
      { x: 0 - expansionAmount, y: myHeadPosition.y },
      { x: boardWidth - 1 + expansionAmount, y: myHeadPosition.y },
      { x: myHeadPosition.x, y: 0 - expansionAmount },
      { x: myHeadPosition.x, y: boardHeight - 1 + expansionAmount }
    );
  }
  for (const hazard of hazards) {
    futureHazards.push(hazard);
  }

  if (mySnakeHealth > 50 && mySnakeLength > 3) {
    let closestSnake = null;
    let minDistance = Infinity;
    for (const snake of otherSnakes) {
      if (snake.body.length < mySnakeLength) {
        const distance = calculateDistance(myHeadPosition, snake.body[0]);
        if (distance < minDistance) {
          minDistance = distance;
          closestSnake = snake;
        }
      }
    }
    if (closestSnake && minDistance <= 4) {
      const targetHead = closestSnake.body[0];
      const dx = targetHead.x - myHeadPosition.x;
      const dy = targetHead.y - myHeadPosition.y;
      let targetDirection;

      if (dx > 0 && moveSafety.right) targetDirection = 'right';
      else if (dx < 0 && moveSafety.left) targetDirection = 'left';
      else if (dy > 0 && moveSafety.up) targetDirection = 'up';
      else if (dy < 0 && moveSafety.down) targetDirection = 'down';

      if (targetDirection) {
        const nextHead = { x: myHeadPosition.x, y: myHeadPosition.y };
        switch (targetDirection) {
          case 'up': nextHead.y++; break;
          case 'down': nextHead.y--; break;
          case 'left': nextHead.x--; break;
          case 'right': nextHead.x++; break;
        }
        const spaces = getAccessibleSpaces(nextHead, boardWidth, boardHeight, [{ body: gameState.you.body }].concat(otherSnakes), futureHazards);
        const isHazard = hazards.some(h => h.x === nextHead.x && h.y === nextHead.y);
        if (!isHazard && spaces >= 3 && canSurvive(nextHead, mySnakeHealth - stormDamage, 0, gameState.you.body, otherSnakes, hazards, foodLocations, boardWidth, boardHeight, stormDamage)) {
          return { move: targetDirection };
        }
      }
    }
  }

  if (foodLocations.length > 0 && (mySnakeHealth < 70 || mySnakeLength < 7)) {
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
          if (otherSnake.body.length >= mySnakeLength) {
            const otherSnakeHead = otherSnake.body[0];
            const myDistanceToFood = calculateDistance(myHeadPosition, closestFood);
            const otherSnakeDistanceToFood = calculateDistance(otherSnakeHead, closestFood);
            if (otherSnakeDistanceToFood <= myDistanceToFood) {
              foodIsSafe = false;
              break;
            }
          }
        }
        if (foodIsSafe) {
          const nextHead = { x: myHeadPosition.x, y: myHeadPosition.y };
          switch (targetDirection) {
            case 'up': nextHead.y++; break;
            case 'down': nextHead.y--; break;
            case 'left': nextHead.x--; break;
            case 'right': nextHead.x++; break;
          }
          const isHazard = hazards.some(h => h.x === nextHead.x && h.y === nextHead.y);
          if (!isHazard && canSurvive(nextHead, mySnakeHealth - stormDamage, 0, gameState.you.body, otherSnakes, hazards, foodLocations, boardWidth, boardHeight, stormDamage)) {
            return { move: targetDirection };
          }
        }
      }
    }
  }

  if (foodLocations.length > 0 && mySnakeHealth < 30) {
    const closestFood = findNearestFood(myHeadPosition, foodLocations);
    if (closestFood) {
      const dx = closestFood.x - myHeadPosition.x;
      const dy = closestFood.y - myHeadPosition.y;
      let targetDirection;

      const hazardMoveSafety = {
        up: true,
        down: true,
        left: true,
        right: true
      };

      for (let i = 1; i < mySnakeLength; i++) {
        const segment = gameState.you.body[i];
        if (segment.x === myHeadPosition.x + 1 && segment.y === myHeadPosition.y) hazardMoveSafety.right = false;
        else if (segment.x === myHeadPosition.x - 1 && segment.y === myHeadPosition.y) hazardMoveSafety.left = false;
        else if (segment.x === myHeadPosition.x && segment.y === myHeadPosition.y + 1) hazardMoveSafety.up = false;
        else if (segment.x === myHeadPosition.x && segment.y === myHeadPosition.y - 1) hazardMoveSafety.down = false;
      }

      if (dx > 0 && hazardMoveSafety.right) targetDirection = 'right';
      else if (dx < 0 && hazardMoveSafety.left) targetDirection = 'left';
      else if (dy > 0 && hazardMoveSafety.up) targetDirection = 'up';
      else if (dy < 0 && hazardMoveSafety.down) targetDirection = 'down';

      if (targetDirection) {
        let foodIsSafe = true;
        for (const otherSnake of otherSnakes) {
          if (otherSnake.body.length >= mySnakeLength) {
            const otherSnakeHead = otherSnake.body[0];
            const myDistanceToFood = calculateDistance(myHeadPosition, closestFood);
            const otherSnakeDistanceToFood = calculateDistance(otherSnakeHead, closestFood);
            if (otherSnakeDistanceToFood <= myDistanceToFood) {
              foodIsSafe = false;
              break;
            }
          }
        }
        if (foodIsSafe) {
          const nextHead = { x: myHeadPosition.x, y: myHeadPosition.y };
          switch (targetDirection) {
            case 'up': nextHead.y++; break;
            case 'down': nextHead.y--; break;
            case 'left': nextHead.x--; break;
            case 'right': nextHead.x++; break;
          }
          const isHazard = hazards.some(h => h.x === nextHead.x && h.y === nextHead.y);
          let newHealth = mySnakeHealth - stormDamage;
          if (isHazard) newHealth -= 14;
          if (willEatFood(myHeadPosition, targetDirection, foodLocations)) newHealth = 100;
          if (newHealth > 28 && canSurvive(nextHead, newHealth, 0, gameState.you.body, otherSnakes, hazards, foodLocations, boardWidth, boardHeight, stormDamage)) {
            return { move: targetDirection };
          }
        }
      }
    }
  }

  const possibleMoves = getPossibleMoves(myHeadPosition, boardWidth, boardHeight, [{ body: gameState.you.body }].concat(otherSnakes), futureHazards);
  let bestMove = null;
  let maxSpaces = -1;
  let foodDistance = Infinity;
  const aggressiveFoodFactor = 2;
  const attackLengthDiff = 2;
  const attackSpaceThreshold = 3;

  for (const move of possibleMoves) {
    const nextHead = { x: myHeadPosition.x, y: myHeadPosition.y };
    switch (move.direction) {
      case 'up': nextHead.y++; break;
      case 'down': nextHead.y--; break;
      case 'left': nextHead.x--; break;
      case 'right': nextHead.x++; break;
    }

    const spaces = getAccessibleSpaces(nextHead, boardWidth, boardHeight, [{ body: gameState.you.body }].concat(otherSnakes), futureHazards);
    let isTrapping = false;
    let isRiskyFood = false;
    let isHeadToHead = false;
    let canAttack = false;
    let targetSnake = null;

    for (const otherSnake of otherSnakes) {
      if (otherSnake.body.length >= mySnakeLength) {
        const otherHeadX = otherSnake.body[0].x;
        const otherHeadY = otherSnake.body[0].y;
        if (
          (nextHead.x === otherHeadX + 1 && nextHead.y === otherHeadY) ||
          (nextHead.x === otherHeadX - 1 && nextHead.y === otherHeadY) ||
          (nextHead.x === otherHeadX && nextHead.y === otherHeadY + 1) ||
          (nextHead.x === otherHeadX && nextHead.y === otherHeadY - 1)
        ) {
          isHeadToHead = true;
          break;
        }
      }
      if (mySnakeLength > otherSnake.body.length + attackLengthDiff) {
        const otherHeadX = otherSnake.body[0].x;
        const otherHeadY = otherSnake.body[0].y;
        const attackDistance = calculateDistance(nextHead, { x: otherHeadX, y: otherHeadY });
        if (attackDistance <= 3) {
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
          if (otherSnake.body.length >= mySnakeLength) {
            const otherSnakeHead = otherSnake.body[0];
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
      if (otherSnake.body.length < mySnakeLength) {
        const otherSnakeHead = otherSnake.body[0];
        const otherSnakePossibleMoves = getPossibleMoves(otherSnakeHead, boardWidth, boardHeight, [{ body: gameState.you.body }].concat(otherSnakes), futureHazards);
        if (otherSnakePossibleMoves.length === 0) {
          isTrapping = true;
          break;
        }
      }
    }

    let currentFoodDistance = Infinity;
    if (foodLocations.length > 0) {
      const nearestFood = findNearestFood(nextHead, foodLocations);
      if (nearestFood) {
        currentFoodDistance = calculateDistance(nextHead, nearestFood);
      }
    }

    const isHazard = hazards.some(h => h.x === nextHead.x && h.y === nextHead.y);
    let newHealth = mySnakeHealth - stormDamage;
    if (isHazard) newHealth -= 14;
    if (willEatFood(myHeadPosition, move.direction, foodLocations)) newHealth = 100;

    if (canAttack && spaces >= attackSpaceThreshold && !isHazard && newHealth > 28 && canSurvive(nextHead, mySnakeHealth - stormDamage, 0, gameState.you.body, otherSnakes, hazards, foodLocations, boardWidth, boardHeight, stormDamage)) {
      if (targetSnake) {
        const targetHead = targetSnake.body[0];
        const possibleTargetMoves = getPossibleMoves(targetHead, boardWidth, boardHeight, [{ body: gameState.you.body }].concat(otherSnakes), futureHazards);
        if (possibleTargetMoves.length <= 2) {
          return { move: move.direction };
        }
      }
      return { move: move.direction };
    }

    if (spaces > maxSpaces && !isTrapping && (!isRiskyFood || mySnakeHealth > 50) && !isHeadToHead && !isHazard && newHealth > 28 && canSurvive(nextHead, newHealth, 0, gameState.you.body, otherSnakes, hazards, foodLocations, boardWidth, boardHeight, stormDamage)) {
      maxSpaces = spaces;
      bestMove = move.direction;
      foodDistance = currentFoodDistance;
    } else if (spaces === maxSpaces && !isTrapping && currentFoodDistance < foodDistance * aggressiveFoodFactor && !isHeadToHead && !isHazard && newHealth > 28 && canSurvive(nextHead, newHealth, 0, gameState.you.body, otherSnakes, hazards, foodLocations, boardWidth, boardHeight, stormDamage)) {
      bestMove = move.direction;
      foodDistance = currentFoodDistance;
    } else if (mySnakeHealth < 30 && currentFoodDistance < 3 && !isHeadToHead && newHealth > 28 && canSurvive(nextHead, newHealth, 0, gameState.you.body, otherSnakes, hazards, foodLocations, boardWidth, boardHeight, stormDamage)) {
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

  if (mySnake.health <= 0) return "loss";
  if (otherSnakes.length === 0) return "win";

  let otherSnakesAlive = 0;
  for (const snake of otherSnakes) {
    if (snake.health > 0) otherSnakesAlive++;
  }
  if (otherSnakesAlive === 0) return "win";

  if (mySnake.body.length === 0) return "loss";

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
markDown
    }
    return true;
  }

  const allSnakeBodies = [mySnake];
  for (const snake of otherSnakes) {
    allSnakeBodies.push(snake);
  }
  if (isTrapped(mySnake.body[0], gameState.board.width, gameState.board.height, allSnakeBodies, gameState.board.hazards || [])) {
    return "loss";
  }

  return "ongoing";
}
