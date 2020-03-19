document.body.onload = function() {
    let grid = createGridElement();
    document.getElementById("grid-container").appendChild(grid);
}

function createGridElement() {
    let gridSize = 8;
    let table = document.createElement("table");

    // Determines color of the first cell in the row
    // The cell up left should be white
    let firstTRCellWhite = true;

    for(let y = 0; y < gridSize; y++) {
        let tr = document.createElement("tr");
        
        for(let x = 0; x < gridSize; x++) {
            let td = document.createElement("td");

            // Give the right color to the cell
            if(firstTRCellWhite)
                td.className = x % 2 === 0 ? "cell-white" : "cell-black";
            else
                td.className = x % 2 === 0 ? "cell-black" : "cell-white";

            tr.appendChild(td);
        }
        
        table.appendChild(tr);
        firstTRCellWhite = !firstTRCellWhite;
    }

    return table;
}