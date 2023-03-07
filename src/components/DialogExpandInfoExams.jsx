import * as React from "react";
import Modal from "@cloudscape-design/components/modal";
import Box from "@cloudscape-design/components/box";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";
import { TextContent } from "@cloudscape-design/components";

export default ({ onClose, visible, exams }) => (
  <Modal
    onDismiss={onClose}
    visible={visible}
    closeAriaLabel="Close modal"
    footer={
      <Box float="right">
        <SpaceBetween direction="horizontal" size="xs">
          <Button variant="primary" onClick={onClose}>Close</Button>
        </SpaceBetween>
      </Box>
    }
    header="Information about exams"
  >
    <SpaceBetween direction="vertical" size="xs">
      <TextContent>
        <h5>Exams:</h5>
        {exams.map(exam => 
          <pre key={exam.id}>
            {JSON.stringify(exam, null, 4)}
          </pre>  
        )}
      </TextContent>
    </SpaceBetween>
  </Modal>
)