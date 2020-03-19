"use strict";

// https://stackoverflow.com/questions/287903/what-is-the-preferred-syntax-for-defining-enums-in-javascript
const PieceTypeEnum = {
    "Pawn": "p",
    "Horse": "h",
    "Bishop": "b",
    "Tower": "t",
    "King": "k",
    "Queen": "q",
    "None": ""
};
const GameStateEnum = {
    "SelectPiece": 0,
    "SelectDestination": 1
};
// Make enums immutable
Object.freeze(PieceTypeEnum);
Object.freeze(GameStateEnum);

const GRID_SIZE = 8;

let gameState = GameStateEnum.SelectPiece;
let selectedPiece = {
    row: -99,
    col: -99
};

let arrPossibleMoves;

let chessboard = [
    ["t2", "h2", "b2", "k2", "q2", "b2", "h2", "t2"],
    ["p2", "p2", "p2", "p2", "p2", "p2", "p2", "p2"],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["p1", "p1", "p1", "p1", "p1", "p1", "p1", "p1"],
    ["t1", "h1", "b1", "q1", "k1", "b1", "h1", "t1"]
]

document.body.onload = function() {
    let table = createChessboardTableHTML(GRID_SIZE);
    document.getElementById("grid-container").appendChild(table);
}

function createChessboardTableHTML(gridSize) {
    let table = document.createElement("table");

    // Determines color of the first cell in the row. It's initialized
    // with TRUE because the top-left cell in the chessboard should be white
    let isFirstCellInRowWhite = true;

    for(let row = 0; row < gridSize; row++) {
        let tr = document.createElement("tr");
        
        for(let col = 0; col < gridSize; col++) {
            let td = document.createElement("td");
            // This makes it easier to recognize which cell was clicked
            td.id = `cell-${row}-${col}`;
            td.onclick = handleCellClick;

            if(chessboard[row][col] != "") {
                td.innerText = chessboard[row][col][0];
            }

            // Makes cells with an even column index black or white
            if(isFirstCellInRowWhite)
                td.className = col % 2 === 0 ? "cell-white" : "cell-black";
            else
                td.className = col % 2 === 0 ? "cell-black" : "cell-white";

            tr.appendChild(td);
        }
        
        table.appendChild(tr);
        isFirstCellInRowWhite = !isFirstCellInRowWhite;
    }

    return table;
}

function handleCellClick(e) {
    // Retrieves row and column index from the clicked cell's id
    let idArray = e.target.id.split("-");
    let row = Number(idArray[1]);
    let col = Number(idArray[2]);

    let cellContents = chessboard[row][col];

    if(gameState === GameStateEnum.SelectPiece) {
        if(cellContents !== "") {
            let pieceType = cellContents[0];
            let playerCode = Number(cellContents[1]);
            console.log(`Cell ${row}-${col}. Piece type: ${pieceType}`);
    
            if(playerCode === 1) {
                arrPossibleMoves = getPossibleMovesForPiece(row, col);
                
                setDisplayDestinationActive(true);

                selectedPiece.row = row;
                selectedPiece.col = col;

                gameState = GameStateEnum.SelectDestination;
            }
        }
        else {
            console.log(`Cell ${row}-${col}. Empty`);
        }
    } else if(gameState === GameStateEnum.SelectDestination) {
        // If user clicks again on the piece they're trying to move, do nothing
        if(Number(row) === selectedPiece.row && Number(col) === selectedPiece.col) {
            console.log("You have already selected this piece.")
            return;
        }

        setDisplayDestinationActive(false);

        let isValidMove = false;
        // Check if the selected cell is a valid destination
        for(let i=0; i<arrPossibleMoves.length; i++) {
            if(arrPossibleMoves[i].row == row && arrPossibleMoves[i].col == col) {
                isValidMove = true;
                // If the destination is an empty cell, move the piece there
                //if(chessboard[row][col] === "") {
                    chessboard[row][col] = chessboard[selectedPiece.row][selectedPiece.col];
                    chessboard[selectedPiece.row][selectedPiece.col] = "";

                    document.getElementById(`cell-${row}-${col}`).innerText = chessboard[row][col][0];
                    document.getElementById(`cell-${selectedPiece.row}-${selectedPiece.col}`).innerText = "";
                //}
                // If the destination contains an enemy...
                //else {
                //    chessboard[row][col] = chessboard[selectedPiece.row][selectedPiece.col];
                //    chessboard[selectedPiece.row][selectedPiece.col] = "";
                //}

                gameState = GameStateEnum.SelectPiece;
                break;
            }
        }

        if(!isValidMove) {
            // If you clicked on a friend unit
            if(cellContents !== "") {
                let pieceType = cellContents[0];
                let playerCode = Number(cellContents[1]);
                // This is the same code as above, DRY
                if(playerCode === 1) {
                    arrPossibleMoves = getPossibleMovesForPiece(row, col);
                                        
                    setDisplayDestinationActive(true);

                    selectedPiece.row = row;
                    selectedPiece.col = col;

                    gameState = GameStateEnum.SelectDestination;
                }
            }
        }
    }
}

/** Allows to show/hide where a piece can be moved. */
function setDisplayDestinationActive(display) {
    console.log((display ? "Enabling" : "Disabling") + " destination mode.");

    arrPossibleMoves.forEach((v) => {
        let cell = document.getElementById(`cell-${v.row}-${v.col}`);
        let className = v.isEnemy ? "cell-move-enemy" : "cell-move-free";
        
        if(display)
            cell.classList.add(className);
        else
            cell.classList.remove(className);
    });
}

class PossibleMove {
    constructor(row, col, isEnemy) {
        this.row = row;
        this.col = col;
        this.isEnemy = isEnemy;
    }
}

function getPossibleMovesForPiece(row, col) {
    if(!checkRowColValid(row, col))
    {
        console.error("Invalid row or column value");
        return undefined;
    }
    
    let cellContents = chessboard[row][col];
    if(cellContents === "") {
        console.warn("Cannot get moves for an empty cell");
        return null;
    }

    let pieceType = cellContents[0];
    let playerCode = Number(cellContents[1]);
    
    let arrValidCells = [];

    if(pieceType === PieceTypeEnum.Pawn) {
        // Player one is the player "below", so the pawns can only go above
        if(playerCode === 1) {
            // If pawn can go above one step
            if(row > 0) {
                let cellContents;

                // If cell up-left has enemy
                if(col > 0) {
                    cellContents = chessboard[row-1][col-1];
                    if(cellContents !== "" && cellContents[1] == "2") {
                        arrValidCells.push(new PossibleMove(row-1, col-1, true));
                    }
                }
                // If cell up-right has enemy
                if(col < GRID_SIZE-1) {
                    cellContents = chessboard[row-1][col+1];
                    if(cellContents !== "" && cellContents[1] == "2") {
                        arrValidCells.push(new PossibleMove(row-1, col+1, true));
                    }
                }
                
                // If cell above is free
                cellContents = chessboard[row-1][col];
                if(cellContents === "") {
                    arrValidCells.push(new PossibleMove(row-1, col, false));

                    // If the pawn is at its starting position and has two free cells above
                    if(row == GRID_SIZE-2) {
                        cellContents = chessboard[row-2][col];
                        if(cellContents === "")
                            arrValidCells.push(new PossibleMove(row-2, col, false));
                    }
                }
            }
        }
    }

    return arrValidCells;
}

function checkRowColValid(row, col) {
    return (row >= 0 || row < GRID_SIZE-1 || col >= 0 || col < GRID_SIZE);
}
