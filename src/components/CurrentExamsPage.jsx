import React, { useEffect, useState } from 'react';
import {
  AppLayout,
  BreadcrumbGroup,
  Flashbar,
  HelpPanel
} from '@cloudscape-design/components';
import ServiceNavigation from './ServiceNavigation.jsx';
import { appLayoutLabels } from '../tables/labels';
import CurrentExamsTable from './CurrentExamsTable.jsx';
import { turn_off_virtual_machine, check_create_user_in_vm, check_resource_group_existance, db_list_active_exams_v2, db_update_exam_v2, delete_resource_group, grant_access_to_doc, remove_access_to_doc, send_email, turn_on_virtual_machine, check_virtual_machine } from '../utils/api.js';
import { E_CREATE_DOC_RESP, E_CREATE_USER_RESP, E_DELETE_RG_RESP, E_EMAIL, E_EXAM_DURATION, E_ID, E_LATEST_TURNOFF_RESP, E_LATEST_TURNON_RESP, E_SHARED_DOC_RESP, E_STATUS, E_STATUS_VALUES, E_USERPASS, E_USERUSER } from '../utils/constants.js';
import DialogConfirmationEmail from './DialogConfirmationEmail.jsx';
import DialogConfirmationDestroy from './DialogConfirmationDestroy.jsx';

const CurrentExamsPage = ({ notifications }) => {

  const [exams, setExams] = useState([])
  const [selectedExams, setSelectedExams] = useState([])
  const [refreshing, setRefreshing] = useState(true)

  const refreshExams = async () => {
    setRefreshing(true)
    setSelectedExams([])
    const temp_exams = await db_list_active_exams_v2()
    console.log("starting refresh")
    console.log(temp_exams[0])

    for (const exam of temp_exams) {

      if (exam[E_STATUS] === E_STATUS_VALUES.CREATING) { // what to do if exam is being created
        //check that Resource Group exists
        const rg_exists = await check_resource_group_existance(exam[E_ID])

        //check that rdp is available
        const check_user_resp = await check_create_user_in_vm(exam)
        exam[E_CREATE_USER_RESP] = check_user_resp

        //if these checks are sucessfull move the status to RUNNING
        console.log(`rg_exist ${rg_exists}`)
        console.log(`check_user_resp ${check_user_resp}`)
        if (rg_exists && check_user_resp) {
          exam[E_STATUS] = E_STATUS_VALUES.RUNNING
          await db_update_exam_v2(exam, "from creating to running")
        }
      } else if (exam[E_STATUS] === E_STATUS_VALUES.DESTROYING) { // what to do if exam is being stopped
        //check that RG does not exist
        const rg_exists = await check_resource_group_existance(exam[E_ID])

        //if these checks are sucessfull move the status to DESTROYED
        if (!rg_exists)
          exam[E_STATUS] = E_STATUS_VALUES.DESTROYED
        await db_update_exam_v2(exam, "from stopping to stopped")
      } else if ([E_STATUS_VALUES.TURNINGON, E_STATUS_VALUES.TURNINGOFF, E_STATUS_VALUES.RUNNING, E_STATUS_VALUES.TURNEDOFF].includes(exam[E_STATUS])) {
        try {
          const vmRawStatus = await check_virtual_machine(exam[E_ID])

          const vmStatus = vmRawStatus.statuses.find(i => i.code.startsWith("PowerState/")).code

          const prevStatus = exam[E_STATUS]
          if (vmStatus === "PowerState/running" && exam[E_STATUS] !== E_STATUS_VALUES.RUNNING) {
            exam[E_STATUS] = E_STATUS_VALUES.RUNNING
            await db_update_exam_v2(exam, `from ${prevStatus} to ${exam[E_STATUS]}`)
          } else if (vmStatus === "PowerState/starting" && exam[E_STATUS] !== E_STATUS_VALUES.TURNINGON) {
            exam[E_STATUS] = E_STATUS_VALUES.TURNINGON
            await db_update_exam_v2(exam, `from ${prevStatus} to ${exam[E_STATUS]}`)
          } else if (vmStatus === "PowerState/deallocated" && exam[E_STATUS] !== E_STATUS_VALUES.TURNEDOFF) {
            exam[E_STATUS] = E_STATUS_VALUES.TURNEDOFF
            await db_update_exam_v2(exam, `from ${prevStatus} to ${exam[E_STATUS]}`)
          } else if (vmStatus === "PowerState/deallocating" && exam[E_STATUS] !== E_STATUS_VALUES.TURNINGOFF) {
            exam[E_STATUS] = E_STATUS_VALUES.TURNINGOFF
            await db_update_exam_v2(exam, `from ${prevStatus} to ${exam[E_STATUS]}`)
          }

          if (!["PowerState/running", "PowerState/starting", "PowerState/deallocated", "PowerState/deallocating"].includes(vmStatus)) {
            console.error("VM is in a weird state from api " + vmStatus)
            console.error(exam)
            console.error(vmRawStatus)
          }
        } catch (e) {
          console.error("Error while trying to get status of vm from azure")
          console.error(e)
        }
      } else if (exam[E_STATUS] === E_STATUS_VALUES.DESTROYED) { // what to do if exam is already stopped
      } else {
        console.error("Exam is in an invalid state")
        console.log(exam)
      }
    }

    setExams(await db_list_active_exams_v2())
    setRefreshing(false)
  }

  const [sendingloginemail, setSendingloginemail] = useState(false)
  const sendEmail = async () => {
    setSendingloginemail(true)

    for (const exam of selectedExams) {
      const email = exam[E_EMAIL]

      //DOCONCLOUD
      //const doc = exam[E_CREATE_DOC_RESP]["body"]["name"]
      //exam[E_SHARED_DOC_RESP] = await grant_access_to_doc(doc, email)
      //await db_update_exam_v2(exam, "allowed student to access the doc")

      const email_subject = "[OSNAP] Il tuo esame è iniziato"
      const email_body = `
<img src="https://drrek.github.io/OsnapExamsOnCloud/osnap/logo.png" alt="osnap-logo"/><br/>
<b>Questa mail contiene informazioni private, non inoltrare o condividere in altro modo il suo contenuto.</b><br/><br/>
Ciao ${email.split("@")[0]},<br/>
il tuo esame è iniziato in questo istante. Avrai a disposizione ${exam[E_EXAM_DURATION]} ${exam[E_EXAM_DURATION] === 1 ? 'ora' : 'ore'}.<br/>
Per accedere all'esame <b>scarica ed apri il file allegato</b>. Se richiesto, usa la password indicata in questa mail.<br/><br/>
In alternativa, collegati manualmente tramite RDP usando queste impostazioni:<br/>
<pre>IP: ${exam["ipaddr"].properties.ipAddress}
Porta: 3389
User: ${exam[E_USERUSER]}
Password: ${exam[E_USERPASS]}</pre><br/>
Buona fortuna,<br/>
Osnap Team<br/><br/><br/>
<h3>FAQ</h3>
<h4>Cosa fare compare una schermata con scritto <b>"Impossibile verificare l'autore della connessione remota"</b>?</h4>
<ul><li>Cliccare su <b>"Connetti"</b>.</li></ul>
<img src="https://drrek.github.io/OsnapExamsOnCloud/rdp-warn-1.png" alt="" width="400"/><br/>
<h4>Cosa fare compare una schermata con scritto <b>"Impossibile verificare l'identità del computer remoto"</b>?</h4>
<ul><li>Cliccare su <b>"Si"</b>.</li></ul>
<img src="https://drrek.github.io/OsnapExamsOnCloud/rdp-warn-2.png" alt="" width="400"/><br/>`

      const file = `full address:s:${exam["ipaddr"].properties.ipAddress}:3389\nusername:s:${exam[E_USERUSER]}\npassword:s:${exam[E_USERPASS]}\nredirectclipboard:i:0\ndynamic resolution:i:1\nsmart sizing:i:1`

      const attachments = [{
        "@odata.type": "#microsoft.graph.fileAttachment",
        "name": `${exam["name"]}-vm-access.rdp`,
        "contentBytes": btoa(file),
        "contentType": "text/plain"
      }]

      await send_email(email, email_subject, email_body, attachments)
      await db_update_exam_v2(exam, "start exam email sent")
    }

    setSendingloginemail(false)
    setSelectedExams([])
    refreshExams()
  }

  const [stoppingexams, setStoppingexams] = useState(false)
  const destroyExams = async () => {
    setStoppingexams(true)
    for (const exam of selectedExams) {
      exam[E_DELETE_RG_RESP] = await delete_resource_group(exam[E_ID])
      exam[E_STATUS] = E_STATUS_VALUES.DESTROYING

      try {
        //disable access to doc
        console.log(exam[E_CREATE_DOC_RESP]["body"]["name"])
        if (exam[E_CREATE_DOC_RESP]["body"]["name"]) {
          await remove_access_to_doc(exam[E_CREATE_DOC_RESP]["body"]["name"])
        }
      } catch (e) {
        console.error("Error in destroyExams for doc")
        console.error(e)
      }

      await db_update_exam_v2(exam, "stopping exam")
    }
    setStoppingexams(false)
    setSelectedExams([])
    refreshExams()
  }

  const [turningOff, setTurningOff] = useState(false)
  const [turningOn, setTurningOn] = useState(false)

  const turnOnVMs = async () => {
    try {
      setTurningOn(true)
      for (const exam of selectedExams) {
        await turn_on_virtual_machine(exam[E_ID])
      }
    } finally {
      setTurningOn(false)
    }
    refreshExams()
  }

  const turnOffVMs = async () => {
    try {
      setTurningOff(true)
      for (const exam of selectedExams) {
        await turn_off_virtual_machine(exam[E_ID])
      }
    } finally {
      setTurningOff(false)
    }
    refreshExams()
  }

  useEffect(() => {
    refreshExams()
  }, [])

  const [dialogConfirmationEmailOpen, setDialogConfirmationEmailOpen] = useState(false)
  const [dialogConfirmationDestroyOpen, setDialogConfirmationDestroyOpen] = useState(false)

  return (
    <AppLayout
      content={
        <>
          <CurrentExamsTable
            exams={exams}
            selectedExams={selectedExams}
            onSelectionChange={event => setSelectedExams(event.detail.selectedItems)}
            refreshing={refreshing}
            onRefresh={refreshExams}
            sendingloginemail={sendingloginemail}
            onSendEmail={() => setDialogConfirmationEmailOpen(true)}
            stoppingexams={stoppingexams}
            onDestroyExams={() => setDialogConfirmationDestroyOpen(true)}
            onTurnOff={turnOffVMs}
            onTurnOn={turnOnVMs}
            turningOff={turningOff}
            turningOn={turningOn}
          />
          <DialogConfirmationEmail selectedExams={selectedExams} onClose={() => setDialogConfirmationEmailOpen(false)} onConfirm={() => { sendEmail(); setDialogConfirmationEmailOpen(false) }} visible={dialogConfirmationEmailOpen} />
          <DialogConfirmationDestroy selectedExams={selectedExams} onClose={() => setDialogConfirmationDestroyOpen(false)} onConfirm={() => { destroyExams(); setDialogConfirmationDestroyOpen(false) }} visible={dialogConfirmationDestroyOpen} />
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
          <div>Wait for all the created environments to have status "Running". This step might take up to <b>5 minutes</b>, click the "Refresh" button to check for updates.</div>
        </li>
        <li>
          <h5>Start the exam</h5>
          <div>Select all the exams that have to start and click on "Send Email". An email will be sent to each partecipant with instruction on how to login.</div>
        </li>
        <li>
          <h5>End the exam</h5>
          <div>At the end of the exam, connect as Admin, copy the exam artifacts to the cloud, select the exams you want to terminate and click on "Destroy VM". All the resources created for the student not manually backend up will be destroyed.</div>
        </li>
        <li>
          <h5>Check resource groups are terminated</h5>
          <div>Make sure after max 5 minutes all the exams have status "Destroyed". Navigate to "Resource groups" on the azure console and make sure that there are no running resources.<b>Missing to do this steps might cause unwanted expenses on the cloud.</b></div>
        </li>
      </ul>
    </div>
  </HelpPanel>
);

export default CurrentExamsPage