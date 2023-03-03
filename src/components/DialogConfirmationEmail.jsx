import * as React from "react";
import Modal from "@cloudscape-design/components/modal";
import Box from "@cloudscape-design/components/box";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";
import { E_STATUS_VALUES } from "../utils/constants";
import { Alert, TextContent } from "@cloudscape-design/components";

export default ({ onConfirm, onClose, visible, selectedExams }) => (
  <Modal
    onDismiss={onClose}
    visible={visible}
    closeAriaLabel="Close modal"
    footer={
      <Box float="right">
        <SpaceBetween direction="horizontal" size="xs">
          <Button variant="link" onClick={onClose}>No, cancel</Button>
          <Button variant="primary" onClick={onConfirm}>Yes, send the emails</Button>
        </SpaceBetween>
      </Box>
    }
    header="Send the emails to the students?"
  >
    <SpaceBetween direction="vertical" size="xs">
      {
        selectedExams.some(({ status }) => status != E_STATUS_VALUES.RUNNING) &&
        <Alert
          statusIconAriaLabel="alert"
          header="Not all the selected VMs are running"
        >
          Some of the selected VMs seems not to be in a RUNNING state.
        </Alert>
      }
      <TextContent>
        <h5>You selected the following students:</h5>
        <ul>
          {selectedExams.map(({ email }) => <li>{email}</li>)}
        </ul>
      </TextContent>
    </SpaceBetween>
  </Modal>
)