export default function move(gameState) {
    let moveSafety = {
        up: true,
        down: true,
        left: true,
        right: true
    };

    const myHeadPosition = gameState.you.body[0];
    const myNeckPosition = gameState.you.body[1];
    const mySnakeBody = gameState.you.body;
    const mySnakeLength = mySnakeBody.length;
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
            moveSafety.left = false;
        } else if (myNeckPosition.x > myHeadPosition.x) {
            moveSafety.right = false;
        } else if (myNeckPosition.y < myHeadPosition.y) {
            moveSafety.down = false;
        } else if (myNeckPosition.y > myHeadPosition.y) {
            moveSafety.up = false;
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

    for (let i = 0; i < mySnakeBody.length; i++) {
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

    function countReachableSpaces(position, visited, allSnakeBodies, depth, maxDepth) {
        if (position.x < 0 || position.x >= boardWidth || position.y < 0 || position.y >= boardHeight || depth > maxDepth) {
            return 0;
        }

        const positionKey = position.x + "," + position.y;
        if (visited.includes(positionKey)) {
            return 0;
        }

        for (let i = 0; i < allSnakeBodies.length; i++) {
            for (let j = 0; j < allSnakeBodies[i].length; j++) {
                if (position.x === allSnakeBodies[i][j].x && position.y === allSnakeBodies[i][j].y) {
                    return 0;
                }
            }
        }

        visited.push(positionKey);
        let count = 1;

        count = count + countReachableSpaces({ x: position.x, y: position.y + 1 }, visited, allSnakeBodies, depth + 1, maxDepth);
        count = count + countReachableSpaces({ x: position.x, y: position.y - 1 }, visited, allSnakeBodies, depth + 1, maxDepth);
        count = count + countReachableSpaces({ x: position.x - 1, y: position.y }, visited, allSnakeBodies, depth + 1, maxDepth);
        count = count + countReachableSpaces({ x: position.x + 1, y: position.y }, visited, allSnakeBodies, depth + 1, maxDepth);

        return count;
    }


    function isSafeMove(move, isFoodSeeking = false) {
        const nextHeadPosition = {
            up: { x: myHeadPosition.x, y: myHeadPosition.y + 1 },
            down: { x: myHeadPosition.x, y: myHeadPosition.y - 1 },
            left: { x: myHeadPosition.x - 1, y: myHeadPosition.y },
            right: { x: myHeadPosition.x + 1, y: myHeadPosition.y }
        };

        if (!moveSafety[move]) {
            return false;
        }

        const allSnakeBodies = [mySnakeBody];
        for (let i = 0; i < otherSnakes.length; i++) {
            allSnakeBodies.push(otherSnakes[i].body);
        }

        const visited = [];
        const reachableSpaces = countReachableSpaces(nextHeadPosition[move], visited, allSnakeBodies, 0, 100);

        const minSpaces = isFoodSeeking && (mySnakeLength < 5 || mySnakeHealth < 50) ? Math.max(1, mySnakeLength - 2) : mySnakeLength;
        return reachableSpaces >= minSpaces;
    }

    moveSafety.up = moveSafety.up && isSafeMove("up", mySnakeLength < 5 || mySnakeHealth < 50);
    moveSafety.down = moveSafety.down && isSafeMove("down", mySnakeLength < 5 || mySnakeHealth < 50);
    moveSafety.left = moveSafety.left && isSafeMove("left", mySnakeLength < 5 || mySnakeHealth < 50);
    moveSafety.right = moveSafety.right && isSafeMove("right", mySnakeLength < 5 || mySnakeHealth < 50);

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
            if (snake.body.length + 7 <= mySnakeLength) {
                const enemyHead = snake.body[0];
                const distance = manhattanDistance(myHeadPosition, enemyHead);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestTarget = enemyHead;
                }
            }
        }

        return closestTarget;
    }

    function moveTowards(target) {
        const possibleMoves = [
            { direction: "up", valid: moveSafety.up && target.y > myHeadPosition.y },
            { direction: "down", valid: moveSafety.down && target.y < myHeadPosition.y },
            { direction: "left", valid: moveSafety.left && target.x < myHeadPosition.x },
            { direction: "right", valid: moveSafety.right && target.x > myHeadPosition.x }
        ];

        const validMoves = possibleMoves.filter(function(move) {
            return move.valid;
        });

        if (validMoves.length === 0) {
            return null;
        }

        validMoves.sort(function(a, b) {
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


    let gameVerdict = null;
    if (mySnakeHealth <= 0) {
        gameVerdict = "Loss";
    } else if (!Object.values(moveSafety).some(function(safe) {
        return safe;
    })) {
        gameVerdict = "Loss";
    } else if (otherSnakes.length === 0 && mySnakeHealth > 0) {
        gameVerdict = "Win";
    }


    let finalMove = "down";

    if (mySnakeLength < 6 || mySnakeHealth < 55) {
        const closestFood = findClosestFood();
        if (closestFood) {
            const foodMove = moveTowards(closestFood);
            if (foodMove) finalMove = foodMove;
        }
    } else {
        const attackTarget = findAttackTarget();
        if (attackTarget) {
            const attackMove = moveTowards(attackTarget);
            if (attackMove) finalMove = attackMove;
        } else {
            const closestFood = findClosestFood();
            if (closestFood) {
                const foodMove = moveTowards(closestFood);
                if (foodMove) finalMove = foodMove;
            }
        }
    }

    if (!moveSafety[finalMove] && (mySnakeLength < 4|| mySnakeHealth < 55)) {
        const closestFood = findClosestFood();
        if (closestFood) {
            const foodMove = moveTowards(closestFood);
            if (foodMove && moveSafety[foodMove]) finalMove = foodMove;
        }
    }

    if (!moveSafety[finalMove]) {
        const safeMoves = Object.keys(moveSafety).filter(function(i) {
            return moveSafety[i];
        });
        finalMove = safeMoves.length > 0 ? safeMoves[0] : "down";
    }

    console.log("Turn:", currentTurn, "Health:", mySnakeHealth, "Move:", finalMove);

    if (gameVerdict) {
        console.log(`Win or Loss: ${gameVerdict}, Final Length: ${mySnakeLength}, Turn: ${currentTurn}`);
    }


    return { move: finalMove };
}
// work on move safety 