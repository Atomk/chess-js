"use strict";

// https://stackoverflow.com/questions/287903/what-is-the-preferred-syntax-for-defining-enums-in-javascript
const PieceTypeEnum = {
    "Pawn": "p",
    "Horse": "h",
    "Bishop": "b",
    "Rook": "r",
    "King": "k",
    "Queen": "q"
};
const PlayerEnum = {
    "White": "1",
    "Black": "2",
};
const GameStateEnum = {
    "SelectPiece": 0,
    "SelectDestination": 1,
    "GameOver": 2
};
// Make enums immutable
Object.freeze(PieceTypeEnum);
Object.freeze(PlayerEnum);
Object.freeze(GameStateEnum);

const htmlPiecesUnicodeWhite = {};
htmlPiecesUnicodeWhite[PieceTypeEnum.Pawn] = "♙";
htmlPiecesUnicodeWhite[PieceTypeEnum.Horse] = "♘";
htmlPiecesUnicodeWhite[PieceTypeEnum.Bishop] = "♗‍";
htmlPiecesUnicodeWhite[PieceTypeEnum.Rook] = "♖";
htmlPiecesUnicodeWhite[PieceTypeEnum.King] = "♔";
htmlPiecesUnicodeWhite[PieceTypeEnum.Queen] = "♕";

const htmlPiecesUnicodeBlack = {};
htmlPiecesUnicodeBlack[PieceTypeEnum.Pawn] = "♟";
htmlPiecesUnicodeBlack[PieceTypeEnum.Horse] = "♞";
htmlPiecesUnicodeBlack[PieceTypeEnum.Bishop] = "♝";
htmlPiecesUnicodeBlack[PieceTypeEnum.Rook] = "♜";
htmlPiecesUnicodeBlack[PieceTypeEnum.King] = "♚";
htmlPiecesUnicodeBlack[PieceTypeEnum.Queen] = "♛";

const GRID_SIZE = 8;
// I made these because sometimes I forget to check array indexes
// against "GRID_SIZE-1" instead of just "GRID_SIZE"
// There are two different variables because in the future
// I want to support different grid sizes
const MAX_COL = GRID_SIZE - 1;
const MAX_ROW = GRID_SIZE - 1;

const EMPTY_TILE = "";

let messageTurnElem;
let messageWarningElem;

let gameState;
let activePlayer;
let chessboard;
let selectedPiece = {
    row: -1,
    col: -1
};

document.body.onload = function() {
    // Must be called before everything else because it initializes the chessboard
    initGame();

    let table = createChessboardTableHTML(GRID_SIZE);
    document.getElementById("grid-container").appendChild(table);

    messageTurnElem = document.getElementById("msg-turn");
    messageWarningElem = document.getElementById("msg-warning");
    setPlayerTurnText();
}

function initGame() {
    chessboard = [
        ["r2", "h2", "b2", "q2", "k2", "b2", "h2", "r2"],
        ["p2", "p2", "p2", "p2", "p2", "p2", "p2", "p2"],
        [EMPTY_TILE, EMPTY_TILE, EMPTY_TILE, EMPTY_TILE, EMPTY_TILE, EMPTY_TILE, EMPTY_TILE, EMPTY_TILE],
        [EMPTY_TILE, EMPTY_TILE, EMPTY_TILE, EMPTY_TILE, EMPTY_TILE, EMPTY_TILE, EMPTY_TILE, EMPTY_TILE],
        [EMPTY_TILE, EMPTY_TILE, EMPTY_TILE, EMPTY_TILE, EMPTY_TILE, EMPTY_TILE, EMPTY_TILE, EMPTY_TILE],
        [EMPTY_TILE, EMPTY_TILE, EMPTY_TILE, EMPTY_TILE, EMPTY_TILE, EMPTY_TILE, EMPTY_TILE, EMPTY_TILE],
        ["p1", "p1", "p1", "p1", "p1", "p1", "p1", "p1"],
        ["r1", "h1", "b1", "q1", "k1", "b1", "h1", "r1"]
    ];

    activePlayer = PlayerEnum.White;
    gameState = GameStateEnum.SelectPiece;
    resetSelectedPiece();
}

function resetSelectedPiece() {
    selectedPiece.row = -1;
    selectedPiece.col = -1;
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
            td.id = coordsToId(row, col);
            td.onclick = handleHTMLCellClick;

            if(chessboard[row][col] !== EMPTY_TILE) {
                
                let span = document.createElement("span");
                let pieceType = chessboard[row][col][0];
                if(chessboard[row][col][1] === PlayerEnum.White)
                    span.innerText = htmlPiecesUnicodeWhite[pieceType];
                else
                span.innerText = htmlPiecesUnicodeBlack[pieceType];

                if(chessboard[row][col][1] === PlayerEnum.White) {
                    span.className = "piece-white";
                } else {
                    span.className = "piece-black";
                }

                td.appendChild(span);
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

    // Retrieves row and column index from the clicked cell's id
function handleHTMLCellClick(e) {
    // https://developer.mozilla.org/en-US/docs/Web/API/Event/currentTarget
    let idArray = e.currentTarget.id.split("-");
    let row = Number(idArray[1]);
    let col = Number(idArray[2]);

    handleCellSelected(row, col);
}

function handleCellSelected(row, col) {
    if(gameState === GameStateEnum.GameOver)
        return;

    let cellContents = chessboard[row][col];

    if(gameState === GameStateEnum.SelectPiece) {
        if(cellContents !== EMPTY_TILE) {
            let pieceType = cellContents[0];
            let pieceOwner = cellContents[1];
            console.log(`Cell ${row}-${col}. Piece type: ${pieceType}`);
    
            if(pieceOwner === activePlayer) {
                let arrPossibleMoves = getPossibleMovesForPiece(row, col);
                if(arrPossibleMoves.length === 0) {
                    console.log("This piece cannot move anywhere...");
                }

                setSelectionMarkerActive(row, col, true);
                setDisplayDestinationActive(arrPossibleMoves, true);
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
        if(row === selectedPiece.row && col === selectedPiece.col) {
            console.log("You have already selected this piece.")
            return;
        }
        
        let arrPossibleMoves = getPossibleMovesForPiece(selectedPiece.row, selectedPiece.col);

        setSelectionMarkerActive(selectedPiece.row, selectedPiece.col, false);
        setDisplayDestinationActive(arrPossibleMoves, false);

        let isValidMove = false;
        // Check if the selected piece can be moved in the clicked cell
        for(let i=0; i<arrPossibleMoves.length; i++) {
            if(arrPossibleMoves[i].row === row && arrPossibleMoves[i].col === col) {
                isValidMove = true;
                break;
            }
        }

        let selectedFriendUnit = false;
        if(isValidMove) {
            let kingDefeated = false;
            if(chessboard[row][col][0] === PieceTypeEnum.King) {
                kingDefeated = true;
            }

            chessboard[row][col] = chessboard[selectedPiece.row][selectedPiece.col];
            chessboard[selectedPiece.row][selectedPiece.col] = EMPTY_TILE;

            let selectedPieceHTMLCell = getHTMLCellByCoords(selectedPiece.row, selectedPiece.col)
            getHTMLCellByCoords(row, col).innerHTML = selectedPieceHTMLCell.innerHTML;
            selectedPieceHTMLCell.innerHTML = "";

            if(kingDefeated) {
                if(activePlayer === PlayerEnum.White) {
                    messageTurnElem.innerText = "🏆 White wins! 🏆";
                } else {
                    messageTurnElem.innerText = "🏆 Black wins! 🏆";
                }

                // TODO make all pieces unselectable (remove .selectable class)
                gameState = GameStateEnum.GameOver;
             } else {
                let kingInDangerCoords = isKingInDanger();
                if(kingInDangerCoords) {
                    if(chessboard[kingInDangerCoords.row][kingInDangerCoords.col][1] === PlayerEnum.White) {
                        messageWarningElem.innerText = "⚠ White king check! ⚠";
                    } else {
                        messageWarningElem.innerText = "⚠ Black king check! ⚠";
                    }
                } else {
                    // TODO: also hide on victory?
                    messageWarningElem.innerText = "";
                }

                changeTurn();
             }
        } else {
            // If you clicked on a friend unit
            if(cellContents !== EMPTY_TILE) {
                let pieceOwner = cellContents[1];
                // TODO This is the same code as above, DRY
                if(pieceOwner === activePlayer) {
                    arrPossibleMoves = getPossibleMovesForPiece(row, col);
                    if(arrPossibleMoves.length === 0) {
                        console.log("This piece cannot move anywhere...");
                    }

                    selectedFriendUnit = true;
                }
            }
        }

        if (gameState !== GameStateEnum.GameOver) {
            // TODO should call this function again, not repeat code
            if (selectedFriendUnit) {
                setSelectionMarkerActive(row, col, true);
                setDisplayDestinationActive(arrPossibleMoves, true);
                selectedPiece.row = row;
                selectedPiece.col = col;
                gameState = GameStateEnum.SelectDestination;
            } else {
                resetSelectedPiece();
                gameState = GameStateEnum.SelectPiece;
            }
        }
    }
}

function setSelectionMarkerActive(row, col, display) {
    if(!checkRowColValid) {
        console.error("setSelectionMarkerActive: Invalid arguments.");
        return;
    }

    let cellElement = getHTMLCellByCoords(row, col);
    if(display)
        cellElement.classList.add("cell-selected");
    else
        cellElement.classList.remove("cell-selected");
}

function changeTurn() {
    if(activePlayer === PlayerEnum.White)
        activePlayer = PlayerEnum.Black;
    else
        activePlayer = PlayerEnum.White;

    setPlayerTurnText();
}

function setPlayerTurnText() {
    if(activePlayer === PlayerEnum.White)
        messageTurnElem.innerText = "⚪ White's turn ⚪";
    else
        messageTurnElem.innerText = "⚫ Black's turn ⚫";
}

/** Allows to show/hide where a piece can be moved. */
function setDisplayDestinationActive(arrPossibleMoves, display) {
    if (arrPossibleMoves.length > 0) {
        console.log((display ? "Showing" : "Hiding") + " possible moves.");

        arrPossibleMoves.forEach((v) => {
            let cell = getHTMLCellByCoords(v.row, v.col);
            let className = v.isEnemy ? "cell-move-enemy" : "cell-move-free";

            if (display)
                cell.classList.add(className);
            else
                cell.classList.remove(className);
        });
    } else {
        if(display) {
            console.log("Nothing to display.");
        }
    }
}

class PossibleMove {
    constructor(row, col, isEnemy) {
        this.row = row;
        this.col = col;
        this.isEnemy = isEnemy;
    }
}

// The third (optional) parameter allows to emulate
// movements of a specific piece, useful for queen's movements.
// If omitted the function will get the value from the chessboard
function getPossibleMovesForPiece(row, col, pieceType) {
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

    if(!pieceType)
        pieceType = cellContents[0];
    // TODO I'd much prefer to do something like chessBoard[r][c].owner
    let pieceOwner = cellContents[1];
    
    let arrValidCells = [];

    if(pieceType === PieceTypeEnum.Pawn) {
        // Player one is the player "below" (white), so white pawns can only go up
        if(pieceOwner === PlayerEnum.White) {
            // If pawn can go above one step
            if(row > 0) {
                let cellContents;

                // If cell up-left has enemy
                if(col > 0) {
                    cellContents = chessboard[row-1][col-1];
                    if(cellContents !== EMPTY_TILE && cellContents[1] !== pieceOwner) {
                        arrValidCells.push(new PossibleMove(row-1, col-1, true));
                    }
                }
                // If cell up-right has enemy
                if(col < MAX_COL) {
                    cellContents = chessboard[row-1][col+1];
                    if(cellContents !== EMPTY_TILE && cellContents[1] !== pieceOwner) {
                        arrValidCells.push(new PossibleMove(row-1, col+1, true));
                    }
                }
                
                // If cell above is free
                cellContents = chessboard[row-1][col];
                if(cellContents === EMPTY_TILE) {
                    arrValidCells.push(new PossibleMove(row-1, col, false));

                    // If the pawn is at its starting position and has two free cells above
                    if(row === MAX_ROW-1) {
                        cellContents = chessboard[row-2][col];
                        if(cellContents === EMPTY_TILE)
                            arrValidCells.push(new PossibleMove(row-2, col, false));
                    }
                }
            }
        } else {
            // If pawn can go below one step
            if(row <= MAX_ROW) {
                let cellContents;

                // If cell down-left has enemy
                if(col > 0) {
                    cellContents = chessboard[row+1][col-1];
                    if(cellContents !== EMPTY_TILE && cellContents[1] !== pieceOwner) {
                        arrValidCells.push(new PossibleMove(row+1, col-1, true));
                    }
                }
                // If cell down-right has enemy
                if(col < MAX_COL) {
                    cellContents = chessboard[row+1][col+1];
                    if(cellContents !== EMPTY_TILE && cellContents[1] !== pieceOwner) {
                        arrValidCells.push(new PossibleMove(row+1, col+1, true));
                    }
                }
                
                // If cell below is free
                cellContents = chessboard[row+1][col];
                if(cellContents === EMPTY_TILE) {
                    arrValidCells.push(new PossibleMove(row+1, col, false));

                    // If the pawn is at its starting position and has two free cells below
                    if(row === 1) {
                        cellContents = chessboard[row+2][col];
                        if(cellContents === EMPTY_TILE)
                            arrValidCells.push(new PossibleMove(row+2, col, false));
                    }
                }
            }
        }
    }
    else if(pieceType === PieceTypeEnum.Rook) {
        let r, c;
        
        // Bottom
        r = row+1;
        while(r <= MAX_ROW) {
            // If cell is empty
            if(chessboard[r][col] === EMPTY_TILE) {
                arrValidCells.push(new PossibleMove(r, col, false));
            } else {
                // If cell contains an enemy unit
                if(chessboard[r][col][1] !== pieceOwner) {
                    arrValidCells.push(new PossibleMove(r, col, true));
                }
                // In any case this cell is not empty, so the rook
                // cannot move beyond this point in this direction
                break;
            }
            r++;
        }

        // Top
        r = row-1;
        while(r >= 0) {
            if(chessboard[r][col] === EMPTY_TILE) {
                arrValidCells.push(new PossibleMove(r, col, false));
            } else {
                if(chessboard[r][col][1] !== pieceOwner) {
                    arrValidCells.push(new PossibleMove(r, col, true));
                }
                break;
            }
            r--;
        }

        // Right
        c = col+1;
        while(c <= MAX_COL) {
            if(chessboard[row][c] === EMPTY_TILE) {
                arrValidCells.push(new PossibleMove(row, c, false));
            } else {
                if(chessboard[row][c][1] !== pieceOwner) {
                    arrValidCells.push(new PossibleMove(row, c, true));
                }
                break;
            }
            c++;
        }

        // Left
        c = col-1;
        while(c >= 0) {
            if(chessboard[row][c] === EMPTY_TILE) {
                arrValidCells.push(new PossibleMove(row, c, false));
            } else {
                if(chessboard[row][c][1] !== pieceOwner) {
                    arrValidCells.push(new PossibleMove(row, c, true));
                }
                break;
            }
            c--;
        }
    }
    else if(pieceType === PieceTypeEnum.Horse) {
        // Up left
        if(row-2 >= 0 && col-1 >= 0) {
            if(chessboard[row-2][col-1] === EMPTY_TILE) {
                arrValidCells.push(new PossibleMove(row-2, col-1, false));
            } else if(chessboard[row-2][col-1][1] !== pieceOwner) {
                arrValidCells.push(new PossibleMove(row-2, col-1, true));
            }
        }
        // Up right
        if(row-2 >= 0 && col+1 <= MAX_COL) {
            if(chessboard[row-2][col+1] === EMPTY_TILE) {
                arrValidCells.push(new PossibleMove(row-2, col+1, false));
            } else if(chessboard[row-2][col+1][1] !== pieceOwner) {
                arrValidCells.push(new PossibleMove(row-2, col+1, true));
            }
        }
        // Bottom left
        if(row+2 <= MAX_ROW && col-1 >= 0) {
            if(chessboard[row+2][col-1] === EMPTY_TILE) {
                arrValidCells.push(new PossibleMove(row+2, col-1, false));
            } else if(chessboard[row+2][col-1][1] !== pieceOwner) {
                arrValidCells.push(new PossibleMove(row+2, col-1, true));
            }
        }
        // Bottom right
        if(row+2 <= MAX_ROW && col+1 <= MAX_COL) {
            if(chessboard[row+2][col+1] === EMPTY_TILE) {
                arrValidCells.push(new PossibleMove(row+2, col+1, false));
            } else if(chessboard[row+2][col+1][1] !== pieceOwner) {
                arrValidCells.push(new PossibleMove(row+2, col+1, true));
            }
        }
        // Left up
        if(row+1 <= MAX_ROW && col-2 >= 0) {
            if(chessboard[row+1][col-2] === EMPTY_TILE) {
                arrValidCells.push(new PossibleMove(row+1, col-2, false));
            } else if(chessboard[row+1][col-2][1] !== pieceOwner) {
                arrValidCells.push(new PossibleMove(row+1, col-2, true));
            }
        }
        // Left down
        if(row-1 >= 0 && col-2 >= 0) {
            if(chessboard[row-1][col-2] === EMPTY_TILE) {
                arrValidCells.push(new PossibleMove(row-1, col-2, false));
            } else if(chessboard[row-1][col-2][1] !== pieceOwner) {
                arrValidCells.push(new PossibleMove(row-1, col-2, true));
            }
        }
        // Right up
        if(row+1 <= MAX_ROW && col+2 <= MAX_COL) {
            if(chessboard[row+1][col+2] === EMPTY_TILE) {
                arrValidCells.push(new PossibleMove(row+1, col+2, false));
            } else if(chessboard[row+1][col+2][1] !== pieceOwner) {
                arrValidCells.push(new PossibleMove(row+1, col+2, true));
            }
        }
        // Right down
        if(row-1 >= 0 && col+2 <= MAX_COL) {
            if(chessboard[row-1][col+2] === EMPTY_TILE) {
                arrValidCells.push(new PossibleMove(row-1, col+2, false));
            } else if(chessboard[row-1][col+2][1] !== pieceOwner) {
                arrValidCells.push(new PossibleMove(row-1, col+2, true));
            }
        }
    }
    else if(pieceType === PieceTypeEnum.Bishop) {
        let r, c;
        
        // Up-left
        r = row-1;
        c = col-1;
        while(checkRowColValid(r, c)) {
            if(chessboard[r][c] === EMPTY_TILE) {
                arrValidCells.push(new PossibleMove(r, c, false));
            } else {
                if(chessboard[r][c][1] !== pieceOwner) {
                    arrValidCells.push(new PossibleMove(r, c, true));
                }
                // This is not a free cell, so the piece cannot move anymore in this direction
                break;
            }
            r--, c--;
        }
        // Up-right
        r = row-1;
        c = col+1;
        while(checkRowColValid(r, c)) {
            if(chessboard[r][c] === EMPTY_TILE) {
                arrValidCells.push(new PossibleMove(r, c, false));
            } else {
                if(chessboard[r][c][1] !== pieceOwner) {
                    arrValidCells.push(new PossibleMove(r, c, true));
                }
                break;
            }
            r--, c++;
        }
        // Bottom-left
        r = row+1;
        c = col-1;
        while(checkRowColValid(r, c)) {
            if(chessboard[r][c] === EMPTY_TILE) {
                arrValidCells.push(new PossibleMove(r, c, false));
            } else {
                if(chessboard[r][c][1] !== pieceOwner) {
                    arrValidCells.push(new PossibleMove(r, c, true));
                }
                break;
            }
            r++, c--;
        }
        // Bottom-right
        r = row+1;
        c = col+1;
        while(checkRowColValid(r, c)) {
            if(chessboard[r][c] === EMPTY_TILE) {
                arrValidCells.push(new PossibleMove(r, c, false));
            } else {
                if(chessboard[r][c][1] !== pieceOwner) {
                    arrValidCells.push(new PossibleMove(r, c, true));
                }
                break;
            }
            r++, c++;
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
            } else if(chessboard[r][c][1] !== pieceOwner) {
                arrValidCells.push(new PossibleMove(r, c, true));
            }

            // Up left
            c = col-1;
            if(c >= 0) {
                if(chessboard[r][c] === EMPTY_TILE) {
                    arrValidCells.push(new PossibleMove(r, c, false));
                } else if(chessboard[r][c][1] !== pieceOwner) {
                    arrValidCells.push(new PossibleMove(r, c, true));
                }
            }

            // Up right
            c = col+1;
            if(c <= MAX_COL) {
                if(chessboard[r][c] === EMPTY_TILE) {
                    arrValidCells.push(new PossibleMove(r, c, false));
                } else if(chessboard[r][c][1] !== pieceOwner) {
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
            } else if(chessboard[r][c][1] !== pieceOwner) {
                arrValidCells.push(new PossibleMove(r, c, true));
            }

            // Bottom left
            c = col-1;
            if(c >= 0) {
                if(chessboard[r][c] === EMPTY_TILE) {
                    arrValidCells.push(new PossibleMove(r, c, false));
                } else if(chessboard[r][c][1] !== pieceOwner) {
                    arrValidCells.push(new PossibleMove(r, c, true));
                }
            }

            // Bottom right
            c = col+1;
            if(c <= MAX_COL) {
                if(chessboard[r][c] === EMPTY_TILE) {
                    arrValidCells.push(new PossibleMove(r, c, false));
                } else if(chessboard[r][c][1] !== pieceOwner) {
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
            } else if(chessboard[r][c][1] !== pieceOwner) {
                arrValidCells.push(new PossibleMove(r, c, true));
            }
        }
        // Right
        c = col+1;
        if(c <= MAX_COL) {
            if(chessboard[r][c] === EMPTY_TILE) {
                arrValidCells.push(new PossibleMove(r, c, false));
            } else if(chessboard[r][c][1] !== pieceOwner) {
                arrValidCells.push(new PossibleMove(r, c, true));
            }
        }
    }
    else if(pieceType === PieceTypeEnum.Queen) {
        let rookMovements = getPossibleMovesForPiece(row, col, PieceTypeEnum.Rook);
        let bishopMovements = getPossibleMovesForPiece(row, col, PieceTypeEnum.Bishop);
        arrValidCells = rookMovements.concat(bishopMovements);
    }
    else {
        console.error("Unrecognized piece type: " + pieceType);
    }

    return arrValidCells;
}

/** Returns true if the row and column indexes passed as arguments
 * are in-bounds in the chessboard matrix. */
function checkRowColValid(row, col) {
    return (row >= 0 && row <= MAX_ROW && col >= 0 && col <= MAX_COL);
}

function coordsToId(row, col) {
    return `cell-${row}-${col}`;
}

function getHTMLCellByCoords(row, col) {
    return document.getElementById(coordsToId(row, col));
}

// Called it like this because "checkCheck" is not a good idea
function isKingInDanger() {
    // When a player moves a piece,
    // they can also put their own king in danger,
    // so both player's pieces must be checked.
    let pieceType;
    let arrPossibleMoves;
    let enemyRow, enemyCol;

    for (let r = 0; r <= MAX_ROW; r++) {
        for (let c = 0; c <= MAX_COL; c++) {
            // For every piece on the chessboard...
            if(chessboard[r][c] != EMPTY_TILE) {
                arrPossibleMoves = getPossibleMovesForPiece(r, c);
                // ...check all the cells that piece can be moved to
                for(let i=0; i<arrPossibleMoves.length; i++) {
                    // If the piece can capture an enemy...
                    if(arrPossibleMoves[i].isEnemy) {
                        enemyRow = arrPossibleMoves[i].row;
                        enemyCol = arrPossibleMoves[i].col;
                        // ...and the enemy is a king...
                        if(chessboard[enemyRow][enemyCol][0] === PieceTypeEnum.King) {
                            // ...return its position in the chessboard
                            return { row: enemyRow, col: enemyCol };
                        }
                    }
                }
            }
        }
    }

    return null;
}