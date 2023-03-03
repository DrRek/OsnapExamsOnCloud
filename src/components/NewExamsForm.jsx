import React, { useState } from 'react';
import {
  Container,
  Header,
  Input,
  FormField,
  SpaceBetween,
  Textarea,
  Button,
  Form,
  Modal,
  Spinner
} from '@cloudscape-design/components';
import { 
  db_is_prefix_unique_v2,
  db_update_exam_v2,
  create_resource_groups,
  create_virtual_network,
  create_public_ip_address,
  create_network_security_group,
  create_network_interface,
  create_network_interface_2,
  create_virtual_machine,
  create_user_in_vm,
  create_subnet,
  wait_for_ip_address,
  create_docx_document,
  change_studente_password
} from '../utils/api';
import pwlib from '../utils/pwlib'
import { APP_PREFIX, E_CREATE_DOC_RESP, E_EMAIL, E_LOGS, E_STATUS, E_STATUS_VALUES } from '../utils/constants'
import { useHistory } from 'react-router-dom';
import { internal_navigate } from '../utils/navigation';

export default function ExamsPanel({ exam, onChange }) {
  return (
    <Container
      id="exams-panel"
      header={<Header variant="h2">Distribution settings</Header>}
    >
      <SpaceBetween size="l">
        <FormField
          label="Exam prefix"
          description="Enter the prefix that will be used to identify this exam."
          errorText={exam.prefix.error}
          i18nStrings={{ errorIconAriaLabel: 'Error' }}
        >
          <Input
            value={exam.prefix.value}
            ariaRequired={true}
            placeholder="27-01-2023-exam1"
            onChange={({ detail: { value } }) => onChange('prefix', value)}
          />
        </FormField>
        <FormField
          label="Students email"
          description="Specify valid email addresses where the students will receive info to join the exam, put each on a new line."
          errorText={exam.raw_students.error}
          i18nStrings={{ errorIconAriaLabel: 'Error' }}
        >
          <Textarea
            placeholder={'student1@outlook.com\nstudent2@gmail.com'}
            value={exam.raw_students.value}
            onChange={({ detail: { value } }) => onChange('raw_students', value)}
          />
        </FormField>
      </SpaceBetween>
    </Container>
  );
}

const ExamLoadingModal = ({text}) =>
  <Modal
    onDismiss={() => alert("this operation cannot be cancelled")}
    visible={text}
    closeAriaLabel="Close modal"
    header="Exams environment creation"
  >
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column"
    }}>
      <div>Resource creation might take some minutes. Please wait without closing the page.</div>
      <Spinner size="large"/>
      <div>{text}</div>
    </div>
  </Modal>

export function NewExamsHeader() {
  return (
    <Header
      variant="h1"
      description="When you create new exams, resources (including VMs) are created. You can later start sending the start email to students and granting them access."
    >
      Create exams
    </Header>
  );
}

function BaseFormContent({ content, onCancel, onCreate }) {
  return (
    <form onSubmit={event => event.preventDefault()}>
      <Form
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="primary" onClick={onCreate}>Create exams</Button>
          </SpaceBetween>
        }
        errorText={""}
        errorIconAriaLabel="Error"
      >
        {content}
      </Form>
    </form>
  );
}

export function NewExamsForm({ loadHelpPanelContent }) {
  const [raw_exam, setExam] = useState({
    prefix: {
      value: "",
      error: ""
    },
    raw_students: {
      value: "",
      error: ""
    }
  })

  const updateExam = (key, value) => {
    setExam({
      ...raw_exam,
      [key]: {
        error: "",
        value: value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      }
    })
  }

  const [ loadingText, setLoadingText ] = useState(false)
  const com = (msg) => {
    setLoadingText(msg)
    console.log(msg)
  }

  const history = useHistory()
  const go_home = () => internal_navigate("/", history)

  const createExam = async () => {
    if(await isExamValid()){

      com("creating exams")
      com(`using prefix: ${raw_exam.prefix.value}`)
      const students_email = raw_exam.raw_students.value.split("\n").map(i=>i.trim()).filter(i => i!=="")
      com(`using student email: ${students_email}`)

      for (const student_email of students_email) {
        const exam = {
          [E_LOGS]: [],
          email: student_email,
          [E_STATUS]: E_STATUS_VALUES.CREATING
        }
        com(`creating resources for ${exam[E_EMAIL]}`)

        exam["name"] = student_email.split("@")[0].replace(/[^A-Za-z0-9]/g, "")
        com(`using sanified name: ${exam["name"]}`)

        exam["id"] = `${APP_PREFIX}${raw_exam.prefix.value}-${exam["name"]}-${Math.floor(Math.random() * 1000)}`
        com(`using id name: ${exam["id"]}`)

        await db_update_exam_v2(exam, "started exam creation")

        com(`creating resource group for ${exam["name"]}`)
        await create_resource_groups(exam["id"])
        await db_update_exam_v2(exam, "created resource group")

        com(`creating virtual network for ${exam["name"]}`)
        await create_virtual_network(exam["id"])
        await db_update_exam_v2(exam, "created virtual network")

        com(`creating subnet for ${exam["name"]}`)
        exam["subnet"] = await create_subnet(exam["id"])
        await db_update_exam_v2(exam, "created subnet")

        com(`creating public IP for ${exam["name"]}`)
        await create_public_ip_address(exam["id"])
        await db_update_exam_v2(exam, "created public ip address")

        com(`waiting for public IP for ${exam["name"]}`)
        exam["ipaddr"] = await wait_for_ip_address(exam["id"])
        await db_update_exam_v2(exam, `obtained public ip address ${exam["ipaddr"].properties.ipAddress}`)
        
        com(`creating security group for ${exam["name"]}`)
        exam["netsecgrp"] = await create_network_security_group(exam["id"])
        await db_update_exam_v2(exam, "created security group")
        
        com(`creating network interface for ${exam["name"]}`)
        exam["netint"] = await create_network_interface(exam["id"], exam["netsecgrp"].id, exam["subnet"].id, exam["ipaddr"].id)
        await db_update_exam_v2(exam, "created network interface")

        //com(`creating #2 network interface for ${exam["name"]}`)
        //exam["netint2"] = await create_network_interface_2(exam["id"]+"2", exam["subnet"].id, exam["id"])
        //await db_update_exam_v2(exam, "created #2 network interface")
        
        com(`creating virtual machine for ${exam["name"]}`)
        exam["adminUsername"] = "osnap"
        exam["adminPassword"] = "7QRGeViKKCxWq5g"
        await db_update_exam_v2(exam, "choosen username/password combination for admin")
        await create_virtual_machine(exam["id"], exam["netint"].id)
        await db_update_exam_v2(exam, "created virtual machine")

        com(`changing password of low-privilege user for ${exam["name"]}`)
        exam["userUsername"] = "studente"
        exam["userPassword"] = pwlib.generate_user_password()
        await db_update_exam_v2(exam, "choosen password combination for low-priv user")
        exam["createUser"] = await change_studente_password(exam["id"], exam["userPassword"])
        await db_update_exam_v2(exam, "sent command to create low-priv user")

        //CLOUDFILE
        //com(`creating exam report document for ${exam["name"]}`)
        //exam[E_CREATE_DOC_RESP] = await create_docx_document(exam["name"])
        //await db_update_exam_v2(exam, "created document that will store the exam report")

        com(`done creating resources for ${exam["name"]}`)
      
        setLoadingText(false)
      }
      go_home()
    }
  }

  const isExamValid = async () => {
    const prefixError = 
      !/[a-zA-Z0-9-]+/.test(raw_exam.prefix.value) ?
        "You must specify a string to use as prefix, only use - as special character." :
        !(await db_is_prefix_unique_v2(raw_exam.prefix.value)) && 
          "Prefixes should be unique, another exam with this prefix already exists"
    const emailError = raw_exam.raw_students.value.split("\n").map(i => i.trim()).filter(i => i !== "").some(i => !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(i)) && "You must specify one valid email for each line."

    if(prefixError || emailError){
      setExam({
        ...raw_exam,
        prefix: {
          ...raw_exam.prefix,
          error: prefixError
        },
        raw_students: {
          ...raw_exam.raw_students,
          error: emailError
        },
      })
    }

    return !(prefixError || emailError)
  }

  return (
    <>
      <BaseFormContent
        onCreate={()=>createExam()}
        onCancel={go_home}
        content={
          <SpaceBetween size="l">
            <ExamsPanel exam={raw_exam} onChange={updateExam} />
          </SpaceBetween>
        }
      />
      <ExamLoadingModal text={loadingText}/>
    </>
  );
}