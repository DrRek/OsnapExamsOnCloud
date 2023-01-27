import React from 'react';
import {
  AppLayout,
  BreadcrumbGroup,
  Flashbar
} from '@cloudscape-design/components';
import ServiceNavigation from './ServiceNavigation.jsx';
import { appLayoutLabels } from '../tables/labels';
import ExamsTable from './ExamsTable.jsx';

const MainPage = ({ selectedItems, setSelectedItems, notifications }) => {
  return (
    <AppLayout
      content={
        <ExamsTable
          exams={[]}
          selectedItems={[]}
          onSelectionChange={event => setSelectedItems(event.detail.selectedItems)}
        />
      }
      headerSelector="#header"
      breadcrumbs={
        <BreadcrumbGroup
          items={[
            { text: 'ExamsOnTheCloud', href: '/' }
          ]}
          expandAriaLabel="Show path"
          ariaLabel="Breadcrumbs"
        />
      }
      notifications={<Flashbar items={notifications} />}
      navigation={<ServiceNavigation activeHref="#" />}
      navigationOpen={false}
      toolsHide={true}
      ariaLabels={appLayoutLabels}
      contentType="table"
    />
  );
}

export default MainPage