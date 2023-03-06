import * as React from "react";
import Modal from "@cloudscape-design/components/modal";
import Box from "@cloudscape-design/components/box";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";
import { TextContent } from "@cloudscape-design/components";

export default ({ onConfirm, onClose, visible, selectedExams }) => (
  <Modal
    onDismiss={onClose}
    visible={visible}
    closeAriaLabel="Close modal"
    footer={
      <Box float="right">
        <SpaceBetween direction="horizontal" size="xs">
          <Button variant="link" onClick={onClose}>No, cancel</Button>
          <Button variant="primary" onClick={onConfirm}>Yes, destroy selected VMs</Button>
        </SpaceBetween>
      </Box>
    }
    header="Are you sure you want to permanently delete the selected VMs from the history? There is no valid reason to do it."
  >
    <SpaceBetween direction="vertical" size="xs">
      <TextContent>
        <h5>You selected the following students:</h5>
        <ul>
          {selectedExams.map(({ email }) => <li key={email}>{email}</li>)}
        </ul>
      </TextContent>
    </SpaceBetween>
  </Modal>
)