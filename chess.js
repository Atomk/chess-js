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
    let grid = createGridElement(GRID_SIZE);
    document.getElementById("grid-container").appendChild(grid);
}

function createGridElement(gridSize) {
    let table = document.createElement("table");

    // Determines color of the first cell in the row
    // The cell up left should be white
    let firstTRCellWhite = true;

    for(let row = 0; row < gridSize; row++) {
        let tr = document.createElement("tr");
        
        for(let col = 0; col < gridSize; col++) {
            let td = document.createElement("td");
            if(chessboard[row][col] != "") {
                td.innerText = chessboard[row][col].substr(0, 1);
            }

            // Give the right color to the cell
            if(firstTRCellWhite)
                td.className = col % 2 === 0 ? "cell-white" : "cell-black";
            else
                td.className = col % 2 === 0 ? "cell-black" : "cell-white";

            tr.appendChild(td);
        }
        
        table.appendChild(tr);
        firstTRCellWhite = !firstTRCellWhite;
    }

    return table;
}
