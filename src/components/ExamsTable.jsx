// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React from 'react';
import { useCollection } from '@cloudscape-design/collection-hooks';
import { Button, Pagination, Table, TextFilter, SpaceBetween, Link } from '@cloudscape-design/components';
import { paginationLabels, examsSelectionLabels, addColumnSortLabels, getFilterCounterText } from '../tables/labels';
import { TableHeader } from './TableHeader';
import { useHistory } from 'react-router-dom';

const COLUMN_DEFINITIONS = addColumnSortLabels([
  {
    id: 'id',
    sortingField: 'id',
    header: 'Exam ID',
    cell: item => (
      <div>
        <Link href={`#${item.id}`}>{item.id}</Link>
      </div>
    ),
    minWidth: 180,
  },
  {
    id: 'email',
    sortingField: 'email',
    header: 'Student',
    cell: item => item.email,
    minWidth: 120,
  },
  {
    id: 'startTime',
    sortingField: 'startTime',
    cell: item => item.startTime,
    header: 'Start time',
    minWidth: 160,
  },
  {
    id: 'docLink',
    header: 'Exam report',
    cell: item => item.docLink,
    minWidth: 100,
  }
]);

export default function ExamsTable({ exams, selectedItems, onSelectionChange }) {
  const { items, actions, filteredItemsCount, collectionProps, filterProps, paginationProps } = useCollection(
    exams,
    {
      filtering: {
        empty: <div></div>,
        noMatch: <div></div>,
      },
      pagination: { pageSize: 50 },
      sorting: { defaultState: { sortingColumn: COLUMN_DEFINITIONS[0] } },
      selection: {},
    }
  );

  const history = useHistory()

  return (
    <Table
      {...collectionProps}
      selectedItems={selectedItems}
      onSelectionChange={onSelectionChange}
      columnDefinitions={COLUMN_DEFINITIONS}
      items={items}
      selectionType="multi"
      ariaLabels={examsSelectionLabels}
      variant="full-page"
      stickyHeader={true}
      header={
        <TableHeader
          variant="awsui-h1-sticky"
          title="Ongoing Exams"
          actionButtons={
            <SpaceBetween size="xs" direction="horizontal">
              <Button>Refresh</Button>
              <Button disabled={selectedItems.length === 0}>Stop exams</Button>
              <Button disabled={selectedItems.length === 0}>Send login email</Button>
              <Button variant="primary" onClick={() => history.push("/exams/new")}>Create exams</Button>
            </SpaceBetween>
          }
          totalItems={exams}
          selectedItems={selectedItems}
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