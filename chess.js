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

const piecesUnicode = {};
piecesUnicode[PlayerEnum.White] = {};
piecesUnicode[PlayerEnum.White][PieceTypeEnum.Pawn] = "♙";
piecesUnicode[PlayerEnum.White][PieceTypeEnum.Knight] = "♘";
piecesUnicode[PlayerEnum.White][PieceTypeEnum.Bishop] = "♗";
piecesUnicode[PlayerEnum.White][PieceTypeEnum.Rook] = "♖";
piecesUnicode[PlayerEnum.White][PieceTypeEnum.King] = "♔";
piecesUnicode[PlayerEnum.White][PieceTypeEnum.Queen] = "♕";
piecesUnicode[PlayerEnum.Black] = {};
piecesUnicode[PlayerEnum.Black][PieceTypeEnum.Pawn] = "♟";
piecesUnicode[PlayerEnum.Black][PieceTypeEnum.Knight] = "♞";
piecesUnicode[PlayerEnum.Black][PieceTypeEnum.Bishop] = "♝";
piecesUnicode[PlayerEnum.Black][PieceTypeEnum.Rook] = "♜";
piecesUnicode[PlayerEnum.Black][PieceTypeEnum.King] = "♚";
piecesUnicode[PlayerEnum.Black][PieceTypeEnum.Queen] = "♛";
Object.freeze(piecesUnicode);

const chessboardsList = {
    _8x8Standard: [
        ["r2", "h2", "b2", "q2", "k2", "b2", "h2", "r2"],
        ["p2", "p2", "p2", "p2", "p2", "p2", "p2", "p2"],
        ["  ", "  ", "  ", "  ", "  ", "  ", "  ", "  "],
        ["  ", "  ", "  ", "  ", "  ", "  ", "  ", "  "],
        ["  ", "  ", "  ", "  ", "  ", "  ", "  ", "  "],
        ["  ", "  ", "  ", "  ", "  ", "  ", "  ", "  "],
        ["p1", "p1", "p1", "p1", "p1", "p1", "p1", "p1"],
        ["r1", "h1", "b1", "q1", "k1", "b1", "h1", "r1"]
    ],
    _6x6SimplerNoKnights: [
        ["r2", "b2", "q2", "k2", "b2", "r2"],
        ["p2", "p2", "p2", "p2", "p2", "p2"],
        ["  ", "  ", "  ", "  ", "  ", "  "],
        ["  ", "  ", "  ", "  ", "  ", "  "],
        ["p1", "p1", "p1", "p1", "p1", "p1"],
        ["r1", "b1", "q1", "k1", "b1", "r1"]
    ],
    _5x5BabyChess: [
        ["k2", "q2", "b2", "h2", "r2"],
        ["p2", "p2", "p2", "p2", "p2"],
        ["  ", "  ", "  ", "  ", "  "],
        ["p1", "p1", "p1", "p1", "p1"],
        ["r1", "h1", "b1", "q1", "k1"]
    ],
    _4x5Silverman: [
        ["r2", "q2", "k2", "r2"],
        ["p2", "p2", "p2", "p2"],
        ["  ", "  ", "  ", "  "],
        ["p1", "p1", "p1", "p1"],
        ["r1", "q1", "k1", "r1"]
    ]
};
Object.freeze(chessboardsList);

const EMPTY_CELL = "  ";

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

class Chess {
    constructor() {
        this.MIN_ROWS = 2;
        this.MIN_COLS = 2;
    }

    /**
     * Sets game variables to their initial state.
     * @param {*} chessboard The chessboard configuration to use.
     * @param {*} aiEnabled Determines if the opponent will be controlled by AI.
     * @param {*} chessboard Determines which pieces are controlled by AI.
     */
    startGame(chessboard, aiEnabled, aiColor) {
        this.chessboard = chessboard;
        this.numRows = chessboard.length;
        this.numCols = chessboard[0].length;
        this.MAX_ROW = this.numRows - 1;
        this.MAX_COL = this.numCols - 1;

        this.aiEnabled = aiEnabled;
        this.aiColor = aiColor;
        // White is always the first to move
        this.activePlayer = PlayerEnum.White;
        this.gameState = GameStateEnum.SelectPiece;
        this.selectedPiece = { row: -1, col: -1 };
    }

    /** Returns the opponent of a specific player. */
    getEnemy(player) {
        return (player === PlayerEnum.White) ? PlayerEnum.Black : PlayerEnum.White;
    }

    // ******************
    //     CHESSBOARD
    // ******************

    /** Returns true if the row and column indexes passed as arguments
     * are in-bounds in the chessboard matrix. */
    inBounds(row, col) {
        return (row >= 0 && row <= this.MAX_ROW && col >= 0 && col <= this.MAX_COL);
    }

    /** Returns an object containing data for a specific piece,
     * or undefined if parameters are not valid. */
    pieceAt(row, col) {
        if(!this.inBounds(row, col)) {
            return undefined;
        } else {
            if(this.chessboard[row][col] === EMPTY_CELL) {
                return EMPTY_CELL;
            } else {
                return {
                    type: this.chessboard[row][col][0],
                    owner: this.chessboard[row][col][1]
                };
            }
        }
    }

    // ******************
    //   TURN HANDLING
    // ******************

    changeTurn() {
        this.gameState = GameStateEnum.SelectPiece;
        this.activePlayer = this.getEnemy(this.activePlayer);
        setPlayerTurnText(this.activePlayer);
    
        if(this.isAITurn())
            performAITurn(this.activePlayer);
    }

    isAITurn() {
        return this.aiEnabled && this.activePlayer === this.aiColor;
    }

    handleCellSelected(row, col) {
        if(this.gameState === GameStateEnum.GameOver)
            return;
    
        if(this.gameState === GameStateEnum.SelectPiece) {
            if(this.pieceAt(row, col) !== EMPTY_CELL) {
                if(this.pieceAt(row, col).owner === this.activePlayer) {
                    if(!this.isAITurn())
                        handleSelectedOwnPiece(row, col, this.getPossibleMovesForPiece(row, col));
    
                    this.selectedPiece.row = row;
                    this.selectedPiece.col = col;
                    this.gameState = GameStateEnum.SelectDestination;
                }
            }
        } else if(this.gameState === GameStateEnum.SelectDestination) {
            // If user clicks again on the piece they're trying to move, do nothing
            if(row === this.selectedPiece.row && col === this.selectedPiece.col) {
                return;
            }
            
            let arrPossibleMoves = this.getPossibleMovesForPiece(this.selectedPiece.row, this.selectedPiece.col);

            if(!this.isAITurn())
                handleSelectedDestinationForPiece(this.selectedPiece.row, this.selectedPiece.col, arrPossibleMoves);
            
            let isValidMove = false;
            // Check if the selected piece can be moved in the clicked cell
            for(let i=0; i<arrPossibleMoves.length; i++) {
                if(arrPossibleMoves[i].row === row
                        && arrPossibleMoves[i].col === col
                        && !arrPossibleMoves[i].putsOwnKingInCheck) {
                    
                    isValidMove = true;
                    break;
                }
            }
    
            if(isValidMove) {
                this.chessboard[row][col] = this.chessboard[this.selectedPiece.row][this.selectedPiece.col];
                this.chessboard[this.selectedPiece.row][this.selectedPiece.col] = EMPTY_CELL;
    
                handlePieceMoved(this.selectedPiece.row, this.selectedPiece.col, row, col);

                let piece = this.pieceAt(row, col);
                if(piece.type === PieceTypeEnum.Pawn) {
                    let promotionWhite = (piece.owner === PlayerEnum.White && row === 0)
                    let promotionBlack = (piece.owner === PlayerEnum.Black && row === this.MAX_ROW);
                    if(promotionWhite || promotionBlack) {
                        let promotionType = PieceTypeEnum.Queen;
                        // TODO allow choosing what piece to promote to
                        this.chessboard[row][col] = `${promotionType}${piece.owner}`;

                        handlePiecePromoted(row, col, piece.owner, promotionType);
                    }
                }
    
                let enemyPlayer = this.getEnemy(this.activePlayer);
                let enemyKingInCheck = this.isKingInCheck(enemyPlayer);
                
                if(this.hasLegalMoves(enemyPlayer)) {
                    if(enemyKingInCheck) {
                        handleTurnEnd(this.activePlayer, "check");
                    } else {
                        handleTurnEnd(this.activePlayer, "");
                    }
                } else {
                    this.gameState = GameStateEnum.GameOver;
    
                    if(enemyKingInCheck) {
                        handleTurnEnd(this.activePlayer, "checkmate");
                    }
                    else {
                        handleTurnEnd(this.activePlayer, "stalemate");
                    }
                }
    
                if(this.gameState !== GameStateEnum.GameOver) {
                    this.changeTurn();
                }
            } else {
                this.gameState = GameStateEnum.SelectPiece;
                this.handleCellSelected(row, col);
            }
        }
    }

    // ****************************
    //   PIECES MOVEMENT HANDLING
    // ****************************

    /**
     * Returns an array representing all the possible moves for a specific piece.
     * @param {*} row 
     * @param {*} col 
     * @param {boolean} checkLegal Determines whether to check if moves are valid.
     * Prevents the function from calling itselt infinitely when performing the validation check.
     */
    getPossibleMovesForPiece(row, col, checkLegal = true) {
        if(!this.inBounds(row, col)) {
            console.error("Invalid row or column value");
            return undefined;
        }
        
        let pieceToMove = this.pieceAt(row, col);

        if(pieceToMove === EMPTY_CELL) {
            console.error("Cannot get moves for an empty cell");
            return null;
        }
        
        let arrMoves = [];

        switch(pieceToMove.type) {
            case PieceTypeEnum.Pawn: arrMoves = this.getPawnMoves(row, col); break;
            case PieceTypeEnum.Knight: arrMoves = this.getKnightMoves(row, col); break;
            case PieceTypeEnum.Bishop: arrMoves = this.getBishopMoves(row, col); break;
            case PieceTypeEnum.Rook: arrMoves = this.getRookMoves(row, col); break;
            case PieceTypeEnum.King: arrMoves = this.getKingMoves(row, col); break;
            case PieceTypeEnum.Queen: arrMoves = this.getRookMoves(row, col).concat(this.getBishopMoves(row, col)); break;
            default: console.error("Unrecognized piece type: " + pieceToMove.type);
        }
        
        if(checkLegal) {
            for(let i = 0; i < arrMoves.length; i++) {
                if(this.doesMovePutKingInCheck(row, col, arrMoves[i].row, arrMoves[i].col)) {
                    arrMoves[i].setIllegal();
                }
            }
        }

        return arrMoves;
    }

    /** Returns whether moving a piece on a certain square puts its king in check. */
    doesMovePutKingInCheck(pieceRow, pieceCol, destRow, destCol) {
        let pieceOwner = this.chessboard[pieceRow][pieceCol][1];
        let destinationCellContents = this.chessboard[destRow][destCol];
        // Move piece on destination square
        this.chessboard[destRow][destCol] = this.chessboard[pieceRow][pieceCol];
        this.chessboard[pieceRow][pieceCol] = EMPTY_CELL;

        let kingInCheck = this.isKingInCheck(pieceOwner);

        // This function uses the original chessboard to avoid creating
        // a copy of the chessboard matrix on every call
        this.chessboard[pieceRow][pieceCol] = this.chessboard[destRow][destCol];
        this.chessboard[destRow][destCol] = destinationCellContents;

        return kingInCheck;
    }

    /** Returns whether a king can be captured by an enemy piece. */
    isKingInCheck(kingOwner) {
        let arrPossibleMoves;
        let enemyRow, enemyCol;

        for (let r = 0; r <= this.MAX_ROW; r++) {
            for (let c = 0; c <= this.MAX_COL; c++) {
                // For every piece on the chessboard...
                if (this.pieceAt(r, c) !== EMPTY_CELL) {
                    // ...owned by the king's enemy...
                    if (this.pieceAt(r, c).owner !== kingOwner) {
                        // Last parameter is false because is doesn't matter
                        // if the enemy will put their king to risk,
                        // if they capture the enemy king they win
                        arrPossibleMoves = this.getPossibleMovesForPiece(r, c, false);
                        // ...check all the cells that piece can be moved to
                        for (let i = 0; i < arrPossibleMoves.length; i++) {
                            // If the piece can capture another piece...
                            if (arrPossibleMoves[i].isEnemy) {
                                enemyRow = arrPossibleMoves[i].row;
                                enemyCol = arrPossibleMoves[i].col;
                                // ...and that piece is the king...
                                if (this.pieceAt(enemyRow, enemyCol).type === PieceTypeEnum.King) {
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

    // TODO: this is used only to differentiate checkmate from stalemate, 
    // should find a way to recycle other functions to do this
    /**
     * Returns whether a player has legal moves.
     * @param {*} player Player to check.
     */
    hasLegalMoves(player) {
        let arrPossibleMoves, piece;

        for (let r = 0; r <= this.MAX_ROW; r++) {
            for (let c = 0; c <= this.MAX_COL; c++) {
                piece = this.pieceAt(r, c);
                // For every piece on the chessboard...
                if (piece !== EMPTY_CELL) {
                    // ...owned by a specific player...
                    if (piece.owner === player) {
                        // Get all possible moves for the piece...
                        arrPossibleMoves = this.getPossibleMovesForPiece(r, c);
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

    // *******************
    //   PIECES MOVEMENT
    // *******************

    getPawnMoves(row, col) {
        let pieceToMove = this.pieceAt(row, col);
        // White pawns can only go up, black pawns can only go down
        let direction = (pieceToMove.owner === PlayerEnum.White) ? -1 : 1;
        let arrMoves = [];
        let targetCell;
        let r = row + (1 * direction);
    
        // If pawn can go one step forward
        if(this.inBounds(r, col)) {
            // If cell forward-left has enemy
            if(col > 0) {
                targetCell = this.pieceAt(r, col-1);
                if(targetCell !== EMPTY_CELL && targetCell.owner !== pieceToMove.owner) {
                    arrMoves.push(new PossibleMove(r, col-1, true));
                }
            }
            // If cell forward-right has enemy
            if(col < this.MAX_COL) {
                targetCell = this.pieceAt(r, col+1);
                if(targetCell !== EMPTY_CELL && targetCell.owner !== pieceToMove.owner) {
                    arrMoves.push(new PossibleMove(r, col+1, true));
                }
            }
    
            // If cell forward is free
            targetCell = this.pieceAt(r, col);
            if(targetCell === EMPTY_CELL) {
                arrMoves.push(new PossibleMove(r, col, false));
    
                // TODO This will have to be changed when implementing custom chessboard
                let startingRow = (pieceToMove.owner === PlayerEnum.White) ? this.MAX_ROW-1 : 1;
                
                // If the pawn is at its starting position and has two free cells fprward
                if(row === startingRow) {
                    r = row + 2 * direction;
                    if(this.pieceAt(r, col) === EMPTY_CELL)
                        arrMoves.push(new PossibleMove(r, col, false));
                }
            }
        }
    
        return arrMoves;
    }

    getKnightMoves(row, col) {
        let arrMoves = [];
        let pieceToMove = this.pieceAt(row, col);
        let target;
    
        const knightCheck = (r, c) => {
            if(this.inBounds(r, c)) {
                target = this.pieceAt(r, c);
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
    
    getBishopMoves(row, col) {
        let arrMoves = [];
        let pieceToMove = this.pieceAt(row, col);
        let r, c;
            
        // Up-left
        r = row-1;
        c = col-1;
        while(this.inBounds(r, c)) {
            if(this.pieceAt(r, c) === EMPTY_CELL) {
                arrMoves.push(new PossibleMove(r, c, false));
            } else {
                if(this.pieceAt(r, c).owner !== pieceToMove.owner) {
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
        while(this.inBounds(r, c)) {
            if(this.pieceAt(r, c) === EMPTY_CELL) {
                arrMoves.push(new PossibleMove(r, c, false));
            } else {
                if(this.pieceAt(r, c).owner !== pieceToMove.owner) {
                    arrMoves.push(new PossibleMove(r, c, true));
                }
                break;
            }
            r--, c++;
        }
        // Bottom-left
        r = row+1;
        c = col-1;
        while(this.inBounds(r, c)) {
            if(this.pieceAt(r, c) === EMPTY_CELL) {
                arrMoves.push(new PossibleMove(r, c, false));
            } else {
                if(this.pieceAt(r, c).owner !== pieceToMove.owner) {
                    arrMoves.push(new PossibleMove(r, c, true));
                }
                break;
            }
            r++, c--;
        }
        // Bottom-right
        r = row+1;
        c = col+1;
        while(this.inBounds(r, c)) {
            if(this.pieceAt(r, c) === EMPTY_CELL) {
                arrMoves.push(new PossibleMove(r, c, false));
            } else {
                if(this.pieceAt(r, c).owner !== pieceToMove.owner) {
                    arrMoves.push(new PossibleMove(r, c, true));
                }
                break;
            }
            r++, c++;
        }
    
        return arrMoves;
    }

    getRookMoves(row, col) {
        let arrMoves = [];
        let pieceToMove = this.pieceAt(row, col);
        let r, c;
    
        // Bottom
        r = row+1;
        while(r <= this.MAX_ROW) {
            // If cell is empty
            if(this.chessboard[r][col] === EMPTY_CELL) {
                arrMoves.push(new PossibleMove(r, col, false));
            } else {
                // If cell contains an enemy unit
                if(this.chessboard[r][col][1] !== pieceToMove.owner) {
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
            if(this.chessboard[r][col] === EMPTY_CELL) {
                arrMoves.push(new PossibleMove(r, col, false));
            } else {
                if(this.chessboard[r][col][1] !== pieceToMove.owner) {
                    arrMoves.push(new PossibleMove(r, col, true));
                }
                break;
            }
            r--;
        }
    
        // Right
        c = col+1;
        while(c <= this.MAX_COL) {
            if(this.chessboard[row][c] === EMPTY_CELL) {
                arrMoves.push(new PossibleMove(row, c, false));
            } else {
                if(this.chessboard[row][c][1] !== pieceToMove.owner) {
                    arrMoves.push(new PossibleMove(row, c, true));
                }
                break;
            }
            c++;
        }
    
        // Left
        c = col-1;
        while(c >= 0) {
            if(this.chessboard[row][c] === EMPTY_CELL) {
                arrMoves.push(new PossibleMove(row, c, false));
            } else {
                if(this.chessboard[row][c][1] !== pieceToMove.owner) {
                    arrMoves.push(new PossibleMove(row, c, true));
                }
                break;
            }
            c--;
        }
    
        return arrMoves;
    }
    
    getKingMoves(row, col) {
        let arrMoves = [];
        let pieceToMove = this.pieceAt(row, col);
        let r, c;
            
        r = row-1;
        if(r >= 0) {
            // Up
            c = col;
            if(this.pieceAt(r, c) === EMPTY_CELL) {
                arrMoves.push(new PossibleMove(r, c, false));
            } else if(this.pieceAt(r, c).owner !== pieceToMove.owner) {
                arrMoves.push(new PossibleMove(r, c, true));
            }
    
            // Up left
            c = col-1;
            if(c >= 0) {
                if(this.pieceAt(r, c) === EMPTY_CELL) {
                    arrMoves.push(new PossibleMove(r, c, false));
                } else if(this.pieceAt(r, c).owner !== pieceToMove.owner) {
                    arrMoves.push(new PossibleMove(r, c, true));
                }
            }
    
            // Up right
            c = col+1;
            if(c <= this.MAX_COL) {
                if(this.pieceAt(r, c) === EMPTY_CELL) {
                    arrMoves.push(new PossibleMove(r, c, false));
                } else if(this.pieceAt(r, c).owner !== pieceToMove.owner) {
                    arrMoves.push(new PossibleMove(r, c, true));
                }
            }
        }
    
        r = row+1;
        if(r <= this.MAX_ROW) {
            // Bottom
            c = col;
            if(this.pieceAt(r, c) === EMPTY_CELL) {
                arrMoves.push(new PossibleMove(r, c, false));
            } else if(this.pieceAt(r, c).owner !== pieceToMove.owner) {
                arrMoves.push(new PossibleMove(r, c, true));
            }
    
            // Bottom left
            c = col-1;
            if(c >= 0) {
                if(this.pieceAt(r, c) === EMPTY_CELL) {
                    arrMoves.push(new PossibleMove(r, c, false));
                } else if(this.pieceAt(r, c).owner !== pieceToMove.owner) {
                    arrMoves.push(new PossibleMove(r, c, true));
                }
            }
    
            // Bottom right
            c = col+1;
            if(c <= this.MAX_COL) {
                if(this.pieceAt(r, c) === EMPTY_CELL) {
                    arrMoves.push(new PossibleMove(r, c, false));
                } else if(this.pieceAt(r, c).owner !== pieceToMove.owner) {
                    arrMoves.push(new PossibleMove(r, c, true));
                }
            }
        }
    
        // Left
        r = row;
        c = col-1;
        if(c >= 0) {
            if(this.pieceAt(r, c) === EMPTY_CELL) {
                arrMoves.push(new PossibleMove(r, c, false));
            } else if(this.pieceAt(r, c).owner !== pieceToMove.owner) {
                arrMoves.push(new PossibleMove(r, c, true));
            }
        }
        // Right
        c = col+1;
        if(c <= this.MAX_COL) {
            if(this.pieceAt(r, c) === EMPTY_CELL) {
                arrMoves.push(new PossibleMove(r, c, false));
            } else if(this.pieceAt(r, c).owner !== pieceToMove.owner) {
                arrMoves.push(new PossibleMove(r, c, true));
            }
        }
    
        return arrMoves;
    }
}

let messageTurnElem;
let messageWarningElem;

let chess = new Chess();

document.body.onload = function() {
    messageTurnElem = document.getElementById("msg-turn");
    messageWarningElem = document.getElementById("msg-warning");
    
    document.getElementById("opponent-choice-human").onclick = () => {
        document.getElementById("menu-section-color").classList.add("hidden");
    };
    document.getElementById("opponent-choice-ai").onclick = () => {
        document.getElementById("menu-section-color").classList.remove("hidden");
    };

    document.querySelector("form").onsubmit = handleMenuFormSubmit;
}

function handleMenuFormSubmit(event) {
    event.preventDefault();

    let form = event.currentTarget;
    form.classList.add("hidden");

    document.getElementById("grid-container").classList.remove("hidden");
    document.getElementById("messages-container").classList.remove("hidden");

    let choicePlayerColor, choiceAIEnabled, choiceChessboard;
    // https://stackoverflow.com/a/26236365
    // https://developer.mozilla.org/en-US/docs/Web/API/FormData/entries
    for(const input of form.elements) {
        if(input.type == "radio" && input.checked) {
            switch(input.name) {
                case "options-opponent":
                    switch(input.id) {
                        case "opponent-choice-human": choiceAIEnabled = false; break;
                        case "opponent-choice-ai": choiceAIEnabled = true; break;
                        default: console.error(`Option ${input.id} not recognized.`); break;
                    }
                    break;
                case "options-color":
                    switch(input.id) {
                        case "color-choice-white": choicePlayerColor = PlayerEnum.White; break;
                        case "color-choice-black": choicePlayerColor = PlayerEnum.Black; break;
                        default: console.error(`Option ${input.id} not recognized.`); break;
                    }
                    break;
                case "options-chessboard":
                    switch(input.id) {
                        case "chessboard-standard": choiceChessboard = chessboardsList._8x8Standard; break;
                        case "chessboard-6x6NoKnights": choiceChessboard = chessboardsList._6x6SimplerNoKnights; break;
                        case "chessboard-5x5babychess": choiceChessboard = chessboardsList._5x5BabyChess; break;
                        case "chessboard-4x5Silverman": choiceChessboard = chessboardsList._4x5Silverman; break;
                        default: console.error(`Option ${input.id} not recognized.`); break;
                    }
                    break;
                default:
                    console.error(`Option ${input.name} not recognized.`);
                    break;
            }
        }
    }

    let aiColor = chess.getEnemy(choicePlayerColor);
    chess.startGame(choiceChessboard, choiceAIEnabled, aiColor);
    
    initUI();

    if(chess.isAITurn())
        performAITurn(chess.activePlayer);
}

function initUI() {
    // TODO: chessboard.numRows
    let table = createChessboardTableHTML(chess.numRows, chess.numCols);
    document.getElementById("grid-container").appendChild(table);

    setPlayerTurnText(chess.activePlayer);
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

            let piece = chess.pieceAt(row, col);
            if(piece !== EMPTY_CELL) {
                
                let span = document.createElement("span");
                span.innerText = piecesUnicode[piece.owner][piece.type];

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

    chess.handleCellSelected(row, col);
}


function handleSelectedOwnPiece(row, col, possibleMoves) {
    //console.log(`Selected cell ${row}-${col}. Piece type: ${pieceAt(row, col).type}`);
    setSelectionMarkerActive(row, col, true);
    setDisplayDestinationActive(possibleMoves, true);
}

function handleSelectedDestinationForPiece(pieceRow, pieceCol, possibleMoves) {
    setSelectionMarkerActive(pieceRow, pieceCol, false);
    setDisplayDestinationActive(possibleMoves, false);
}

function handlePieceMoved(pieceRow, pieceCol, targetRow, targetCol) {
    let selectedPieceHTMLCell = getHTMLCellByCoords(pieceRow, pieceCol)
    getHTMLCellByCoords(targetRow, targetCol).innerHTML = selectedPieceHTMLCell.innerHTML;
    selectedPieceHTMLCell.innerHTML = "";
}

// Visually replaces a pawn with another piece
function handlePiecePromoted(row, col, pieceColor, promotionType) {
    getHTMLCellByCoords(row, col).firstChild.innerText = piecesUnicode[pieceColor][promotionType];
}

function handleTurnEnd(activePlayer, turnEndType) {
    switch(turnEndType) {
        case "":
            messageWarningElem.innerText = "";
            break;

        case "check":
            // The "⚠" emoji defaults to text on some browsers
            // (i.e. Chrome on Windows 10), unless followed by U+FE0F
            // which forces it to be displayed as emoji
            // https://emojipedia.org/emoji/%E2%9A%A0/
            // https://emojipedia.org/variation-selector-16/
            messageWarningElem.innerHTML = (activePlayer === PlayerEnum.White)
                ? "⚠&#xFE0F; Black king check! ⚠&#xFE0F;"
                : "⚠&#xFE0F; White king check! ⚠&#xFE0F;";
            break;

        case "checkmate":
            messageTurnElem.innerText = (activePlayer === PlayerEnum.White)
                ? "🏆 White wins! 🏆"
                : "🏆 Black wins! 🏆";
            messageWarningElem.innerText = "Checkmate.";
            break;

        case "stalemate":
            messageTurnElem.innerText = "🤝 It's a draw! 🤝";
            messageWarningElem.innerText = (activePlayer === PlayerEnum.White)
                ? "Stalemate. Black cannot move."
                : "Stalemate. White cannot move.";
            break;

        default:
            console.error("Unrecognized game over type.");
    }
}

function setSelectionMarkerActive(row, col, display) {
    if(!chess.inBounds(row, col)) {
        console.error("Invalid arguments.");
        return;
    }

    let cellElement = getHTMLCellByCoords(row, col);
    if(display)
        cellElement.classList.add("cell-selected");
    else
        cellElement.classList.remove("cell-selected");
}

/** Shows a message saying which player should move. */
function setPlayerTurnText(player) {
    if(player === PlayerEnum.White)
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

/** Returns whether moving a piece puts a square in danger. */
function doesMoveMakeSquareCapturable(pieceRow, pieceCol, destRow, destCol, squareRow, squareCol) {
    let enemyPlayer = chess.getEnemy(chess.pieceAt(pieceRow, pieceCol).owner);
    let destinationCellContents = chess.chessboard[destRow][destCol];
    // Move piece on destination square
    chess.chessboard[destRow][destCol] = chess.chessboard[pieceRow][pieceCol];
    chess.chessboard[pieceRow][pieceCol] = EMPTY_CELL;

    let result = canSquareBeCaptured(squareRow, squareCol, enemyPlayer);

    // This function uses the original chessboard to avoid creating
    // a copy of the chessboard matrix on every call
    chess.chessboard[pieceRow][pieceCol] = chess.chessboard[destRow][destCol];
    chess.chessboard[destRow][destCol] = destinationCellContents;

    return result;
}

function coordsToId(row, col) {
    return `cell-${row}-${col}`;
}

function getHTMLCellByCoords(row, col) {
    return document.getElementById(coordsToId(row, col));
}


/** Returns the coordinates of the king of the specified color. */
function getKingPosition(player) {
    let piece;
    for (let r = 0; r <= chess.MAX_ROW; r++) {
        for (let c = 0; c <= chess.MAX_COL; c++) {
            piece = chess.pieceAt(r, c);
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
    let moveValue, maxMoveValue = -100;

    for (let r = 0; r <= chess.MAX_ROW; r++) {
        for (let c = 0; c <= chess.MAX_COL; c++) {
            piece = chess.pieceAt(r, c);
            if (piece !== EMPTY_CELL) {
                if (piece.owner === aiColor) {
                    // TODO: add a way to move away pieces if they risk being captured in their current position
                    arrPossibleMoves = chess.getPossibleMovesForPiece(r, c);
                    arrPossibleMoves.forEach((move) => {
                        if(!move.putsOwnKingInCheck) {
                            // TODO chess.pieceAt returns a string if it's an empty cell, you can't access the "type" property on that
                            target = chess.pieceAt(move.row, move.col).type || EMPTY_CELL;
                            
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
    chess.handleCellSelected(bestMoveObj.pieceRow, bestMoveObj.pieceCol);
    chess.handleCellSelected(bestMoveObj.targetRow, bestMoveObj.targetCol);
}

function canSquareBeCaptured(row, col, player) {
    if(typeof(player) === undefined) {
        console.error("Missing argument.");
        return undefined;
    }

    let possibleMoves;

    for (let r = 0; r <= chess.MAX_ROW; r++) {
        for (let c = 0; c <= chess.MAX_COL; c++) {
            // For every piece on the chessboard...
            if (chess.pieceAt(r, c) !== EMPTY_CELL) {
                // ...owned by the specified player...
                if (chess.pieceAt(r, c).owner === player) {
                    possibleMoves = chess.getPossibleMovesForPiece(r, c);
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
