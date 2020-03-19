"use strict";

const GRID_SIZE = 8;

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
