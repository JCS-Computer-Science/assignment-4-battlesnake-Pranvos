
export default function move(gameState) {
  const moveSafety = {
    up: true,
    down: true,
    left: true,
    right: true
  };

  const myHead = gameState.you.body[0];
  const myNeck = gameState.you.body[1];
  const boardWidth = gameState.board.width;
  const boardHeight = gameState.board.height;
  const myBody = gameState.you.body;
  const otherSnakes = gameState.board.snakes;
  const food = gameState.board.food;

  
  if (myNeck) {
    if (myNeck.x < myHead.x) moveSafety.left = false;
    else if (myNeck.x > myHead.x) moveSafety.right = false;
    else if (myNeck.y < myHead.y) moveSafety.down = false;
    else if (myNeck.y > myHead.y) moveSafety.up = false;
  }

  // Step 1 - Prevent moving out of bounds
  if (myHead.x === 0) moveSafety.left = false;
  if (myHead.x === boardWidth - 1) moveSafety.right = false;
  if (myHead.y === 0) moveSafety.down = false;
  if (myHead.y === boardHeight - 1) moveSafety.up = false;

  // Step 2 - Prevent colliding with self
  for (let i = 0; i < myBody.length; i++) {
    const segment = myBody[i];
    if (segment.x === myHead.x + 1 && segment.y === myHead.y) moveSafety.right = false;
    if (segment.x === myHead.x - 1 && segment.y === myHead.y) moveSafety.left = false;
    if (segment.x === myHead.x && segment.y === myHead.y + 1) moveSafety.up = false;
    if (segment.x === myHead.x && segment.y === myHead.y - 1) moveSafety.down = false;
  }

  // Step 3 - Prevent colliding with other snakes
  for (const snake of otherSnakes) {
    for (const segment of snake.body) {
      if (segment.x === myHead.x + 1 && segment.y === myHead.y) moveSafety.right = false;
      if (segment.x === myHead.x - 1 && segment.y === myHead.y) moveSafety.left = false;
      if (segment.x === myHead.x && segment.y === myHead.y + 1) moveSafety.up = false;
      if (segment.x === myHead.x && segment.y === myHead.y - 1) moveSafety.down = false;
    }
  }

  // Get safe moves
  const safeMoves = Object.keys(moveSafety).filter(direction => moveSafety[direction]);

  if (safeMoves.length === 0) {
    console.log(`MOVE ${gameState.turn}: No safe moves detected! Moving down`);
    return { move: "down" };
  }

  // Step 4 - Move towards food by evaluating each safe move
  const closestFood = () => {
    
  }
}