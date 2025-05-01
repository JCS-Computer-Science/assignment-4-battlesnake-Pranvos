export default function move(gameState) {
  const moveSafety = {
    up: true,
    down: true,
    left: true,
    right: true
  };

  const mySnake = {
    head: gameState.you.body[0],
    neck: gameState.you.body[1],
    body: gameState.you.body,
    length: gameState.you.body.length,
    health: gameState.you.health
  };

  const board = {
    width: gameState.board.width,
    height: gameState.board.height,
    food: gameState.board.food,
    otherSnakes: gameState.board.snakes.filter(snake => snake.id !== gameState.you.id)
  };

  const currentTurn = gameState.turn;
  const gameOverThreshold = 40;

  function restrictMoves() {
    const nextPositions = {
      up: { x: mySnake.head.x, y: mySnake.head.y + 1 },
      down: { x: mySnake.head.x, y: mySnake.head.y - 1 },
      left: { x: mySnake.head.x - 1, y: mySnake.head.y },
      right: { x: mySnake.head.x + 1, y: mySnake.head.y }
    };

    const invalidPositions = [];
    if (mySnake.neck) {
      invalidPositions.push(mySnake.neck);
    }
    for (const segment of mySnake.body.slice(1)) {
      invalidPositions.push(segment);
    }
    for (const snake of board.otherSnakes) {
      for (const segment of snake.body) {
        invalidPositions.push(segment);
      }
    }

    for (const move of ["up", "down", "left", "right"]) {
      const nextPos = nextPositions[move];
      if (
        nextPos.x < 0 ||
        nextPos.x >= board.width ||
        nextPos.y < 0 ||
        nextPos.y >= board.height
      ) {
        moveSafety[move] = false;
        continue;
      }

      for (const pos of invalidPositions) {
        if (nextPos.x === pos.x && nextPos.y === pos.y) {
          moveSafety[move] = false;
          break;
        }
      }
    }
  }

  restrictMoves();

  function manhattanDistance(pointA, pointB) {
    return Math.abs(pointB.x - pointA.x) + Math.abs(pointB.y - pointA.y);
  }

  function countReachableSpaces(startPosition, allSnakeBodies, maxDepth) {
    const visited = new Set();
    const queue = [{ position: startPosition, depth: 0 }];
    let count = 0;

    while (queue.length > 0) {
      const { position, depth } = queue.shift();
      const { x, y } = position;
      const positionKey = `${x},${y}`;

      if (visited.has(positionKey) || depth > maxDepth) {
        continue;
      }

      if (x < 0 || x >= board.width || y < 0 || y >= board.height) {
        continue;
      }

      let isSnakeBody = false;
      for (const snakeBody of allSnakeBodies) {
        for (const segment of snakeBody) {
          if (x === segment.x && y === segment.y) {
            isSnakeBody = true;
            break;
          }
        }
        if (isSnakeBody) break;
      }
      if (isSnakeBody) continue;

      visited.add(positionKey);
      count++;

      const nextPositions = [
        { x: x, y: y + 1, direction: "up" },
        { x: x, y: y - 1, direction: "down" },
        { x: x - 1, y: y, direction: "left" },
        { x: x + 1, y: y, direction: "right" }
      ];

      for (const nextPos of nextPositions) {
        queue.push({ position: nextPos, depth: depth + 1 });
      }
    }
    return count;
  }

  function isSafeMove(move, isFoodSeeking = false) {
    const nextHeadPosition = {
      up: { x: mySnake.head.x, y: mySnake.head.y + 1 },
      down: { x: mySnake.head.x, y: mySnake.head.y - 1 },
      left: { x: mySnake.head.x - 1, y: mySnake.head.y },
      right: { x: mySnake.head.x + 1, y: mySnake.head.y }
    };

    if (!moveSafety[move]) {
      return { safe: false, spaces: 0 };
    }

    const allSnakeBodies = board.otherSnakes.map(snake => snake.body).concat([mySnake.body]);
    const reachableSpaces = countReachableSpaces(nextHeadPosition[move], allSnakeBodies, 50);

    let minSpaces;
    if (isFoodSeeking && (mySnake.length < 5 || mySnake.health < 70)) {
      minSpaces = Math.max(5, Math.floor(mySnake.length / 2));
    } else {
      minSpaces = mySnake.length;
    }

    return { safe: reachableSpaces >= minSpaces, spaces: reachableSpaces };
  }

  const isFoodSeeking = mySnake.length < 5 || mySnake.health < 70;
  const moveSafetyResults = {
    up: isSafeMove("up", isFoodSeeking),
    down: isSafeMove("down", isFoodSeeking),
    left: isSafeMove("left", isFoodSeeking),
    right: isSafeMove("right", isSafeMove(isFoodSeeking))
  };

  moveSafety.up = moveSafetyResults.up.safe && moveSafety.up;
  moveSafety.down = moveSafetyResults.down.safe && moveSafety.down;
  moveSafety.left = moveSafetyResults.left.safe && moveSafety.left;
  moveSafety.right = moveSafetyResults.right.safe && moveSafety.right;

  function findClosestFood() {
    if (!board.food || board.food.length === 0) {
      return null;
    }

    let closestFood = null;
    let minDistance = Infinity;

    for (const food of board.food) {
      const distance = manhattanDistance(mySnake.head, food);
      if (distance < minDistance) {
        minDistance = distance;
        closestFood = food;
      }
    }

    return closestFood;
  }

  function findAttackTarget() {
    let closestTarget = null;
    let minDistance = Infinity;
    let targetPriority = -1;

    for (const snake of board.otherSnakes) {
      if (snake.body.length < mySnake.length) {
        const enemyHead = snake.body[0];
        const distance = manhattanDistance(mySnake.head, enemyHead);

        let priority = 0;
        // Prioritize attacking snakes that are much smaller
        if (snake.body.length < mySnake.length / 2) {
          priority += 2;
        }
        // Prioritize attacking snakes that are close
        if (distance <= 2) {
          priority += 1;
        }
        if (priority > targetPriority) {
          minDistance = distance;
          closestTarget = enemyHead;
          targetPriority = priority;
        } else if (priority === targetPriority && distance < minDistance) {
          minDistance = distance;
          closestTarget = enemyHead;
          targetPriority = priority;
        }
      }
    }
    return closestTarget;
  }

  function moveTowards(target) {
    const boardCenter = { x: Math.floor(board.width / 2), y: Math.floor(board.height / 2) };
    const possibleMoves = [
      { direction: "up", valid: moveSafety.up && target.y > mySnake.head.y },
      { direction: "down", valid: moveSafety.down && target.y < mySnake.head.y },
      { direction: "left", valid: moveSafety.left && target.x < mySnake.head.x },
      { direction: "right", valid: moveSafety.right && target.x > mySnake.head.x }
    ];

    const validMoves = possibleMoves.filter(move => move.valid);

    if (validMoves.length === 0) {
      return null;
    }

    validMoves.sort((a, b) => {
      let aNextX, aNextY, bNextX, bNextY;
      if (a.direction === "left") {
        aNextX = mySnake.head.x - 1;
      } else if (a.direction === "right") {
        aNextX = mySnake.head.x + 1;
      } else {
        aNextX = mySnake.head.x;
      }
      if (a.direction === "up") {
        aNextY = mySnake.head.y + 1;
      } else if (a.direction === "down") {
        aNextY = mySnake.head.y - 1;
      } else {
        aNextY = mySnake.head.y;
      }
      if (b.direction === "left") {
        bNextX = mySnake.head.x - 1;
      } else if (b.direction === "right") {
        bNextX = mySnake.head.x + 1;
      } else {
        bNextX = mySnake.head.x;
      }
      if (b.direction === "up") {
        bNextY = mySnake.head.y + 1;
      } else if (b.direction === "down") {
        bNextY = mySnake.head.y - 1;
      } else {
        bNextY = mySnake.head.y;
      }

      const aDistToTarget = manhattanDistance({ x: aNextX, y: aNextY }, target);
      const bDistToTarget = manhattanDistance({ x: bNextX, y: bNextY }, target);

      const aDistToCenter = manhattanDistance({ x: aNextX, y: aNextY }, boardCenter);
      const bDistToCenter = manhattanDistance({ x: bNextX, y: bNextY }, boardCenter);

      if (aDistToTarget === bDistToTarget) {
        return aDistToCenter - bDistToCenter;
      }
      return aDistToTarget - bDistToTarget;
    });

    return validMoves[0].direction;
  }

  let gameVerdict = null;
  let gameOverReason = "";
  if (mySnake.health <= 0) {
    gameVerdict = "Loss";
  } else if (!Object.values(moveSafety).some(safe => safe)) {
    gameVerdict = "Loss";
  } else if (board.otherSnakes.length === 0 && mySnake.health > 0) {
    gameVerdict = "Win";
  }

  function isCenter(pos) {
    return pos.x > 1 && pos.x < board.width - 2 && pos.y > 1 && pos.y < board.height - 2;
  }

  function isCloseToOtherSnakeHead(pos) {
    for (const snake of board.otherSnakes) {
      if (manhattanDistance(pos, snake.body[0]) <= 1) {
        return true;
      }
    }
    return false;
  }

  let finalMove = "down";
  const attackThreshold = 6;

  function avoidHeadOnCollisions() {
    const myNextPositions = {
      up: { x: mySnake.head.x, y: mySnake.head.y + 1 },
      down: { x: mySnake.head.x, y: mySnake.head.y - 1 },
      left: { x: mySnake.head.x - 1, y: mySnake.head.y },
      right: { x: mySnake.head.x + 1, y: mySnake.head.y }
    };

    for (const snake of board.otherSnakes) {
      if (mySnake.length !== snake.body.length + 1) {
        const enemyHead = snake.body[0];
        const distance = manhattanDistance(mySnake.head, enemyHead);
        if (distance <= 2) {
          const enemyNextMoves = [
            { x: enemyHead.x, y: enemyHead.y + 1 },
            { x: enemyHead.x, y: enemyHead.y - 1 },
            { x: enemyHead.x - 1, y: enemyHead.y },
            { x: enemyHead.x + 1, y: enemyHead.y }
          ];

          for (const move of ["up", "down", "left", "right"]) {
            if (moveSafety[move]) {
              const myNextPos = myNextPositions[move];
              for (const enemyNextPos of enemyNextMoves) {
                if (myNextPos.x === enemyNextPos.x && myNextPos.y === enemyNextPos.y) {
                  moveSafety[move] = false;
                }
              }
            }
          }

          const safeMoves = Object.keys(moveSafety).filter(move => moveSafety[move]);
          if (safeMoves.length > 0) {
            let maxSpaces = -1;
            let bestMove = safeMoves[0];
            for (const move of safeMoves) {
              const spaces = moveSafetyResults[move].spaces;
              if (spaces > maxSpaces) {
                maxSpaces = spaces;
                bestMove = move;
              }
            }
            return bestMove;
          }
        }
      }
    }
    return null;
  }

  function floodFill(start, grid, width, height, visited, snakes) {
    const queue = [start];
    let count = 0;
    const mySnakeHead = snakes[0].body[0];
    const otherSnakeHeads = snakes.slice(1).map(s => s.body[0]);

    while (queue.length > 0) {
      const { x, y } = queue.shift();
      const key = `${x},${y}`;

      if (x < 0 || x >= width || y < 0 || y >= height || visited.has(key) || grid[y][x] === 1) {
        continue;
      }

      visited.add(key);
      count++;

      const nextPositions = [
        { x: x + 1, y: y },
        { x: x - 1, y: y },
        { x: x, y: y + 1 },
        { x: x, y: y - 1 }
      ];

      for (const nextPos of nextPositions) {
        queue.push(nextPos);
      }
    }
    return count;
  }

  function getGrid(snakes, width, height) {
    const grid = Array(height).fill(null).map(() => Array(width).fill(0));
    for (const snake of snakes) {
      for (const segment of snake.body) {
        grid[segment.y][segment.x] = 1;
      }
    }
    return grid;
  }

  const headOnAvoidMove = avoidHeadOnCollisions();
  if (headOnAvoidMove) {
    finalMove = headOnAvoidMove;
  } else {
    const crowdedThreshold = 2;
    let nearbySnakes = 0;
    for (const snake of board.otherSnakes) {
      if (manhattanDistance(mySnake.head, snake.body[0]) <= 2) {
        nearbySnakes++;
      }
    }
    if (nearbySnakes >= crowdedThreshold) {
      const closestFood = findClosestFood();
      if (closestFood) {
        const foodMove = moveTowards(closestFood);
        if (foodMove) {
          finalMove = foodMove;
        }
      }
    }
    else if (mySnake.length < attackThreshold || mySnake.health < 60) {
      const closestFood = findClosestFood();
      if (closestFood) {
        const foodMove = moveTowards(closestFood);
        if (foodMove) {
          const foodMoveSafety = isSafeMove(foodMove, isFoodSeeking);
          if (foodMoveSafety.safe) {
            finalMove = foodMove;
          }
        }
      }
    } else {
      const attackTarget = findAttackTarget();
      if (attackTarget) {
        const targetSnake = board.otherSnakes.find(s => s.body[0].x === attackTarget.x && s.body[0].y === attackTarget.y);
        if (targetSnake) {
          const healthDifference = mySnake.health - targetSnake.health;
          const lengthDifference = mySnake.length - targetSnake.body.length;

          if (healthDifference > 20 || lengthDifference > 3) {
            const attackMove = moveTowards(attackTarget);
            if (attackMove) {
              finalMove = attackMove;
            }
          }
        }
      }
    }
  }

  if (
    mySnake.head.x === 0 ||
    mySnake.head.x === board.width - 1 ||
    mySnake.head.y === 0 ||
    mySnake.head.y === board.height - 1
  ) {
    const possibleMoves = [];
    if (moveSafety.up) {
      possibleMoves.push("up");
    }
    if (moveSafety.down) {
      possibleMoves.push("down");
    }
    if (moveSafety.left) {
      possibleMoves.push("left");
    }
    if (moveSafety.right) {
      possibleMoves.push("right");
    }

    if (possibleMoves.length > 0) {
      let bestMove = possibleMoves[0];
      let maxSpaces = -1;
      const grid = getGrid(board.otherSnakes.concat([mySnake]), board.width, board.height);
      for (const move of possibleMoves) {
        const nextHeadPosition = {
          up: { x: mySnake.head.x, y: mySnake.head.y + 1 },
          down: { x: mySnake.head.x, y: mySnake.head.y - 1 },
          left: { x: mySnake.head.x - 1, y: mySnake.head.y },
          right: { x: mySnake.head.x + 1, y: mySnake.head.y }
        };
        const nextPos = nextHeadPosition[move];
        const visited = new Set();
        const spaces = floodFill(nextPos, grid, board.width, board.height, visited, board.otherSnakes.concat([mySnake]));
        if (spaces > maxSpaces) {
          maxSpaces = spaces;
          bestMove = move;
        }
      }
      finalMove = bestMove;
    }
  }

  if (!moveSafety[finalMove]) {
    const safeMoves = Object.keys(moveSafety).filter(move => moveSafety[move]);
    if (safeMoves.length > 0) {
      let maxSpaces = -1;
      let bestMove = safeMoves[0];
      const grid = getGrid(board.otherSnakes.concat([mySnake]), board.width, board.height);
      for (const move of safeMoves) {
        const nextHeadPosition = {
          up: { x: mySnake.head.x, y: mySnake.head.y + 1 },
          down: { x: mySnake.head.x, y: mySnake.head.y - 1 },
          left: { x: mySnake.head.x - 1, y: mySnake.head.y },
          right: { x: mySnake.head.x + 1, y: mySnake.head.y }
        };
        const nextPos = nextHeadPosition[move];
        const visited = new Set();
        const spaces = floodFill(nextPos, grid, board.width, board.height, visited, board.otherSnakes.concat([mySnake]));
        if (spaces > maxSpaces) {
          maxSpaces = spaces;
          bestMove = move;
        }
      }
      finalMove = bestMove;
    } else {
      return { move: "down" };
    }
  }

  console.log(`Turn: ${currentTurn}, Health: ${mySnake.health}, Move: ${finalMove}`);
  if (gameVerdict) {
    console.log(`Win or Loss: ${gameVerdict}, Final Length: ${mySnake.length}, Turn: ${currentTurn}`);
  }

  return { move: finalMove };
}

