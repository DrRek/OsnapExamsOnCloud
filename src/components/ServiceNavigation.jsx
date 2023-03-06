import React from 'react';
import { withRouter } from 'react-router-dom';
import { SideNavigation } from "@cloudscape-design/components"
import { navigate } from '../utils/navigation';


function ServiceNavigation(props) {
  return (
    <SideNavigation
      header={{ text: 'CloudFront', href: '/' }}
      items={items}
      onFollow={(evt) => navigate(evt, props.history)}
    />
  );
}

const internal_pages_if_localhost = window.location.href.includes("http://localhost") ? [
  { type: 'link', text: 'Tests page', href: 'test' },
] : []

const items = [
  {
    type: 'section',
    text: 'Internal pages',
    items: [
      { type: 'link', text: 'Ongoing exams', href: '/' },
      { type: 'link', text: 'All exams', href: '/exams/all' },
      ...internal_pages_if_localhost
    ]
  },
  {
    type: 'section',
    text: 'External pages',
    items: [
      { type: 'link', text: 'Resource groups', href: 'https://portal.azure.com/#view/HubsExtension/BrowseResourceGroups', external: true },
      { type: 'link', text: 'Exams report folder', href: 'https://osnap-my.sharepoint.com/personal/info_osnap_it/_layouts/15/onedrive.aspx?id=%2Fpersonal%2Finfo%5Fosnap%5Fit%2FDocuments%2FExamsOnTheCloud', external: true }
    ]
  }
];

export default withRouter(ServiceNavigation);
