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
// I made these because sometimes I forget to check array indexes
// against "GRID_SIZE-1" instead of just "GRID_SIZE"
// There are two different variables because in the future
// I want to support different grid sizes
const MAX_COL = GRID_SIZE - 1;
const MAX_ROW = GRID_SIZE - 1;

const EMPTY_TILE = "";

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

            if(chessboard[row][col] !== EMPTY_TILE) {
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
        if(cellContents !== EMPTY_TILE) {
            let pieceType = cellContents[0];
            let playerCode = Number(cellContents[1]);
            console.log(`Cell ${row}-${col}. Piece type: ${pieceType}`);
    
            if(playerCode === 1) {
                arrPossibleMoves = getPossibleMovesForPiece(row, col);
                if(arrPossibleMoves.length === 0) {
                    console.log("This piece cannot move anywhere...");
                }

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
                //if(chessboard[row][col] === EMPTY_TILE) {
                    chessboard[row][col] = chessboard[selectedPiece.row][selectedPiece.col];
                    chessboard[selectedPiece.row][selectedPiece.col] = EMPTY_TILE;

                    document.getElementById(`cell-${row}-${col}`).innerText = chessboard[row][col][0];
                    document.getElementById(`cell-${selectedPiece.row}-${selectedPiece.col}`).innerText = EMPTY_TILE;
                //}
                // If the destination contains an enemy...
                //else {
                //    chessboard[row][col] = chessboard[selectedPiece.row][selectedPiece.col];
                //    chessboard[selectedPiece.row][selectedPiece.col] = EMPTY_TILE;
                //}

                gameState = GameStateEnum.SelectPiece;
                break;
            }
        }

        if(!isValidMove) {
            // Reset selection
            selectedPiece.row = -1;
            selectedPiece.col = -1;

            // If you clicked on a friend unit
            if(cellContents !== EMPTY_TILE) {
                let pieceType = cellContents[0];
                let playerCode = Number(cellContents[1]);
                // This is the same code as above, DRY
                if(playerCode === 1) {
                    arrPossibleMoves = getPossibleMovesForPiece(row, col);
                    if(arrPossibleMoves.length === 0) {
                        console.log("This piece cannot move anywhere...");
                    }

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
    if(cellContents === EMPTY_TILE) {
        console.warn("Cannot get moves for an empty cell");
        return null;
    }

    let pieceType = cellContents[0];
    // TODO this is a string, I foresee errors. Should be an enum or something else
    let playerCode = cellContents[1];
    
    let arrValidCells = [];

    if(pieceType === PieceTypeEnum.Pawn) {
        // Player one is the player "below", so the pawns can only go above
        if(playerCode == "1") {
            // If pawn can go above one step
            if(row > 0) {
                let cellContents;

                // If cell up-left has enemy
                if(col > 0) {
                    cellContents = chessboard[row-1][col-1];
                    if(cellContents !== EMPTY_TILE && cellContents[1] == "2") {
                        arrValidCells.push(new PossibleMove(row-1, col-1, true));
                    }
                }
                // If cell up-right has enemy
                if(col < MAX_COL) {
                    cellContents = chessboard[row-1][col+1];
                    if(cellContents !== EMPTY_TILE && cellContents[1] == "2") {
                        arrValidCells.push(new PossibleMove(row-1, col+1, true));
                    }
                }
                
                // If cell above is free
                cellContents = chessboard[row-1][col];
                if(cellContents === EMPTY_TILE) {
                    arrValidCells.push(new PossibleMove(row-1, col, false));

                    // If the pawn is at its starting position and has two free cells above
                    if(row == MAX_ROW-1) {
                        cellContents = chessboard[row-2][col];
                        if(cellContents === EMPTY_TILE)
                            arrValidCells.push(new PossibleMove(row-2, col, false));
                    }
                }
            }
        }
    }
    else if(pieceType === PieceTypeEnum.Tower) {
        let i;
        
        // Bottom
        i = row+1;
        while(i <= MAX_ROW) {
            // If cell is empty
            if(chessboard[i][col] === EMPTY_TILE) {
                arrValidCells.push(new PossibleMove(i, col, false));
            } else {
                // If cell contains a friendly unit
                if(chessboard[i][col][1] == playerCode) {
                    break;
                } else {
                    // Cell contains an enemy unit
                    arrValidCells.push(new PossibleMove(i, col, true));
                    break;
                }
            }
            i++;
        }
        // Top
        i = row-1;
        while(i >= 0) {
            if(chessboard[i][col] === EMPTY_TILE) {
                arrValidCells.push(new PossibleMove(i, col, false));
            } else {
                if(chessboard[i][col][1] == playerCode) {
                    break;
                } else {
                    arrValidCells.push(new PossibleMove(i, col, true));
                    break;
                }
            }
            i--;
        }
        // Right
        i = col+1;
        while(i <= MAX_COL) {
            if(chessboard[row][i] === EMPTY_TILE) {
                arrValidCells.push(new PossibleMove(row, i, false));
            } else {
                if(chessboard[row][i][1] == playerCode) {
                    break;
                } else {
                    arrValidCells.push(new PossibleMove(row, i, true));
                    break;
                }
            }
            i++;
        }
        // Left
        i = col-1;
        while(i >= 0) {
            if(chessboard[row][i] === EMPTY_TILE) {
                arrValidCells.push(new PossibleMove(row, i, false));
            } else {
                if(chessboard[row][i][1] == playerCode) {
                    break;
                } else {
                    arrValidCells.push(new PossibleMove(row, i, true));
                    break;
                }
            }
            i--;
        }
    }
    else if(pieceType === PieceTypeEnum.Horse) {
        // Up left
        if(row-2 >= 0 && col-1 >= 0) {
            if(chessboard[row-2][col-1] === EMPTY_TILE) {
                arrValidCells.push(new PossibleMove(row-2, col-1, false));
            } else if(chessboard[row-2][col-1][1] != playerCode) {
                arrValidCells.push(new PossibleMove(row-2, col-1, true));
            }
        }
        // Up right
        if(row-2 >= 0 && col+1 <= MAX_COL) {
            if(chessboard[row-2][col+1] === EMPTY_TILE) {
                arrValidCells.push(new PossibleMove(row-2, col+1, false));
            } else if(chessboard[row-2][col+1][1] != playerCode) {
                arrValidCells.push(new PossibleMove(row-2, col+1, true));
            }
        }
        // Bottom left
        if(row+2 <= MAX_ROW && col-1 >= 0) {
            if(chessboard[row+2][col-1] === EMPTY_TILE) {
                arrValidCells.push(new PossibleMove(row+2, col-1, false));
            } else if(chessboard[row+2][col-1][1] != playerCode) {
                arrValidCells.push(new PossibleMove(row+2, col-1, true));
            }
        }
        // Bottom right
        if(row+2 <= MAX_ROW && col+1 <= MAX_COL) {
            if(chessboard[row+2][col+1] === EMPTY_TILE) {
                arrValidCells.push(new PossibleMove(row+2, col+1, false));
            } else if(chessboard[row+2][col+1][1] != playerCode) {
                arrValidCells.push(new PossibleMove(row+2, col+1, true));
            }
        }
        // Left up
        if(row+1 <= MAX_ROW && col-2 >= 0) {
            if(chessboard[row+1][col-2] === EMPTY_TILE) {
                arrValidCells.push(new PossibleMove(row+1, col-2, false));
            } else if(chessboard[row+1][col-2][1] != playerCode) {
                arrValidCells.push(new PossibleMove(row+1, col-2, true));
            }
        }
        // Left down
        if(row-1 >= 0 && col-2 >= 0) {
            if(chessboard[row-1][col-2] === EMPTY_TILE) {
                arrValidCells.push(new PossibleMove(row-1, col-2, false));
            } else if(chessboard[row-1][col-2][1] != playerCode) {
                arrValidCells.push(new PossibleMove(row-1, col-2, true));
            }
        }
        // Right up
        if(row+1 <= MAX_ROW && col+2 <= MAX_COL) {
            if(chessboard[row+1][col+2] === EMPTY_TILE) {
                arrValidCells.push(new PossibleMove(row+1, col+2, false));
            } else if(chessboard[row+1][col+2][1] != playerCode) {
                arrValidCells.push(new PossibleMove(row+1, col+2, true));
            }
        }
        // Right down
        if(row-1 >= 0 && col+2 <= MAX_COL) {
            if(chessboard[row-1][col+2] === EMPTY_TILE) {
                arrValidCells.push(new PossibleMove(row-1, col+2, false));
            } else if(chessboard[row-1][col+2][1] != playerCode) {
                arrValidCells.push(new PossibleMove(row-1, col+2, true));
            }
        }
    }
    else if(pieceType === PieceTypeEnum.King) {
        let r, c;
        
        r = row-1;
        if(r >= 0) {
            // Up
            c = col;
            if(chessboard[r][c] === EMPTY_TILE) {
                arrValidCells.push(new PossibleMove(r, c, false));
            } else if(chessboard[r][c][1] != playerCode) {
                arrValidCells.push(new PossibleMove(r, c, true));
            }

            // Up left
            c = col-1;
            if(c >= 0) {
                if(chessboard[r][c] === EMPTY_TILE) {
                    arrValidCells.push(new PossibleMove(r, c, false));
                } else if(chessboard[r][c][1] != playerCode) {
                    arrValidCells.push(new PossibleMove(r, c, true));
                }
            }

            // Up right
            c = col+1;
            if(c <= MAX_COL) {
                if(chessboard[r][c] === EMPTY_TILE) {
                    arrValidCells.push(new PossibleMove(r, c, false));
                } else if(chessboard[r][c][1] != playerCode) {
                    arrValidCells.push(new PossibleMove(r, c, true));
                }
            }
        }

        r = row+1;
        if(r <= MAX_ROW) {
            // Bottom
            c = col;
            if(chessboard[r][c] === EMPTY_TILE) {
                arrValidCells.push(new PossibleMove(r, c, false));
            } else if(chessboard[r][c][1] != playerCode) {
                arrValidCells.push(new PossibleMove(r, c, true));
            }

            // Bottom left
            c = col-1;
            if(c >= 0) {
                if(chessboard[r][c] === EMPTY_TILE) {
                    arrValidCells.push(new PossibleMove(r, c, false));
                } else if(chessboard[r][c][1] != playerCode) {
                    arrValidCells.push(new PossibleMove(r, c, true));
                }
            }

            // Bottom right
            c = col+1;
            if(c <= MAX_COL) {
                if(chessboard[r][c] === EMPTY_TILE) {
                    arrValidCells.push(new PossibleMove(r, c, false));
                } else if(chessboard[r][c][1] != playerCode) {
                    arrValidCells.push(new PossibleMove(r, c, true));
                }
            }
        }

        // Left
        r = row;
        c = col-1;
        if(c >= 0) {
            if(chessboard[r][c] === EMPTY_TILE) {
                arrValidCells.push(new PossibleMove(r, c, false));
            } else if(chessboard[r][c][1] != playerCode) {
                arrValidCells.push(new PossibleMove(r, c, true));
            }
        }
        // Right
        c = col+1;
        if(c <= MAX_COL) {
            if(chessboard[r][c] === EMPTY_TILE) {
                arrValidCells.push(new PossibleMove(r, c, false));
            } else if(chessboard[r][c][1] != playerCode) {
                arrValidCells.push(new PossibleMove(r, c, true));
            }
        }
    }

    return arrValidCells;
}

function checkRowColValid(row, col) {
    return (row >= 0 && row <= MAX_ROW && col >= 0 && col <= MAX_COL);
}
