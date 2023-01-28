import React, { useEffect, useState } from 'react';
import {
  AppLayout,
  BreadcrumbGroup,
  Flashbar
} from '@cloudscape-design/components';
import ServiceNavigation from './ServiceNavigation.jsx';
import { appLayoutLabels } from '../tables/labels';
import ExamsTable from './ExamsTable.jsx';
import { check_create_user_in_vm, check_resource_group_existance, db_list_exams, db_update_exam, delete_resource_group } from '../utils/api.js';
import { E_CREATE_USER_RESP, E_DELETE_RG_RESP, E_ID, E_STATUS, E_STATUS_VALUES } from '../utils/constants.js';

const MainPage = ({ notifications }) => {

  const [ exams, setExams ] = useState([])
  const [ selectedExams, setSelectedExams ] = useState([])
  const [ refreshing, setRefreshing ] = useState(true)

  const refreshExams = async () => {
    setRefreshing(true)
    const temp_exams = await db_list_exams()

    temp_exams.forEach(async exam => {
      if(exam[E_STATUS] === E_STATUS_VALUES.CREATING){ // what to do if exam is being created
        //check that Resource Group exists
        const rg_exists = await check_resource_group_existance(exam[E_ID])

        //check that rdp is available
        const check_user_resp = await check_create_user_in_vm(exam)
        exam[E_CREATE_USER_RESP] = check_user_resp
        //TODO: check that doc exists

        //if these checks are sucessfull move the status to RUNNING
        if(rg_exists && check_user_resp)
          exam[E_STATUS] = E_STATUS_VALUES.RUNNING
          await db_update_exam(exam, "from creating to running")
      } else if (exam[E_STATUS] === E_STATUS_VALUES.RUNNING){ // what to do if exam is running

      } else if (exam[E_STATUS] === E_STATUS_VALUES.STOPPING){ // what to do if exam is being stopped
        //check that RG does not exist
        const rg_exists = await check_resource_group_existance(exam[E_ID])

        //TODO: check that doc sharing has been disabled

        //if these checks are sucessfull move the status to STOPPED
        if(!rg_exists)
          exam[E_STATUS] = E_STATUS_VALUES.STOPPED
          await db_update_exam(exam, "from stopping to stopped")
      } else if (exam[E_STATUS] === E_STATUS_VALUES.STOPPED){ // what to do if exam is already stopped

      } else {
        console.error("Exam is in an invalid state")
        console.log(exam)
      }
    })

    setExams(await db_list_exams())
    setRefreshing(false)
  }

  const [sendingloginemail, setSendingloginemail] = useState(false)
  const sendEmail = () => {
    setSendingloginemail(true)
    alert("still to implement") //TODO
    setSendingloginemail(false)
  }

  const [stoppingexams, setStoppingexams] = useState(false)
  const stopExams = async () => {
    setStoppingexams(true)
    selectedExams.forEach(async exam => {
      exam[E_DELETE_RG_RESP] = await delete_resource_group(exam[E_ID])
      exam[E_STATUS] = E_STATUS_VALUES.STOPPING

      //TODO disable access to doc

      db_update_exam(exam, "stopping exam")
    })
    setStoppingexams(false)
    refreshExams()
  }

  useEffect(() => {
    refreshExams()
  }, [])

  return (
    <AppLayout
      content={
        <ExamsTable
          exams={exams}
          selectedExams={selectedExams}
          onSelectionChange={event => setSelectedExams(event.detail.selectedItems)}
          refreshing={refreshing}
          onRefresh={refreshExams}
          sendingloginemail={sendingloginemail}
          onSendEmail={sendEmail}
          stoppingexams={stoppingexams}
          onStopExams={stopExams}
        />
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
      navigation={<ServiceNavigation activeHref="#" />}
      navigationOpen={false}
      toolsHide={true}
      ariaLabels={appLayoutLabels}
      contentType="table"
    />
  );
}

export default MainPage