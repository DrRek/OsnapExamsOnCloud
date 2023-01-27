import React, { useRef } from 'react';
import { AppLayout, BreadcrumbGroup, ContentLayout } from '@cloudscape-design/components';
import ServiceNavigation from './ServiceNavigation';
import { appLayoutLabels } from '../tables/labels';
import { NewExamsForm, NewExamsHeader } from './NewExamsForm';

export default function NewExamsPage() {
  const appLayout = useRef();

  return (
    <AppLayout
      ref={appLayout}
      contentType="form"
      content={
        <ContentLayout header={<NewExamsHeader />}>
          <NewExamsForm />
        </ContentLayout>
      }
      headerSelector="#header"
      breadcrumbs={
        <BreadcrumbGroup
          items={[
            { text: 'ExamsOnTheCloud', href: '/' },
            { text: 'New Exams', href: '#' }
          ]}
          expandAriaLabel="Show path"
          ariaLabel="Breadcrumbs"
        />
      }
      navigation={<ServiceNavigation activeHref="#" />}
      ariaLabels={appLayoutLabels}
    />
  );
}