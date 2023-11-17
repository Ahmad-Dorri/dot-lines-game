import React, { useEffect, useRef, useState } from 'react';
import './App.module.css';

const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;
// # we can make this anything we want for bigger or smaller box
const GRID_SIZE = 20;
const CELL_SIZE = HEIGHT / GRID_SIZE;

// # we are getting each side of the box a number
const boxSides = {
  BOT: 0,
  LEFT: 1,
  RIGHT: 2,
  TOP: 3,
};

// # if player1turn then we have #red Color but for player2 we have #blue color
let isPlayer1Turn: boolean;
let currentBox;

// # scores for the players
//! I wanted to use useState but when re-render happens the previous state will be gone
const Player = {
  player1Score: 0,
  player2Score: 0,
};

// # creating a class for the Box and it has some properties
class Box {
  x: number;
  y: number;
  w: number;
  h: number;
  top: number;
  left: number;
  right: number;
  bottom: number;
  numOfSideSelected: number;
  owner: any;
  highlight: any;
  sideTop: {
    owner: any;
    isSelected: boolean;
  };
  sideRight: {
    owner: any;
    isSelected: boolean;
  };
  sideBottom: {
    owner: any;
    isSelected: boolean;
  };
  sideLeft: {
    owner: any;
    isSelected: boolean;
  };
  constructor(x: number, y: number, size: number) {
    this.numOfSideSelected = 0;
    this.owner = null;
    this.x = x;
    this.y = y;
    this.w = size;
    this.h = size;
    this.top = y;
    this.left = x;
    this.right = x + size;
    this.bottom = y + size;
    this.highlight = null;
    this.sideTop = {
      owner: null,
      isSelected: false,
    };
    this.sideRight = {
      owner: null,
      isSelected: false,
    };
    this.sideLeft = {
      owner: null,
      isSelected: false,
    };
    this.sideBottom = {
      owner: null,
      isSelected: false,
    };
  }
  // # when we call the mousemove function in the 'canva' we can get (x, y)
  isMouseInsideBox(x: number, y: number) {
    const isMouseInside =
      x >= this.left && x < this.right && y >= this.top && y < this.bottom;
    return isMouseInside;
  }
  highLightSide(x: number, y: number) {
    let dTop = y - this.top,
      dLeft = x - this.left,
      dRight = this.right - x,
      dBottom = this.bottom - y;
    let minDist = Math.min(dTop, dLeft, dRight, dBottom);
    if (minDist === dTop && !this.sideTop.isSelected) {
      this.highlight = boxSides.TOP;
    } else if (minDist === dBottom && !this.sideBottom.isSelected) {
      this.highlight = boxSides.BOT;
    } else if (minDist === dLeft && !this.sideLeft.isSelected) {
      this.highlight = boxSides.LEFT;
    } else if (minDist === dRight && !this.sideRight.isSelected) {
      this.highlight = boxSides.RIGHT;
    }
    return this.highlight;
  }
  drawBoxSides(context: CanvasRenderingContext2D) {
    if (this.highlight != null) {
      this.drawBoxSide(
        context,
        this.highlight,
        // # the true is for the highlighting and when it's false we can draw the box with thicker color
        getPlayerColor(isPlayer1Turn, true)
      );
    }
    if (this.sideTop.isSelected) {
      this.drawBoxSide(
        context,
        boxSides.TOP,
        getPlayerColor(this.sideTop.owner, false)
      );
    }
    if (this.sideBottom.isSelected) {
      this.drawBoxSide(
        context,
        boxSides.BOT,
        getPlayerColor(this.sideBottom.owner, false)
      );
    }
    if (this.sideLeft.isSelected) {
      this.drawBoxSide(
        context,
        boxSides.LEFT,
        getPlayerColor(this.sideLeft.owner, false)
      );
    }
    if (this.sideRight.isSelected) {
      this.drawBoxSide(
        context,
        boxSides.RIGHT,
        getPlayerColor(this.sideRight.owner, false)
      );
    }
  }
  drawBoxSide(context: CanvasRenderingContext2D, side: any, sideColor: string) {
    switch (side) {
      case boxSides.TOP:
        drawLine(context, this.left, this.top, this.right, this.top, sideColor);
        break;
      case boxSides.LEFT:
        // # it works like this: when we want to draw the left line we should connect the left-top circle to the left-bottom circle so we call drawLine() with the left-top-left-bottom order
        drawLine(
          context,
          this.left,
          this.top,
          this.left,
          this.bottom,
          sideColor
        );
        break;
      // # right-top-right-bottom order
      case boxSides.RIGHT:
        drawLine(
          context,
          this.right,
          this.top,
          this.right,
          this.bottom,
          sideColor
        );
        break;
      case boxSides.BOT:
        drawLine(
          context,
          this.left,
          this.bottom,
          this.right,
          this.bottom,
          sideColor
        );
        break;
    }
  }
  selectBoxSide() {
    if (this.highlight == null) return;
    switch (this.highlight) {
      case boxSides.TOP:
        this.sideTop.isSelected = true;
        this.sideTop.owner = isPlayer1Turn;
        break;

      case boxSides.BOT:
        this.sideBottom.isSelected = true;
        this.sideBottom.owner = isPlayer1Turn;
        break;

      case boxSides.LEFT:
        this.sideLeft.isSelected = true;
        this.sideLeft.owner = isPlayer1Turn;
        break;

      case boxSides.RIGHT:
        this.sideRight.isSelected = true;
        this.sideRight.owner = isPlayer1Turn;
        break;
    }
    this.highlight = null;
    this.numOfSideSelected++;
    // # if the 4 lines that are around the box are selected we should add score to the current player and change the DOM base on that
    if (this.numOfSideSelected == 4) {
      if (isPlayer1Turn) {
        Player.player1Score++;
        document.getElementById('player1').innerHTML! = Player.player1Score;
      } else {
        Player.player2Score++;
        document.getElementById('player2').innerHTML! = Player.player2Score;
      }
      this.owner = isPlayer1Turn;

      return true;
    } else {
      return false;
    }
  }
  // # when 4 lines of the box are selected we should fill the box with the current player color
  fillBox(context: CanvasRenderingContext2D) {
    if (this.owner == null) return;
    context.beginPath();
    context.fillStyle = getPlayerColor(this.owner, false);
    context.fillRect(
      this.x + CELL_SIZE / 10,
      this.y + CELL_SIZE / 10,
      this.w - (2 * CELL_SIZE) / 10,
      this.h - (2 * CELL_SIZE) / 10
    );
    context.closePath();
  }
}

function initializeGame() {
  isPlayer1Turn = Math.random() > 0.5;
  currentBox = [];
  const boxArr: Box[][] = [];
  for (let i = 0; i < GRID_SIZE - 1; i++) {
    boxArr[i] = [];
    for (let j = 0; j < GRID_SIZE - 1; j++) {
      boxArr[i][j] = new Box(
        // ! x
        CELL_SIZE * (i + 1),
        // ! y
        CELL_SIZE * (j + 1),
        // !size
        CELL_SIZE
      );
    }
  }
  return boxArr;
}

function drawLine(
  context: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string
) {
  context.beginPath();
  context.strokeStyle = color;
  context.lineWidth = CELL_SIZE / 12;
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.stroke();
  context.closePath();
}

function drawCircles(context: CanvasRenderingContext2D, boxArr: Box[][]) {
  for (let i = 0; i < GRID_SIZE - 1; i++) {
    for (let j = 0; j < GRID_SIZE - 1; j++) {
      drawCircle(context, CELL_SIZE * (i + 1), CELL_SIZE * (j + 1));
    }
  }
}

function drawCircle(context: CanvasRenderingContext2D, x: number, y: number) {
  context.beginPath();
  context.arc(x, y, CELL_SIZE / 10, 0, 2 * Math.PI);
  context.fillStyle = '#000';
  context.fill();
  context.closePath();
}

function drawBox(context: CanvasRenderingContext2D, boxArr: Box[][]) {
  for (let i = 0; i < GRID_SIZE - 1; i++) {
    for (let j = 0; j < GRID_SIZE - 1; j++) {
      boxArr[i][j].drawBoxSides(context);
      boxArr[i][j].fillBox(context);
    }
  }
}

function gameLoop(
  context: CanvasRenderingContext2D,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  boxArr: Box[][]
) {
  context?.clearRect(
    0,
    0,
    canvasRef.current?.width!,
    canvasRef.current?.height!
  );
  drawCircles(context, boxArr);
  drawBox(context, boxArr);
  requestAnimationFrame(() => gameLoop(context, canvasRef, boxArr));
}

function getPlayerColor(player: boolean, isLight: boolean) {
  if (player) {
    return isLight ? '#ff0064' : '#ff0000';
  } else {
    return isLight ? '#0096ff' : '#0000ff';
  }
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const boxArr = initializeGame();

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = WIDTH;
      canvasRef.current.height = HEIGHT;
      setContext(canvasRef.current.getContext('2d'));
    }
  }, [canvasRef]);

  useEffect(() => {
    if (context) {
      gameLoop(context, canvasRef, boxArr);
    }
  }, [context, boxArr]);

  const highlightSide = (x: number, y: number) => {
    let rows = boxArr.length;
    let cols = boxArr[0].length;
    for (let i = 0; i < GRID_SIZE - 1; i++) {
      for (let j = 0; j < GRID_SIZE - 1; j++) {
        boxArr[i][j].highlight = null;
      }
    }

    currentBox = [];

    // # we have -2 beacause we don't want to the highlights goes beyond the grid
    for (let i = 0; i < GRID_SIZE - 2; i++) {
      for (let j = 0; j < GRID_SIZE - 2; j++) {
        if (boxArr[i][j].isMouseInsideBox(x, y)) {
          let side = boxArr[i][j].highLightSide(x, y);
          if (side != null) {
            currentBox.push({ row: i, col: j });
          }

          let row = i;
          let col = j;
          let highlight;
          let isNeighbour = true;

          if (side == boxSides.LEFT && j > 0) {
            row = i - 1;
            highlight = boxSides.RIGHT;
          } else if (side == boxSides.RIGHT && j < cols - 1) {
            row = i + 1;
            highlight = boxSides.LEFT;
          } else if (side == boxSides.TOP && i > 0) {
            col = j - 1;
            highlight = boxSides.BOT;
          } else if (side == boxSides.BOT && i < rows - 1) {
            col = j + 1;
            highlight = boxSides.TOP;
          } else {
            isNeighbour = false;
          }

          if (isNeighbour) {
            boxArr[row][col].highlight = highlight;
            currentBox.push({ row: row, col: col });
          }
        }
      }
    }
  };

  const mouseMoveHandler = (
    e: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    const x = e.clientX,
      y = e.clientY;
    highlightSide(x, y);
  };

  //# select side function
  const selectSide = () => {
    let isBoxFilled = false;
    if (currentBox.length == 0) {
      return;
    }
    for (let box of currentBox) {
      if (boxArr[box.row][box.col].selectBoxSide()) {
        isBoxFilled = true;
      }
    }
    currentBox = [];

    // #change the player turn
    if (!isBoxFilled) {
      isPlayer1Turn = !isPlayer1Turn;
    }
  };

  //# mouse click handler
  const mouseClickHandler = () => {
    selectSide();
  };

  return (
    <div className="grid place-items-center">
      <canvas
        onClick={mouseClickHandler}
        onMouseMove={mouseMoveHandler}
        ref={canvasRef}
        id="canvas"></canvas>
      <div className="flex m-8 gap-4 absolute right-0 top-0">
        <p className="flex items-center justify-center gap-2 text-2xl font-bold">
          <span className="text-rose-500">Player 1:</span>
          <span
            className="bg-rose-500 text-white p-4 w-8 h-8 flex justify-center items-center rounded-full"
            id="player1">
            0
          </span>
        </p>
        <p className="flex items-center justify-center gap-2 text-2xl font-bold">
          <span className="text-blue-500">Player 2:</span>
          <span
            className="bg-blue-500 text-white p-4 w-8 h-8 flex justify-center items-center rounded-full"
            id="player2">
            0
          </span>
        </p>
      </div>
    </div>
  );
}

export default App;
