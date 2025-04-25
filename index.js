// Welcome to
// __________         __    __  .__                               __
// \______   \_____ _/  |__/  |_|  |   ____   ______ ____ _____  |  | __ ____
//  |    |  _/\__  \\   __\   __\  | _/ __ \ /  ___//    \\__  \ |  |/ // __ \
//  |    |   \ / __ \|  |  |  | |  |_\  ___/ \___ \|   |  \/ __ \|    <\  ___/
//  |________/(______/__|  |__| |____/\_____>______>___|__(______/__|__\\_____>
//
// This file can be a nice home for your Battlesnake logic and helper functions.
//
// To get you started we've included code to prevent your Battlesnake from moving backwards.
// For more info see docs.battlesnake.com
import express from 'express';
import move from './moveLogic.js'

const app = express();
app.use(express.json());

const config = {
  apiversion: "1",
  author: "pranav",
  color: "#b00505",
  head: "bonhomme",
  tail: "nr-booster"
};

// Handle GET requests to root
app.get("/", (req, res) => {
  res.json(config);
});

// Handle POST requests to start
app.post("/start", (req, res) => {
  res.status(200).send();
});

// Handle POST requests to move
app.post("/move", (req, res) => {
  const gameState = req.body;
  const response = move(gameState);
  res.status(200).json(response);
});

// Handle POST requests to end
app.post("/end", (req, res) => {
  res.status(200).send();
});

const host = '0.0.0.0';
const port = process.env.PORT || 8000;

app.listen(port, host, () => {
  console.log(`Running Battlesnake at http://${host}:${port}...`);
});