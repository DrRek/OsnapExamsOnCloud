// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React from 'react';
import { useCollection } from '@cloudscape-design/collection-hooks';
import { Button, Pagination, Table, TextFilter, SpaceBetween, Link, StatusIndicator } from '@cloudscape-design/components';
import { paginationLabels, examsSelectionLabels, addColumnSortLabels, getFilterCounterText } from '../tables/labels';
import { TableHeader } from './TableHeader';
import { useHistory } from 'react-router-dom';
import { E_CREATE_DOC_RESP, E_EMAIL, E_ID, E_LOGS, E_STATUS, E_STATUS_VALUES } from '../utils/constants';
import Moment from 'react-moment';
import { get_resource_group_link } from '../utils/api';

const COLUMN_DEFINITIONS = addColumnSortLabels([
  {
    id: E_ID,
    sortingField: E_ID,
    header: 'Exam ID',
    cell: item => <Link external href={get_resource_group_link(item[E_ID])}>{item[E_ID]}</Link>,
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
    id: E_STATUS,
    sortingField: E_STATUS,
    header: 'Status',
    cell: item => {
      const st = item[E_STATUS]
      if(st === E_STATUS_VALUES.CREATING)
        return <StatusIndicator type="in-progress">Creating</StatusIndicator>
      if(st === E_STATUS_VALUES.RUNNING)
        return <StatusIndicator>Running</StatusIndicator>
      if(st === E_STATUS_VALUES.STOPPING)
        return <StatusIndicator type="pending">Stopping</StatusIndicator>
      if(st === E_STATUS_VALUES.STOPPED)
        return <StatusIndicator type="stopped">Stopped</StatusIndicator>
      return <StatusIndicator type="error">Invalid</StatusIndicator>
    },
    minWidth: 120,
  },
  {
    id: 'timestamp',
    cell: item => 
      <Moment date={new Date(item[E_LOGS][0]["timestamp"]*1000)} format="hh:mm DD/MM/YY"></Moment>,
    sortingComparator: (a,b) => 
      a[E_LOGS][0]["timestamp"] < b[E_LOGS][0]["timestamp"],
    header: 'Start time',
    minWidth: 160,
  },
  {
    id: 'docLink',
    header: 'Exam report',
    cell: item => item[E_CREATE_DOC_RESP] ? <Link external href={item[E_CREATE_DOC_RESP]["body"]["webUrl"]}>{item[E_CREATE_DOC_RESP]["body"]["name"]}</Link> : "invalid link",
    minWidth: 100,
  },
  {
    id: 'latest log',
    header: 'Latest log',
    cell: item => item[E_LOGS][item[E_LOGS].length-1]["reason"],
    minWidth: 100,
  }
]);

export default function ExamsTable({ exams, selectedExams, onSelectionChange, refreshing, onRefresh, onStopExams, onSendEmail, stoppingexams, sendingloginemail }) {
  const { items, filteredItemsCount, collectionProps, filterProps, paginationProps } = useCollection(
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
      selectedItems={selectedExams}
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
              <Button disabled={refreshing} loading={refreshing} onClick={onRefresh}>Refresh</Button>
              <Button disabled={selectedExams.length === 0 || stoppingexams} loading={stoppingexams} onClick={onStopExams}>Stop exams</Button>
              <Button disabled={selectedExams.length === 0 || sendingloginemail} loading={sendingloginemail} onClick={onSendEmail}>Share VM & doc</Button>
              <Button variant="primary" onClick={() => history.push("/exams/new")}>Create exams</Button>
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