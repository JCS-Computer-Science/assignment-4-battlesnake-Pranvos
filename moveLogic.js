export default function move(gameState) {
    let moveSafety = {
        up: true,
        down: true,
        left: true,
        right: true
    };

    const myHead = gameState.you.body[0];
    const myNeck = gameState.you.body[1];
    const myBody = gameState.you.body;
    const myLength = myBody.length;
    const myHealth = gameState.you.health;
    const turn = gameState.turn;
    const boardWidth = gameState.board.width;
    const boardHeight = gameState.board.height;
    const food = gameState.board.food;
    const snakes = gameState.board.snakes.filter(function(snake) {
        return snake.id !== gameState.you.id;
    });

    if (myNeck) {
        if (myNeck.x < myHead.x) {
            moveSafety.left = false; // Neck is left of head, don't move left
        } else if (myNeck.x > myHead.x) {
            moveSafety.right = false; // Neck is right of head, don't move right
        } else if (myNeck.y < myHead.y) {
            moveSafety.down = false; // Neck is below head, don't move down
        } else if (myNeck.y > myHead.y) {
            moveSafety.up = false; // Neck is above head, don't move up
        }
    }

    // Step 1 - Prevent your Battlesnake from moving out of bounds
    // gameState.board contains an object representing the game board including its width and height
    // https://docs.battlesnake.com/api/objects/board
    if (myHead.x === 0) {
        moveSafety.left = false;
    }
    if (myHead.x === boardWidth - 1) {
        moveSafety.right = false;
    }
    if (myHead.y === 0) {
        moveSafety.down = false;
    }
    if (myHead.y === boardHeight - 1) {
        moveSafety.up = false;
    }

    // TODO: Step 2 - Prevent your Battlesnake from colliding with itself
    // gameState.you contains an object representing your snake, including its coordinates
    // https://docs.battlesnake.com/api/objects/battlesnake
    for (let i = 1; i < myBody.length; i++) {
        const segment = myBody[i];
        if (segment.x === myHead.x && segment.y === myHead.y + 1) {
            moveSafety.up = false;
        }
        if (segment.x === myHead.x && segment.y === myHead.y - 1) {
            moveSafety.down = false;
        }
        if (segment.x === myHead.x + 1 && segment.y === myHead.y) {
            moveSafety.right = false;
        }
        if (segment.x === myHead.x - 1 && segment.y === myHead.y) {
            moveSafety.left = false;
        }
    }

    // TODO: Step 3 - Prevent your Battlesnake from colliding with other Battlesnakes
    // gameState.board.snakes contains an array of enemy snake objects, which includes their coordinates
    // https://docs.battlesnake.com/api/objects/battlesnake
    for (let i = 0; i < snakes.length; i++) {
        const snake = snakes[i];
        const body = snake.body;
        for (let j = 0; j < body.length; j++) {
            const segment = body[j];
            if (segment.x === myHead.x && segment.y === myHead.y + 1) {
                moveSafety.up = false;
            }
            if (segment.x === myHead.x && segment.y === myHead.y - 1) {
                moveSafety.down = false;
            }
            if (segment.x === myHead.x + 1 && segment.y === myHead.y) {
                moveSafety.right = false;
            }
            if (segment.x === myHead.x - 1 && segment.y === myHead.y) {
                moveSafety.left = false;
            }
        }
    }


    function countReachableSpaces(position, visited, allSnakeBodies, predictedEnemyHeads, depth, maxDepth) {
        if (position.x < 0 || position.x >= boardWidth || position.y < 0 || position.y >= boardHeight || depth > maxDepth) {
            return 0;
        }

        const positionKey = position.x + "," + position.y;
        if (visited.includes(positionKey)) {
            return 0;
        }

        // Check if position is blocked by any snake body
        for (let i = 0; i < allSnakeBodies.length; i++) {
            for (let j = 0; j < allSnakeBodies[i].length; j++) {
                if (position.x === allSnakeBodies[i][j].x && position.y === allSnakeBodies[i][j].y) {
                    return 0;
                }
            }
        }


        for (const enemyHead of predictedEnemyHeads) {
            if (position.x === enemyHead.x && position.y === enemyHead.y && depth === 1) {
                return 0;
            }
        }

        visited.push(positionKey);
        let count = 1;


        count = count + countReachableSpaces({ x: position.x, y: position.y + 1 }, visited, allSnakeBodies, predictedEnemyHeads, depth + 1, maxDepth); // up
        count = count + countReachableSpaces({ x: position.x, y: position.y - 1 }, visited, allSnakeBodies, predictedEnemyHeads, depth + 1, maxDepth); // down
        count = count + countReachableSpaces({ x: position.x - 1, y: position.y }, visited, allSnakeBodies, predictedEnemyHeads, depth + 1, maxDepth); // left
        count = count + countReachableSpaces({ x: position.x + 1, y: position.y }, visited, allSnakeBodies, predictedEnemyHeads, depth + 1, maxDepth); // right

        return count;
    }


    function isSafeMove(move) {
        const nextHead = {
            up: { x: myHead.x, y: myHead.y + 1 },
            down: { x: myHead.x, y: myHead.y - 1 },
            left: { x: myHead.x - 1, y: myHead.y },
            right: { x: myHead.x + 1, y: myHead.y }
        };

        if (!moveSafety[move]) {
            return false;
        }

        const allSnakeBodies = [myBody];
        const predictedEnemyHeads = [];
        for (let i = 0; i < snakes.length; i++) {
            allSnakeBodies.push(snakes[i].body);
            const enemyHead = snakes[i].body[0];
            const enemyTail = snakes[i].body[snakes[i].body.length - 1];
            if (snakes[i].body.length > 1) {
                const secondToLast = snakes[i].body[snakes[i].body.length - 2];
                if (enemyTail.x < secondToLast.x) { // Tail was moving right, predict left
                    predictedEnemyHeads.push({ x: enemyHead.x - 1, y: enemyHead.y });
                } else if (enemyTail.x > secondToLast.x) { // Tail was moving left, predict right
                    predictedEnemyHeads.push({ x: enemyHead.x + 1, y: enemyHead.y });
                } else if (enemyTail.y < secondToLast.y) { // Tail was moving up, predict down
                    predictedEnemyHeads.push({ x: enemyHead.x, y: enemyHead.y - 1 });
                } else if (enemyTail.y > secondToLast.y) { // Tail was moving down, predict up
                    predictedEnemyHeads.push({ x: enemyHead.x, y: enemyHead.y + 1 });
                }
            } else if (turn > 0) {
        
            }
        }

        const visited = [];
        const reachableSpaces = countReachableSpaces(nextHead[move], visited, allSnakeBodies, predictedEnemyHeads, 0, 100);


        return reachableSpaces >= myLength;
    }


    moveSafety.up = moveSafety.up && isSafeMove("up");
    moveSafety.down = moveSafety.down && isSafeMove("down");
    moveSafety.left = moveSafety.left && isSafeMove("left");
    moveSafety.right = moveSafety.right && isSafeMove("right");

    // TODO: Step 4 - Move towards food instead of random, to regain health and survive longer
    // gameState.board.food contains an array of food coordinates https://docs.battlesnake.com/api/objects/board
    function findClosestFood() {
        if (!food || food.length === 0) {
            return null;
        }

        const centerX = Math.floor(boardWidth / 2);
        const centerY = Math.floor(boardHeight / 2);
        const middleMinX = centerX - 1;
        const middleMaxX = centerX + 1;
        const middleMinY = centerY - 1;
        const middleMaxY = centerY + 1;

        let closestFood = null;
        let minDistance = Infinity;

        for (let i = 0; i < food.length; i++) {
            // if (
            //     food[i].x >= middleMinX &&
            //     food[i].x <= middleMaxX &&
            //     food[i].y >= middleMinY &&
            //     food[i].y <= middleMaxY
            // ) {
            //     continue;
            // }

            const distance = Math.abs(myHead.x - food[i].x) + Math.abs(myHead.y - food[i].y);
            if (distance < minDistance) {
                minDistance = distance;
                closestFood = food[i];
            }
        }

        return closestFood;
    }


    let nextMove = "down";
    const closestFood = findClosestFood();
    if (closestFood) {
        if (closestFood.x === myHead.x) {
            if (closestFood.y < myHead.y && moveSafety.down) {
                nextMove = "down";
            } else if (closestFood.y > myHead.y && moveSafety.up) {
                nextMove = "up";
            }
        } else if (closestFood.x < myHead.x && moveSafety.left) {
            nextMove = "left";
        } else if (closestFood.x > myHead.x && moveSafety.right) {
            nextMove = "right";
        }
    }

    let finalMove = "down";
    if (moveSafety[nextMove]) {
        finalMove = nextMove;
    } else {
        if (moveSafety.up) {
            finalMove = "up";
        } else if (moveSafety.down) {
            finalMove = "down";
        } else if (moveSafety.left) {
            finalMove = "left";
        } else if (moveSafety.right) {
            finalMove = "right";
        }
    }

    console.log("Turn:", turn, "Health:", myHealth);

    return { move: finalMove };
}

//Note: work on food algorithm and target other snake if  mySnake.length > opponentSnake.length