import React, { useRef } from 'react';
import { AppLayout, ContentLayout } from '@cloudscape-design/components';
import ServiceNavigation from './ServiceNavigation';
import { appLayoutLabels } from '../tables/labels';
import { NewExamsForm, NewExamsHeader } from './NewExamsForm';
import { Breadcrumbs } from './Breadcrumbs';

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
        <Breadcrumbs
          items={[
            { text: 'New Exams', href: '#' }
          ]}
        />
      }
      navigation={<ServiceNavigation activeHref="#" />}
      ariaLabels={appLayoutLabels}
    />
  );
}