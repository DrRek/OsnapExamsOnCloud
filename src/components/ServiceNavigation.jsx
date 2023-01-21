import React from 'react';
import { withRouter } from 'react-router-dom';
import { SideNavigation } from "@cloudscape-design/components"


function ServiceNavigation(props) {
  // If the provided link is empty, do not redirect pages
  function onFollowHandler(ev) {
    ev.preventDefault();
    if (ev.detail.href) {
      props.history.push(ev.detail.href.substring(1));
    }
  }

  return (
    <SideNavigation
      header={{ text: 'CloudFront', href: '#/service-home' }}
      items={items}
      activeHref={`#${props.location.pathname}`}
      onFollow={onFollowHandler}
    />
  );
}

const items = [
  {
    type: 'section',
    text: 'Reports and analytics',
    items: [
      { type: 'link', text: 'Test', href: '/' },
      { type: 'link', text: 'Cache statistics', href: '#/basic' }
    ]
  },
  {
    type: 'section',
    text: 'Private content',
    items: [
      { type: 'link', text: 'test2', href: '' },
      { type: 'link', text: 'Origin access identity', href: '' }
    ]
  }
];

export default withRouter(ServiceNavigation);
