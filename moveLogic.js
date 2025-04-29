export default function move(gameState) {
    let moveSafety = {
      up: true,
      down: true,
      left: true,
      right: true
    };
  

    const myHeadPosition = gameState.you.body[0];      
    const myNeckPosition = gameState.you.body[1];       
    const mySnakeLength = gameState.you.body.length;    
    const mySnakeHealth = gameState.you.health;      
    const boardWidth = gameState.board.width;          
    const boardHeight = gameState.board.height;      
    const foodLocations = gameState.board.food;        
    const otherSnakes = gameState.board.snakes.filter(function (snake) { 
      return snake.id !== gameState.you.id;           
    });
  
   
    if (myNeckPosition) {
      if (myNeckPosition.x < myHeadPosition.x) {
        moveSafety.left = false; // Neck is left of head, don't move left
      } else if (myNeckPosition.x > myHeadPosition.x) {
        moveSafety.right = false; // Neck is right of head, don't move right
      } else if (myNeckPosition.y < myHeadPosition.y) {
        moveSafety.down = false; // Neck is below head, don't move down
      } else if (myNeckPosition.y > myHeadPosition.y) {
        moveSafety.up = false; // Neck is above head, don't move up
      }
    }
  

    if (myHeadPosition.x === 0) {
      moveSafety.left = false; 
    }
    if (myHeadPosition.x === boardWidth - 1) {
      moveSafety.right = false; 
    }
    if (myHeadPosition.y === 0) {
      moveSafety.down = false;
    }
    if (myHeadPosition.y === boardHeight - 1) {
      moveSafety.up = false;
    }

    for (let i = 1; i < gameState.you.body.length; i++) {
      const bodySegment = gameState.you.body[i];
      if (bodySegment.x === myHeadPosition.x && bodySegment.y === myHeadPosition.y + 1) {
        moveSafety.up = false;
      }
      if (bodySegment.x === myHeadPosition.x && bodySegment.y === myHeadPosition.y - 1) {
        moveSafety.down = false;
      }
      if (bodySegment.x === myHeadPosition.x + 1 && bodySegment.y === myHeadPosition.y) {
        moveSafety.right = false;
      }
      if (bodySegment.x === myHeadPosition.x - 1 && bodySegment.y === myHeadPosition.y) {
        moveSafety.left = false;
      }
    }

    function manhattanDistance(a, b) {
      let distance = 0;
      const aKeys = Object.keys(a);
      const bKeys = Object.keys(b);
      const dimensions = Math.max(aKeys.length, bKeys.length);
      for (const key in a) {
        if (b.hasOwnProperty(key)) {
          distance += Math.abs(b[key] - a[key]);
        }
      }
      return distance;
    }
  

    function countReachableSpaces(position, visited, allSnakeBodies, depth, maxDepth) {
      if (position.x < 0 || position.x >= boardWidth || position.y < 0 || position.y >= boardHeight || depth > maxDepth) {
        return 0;
      }
  
      const positionKey = position.x + "," + position.y;
      if (visited.indexOf(positionKey) !== -1) {
        return 0;
      }
  

      for (let i = 0; i < allSnakeBodies.length; i++) {
        const snakeBody = allSnakeBodies[i];
        let bodyLength = snakeBody.length;

        if (i === 0 && depth > 0) {
          bodyLength = snakeBody.length - 1;
        }
        for (let j = 0; j < bodyLength; j++) {
          if (position.x === snakeBody[j].x && position.y === snakeBody[j].y) {
            return 0;
          }
        }
      }
  
  
      const futureMoves = [
        { x: position.x, y: position.y + 1 }, // up
        { x: position.x, y: position.y - 1 }, // down
        { x: position.x - 1, y: position.y }, // left
        { x: position.x + 1, y: position.y }  // right
      ];
  
      let hasSafeFutureMove = false;
      for (let m = 0; m < futureMoves.length; m++) {
        const move = futureMoves[m];
        if (move.x < 0 || move.x >= boardWidth || move.y < 0 || move.y >= boardHeight) {
          continue;
        }
        let isOccupied = false;
        for (let i = 0; i < allSnakeBodies.length; i++) {
          const snakeBody = allSnakeBodies[i];
          let bodyLength = snakeBody.length;
          if (i === 0 && depth > 0) {
            bodyLength = snakeBody.length - 1;
          }
          for (let j = 0; j < bodyLength; j++) {
            if (move.x === snakeBody[j].x && move.y === snakeBody[j].y) {
              isOccupied = true;
              break;
            }
          }
          if (isOccupied) break;
        }
        if (!isOccupied) {
          hasSafeFutureMove = true;
          break;
        }
      }
  
      if (depth === 0 && !hasSafeFutureMove) {
        return 0;
      }
  
      visited.push(positionKey); 
      let count = 1; 
  

      for (let k = 0; k < futureMoves.length; k++) {
        const nextMove = futureMoves[k];
        count += countReachableSpaces(nextMove, visited, allSnakeBodies, depth + 1, maxDepth);
      }
  
      return count;
    }
  
    const nextHeadPosition = {
      up: { x: myHeadPosition.x, y: myHeadPosition.y + 1 },
      down: { x: myHeadPosition.x, y: myHeadPosition.y - 1 },
      left: { x: myHeadPosition.x - 1, y: myHeadPosition.y },
      right: { x: myHeadPosition.x + 1, y: myHeadPosition.y }
    };
  

    const allSnakeBodies = [gameState.you.body];
    for (let i = 0; i < otherSnakes.length; i++) {
      allSnakeBodies.push(otherSnakes[i].body);
    }
  
   
    let moveSpaces = {
      up: 0,
      down: 0,
      left: 0,
      right: 0
    };
    for (const direction in moveSafety) {
      if (moveSafety.hasOwnProperty(direction)) {
        const nextPos = nextHeadPosition[direction];
        if (!moveSafety[direction]) {
          moveSpaces[direction] = 0;
          continue;
        }
        const visited = [];
        const maxDepth = Math.min(mySnakeLength + 2, boardWidth * boardHeight);
        const reachableSpaces = countReachableSpaces(nextPos, visited, allSnakeBodies, 0, maxDepth);
        const minSpaces = mySnakeLength + 1;
        moveSafety[direction] = reachableSpaces >= minSpaces;
        moveSpaces[direction] = reachableSpaces;
      }
    }
  

    function isSafeMove(move, isFoodSeeking) {
      let minSpaces;
      if (isFoodSeeking && (mySnakeLength < 5 || mySnakeHealth < 50)) {
        minSpaces = Math.max(1, mySnakeLength - 1);
      }
      else {
        minSpaces = mySnakeLength + 1;
      }
      return moveSafety[move];
    }
  

    moveSafety.up = moveSafety.up && isSafeMove("up", mySnakeLength < 3 || mySnakeHealth < 60);
    moveSafety.down = moveSafety.down && isSafeMove("down", mySnakeLength < 3 || mySnakeHealth < 60);
    moveSafety.left = moveSafety.left && isSafeMove("left", mySnakeLength < 3 || mySnakeHealth < 60);
    moveSafety.right = moveSafety.right && isSafeMove("right", mySnakeLength < 3 || mySnakeHealth < 60);
  

    function findClosestFood() {
      if (!foodLocations || foodLocations.length === 0) {
        return null;
      }
  
      let closestFood = null;
      let minDistance = Infinity;
  
      for (let i = 0; i < foodLocations.length; i++) {
        const distance = manhattanDistance(myHeadPosition, foodLocations[i]);
        if (distance < minDistance) {
          minDistance = distance;
          closestFood = foodLocations[i];
        }
      }
      return closestFood;
    }
  
  
    function findSmallestNearbySnake() {
      let smallestSnake = null;
      let minLength = Infinity;
      const proximity = 5;
  
      for (let i = 0; i < otherSnakes.length; i++) {
        const snake = otherSnakes[i];
        const distance = manhattanDistance(myHeadPosition, snake.body[0]);
        if (distance <= proximity) {
          if (snake.body.length < minLength) {
            minLength = snake.body.length;
            smallestSnake = snake;
          }
        }
      }
      return smallestSnake;
    }
  
    
    function findAttackTarget() {
      let closestTarget = null;
      let minDistance = Infinity;
  
      for (let i = 0; i < otherSnakes.length; i++) {
        const snake = otherSnakes[i];
        const distanceToOtherHead = manhattanDistance(myHeadPosition, snake.body[0]);
        if (snake.body.length + 1 < mySnakeLength) {
          const enemyHead = snake.body[0];
          if (minDistance === Infinity || distanceToOtherHead < minDistance) {
            minDistance = distanceToOtherHead;
            closestTarget = enemyHead;
          }
        }
      }
      return closestTarget;
    }
  

    function moveTowards(target) {
      const possibleMoves = [];
  
      if (moveSafety.up && target.y > myHeadPosition.y) {
        possibleMoves.push({ direction: "up", valid: true, spaces: moveSpaces.up });
      }
      if (moveSafety.down && target.y < myHeadPosition.y) {
        possibleMoves.push({ direction: "down", valid: true, spaces: moveSpaces.down });
      }
      if (moveSafety.left && target.x < myHeadPosition.x) {
        possibleMoves.push({ direction: "left", valid: true, spaces: moveSpaces.left });
      }
      if (moveSafety.right && target.x > myHeadPosition.x) {
        possibleMoves.push({ direction: "right", valid: true, spaces: moveSpaces.right });
      }
  
  
      const validMoves = [];
      for (let i = 0; i < possibleMoves.length; i++) {
        if (possibleMoves[i].valid) {
          validMoves.push(possibleMoves[i])
        }
      }
  
      if (validMoves.length === 0) {
        return null;
      }
  
      // Prioritize moves with more reachable spaces, then the closest to the target
      validMoves.sort(function (a, b) {
        if (b.spaces !== a.spaces) {
          return b.spaces - a.spaces;
        }
        const aNextX = a.direction === "left" ? myHeadPosition.x - 1 : a.direction === "right" ? myHeadPosition.x + 1 : myHeadPosition.x;
        const aNextY = a.direction === "up" ? myHeadPosition.y + 1 : a.direction === "down" ? myHeadPosition.y - 1 : myHeadPosition.y;
        const bNextX = b.direction === "left" ? myHeadPosition.x - 1 : b.direction === "right" ? myHeadPosition.x + 1 : myHeadPosition.x;
        const bNextY = b.direction === "up" ? myHeadPosition.y + 1 : b.direction === "down" ? myHeadPosition.y - 1 : myHeadPosition.y;
        const aDist = manhattanDistance({ x: aNextX, y: aNextY }, target);
        const bDist = manhattanDistance({ x: bNextX, y: bNextY }, target);
        return aDist - bDist;
      });
  
      return validMoves[0].direction;
    }
  
  
    function findTrapMove(targetSnake) {
      const enemyHead = targetSnake.body[0];
      const possibleTrapMoves = [];
      const potentialMoves = [
        { direction: "up", position: { x: myHeadPosition.x, y: myHeadPosition.y + 1 } },
        { direction: "down", position: { x: myHeadPosition.x, y: myHeadPosition.y - 1 } },
        { direction: "left", position: { x: myHeadPosition.x - 1, y: myHeadPosition.y } },
        { direction: "right", position: { x: myHeadPosition.x + 1, y: myHeadPosition.y } }
      ];
  
      for (let i = 0; i < potentialMoves.length; i++) {
        const move = potentialMoves[i];
        if (moveSafety[move.direction]) {
          const nextHead = move.position;
          let canEnemyEscape = false;
          const enemyFutureMoves = [
            { x: enemyHead.x, y: enemyHead.y + 1 },
            { x: enemyHead.x, y: enemyHead.y - 1 },
            { x: enemyHead.x - 1, y: enemyHead.y },
            { x: enemyHead.x + 1, y: enemyHead.y }
          ];
  
          for (let j = 0; j < enemyFutureMoves.length; j++) {
            const enemyMove = enemyFutureMoves[j];
            let mySnakeCollision = false;
            for (let k = 0; k < gameState.you.body.length; k++) {
              if (gameState.you.body[k].x === enemyMove.x && gameState.you.body[k].y === enemyMove.y) {
                mySnakeCollision = true;
                break;
              }
            }
            let otherSnakeCollision = false;
            for (let k = 0; k < otherSnakes.length; k++) {
              const otherSnake = otherSnakes[k];
              if (otherSnake.id !== targetSnake.id) {
                for (let l = 0; l < otherSnake.body.length; l++) {
                  if (otherSnake.body[l].x === enemyMove.x && otherSnake.body[l].y === enemyMove.y) {
                    otherSnakeCollision = true;
                    break;
                  }
                }
              }
              if (otherSnakeCollision) break;
            }
            if (
              enemyMove.x >= 0 && enemyMove.x < boardWidth &&
              enemyMove.y >= 0 && enemyMove.y < boardHeight &&
              !mySnakeCollision &&
              !otherSnakeCollision &&
              !(nextHead.x === enemyMove.x && nextHead.y === enemyMove.y)
            ) {
              canEnemyEscape = true;
              break;
            }
          }
  
          if (!canEnemyEscape) {
            possibleTrapMoves.push({ direction: move.direction, spaces: moveSpaces[move.direction] });
          }
        }
      }
  
      if (possibleTrapMoves.length > 0) {
        possibleTrapMoves.sort(function (a, b) { return b.spaces - a.spaces; });
        return possibleTrapMoves[0].direction;
      }
  
      return null;
    }
  

    let finalMove = null;
    const smallestSnake = findSmallestNearbySnake();
    const largerSnakes = otherSnakes.filter(snake => snake.body.length >= mySnakeLength);
  
  
    if (mySnakeHealth >= 60 && mySnakeLength > 5 && smallestSnake) {
      const trapMove = findTrapMove(smallestSnake);
      if (trapMove && moveSafety[trapMove]) {
        finalMove = trapMove;
      } else {
        const attackMove = moveTowards(smallestSnake.body[0]);
        if (attackMove && moveSafety[attackMove]) {
          finalMove = attackMove;
        }
      }
    }
  
    // Default behavior
    if (!finalMove) {
      if (mySnakeLength < 5 || mySnakeHealth < 55) {
        const closestFood = findClosestFood();
        if (closestFood) {
          let anyOtherSnakesNearby = false;
          for (let i = 0; i < otherSnakes.length; i++) {
            const snake = otherSnakes[i];
            for (let j = 0; j < snake.body.length; j++) {
              if (manhattanDistance(myHeadPosition, snake.body[j]) <= 2) {
                anyOtherSnakesNearby = true;
                break;
              }
            }
            if (anyOtherSnakesNearby) break;
          }
          const isCenter = (pos) => pos.x > 0 && pos.x < boardWidth - 1 && pos.y > 0 && pos.y < boardHeight - 1;
          const isCloseToOtherSnakeHead = (pos) => {
            for (let i = 0; i < otherSnakes.length; i++) {
              const snake = otherSnakes[i];
              if (manhattanDistance(pos, snake.body[0]) <= 1) {
                return true;
              }
            }
            return false;
          };
  
          if (!isCenter(closestFood) || (isCloseToOtherSnakeHead(closestFood) && anyOtherSnakesNearby)) {
            const foodMove = moveTowards(closestFood);
            if (foodMove && moveSafety[foodMove]) finalMove = foodMove;
          } else {
            const nonCenterFood = foodLocations.filter(food => !isCenter(food));
            nonCenterFood.sort((a, b) => manhattanDistance(myHeadPosition, a) - manhattanDistance(myHeadPosition, b));
            if (nonCenterFood.length > 0) {
              const foodMove = moveTowards(nonCenterFood[0]);
              if (foodMove && moveSafety[foodMove]) finalMove = foodMove;
            } else {
              const foodMove = moveTowards(closestFood);
              if (foodMove && moveSafety[foodMove]) finalMove = foodMove;
            }
          }
        }
      } else {
        const attackTarget = findAttackTarget();
        if (attackTarget) {
          let targetSnake = null;
          for (let i = 0; i < otherSnakes.length; i++) {
            if (otherSnakes[i].body[0].x === attackTarget.x && otherSnakes[i].body[0].y === attackTarget.y) {
              targetSnake = otherSnakes[i];
              break;
            }
          }
          if (targetSnake) {
            const trapMove = findTrapMove(targetSnake);
            if (trapMove && moveSafety[trapMove]) {
              finalMove = trapMove;
            } else {
              const attackMove = moveTowards(attackTarget);
              if (attackMove && moveSafety[attackMove]) finalMove = attackMove;
            }
          }
        } else {
          const closestFood = findClosestFood();
          if (closestFood) {
            const foodMove = moveTowards(closestFood);
            if (foodMove && moveSafety[foodMove]) finalMove = foodMove;
          } else {
            const center = { x: Math.floor(boardWidth / 2), y: Math.floor(boardHeight / 2) };
            const centerMove = moveTowards(center);
            if (centerMove && moveSafety[centerMove]) {
              finalMove = centerMove;
            }
          }
        }
      }
    }
  

    if (!finalMove || !moveSafety[finalMove]) {
      const safeMoves = [];
      for (const direction in moveSafety) {
        if (moveSafety.hasOwnProperty(direction) && moveSafety[direction]) {
          safeMoves.push({ direction: direction, spaces: moveSpaces[direction] });
        }
      }
      if (safeMoves.length > 0) {
        safeMoves.sort(function (a, b) { return b.spaces - a.spaces; });
        finalMove = safeMoves[0].direction;
      } else {
        const fallbackMoves = ["up", "right", "down", "left"];
        for (let i = 0; i < fallbackMoves.length; i++) {
          const move = fallbackMoves[i];
          const pos = nextHeadPosition[move];
          if (pos.x >= 0 && pos.x < boardWidth && pos.y >= 0 && pos.y < boardHeight) {
            finalMove = move;
            break;
          }
        }
      }
    }
  
    // Avoid moving into a space where a larger snake is
    if (finalMove) {
      const nextPos = nextHeadPosition[finalMove];
      for (let i = 0; i < largerSnakes.length; i++) {
        const largeSnake = largerSnakes[i];
        const distanceToLargeSnake = manhattanDistance(nextPos, largeSnake.body[0]);
        if (distanceToLargeSnake <= 2) {
          moveSafety[finalMove] = false;
          finalMove = null;
          break;
        }
      }
    }
  
    //  last resort
    if (!finalMove || !moveSafety[finalMove]) {
      const safeMoves = [];
      for (const direction in moveSafety) {
        if (moveSafety.hasOwnProperty(direction) && moveSafety[direction]) {
          safeMoves.push({ direction: direction, spaces: moveSpaces[direction] });
        }
      }
      if (safeMoves.length > 0) {
        safeMoves.sort(function (a, b) { return b.spaces - a.spaces; });
        finalMove = safeMoves[0].direction;
      } else {
        const fallbackMoves = ["up", "right", "down", "left"];
        for (let i = 0; i < fallbackMoves.length; i++) {
          const move = fallbackMoves[i];
          const pos = nextHeadPosition[move];
          if (pos.x >= 0 && pos.x < boardWidth && pos.y >= 0 && pos.y < boardHeight) {
            finalMove = move;
            break;
          }
        }
      }
    }
  
    return { move: finalMove }; 
  }
  