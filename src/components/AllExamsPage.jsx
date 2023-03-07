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
import { E_STATUS_VALUES } from '../utils/constants.js';
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
      <h4>Steps to launch an exam</h4>
      <ul>
        <li>
          <h5>Create the environment</h5>
          <div>Click on the "Create Exam" button to create environments for each student.</div>
        </li>
        <li>
          <h5>Wait for environments to be ready</h5>
          <div>Wait for all the created environments to have status "{E_STATUS_VALUES.RUNNING}". This step might take up to <b>10 minutes</b>, click the "Refresh" button to check for updates.</div>
        </li>
        <li>
          <h5>Start the exam</h5>
          <div>Select all the exams that have to start and click on "Share VM & doc". An email will be sent to each partecipant with instruction on how to login.</div>
        </li>
        <li>
          <h5>End the exam</h5>
          <div>At the end of the exam, select the exams you want to terminate and click on "Stop exams". Access will be revoked to both the VM and the report document</div>
        </li>
        <li>
          <h5>Check resource groups are terminated</h5>
          <div>Make sure after max 10 minutes all the exams have status "{E_STATUS_VALUES.DESTROYED}". Navigate to "Resource groups" on the azure console and make sure that there are no running resources.<b>Missing to do this steps might cause unwanted expenses on the cloud.</b></div>
        </li>
        <li>
          <h5>Save the report documents</h5>
          <div>Each student will either send or use the integrated doc to submit their report. Navigate to "Exam report folder" and save all the reports in a safe way.</div>
        </li>
      </ul>
    </div>
  </HelpPanel>
);

export default CurrentExamsPage