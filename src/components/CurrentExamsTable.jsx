import React from 'react';
import { useCollection } from '@cloudscape-design/collection-hooks';
import { Button, Pagination, Table, TextFilter, SpaceBetween, Link, StatusIndicator, Spinner, Box, Popover } from '@cloudscape-design/components';
import { paginationLabels, examsSelectionLabels, addColumnSortLabels, getFilterCounterText } from '../tables/labels';
import { TableHeader } from './TableHeader';
import { useHistory } from 'react-router-dom';
import { E_ADMINPASS, E_ADMINUSER, E_EMAIL, E_ID, E_LOGS, E_STATUS, E_STATUS_VALUES, E_USERPASS, E_USERUSER } from '../utils/constants';
import Moment from 'react-moment';
import { get_resource_group_link } from '../utils/api';
import { saveAs } from 'file-saver';
import { ErrorBoundary } from "react-error-boundary";

const COLUMN_DEFINITIONS = addColumnSortLabels([
  {
    id: E_ID,
    sortingField: E_ID,
    header: 'Exam ID',
    cell: item => <Link external href={get_resource_group_link(item[E_ID])}>{item[E_ID].replace("ExamsOnTheCloud-","")}</Link>,
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
      if(st === E_STATUS_VALUES.TURNINGON)
        return <StatusIndicator type="in-progress">Turning ON</StatusIndicator>
      if(st === E_STATUS_VALUES.TURNINGOFF)
        return <StatusIndicator type="in-progress">Turning OFF</StatusIndicator>
      if(st === E_STATUS_VALUES.TURNEDOFF)
        return <StatusIndicator type="error">Turned OFF</StatusIndicator>
      if(st === E_STATUS_VALUES.DESTROYING)
        return <StatusIndicator type="pending">Destroying</StatusIndicator>
      if(st === E_STATUS_VALUES.DESTROYED)
        return <StatusIndicator type="stopped">Destroyed</StatusIndicator>
      return <StatusIndicator type="error">Invalid</StatusIndicator>
    },
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
    id: 'adminrdp',
    cell: item => 
      <ErrorBoundary fallbackRender={() =>
        <div>error</div>
      }>
        <Button iconName="download" variant="inline-icon" onClick={() => {
          const file = new Blob([`full address:s:${item["ipaddr"].properties.ipAddress}:3389\nusername:s:${item[E_ADMINUSER]}\npassword:s:${item[E_ADMINPASS]}\nredirectclipboard:i:1\ndynamic resolution:i:1\nsmart sizing:i:1`], {type: "text/plain;charset=utf-8"});
          saveAs(
            file,
            item[E_ID].replace("ExamsOnTheCloud-","")+'-admin.rdp'
          )
        }} />
        <Box margin={{ right: 'xxs' }} display="inline-block">
          <Popover
            size="small"
            position="top"
            triggerType="custom"
            dismissButton={false}
            content={<StatusIndicator type="success">Admin pass copied</StatusIndicator>}
          >
            <Button
              variant="inline-icon"
              iconName="copy"
              onClick={() => {
                navigator.clipboard.writeText(item[E_ADMINPASS]);
              }}
            />
          </Popover>
        </Box>
      </ErrorBoundary>,
    header: 'Admin RDP',
    minWidth: 50,
  },
  {
    id: 'studentrdp',
    cell: item => 
    <>
      <Button iconName="download" variant="inline-icon" aria-label="asd" onClick={() => {
        const file = new Blob([`full address:s:${item["ipaddr"].properties.ipAddress}:3389\nusername:s:${item[E_USERUSER]}\npassword:s:${item[E_USERPASS]}\nredirectclipboard:i:1\ndynamic resolution:i:1\nsmart sizing:i:1`], {type: "text/plain;charset=utf-8"});
        saveAs(
          file,
          item[E_ID].replace("ExamsOnTheCloud-","")+'-student.rdp'
        )
      }} />
      <Box margin={{ right: 'xxs' }} display="inline-block">
        <Popover
          size="small"
          position="top"
          triggerType="custom"
          dismissButton={false}
          content={<StatusIndicator type="success">Student pass copied</StatusIndicator>}
        >
          <Button
            variant="inline-icon"
            iconName="copy"
            onClick={() => {
              navigator.clipboard.writeText(item[E_USERPASS]);
            }}
          />
        </Popover>
      </Box>
    </>,
    header: 'Student RDP',
    minWidth: 50,
  },
  {
    id: 'ip',
    header: 'IP',
    cell: item => item?.ipaddr?.properties?.ipAddress || "Error",
    minWidth: 100,
  },
  {
    id: 'latest log',
    header: 'Latest log',
    cell: item => item[E_LOGS][item[E_LOGS].length-1]["reason"],
    minWidth: 100,
  }
]);

export default function CurrentExamsTable({ exams, selectedExams, onSelectionChange, refreshing, onRefresh, onDestroyExams, onSendEmail, stoppingexams, sendingloginemail, onTurnOn, turningOn, onTurnOff, turningOff }) {
  const { items, filteredItemsCount, collectionProps, filterProps, paginationProps } = useCollection(
    exams,
    {
      filtering: {
        empty: refreshing ? <Spinner/> : <div>no exams</div>,
        noMatch: <div>no matching exams</div>,
      },
      pagination: { pageSize: 50 },
      sorting: { defaultState: { sortingColumn: COLUMN_DEFINITIONS[3] } },
      selection: {},
    }
  );

  const history = useHistory()

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
          title="Ongoing Exams"
          actionButtons={
            <SpaceBetween size="xs" direction="horizontal">
              <Button disabled={refreshing} loading={refreshing} onClick={onRefresh}>Refresh</Button>
              <Button disabled={selectedExams.length === 0 || stoppingexams} loading={turningOn} onClick={onTurnOn}>Turn on VM</Button>
              <Button disabled={selectedExams.length === 0 || stoppingexams} loading={turningOff} onClick={onTurnOff}>Turn off VM</Button>
              <Button variant="primary" onClick={() => history.push("/exams/new")}>Create exams</Button>
              <Button disabled={selectedExams.length === 0 || sendingloginemail} loading={sendingloginemail} onClick={onSendEmail}>Send Email</Button>
              <Button disabled={selectedExams.length === 0 || stoppingexams} loading={stoppingexams} onClick={onDestroyExams}>Destroy VM</Button>
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