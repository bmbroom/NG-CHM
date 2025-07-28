(function () {
  "use strict";
  NgChm.markFile();

  //Define Namespace for NgChm SearchState
  const SRCHSTATE = NgChm.createNS("NgChm.SRCHSTATE");

  const UTIL = NgChm.importNS("NgChm.UTIL");
  const MAPREP = NgChm.importNS("NgChm.MAPREP");

  class SearchState {
    constructor () {
      // searchResults maintains the database of all search results
      // and/or manual selections on each axis. e.g. searchResults["Row"]
      // is an object that contains the search results for the row axis.
      // Each axis object contains an entry with value 1 for the indices
      // of all selected items and no entry for all other items.
      // e.g.  if rows 2, 4, and 6 are selected,
      //     searchResults["Row"] == { "2": 1, "4": 1, "6": 1 }.
      //
      // Initialize this to avoid bug #320 when loading old maps via shaid
      this.searchResults = { Row: {}, Column: {}, RowCovar: {}, ColumnCovar: {} };

      // currentSearchItems contains the axis and index of the current
      // search item (used by the forward and backward search arrow buttons)
      // for each mapItem.
      this.currentSearchItems = new WeakMap();

      // discCovStates stores for each axis the selected options in the select drop down
      // for a discrete covariate.  Used to preserve selection state of the drop down
      // as the user switches between label and covariate searches and axis changes.
      this.discCovStates = {};

      // gapItems is a cache of which label indices are gap items.  It is
      // not directly affect user-visible state.  It is used to prevent
      // gapItems from being selected.
      this.gapItems = {};
    }
  }
  SRCHSTATE.SearchState = SearchState;

  /***********************************************************
   * SEARCH FUNCTIONS SECTION
   * These functions can be called from any module.
   ***********************************************************/

  SearchState.prototype.getSearchSaveState = function () {
    const state = {};
    state["row"] = this.getAxisSearchResults("Row");
    state["col"] = this.getAxisSearchResults("Column");
    return state;
  };

  SRCHSTATE.getDiscreteState = function (axis) {
    return this.discCovStates.hasOwnProperty(axis) ? this.discCovStates[axis] : null;
  };

  /**********************************************************************************
   * FUNCTION - getCurrentSearchItem: This function returns the current search item.
   **********************************************************************************/
  SearchState.prototype.getCurrentSearchItem = function (mapItem) {
    return this.currentSearchItems.get(mapItem) || {};
  };

  /**********************************************************************************
   * FUNCTION - getAxisSearchResults: get indices of all search results on the
   * specified axis.
   ***********************************************************************************/
  SearchState.prototype.getAxisSearchResults = function (axis) {
    if (MAPREP.isRow(axis)) axis = "Row";
    if (axis == "column") axis = "Column";
    return Object.keys(this.searchResults[axis]).map((val) => +val);
  };

  // FIXME: BMB: Rename this function or the one above.
  SearchState.prototype.getSearchResults = function (axis) {
    return this.searchResults[axis];
  };

  /*********************************************************************************************
   * FUNCTION:  labelIndexInSearch - Returns true iff index is included in axis search results.
   *********************************************************************************************/
  SearchState.prototype.labelIndexInSearch = function (axis, index) {
    return index != null && axis != null && this.searchResults[axis][index] == 1;
  };

  /*#########################################################################*/

  /***********************************************************
   * The following functions modify the search state and must
   * be called from the NgChm.SRCH module only.
   ***********************************************************/

  SearchState.prototype.clearAllSearchResults = function () {
    this.searchResults["Row"] = {};
    this.searchResults["Column"] = {};
    this.searchResults["RowCovar"] = {};
    this.searchResults["ColumnCovar"] = {};

    this.currentSearchItems = new WeakMap();
    this.discCovStates["Row"] = "";
    this.discCovStates["Column"] = "";
  };

  SearchState.prototype.setDiscreteState = function (axis, items) {
    this.discCovStates[axis] = items;
  };

  /**********************************************************************************
   * FUNCTION - clearAllCurrentSearchItems: This function clears the current search item.
   **********************************************************************************/
  SearchState.prototype.clearAllCurrentSearchItems = function () {
    this.currentSearchItems = new WeakMap();
  };

  /**********************************************************************************
   * FUNCTION - setSearchItem: The purpose of this function is to set the current
   * search item with the supplied axis and curr values. It is called by both the "next"
   * and "previous" searches.
   **********************************************************************************/
  SearchState.prototype.setSearchItem = function (mapItem, axis, curr) {
    let searchItem = this.currentSearchItems.get(mapItem);
    if (!searchItem) {
      searchItem = {};
      this.currentSearchItems.set(mapItem, searchItem);
    }
    searchItem["axis"] = axis;
    searchItem["index"] = curr;
  };

  /**********************************************************************************
   * FUNCTION - setAxisSearchResults: set all search items from left to right (inclusive)
   * on the specified axis.
   ***********************************************************************************/

  SearchState.prototype.setAxisSearchResults = function (axis, left, right) {
    const axisResults = this.searchResults[axis];
    const gaps = this.gapItems[axis];
    for (let i = left; i <= right; i++) {
      if (!gaps[i]) axisResults[i] = 1;
    }
  };

  /**********************************************************************************
   * FUNCTION - setAxisSearchResultsVec: set all label indices in vec as search results
   * on the specified axis.
   ***********************************************************************************/
  SearchState.prototype.setAxisSearchResultsVec = function (axis, vec) {
    axis = UTIL.capitalize (axis);
    const axisResults = this.searchResults[axis];
    const gaps = this.gapItems[axis];
    if (!gaps) {
      console.error ("gaps is not set");
    }
    vec.forEach((i) => {
      if (!gaps[i]) axisResults[i] = 1;
    });
  };

  /**********************************************************************************
   * FUNCTION - clearSearchRange: clear search items from left to right (inclusive)
   * on the specified axis.
   ***********************************************************************************/
  SearchState.prototype.clearSearchRange = function (axis, left, right) {
    for (let j = +left; j < +right + 1; j++) {
      delete this.searchResults[axis][j];
    }
  };

  SearchState.prototype.clearAllAxisSearchItems = function (axis) {
    this.searchResults[axis] = {};
  };

  // Create a dictionary object for each axis that contains a true entry
  // for the indices of any gap elements.
  SearchState.prototype.setGapItems = function setGapItems(heatMap) {
    // Cache which labels on each axis are gap items.
    for (const axis of [ "Row", "Column" ]) {
      const gapItems = {};
      let labels = heatMap.getAxisLabels(axis).labels;
      // Note: indices for row and column labels are 1-origin.
      labels.forEach((label, index) => {
        if (label == "") gapItems[index + 1] = true;
      });
      this.gapItems[axis] = gapItems;
    }
  };

})();
