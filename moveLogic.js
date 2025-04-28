export default function move(gameState) {
    let moveSafety = {
        up: true,
        down: true,
        left: true,
        right: true
    };
    let moveSpaces = {
        up: 0,
        down: 0,
        left: 0,
        right: 0
    };

    const myHeadPosition = gameState.you.body[0];
    const myNeckPosition = gameState.you.body[1];
    const mySnakeBody = gameState.you.body;
    const mySnakeLength = gameState.you.body.length;
    const mySnakeHealth = gameState.you.health;
    const currentTurn = gameState.turn;

    const boardWidth = gameState.board.width;
    const boardHeight = gameState.board.height;
    const foodLocations = gameState.board.food;
    const otherSnakes = gameState.board.snakes.filter(function(snake) {
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

    // Step 1 - Prevent your Battlesnake from moving out of bounds
    // gameState.board contains an object representing the game board including its width and height
    // https://docs.battlesnake.com/api/objects/board
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

    // TODO: Step 2 - Prevent your Battlesnake from colliding with itself
    // gameState.you contains an object representing your snake, including its coordinates
    // https://docs.battlesnake.com/api/objects/battlesnake
    for (let i = 1; i < mySnakeBody.length; i++) {
        const bodySegment = mySnakeBody[i];
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

    // TODO: Step 3 - Prevent your Battlesnake from colliding with other Battlesnakes
    // gameState.board.snakes contains an array of enemy snake objects, which includes their coordinates
    // https://docs.battlesnake.com/api/objects/battlesnake
    for (let i = 0; i < otherSnakes.length; i++) {
        const otherSnake = otherSnakes[i];
        const otherSnakeBody = otherSnake.body;
        for (let j = 0; j < otherSnakeBody.length; j++) {
            const bodySegment = otherSnakeBody[j];
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
    }

    const manhattanDistance = (a, b) => {
        let distance = 0;
        const dimensions = Math.max(Object.keys(a).length, Object.keys(b).length);
        for (const key in a) {
            if (b.hasOwnProperty(key)) {
                distance += Math.abs(b[key] - a[key]);
            }
        }
        return distance;
    };

    function countReachableSpaces(position, visited, allSnakeBodies, depth, maxDepth, myBody) {
        if (position.x < 0 || position.x >= boardWidth || position.y < 0 || position.y >= boardHeight || depth > maxDepth) {
            return 0;
        }

        const positionKey = position.x + "," + position.y;
        if (visited.includes(positionKey)) {
            return 0;
        }

        for (let i = 0; i < allSnakeBodies.length; i++) {
            const snakeBody = allSnakeBodies[i];
            for (let j = 0; j < (i === 0 && depth > 0 ? snakeBody.length - 1 : snakeBody.length); j++) {
                if (position.x === snakeBody[j].x && position.y === snakeBody[j].y) {
                    return 0;
                }
            }
        }

        const futureMoves = [
            { x: position.x, y: position.y + 1 }, // up
            { x: position.x, y: position.y - 1 }, // down
            { x: position.x - 1, y: position.y }, // left
            { x: position.x + 1, y: position.y }   // right
        ];

        let hasSafeFutureMove = false;
        for (const move of futureMoves) {
            if (move.x < 0 || move.x >= boardWidth || move.y < 0 || move.y >= boardHeight) {
                continue;
            }
            let isOccupied = false;
            for (let i = 0; i < allSnakeBodies.length; i++) {
                const snakeBody = allSnakeBodies[i];
                for (let j = 0; j < (i === 0 && depth > 0 ? snakeBody.length - 1 : snakeBody.length); j++) {
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

        for (const nextMove of futureMoves) {
            count += countReachableSpaces(nextMove, visited, allSnakeBodies, depth + 1, maxDepth, myBody);
        }

        return count;
    }

    const nextHeadPosition = {
        up: { x: myHeadPosition.x, y: myHeadPosition.y + 1 },
        down: { x: myHeadPosition.x, y: myHeadPosition.y - 1 },
        left: { x: myHeadPosition.x - 1, y: myHeadPosition.y },
        right: { x: myHeadPosition.x + 1, y: myHeadPosition.y }
    };

    const allSnakeBodies = [mySnakeBody];
    for (let i = 0; i < otherSnakes.length; i++) {
        allSnakeBodies.push(otherSnakes[i].body);
    }

    // moveSafety using flood fill
    for (const direction of Object.keys(moveSafety)) {
        const nextPos = nextHeadPosition[direction];
        if (!moveSafety[direction]) {
            moveSpaces[direction] = 0;
            continue;
        }

        const visited = [];
        const maxDepth = Math.min(mySnakeLength + 2, boardWidth * boardHeight);
        const reachableSpaces = countReachableSpaces(nextPos, visited, allSnakeBodies, 0, maxDepth, mySnakeBody);
        const minSpaces = mySnakeLength + 1;
        moveSafety[direction] = reachableSpaces >= minSpaces;
        moveSpaces[direction] = reachableSpaces;
    }

    function isSafeMove(move, isFoodSeeking = false) {
        const minSpaces = isFoodSeeking && (mySnakeLength < 5 || mySnakeHealth < 50) ? Math.max(1, mySnakeLength - 1) : mySnakeLength + 1;
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

    function findAttackTarget() {
        let closestTarget = null;
        let minDistance = Infinity;

        for (let snake of otherSnakes) {
            const distanceToOtherHead = manhattanDistance(myHeadPosition, snake.body[0]);
            if (snake.body.length + 1 < mySnakeLength && !isOtherSnakeClose(distanceToOtherHead, snake.body.length)) {
                const enemyHead = snake.body[0];
                if (minDistance === Infinity || distanceToOtherHead < minDistance) {
                    minDistance = distanceToOtherHead;
                    closestTarget = enemyHead;
                }
            }
        }
        return closestTarget;
    }

    function isOtherSnakeClose(distanceToOtherHead, otherSnakeLength) {
        for (let otherSnake of otherSnakes) {
            const distance = manhattanDistance(myHeadPosition, otherSnake.body[0]);
            if (distance < distanceToOtherHead && otherSnake.body.length >= otherSnakeLength) {
                return true;
            }
        }
        return false;
    }

    function moveTowards(target) {
        const possibleMoves = [
            { direction: "up", valid: moveSafety.up && target.y > myHeadPosition.y, spaces: moveSpaces.up },
            { direction: "down", valid: moveSafety.down && target.y < myHeadPosition.y, spaces: moveSpaces.down },
            { direction: "left", valid: moveSafety.left && target.x < myHeadPosition.x, spaces: moveSpaces.left },
            { direction: "right", valid: moveSafety.right && target.x > myHeadPosition.x, spaces: moveSpaces.right }
        ];

        const validMoves = possibleMoves.filter(function(move) {
            return move.valid;
        });

        if (validMoves.length === 0) {
            return null;
        }

        validMoves.sort(function(a, b) {
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

        for (const move of potentialMoves) {
            if (moveSafety[move.direction]) {
                const nextHead = move.position;
                let canEnemyEscape = false;
                const enemyFutureMoves = [
                    { x: enemyHead.x, y: enemyHead.y + 1 },
                    { x: enemyHead.x, y: enemyHead.y - 1 },
                    { x: enemyHead.x - 1, y: enemyHead.y },
                    { x: enemyHead.x + 1, y: enemyHead.y }
                ];

                for (const enemyMove of enemyFutureMoves) {
                    if (
                        enemyMove.x >= 0 && enemyMove.x < boardWidth &&
                        enemyMove.y >= 0 && enemyMove.y < boardHeight &&
                        !mySnakeBody.some(segment => segment.x === enemyMove.x && segment.y === enemyMove.y) &&
                        !otherSnakes.some(other => other.id !== targetSnake.id && other.body.some(segment => segment.x === enemyMove.x && segment.y === enemyMove.y)) &&
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
            possibleTrapMoves.sort((a, b) => b.spaces - a.spaces);
            return possibleTrapMoves[0].direction;
        }

        return null;
    }

    let gameVerdict = null;
    let gameOverReason = "";
    if (mySnakeHealth <= 0) {
        gameVerdict = "Loss";
    } else if (!Object.values(moveSafety).some(function(safe) {
        return safe;
    })) {
        gameVerdict = "Loss";
    } else if (otherSnakes.length === 0 && mySnakeHealth > 0) {
        gameVerdict = "Win";
    }

    const isCenter = (pos) => pos.x > 0 && pos.x < boardWidth - 1 && pos.y > 0 && pos.y < boardHeight - 1;
    const isCloseToOtherSnakeHead = (pos) => {
        for (const snake of otherSnakes) {
            if (manhattanDistance(pos, snake.body[0]) <= 1) {
                return true;
            }
        }
        return false;
    };

    let finalMove = null;

    // TODO: Step 4 - Move towards food instead of random, to regain health and survive longer
    // gameState.board.food contains an array of food coordinates https://docs.battlesnake.com/api/objects/board
    if (mySnakeLength < 5 || mySnakeHealth < 55) {
        const closestFood = findClosestFood();
        if (closestFood) {
            const anyOtherSnakesNearby = otherSnakes.some(snake =>
                snake.body.some(segment => manhattanDistance(myHeadPosition, segment) <= 2)
            );

            if (!isCenter(closestFood) || (isCloseToOtherSnakeHead(closestFood) && anyOtherSnakesNearby)) {
                const foodMove = moveTowards(closestFood);
                if (foodMove && moveSafety[foodMove]) finalMove = foodMove;
            } else {
                const nonCenterFood = foodLocations.filter(food => !isCenter(food))
                    .sort((a, b) => manhattanDistance(myHeadPosition, a) - manhattanDistance(myHeadPosition, b))[0];
                if (nonCenterFood) {
                    const foodMove = moveTowards(nonCenterFood);
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
            const targetSnake = otherSnakes.find(snake => snake.body[0].x === attackTarget.x && snake.body[0].y === attackTarget.y);
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

    if (!finalMove || !moveSafety[finalMove]) {
        const safeMoves = Object.keys(moveSafety).filter(function(i) {
            return moveSafety[i];
        }).map(direction => ({ direction, spaces: moveSpaces[direction] }));
        if (safeMoves.length > 0) {
            safeMoves.sort((a, b) => b.spaces - a.spaces);
             finalMove = safeMoves[0].direction;
        } else {
            const fallbackMoves = ["up", "right", "down", "left"];
            finalMove = fallbackMoves.find(move => {
                const pos = nextHeadPosition[move];
                return pos.x >= 0 && pos.x < boardWidth && pos.y >= 0 && pos.y < boardHeight;
            })
        }
    }
    const headToHeadMoves = [];
    for (const direction of Object.keys(nextHeadPosition)) {
        const nextPos = nextHeadPosition[direction];
        for (const otherSnake of otherSnakes) {
            if (otherSnake.body[0].x === nextPos.x && otherSnake.body[0].y === nextPos.y) {
                headToHeadMoves.push(direction);
                break;
            }
        }
    }

    if (headToHeadMoves.includes(finalMove) && otherSnakes.length > 0) {
        moveSafety[finalMove] = false;
        finalMove = null;
    }

    if (!finalMove || !moveSafety[finalMove]) {
        const safeMoves = Object.keys(moveSafety).filter(function(i) {
            return moveSafety[i];
        }).map(direction => ({ direction, spaces: moveSpaces[direction] }));
        if (safeMoves.length > 0) {
            safeMoves.sort((a, b) => b.spaces - a.spaces);
            finalMove = safeMoves[0].direction;
        } else {
             const fallbackMoves = ["up", "right", "down", "left"];
            finalMove = fallbackMoves.find(move => {
                const pos = nextHeadPosition[move];
                return pos.x >= 0 && pos.x < boardWidth && pos.y >= 0 && pos.y < boardHeight;
            })
        }
    }

    console.log("Turn:", currentTurn, "Health:", mySnakeHealth, "Move:", finalMove);

    if (gameVerdict) {
        console.log(`Win or Loss: ${gameVerdict}, Final Length: ${mySnakeLength}, Turn: ${currentTurn}`);
    }

    return { move: finalMove };
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

    for (const move of potentialMoves) {
        if (moveSafety[move.direction]) {
            const nextHead = move.position;
            let canEnemyEscape = false;
            const enemyFutureMoves = [
                { x: enemyHead.x, y: enemyHead.y + 1 },
                { x: enemyHead.x, y: enemyHead.y - 1 },
                { x: enemyHead.x - 1, y: enemyHead.y },
                { x: enemyHead.x + 1, y: enemyHead.y }
            ];

            for (const enemyMove of enemyFutureMoves) {
                if (
                    enemyMove.x >= 0 && enemyMove.x < boardWidth &&
                    enemyMove.y >= 0 && enemyMove.y < boardHeight &&
                    !mySnakeBody.some(segment => segment.x === enemyMove.x && segment.y === enemyMove.y) &&
                    !otherSnakes.some(other => other.id !== targetSnake.id && other.body.some(segment => segment.x === enemyMove.x && segment.y === enemyMove.y)) &&
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
        possibleTrapMoves.sort((a, b) => b.spaces - a.spaces);
        return possibleTrapMoves[0].direction;
    }

    return null;
}
