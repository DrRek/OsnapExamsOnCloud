export const paginationLabels = {
  nextPageLabel: 'Next page',
  previousPageLabel: 'Previous page',
  pageLabel: pageNumber => `Page ${pageNumber} of all pages`,
};

export const examsSelectionLabels = {
  itemSelectionLabel: (data, row) => `select ${row.id}`,
  allItemsSelectionLabel: () => 'select all',
  selectionGroupLabel: 'Exams selection',
};

export const examsEditLabels = {
  ...examsSelectionLabels,
  activateEditLabel: column => `Edit ${column.header}`,
  cancelEditLabel: column => `Cancel editing ${column.header}`,
  submitEditLabel: column => `Submit edit ${column.header}`,
};

export const getHeaderCounterText = (items = [], selectedItems = []) => {
  return selectedItems && selectedItems.length > 0 ? `(${selectedItems.length}/${items.length})` : `(${items.length})`;
};

export const getServerHeaderCounterText = (totalCount, selectedItems) => {
  return selectedItems && selectedItems.length > 0 ? `(${selectedItems.length}/${totalCount}+)` : `(${totalCount}+)`;
};

const headerLabel = (title, sorted, descending) => {
  return `${title}, ${sorted ? `sorted ${descending ? 'descending' : 'ascending'}` : 'not sorted'}.`;
};

export const addColumnSortLabels = columns =>
  columns.map(col => ({
    ariaLabel:
      col.sortingField || col.sortingComparator
        ? sortState => headerLabel(col.header, sortState.sorted, sortState.descending)
        : undefined,
    ...col,
  }));

export const getFilterCounterText = count => `${count} ${count === 1 ? 'match' : 'matches'}`;

export const appLayoutLabels = {
  navigation: 'Side navigation',
  navigationToggle: 'Open side navigation',
  navigationClose: 'Close side navigation',
  notifications: 'Notifications',
  tools: 'Help panel',
  toolsToggle: 'Open help panel',
  toolsClose: 'Close help panel',
};