// A set of APIs for managing the UI history states
Fliplet.Registry.set('history-stack', (function() {
  var stack = [];
  var currentIndex = 0;

  function reset() {
    stack = [];
    currentIndex = 0;
  }

  // Clone data without losing the ID
  function cloneSpreadsheetData(data) {
    return _.map(data, function(row) {
      var entry = [];

      _.forEach(row, function(column) {
        entry.push(column);
      });

      entry.id = row.id;

      return entry;
    });
  }

  function add(state) {
    state = state || {};

    // Clear all after current index to reset redo
    if (currentIndex + 1 < stack.length) {
      stack.splice(currentIndex + 1);
    }

    // Add current change to stack
    stack.push({
      data: cloneSpreadsheetData(state.data),
      colWidths: state.colWidths
    });

    // Don't increment current index for first insert
    if (stack.length > 1) {
      currentIndex++;
    }

    toggleUndoRedo();
  }

  function getCurrent(offset) {
    if (typeof offset === 'undefined') {
      offset = 0;
    }

    var index = currentIndex + offset;
    var currentState = stack[index];

    return {
      getData: function() {
        return currentState ? cloneSpreadsheetData(currentState.data) : undefined;
      },
      getColWidths: function() {
        return currentState ? currentState.colWidths : undefined;
      },
      setData: function(newData) {
        currentState.data = cloneSpreadsheetData(newData);
      }
    };
  }

  function loadCurrent() {
    var state = getCurrent();

    if (!state) {
      return;
    }

    // Use _.cloneDeep to drop the ID in each row to ensure data is loaded correctly
    hot.loadData(_.cloneDeep(state.getData()));
    hot.updateSettings({ colWidths: state.getColWidths() });

    table.onChange();
  }

  function back() {
    currentIndex--;

    toggleUndoRedo();

    if (currentIndex < 0) {
      currentIndex = 0;

      return;
    }

    loadCurrent();
  }

  function forward() {
    currentIndex++;

    toggleUndoRedo();

    if (currentIndex >= stack.length) {
      currentIndex = Math.max(stack.length - 1, 0);

      return;
    }

    loadCurrent();
  }

  function canUndo() {
    return !!stack[currentIndex - 1];
  }

  function canRedo() {
    return !!stack[currentIndex + 1];
  }

  function toggleUndoRedo() {
    $('[data-action="undo"]').prop('disabled', !canUndo());
    $('[data-action="redo"]').prop('disabled', !canRedo());
  }

  return {
    reset: reset,
    add: add,
    back: back,
    forward: forward,
    getCurrent: getCurrent
  };
})());
