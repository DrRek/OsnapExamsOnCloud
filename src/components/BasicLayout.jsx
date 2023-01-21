import React from 'react';
import ServiceNavigation from './ServiceNavigation.jsx';
import { AppLayout, BreadcrumbGroup, Button, HelpPanel, Icon } from "@cloudscape-design/components"
import { delete_all_resource_groups, testFunction } from '../utils/test.js';
import { APP_PREFIX } from '../utils/constants.js';


// Component Basic is a skeleton of the basic App layout using AWS-UI React components.
export default function Basic() {
  return (
    <AppLayout
      navigation={<ServiceNavigation />}
      breadcrumbs={<Breadcrumbs />}
      content={<Content />}
      contentType="default" 
      tools={Tools}
    />
  );
}

// Breadcrumb content
const Breadcrumbs = () => (
  <BreadcrumbGroup
    items={[
      {
        text: 'Example',
        href: '#/service-home'
      },
      {
        text: 'Cache statistics',
        href: '#/basic'
      }
    ]}
  />
);

// Main content area (fill it in with components!)
const Content = () => <div>
<Button onClick={testFunction}>Test</Button>  
  <Button onClick={() => delete_all_resource_groups(APP_PREFIX)}>Delete all resources</Button>  
</div>;

// Help panel content
const Tools = (
  <HelpPanel
    header={<h2>Osnap</h2>}
    footer={
      <div>
        <h3>
          Learn more <Icon name="external" />
        </h3>
        <div>Example tools</div>
      </div>
    }
  >
    <p>
      Tools text
    </p>
  </HelpPanel>
);
