import React, { useState, useEffect } from 'react';
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
  db_is_prefix_unique,
  db_update_exam,
  create_resource_groups,
  create_virtual_network,
  create_public_ip_address,
  create_network_security_group,
  create_network_interface,
  create_virtual_machine,
  create_user_in_vm,
  create_subnet,
  wait_for_ip_address
} from '../utils/api';
import pwlib from '../utils/pwlib'

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
      description="When you create new exams, resources (including VMs and exam report document) are created. You can later start sending the start email to students and granting them access."
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
        value
      }
    })
  }

  const [ loadingText, setLoadingText ] = useState(false)
  const com = (msg) => {
    setLoadingText(msg)
    console.log(msg)
  }

  const createExam = async () => {
    if(await isExamValid()){

      com("creating exams")
      com(`using prefix: ${raw_exam.prefix.value}`)
      const students_email = raw_exam.raw_students.value.split("\n").map(i=>i.trim())
      com(`using student email: ${students_email}`)

      students_email.forEach(async student_email => {

        const exam = {
          id: raw_exam.prefix.value,
          students: raw_exam.raw_students.value.split("\n").map(i=>i.trim()),
          status: []
        }

        exam["email"] = student_email
        com(`creating resources for ${exam["email"]}`)

        exam["name"] = student_email.split("@")[0].replace(/[^A-Za-z0-9]/g, "")
        com(`using sanified name: ${exam["name"]}`)

        exam["id"] = `${raw_exam.prefix.value}-${exam["name"]}-${Math.floor(Math.random() * 1000)}`
        com(`using id name: ${exam["id"]}`)

        await db_update_exam(exam, "started exam creation")

        com(`creating resource group for ${exam["name"]}`)
        await create_resource_groups(exam["id"])
        await db_update_exam(exam, "created resource group")

        com(`creating virtual network for ${exam["name"]}`)
        await create_virtual_network(exam["id"])
        await db_update_exam(exam, "created virtual network")

        com(`creating subnet for ${exam["name"]}`)
        exam["subnet"] = await create_subnet(exam["id"])
        await db_update_exam(exam, "created subnet")

        com(`creating public IP for ${exam["name"]}`)
        await create_public_ip_address(exam["id"])
        await db_update_exam(exam, "created public ip address")

        com(`waiting for public IP for ${exam["name"]}`)
        exam["ipaddr"] = await wait_for_ip_address(exam["id"])
        await db_update_exam(exam, `obtained public ip address ${exam["ipaddr"].properties.ipAddress}`)
        
        com(`creating security group for ${exam["name"]}`)
        exam["netsecgrp"] = await create_network_security_group(exam["id"])
        await db_update_exam(exam, "created security group")
        
        com(`creating network interface for ${exam["name"]}`)
        exam["netint"] = await create_network_interface(exam["id"], exam["netsecgrp"].id, exam["subnet"].id, exam["ipaddr"].id)
        await db_update_exam(exam, "created network interface")
        
        com(`creating virtual machine for ${exam["name"]}`)
        exam["adminUsername"] = pwlib.generate_admin_username()
        exam["adminPassword"] = pwlib.generate_admin_password()
        await db_update_exam(exam, "choosen username/password combination for admin")
        await create_virtual_machine(exam["id"], exam["adminUsername"], exam["adminPassword"], exam["netint"].id)
        await db_update_exam(exam, "created virtual machine")

        com(`creating low-privilege user for ${exam["name"]}`)
        exam["userUsername"] = pwlib.generate_user_username(exam["name"])
        exam["userPassword"] = pwlib.generate_user_password()
        await db_update_exam(exam, "choosen username/password combination for low-priv user")
        exam["createUser"] = await create_user_in_vm(exam["id"], exam["userUsername"], exam["userPassword"])
        await db_update_exam(exam, "sent command to create low-priv user")

        com(`done creating resources for ${exam["name"]}`)
        setLoadingText(false)
      })
      
    }
  }

  const isExamValid = async () => {
    const prefixError = 
      !/[a-zA-Z0-9-]+/.test(raw_exam.prefix.value) ?
        "You must specify a string to use as prefix, only use - as special character." :
        !(await db_is_prefix_unique(raw_exam.prefix.value)) && 
          "Prefixes should be unique, another exam with this prefix already exists"
    const emailError = raw_exam.raw_students.value.split("\n").map(i => i.trim()).some(i => !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(i)) && "You must specify one valid email for each line."

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
        onCancel={()=>{}}
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