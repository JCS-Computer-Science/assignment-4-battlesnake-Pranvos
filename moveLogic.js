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
      for (const pos of invalidPositions) {
        if (nextPos.x === pos.x && nextPos.y === pos.y) {
          moveSafety[move] = false;
        }
      }
      if (
        nextPos.x < 0 ||
        nextPos.x >= board.width ||
        nextPos.y < 0 ||
        nextPos.y >= board.height
      ) {
        moveSafety[move] = false;
      }
    }
  }

  restrictMoves();

  function manhattanDistance(pointA, pointB) {
    return Math.abs(pointB.x - pointA.x) + Math.abs(pointB.y - pointA.y);
  }

  function countReachableSpaces(position, visited, allSnakeBodies, depth, maxDepth) {
    if (
      position.x < 0 ||
      position.x >= board.width ||
      position.y < 0 ||
      position.y >= board.height ||
      depth > maxDepth
    ) {
      return 0;
    }

    const positionKey = `${position.x},${position.y}`;
    if (visited.includes(positionKey)) {
      return 0;
    }

    for (const snakeBody of allSnakeBodies) {
      for (const segment of snakeBody) {
        if (position.x === segment.x && position.y === segment.y) {
          return 0;
        }
      }
    }

    visited.push(positionKey);
    let count = 1;

    const directions = [
      { x: position.x, y: position.y + 1 },
      { x: position.x, y: position.y - 1 },
      { x: position.x - 1, y: position.y },
      { x: position.x + 1, y: position.y }
    ];

    for (const nextPos of directions) {
      count += countReachableSpaces(nextPos, visited, allSnakeBodies, depth + 1, maxDepth);
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

    for (const snake of board.otherSnakes) {
      for (const segment of snake.body) {
        if (
          nextHeadPosition[move].x === segment.x &&
          nextHeadPosition[move].y === segment.y
        ) {
          return { safe: false, spaces: 0 };
        }
      }
    }

    const allSnakeBodies = [mySnake.body];
    for (const snake of board.otherSnakes) {
      allSnakeBodies.push(snake.body);
    }

    const visited = [];
    const reachableSpaces = countReachableSpaces(nextHeadPosition[move], visited, allSnakeBodies, 0, 50);

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
    right: isSafeMove("right", isFoodSeeking)
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

    for (const snake of board.otherSnakes) {
      if (snake.body.length + 3 <= mySnake.length) {
        const enemyHead = snake.body[0];
        const distance = manhattanDistance(mySnake.head, enemyHead);
        if (distance < minDistance) {
          minDistance = distance;
          closestTarget = enemyHead;
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
  const attackThreshold = 7;

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

  const headOnAvoidMove = avoidHeadOnCollisions();
  if (headOnAvoidMove) {
    finalMove = headOnAvoidMove;
  } else {
    if (mySnake.length < attackThreshold || mySnake.health < 50) {
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
        const attackMove = moveTowards(attackTarget);
        if (attackMove) {
          finalMove = attackMove;
        }
      } else {
        const closestFood = findClosestFood();
        if (closestFood) {
          const foodMove = moveTowards(closestFood);
          if (foodMove) {
            finalMove = foodMove;
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
    for (const snake of board.otherSnakes) {
      if (snake.body.length >= mySnake.length) {
        const snakeHeadDistance = manhattanDistance(mySnake.head, snake.body[0]);
        if (snakeHeadDistance <= 2) {
          if (mySnake.head.x === 0 && moveSafety.right) {
            finalMove = "right";
          } else if (mySnake.head.x === board.width - 1 && moveSafety.left) {
            finalMove = "left";
          } else if (mySnake.head.y === 0 && moveSafety.up) {
            finalMove = "up";
          } else if (mySnake.head.y === board.height - 1 && moveSafety.down) {
            finalMove = "down";
          }
        }
      }
    }
  }

  for (const otherSnake of board.otherSnakes) {
    if (otherSnake.body.length >= mySnake.length) {
      const enemyHead = otherSnake.body[0];
      const enemyNextMoves = [
        { x: enemyHead.x, y: enemyHead.y + 1, direction: "up" },
        { x: enemyHead.x, y: enemyHead.y - 1, direction: "down" },
        { x: enemyHead.x - 1, y: enemyHead.y, direction: "left" },
        { x: enemyHead.x + 1, y: enemyHead.y, direction: "right" }
      ];

      for (const enemyNextMove of enemyNextMoves) {
        if (enemyNextMove.x === mySnake.head.x - 1 && enemyNextMove.y === mySnake.head.y && moveSafety.left) {
          finalMove = "left";
          break;
        }
        if (enemyNextMove.x === mySnake.head.x + 1 && enemyNextMove.y === mySnake.head.y && moveSafety.right) {
          finalMove = "right";
          break;
        }
        if (enemyNextMove.x === mySnake.head.x && enemyNextMove.y === mySnake.head.y - 1 && moveSafety.down) {
          finalMove = "down";
          break;
        }
        if (enemyNextMove.x === mySnake.head.x && enemyNextMove.y === mySnake.head.y + 1 && moveSafety.up) {
          finalMove = "up";
          break;
        }
      }
      if (finalMove) {
        break;
      }
    }
  }

  if (!moveSafety[finalMove]) {
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