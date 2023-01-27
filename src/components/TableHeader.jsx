import React from 'react'
import { Header } from '@cloudscape-design/components';
import { getServerHeaderCounterText, getHeaderCounterText } from '../tables/labels'
import { InfoLink } from './InfoLink';

function getCounter(props) {
  if (props.counter) {
    return props.counter;
  }
  if (!props.totalItems) {
    return null;
  }
  if (props.serverSide) {
    return getServerHeaderCounterText(props.totalItems, props.selectedItems);
  }
  return getHeaderCounterText(props.totalItems, props.selectedItems);
}

export const TableHeader = props => {
  return (
    <Header
      variant={props.variant}
      counter={getCounter(props)}
      info={
        props.loadHelpPanelContent && (
          <InfoLink onFollow={props.loadHelpPanelContent} ariaLabel={`Information about ${props.title}.`} />
        )
      }
      description={props.description}
      actions={props.actionButtons}
    >
      {props.title}
    </Header>
  );
};