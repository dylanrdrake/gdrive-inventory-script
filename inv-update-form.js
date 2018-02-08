//
function getLastFlavorRow(invDataRange) {
  var lastFlavorRow = 1;
  for (var r = 1; r < invDataRange.getLastRow()+1; r++) {
    lastFlavorRow = r;
    if (invDataRange.getCell(r, 1).getValue() == '') {
      lastFlavorRow = invDataRange.getCell(r, 1).getRow() - 1;
    }
  }
  return lastFlavorRow;
}


//
function getLastFlavorCol(invDataRange) {
  var lastFlavorCol = 1;
  for (var c = 1; c < invDataRange.getLastColumn()+1; c++) {
    lastFlavorCol = c;
    if (invDataRange.getCell(1, c).getValue() == '') {
      lastFlavorCol = invDataRange.getCell(1, c).getCol() - 1;
    }
  }
  return lastFlavorCol;
}




// Triggered by form submission
function UpdateInventory(e) {
  invSS = SpreadsheetApp.openById('1LhGIlUcTCeRekIpakHLgLmi86-Y18Bib21O8tU2Rv94');
  invSheet = invSS.getSheetByName('Inventory');
  prodSheet = invSS.getSheetByName('Production');
  logSheet = invSS.getSheetByName('Logs');

  // Get response Data
  responseItems = e.response.getItemResponses();
  var timestamp = e.response.getTimestamp().toLocaleDateString() + ' ' +
                  e.response.getTimestamp().toLocaleTimeString();
  var updateLocation;
  var updateType;
  var deliveryLoc = '';
  var flavorData = {};
  var caseTotal = 0;
  for (var i = 0; i < responseItems.length; i++) {

    if (responseItems[i].getItem().getTitle() == 'Location') {
      updateLocation = responseItems[i].getResponse();
    } else if (responseItems[i].getItem().getTitle() == 'Update Type') {
      updateType = responseItems[i].getResponse();
    } else if (responseItems[i].getItem().getTitle() == 'Delivery Location') {
      deliveryLoc = responseItems[i].getResponse();
    } else {
      if (responseItems[i].getResponse() != '') {
        flavorData[responseItems[i].getItem().getTitle()] = parseInt(responseItems[i].getResponse());
        caseTotal += flavorData[responseItems[i].getItem().getTitle()] = parseInt(responseItems[i].getResponse());
      }
    }

  }


  // Get spreadsheet inventory data
  oldInvDataRange = invSheet.getDataRange();
  oldInvData = {};
  var rows = getLastFlavorRow(oldInvDataRange);
  var cols = getLastFlavorCol(oldInvDataRange);
  for (var i = 2; i < rows+1; i++) {
    var flavor = oldInvDataRange.getCell(i, 1).getValue();
    oldInvData[flavor] = {};
    for (var j = 2; j < cols+1; j++) {
      var location = oldInvDataRange.getCell(1, j).getValue();
      oldInvData[flavor][location] = 0
      var inv = parseInt(oldInvDataRange.getCell(i, j).getValue());
      oldInvData[flavor][location] = inv;
    }
  }


  // Create new inventory
  for (var key in flavorData) {

    // Update inventory
    if (key in oldInvData) {
      if (updateType == 'Production' || updateType == 'Receive') {
        oldInvData[key][updateLocation] += flavorData[key]
      } else if (updateType == 'Delivery Pull' || updateType == 'Store Pull') {
        oldInvData[key][updateLocation] -= flavorData[key]
      } else if (updateType == 'OVERWRITE') {
        oldInvData[key][updateLocation] = flavorData[key]
      }
    }

  }


  // Create and insert new Log records
  newRecord = [ [timestamp, updateLocation, updateType, deliveryLoc, flavorData] ];
  logSheet.insertRowBefore(2);
  logSheet.getRange('a2:e2').setValues(newRecord);

  // Create and insert new Product Log record
  if (updateType == 'Production') {
    newProdRec = [ [timestamp, updateLocation, flavorData, caseTotal] ];
    prodSheet.insertRowBefore(2);
    prodSheet.getRange('a2:d2').setValues(newProdRec);
  }


  // Clear old data
  invSheet.getRange('a2:d'+getLastFlavorRow(oldInvDataRange)+1).clearContent();
  newContentRows = [];

  // Create updated data
  for (key in oldInvData) {
    newContentCol = [key, oldInvData[key]['GPT'], oldInvData[key]['Dock'], oldInvData[key]['HS']];
    newContentRows.push(newContentCol);
  }

  // Insert updated data
  rangeEnd = String(2+newContentRows.length-1);
  invSheet.getRange('a2:d'+rangeEnd).setValues(newContentRows);

}
