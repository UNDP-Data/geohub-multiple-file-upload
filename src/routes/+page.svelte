
<script lang="ts">
    import {enhance} from '$app/forms';
    import Dropzone from "svelte-file-dropzone/Dropzone.svelte";
    import {goto} from "$app/navigation";
    import {BlockBlobClient} from "@azure/storage-blob";
    import JSZip from "jszip";


    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let uploadingFile: { success: boolean; blobUrl: string; };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let blobUrl = '';
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let selectedFiles: File[] = [];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let zipFileBlob: Blob = new Blob();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let zipFile: File;

    let uploadedLength = 0;
    $: progress = zipFile ? (uploadedLength / zipFile?.size) * 100 : 0;

    const onProgress = (e) => {
        uploadedLength = e.loadedBytes;
    };


    const handleFilesSelect = (e: CustomEvent) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { acceptedFiles, fileRejections } = e.detail;
        // create a zip file using the jszip library
        selectedFiles = acceptedFiles;
        const zip = new JSZip();
        selectedFiles.forEach((file) => {
            zip.file(file.name, file);
        });
        zip.generateAsync({ type: 'blob' }).then((content) => {
            zipFileBlob = content;
        });
        // save the zip file to the hidden input
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const input = document.querySelector('input[name="SelectedFiles"]');
        // create a new File object to add to the input from the zip file
        // const zipFileAsFile = new File([zipFile], 'zipFile.zip', { type: 'application/zip' });
        const currentDate = new Date().getMilliseconds()
        zipFile = new File([zipFileBlob], `zipFile-${currentDate}.zip`, { type: 'application/zip' });
        console.log(zipFile)
        // add the zip file to the input
        if (input) {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(zipFile);
            input.files = dataTransfer.files;
        }
    };

    const uploadFile = async (sasUrl: string) => {

        console.log(sasUrl);
        // if (!selectedFiles || selectedFiles.length === 0) {
        //     return;
        // }
        const blockBlobClient = new BlockBlobClient(sasUrl);
        const promises = [];
        promises.push(blockBlobClient.uploadData(zipFileBlob, {
            blobHTTPHeaders: {
                blobContentType: 'application/zip'
            },
            onProgress: onProgress
        }));
        await Promise.all(promises);
        //
        // const blobUrl = await completeUploading();
        //
        // setTimeout(() => {
        //     goto('/data#mydata', {
        //         replaceState: true
        //     });
        // }, 1000);
        //
        //
        return {
            success: true,
            blobUrl: blobUrl
        };
    };
</script>

<section class="section">

    <div class="container">
        <div class="columns is-centered">

            <div class="column is-half">
                <h1 class="title">File Uploading Test</h1>
                <Dropzone multiple={true} on:drop={handleFilesSelect} />
                <form
                    method="POST"
                    action="?/getBlobSasUrl"
                    use:enhance={() => {
                    return async ({ result, update }) => {
                        await update();
                        const sasUrl = result.data.sasUrl;
                        blobUrl = result.data.blobUrl;
                        uploadingFile = await uploadFile(sasUrl)};}}>
<!--                    <div class="field">-->
<!--                        <div class="control">-->
<!--                            <input name="SelectedFiles" class="input" type="hidden">-->
<!--                        </div>-->
<!--                    </div>-->
                    <div class="field">
                        <div class="control">
                            <input name="SelectedFiles" class="input" type="file">
                        </div>
                    </div>
                    <div class="field">
                        <div class="control">
                            <input name="Submit" class="input" type="submit" placeholder="Submit">
                        </div>
                    </div>
                </form>
                {#await uploadingFile}
                    <progress class="progress is-success" value={progress} max="100">{progress}%</progress>
                {/await}
            </div>
        </div>
    </div>
</section>