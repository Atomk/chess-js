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

            let piece = pieceAt(row, col);
            if(piece !== EMPTY_TILE) {
                
                let span = document.createElement("span");
                if(piece.owner === PlayerEnum.White)
                    span.innerText = htmlPiecesUnicodeWhite[piece.type];
                else
                span.innerText = htmlPiecesUnicodeBlack[piece.type];

                if(piece.owner === PlayerEnum.White) {
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

    if(gameState === GameStateEnum.SelectPiece) {
        if(pieceAt(row, col) !== EMPTY_TILE) {
            if(pieceAt(row, col).owner === activePlayer) {
                console.log(`Selected cell ${row}-${col}. Piece type: ${pieceAt(row, col).type}`);

                let arrPossibleMoves = getPossibleMovesForPiece(row, col);
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
            if(arrPossibleMoves[i].row === row && arrPossibleMoves[i].col === col && !arrPossibleMoves[i].putsOwnKingInCheck) {
                isValidMove = true;
                break;
            }
        }

        if(isValidMove) {
            chessboard[row][col] = chessboard[selectedPiece.row][selectedPiece.col];
            chessboard[selectedPiece.row][selectedPiece.col] = EMPTY_TILE;

            let selectedPieceHTMLCell = getHTMLCellByCoords(selectedPiece.row, selectedPiece.col)
            getHTMLCellByCoords(row, col).innerHTML = selectedPieceHTMLCell.innerHTML;
            selectedPieceHTMLCell.innerHTML = "";

            let enemyPlayer = (activePlayer === PlayerEnum.White) ? PlayerEnum.Black : PlayerEnum.White;

            if(isKingInCheck(enemyPlayer)) {
                console.log("Enemy king in check position. Checkmate?");

                if(isCheckmate(enemyPlayer)) {
                    messageTurnElem.innerText = (activePlayer === PlayerEnum.White)
                        ? "🏆 White wins! 🏆"
                        : "🏆 Black wins! 🏆";
                    messageWarningElem.innerText = "Checkmate.";
                    // TODO make all pieces unselectable (remove .selectable class)
                    gameState = GameStateEnum.GameOver;
                } else {
                    messageWarningElem.innerText = (activePlayer === PlayerEnum.White)
                        ? "⚠ Black king check! ⚠"
                        : "⚠ White king check! ⚠";
                }
            } else {
                messageWarningElem.innerText = "";
            }

            if(gameState !== GameStateEnum.GameOver) {
                changeTurn();
             }
        } else {
            gameState = GameStateEnum.SelectPiece;
            handleCellSelected(row, col);
        }
    }
}

function setSelectionMarkerActive(row, col, display) {
    if(!inBounds(row, col)) {
        console.error("Invalid arguments.");
        return;
    }

    let cellElement = getHTMLCellByCoords(row, col);
    if(display)
        cellElement.classList.add("cell-selected");
    else
        cellElement.classList.remove("cell-selected");
}

function changeTurn() {
    gameState = GameStateEnum.SelectPiece;

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
            let className;

            if(v.putsOwnKingInCheck)
                className = "cell-move-illegal";
            else
                className = v.isEnemy ? "cell-move-enemy" : "cell-move-free";

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
        this.putsOwnKingInCheck = false;
    }

    setIllegal() {
        this.putsOwnKingInCheck = true;
    }
}

/**
 * Returns an array representing all the possible moves for a specific piece.
 * @param {*} row 
 * @param {*} col 
 * @param {boolean} checkLegal Determines whether to check if moves are valid. Prevents the function from calling itselt infinitely when performing the validation check.
 */
function getPossibleMovesForPiece(row, col, checkLegal = true) {
    if(!inBounds(row, col))
    {
        console.error("Invalid row or column value");
        return undefined;
    }
    
    let pieceToMove = pieceAt(row, col);

    if(pieceToMove === EMPTY_TILE) {
        console.warn("Cannot get moves for an empty cell");
        return null;
    }
    
    let arrMoves = [];

    switch(pieceToMove.type) {
        case PieceTypeEnum.Pawn: arrMoves = getPawnMoves(row, col); break;
        case PieceTypeEnum.Horse: arrMoves = getHorseMoves(row, col); break;
        case PieceTypeEnum.Bishop: arrMoves = getBishopMoves(row, col); break;
        case PieceTypeEnum.Rook: arrMoves = getRookMoves(row, col); break;
        case PieceTypeEnum.King: arrMoves = getKingMoves(row, col); break;
        case PieceTypeEnum.Queen:
            arrMoves = getRookMoves(row, col).concat(getBishopMoves(row, col));
            break;
        default:
            console.error("Unrecognized piece type: " + pieceToMove.type);
    }
    
    if(checkLegal) {
        for(let i = 0; i < arrMoves.length; i++) {
            if(doesMovePutKingInCheck(row, col, arrMoves[i].row, arrMoves[i].col)) {
                arrMoves[i].setIllegal();
            }
        }
    }

    return arrMoves;
}

function getPawnMoves(row, col) {
    let pieceToMove = pieceAt(row, col);
    // White pawns can only go up, black pawns can only go down
    let direction = (pieceToMove.owner === PlayerEnum.White) ? -1 : 1;
    let arrMoves = [];
    let targetCell, r;

    r = row + (1 * direction);

    // If pawn can go one step forward
    if(inBounds(r, col)) {
        // If cell forward-left has enemy
        if(col > 0) {
            targetCell = pieceAt(r, col-1);
            if(targetCell !== EMPTY_TILE && targetCell.owner !== pieceToMove.owner) {
                arrMoves.push(new PossibleMove(r, col-1, true));
            }
        }
        // If cell forward-right has enemy
        if(col < MAX_COL) {
            targetCell = pieceAt(r, col+1);
            if(targetCell !== EMPTY_TILE && targetCell.owner !== pieceToMove.owner) {
                arrMoves.push(new PossibleMove(r, col+1, true));
            }
        }

        // If cell forward is free
        targetCell = pieceAt(r, col);
        if(targetCell === EMPTY_TILE) {
            arrMoves.push(new PossibleMove(r, col, false));

            // TODO This will have to be changed when implementing custom chessboard
            let startingRow = (pieceToMove.owner === PlayerEnum.White) ? MAX_ROW-1 : 1;
            
            // If the pawn is at its starting position and has two free cells fprward
            if(row === startingRow) {
                r = row + 2 * direction;
                if(pieceAt(r, col) === EMPTY_TILE)
                    arrMoves.push(new PossibleMove(r, col, false));
            }
        }
    }

    return arrMoves;
}

function getHorseMoves(row, col) {
    let arrMoves = [];
    let pieceToMove = pieceAt(row, col);
    let target;

    function horseCheck(r, c) {
        if(inBounds(r, c)) {
            target = pieceAt(r, c);
            if(target === EMPTY_TILE) {
                arrMoves.push(new PossibleMove(r, c, false));
            } else if(target.owner !== pieceToMove.owner) {
                arrMoves.push(new PossibleMove(r, c, true));
            }
        }
    }

    horseCheck(row-2, col-1); // Up left
    horseCheck(row-2, col+1); // Up right
    horseCheck(row+2, col-1); // Bottom left
    horseCheck(row+2, col+1); // Bottom right
    horseCheck(row+1, col-2); // Left up
    horseCheck(row-1, col-2); // Left down
    horseCheck(row+1, col+2); // Right up
    horseCheck(row-1, col+2); // Right down

    return arrMoves;
}

function getBishopMoves(row, col) {
    let arrMoves = [];
    let pieceToMove = pieceAt(row, col);
    let r, c;
        
    // Up-left
    r = row-1;
    c = col-1;
    while(inBounds(r, c)) {
        if(pieceAt(r, c) === EMPTY_TILE) {
            arrMoves.push(new PossibleMove(r, c, false));
        } else {
            if(pieceAt(r, c).owner !== pieceToMove.owner) {
                arrMoves.push(new PossibleMove(r, c, true));
            }
            // This is not a free cell, so the piece cannot move anymore in this direction
            break;
        }
        r--, c--;
    }
    // Up-right
    r = row-1;
    c = col+1;
    while(inBounds(r, c)) {
        if(pieceAt(r, c) === EMPTY_TILE) {
            arrMoves.push(new PossibleMove(r, c, false));
        } else {
            if(pieceAt(r, c).owner !== pieceToMove.owner) {
                arrMoves.push(new PossibleMove(r, c, true));
            }
            break;
        }
        r--, c++;
    }
    // Bottom-left
    r = row+1;
    c = col-1;
    while(inBounds(r, c)) {
        if(pieceAt(r, c) === EMPTY_TILE) {
            arrMoves.push(new PossibleMove(r, c, false));
        } else {
            if(pieceAt(r, c).owner !== pieceToMove.owner) {
                arrMoves.push(new PossibleMove(r, c, true));
            }
            break;
        }
        r++, c--;
    }
    // Bottom-right
    r = row+1;
    c = col+1;
    while(inBounds(r, c)) {
        if(pieceAt(r, c) === EMPTY_TILE) {
            arrMoves.push(new PossibleMove(r, c, false));
        } else {
            if(pieceAt(r, c).owner !== pieceToMove.owner) {
                arrMoves.push(new PossibleMove(r, c, true));
            }
            break;
        }
        r++, c++;
    }

    return arrMoves;
}

function getRookMoves(row, col) {
    let arrMoves = [];
    let pieceToMove = pieceAt(row, col);
    let r, c;

    // Bottom
    r = row+1;
    while(r <= MAX_ROW) {
        // If cell is empty
        if(chessboard[r][col] === EMPTY_TILE) {
            arrMoves.push(new PossibleMove(r, col, false));
        } else {
            // If cell contains an enemy unit
            if(chessboard[r][col][1] !== pieceToMove.owner) {
                arrMoves.push(new PossibleMove(r, col, true));
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
            arrMoves.push(new PossibleMove(r, col, false));
        } else {
            if(chessboard[r][col][1] !== pieceToMove.owner) {
                arrMoves.push(new PossibleMove(r, col, true));
            }
            break;
        }
        r--;
    }

    // Right
    c = col+1;
    while(c <= MAX_COL) {
        if(chessboard[row][c] === EMPTY_TILE) {
            arrMoves.push(new PossibleMove(row, c, false));
        } else {
            if(chessboard[row][c][1] !== pieceToMove.owner) {
                arrMoves.push(new PossibleMove(row, c, true));
            }
            break;
        }
        c++;
    }

    // Left
    c = col-1;
    while(c >= 0) {
        if(chessboard[row][c] === EMPTY_TILE) {
            arrMoves.push(new PossibleMove(row, c, false));
        } else {
            if(chessboard[row][c][1] !== pieceToMove.owner) {
                arrMoves.push(new PossibleMove(row, c, true));
            }
            break;
        }
        c--;
    }

    return arrMoves;
}

function getKingMoves(row, col) {
    let arrMoves = [];
    let pieceToMove = pieceAt(row, col);
    let r, c;
        
    r = row-1;
    if(r >= 0) {
        // Up
        c = col;
        if(pieceAt(r, c) === EMPTY_TILE) {
            arrMoves.push(new PossibleMove(r, c, false));
        } else if(pieceAt(r, c).owner !== pieceToMove.owner) {
            arrMoves.push(new PossibleMove(r, c, true));
        }

        // Up left
        c = col-1;
        if(c >= 0) {
            if(pieceAt(r, c) === EMPTY_TILE) {
                arrMoves.push(new PossibleMove(r, c, false));
            } else if(pieceAt(r, c).owner !== pieceToMove.owner) {
                arrMoves.push(new PossibleMove(r, c, true));
            }
        }

        // Up right
        c = col+1;
        if(c <= MAX_COL) {
            if(pieceAt(r, c) === EMPTY_TILE) {
                arrMoves.push(new PossibleMove(r, c, false));
            } else if(pieceAt(r, c).owner !== pieceToMove.owner) {
                arrMoves.push(new PossibleMove(r, c, true));
            }
        }
    }

    r = row+1;
    if(r <= MAX_ROW) {
        // Bottom
        c = col;
        if(pieceAt(r, c) === EMPTY_TILE) {
            arrMoves.push(new PossibleMove(r, c, false));
        } else if(pieceAt(r, c).owner !== pieceToMove.owner) {
            arrMoves.push(new PossibleMove(r, c, true));
        }

        // Bottom left
        c = col-1;
        if(c >= 0) {
            if(pieceAt(r, c) === EMPTY_TILE) {
                arrMoves.push(new PossibleMove(r, c, false));
            } else if(pieceAt(r, c).owner !== pieceToMove.owner) {
                arrMoves.push(new PossibleMove(r, c, true));
            }
        }

        // Bottom right
        c = col+1;
        if(c <= MAX_COL) {
            if(pieceAt(r, c) === EMPTY_TILE) {
                arrMoves.push(new PossibleMove(r, c, false));
            } else if(pieceAt(r, c).owner !== pieceToMove.owner) {
                arrMoves.push(new PossibleMove(r, c, true));
            }
        }
    }

    // Left
    r = row;
    c = col-1;
    if(c >= 0) {
        if(pieceAt(r, c) === EMPTY_TILE) {
            arrMoves.push(new PossibleMove(r, c, false));
        } else if(pieceAt(r, c).owner !== pieceToMove.owner) {
            arrMoves.push(new PossibleMove(r, c, true));
        }
    }
    // Right
    c = col+1;
    if(c <= MAX_COL) {
        if(pieceAt(r, c) === EMPTY_TILE) {
            arrMoves.push(new PossibleMove(r, c, false));
        } else if(pieceAt(r, c).owner !== pieceToMove.owner) {
            arrMoves.push(new PossibleMove(r, c, true));
        }
    }

    return arrMoves;
}

/** Returns whether moving a piece on a certain square puts its king in check. */
function doesMovePutKingInCheck(pieceRow, pieceCol, destRow, destCol) {
    let pieceOwner = chessboard[pieceRow][pieceCol][1];
    let destinationCellContents = chessboard[destRow][destCol];
    // Move piece on destination square
    chessboard[destRow][destCol] = chessboard[pieceRow][pieceCol];
    chessboard[pieceRow][pieceCol] = EMPTY_TILE;

    let kingInCheck = isKingInCheck(pieceOwner);

    // This function uses the original chessboard to avoid creating
    // a copy of the chessboard matrix on every call
    chessboard[pieceRow][pieceCol] = chessboard[destRow][destCol];
    chessboard[destRow][destCol] = destinationCellContents;

    return kingInCheck;
}

/** Returns true if the row and column indexes passed as arguments
 * are in-bounds in the chessboard matrix. */
function inBounds(row, col) {
    return (row >= 0 && row <= MAX_ROW && col >= 0 && col <= MAX_COL);
}

function coordsToId(row, col) {
    return `cell-${row}-${col}`;
}

function getHTMLCellByCoords(row, col) {
    return document.getElementById(coordsToId(row, col));
}

/** Returns whether a king can be captured by an enemy piece. */
function isKingInCheck(kingOwner) {
    let arrPossibleMoves;
    let enemyRow, enemyCol;

    for (let r = 0; r <= MAX_ROW; r++) {
        for (let c = 0; c <= MAX_COL; c++) {
            // For every piece on the chessboard...
            if (pieceAt(r, c) !== EMPTY_TILE) {
                // ...owned by the king's enemy...
                if (pieceAt(r, c).owner !== kingOwner) {
                    // Last parameter is false because is doesn't matter
                    // if the enemy will put their king to risk,
                    // if they capture the enemy king they win
                    arrPossibleMoves = getPossibleMovesForPiece(r, c, false);
                    // ...check all the cells that piece can be moved to
                    for (let i = 0; i < arrPossibleMoves.length; i++) {
                        // If the piece can capture another piece...
                        if (arrPossibleMoves[i].isEnemy) {
                            enemyRow = arrPossibleMoves[i].row;
                            enemyCol = arrPossibleMoves[i].col;
                            // ...and that piece is the king...
                            if (pieceAt(enemyRow, enemyCol).type === PieceTypeEnum.King) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
    }

    return false;
}

/**
 * Returns whether a king is in checkmate position.
 * @param {*} playerInCheck Owner of the king in check position.
 */
function isCheckmate(playerInCheck) {
    // Checking king first, to avoid checking all the other pieces if possible
    let kingPos = getKingPosition(playerInCheck);
    let arrPossibleMoves = getPossibleMovesForPiece(kingPos.row, kingPos.col);
    for (let i = 0; i < arrPossibleMoves.length; i++) {
        if(!arrPossibleMoves[i].putsOwnKingInCheck) {
            console.log("King can escape.");
            return false;
        }
    }
    
    console.log("King has no legal moves. Checking other pieces.");

    let piece;
    for (let r = 0; r <= MAX_ROW; r++) {
        for (let c = 0; c <= MAX_COL; c++) {
            piece = pieceAt(r, c);
            // For every piece on the chessboard...
            if (piece !== EMPTY_TILE) {
                // If the piece is owned by the player whose king is in check...
                if (piece.owner === playerInCheck) {
                    // If the piece is not the king... (already checked it)
                    if(piece.type !== PieceTypeEnum.King) {
                        // Check all possible moves for the piece...
                        arrPossibleMoves = getPossibleMovesForPiece(r, c);
                        for (let i = 0; i < arrPossibleMoves.length; i++) {
                            // If the move can put the king out of check...
                            if(!arrPossibleMoves[i].putsOwnKingInCheck) {
                                console.log(`Checkmate can be avoided by piece at (${r},${c})`);
                                return false;
                            }
                        }
                    }
                }
            }
        }
    }

    console.log("Checkmate.");
    return true;
}

/** Returns the coordinates of the king of the specified color. */
function getKingPosition(player) {
    let piece;
    for (let r = 0; r <= MAX_ROW; r++) {
        for (let c = 0; c <= MAX_COL; c++) {
            piece = pieceAt(r, c);
            if (piece !== EMPTY_TILE) {
                if (piece.owner === player) {
                    if(piece.type === PieceTypeEnum.King) {
                        return { row: r, col: c };
                    }
                }
            }
        }
    }

    return undefined;
}

/** Returns an object containing data for a specific piece,
 * or undefined if parameters are not valid. */
function pieceAt(row, col) {
    if(!inBounds(row, col)) {
        return undefined;
    } else {
        if(chessboard[row][col] === EMPTY_TILE) {
            return EMPTY_TILE;
        } else {
            return {
                type: chessboard[row][col][0],
                owner: chessboard[row][col][1]
            };
        }
    }
}