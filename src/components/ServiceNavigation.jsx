import React from 'react';
import { withRouter } from 'react-router-dom';
import { SideNavigation } from "@cloudscape-design/components"
import { BASE_PATH } from '../utils/constants';


function ServiceNavigation(props) {
  // If the provided link is empty, do not redirect pages
  function onFollowHandler(ev) {
    if(!ev.detail.external){
      ev.preventDefault();
      if (ev.detail.href) {
        props.history.push(ev.detail.href);
      }
    }
  }

  return (
    <SideNavigation
      header={{ text: 'CloudFront', href: '/' }}
      items={items}
      //activeHref={`#${props.location.pathname}`}
      onFollow={onFollowHandler}
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
