import React from 'react';
import { Route } from 'react-router-dom';
import Basic from './BasicLayout';

import "@cloudscape-design/global-styles/index.css"

export default class App extends React.Component {
  render() {
    return (
      <div>
        <Route exact path="/" component={Basic} />
      </div>
    );
  }
}
