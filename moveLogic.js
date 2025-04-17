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
    const snakes = gameState.board.snakes.filter(
        (snake) => snake.id !== gameState.you.id
    );

    // Update moveSafety based on neck position to avoid immediate self-collision
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
    for (let i = 0; i < myBody.length; i++) {
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


    const findEnclosableSnakes = () => {
        if (myLength <= 1) return [];
        return snakes.filter(snake => snake.body.length < myLength);
    };

    const getPossibleMoves = (head) => {
        const possible = [
            { x: head.x, y: head.y + 1, move: "up" },
            { x: head.x, y: head.y - 1, move: "down" },
            { x: head.x - 1, y: head.y, move: "left" },
            { x: head.x + 1, y: head.y, move: "right" },
        ];
        return possible.filter(move => moveSafety[move.move]);
    };

    const isPositionSafe = (pos, otherBodies) => {
        if (pos.x < 0 || pos.x >= boardWidth || pos.y < 0 || pos.y >= boardHeight) return false;
        for (let i = 0; i < myBody.length; i++) {
            if (pos.x === myBody[i].x && pos.y === myBody[i].y) return false;
        }
        for (let i = 0; i < otherBodies.length; i++) {
            for (let j = 0; j < otherBodies[i].length; j++) {
                if (pos.x === otherBodies[i][j].x && pos.y === otherBodies[i][j].y) return false;
            }
        }
        return true;
    };

    const findEnclosureMoveAreaControl = () => {
        const smallerSnakes = findEnclosableSnakes();
        for (let i = 0; i < smallerSnakes.length; i++) {
            const target = smallerSnakes[i];
            const targetHead = target.body[0];
            const safeMoves = getPossibleMoves(myHead);

            for (let j = 0; j < safeMoves.length; j++) {
                const move = safeMoves[j];
                const nextHead = { x: move.x, y: move.y };
                const targetNeighbors = [
                    { x: targetHead.x, y: targetHead.y + 1 },
                    { x: targetHead.x, y: targetHead.y - 1 },
                    { x: targetHead.x - 1, y: targetHead.y },
                    { x: targetHead.x + 1, y: targetHead.y },
                ];

                let controlledNeighbors = 0;
                const allSnakeBodies = snakes.map(s => s.body);

                for (const neighbor of targetNeighbors) {
                    if (!isPositionSafe(neighbor, allSnakeBodies) || (neighbor.x === nextHead.x && neighbor.y === nextHead.y)) {
                        controlledNeighbors++;
                    }
                }

                if (controlledNeighbors >= 3) {
                    return move.move;
                }
            }
        }
        return null;
    };

    // TODO: Step 4 - Move towards food instead of random, to regain health and survive longer
    // gameState.board.food contains an array of food coordinates https://docs.battlesnake.com/api/objects/board
    const findClosestFood = () => {
        if (!food || food.length === 0) {
            return null;
        }
        let closest = food[0];
        let minDistance = Math.abs(myHead.x - food[0].x) + Math.abs(myHead.y - food[0].y);

        for (let i = 1; i < food.length; i++) {
            const distance = Math.abs(myHead.x - food[i].x) + Math.abs(myHead.y - food[i].y);
            if (distance < minDistance) {
                minDistance = distance;
                closest = food[i];
            }
        }
        return closest;
    };


    let nextMove = "down";
    const closestFood = findClosestFood();
    const enclosureMove = findEnclosureMoveAreaControl();
    const middleFoodX = boardWidth - 5;
    const middleFoodY = boardHeight - 5;
    const isMiddleFood = myHead.x === middleFoodX && myHead.y === middleFoodY;

   
    if (isMiddleFood) {
        moveSafety.up = false;
        moveSafety.down = false;
        moveSafety.right = false;
        moveSafety.left = false;
    } else if (myHealth > 50 && enclosureMove) {
        nextMove = enclosureMove;
    } else if (closestFood) {
        if (closestFood.x === myHead.x) {
            if (closestFood.y < myHead.y && moveSafety.down) nextMove = "down";
            else if (closestFood.y > myHead.y && moveSafety.up) nextMove = "up";
        } else if (closestFood.x < myHead.x && moveSafety.left) nextMove = "left";
        else if (closestFood.x > myHead.x && moveSafety.right) nextMove = "right";
    }

    let finalMove = "down";
    if (moveSafety[nextMove]) finalMove = nextMove;
    else {
        if (moveSafety.up) finalMove = "up";
        else if (moveSafety.down) finalMove = "down";
        else if (moveSafety.left) finalMove = "left";
        else if (moveSafety.right) finalMove = "right";
    }

    return { move: finalMove };
}