"use strict";

const GRID_SIZE = 8;

let chessboard = [
    ["t2", "c2", "a2", "k2", "q2", "a2", "c2", "t2"],
    ["p2", "p2", "p2", "p2", "p2", "p2", "p2", "p2"],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["p1", "p1", "p1", "p1", "p1", "p1", "p1", "p1"],
    ["t1", "c1", "a1", "q1", "k1", "a1", "c1", "t1"]
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
