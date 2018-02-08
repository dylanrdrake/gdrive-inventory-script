//
function getLastItemRow(invDataRange) {
  var lastItemRow = 1;
  for (var r = 1; r < invDataRange.getLastRow()+1; r++) {
    lastItemRow = r;
    if (invDataRange.getCell(r, 1).getValue() == '') {
      lastItemRow = invDataRange.getCell(r, 1).getRow() - 1;
    }
  }
  return lastItemRow;
}


//
function sortItems() {
  items = invForm.getItems();

  itemIds = {};
  itemTitles = [];
  for (var i = 0; i < items.length; i++) {
    item = items[i];
    if (item.getType() == 'TEXT') {
      itemIds[item.getTitle()] = item.getId();
      itemsTitles.push(item.getTitle());
    }
  }

  sortedTitles = itemTitles.slice().sort();

  for (var j = 0; j < itemTitles.length; j++) {
    incorrectItem = itemTitles[j];
    correctItem = sortedTitles[j];
    incorrectItemId = itemIds[incorrectItem];
    invForm.getItemById(incorrectItemId).setTitle(correctItem);
  }

}


//
function createNewItem(e) {
  invForm = FormApp.openById('<inventory form google drive id>')
  invSS = SpreadsheetApp.openById('<inventory spreadsheet google drive id>');
  invSheet = invSS.getSheetByName('Inventory');
  newItemResp = e.response.getItemResponses()[0].getResponse();

  newItem = invForm.addTextItem();

  newItem.setTitle(newItemResp);

  newItemVal = FormApp.createTextValidation()
    .requireWholeNumber()
    .build();

  newItem.setValidation(newItemVal);

  sortItems();

  // Insert new flavor in Inventory spreadsheet
  itemRange = invSheet.getDataRange();
  newItemRow = getLastItemRow(itemRange) + 1;
  newItemData = [ [newItemResp, 0, 0, 0, '=b'+newItemRow+'+c'+newItemRow+'+d'+newItemRow] ];
  invSheet.getRange('a'+newItemRow+':e'+newItemRow).setValues(newItemData);

  // Sort flavors in Inventory spreadsheet
  invSheet.sort(1, true);

}

