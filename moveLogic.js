export default function move(gameState) {
    let moveSafety = {
        up: true,
        down: true,
        left: true,
        right: true
    };

    const myHead = gameState.you.body[0];
    const myNeck = gameState.you.body[1];
    const myHealth = gameState.you.health;
    const turn = gameState.turn;
    const boardWidth = gameState.board.width;
    const boardHeight = gameState.board.height;

    // Update moveSafety based on neck position
  
        if (myNeck.x < myHead.x) {
            moveSafety.left = false; // Neck is left of head, don't move left
        } else if (myNeck.x > myHead.x) {
            moveSafety.right = false; // Neck is right of head, don't move right
        } else if (myNeck.y < myHead.y) {
            moveSafety.down = false; // Neck is below head, don't move down
        } else if (myNeck.y > myHead.y) {
            moveSafety.up = false; // Neck is above head, don't move up
        
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
    const myBody = gameState.you.body;
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
    const snakes = gameState.board.snakes;
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

    const isStarting = turn < 20; 

    const circle = () => {
        return isStarting;
    };

    
    if (circle()) {
        let preferredMove;
        if (myHead.x === 1) {
            preferredMove = "down";
        } else if (myHead.x === boardWidth - 2) {
            preferredMove = "down";
        } else if (myHead.y === 1) {
            preferredMove = "up";
        } else if (myHead.y === boardHeight - 2) {
            preferredMove = "up";
        } else {
            const turnMoves = {
                0: "right",
                1: "up",
                2: "left",
                3: "down",
            };
            preferredMove = turnMoves[turn % 4] || "down"; 
        }

        if (moveSafety[preferredMove]) {
            console.log(myHealth);
            return { move: preferredMove };
        } else {
            const safeCircleMoves = Object.keys(moveSafety).filter(direction => moveSafety[direction]);
            if (safeCircleMoves.length > 0) {
                const safeMove = safeCircleMoves[0];
                console.log(myHealth);
                return { move: safeMove };
            } else {
                console.log(myHealth);
                return { move: "down" }; // Last resort
            }
        } 
        
    }

    // TODO: Step 4 - Move towards food instead of random, to regain health and survive longer
    // gameState.board.food contains an array of food coordinates https://docs.battlesnake.com/api/objects/board
    const findClosestFood = () => {
        const food = gameState.board.food;
        if (!food || food.length === 0) {
            return null;
        }
        let closestFood = food[0];
        let minDistance = Math.abs(myHead.x - food[0].x) + Math.abs(myHead.y - food[0].y);

        for (let i = 1; i < food.length; i++) {
            const distance = Math.abs(myHead.x - food[i].x) + Math.abs(myHead.y - food[i].y);
            if (distance < minDistance) {
                minDistance = distance;
                closestFood = food[i];
            }
        }
        return closestFood;
    };

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

    const safeMoves = Object.keys(moveSafety).filter(direction => moveSafety[direction]);
    if (safeMoves.length === 0) {
        console.log(myHealth);
        return { move: "down" };
    }

    if (!moveSafety[nextMove]) {
        nextMove = safeMoves[0];
    }

    console.log(myHealth);
    return { move: nextMove };
}