export default function move(gameState) {
  let moveSafety = {
    up: true, 
    down: true,
    left: true,
    right: true
  };

  const myHead = gameState.you.body[0];
  const myNeck = gameState.you.body[1];

  // Prevent moving back into neck
  if (myNeck && myNeck.x < myHead.x) { 
    moveSafety.left = false;
  } else if (myNeck && myNeck.x > myHead.x) { 
    moveSafety.right = false;
  } else if (myNeck && myNeck.y < myHead.y) { 
    moveSafety.down = false;
  }

  // Step 1 - Prevent moving out of bounds
  const boardWidth = gameState.board.width;
  const boardHeight = gameState.board.height;

  if (myHead.x === 0) {
    moveSafety.left = false;
  }
  if (myHead.x === boardWidth - 1) {
    moveSafety.right = false;
  }
  if (myHead.y === 0) {
    moveSafety.down = false;
  }

  // Step 2 - Prevent colliding with self
  const myBody = gameState.you.body;
  for (let i = 0; i < myBody.length; i++) {
    const segment = myBody[i];
    if (segment.x === myHead.x + 1 && segment.y === myHead.y) moveSafety.right = false;
    if (segment.x === myHead.x - 1 && segment.y === myHead.y) moveSafety.left = false;
    if (segment.x === myHead.x && segment.y === myHead.y - 1) moveSafety.down = false;
  }

  // Step 3 - Prevent colliding with other snakes
  const otherSnakes = gameState.board.snakes;
  for (let snake of otherSnakes) {
    for (let segment of snake.body) {
      if (segment.x === myHead.x + 1 && segment.y === myHead.y) moveSafety.right = false;
      if (segment.x === myHead.x - 1 && segment.y === myHead.y) moveSafety.left = false;
      if (segment.x === myHead.x && segment.y === myHead.y - 1) moveSafety.down = false;
    }
  }

  // Get safe moves
  const safeMoves = Object.keys(moveSafety).filter(direction => moveSafety[direction]);
  if (safeMoves.length === 0) {
    console.log(`MOVE ${gameState.turn}: No safe moves detected! Moving down`);
    return { move: "down" };
  }

  // Step 4 - Move randomly from safe moves (TODO: Move toward food)
  const nextMove = safeMoves[Math.floor(Math.random() * safeMoves.length)];
  console.log(`MOVE ${gameState.turn}: ${nextMove}`);
  return { move: nextMove };
}