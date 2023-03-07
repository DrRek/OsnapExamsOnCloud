// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React from 'react';
import { useCollection } from '@cloudscape-design/collection-hooks';
import { Button, Pagination, Table, TextFilter, SpaceBetween, Spinner } from '@cloudscape-design/components';
import { paginationLabels, examsSelectionLabels, addColumnSortLabels, getFilterCounterText } from '../tables/labels';
import { TableHeader } from './TableHeader';
import { useHistory } from 'react-router-dom';
import { E_EMAIL, E_ID, E_LOGS } from '../utils/constants';
import Moment from 'react-moment';

const COLUMN_DEFINITIONS = addColumnSortLabels([
  {
    id: E_ID,
    sortingField: E_ID,
    header: 'Exam ID',
    cell: item => item[E_ID],
    minWidth: 180,
  },
  {
    id: 'email',
    sortingField: 'email',
    header: 'Student',
    cell: item => item[E_EMAIL],
    minWidth: 120,
  },
  {
    id: 'timestamp',
    cell: item => 
      <Moment date={new Date(item[E_LOGS][0]["timestamp"]*1000)} format="HH:mm DD/MM/YY"></Moment>,
    sortingComparator: (a,b) => 
      a[E_LOGS][0]["timestamp"] < b[E_LOGS][0]["timestamp"],
    header: 'Start time',
    minWidth: 160,
  },
  {
    id: 'latest log',
    header: 'Latest log',
    cell: item => item[E_LOGS][item[E_LOGS].length-1]["reason"],
    minWidth: 100,
  }
]);

export default function AllExamsTable({ exams, selectedExams, onSelectionChange, refreshing, onRefresh, onDeleteExamsFromDB, onShowDetails, deletingExamsFromDB }) {
  const { items, filteredItemsCount, collectionProps, filterProps, paginationProps } = useCollection(
    exams,
    {
      filtering: {
        empty: refreshing ? <Spinner/> : <div>no exams</div>,
        noMatch: <div>no matching exams</div>,
      },
      pagination: { pageSize: 50 },
      sorting: { defaultState: { sortingColumn: COLUMN_DEFINITIONS[2] } },
      selection: {},
    }
  );

  return (
    <Table
      {...collectionProps}
      selectedItems={selectedExams}
      onSelectionChange={onSelectionChange}
      trackBy="id"
      columnDefinitions={COLUMN_DEFINITIONS}
      items={items}
      selectionType="multi"
      ariaLabels={examsSelectionLabels}
      variant="full-page"
      stickyHeader={true}
      header={
        <TableHeader
          variant="awsui-h1-sticky"
          title="All Exams"
          actionButtons={
            <SpaceBetween size="xs" direction="horizontal">
              <Button loading={refreshing || deletingExamsFromDB} onClick={onRefresh}>Refresh</Button>
              <Button disabled={selectedExams.length === 0} onClick={onShowDetails}>Show all logs</Button>
              <Button disabled={selectedExams.length === 0} loading={deletingExamsFromDB} onClick={onDeleteExamsFromDB}>Delete from db</Button>
            </SpaceBetween>
          }
          totalItems={exams}
          selectedItems={selectedExams}
        />
      }
      filter={
        <TextFilter
          {...filterProps}
          filteringAriaLabel="Filter exams"
          filteringPlaceholder="Find exams"
          filteringClearAriaLabel="Clear"
          countText={getFilterCounterText(filteredItemsCount)}
        />
      }
      pagination={<Pagination {...paginationProps} ariaLabels={paginationLabels} />}
    />
  );
}