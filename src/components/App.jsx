import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import Basic from './BasicLayout';
import CurrentExamsPage from './CurrentExamsPage';
import AllExamsPage from './AllExamsPage';
import NewExamsPage from './NewExamsPage'

import "@cloudscape-design/global-styles/index.css"

export default class App extends React.Component {
  render() {
    return (
      <div>
        <Route exact path="/" component={CurrentExamsPage}/>
        <Route exact path="/exams/all" component={AllExamsPage}/>
        <Route exact path="/exams/new" component={NewExamsPage}/>
        <Route exact path="/test" component={Basic}/>
        <Redirect to="/"/>
      </div>
    );
  }
}
