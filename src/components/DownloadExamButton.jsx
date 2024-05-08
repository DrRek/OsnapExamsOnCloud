import React, { useState } from 'react'
import { Button } from '@cloudscape-design/components';
import { BlobServiceClient } from '@azure/storage-blob'
import { create_storage_container_download_sas } from '../utils/api'
import JSZip from 'jszip';
import FileSaver from 'file-saver';

const account_name = "osnapdbexamsonthecloud"

const DownloadExamButton = ({ exams }) => {

  const [loading, setLoading] = useState(false)

  const onDownloadDesktopClick = async () => {
    setLoading(true)
    try {
      const containerName = exams[0]["storage_container_name"]
      const sasResponse = await create_storage_container_download_sas(containerName);
      const sas = sasResponse["serviceSasToken"];

      const blobServiceClient = new BlobServiceClient(`https://${account_name}.blob.core.windows.net?${sas}`);
      const containerClient = blobServiceClient.getContainerClient(containerName);

      const blobNames = [];
      for await (const blob of containerClient.listBlobsFlat()) {
        blobNames.push(blob.name);
      }

      const zip = new JSZip();
      const promises = [];
      for (const blobName of blobNames) {
        const blobClient = containerClient.getBlobClient(blobName);
        const downloadBlockBlobResponse = await blobClient.download();
        const blobContent = await downloadBlockBlobResponse.blobBody;
        const fileReader = new FileReader();
        const promise = new Promise((resolve, reject) => {
          fileReader.onloadend = (ev) => {
            const arrayBuffer = ev.target.result;
            zip.file(blobName, arrayBuffer);
            resolve();
          };
          fileReader.onerror = reject;
          fileReader.readAsArrayBuffer(blobContent);
        });
        promises.push(promise);
      }

      await Promise.all(promises);
      const zipBlob = await zip.generateAsync({ type: "blob" });
      FileSaver.saveAs(zipBlob, exams[0]["id"]+".zip");
    } finally {
      setLoading(false)
    }
  }

  return <Button disabled={!exams || exams.length != 1} loading={loading} onClick={onDownloadDesktopClick}>Download Desktop</Button>

}
export default DownloadExamButton;