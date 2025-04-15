export default function move(gameState) {
  let moveSafety = {
      up: true,
      down: true,
      left: true,
      right: true
  };
  
  const myHead = gameState.you.body[0];
  const myNeck = gameState.you.body[1];
  
  if (myNeck.x < myHead.x) {        // Neck is left of head, don't move left
      moveSafety.left = false;
      
  } else if (myNeck.x > myHead.x) { // Neck is right of head, don't move right
      moveSafety.right = false;
      
  } else if (myNeck.y < myHead.y) { // Neck is below head, don't move down
      moveSafety.down = false;
      
  } else if (myNeck.y > myHead.y) { // Neck is above head, don't move up
      moveSafety.up = false;
  }
  
  // Step 1 - Prevent your Battlesnake from moving out of bounds
  // gameState.board contains an object representing the game board including its width and height
  // https://docs.battlesnake.com/api/objects/board
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
  if (myHead.y === boardHeight - 1) {
      moveSafety.up = false;
  }
  
  // TODO: Step 2 - Prevent your Battlesnake from colliding with itself
  // gameState.you contains an object representing your snake, including its coordinates
  // https://docs.battlesnake.com/api/objects/battlesnake

  gameState.you.body.forEach(segment => {
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
  });
  
  // TODO: Step 3 - Prevent your Battlesnake from colliding with other Battlesnakes
  // gameState.board.snakes contains an array of enemy snake objects, which includes their coordinates
  // https://docs.battlesnake.com/api/objects/battlesnake
    
  // Are there any safe moves left?
    
  //Object.keys(moveSafety) returns ["up", "down", "left", "right"]
  //.filter() filters the array based on the function provided as an argument (using arrow function syntax here)
  //In this case we want to filter out any of these directions for which moveSafety[direction] == false

  gameState.board.snakes.forEach(snake => {
    for (let i = 0; i < snake.body.length; i++) {
        const segment = snake.body[i];
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
  });
  
  
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
      console.log(`MOVE ${gameState.turn}: No safe moves!`);
      return { move: "down" };
  }
 
  if (!moveSafety[nextMove]) {
      nextMove = safeMoves[0];
  }
  
  console.log(`MOVE ${gameState.turn}: ${nextMove}`);
  return { move: nextMove };
}