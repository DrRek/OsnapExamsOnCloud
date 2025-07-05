import React, { useEffect, useState } from 'react'
import {
  AppLayout,
  BreadcrumbGroup,
  Flashbar,
  HelpPanel,
} from '@cloudscape-design/components'
import ServiceNavigation from './ServiceNavigation.jsx'
import { appLayoutLabels } from '../tables/labels'
import AllExamsTable from './AllExamsTable.jsx'
import { db_delete_exam_v2, db_list_exams_v2 } from '../utils/api.js'
import DialogConfirmationDeleteFromDB from './DialogConfirmationDeleteFromDB.jsx'
import DialogExpandInfoExams from './DialogExpandInfoExams.jsx'
import { downloadExamDesktop } from '../utils/storage.js'

const AllExamsPage = () => {
  const [notifications, setNotifications] = useState({})

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

  const [
    dialogConfirmationDeleteFromDBOpen,
    setDialogConfirmationDeleteFromDBOpen,
  ] = useState(false)
  const [dialogExandInfoExams, setDialogExandInfoExams] = useState(false)

  const [deletingExams, setDeletingExams] = useState(false)
  const deleteExamsFromDB = async () => {
    setDeletingExams(true)
    try {
      for (const exam of selectedExams) await db_delete_exam_v2(exam)
    } finally {
      setDeletingExams(false)
    }
    refreshExams()
  }

  const advancedSetNotification = (notification, forceAdd = false) => {
    setNotifications((prev) => {
      if (forceAdd || prev[notification.id]) {
        return {
          ...prev,
          [notification.id]: {
            ...(prev[notification.id] || {}),
            ...notification,
          },
        }
      } else {
        return prev
      }
    })
  }

  const downloadDesktop = async () => {
    if (!selectedExams || selectedExams.length === 0) {
      console.error('No exams selected for download')
      return
    }

    const key = Math.floor(Math.random() * 10000) // Random key for frontend

    // Show initial notification
    advancedSetNotification({
      header: `Download ${selectedExams.length} exam${selectedExams.length > 1 ? 's' : ''} resources`,
      type: 'info',
      content: 'Ongoing download from Azure backup repository',
      dismissible: true,
      dismissLabel: 'Dismiss message',
      onDismiss: () => setNotifications((prev) => ({ ...prev, [key]: null })),
      id: key,
    }, true)

    try {
      const downloadPromises = selectedExams.map(async (exam) => {
        const id = exam['id']
        const containerName = exam['storage_container_name']

        try {
          await downloadExamDesktop(id, containerName)
          return { success: true, examId: id }
        } catch (error) {
          return { success: false, examId: id, error: error.message }
        }
      })

      const results = await Promise.allSettled(downloadPromises)

      // Process results
      const successful = results.filter(result =>
        result.status === 'fulfilled' && result.value.success
      )
      const failed = results.filter(result =>
        result.status === 'rejected' ||
        (result.status === 'fulfilled' && !result.value.success)
      )

      if (failed.length === 0) {
        // All downloads successful
        advancedSetNotification({
          type: 'success',
          content: `All ${selectedExams.length} exam resources downloaded successfully`,
          id: key,
        })
      } else if (successful.length === 0) {
        // All downloads failed
        const errorMessages = failed.map(result => {
          const error = result.status === 'rejected' ? result.reason : result.value.error
          return error
        })

        advancedSetNotification({
          type: 'error',
          content: `Failed to download exam resources: ${errorMessages.join(', ')}`,
          id: key,
        }, true)

        // Throw the first error for consistency with original behavior
        throw new Error(errorMessages[0])
      } else {
        // Partial success
        advancedSetNotification({
          type: 'warning',
          content: `Downloaded ${successful.length} of ${selectedExams.length} exams. Errors: ${failed.map(result => `${result?.value?.examId}`).join(' - ')}`,
          id: key,
        })
      }

    } catch (error) {
      // Handle any unexpected errors
      advancedSetNotification({
        type: 'error',
        content: 'Unknown Error: ' + error,
        id: key,
      }, true)
      throw error
    }
  }

  return (
    <AppLayout
      content={
        <>
          <AllExamsTable
            exams={exams}
            selectedExams={selectedExams}
            onSelectionChange={(event) =>
              setSelectedExams(event.detail.selectedItems)
            }
            refreshing={refreshing}
            onRefresh={refreshExams}
            onShowDetails={() => setDialogExandInfoExams(true)}
            onDeleteExamsFromDB={() =>
              setDialogConfirmationDeleteFromDBOpen(true)
            }
            deletingExamsFromDB={
              dialogConfirmationDeleteFromDBOpen || deletingExams
            }
            downloadDesktop={downloadDesktop}
          />
          <DialogConfirmationDeleteFromDB
            selectedExams={selectedExams}
            onClose={() => setDialogConfirmationDeleteFromDBOpen(false)}
            onConfirm={() => {
              deleteExamsFromDB()
              setDialogConfirmationDeleteFromDBOpen(false)
            }}
            visible={dialogConfirmationDeleteFromDBOpen}
          />
          <DialogExpandInfoExams
            exams={selectedExams}
            onClose={() => setDialogExandInfoExams(false)}
            visible={dialogExandInfoExams}
          />
        </>
      }
      headerSelector="#header"
      breadcrumbs={
        <BreadcrumbGroup
          items={[{ text: 'ExamsOnTheCloud', href: '/' }]}
          expandAriaLabel="Show path"
          ariaLabel="Breadcrumbs"
        />
      }
      notifications={
        <Flashbar
          items={Object.keys(notifications)
            .filter((key) => notifications[key])
            .map((key) => notifications[key])}
        />
      }
      navigation={<ServiceNavigation />}
      //navigationOpen={false}
      ariaLabels={appLayoutLabels}
      contentType="table"
      tools={HelpOnSide}
    />
  )
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
      <p>
        In this page it is possible to see all the past and previous exams.
        Mainly used for log and debug purpose.
      </p>
    </div>
  </HelpPanel>
)

export default AllExamsPage
