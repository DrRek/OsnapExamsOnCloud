import React, { useEffect, useState } from 'react';
import {
  AppLayout,
  BreadcrumbGroup,
  Flashbar,
  HelpPanel
} from '@cloudscape-design/components';
import ServiceNavigation from './ServiceNavigation.jsx';
import { appLayoutLabels } from '../tables/labels';
import AllExamsTable from './AllExamsTable.jsx';
import { db_delete_exam_v2, db_list_exams_v2 } from '../utils/api.js';
import DialogConfirmationDeleteFromDB from './DialogConfirmationDeleteFromDB.jsx';
import DialogExpandInfoExams from './DialogExpandInfoExams.jsx';

const CurrentExamsPage = ({ notifications }) => {

  const [exams, setExams] = useState([])
  const [selectedExams, setSelectedExams] = useState([])
  const [refreshing, setRefreshing] = useState(true)

  const refreshExams = async () => {
    setRefreshing(true)
    setSelectedExams([])
    setExams(await db_list_exams_v2())
    setRefreshing(false)
  }

  useEffect(() => {
    refreshExams()
  }, [])

  const [dialogConfirmationDeleteFromDBOpen, setDialogConfirmationDeleteFromDBOpen] = useState(false)
  const [dialogExandInfoExams, setDialogExandInfoExams] = useState(false)

  const [deletingExams, setDeletingExams] = useState(false)
  const deleteExamsFromDB = async () => {
    setDeletingExams(true)
    try{
      for(const exam of selectedExams)
        await db_delete_exam_v2(exam)
    } finally {
      setDeletingExams(false)
    }
    refreshExams()
  }

  return (
    <AppLayout
      content={
        <>
          <AllExamsTable
            exams={exams}
            selectedExams={selectedExams}
            onSelectionChange={event => setSelectedExams(event.detail.selectedItems)}
            refreshing={refreshing}
            onRefresh={refreshExams}
            onShowDetails={() => setDialogExandInfoExams(true)}
            onDeleteExamsFromDB={() => setDialogConfirmationDeleteFromDBOpen(true)}
            deletingExamsFromDB={dialogConfirmationDeleteFromDBOpen || deletingExams}
          />
          <DialogConfirmationDeleteFromDB selectedExams={selectedExams} onClose={() => setDialogConfirmationDeleteFromDBOpen(false)} onConfirm={() => { deleteExamsFromDB(); setDialogConfirmationDeleteFromDBOpen(false) }} visible={dialogConfirmationDeleteFromDBOpen} />
          <DialogExpandInfoExams exams={selectedExams} onClose={() => setDialogExandInfoExams(false)} visible={dialogExandInfoExams} />
        </>

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
      navigation={<ServiceNavigation />}
      //navigationOpen={false}
      ariaLabels={appLayoutLabels}
      contentType="table"
      tools={HelpOnSide}
    />
  );
}

const HelpOnSide = (
  <HelpPanel
    header={<h2>Osnap</h2>}
    footer={
      <div>
        <div>Exams On Cloud</div>
      </div>
    }
  >
    <div>
      <h4>All Exams</h4>
      <p>In this page it is possible to see all the past and previous exams. Mainly used for log and debug purpose.</p>
    </div>
  </HelpPanel>
);

export default CurrentExamsPage