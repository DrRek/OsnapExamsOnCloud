import React from 'react';
import ServiceNavigation from './ServiceNavigation.jsx';
import { AppLayout, BreadcrumbGroup, Button, HelpPanel, Icon } from "@cloudscape-design/components"
import { check_create_user_in_vm, check_resource_group_existance, create_docx_document, delete_all_resource_groups, grant_access_to_doc, send_email, testFunction } from '../utils/api.js';
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
  <Button onClick={() => send_email("lucareccia@hotmail.it", "test sub", "questa\nè\nuna\nprova")}>Send test email to lucareccia@hotmail.it</Button>
  <Button onClick={async () => {const asd = await create_docx_document("test"); console.log(asd)}}>Test create file</Button>
  <Button onClick={() => grant_access_to_doc("test", "lucareccia@hotmail.it")}>To grant access to file</Button>
  <Button onClick={() => check_resource_group_existance("Managment-ExamsOnTheCloud2")}>Check rg existance</Button>
  <Button onClick={() => check_create_user_in_vm(JSON.parse(localStorage.getItem("exams"))["ExamsOnTheCloud-prova2-lucareccia-320"])}>Check create user status</Button>
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
