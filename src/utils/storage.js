import { BlobServiceClient } from '@azure/storage-blob'
import { create_storage_container_download_sas } from '../utils/api'
import JSZip from 'jszip'
import FileSaver from 'file-saver'

const account_name = 'osnapdbexamsonthecloud'

const PATH_FILTER = 'prova pratica'

const downloadExamDesktop = async (
  id,
  containerName,
  path_filter = PATH_FILTER
) => {
  const sasResponse = await create_storage_container_download_sas(containerName)
  const sas = sasResponse['serviceSasToken']

  const blobServiceClient = new BlobServiceClient(
    `https://${account_name}.blob.core.windows.net?${sas}`
  )
  const containerClient = blobServiceClient.getContainerClient(containerName)

  const blobNames = []
  for await (const blob of containerClient.listBlobsFlat()) {
    if (blob.name.toLowerCase().includes(path_filter.toLocaleLowerCase()) && !blob.name.endsWith("desktop.ini")) {
      blobNames.push(blob.name)
    }
  }

  if (blobNames.length === 0) {
    throw new Error(
      'No files to dowload, has the student placed the material in a path containing the case-unsensitive word "' +
        path_filter +
        '"?'
    )
  }

  const zip = new JSZip()
  const promises = []
  for (const blobName of blobNames) {
    const blobClient = containerClient.getBlobClient(blobName)
    const downloadBlockBlobResponse = await blobClient.download()
    const blobContent = await downloadBlockBlobResponse.blobBody
    const fileReader = new FileReader()
    const promise = new Promise((resolve, reject) => {
      fileReader.onloadend = (ev) => {
        const arrayBuffer = ev.target.result
        zip.file(blobName, arrayBuffer)
        resolve()
      }
      fileReader.onerror = reject
      fileReader.readAsArrayBuffer(blobContent)
    })
    promises.push(promise)
  }

  await Promise.all(promises)
  const zipBlob = await zip.generateAsync({ type: 'blob' })
  FileSaver.saveAs(zipBlob, id + '.zip')
}

export { downloadExamDesktop }
