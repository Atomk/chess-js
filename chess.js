"use strict";

// https://stackoverflow.com/questions/287903/what-is-the-preferred-syntax-for-defining-enums-in-javascript
const PieceTypeEnum = {
    "Pawn": "p",
    "Knight": "h",  // Useng the "h" for "horse", since "k" is the king
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
htmlPiecesUnicodeWhite[PieceTypeEnum.Knight] = "♘";
htmlPiecesUnicodeWhite[PieceTypeEnum.Bishop] = "♗‍";
htmlPiecesUnicodeWhite[PieceTypeEnum.Rook] = "♖";
htmlPiecesUnicodeWhite[PieceTypeEnum.King] = "♔";
htmlPiecesUnicodeWhite[PieceTypeEnum.Queen] = "♕";

const htmlPiecesUnicodeBlack = {};
htmlPiecesUnicodeBlack[PieceTypeEnum.Pawn] = "♟";
htmlPiecesUnicodeBlack[PieceTypeEnum.Knight] = "♞";
htmlPiecesUnicodeBlack[PieceTypeEnum.Bishop] = "♝";
htmlPiecesUnicodeBlack[PieceTypeEnum.Rook] = "♜";
htmlPiecesUnicodeBlack[PieceTypeEnum.King] = "♚";
htmlPiecesUnicodeBlack[PieceTypeEnum.Queen] = "♛";

const EMPTY_CELL = "";

const chessboardsList = {
    _8x8Standard: [
        ["r2", "h2", "b2", "q2", "k2", "b2", "h2", "r2"],
        ["p2", "p2", "p2", "p2", "p2", "p2", "p2", "p2"],
        [EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL],
        [EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL],
        [EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL],
        [EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL],
        ["p1", "p1", "p1", "p1", "p1", "p1", "p1", "p1"],
        ["r1", "h1", "b1", "q1", "k1", "b1", "h1", "r1"]
    ],
    _6x6SimplerNoKnights: [
        ["r2", "b2", "q2", "k2", "b2", "r2"],
        ["p2", "p2", "p2", "p2", "p2", "p2"],
        [EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL],
        [EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL],
        ["p1", "p1", "p1", "p1", "p1", "p1"],
        ["r1", "b1", "q1", "k1", "b1", "r1"]
    ],
    _5x5BabyChess: [
        ["k2", "q2", "b2", "h2", "r2"],
        ["p2", "p2", "p2", "p2", "p2"],
        [EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL],
        ["p1", "p1", "p1", "p1", "p1"],
        ["r1", "h1", "b1", "q1", "k1"]
    ]
};
Object.freeze(chessboardsList);

// I made these because sometimes I forget to check array indexes
// against "GRID_SIZE-1" instead of just "GRID_SIZE"
// There are two different variables because in the future
// I want to support different grid sizes
let MAX_COL;
let MAX_ROW;

let messageTurnElem;
let messageWarningElem;
let checkboxAIEnabledElem;

let gameState;
let aiColor = PlayerEnum.Black;
let activePlayer;
let chessboard;
let selectedPiece = {
    row: -1,
    col: -1
};

let aiOpponent = true;

document.body.onload = function() {
    // Must be called before everything else because it initializes the chessboard
    initGame();

    initUI();

    messageTurnElem = document.getElementById("msg-turn");
    messageWarningElem = document.getElementById("msg-warning");

    checkboxAIEnabledElem = document.getElementById("checkbox-ai-enabled");
    checkboxAIEnabledElem.onclick = () => {
        aiOpponent = checkboxAIEnabledElem.checked;
    };

function initUI() {
    let numRows = chessboard.length;
    let numCols = chessboard[0].length;
    let table = createChessboardTableHTML(numRows, numCols);
    document.getElementById("grid-container").appendChild(table);

    setPlayerTurnText();
}

/**
 * Resets game variables to their initial state.
 * @param {*} [chessboardMatrix] The chessboard configuration to use. If not passed, a default 8x8 chessboard will be used.
 */
function initGame(chessboardMatrix) {
    if(chessboardMatrix)
        chessboard = chessboardMatrix;
    else
        chessboard = chessboardsList._8x8Standard;

    let numRows = chessboard.length;
    let numCols = chessboard[0].length;
    MAX_ROW = numRows - 1;
    MAX_COL = numCols - 1;

    activePlayer = PlayerEnum.White;
    gameState = GameStateEnum.SelectPiece;
    resetSelectedPiece();
}

function resetSelectedPiece() {
    selectedPiece.row = -1;
    selectedPiece.col = -1;
}

function isAITurn() {
    return aiOpponent && activePlayer === aiColor;
}

function createChessboardTableHTML(numRows, numCols) {
    let table = document.createElement("table");

    // Determines color of the first cell in the row. It's initialized
    // with TRUE because the top-left cell in the chessboard should be white
    let isFirstCellInRowWhite = true;

    for(let row = 0; row < numRows; row++) {
        let tr = document.createElement("tr");
        
        for(let col = 0; col < numCols; col++) {
            let td = document.createElement("td");
            // This makes it easier to recognize which cell was clicked
            td.id = coordsToId(row, col);
            td.onclick = handleHTMLCellClick;

            let piece = pieceAt(row, col);
            if(piece !== EMPTY_CELL) {
                
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
        if(pieceAt(row, col) !== EMPTY_CELL) {
            if(pieceAt(row, col).owner === activePlayer) {
                    console.log(`Selected cell ${row}-${col}. Piece type: ${pieceAt(row, col).type}`);
                if(!isAITurn()) {
                    let arrPossibleMoves = getPossibleMovesForPiece(row, col);
                    setSelectionMarkerActive(row, col, true);
                    setDisplayDestinationActive(arrPossibleMoves, true);
                }

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

        if(!isAITurn()) {
            setSelectionMarkerActive(selectedPiece.row, selectedPiece.col, false);
            setDisplayDestinationActive(arrPossibleMoves, false);
        }

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
            chessboard[selectedPiece.row][selectedPiece.col] = EMPTY_CELL;

            let selectedPieceHTMLCell = getHTMLCellByCoords(selectedPiece.row, selectedPiece.col)
            getHTMLCellByCoords(row, col).innerHTML = selectedPieceHTMLCell.innerHTML;
            selectedPieceHTMLCell.innerHTML = "";

            let piece = pieceAt(row, col);
            if(piece.type === PieceTypeEnum.Pawn) {
                let promotionWhite = (piece.owner === PlayerEnum.White && row === 0)
                let promotionBlack = (piece.owner === PlayerEnum.Black && row === MAX_ROW);
                if(promotionWhite || promotionBlack) {
                    let promotionType = PieceTypeEnum.Queen;
                    // TODO allow choosing what piece to promote to
                    chessboard[row][col] = `${promotionType}${piece.owner}`;
                    // Visually replaces the pawn with the new piece
                    if(piece.owner === PlayerEnum.White)
                        getHTMLCellByCoords(row, col).firstChild.innerText = htmlPiecesUnicodeWhite[promotionType];
                    else
                        getHTMLCellByCoords(row, col).firstChild.innerText = htmlPiecesUnicodeBlack[promotionType];
                }
            }

            let enemyPlayer = getEnemy(activePlayer);
            let enemyKingInCheck = isKingInCheck(enemyPlayer);
            
            if(hasLegalMoves(enemyPlayer)) {
                if(enemyKingInCheck) {
                    // The "⚠" emoji defaults to text on some browsers
                    // (i.e. Chrome on Windows 10), unless followed by U+FE0F
                    // which forces it to be displayed as emoji
                    // https://emojipedia.org/emoji/%E2%9A%A0/
                    // https://emojipedia.org/variation-selector-16/
                    messageWarningElem.innerHTML = (activePlayer === PlayerEnum.White)
                        ? "⚠&#xFE0F; Black king check! ⚠&#xFE0F;"
                        : "⚠&#xFE0F; White king check! ⚠&#xFE0F;";
                } else {
                    messageWarningElem.innerText = "";
                }
            } else {
                gameState = GameStateEnum.GameOver;

                if(enemyKingInCheck) {
                    messageTurnElem.innerText = (activePlayer === PlayerEnum.White)
                        ? "🏆 White wins! 🏆"
                        : "🏆 Black wins! 🏆";
                    messageWarningElem.innerText = "Checkmate.";
                }
                else {
                    messageTurnElem.innerText = "🤝 It's a draw! 🤝";
                    messageWarningElem.innerText = (enemyPlayer === PlayerEnum.White)
                        ? "Stalemate. White cannot move."
                        : "Stalemate. Black cannot move.";
                }
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
    activePlayer = getEnemy(activePlayer);


    setPlayerTurnText();
    if(isAITurn())
        performAITurn(activePlayer);
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
        //console.log((display ? "Showing" : "Hiding") + " possible moves.");

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

    if(pieceToMove === EMPTY_CELL) {
        console.warn("Cannot get moves for an empty cell");
        return null;
    }
    
    let arrMoves = [];

    switch(pieceToMove.type) {
        case PieceTypeEnum.Pawn: arrMoves = getPawnMoves(row, col); break;
        case PieceTypeEnum.Knight: arrMoves = getKnightMoves(row, col); break;
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
            if(targetCell !== EMPTY_CELL && targetCell.owner !== pieceToMove.owner) {
                arrMoves.push(new PossibleMove(r, col-1, true));
            }
        }
        // If cell forward-right has enemy
        if(col < MAX_COL) {
            targetCell = pieceAt(r, col+1);
            if(targetCell !== EMPTY_CELL && targetCell.owner !== pieceToMove.owner) {
                arrMoves.push(new PossibleMove(r, col+1, true));
            }
        }

        // If cell forward is free
        targetCell = pieceAt(r, col);
        if(targetCell === EMPTY_CELL) {
            arrMoves.push(new PossibleMove(r, col, false));

            // TODO This will have to be changed when implementing custom chessboard
            let startingRow = (pieceToMove.owner === PlayerEnum.White) ? MAX_ROW-1 : 1;
            
            // If the pawn is at its starting position and has two free cells fprward
            if(row === startingRow) {
                r = row + 2 * direction;
                if(pieceAt(r, col) === EMPTY_CELL)
                    arrMoves.push(new PossibleMove(r, col, false));
            }
        }
    }

    return arrMoves;
}

function getKnightMoves(row, col) {
    let arrMoves = [];
    let pieceToMove = pieceAt(row, col);
    let target;

    function knightCheck(r, c) {
        if(inBounds(r, c)) {
            target = pieceAt(r, c);
            if(target === EMPTY_CELL) {
                arrMoves.push(new PossibleMove(r, c, false));
            } else if(target.owner !== pieceToMove.owner) {
                arrMoves.push(new PossibleMove(r, c, true));
            }
        }
    }

    knightCheck(row-2, col-1); // Up left
    knightCheck(row-2, col+1); // Up right
    knightCheck(row+2, col-1); // Bottom left
    knightCheck(row+2, col+1); // Bottom right
    knightCheck(row+1, col-2); // Left up
    knightCheck(row-1, col-2); // Left down
    knightCheck(row+1, col+2); // Right up
    knightCheck(row-1, col+2); // Right down

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
        if(pieceAt(r, c) === EMPTY_CELL) {
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
        if(pieceAt(r, c) === EMPTY_CELL) {
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
        if(pieceAt(r, c) === EMPTY_CELL) {
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
        if(pieceAt(r, c) === EMPTY_CELL) {
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
        if(chessboard[r][col] === EMPTY_CELL) {
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
        if(chessboard[r][col] === EMPTY_CELL) {
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
        if(chessboard[row][c] === EMPTY_CELL) {
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
        if(chessboard[row][c] === EMPTY_CELL) {
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
        if(pieceAt(r, c) === EMPTY_CELL) {
            arrMoves.push(new PossibleMove(r, c, false));
        } else if(pieceAt(r, c).owner !== pieceToMove.owner) {
            arrMoves.push(new PossibleMove(r, c, true));
        }

        // Up left
        c = col-1;
        if(c >= 0) {
            if(pieceAt(r, c) === EMPTY_CELL) {
                arrMoves.push(new PossibleMove(r, c, false));
            } else if(pieceAt(r, c).owner !== pieceToMove.owner) {
                arrMoves.push(new PossibleMove(r, c, true));
            }
        }

        // Up right
        c = col+1;
        if(c <= MAX_COL) {
            if(pieceAt(r, c) === EMPTY_CELL) {
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
        if(pieceAt(r, c) === EMPTY_CELL) {
            arrMoves.push(new PossibleMove(r, c, false));
        } else if(pieceAt(r, c).owner !== pieceToMove.owner) {
            arrMoves.push(new PossibleMove(r, c, true));
        }

        // Bottom left
        c = col-1;
        if(c >= 0) {
            if(pieceAt(r, c) === EMPTY_CELL) {
                arrMoves.push(new PossibleMove(r, c, false));
            } else if(pieceAt(r, c).owner !== pieceToMove.owner) {
                arrMoves.push(new PossibleMove(r, c, true));
            }
        }

        // Bottom right
        c = col+1;
        if(c <= MAX_COL) {
            if(pieceAt(r, c) === EMPTY_CELL) {
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
        if(pieceAt(r, c) === EMPTY_CELL) {
            arrMoves.push(new PossibleMove(r, c, false));
        } else if(pieceAt(r, c).owner !== pieceToMove.owner) {
            arrMoves.push(new PossibleMove(r, c, true));
        }
    }
    // Right
    c = col+1;
    if(c <= MAX_COL) {
        if(pieceAt(r, c) === EMPTY_CELL) {
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
    chessboard[pieceRow][pieceCol] = EMPTY_CELL;

    let kingInCheck = isKingInCheck(pieceOwner);

    // This function uses the original chessboard to avoid creating
    // a copy of the chessboard matrix on every call
    chessboard[pieceRow][pieceCol] = chessboard[destRow][destCol];
    chessboard[destRow][destCol] = destinationCellContents;

    return kingInCheck;
}

/** Returns whether moving a piece puts a square in danger. */
function doesMoveMakeSquareCapturable(pieceRow, pieceCol, destRow, destCol, squareRow, squareCol) {
    let enemyPlayer = getEnemy(pieceAt(pieceRow, pieceCol).owner);
    let destinationCellContents = chessboard[destRow][destCol];
    // Move piece on destination square
    chessboard[destRow][destCol] = chessboard[pieceRow][pieceCol];
    chessboard[pieceRow][pieceCol] = EMPTY_CELL;

    let result = canSquareBeCaptured(squareRow, squareCol, enemyPlayer);

    // This function uses the original chessboard to avoid creating
    // a copy of the chessboard matrix on every call
    chessboard[pieceRow][pieceCol] = chessboard[destRow][destCol];
    chessboard[destRow][destCol] = destinationCellContents;

    return result;
}

/** Returns true if the row and column indexes passed as arguments
 * are in-bounds in the chessboard matrix. */
function inBounds(row, col) {
    return (row >= 0 && row <= MAX_ROW && col >= 0 && col <= MAX_COL);
}

/** Returns the opponent of a specific player. */
function getEnemy(player) {
    return (player === PlayerEnum.White) ? PlayerEnum.Black : PlayerEnum.White;
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
            if (pieceAt(r, c) !== EMPTY_CELL) {
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
 * Returns whether a player has legal moves.
 * @param {*} player Player to check.
 */
function hasLegalMoves(player) {
    let arrPossibleMoves;
    let piece;
    for (let r = 0; r <= MAX_ROW; r++) {
        for (let c = 0; c <= MAX_COL; c++) {
            piece = pieceAt(r, c);
            // For every piece on the chessboard...
            if (piece !== EMPTY_CELL) {
                // ...owned by a specific player...
                if (piece.owner === player) {
                    // Get all possible moves for the piece...
                    arrPossibleMoves = getPossibleMovesForPiece(r, c);
                    for (let i = 0; i < arrPossibleMoves.length; i++) {
                        // If this piece has a legal move...
                        if(!arrPossibleMoves[i].putsOwnKingInCheck) {
                            return true;
                        }
                    }
                }
            }
        }
    }

    return false;
}

/** Returns the coordinates of the king of the specified color. */
function getKingPosition(player) {
    let piece;
    for (let r = 0; r <= MAX_ROW; r++) {
        for (let c = 0; c <= MAX_COL; c++) {
            piece = pieceAt(r, c);
            if (piece !== EMPTY_CELL) {
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
        if(chessboard[row][col] === EMPTY_CELL) {
            return EMPTY_CELL;
        } else {
            return {
                type: chessboard[row][col][0],
                owner: chessboard[row][col][1]
            };
        }
    }
}

/**
 * Chooses automatically which piece to move.
 * @param {*} aiColor Determines which pieces are owned by the AI
 */
function performAITurn(aiColor) {
    // AI checks all of its possible moves
    // Every move gets a value, which increases if an enemy piece can be captured...
    // ...and decreases if moving the piece there makes it risk capture
    // Ai chooses the move with the best value
    // If multiple moves have the same best value, one of those is chosen randomly
    // If AI's king is in check, the same logic applies,
    // AI can only perform valid moves and cannot put its king in check
    // Checkmate function is called before changing turn,
    // so AI will always have valid moves (except in case of stalemate)
    // TODO handle stalemate

    // TODO this should be outside the function
    const aiMoveValue = {};
    aiMoveValue[EMPTY_CELL] = 0;
    aiMoveValue[PieceTypeEnum.Pawn] = 1;
    aiMoveValue[PieceTypeEnum.Knight] = 2;
    aiMoveValue[PieceTypeEnum.Bishop] = 3;
    aiMoveValue[PieceTypeEnum.Rook] = 4;
    aiMoveValue[PieceTypeEnum.Queen] = 5;
    aiMoveValue[PieceTypeEnum.King] = 6;
    Object.freeze(aiMoveValue);

    let piece, target, arrPossibleMoves;
    
    let aiPossibleMoves = [];
    let moveValue, maxMoveValue = -100, minMoveValue = 100;

    for (let r = 0; r <= MAX_ROW; r++) {
        for (let c = 0; c <= MAX_COL; c++) {
            piece = pieceAt(r, c);
            if (piece !== EMPTY_CELL) {
                if (piece.owner === aiColor) {
                    // TODO: add a way to move away pieces if they risk being captured in their current position
                    arrPossibleMoves = getPossibleMovesForPiece(r, c);
                    arrPossibleMoves.forEach((move) => {
                        if(!move.putsOwnKingInCheck) {
                            // TODO pieceAt returns a string if it's an empty cell, you can't access the "type" property on that
                            target = pieceAt(move.row, move.col).type || EMPTY_CELL;
                            
                            moveValue = aiMoveValue[target];
                            // If the king can be captured, we don't care about consequences
                            if(target.type !== PieceTypeEnum.King) {
                                // Discourage sacrificing pieces by moving on a "capturable" square
                                if(doesMoveMakeSquareCapturable(r, c, move.row, move.col, move.row, move.col))
                                    moveValue -= aiMoveValue[piece.type];
                            }

                            aiPossibleMoves.push({
                                pieceRow: r, pieceCol: c,
                                targetRow: move.row, targetCol: move.col,
                                value: moveValue
                            });

                            if(moveValue > maxMoveValue) {
                                maxMoveValue = moveValue;
                            }
                            if(moveValue < minMoveValue) {
                                minMoveValue = moveValue;
                            }
                        }
                    });
                }
            }
        }
    }

    // Get just the moves with the best value, and choose one of those randomly
    let bestMoves = aiPossibleMoves.filter(v => v.value === maxMoveValue);
    console.log(`AI: Max value: ${maxMoveValue}. Moves with this value: ${bestMoves.length}`);
    let moveIndex = Math.floor(Math.random() * bestMoves.length);

    let bestMoveObj = bestMoves[moveIndex];
    console.log(`AI moves piece at ${bestMoveObj.pieceRow}-${bestMoveObj.pieceCol}`
        + ` to square ${bestMoveObj.targetRow}-${bestMoveObj.targetCol}. Move value: ${maxMoveValue}`)

    // TODO should disable graphic functions like setSelectionMarkerActive when AI is playing its turn
    handleCellSelected(bestMoveObj.pieceRow, bestMoveObj.pieceCol);
    handleCellSelected(bestMoveObj.targetRow, bestMoveObj.targetCol);
}

function canSquareBeCaptured(row, col, player) {
    if(typeof(player) === undefined) {
        console.error("Missing argument.");
        return undefined;
    }

    let possibleMoves;

    for (let r = 0; r <= MAX_ROW; r++) {
        for (let c = 0; c <= MAX_COL; c++) {
            // For every piece on the chessboard...
            if (pieceAt(r, c) !== EMPTY_CELL) {
                // ...owned by the specified player...
                if (pieceAt(r, c).owner === player) {
                    possibleMoves = getPossibleMovesForPiece(r, c);
                    // ...check all the cells that piece can be moved to
                    for (let i = 0; i < possibleMoves.length; i++) {
                        if (!possibleMoves[i].putsOwnKingInCheck) {
                            // If the piece can be moved to the selected square...
                            if(possibleMoves[i].row === row && possibleMoves[i].col === col) {
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

